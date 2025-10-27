/**
 * Image utility functions for optimizing and working with images
 */
import { compressImage, createPlaceholder } from './imageCompression';

/**
 * Creates a tiny base64 placeholder image URL from a given image URL
 * @param {string} originalSrc - The original image URL
 * @param {number} size - The size of the tiny placeholder (default: 10px)
 * @returns {Promise<string>} - Base64 encoded tiny image
 */
export const createTinyPlaceholder = async (originalSrc, size = 10) => {
  if (!originalSrc) {
    return '/images/placeholder.jpg';
  }
  
  try {
    // Use our image compression utility to create a small placeholder
    const placeholder = await createPlaceholder(originalSrc, size, size);
    return placeholder || '/images/placeholder.jpg';
  } catch (error) {
    console.error('Error creating tiny placeholder:', error);
    return '/images/placeholder.jpg';
  }
};

/**
 * Preloads an image and returns a promise that resolves when the image is loaded
 * @param {string} src - The image URL to preload
 * @returns {Promise<HTMLImageElement>} - The loaded image element
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

/**
 * Checks if an image is in the browser cache
 * @param {string} src - The image URL to check
 * @returns {Promise<boolean>} - True if the image is in cache
 */
export const isImageCached = async (src) => {
  try {
    const cache = await caches.open('image-cache');
    const cachedResponse = await cache.match(src);
    return !!cachedResponse;
  } catch (error) {
    console.error('Error checking image cache:', error);
    return false;
  }
};

/**
 * Caches an image URL in the browser cache
 * @param {string} src - The image URL to cache
 */
export const cacheImage = async (src) => {
  try {
    const cache = await caches.open('image-cache');
    const response = await fetch(src, { cache: 'no-store' });
    await cache.put(src, response);
  } catch (error) {
    console.error('Error caching image:', error);
  }
};

/**
 * Gets the dominant color from an image
 * @param {string} src - The image URL
 * @returns {Promise<string>} - The dominant color as a hex string
 */
export const getDominantColor = async (src) => {
  // In a real implementation, you would analyze the image to find its dominant color
  // For this example, we'll return a default color
  return '#f0f0f0';
};

/**
 * Optimizes an image by compressing it to a given quality level
 * @param {string} src - The image URL to optimize
 * @param {Object} options - Compression options
 * @param {string} options.quality - Quality level: 'low', 'medium', or 'high'
 * @param {number} options.maxWidth - Maximum width for the optimized image
 * @param {number} options.maxHeight - Maximum height for the optimized image
 * @returns {Promise<string>} - A promise that resolves to the optimized image URL or data URL
 */
export const optimizeImage = async (src, options = {}) => {
  const {
    quality = 'medium',
    maxWidth = 1200,
    maxHeight = 1200
  } = options;
  
  // Map quality level to a value between 0 and 1
  const qualityMap = {
    low: 0.3,
    medium: 0.6,
    high: 0.85
  };
  
  const compressionQuality = qualityMap[quality] || 0.6;
  
  try {
    // Use the compressImage function to compress the image
    const optimizedImage = await compressImage(src, {
      maxWidth,
      maxHeight,
      quality: compressionQuality,
      format: 'jpeg'
    });
    
    return optimizedImage;
  } catch (error) {
    console.error('Error optimizing image:', error);
    return src; // Return original source if optimization fails
  }
};

/**
 * Generates a blurhash placeholder for an image
 * @param {string} src - The image URL
 * @returns {Promise<string>} - The blurhash string
 */
export const generateBlurhash = async (src) => {
  // In a real implementation, you would generate a blurhash
  // For this example, we'll return a placeholder
  return 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
};

export default {
  createTinyPlaceholder,
  preloadImage,
  isImageCached,
  cacheImage,
  getDominantColor,
  generateBlurhash,
  optimizeImage
};
