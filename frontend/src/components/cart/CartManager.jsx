import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import { 
  fetchUserCart, 
  syncCartThunk,
  setFirebaseCartStatus
} from '../../features/product/cartSlice';

/**
 * CartManager component that handles synchronization between localStorage and Firebase cart
 * This component doesn't render anything visible, it just handles the logic
 */
const CartManager = () => {
  const dispatch = useDispatch();
  const [user, loading] = useAuthState(auth);
  const { cartItems, isFirebaseCart } = useSelector((state) => state.cart);

  // When user logs in, fetch their cart from Firebase or sync localStorage cart to Firebase
  useEffect(() => {
    if (!loading) {
      if (user) {
        if (!isFirebaseCart) {
          // User just logged in and we have localStorage items
          if (cartItems.length > 0) {
            // Sync localStorage cart to Firebase
            dispatch(syncCartThunk({ 
              userId: user.uid, 
              localCartItems: cartItems 
            }));
          } else {
            // Just fetch user's Firebase cart
            dispatch(fetchUserCart(user.uid));
          }
        }
      } else {
        // User is logged out, ensure we're using localStorage
        dispatch(setFirebaseCartStatus(false));
      }
    }
  }, [dispatch, user, loading, cartItems.length, isFirebaseCart]);

  // This component doesn't render anything visible
  return null;
};

export default CartManager; 