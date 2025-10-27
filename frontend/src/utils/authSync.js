import { store } from '../store';
import {
  fetchUserCart,
  syncCartThunk,
  setFirebaseCartStatus,
} from '../features/product/cartSlice';
import {
  fetchUserFavorites,
  syncFavoritesThunk,
  setFirebaseFavoritesStatus,
} from '../features/product/favoritesSlice';

/**
 * Synchronize user data (cart and favorites) when a user logs in
 * @param {string} userId - The user's ID
 */
export const syncUserDataOnLogin = async (userId) => {
  try {
    if (!userId) return;

    const state = store.getState();
    const { cartItems } = state.cart;
    const { favorites } = state.favorites;

    // Sync cart if there are local cart items
    if (cartItems.length > 0) {
      await store.dispatch(
        syncCartThunk({ userId, localCartItems: cartItems })
      );
    } else {
      // If no local cart items, just fetch the user's cart from Firebase
      await store.dispatch(fetchUserCart(userId));
    }

    // Sync favorites if there are local favorites
    if (favorites.length > 0) {
      await store.dispatch(
        syncFavoritesThunk({ userId, localFavorites: favorites })
      );
    } else {
      // If no local favorites, just fetch the user's favorites from Firebase
      await store.dispatch(fetchUserFavorites(userId));
    }
  } catch (error) {
    console.error('Error syncing user data on login:', error);
  }
};

/**
 * Handle user data when a user logs out
 * Switch to local storage mode
 */
export const handleUserDataOnLogout = () => {
  try {
    // Set cart and favorites to use localStorage instead of Firebase
    store.dispatch(setFirebaseCartStatus(false));
    store.dispatch(setFirebaseFavoritesStatus(false));
  } catch (error) {
    console.error('Error handling user data on logout:', error);
  }
};
