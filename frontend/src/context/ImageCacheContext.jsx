import React, { createContext, useContext, useState, useEffect } from 'react';
import { isImageCached, cacheImage } from '../utils/imageUtils';
import { registerServiceWorker, cacheImages as swCacheImages, isImageInServiceWorkerCache } from '../utils/serviceWorkerUtils';

// Create context
const ImageCacheContext = createContext({
  cachedImages: new Set(),
  addToCache: () => {},
  isCached: () => false,
  preloadImages: () => {}
});

export const useImageCache = () => useContext(ImageCacheContext);

export const ImageCacheProvider = ({ children }) => {
  const [cachedImages, setCachedImages] = useState(new Set());
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  
  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker().then(registration => {
      if (registration) {
        setServiceWorkerReady(true);
      }
    });
  }, []);
  
  // Initialize from localStorage on mount
  useEffect(() => {
    const loadCachedImageList = () => {
      try {
        const storedCache = localStorage.getItem('imageCacheRegistry');
        if (storedCache) {
          setCachedImages(new Set(JSON.parse(storedCache)));
        }
      } catch (error) {
        console.error('Failed to load image cache from localStorage:', error);
      }
    };
    
    loadCachedImageList();
    
    // Set up a listener for storage events (for multi-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === 'imageCacheRegistry') {
        loadCachedImageList();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Save to localStorage whenever the cache updates
  useEffect(() => {
    try {
      localStorage.setItem('imageCacheRegistry', JSON.stringify([...cachedImages]));
    } catch (error) {
      console.error('Failed to save image cache to localStorage:', error);
    }
  }, [cachedImages]);

  /**
   * Adds an image URL to the cache registry and browser cache
   * @param {string} url - Image URL to cache
   */
  const addToCache = async (url) => {
    if (!url || cachedImages.has(url)) return;
    
    try {
      // First check if it's already in the browser cache
      const alreadyCached = await isImageCached(url);
      
      // If not in browser cache, add it
      if (!alreadyCached) {
        await cacheImage(url);
      }
      
      // Also add to service worker cache if available
      if (serviceWorkerReady) {
        await swCacheImages([url]);
      }
      
      // Update our registry
      setCachedImages(prevCache => {
        const newCache = new Set(prevCache);
        newCache.add(url);
        return newCache;
      });
    } catch (error) {
      console.error(`Failed to cache image: ${url}`, error);
    }
  };
  
  /**
   * Checks if an image URL is in our cache registry
   * @param {string} url - Image URL to check
   * @returns {boolean} - Whether the image is cached
   */
  const isCached = (url) => {
    return cachedImages.has(url);
  };
  
  /**
   * Preloads an array of images into the cache
   * @param {string[]} urls - Array of image URLs to preload
   */
  const preloadImages = async (urls) => {
    if (!urls || !urls.length) return;
    
    // Filter out already cached images
    const urlsToCache = urls.filter(url => !cachedImages.has(url));
    
    // Preload in parallel with a limit of 5 concurrent requests
    const concurrencyLimit = 5;
    for (let i = 0; i < urlsToCache.length; i += concurrencyLimit) {
      const batch = urlsToCache.slice(i, i + concurrencyLimit);
      await Promise.allSettled(batch.map(url => addToCache(url)));
    }
  };
  
  const value = {
    cachedImages,
    addToCache,
    isCached,
    preloadImages
  };
  
  return (
    <ImageCacheContext.Provider value={value}>
      {children}
    </ImageCacheContext.Provider>
  );
};

export default ImageCacheContext;
