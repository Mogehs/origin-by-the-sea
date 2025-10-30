import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Elements } from "@stripe/react-stripe-js";
import OrderSummary from "./OrderSummary";
import AuthModal from "../../components/auth/AuthModal";
import CustomerInfoForm from "../../components/checkout/CustomerInfoForm";
import PaymentMethodSelector from "../../components/checkout/PaymentMethodSelector";
import StripePaymentForm from "../../components/checkout/StripePaymentForm";
import { useAuth } from "../../context/AuthContext";
import { createOrder } from "../../services/orderService";
import { createPaymentIntent, getStripe } from "../../services/paymentService";
import {
  clearCart,
  clearFirebaseCartThunk,
} from "../../features/product/cartSlice";
import styles from "./css/Buy.module.css";
import { toast } from "react-toastify";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { getCountryCode } from "../../utils/ProductUtils";
import { setGuestCheckout } from "../../features/guestSlice";

const modalStyles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
    position: "relative",
    border: "2px solid #4a90e2",
    background: "linear-gradient(to bottom, #f9f9f9, #ffffff)",
    zIndex: 1001,
  },
};
const Buy = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCartItems } = useSelector((state) => state.cart || []);
  const auth = useAuth() || {};
  const {
    currentUser,
    userData,
    isAuthenticated = false,
    loading = false,
  } = auth;

  // Check if user is in guest mode
  const isGuestUser = localStorage.getItem("isGuestUser") === "true";

  // Set guest checkout status in Redux when component mounts
  useEffect(() => {
    dispatch(setGuestCheckout(isGuestUser));
  }, [dispatch, isGuestUser]);

  // Check if this is a direct checkout
  const searchParams = new URLSearchParams(location.search);
  const isDirectCheckout = searchParams.get("direct") === "true";

  // State for checkout
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userData?.firstName || "",
    lastName: userData?.lastName || "",
    email: currentUser?.email || "",
    phone: userData?.phoneNumber || "",
    country: "United Arab Emirates",
  });
  const [formErrors, setFormErrors] = useState({});

  // State for saved addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressList, setShowAddressList] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);

  // Load Stripe
  useEffect(() => {
    if (paymentMethod === "card") {
      const loadStripe = async () => {
        try {
          const stripe = await getStripe();
          setStripePromise(stripe);
        } catch (error) {
          console.error("❌ Error loading Stripe:", error);
        }
      };
      loadStripe();
    }
  }, [paymentMethod]);

  // Calculate order total
  const calculateTotal = useCallback(() => {
    if (!selectedCartItems || selectedCartItems.length === 0) return 0;

    return selectedCartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/AED\s?|Rs.\s?|₹|,/g, ""));
      return total + price * item.quantity;
    }, 0);
  }, [selectedCartItems]);

  // Calculate VAT and totals
  const calculateOrderAmounts = useCallback(() => {
    const subtotal = calculateTotal();
    const vatRate = 0.05; // 5% VAT for UAE
    const vatAmount = subtotal * vatRate;
    const totalAmount = subtotal + vatAmount;

    return {
      subtotalAmount: Math.round(subtotal * 100), // in cents
      vatAmount: Math.round(vatAmount * 100), // in cents
      totalAmount: Math.round(totalAmount * 100), // in cents
      vatRate: "5%",
      vatPercentage: "5%",
    };
  }, [calculateTotal]);

  // Fetch user's saved addresses (only for authenticated users)
  useEffect(() => {
    if (currentUser?.uid && isAuthenticated && !isGuestUser) {
      const fetchAddresses = async () => {
        try {
          setAddressesLoading(true);
          const addressesRef = collection(
            db,
            "users",
            currentUser.uid,
            "addresses"
          );
          const addressesSnapshot = await getDocs(addressesRef);

          const addressList = addressesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setSavedAddresses(addressList);

          // If there's a default address, select it
          const defaultAddress = addressList.find((addr) => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
            updateFormWithAddress(defaultAddress);
          } else if (addressList.length > 0) {
            // Otherwise select the first address
            setSelectedAddress(addressList[0]);
            updateFormWithAddress(addressList[0]);
          }
        } catch (error) {
          console.error("Error fetching addresses:", error);
          toast.error("Failed to load your saved addresses");
        } finally {
          setAddressesLoading(false);
        }
      };

      fetchAddresses();
    }
  }, [currentUser?.uid, isAuthenticated, isGuestUser]);

  // Helper to update form data from selected address
  const updateFormWithAddress = (address) => {
    if (!address) return;

    setFormData((prev) => ({
      ...prev,
      firstName: address.firstName || prev.firstName,
      lastName: address.lastName || prev.lastName,
      address: address.address1 || "",
      apartment: address.address2 || "",
      city: address.city || "",
      state: address.state || "",
      zipCode: address.zipCode || "",
      country: address.country || "United Arab Emirates",
      phone: address.phone || prev.phone,
    }));
  };

  // Handle selecting a saved address
  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    updateFormWithAddress(address);
    setShowAddressList(false);
  };

  // Update form data when user data changes
  useEffect(() => {
    if (userData && !isGuestUser) {
      setFormData((prev) => ({
        ...prev,
        firstName: userData.firstName || prev.firstName,
        lastName: userData.lastName || prev.lastName,
        email: currentUser?.email || prev.email,
        phone: userData.phoneNumber || prev.phone,
      }));
    }
  }, [userData, currentUser, isGuestUser]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!selectedCartItems || selectedCartItems.length === 0) {
      navigate("/shop");
      toast.info("Your cart is empty. Add items before checkout.");
    }
  }, [selectedCartItems, navigate]);

  // Check authentication (modified to handle guest users)
  useEffect(() => {
    if (!loading && !isAuthenticated && !isGuestUser) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated, loading, isGuestUser]);

  // Handle auth modal close - UPDATED to keep user on the buy page
  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
    // We removed the redirection logic to keep users on the buy page
  };

  // Function to create payment intent immediately when card is selected
  const createPaymentIntentImmediately = useCallback(async () => {
    console.log("🎯 Creating payment intent immediately for card payment");

    if (!selectedCartItems || selectedCartItems.length === 0) {
      console.log("❌ No cart items, cannot create payment intent");
      return;
    }

    try {
      const amounts = calculateOrderAmounts();

      console.log("💰 Order amounts calculated:", amounts);

      // Prepare items array for the order
      const items = selectedCartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size || "",
        color: item.color || 0,
        displayColor: item.displayColor || "#000000",
        image: item.image || "",
      }));

      // Create metadata for the payment
      const metadata = {
        cartItemCount: selectedCartItems.length,
        userId: isGuestUser ? "guest-user" : currentUser?.uid || "guest-user",
        userEmail: isGuestUser
          ? formData.email || ""
          : currentUser?.email || formData.email || "",
        customerName: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone || "",
        address: `${formData.address}, ${formData.city}, ${formData.state}, ${formData.country}`,
        subtotalAmount: amounts.subtotalAmount.toString(),
        vatAmount: amounts.vatAmount.toString(),
        vatRate: amounts.vatRate,
        taxCompliant: "UAE_VAT_5_PERCENT",
        taxRegistrationNumber: "104803456300003",
        paymentMethod: "card",
        isGuestCheckout: isGuestUser,
        items, // Include items in metadata
      };

      // Format shipping address for Stripe if we have address data
      const shipping = formData.address
        ? {
            name: `${formData.firstName} ${formData.lastName}`,
            address: {
              line1: formData.address,
              line2: formData.apartment || "",
              city: formData.city || "",
              state: formData.state || "",
              postal_code: formData.zipCode || "",
              country: getCountryCode(formData.country),
            },
            phone: formData.phone || "",
          }
        : null;

      console.log("🚀 Creating payment intent with:", {
        amount: amounts.totalAmount,
        currency: "aed",
        userId: isGuestUser ? "guest-user" : currentUser?.uid,
        email: isGuestUser
          ? formData.email
          : currentUser?.email || formData.email,
        cartItemCount: selectedCartItems.length,
        hasShippingData: !!shipping,
        isGuestCheckout: isGuestUser,
      });

      const { clientSecret, error, paymentIntentId, orderId } =
        await createPaymentIntent(
          amounts.totalAmount,
          "aed",
          metadata,
          shipping
        );

      console.log("📋 Payment intent response:", {
        hasClientSecret: !!clientSecret,
        hasError: !!error,
        paymentIntentId,
        orderId,
        clientSecretPreview: clientSecret
          ? clientSecret.substring(0, 20) + "..."
          : "None",
      });

      if (error) {
        console.error("❌ Payment intent creation failed:", error);
        toast.error("Could not initialize payment. Please try again.");
      } else if (clientSecret) {
        console.log("✅ Payment intent created successfully");
        console.log("🔍 Payment Intent Details:", {
          paymentIntentId,
          orderId,
          clientSecretLength: clientSecret.length,
          clientSecretStartsWith: clientSecret.startsWith("pi_") ? "Yes" : "No",
        });
        setClientSecret(clientSecret);
        sessionStorage.setItem("currentPaymentIntentId", paymentIntentId);
        if (orderId) {
          sessionStorage.setItem("pendingOrderId", orderId);
        }

        // Payment intent created successfully, no need for additional verification
        console.log("✅ Payment intent ready for Stripe");
      } else {
        console.error(
          "❌ No client secret received from payment intent creation"
        );
        toast.error("Payment initialization failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Error creating payment intent:", err);
      toast.error("Payment initialization failed. Please try again.");
    }
  }, [
    selectedCartItems,
    calculateOrderAmounts,
    isGuestUser,
    currentUser,
    formData,
  ]);

  // Create a payment intent when card payment method is selected
  // This useEffect handles payment intent creation with proper authentication checks
  useEffect(() => {
    // Only proceed if card payment is selected and we have cart items
    if (
      paymentMethod === "card" &&
      selectedCartItems &&
      selectedCartItems.length > 0
    ) {
      console.log("💳 Card payment selected, checking authentication...");

      // For authenticated users, we need a user ID
      if (!isGuestUser && !currentUser?.uid) {
        console.error("❌ User ID not available, cannot create payment intent");
        toast.error("User authentication required for payment");
        setShowAuthModal(true);
        return;
      }

      // For authenticated users, check valid token
      if (!isGuestUser && !currentUser) {
        console.error("❌ User authentication token expired");
        toast.error("Your session has expired. Please log in again.");
        setShowAuthModal(true);
        return;
      }

      // Proceed with payment intent creation (call the function we defined earlier)
      console.log(
        "✅ Authentication check passed, proceeding with payment intent creation"
      );
      createPaymentIntentImmediately();
    }
  }, [
    paymentMethod,
    selectedCartItems,
    isAuthenticated,
    currentUser,
    isGuestUser,
    createPaymentIntentImmediately,
  ]);

  // Validate the form
  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zipCode",
      "country",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].trim() === "") {
        errors[field] = `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is required`;
      }
    });

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Phone validation (simple check for now)
    if (formData.phone && formData.phone.length < 10) {
      errors.phone = "Please enter a valid phone number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle order completion - for COD (with guest support)
  const handleCompleteCodOrder = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    try {
      setOrderProcessing(true);

      const amounts = calculateOrderAmounts();

      // Create shipping address
      const shippingAddress = {
        address: {
          line1: formData.address,
          line2: formData.apartment || "",
          city: formData.city,
          state: formData.state,
          postal_code: formData.zipCode,
          country: getCountryCode(formData.country),
        },
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone || "",
        status: "pending",
      };

      // Prepare items array
      const items = selectedCartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size || "",
        color: item.color || 0,
        displayColor: item.displayColor || "#000000",
        image: item.image || "",
      }));

      // Create metadata
      const metadata = {
        orderId: "", // Will be set after order creation
        userId: isGuestUser ? "guest-user" : currentUser?.uid || "",
        email: formData.email || "",
        customerName: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone || "",
        address: `${formData.address}, ${formData.city}, ${formData.state}, ${formData.country}`,
        subtotalAmount: amounts.subtotalAmount.toString(),
        vatAmount: amounts.vatAmount.toString(),
        vatRate: amounts.vatRate,
        taxCompliant: "UAE_VAT_5_PERCENT",
        taxRegistrationNumber: "104803456300003",
        paymentMethod: "cod",
      };

      // Create order data (adjusted for guest users)
      const orderData = {
        userId: isGuestUser ? "guest-user" : currentUser?.uid || "",
        userEmail: formData.email || "",
        items,
        shipping: shippingAddress,
        metadata,
        currency: "aed",
        paymentMethod: "cod",
        paymentStatus: "pending",
        status: "pending",
        subtotalAmount: amounts.subtotalAmount,
        vatAmount: amounts.vatAmount,
        totalAmount: amounts.totalAmount,
        vatPercentage: amounts.vatPercentage,
        vatRate: 0.05,
        taxRegistrationNumber: "104803456300003",
        notes: formData.orderNotes || "",
        isGuestOrder: isGuestUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create order in database
      const { orderId, error } = await createOrder(orderData);

      if (error) {
        toast.error("Failed to create your order. Please try again.");
        setOrderProcessing(false);
        return;
      }

      // Update metadata with orderId
      orderData.metadata.orderId = orderId;

      // Clear cart properly based on user type
      if (isGuestUser) {
        // For guest users, clear local cart
        dispatch(clearCart());
        localStorage.removeItem("cartItems");
      } else if (currentUser?.uid) {
        // For authenticated users, clear Firebase cart
        await dispatch(clearFirebaseCartThunk(currentUser.uid));
        dispatch(clearCart());
      } else {
        // Fallback: clear local cart
        dispatch(clearCart());
      }

      // Clear guest user flag after successful order
      if (isGuestUser) {
        localStorage.removeItem("isGuestUser");
      }

      // Navigate to success page
      navigate("/order-success", {
        state: {
          orderDetails: {
            orderId,
            ...orderData,
          },
        },
      });
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Something went wrong. Please try again.");
      setOrderProcessing(false);
    }
  };

  // Handle successful payment with Stripe (with guest support)
  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      console.log(
        "✅ Payment successful, processing order...",
        paymentIntent.id
      );

      // Get the order ID that was created when the payment intent was created
      const pendingOrderId = sessionStorage.getItem("pendingOrderId");

      if (!pendingOrderId) {
        console.error("❌ No pending order ID found after successful payment");
        toast.error(
          "Your payment was successful, but we couldn't find your order. Please contact support."
        );
        return;
      }

      console.log("📦 Using existing order:", pendingOrderId);

      // The order was already created by the backend when payment intent was created
      // The webhook will update the order status to 'paid' automatically
      // We just need to retrieve the order and clear the cart

      const amounts = calculateOrderAmounts();

      // Create shipping address
      const shippingAddress = {
        address: {
          line1: formData.address,
          line2: formData.apartment || "",
          city: formData.city,
          state: formData.state,
          postal_code: formData.zipCode,
          country: getCountryCode(formData.country),
        },
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone || "",
        status: "paid",
      };

      // Prepare items array
      const items = selectedCartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size || "",
        color: item.color || 0,
        displayColor: item.displayColor || "#000000",
        image: item.image || "",
      }));

      // Create metadata
      const metadata = {
        orderId: pendingOrderId,
        userId: isGuestUser ? "guest-user" : currentUser?.uid || "",
        email: formData.email || "",
        customerName: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone || "",
        address: `${formData.address}, ${formData.city}, ${formData.state}, ${formData.country}`,
        subtotalAmount: amounts.subtotalAmount.toString(),
        vatAmount: amounts.vatAmount.toString(),
        vatRate: amounts.vatRate,
        taxCompliant: "UAE_VAT_5_PERCENT",
        taxRegistrationNumber: "104803456300003",
      };

      // Prepare complete order data for the success page (matching original structure)
      const orderData = {
        orderId: pendingOrderId,
        userId: isGuestUser ? "guest-user" : currentUser?.uid || "",
        userEmail: formData.email || "",
        items,
        shipping: shippingAddress,
        metadata,
        currency: "aed",
        paymentMethod: "card",
        paymentStatus: "paid",
        paymentIntentId: paymentIntent.id,
        paymentData: paymentIntent, // Store full payment intent data
        status: "paid",
        subtotalAmount: amounts.subtotalAmount,
        vatAmount: amounts.vatAmount,
        totalAmount: amounts.totalAmount,
        vatPercentage: amounts.vatPercentage,
        vatRate: 0.05,
        taxRegistrationNumber: "104803456300003",
        notes: formData.orderNotes || "",
        isGuestOrder: isGuestUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Clear the pending order ID from session storage
      sessionStorage.removeItem("pendingOrderId");
      sessionStorage.removeItem("currentPaymentIntentId");

      // Clear cart properly based on user type
      if (isGuestUser) {
        // For guest users, clear local cart
        dispatch(clearCart());
        localStorage.removeItem("cartItems");
      } else if (currentUser?.uid) {
        // For authenticated users, clear Firebase cart
        await dispatch(clearFirebaseCartThunk(currentUser.uid));
        dispatch(clearCart());
      } else {
        // Fallback: clear local cart
        dispatch(clearCart());
      }

      // Clear guest user flag after successful order
      if (isGuestUser) {
        localStorage.removeItem("isGuestUser");
      }

      // Navigate to success page
      navigate("/order-success", {
        state: {
          orderDetails: orderData,
        },
      });
    } catch (error) {
      console.error("Order error:", error);
      toast.error(
        "Your payment was successful, but there was an issue processing your order. Our team will contact you."
      );
    }
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    toast.error(
      "Payment failed. Please try again or use a different payment method."
    );
    setOrderProcessing(false);
  };

  // Scroll to payment section if direct checkout
  useEffect(() => {
    if (isDirectCheckout && (isAuthenticated || isGuestUser) && !loading) {
      // Set default to card payment for direct checkout
      setPaymentMethod("card");

      // If we have a selected address, make sure form is updated
      if (selectedAddress) {
        updateFormWithAddress(selectedAddress);
      }

      // Scroll to payment section with a slight delay to ensure elements are rendered
      setTimeout(() => {
        const paymentSection = document.getElementById(
          "payment-method-section"
        );
        if (paymentSection) {
          paymentSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 500);
    }
  }, [
    isDirectCheckout,
    isAuthenticated,
    isGuestUser,
    loading,
    selectedAddress,
  ]);

  if (loading) {
    return <div className={styles.loadingContainer}>Loading checkout...</div>;
  }

  return (
    <>
      <div className={styles.container}>
        {/* Left Column: User Input */}
        <div className={styles.leftColumn}>
          {isGuestUser && (
            <div className={styles.guestBanner}>
              <p>
                You are checking out as a guest.{" "}
                <button
                  onClick={() => {
                    localStorage.removeItem("isGuestUser");
                    setShowAuthModal(true);
                  }}
                  className={styles.signInLink}
                >
                  Sign in
                </button>{" "}
                to access your account benefits.
              </p>
            </div>
          )}
          {/* Saved Addresses Section - Only show for authenticated users */}
          {!isGuestUser && savedAddresses.length > 0 && (
            <div className={styles.savedAddressesSection}>
              <h3 className={styles.sectionTitle}>Shipping Address</h3>

              <div className={styles.savedAddressSelector}>
                <div
                  className={styles.selectedAddressDisplay}
                  onClick={() => setShowAddressList(!showAddressList)}
                >
                  {selectedAddress ? (
                    <div className={styles.addressPreview}>
                      <p className={styles.addressName}>
                        <strong>
                          {selectedAddress.firstName} {selectedAddress.lastName}
                        </strong>
                        {selectedAddress.isDefault && (
                          <span className={styles.defaultBadge}>Default</span>
                        )}
                      </p>
                      <p className={styles.addressDetails}>
                        {selectedAddress.address1}
                        {selectedAddress.address2 &&
                          `, ${selectedAddress.address2}`}
                        ,{selectedAddress.city}, {selectedAddress.state}{" "}
                        {selectedAddress.zipCode}
                      </p>
                      <p className={styles.phoneNumber}>
                        <span>Phone:</span> {selectedAddress.phone}
                      </p>
                    </div>
                  ) : (
                    <p>Select a saved address</p>
                  )}
                  {showAddressList ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {showAddressList && (
                  <div className={styles.addressesList}>
                    {addressesLoading ? (
                      <p className={styles.addressesLoading}>
                        Loading addresses...
                      </p>
                    ) : (
                      <>
                        <p className={styles.dropdownHelper}>
                          Click on an address to select it
                        </p>
                        {savedAddresses.map((address) => (
                          <div
                            key={address.id}
                            className={`${styles.addressOption} ${
                              selectedAddress?.id === address.id
                                ? styles.selectedOption
                                : ""
                            }`}
                            onClick={() => handleSelectAddress(address)}
                          >
                            <p className={styles.addressName}>
                              <strong>
                                {address.firstName} {address.lastName}
                              </strong>
                              {address.isDefault && (
                                <span className={styles.defaultBadge}>
                                  Default
                                </span>
                              )}
                            </p>
                            <p className={styles.addressDetails}>
                              {address.address1}
                              {address.address2 && `, ${address.address2}`},
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                            <p className={styles.phoneNumber}>
                              <span>Phone:</span> {address.phone}
                            </p>
                          </div>
                        ))}
                      </>
                    )}

                    <button
                      className={styles.manageAddressesButton}
                      onClick={() => navigate("/account?tab=addresses")}
                    >
                      Manage Addresses
                    </button>
                  </div>
                )}
              </div>

              <p className={styles.useSavedAddress}>
                Using saved address. You can edit details below if needed.
              </p>
            </div>
          )}

          {/* Show a heading for guest users */}
          {isGuestUser && (
            <div className={styles.guestFormHeader}>
              <h3 className={styles.sectionTitle}>Shipping Information</h3>
              <p>Please enter your shipping details below</p>
            </div>
          )}

          <CustomerInfoForm
            formData={formData}
            setFormData={setFormData}
            errors={formErrors}
          />

          <div id="payment-method-section">
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onMethodSelect={(method) => {
                console.log("🎯 Payment method selector called with:", method);
                setPaymentMethod(method);
              }}
            />
          </div>

          {(() => {
            const shouldShowStripeForm =
              paymentMethod === "card" && stripePromise && clientSecret;
            console.log("🎨 Stripe form render check:", {
              paymentMethod,
              hasStripePromise: !!stripePromise,
              hasClientSecret: !!clientSecret,
              shouldShowStripeForm,
            });

            const amounts = calculateOrderAmounts();

            return shouldShowStripeForm ? (
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  amount={amounts.totalAmount} // in smallest currency unit (includes VAT)
                  clientSecret={clientSecret}
                  billingDetails={{
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                    address: {
                      line1: formData.address,
                      line2: formData.apartment,
                      city: formData.city,
                      state: formData.state,
                      postal_code: formData.zipCode,
                      country: getCountryCode(formData.country),
                    },
                  }}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </Elements>
            ) : null;
          })()}

          {paymentMethod === "cod" && (
            <button
              className={styles.payNowButton}
              onClick={handleCompleteCodOrder}
              disabled={orderProcessing}
            >
              {orderProcessing ? "Processing..." : "Complete Order"}
            </button>
          )}
        </div>

        {/* Right Column: Product Summary */}
        <div className={styles.rightColumn}>
          <OrderSummary />
        </div>
      </div>

      {/* Render the AuthModal properly as a modal with overlay */}
      {showAuthModal && (
        <div style={modalStyles.modalOverlay}>
          <div style={modalStyles.modalContent}>
            <AuthModal isOpen={showAuthModal} onClose={handleCloseAuthModal} />
          </div>
        </div>
      )}
    </>
  );
};

export default Buy;
