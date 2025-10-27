// Service worker for caching images
const CACHE_NAME = "origin-by-the-sea-image-cache-v1";
const IMAGE_CACHE_NAME = "origin-by-the-sea-images-v1";
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

// Install event - pre-cache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/images/placeholder.jpg", "/images/logo.png"]);
    })
  );
  // Skip waiting so the service worker activates immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== IMAGE_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - cache images with a stale-while-revalidate strategy
self.addEventListener("fetch", (event) => {
  // Only handle GET requests (POST, PUT, DELETE cannot be cached)
  if (event.request.method !== "GET") {
    return;
  }

  // Handle image requests
  if (isImageRequest(event.request)) {
    event.respondWith(handleImageRequest(event.request));
    return;
  }

  // For non-image requests, use a network-first strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before using it
        const responseClone = response.clone();

        // Cache successful responses
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        // If network fails, try to get from cache
        return caches.match(event.request);
      })
  );
});

// Helper function to determine if a request is for an image
function isImageRequest(request) {
  if (request.method !== "GET") return false;

  const url = new URL(request.url);

  // Check if the URL ends with an image extension
  const hasImageExtension = IMAGE_EXTENSIONS.some((ext) =>
    url.pathname.toLowerCase().endsWith(ext)
  );

  // Check if it's a request for an image in our domain
  const isInternalImage =
    url.hostname === self.location.hostname &&
    (url.pathname.startsWith("/images/") || hasImageExtension);

  // Check for external images that we want to cache (e.g., from CDNs)
  const isFirebaseStorage = url.hostname.includes(
    "firebasestorage.googleapis.com"
  );
  const isExternalImage =
    hasImageExtension &&
    (url.hostname.includes("cloudfront.net") ||
      url.hostname.includes("storage.googleapis.com") ||
      isFirebaseStorage);

  // For Firebase Storage URLs, check if they have the proper token
  if (isFirebaseStorage && !url.search.includes("token=")) {
    return false;
  }

  return isInternalImage || isExternalImage;
}

// Handle image requests with a stale-while-revalidate strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);

  // Try to get the image from the cache
  const cachedResponse = await cache.match(request);

  // Clone the request as it can only be used once
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      // If we got a valid response, clone it and put it in the cache
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error("Error fetching image:", error);
      return null;
    });

  // If we have a cached response, return it immediately, but also fetch
  // from network to update the cache for next time
  if (cachedResponse) {
    // Trigger fetch but don't wait for it
    fetchPromise;
    return cachedResponse;
  }

  // If no cached response, wait for the network response
  const networkResponse = await fetchPromise;

  // If we got a network response, return it
  if (networkResponse) {
    return networkResponse;
  }

  // If all else fails, return a fallback image
  return await caches.match("/images/placeholder.jpg");
}

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_IMAGES") {
    cacheImages(event.data.images);
  }
});

// Pre-cache a list of images
async function cacheImages(imageUrls) {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) return;

  const cache = await caches.open(IMAGE_CACHE_NAME);

  // Process images in smaller batches to avoid overwhelming the browser
  const batchSize = 5;

  for (let i = 0; i < imageUrls.length; i += batchSize) {
    const batch = imageUrls.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (url) => {
        try {
          // Check if image is already cached
          if (!(await cache.match(url))) {
            const response = await fetch(url, { mode: "no-cors" });
            if (response) {
              await cache.put(url, response);
            }
          }
        } catch (error) {
          console.error(`Failed to cache image ${url}:`, error);
        }
      })
    );

    // Small delay between batches
    if (i + batchSize < imageUrls.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
