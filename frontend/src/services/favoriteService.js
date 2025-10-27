import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-toastify';

/**
 * Add a product to user's favorites
 * @param {string} userId - The user's ID
 * @param {Object} product - The product to add to favorites
 * @returns {Promise<Object>} - Object containing favoriteId or error
 */
export const addToFavorites = async (userId, product) => {
  try {
    // Check if product is already in favorites
    const existingQuery = query(
      collection(db, 'users', userId, 'favorites'),
      where('productId', '==', product.id)
    );

    const existingDocs = await getDocs(existingQuery);

    if (!existingDocs.empty) {
      return {
        favoriteId: existingDocs.docs[0].id,
        exists: true,
      };
    }

    // Add timestamp to favorite data
    const favoriteData = {
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image || (product.images && product.images[0]) || '',
      createdAt: new Date(),
    };

    // Add the favorite to Firestore
    const favoriteRef = await addDoc(
      collection(db, 'users', userId, 'favorites'),
      favoriteData
    );

    return {
      favoriteId: favoriteRef.id,
    };
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return {
      error: error.message || 'Failed to add to favorites',
    };
  }
};

/**
 * Remove a product from user's favorites
 * @param {string} userId - The user's ID
 * @param {string} productId - The product ID to remove
 * @returns {Promise<Object>} - Success or error object
 */
export const removeFromFavorites = async (userId, productId) => {
  try {
    // Find the favorite document for this product
    const favoritesRef = collection(db, 'users', userId, 'favorites');
    const q = query(favoritesRef, where('productId', '==', productId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { error: 'Favorite not found' };
    }

    // Delete the favorite document
    await deleteDoc(
      doc(db, 'users', userId, 'favorites', querySnapshot.docs[0].id)
    );

    return { success: true };
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return {
      error: error.message || 'Failed to remove from favorites',
    };
  }
};

/**
 * Get all favorites for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Object containing favorites array or error
 */
export const getFavorites = async (userId) => {
  try {
    const favoritesRef = collection(db, 'users', userId, 'favorites');
    const querySnapshot = await getDocs(favoritesRef);

    const favorites = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { favorites };
  } catch (error) {
    console.error('Error getting favorites:', error);
    return {
      error: error.message || 'Failed to get favorites',
    };
  }
};

/**
 * Check if a product is in the user's favorites
 * @param {string} userId - The user's ID
 * @param {string} productId - The product ID to check
 * @returns {Promise<Object>} - Object containing isFavorite flag or error
 */
export const isProductFavorite = async (userId, productId) => {
  try {
    const favoritesRef = collection(db, 'users', userId, 'favorites');
    const q = query(favoritesRef, where('productId', '==', productId));
    const querySnapshot = await getDocs(q);

    return {
      isFavorite: !querySnapshot.empty,
      favoriteId: querySnapshot.empty ? null : querySnapshot.docs[0].id,
    };
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return {
      error: error.message || 'Failed to check favorite status',
      isFavorite: false,
    };
  }
};

/**
 * Synchronize localStorage favorites with Firebase for a newly authenticated user
 * @param {string} userId - The user's ID
 * @param {Array} localFavorites - Favorites from localStorage
 * @returns {Promise<Object>} - Success or error object
 */
export const syncFavoritesWithFirebase = async (userId, localFavorites) => {
  try {
    // First, get the existing favorites from Firebase
    const { favorites: existingFavorites, error } = await getFavorites(userId);

    if (error) {
      throw new Error(error);
    }

    // Process each local favorite
    for (const localFavorite of localFavorites) {
      // Check if this item already exists in the Firebase favorites
      const existingFavorite = existingFavorites.find(
        (item) => item.productId === localFavorite.id
      );

      // Only add if it doesn't already exist
      if (!existingFavorite) {
        await addToFavorites(userId, localFavorite);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error syncing favorites with Firebase:', error);
    toast.error('Failed to sync your favorites. Please try again.');
    throw error;
  }
};

export default {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  isProductFavorite,
  syncFavoritesWithFirebase,
};
