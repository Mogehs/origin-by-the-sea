/**
 * Utility functions for image compression on the client side
 */

/**
 * Compresses an image URL to a smaller size and quality
 * @param {string} imageUrl - The URL of the image to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width in pixels (default: 1200)
 * @param {number} options.maxHeight - Maximum height in pixels (default: 1200)
 * @param {number} options.quality - JPEG quality from 0 to 1 (default: 0.7)
 * @param {string} options.format - Output format ('jpeg', 'png', or 'webp') (default: 'jpeg')
 * @returns {Promise<string>} - A promise that resolves to a data URL of the compressed image
 */
export async function compressImage(imageUrl, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.7,
    format = 'jpeg',
  } = options;

  // For Firebase Storage URLs, return the original URL to avoid CORS issues
  if (
    imageUrl &&
    typeof imageUrl === 'string' &&
    (imageUrl.includes('firebasestorage.googleapis.com') ||
      imageUrl.startsWith('data:') ||
      imageUrl.startsWith('blob:'))
  ) {
    return imageUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Create canvas and draw image with new dimensions
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to desired format
        let outputFormat;
        switch (format.toLowerCase()) {
          case 'png':
            outputFormat = 'image/png';
            break;
          case 'webp':
            outputFormat = 'image/webp';
            break;
          default:
            outputFormat = 'image/jpeg';
        }

        // Get compressed data URL
        const dataUrl = canvas.toDataURL(outputFormat, quality);
        resolve(dataUrl);
      } catch (error) {
        console.error('Error compressing image:', error);
        resolve(imageUrl); // Fall back to original URL on error
      }
    };

    img.onerror = () => {
      console.error(`Failed to load image for compression: ${imageUrl}`);
      resolve(imageUrl); // Return original URL on error instead of rejecting
    };

    // Set crossOrigin to anonymous to avoid CORS issues with external images
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
  });
}

/**
 * Converts a data URL to a Blob
 * @param {string} dataUrl - The data URL to convert
 * @returns {Blob} - The resulting Blob
 */
export function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Creates a placeholder image with a dominant color from the original
 * @param {string} imageUrl - The URL of the original image
 * @param {number} width - Width of the placeholder (default: 20)
 * @param {number} height - Height of the placeholder (default: 20)
 * @returns {Promise<string>} - A promise that resolves to a data URL of the placeholder
 */
export async function createPlaceholder(imageUrl, width = 20, height = 20) {
  try {
    // Skip placeholder generation for Firebase Storage URLs to avoid CORS issues
    if (
      imageUrl &&
      typeof imageUrl === 'string' &&
      (imageUrl.includes('firebasestorage.googleapis.com') ||
        imageUrl.startsWith('data:') ||
        imageUrl.startsWith('blob:'))
    ) {
      return null;
    }

    // First create a tiny version of the image
    const tinyImageDataUrl = await compressImage(imageUrl, {
      maxWidth: width,
      maxHeight: height,
      quality: 0.5,
    });

    return tinyImageDataUrl;
  } catch (error) {
    console.error('Error creating placeholder:', error);
    return null;
  }
}

/**
 * Estimates the file size of an image URL in bytes
 * @param {string} imageUrl - The URL of the image
 * @returns {Promise<number>} - A promise that resolves to the file size in bytes
 */
export async function getImageFileSize(imageUrl) {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });

    if (response.ok) {
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        return parseInt(contentLength, 10);
      }
    }

    // If we can't get the content-length, fetch the full image and check blob size
    const fullResponse = await fetch(imageUrl);
    const blob = await fullResponse.blob();
    return blob.size;
  } catch (error) {
    console.error('Error getting image file size:', error);
    return 0;
  }
}
