import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { getOrderById } from "../../services/orderService";
import styles from "./css/TrackOrder.module.css";
import { FaSearch, FaSpinner, FaCopy } from "react-icons/fa";

const TrackOrder = () => {
  const [orderId, setOrderId] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get guest checkout status from Redux store
  const { isGuestCheckout } = useSelector(
    (state) => state.guest || { isGuestCheckout: false }
  );

  // Check for order ID in URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderIdFromParams = params.get("orderId");

    if (orderIdFromParams) {
      console.log("Found order ID in URL params:", orderIdFromParams);
      setOrderId(orderIdFromParams);
      fetchOrderDetails(orderIdFromParams);
    }
  }, [location.search]);

  // Check if order ID is passed in location state (from OrderSuccess page)
  useEffect(() => {
    const orderIdFromState = location.state?.orderId;
    const orderDataFromState = location.state?.orderData;

    console.log("TrackOrder - Order ID from state:", orderIdFromState);
    console.log("TrackOrder - Order data from state:", orderDataFromState);

    if (orderIdFromState) {
      setOrderId(orderIdFromState);

      if (orderDataFromState) {
        // If complete order data is available in state, use it directly
        setOrderDetails({
          id: orderIdFromState,
          ...orderDataFromState,
          createdAt: orderDataFromState.createdAt || new Date(),
        });
        console.log("Using order data from state:", orderDataFromState);
      } else {
        // Otherwise fetch the data from Firestore
        console.log(
          "Fetching order data from Firestore for ID:",
          orderIdFromState
        );
        fetchOrderDetails(orderIdFromState);
      }
    }
  }, []); // Run only on initial mount, not on location.state changes

  const fetchOrderDetails = async (id) => {
    if (!id || !id.trim()) {
      return;
    }

    setLoading(true);
    setError("");
    setOrderDetails(null);

    try {
      // Use the getOrderById service function instead of directly querying Firestore
      const { order, error } = await getOrderById(id);

      if (error) {
        setError("Order not found. Please check your order ID and try again.");
        return;
      }

      setOrderDetails(order);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Failed to fetch order details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    fetchOrderDetails(orderId);
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "processing":
        return "Processing";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return "Processing";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "processing":
        return "#f59e0b"; // Amber
      case "shipped":
        return "#3b82f6"; // Blue
      case "delivered":
        return "#10b981"; // Green
      case "cancelled":
        return "#ef4444"; // Red
      default:
        return "#f59e0b"; // Amber
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCopyOrderId = () => {
    if (orderDetails) {
      const id = orderDetails.id || orderDetails.orderId;
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.trackOrderBox}>
        <h1 className={styles.title}>Track Your Order</h1>

        {isGuestCheckout ? (
          <div className={styles.guestMessage}>
            <p>
              You're checking out as a guest. Please enter your order ID to
              track your order status.
            </p>
            <p>
              If you don't have your order ID, please check your order
              confirmation email or the order success page.
            </p>
          </div>
        ) : (
          <div className={styles.authenticatedMessage}>
            <p>
              You can track your order status here or view all your orders in
              your account.
            </p>
            <button
              className={styles.viewAllOrdersBtn}
              onClick={() => navigate("/account?tab=orders")}
            >
              View All Orders
            </button>
          </div>
        )}

        <form onSubmit={handleTrackOrder} className={styles.trackForm}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter your order ID"
              className={styles.orderInput}
            />
            <button
              type="submit"
              className={styles.trackButton}
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className={styles.spinner} />
              ) : (
                <FaSearch />
              )}
              Track Order
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </form>

        {orderDetails && (
          <div className={styles.orderDetails}>
            <h2>Order Details</h2>
            <div className={styles.orderIdSection}>
              <span className={styles.orderIdLabel}>Order ID:</span>
              <span className={styles.orderId}>
                {orderDetails.id || orderDetails.orderId}
              </span>
              <button
                className={styles.copyButton}
                onClick={handleCopyOrderId}
                title="Copy Order ID"
              >
                {copied ? "Copied!" : <FaCopy />}
              </button>
            </div>
            <div className={styles.orderInfo}>
              <p>
                <strong>Date:</strong> {formatDate(orderDetails.createdAt)}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={styles.status}
                  style={{ color: getStatusColor(orderDetails.status) }}
                >
                  {getStatusDisplay(orderDetails.status)}
                </span>
              </p>
              <p>
                <strong>Payment Method:</strong>{" "}
                {orderDetails.paymentMethod === "cod"
                  ? "Cash On Delivery"
                  : "Credit/Debit Card"}
              </p>
              <p>
                <strong>Payment Status:</strong>{" "}
                {orderDetails.paymentStatus === "paid" ? "Paid" : "Pending"}
              </p>
              <p>
                <strong>Total Amount:</strong> AED{" "}
                {orderDetails.totalAmount
                  ? (orderDetails.totalAmount / 100).toFixed(2)
                  : "0.00"}
              </p>
            </div>

            {orderDetails.shippingAddress && (
              <div className={styles.shippingSection}>
                <h3>Shipping Address</h3>
                <div className={styles.addressInfo}>
                  <p>
                    {orderDetails.shippingAddress.firstName}{" "}
                    {orderDetails.shippingAddress.lastName}
                  </p>
                  <p>{orderDetails.shippingAddress.address}</p>
                  {orderDetails.shippingAddress.apartment && (
                    <p>{orderDetails.shippingAddress.apartment}</p>
                  )}
                  <p>
                    {orderDetails.shippingAddress.city},{" "}
                    {orderDetails.shippingAddress.state}{" "}
                    {orderDetails.shippingAddress.zipCode}
                  </p>
                  <p>{orderDetails.shippingAddress.country}</p>
                </div>
              </div>
            )}

            <h3>Items</h3>
            <div className={styles.productsList}>
              {orderDetails.items &&
                orderDetails.items.map((item, index) => (
                  <div key={index} className={styles.product}>
                    <div
                      className={styles.productImage}
                      style={{ backgroundImage: `url(${item.image})` }}
                    ></div>
                    <div className={styles.productDetails}>
                      <p className={styles.productTitle}>{item.name}</p>
                      <p className={styles.productVariants}>
                        {item.size && <span>Size: {item.size}</span>}
                        {item.displayColor && (
                          <span
                            style={{
                              display: "inline-block",
                              width: "12px",
                              height: "12px",
                              background: item.displayColor,
                              marginLeft: "5px",
                              borderRadius: "50%",
                            }}
                          ></span>
                        )}
                        {item.quantity > 1 && <span> × {item.quantity}</span>}
                      </p>
                      <p className={styles.productPrice}>{item.price}</p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Return to shopping or account button */}
            <div className={styles.actionButtons}>
              <button
                className={styles.continueShoppingBtn}
                onClick={() => navigate("/shop")}
              >
                Continue Shopping
              </button>
              {!isGuestCheckout && (
                <button
                  className={styles.viewAllOrdersBtn}
                  onClick={() => navigate("/account?tab=orders")}
                >
                  View All Orders
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
