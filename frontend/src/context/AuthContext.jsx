import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { logOut } from '../services/authService';
import { syncUserDataOnLogin, handleUserDataOnLogout } from '../utils/authSync';

// Create the authentication context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const previousUser = currentUser;
      setCurrentUser(user);

      // If user just logged in, sync cart and favorites
      if (!previousUser && user) {
        syncUserDataOnLogin(user.uid);
      }

      // If user just logged out, handle local storage
      if (previousUser && !user) {
        handleUserDataOnLogout();
      }

      setLoading(false);

      // Clear userData if user is logged out
      if (!user) {
        setUserData(null);
        return;
      }

      // Get user document from Firestore when authenticated
      try {
        const userRef = doc(db, 'users', user.uid);

        // Set up a snapshot listener for the user document
        const unsubscribeSnapshot = onSnapshot(
          userRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              setUserData(docSnapshot.data());
            } else {
              setUserData(null);
            }
          },
          (error) => {
            console.error('Error fetching user data:', error);
            setAuthError(error);
          }
        );

        // Clean up the snapshot listener when the component unmounts
        return () => unsubscribeSnapshot();
      } catch (error) {
        console.error('Error setting up user data listener:', error);
        setAuthError(error);
      }
    });

    // Clean up the auth listener when the component unmounts
    return () => unsubscribe();
  }, [currentUser]);

  // Custom logout function that also handles user data
  const logout = async () => {
    try {
      // First handle local storage for cart and favorites
      handleUserDataOnLogout();
      // Then logout
      await logOut();
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  // The value passed to the context provider
  const value = {
    currentUser,
    userData,
    loading,
    authError,
    isAuthenticated: !!currentUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
