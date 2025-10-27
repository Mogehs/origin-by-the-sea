import { loadStripe } from "@stripe/stripe-js";
import { STRIPE_PUBLISHABLE_KEY } from "../config/stripe";
import { auth } from "../config/firebase";

let stripePromise = null;
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://t7ck79lu3m.execute-api.eu-north-1.amazonaws.com/prod";

/**
 * Gets a Stripe instance (singleton pattern)
 * @returns {Promise<Stripe>} - Stripe instance
 */
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

/**
 * Get current user's auth token if available
 * @returns {Promise<string|null>} Firebase auth token or null if not authenticated
 */
const getAuthToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("No authenticated user found when getting auth token");
      return null;
    }
    return await user.getIdToken(true); // Force refresh the token
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

/**
 * Creates a payment intent by calling the backend API
 * @param {number} amount - The amount to charge (in smallest currency unit e.g. cents)
 * @param {string} currency - The currency (default: usd)
 * @param {object} metadata - Additional metadata to include with the payment intent
 * @param {object} shipping - Shipping information
 * @returns {Promise<Object>} - Client secret or error
 */
export const createPaymentIntent = async (
  amount,
  currency = "usd",
  metadata = {},
  shipping = null
) => {
  try {
    // Use a proxy or relative URL to avoid CORS issues in development
    const apiUrl = `${API_BASE_URL}/api/payment/create-intent`;

    // Extract userId and email from metadata if present to pass at the top level
    const { userId, userEmail, email } = metadata || {};

    // Get current user from Firebase Auth
    const currentUser = auth.currentUser;

    // Determine the actual userId to use - prioritize Firebase auth, then metadata
    const actualUserId = currentUser?.uid || userId || "guest-user";
    const actualEmail =
      currentUser?.email || userEmail || email || "guest@example.com";

    console.log("🔐 User identification for payment:", {
      hasFirebaseUser: !!currentUser,
      firebaseUid: currentUser?.uid,
      firebaseEmail: currentUser?.email,
      metadataUserId: userId,
      metadataUserEmail: userEmail,
      metadataEmail: email,
      finalUserId: actualUserId,
      finalEmail: actualEmail,
    });

    // Attempt to get authentication token, but proceed even if not available
    const authToken = await getAuthToken();

    // Prepare headers
    const headers = {
      "Content-Type": "application/json",
    };

    // Add auth token if available
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Log the request details for debugging (without sensitive info)
    console.log("Creating payment intent with:", {
      amount,
      currency,
      userId: actualUserId,
      email: actualEmail ? `${actualEmail.substring(0, 3)}...` : undefined, // Only log partial email for privacy
      hasAuthToken: !!authToken,
      hasShipping: !!shipping,
      shippingCountry:
        shipping && shipping.address
          ? shipping.address.country
          : "Not provided",
    });

    // Prepare payment data according to server API documentation
    const paymentData = {
      amount,
      currency: currency || "aed",
      userId: actualUserId, // Use the determined userId from Firebase or metadata
      metadata: {
        customerName:
          metadata.firstName && metadata.lastName
            ? `${metadata.firstName} ${metadata.lastName}`
            : currentUser?.displayName || "Guest User",
        email: actualEmail, // Use the determined email
        phone: metadata.phone || "",
        address: metadata.shippingAddress
          ? `${metadata.shippingAddress.address}, ${metadata.shippingAddress.city}, ${metadata.shippingAddress.country}`
          : "Address not provided",
      },
      cartItems: metadata.items || [],
      shipping,
    };

    // Call backend API to create a payment intent
    console.log("🌐 Making payment intent API call to:", apiUrl);
    console.log("🌐 Request headers:", headers);
    console.log("🌐 Request body:", paymentData);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(paymentData),
      credentials: "include", // Include cookies if needed
    });

    console.log("🌐 API response status:", response.status);
    console.log("🌐 API response ok:", response.ok);

    // Log response status for debugging
    console.log("Payment intent response status:", response.status);

    const data = await response.json();
    console.log("🌐 API response data:", data);

    if (!response.ok) {
      // Log the error details for debugging
      console.error("❌ Payment intent error response:", data);
      throw new Error(
        data.error ||
          `Failed to create payment intent. Status code: ${response.status}`
      );
    }

    console.log("✅ Payment intent created successfully:", {
      hasClientSecret: !!data.clientSecret,
      paymentIntentId: data.paymentIntentId,
      orderId: data.orderId,
      clientSecretPreview: data.clientSecret
        ? data.clientSecret.substring(0, 20) + "..."
        : "None",
    });

    // Validate that we have the required data
    if (!data.clientSecret) {
      throw new Error("Server did not return a client secret");
    }

    if (!data.paymentIntentId) {
      throw new Error("Server did not return a payment intent ID");
    }

    console.log("🌐 Payment intent created successfully:", data);

    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
      orderId: data.orderId,
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return { error: error.message };
  }
};

/**
 * Confirms a card payment with Stripe
 * @param {string} clientSecret - The client secret from the PaymentIntent
 * @param {Object} cardElement - Stripe card element from the form
 * @param {Object} billingDetails - Customer billing details
 * @returns {Promise<Object>} - Payment result or error
 */
export const confirmCardPayment = async (
  clientSecret,
  cardElement,
  billingDetails
) => {
  try {
    const stripe = await getStripe();
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: billingDetails,
      },
    });

    if (result.error) {
      return { error: result.error };
    } else if (result.paymentIntent.status === "succeeded") {
      return {
        success: true,
        paymentIntent: result.paymentIntent,
      };
    } else {
      return {
        success: false,
        status: result.paymentIntent.status,
      };
    }
  } catch (error) {
    console.error("Error confirming payment:", error);
    return { error };
  }
};

/**
 * Check payment status
 * @param {string} paymentIntentId - The ID of the payment intent to check
 * @returns {Promise<Object>} - Payment status or error
 */
export const checkPaymentStatus = async (paymentIntentId) => {
  try {
    // Use a proxy or relative URL to avoid CORS issues in development
    const apiUrl = `${API_BASE_URL}/api/payment/${paymentIntentId}`;

    // Attempt to get authentication token, but proceed even if not available
    const authToken = await getAuthToken();

    // Prepare headers
    const headers = {
      "Content-Type": "application/json",
    };

    // Add auth token if available
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers,
      credentials: "include", // Include cookies if needed
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to check payment status");
    }

    return {
      id: data.id,
      status: data.status,
      amount: data.amount,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error("Error checking payment status:", error);
    return { error: error.message };
  }
};

export default {
  getStripe,
  createPaymentIntent,
  confirmCardPayment,
  checkPaymentStatus,
};
