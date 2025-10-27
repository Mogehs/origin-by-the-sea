import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import {
  fetchUserCart,
  setFirebaseCartStatus,
} from '../features/product/cartSlice';
import {
  fetchUserFavorites,
  setFirebaseFavoritesStatus,
} from '../features/product/favoritesSlice';

/**
 * This component initializes and syncs cart and favorites data
 * when the app starts based on authentication status
 */
const DataSyncInitializer = () => {
  const dispatch = useDispatch();
  const { currentUser, isAuthenticated, loading } = useAuth() || {};

  useEffect(() => {
    // Only proceed after auth state is determined (no longer loading)
    if (loading) return;

    if (isAuthenticated && currentUser) {
      // User is logged in, fetch data from Firebase
      dispatch(fetchUserCart(currentUser.uid));
      dispatch(fetchUserFavorites(currentUser.uid));
    } else {
      // User is not logged in, use localStorage
      dispatch(setFirebaseCartStatus(false));
      dispatch(setFirebaseFavoritesStatus(false));
    }
  }, [dispatch, currentUser, isAuthenticated, loading]);

  // This component doesn't render anything
  return null;
};

export default DataSyncInitializer;
