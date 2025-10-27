import { collection, addDoc, getDocs, query, where, deleteDoc, doc, setDoc, updateDoc, getDoc, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-toastify';

/**
 * Get all cart items for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Object containing cart items array or error
 */
export const getUserCart = async(userId) => {
    try {
        const cartRef = collection(db, 'users', userId, 'cart');
        const querySnapshot = await getDocs(cartRef);

        const cartItems = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { cartItems };
    } catch (error) {
        console.error('Error getting cart items:', error);
        toast.error('Failed to load your cart. Please try again.');
        throw error;
    }
};

/**
 * Add an item to the user's cart
 * @param {string} userId - The user's ID
 * @param {Object} item - The cart item to add
 * @returns {Promise<Object>} - Object containing cartItemId or error
 */
export const addItemToCart = async(userId, item) => {
    try {
        // Check if the item already exists with the same productId, size, and color
        const cartItemsRef = collection(db, 'users', userId, 'cart');
        const q = query(
            cartItemsRef,
            where('productId', '==', item.id),
            where('size', '==', item.size),
            where('color', '==', item.color)
        );

        const querySnapshot = await getDocs(q);

        // If item exists, update its quantity
        if (!querySnapshot.empty) {
            const existingItem = querySnapshot.docs[0];
            const existingData = existingItem.data();
            const newQuantity = (existingData.quantity || 0) + (item.quantity || 1);

            await updateDoc(doc(db, 'users', userId, 'cart', existingItem.id), {
                quantity: newQuantity,
                updatedAt: new Date()
            });

            return {
                cartItemId: existingItem.id,
                updated: true
            };
        }

        // Otherwise add as new item
        const cartData = {
            productId: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            size: item.size,
            color: item.color,
            displayColor: item.displayColor,
            quantity: item.quantity || 1,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await addDoc(collection(db, 'users', userId, 'cart'), cartData);

        return {
            cartItemId: docRef.id
        };
    } catch (error) {
        console.error('Error adding item to cart:', error);
        toast.error('Failed to add item to cart. Please try again.');
        throw error;
    }
};

/**
 * Update the quantity of a cart item
 * @param {string} userId - The user's ID
 * @param {string} productId - The product ID
 * @param {string} size - The product size
 * @param {string} color - The product color
 * @param {number} quantity - The new quantity
 * @returns {Promise<Object>} - Success or error object
 */
export const updateCartItemQuantity = async(userId, productId, size, color, quantity) => {
    try {
        const cartRef = collection(db, 'users', userId, 'cart');
        const q = query(
            cartRef,
            where('productId', '==', productId),
            where('size', '==', size),
            where('color', '==', color)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { error: 'Cart item not found' };
        }

        const cartItemDoc = querySnapshot.docs[0];

        await updateDoc(doc(db, 'users', userId, 'cart', cartItemDoc.id), {
            quantity: quantity,
            updatedAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating cart item quantity:', error);
        toast.error('Failed to update item quantity. Please try again.');
        throw error;
    }
};

/**
 * Remove an item from the user's cart
 * @param {string} userId - The user's ID
 * @param {string} productId - The product ID to remove
 * @param {string} size - The product size
 * @param {string} color - The product color
 * @returns {Promise<Object>} - Success or error object
 */
export const removeCartItem = async(userId, productId, size, color) => {
    try {
        const cartRef = collection(db, 'users', userId, 'cart');
        const q = query(
            cartRef,
            where('productId', '==', productId),
            where('size', '==', size),
            where('color', '==', color)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { error: 'Cart item not found' };
        }

        await deleteDoc(doc(db, 'users', userId, 'cart', querySnapshot.docs[0].id));

        return { success: true };
    } catch (error) {
        console.error('Error removing cart item:', error);
        toast.error('Failed to remove item from cart. Please try again.');
        throw error;
    }
};

/**
 * Clear the user's entire cart
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Success or error object
 */
export const clearCart = async(userId) => {
    try {
        const cartRef = collection(db, 'users', userId, 'cart');
        const querySnapshot = await getDocs(cartRef);

        // Delete all cart items
        const deletePromises = querySnapshot.docs.map(doc =>
            deleteDoc(doc.ref)
        );

        await Promise.all(deletePromises);

        return { success: true };
    } catch (error) {
        console.error('Error clearing cart:', error);
        toast.error('Failed to clear your cart. Please try again.');
        throw error;
    }
};

/**
 * Synchronize localStorage cart with Firebase for a newly authenticated user
 * @param {string} userId - The user's ID
 * @param {Array} localCartItems - Cart items from localStorage
 * @returns {Promise<Object>} - Success or error object
 */
export const syncCartWithFirebase = async(userId, localCartItems) => {
    try {
        // First, get the existing cart from Firebase
        const { cartItems: existingCartItems, error } = await getUserCart(userId);

        if (error) {
            throw new Error(error);
        }

        // Process each local cart item
        for (const localItem of localCartItems) {
            // Check if this item already exists in the Firebase cart
            const existingItem = existingCartItems.find(item =>
                item.productId === localItem.id &&
                item.size === localItem.size &&
                item.color === localItem.color
            );

            if (existingItem) {
                // Update quantity if item exists
                await updateCartItemQuantity(
                    userId,
                    localItem.id,
                    localItem.size,
                    localItem.color,
                    existingItem.quantity + localItem.quantity
                );
            } else {
                // Add new item if it doesn't exist
                await addItemToCart(userId, localItem);
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error syncing cart with Firebase:', error);
        toast.error('Failed to sync your cart. Please try again.');
        throw error;
    }
};

export default {
    getUserCart,
    addItemToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    syncCartWithFirebase
};