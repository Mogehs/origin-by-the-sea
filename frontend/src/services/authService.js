import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Create a user document in Firestore after successful authentication
const createUserDocument = async(user, additionalData = {}) => {
    if (!user) return;

    // Reference to the user document
    const userRef = doc(db, 'users', user.uid);

    // Check if the user document already exists
    const userSnapshot = await getDoc(userRef);

    // If the user document doesn't exist, create it
    if (!userSnapshot.exists()) {
        const { email, displayName, photoURL, phoneNumber } = user;
        const createdAt = serverTimestamp();

        try {
            await setDoc(userRef, {
                uid: user.uid,
                email,
                displayName: displayName || additionalData.displayName || '',
                photoURL: photoURL || '',
                phoneNumber: phoneNumber || additionalData.phoneNumber || '',
                createdAt,
                ...additionalData
            });

            console.log('User document created successfully');
        } catch (error) {
            console.error('Error creating user document', error);
        }
    } else {
        // Optionally update existing user data here
        console.log('User document already exists');
    }

    return userRef;
};

// Register a new user with email and password
export const registerWithEmailAndPassword = async(email, password, additionalData) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create a user document in Firestore
        await createUserDocument(user, additionalData);

        return { user };
    } catch (error) {
        return { error };
    }
};

// Sign in with email and password
export const signInWithEmail = async(email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user };
    } catch (error) {
        return { error };
    }
};

// Sign in with Google
export const signInWithGoogle = async() => {
    try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        // Create or update the user document in Firestore
        await createUserDocument(user);

        return { user };
    } catch (error) {
        return { error };
    }
};

// Sign out
export const logOut = async() => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { error };
    }
};

// Get the current authenticated user
export const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                unsubscribe();
                resolve(user);
            },
            reject
        );
    });
};

// Check if a user is authenticated
export const isAuthenticated = async() => {
    const user = await getCurrentUser();
    return !!user;
};

// Get user data from Firestore
export const getUserData = async(uid) => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
            return { userData: userSnapshot.data() };
        } else {
            return { error: 'User document not found' };
        }
    } catch (error) {
        return { error };
    }
};

export default {
    registerWithEmailAndPassword,
    signInWithEmail,
    signInWithGoogle,
    logOut,
    getCurrentUser,
    isAuthenticated,
    getUserData
};