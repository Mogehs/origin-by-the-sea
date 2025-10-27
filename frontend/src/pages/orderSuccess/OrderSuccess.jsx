import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaCopy,
  FaBox,
  FaCreditCard,
  FaCalendarAlt,
  FaShoppingBag,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import styles from "./css/OrderSuccess.module.css";
import Receipt from "../../components/Receipt/Receipt";

const OrderSuccess = () => {
  const [copySuccess, setCopySuccess] = useState("");
  const orderIdRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Get guest checkout status from Redux store
  const { isGuestCheckout } = useSelector(
    (state) => state.guest || { isGuestCheckout: false }
  );

  // Add logging to verify guest status
  useEffect(() => {
    console.log("OrderSuccess - Guest Checkout Status:", isGuestCheckout);
  }, [isGuestCheckout]);

  const orderDetails = location.state?.orderDetails || {
    orderId: "Unknown",
    total: 0,
    items: [],
    paymentMethod: "Unknown",
    paymentStatus: "pending",
    status: "processing",
  };

  // Add console log to check order details
  useEffect(() => {
    console.log("OrderSuccess - Order Details:", orderDetails);
  }, [orderDetails]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  const copyOrderId = () => {
    if (orderIdRef.current) {
      navigator.clipboard
        .writeText(orderDetails.orderId)
        .then(() => {
          setCopySuccess("Order ID copied!");
          setTimeout(() => setCopySuccess(""), 3000);
        })
        .catch((err) => {
          setCopySuccess("Failed to copy");
          console.error("Copy failed: ", err);
        });
    }
  };

  // Handle track order button click
  const handleTrackOrder = () => {
    console.log(
      "Track order button clicked, isGuestCheckout:",
      isGuestCheckout
    );
    console.log("Order details being passed:", orderDetails);

    if (isGuestCheckout) {
      // For guest users, navigate to track order page with order details
      // Use URL state and also include orderId as a query parameter as backup
      navigate(`/track-order?orderId=${orderDetails.orderId}`, {
        state: {
          orderId: orderDetails.orderId,
          orderData: {
            ...orderDetails,
            id: orderDetails.orderId, // Ensure id is set for consistency
            items: orderDetails.items || [],
            total: orderDetails.total || 0,
            status: orderDetails.status || "processing",
            paymentMethod: orderDetails.paymentMethod || "Unknown",
            paymentStatus: orderDetails.paymentStatus || "pending",
          },
        },
      });
    } else {
      // For authenticated users, navigate to account page with orders tab
      navigate("/account?tab=orders");
    }
  };

  return (
    <div className={styles.successContainer}>
      <div className={styles.successHeader}>
        <FaCheckCircle className={styles.successIcon} />
        <h1 className={styles.successTitle}>Order Confirmed</h1>
        <p className={styles.successMessage}>
          Thank you for your purchase! Your order has been successfully placed
          and will be processed shortly.
          {orderDetails.paymentMethod === "cod"
            ? " You will pay when your order is delivered."
            : " Your payment was successful."}
        </p>
      </div>

      <div className={styles.orderIdCard}>
        <div className={styles.orderIdContent}>
          <div>
            <h3>Order Reference</h3>
            <p className={styles.orderId} ref={orderIdRef}>
              {orderDetails.orderId}
            </p>
          </div>
          <button
            className={styles.copyButton}
            onClick={copyOrderId}
            aria-label="Copy order ID"
          >
            <FaCopy /> Copy
          </button>
        </div>
        {copySuccess && <div className={styles.copySuccess}>{copySuccess}</div>}
        <div className={styles.orderIdMessage}>
          <strong>Important:</strong> Please save your Order ID to easily track
          your order status in the future.
        </div>
      </div>

      {isGuestCheckout && (
        <div className={styles.guestAlert}>
          <p>
            <strong>Guest checkout:</strong> Since you're checking out as a
            guest, you'll need your Order ID to track your order status.
          </p>
        </div>
      )}

      <div className={styles.orderDetailsCard}>
        <h2>Order Summary</h2>

        <div className={styles.orderMetaGrid}>
          <div className={styles.orderMetaItem}>
            <FaCalendarAlt />
            <div>
              <h4>Date</h4>
              <p>{formatDate(orderDetails.createdAt || new Date())}</p>
            </div>
          </div>

          <div className={styles.orderMetaItem}>
            <FaBox />
            <div>
              <h4>Status</h4>
              <p style={{ color: getStatusColor(orderDetails.status) }}>
                {getStatusDisplay(orderDetails.status)}
              </p>
            </div>
          </div>

          <div className={styles.orderMetaItem}>
            <FaCreditCard />
            <div>
              <h4>Payment</h4>
              <p>
                {orderDetails.paymentMethod === "cod"
                  ? "Cash On Delivery"
                  : "Credit/Debit Card"}
                <span className={styles.paymentStatus}>
                  ({orderDetails.paymentStatus === "paid" ? "Paid" : "Pending"})
                </span>
              </p>
            </div>
          </div>

          <div className={styles.orderMetaItem}>
            <FaShoppingBag />
            <div>
              <h4>Total</h4>
              <p className={styles.totalAmount}>
                AED {orderDetails.total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <h3>Items Purchased</h3>
        <div className={styles.productsList}>
          {orderDetails.items.map((item, index) => (
            <div key={index} className={styles.product}>
              <div
                className={styles.productImage}
                style={{ backgroundImage: `url(${item.image})` }}
              ></div>
              <div className={styles.productDetails}>
                <p className={styles.productTitle}>{item.name}</p>
                <div className={styles.productVariants}>
                  {item.size && (
                    <span className={styles.variantTag}>Size: {item.size}</span>
                  )}
                  {item.displayColor && (
                    <span
                      className={styles.colorDot}
                      style={{
                        background: item.displayColor,
                      }}
                      title={item.color}
                    ></span>
                  )}
                  {item.quantity > 1 && (
                    <span className={styles.quantityTag}>
                      Qty: {item.quantity}
                    </span>
                  )}
                </div>
                <p className={styles.productPrice}>AED {item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.trackOrderSection}>
        <h3>What's Next?</h3>
        {isGuestCheckout ? (
          <p>You can track your order status using your Order ID anytime.</p>
        ) : (
          <p>
            You can check your order status anytime in your account orders
            section.
          </p>
        )}
      </div>

      {/* Receipt Section */}
      <div className={styles.receiptSection}>
        <h2 className={styles.receiptSectionTitle}>Your Receipt</h2>
        <Receipt orderId={orderDetails.orderId} autoFetch={true} />
      </div>

      <div className={styles.successButtons}>
        <Link to="/" className={styles.primaryBtn}>
          Continue Shopping
        </Link>
        <button
          onClick={handleTrackOrder}
          className={`${styles.secondaryBtn} ${styles.trackOrderBtn}`}
        >
          {isGuestCheckout ? "Track Order" : "View Orders"}
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;
