// Service Worker registration and utilities

/**
 * Register the service worker for image caching
 * @returns {Promise<ServiceWorkerRegistration|null>} A promise that resolves with the registration or null if not supported
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        return registration;
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
        return null;
      });
  }
  return Promise.resolve(null);
}

/**
 * Send images to the service worker for pre-caching
 * @param {string[]} imageUrls Array of image URLs to cache
 * @returns {Promise<boolean>} A promise that resolves to true if successful
 */
export function cacheImages(imageUrls) {
  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return Promise.resolve(false);
  }

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // Send message to service worker to cache these images
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_IMAGES',
      images: imageUrls
    });
    return Promise.resolve(true);
  }
  
  return Promise.resolve(false);
}

/**
 * Clear the image cache
 * @returns {Promise<boolean>} A promise that resolves to true if successful
 */
export function clearImageCache() {
  if ('caches' in window) {
    return caches.delete('origin-by-the-sea-images-v1')
      .then(() => true)
      .catch(error => {
        console.error('Failed to clear image cache:', error);
        return false;
      });
  }
  return Promise.resolve(false);
}

/**
 * Check if an image is in the service worker cache
 * @param {string} imageUrl The URL of the image to check
 * @returns {Promise<boolean>} A promise that resolves to true if the image is cached
 */
export async function isImageInServiceWorkerCache(imageUrl) {
  if ('caches' in window) {
    try {
      const cache = await caches.open('origin-by-the-sea-images-v1');
      const response = await cache.match(imageUrl);
      return !!response;
    } catch (error) {
      console.error('Error checking service worker cache:', error);
      return false;
    }
  }
  return false;
}

/**
 * Get the size of the image cache in bytes
 * @returns {Promise<number>} A promise that resolves to the size in bytes
 */
export async function getImageCacheSize() {
  if (!('caches' in window) || !('estimate' in navigator.storage)) {
    return Promise.resolve(0);
  }
  
  try {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  } catch (error) {
    console.error('Error estimating cache size:', error);
    return 0;
  }
}
