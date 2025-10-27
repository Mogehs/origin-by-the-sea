import { useState, useEffect, useRef } from 'react';
import styles from './OptimizedImage.module.css';
import {
  optimizeImage,
  createTinyPlaceholder,
  isImageCached,
} from '../../utils/imageUtils';
import { useImageCache } from '../../context/ImageCacheContext';

const OptimizedImage = ({
  src,
  alt,
  className,
  placeholderSrc,
  width,
  height,
  onLoad,
  onError,
  lazy = true,
  blur = true,
  objectFit = 'cover',
  priority = false,
  quality = 'medium', // 'low', 'medium', 'high'
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(placeholderSrc || '');
  const [hasError, setHasError] = useState(false);
  const [optimizedImageSrc, setOptimizedImageSrc] = useState('');
  const imgRef = useRef(null);
  const placeholderImage = '/images/placeholder.jpg';
  const { isCached, addToCache } = useImageCache();
  // Determine actual src based on quality
  const getOptimizedSrc = async (originalSrc) => {
    if (!originalSrc) return placeholderImage;

    // If the image is already a base64 string or from Firebase Storage, return as is
    if (
      originalSrc.startsWith('data:') ||
      originalSrc.startsWith('blob:') ||
      originalSrc.includes('firebasestorage.googleapis.com')
    ) {
      return originalSrc;
    }

    try {
      // Use our imageUtils optimizeImage function
      return await optimizeImage(originalSrc, {
        quality,
        maxWidth: width || 1200,
        maxHeight: height || 1200,
      });
    } catch (error) {
      console.error('Error optimizing image:', error);
      return originalSrc;
    }
  };

  // Check if image is cached in either browser cache or our custom cache
  const checkImageCache = async (imageSrc) => {
    // First check if it's in our application cache
    if (isCached(imageSrc)) {
      return true;
    }

    // Then check browser cache
    try {
      return await isImageCached(imageSrc);
    } catch (error) {
      console.error('Error checking image cache:', error);
      return false;
    }
  }; // Generate tiny placeholder if none provided
  useEffect(() => {
    // If we already have src and it's cached, show it immediately
    if (src) {
      checkImageCache(src).then((cached) => {
        if (cached) {
          // If image is cached, show it immediately without loading indicators
          getOptimizedSrc(src).then((optimizedSrc) => {
            setImgSrc(optimizedSrc);
            setIsLoaded(true);
            if (onLoad) onLoad();
          });
        } else if (!placeholderSrc && blur) {
          // Generate placeholder only if image isn't cached
          createTinyPlaceholder(src, 20).then((tinyPlaceholder) => {
            if (tinyPlaceholder) {
              setImgSrc(tinyPlaceholder);
            }
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, placeholderSrc, blur]);
  useEffect(() => {
    // Only set up IntersectionObserver if the image isn't already loaded
    if (!isLoaded && !priority && lazy && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              observer.disconnect();
            }
          });
        },
        { rootMargin: '200px' } // Start loading when image is 200px from viewport
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => {
        if (imgRef.current) {
          observer.disconnect();
        }
      };
    } else if (priority || !lazy) {
      // Load immediately for priority images or if lazy loading is disabled
      // and the image isn't already loaded
      if (!isLoaded) {
        loadImage();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, priority, lazy, isLoaded]); // Function to load the main image
  const loadImage = async () => {
    if (!src || hasError) return;

    try {
      // For Firebase Storage URLs, handle them directly without optimization
      if (src.includes('firebasestorage.googleapis.com')) {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Important for Firebase Storage URLs
        img.src = src;

        img.onload = () => {
          setImgSrc(src);
          setIsLoaded(true);
          addToCache(src);
          if (onLoad) onLoad();
        };

        img.onerror = (e) => {
          console.error(`Failed to load Firebase image: ${src}`, e);
          setHasError(true);
          setImgSrc(placeholderImage);
          if (onError) onError(e);
        };

        return;
      }

      // For other images, continue with normal processing
      // Check if image is already in cache from ImageCacheContext
      const isCachedImage = await checkImageCache(src);

      // Get the optimized version of the image
      const optimizedSrc = await getOptimizedSrc(src);
      setOptimizedImageSrc(optimizedSrc);

      // If image is cached, skip the loading spinner and show it immediately
      if (isCachedImage) {
        setImgSrc(optimizedSrc);
        setIsLoaded(true);
        if (onLoad) onLoad();
        return;
      }

      // Otherwise, load it with the shimmer effect
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = optimizedSrc;

      img.onload = () => {
        setImgSrc(optimizedSrc);
        setIsLoaded(true);
        // Add to cache after successful load
        addToCache(src);
        if (onLoad) onLoad();
      };

      img.onerror = (e) => {
        console.error(`Failed to load image: ${optimizedSrc}`, e);
        setHasError(true);
        setImgSrc(placeholderImage);
        if (onError) onError(e);
      };
    } catch (error) {
      console.error(`Error in loadImage for ${src}:`, error);
      setHasError(true);
      setImgSrc(placeholderImage);
      if (onError) onError();
    }
  };

  const handleImgError = (e) => {
    console.error(`Error displaying image: ${src}`);
    setHasError(true);
    setImgSrc(placeholderImage);
    if (onError) onError(e);
  };

  // Combine classes
  const imageClasses = [
    styles.optimizedImage,
    className || '',
    !isLoaded && blur ? styles.blurredImage : '',
    isLoaded ? styles.loadedImage : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={styles.imageWrapper}
      style={{
        width: width || '100%',
        height: height || 'auto',
        aspectRatio: !height && width ? 'auto' : undefined,
      }}
      ref={imgRef}
    >
      {/* Shimmer effect when loading */}
      {!isLoaded && <div className={styles.shimmer}></div>}

      {/* Main image */}
      <img
        src={imgSrc || placeholderImage}
        alt={alt || ''}
        className={`${imageClasses} ${!isLoaded ? styles.hiddenAlt : ''}`}
        loading={priority ? 'eager' : 'lazy'}
        onError={handleImgError}
        style={{ objectFit, opacity: isLoaded ? 1 : 0 }}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
