import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const API_BASE_URL =
  import.meta.env.REACT_APP_API_URL ||
  'https://t7ck79lu3m.execute-api.eu-north-1.amazonaws.com/prod';

/**
 * Get current user's auth token if available
 * @returns {Promise<string|null>} Firebase auth token or null if not authenticated
 */
const getAuthToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('No authenticated user found when getting auth token');
      return null;
    }
    return await user.getIdToken(true); // Force refresh the token
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Create a new order in Firestore and/or backend API
 * @param {Object} orderData - The order data
 * @returns {Promise<Object>} - Object containing orderId or error
 */
export const createOrder = async (orderData) => {
  try {
    // Try to get order from session storage if it was created during payment intent
    const pendingOrderId = sessionStorage.getItem('pendingOrderId');

    // If this is a Stripe payment and we have a pending order ID, use that instead of creating a new one
    if (
      orderData.paymentMethod === 'card' &&
      orderData.paymentIntentId &&
      pendingOrderId
    ) {
      // Clear the pending order ID from session storage
      sessionStorage.removeItem('pendingOrderId');

      // Optionally update the order with final details via backend API
      try {
        // Get authentication token if available
        const authToken = await getAuthToken();

        // Prepare headers
        const headers = {
          'Content-Type': 'application/json',
        };

        // Add auth token if available
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        await fetch(`${API_BASE_URL}/api/orders/${pendingOrderId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: 'processing',
            paymentStatus: 'paid',
            updatedAt: new Date(),
          }),
          credentials: 'include',
        });
      } catch (apiError) {
        console.error('Error updating order via API:', apiError);
        // Continue with the process even if API update fails
      }

      return { orderId: pendingOrderId };
    }

    // Sanitize order data to ensure no undefined values (Firestore doesn't accept undefined)
    const sanitizedOrderData = Object.entries(orderData).reduce(
      (acc, [key, value]) => {
        // If value is undefined, replace with null or empty string
        if (value === undefined) {
          acc[key] = null; // or use '' if you prefer
        } else {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    // Add timestamp to order data
    const orderWithTimestamp = {
      ...sanitizedOrderData,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Ensure status is always set to processing if not already defined or is pending
      status:
        sanitizedOrderData.status === 'pending' || !sanitizedOrderData.status
          ? 'processing'
          : sanitizedOrderData.status,
    };

    // Add the order to Firestore
    const orderRef = await addDoc(collection(db, 'orders'), orderWithTimestamp);

    // For COD orders, optionally notify the backend API
    if (orderData.paymentMethod === 'cod') {
      try {
        // Get authentication token if available
        const authToken = await getAuthToken();

        // Prepare headers
        const headers = {
          'Content-Type': 'application/json',
        };

        // Add auth token if available
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        await fetch(`${API_BASE_URL}/api/orders/cod`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...orderWithTimestamp,
            orderId: orderRef.id,
          }),
          credentials: 'include',
        });
      } catch (apiError) {
        console.error('Error notifying API about COD order:', apiError);
        // Continue with the process even if API notification fails
      }
    }

    return {
      orderId: orderRef.id,
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      error: error.message || 'Failed to create order',
    };
  }
};

/**
 * Get orders for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Object containing orders or error
 */
export const getUserOrders = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const orders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort orders by creation date (newest first)
    orders.sort((a, b) => {
      const dateA = a.createdAt
        ? new Date(a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt)
        : new Date(0);
      const dateB = b.createdAt
        ? new Date(b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt)
        : new Date(0);
      return dateB - dateA;
    });

    return { orders };
  } catch (error) {
    console.error('Error getting user orders:', error);
    return {
      error: error.message || 'Failed to get orders',
    };
  }
};

/**
 * Get an order by its ID
 * @param {string} orderId - The order ID to find
 * @returns {Promise<Object>} - Object containing order data or error
 */
export const getOrderById = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return {
        error: 'Order not found',
      };
    }

    const orderData = orderDoc.data();
    return {
      order: {
        id: orderDoc.id,
        ...orderData,
        createdAt: orderData.createdAt?.toDate
          ? orderData.createdAt.toDate()
          : orderData.createdAt,
      },
    };
  } catch (error) {
    console.error('Error getting order by ID:', error);
    return {
      error: error.message || 'Failed to get order',
    };
  }
};

export default {
  createOrder,
  getUserOrders,
  getOrderById,
};
