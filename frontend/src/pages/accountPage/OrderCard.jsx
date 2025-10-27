import React, { useState } from "react";
import { format } from "date-fns";
import { FaChevronDown, FaChevronUp, FaCopy, FaCheck } from "react-icons/fa";
import styles from "./css/OrderCard.module.css";

const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format currency
  const formatCurrency = (amount) => {
    return `AED ${parseFloat(amount).toFixed(2)}`;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error); // Log the error
      return "Invalid date";
    }
  };

  const handleCopyOrderId = (e) => {
    e.stopPropagation(); // Prevent expanding the card when clicking copy
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return styles.statusPending;
      case "processing":
        return styles.statusProcessing;
      case "shipped":
        return styles.statusShipped;
      case "delivered":
        return styles.statusDelivered;
      case "cancelled":
        return styles.statusCancelled;
      default:
        return "";
    }
  };

  // Get payment status
  const getPaymentStatusText = (paymentStatus, paymentMethod) => {
    if (paymentMethod === "cod") {
      return "Cash On Delivery";
    }
    return paymentStatus === "paid" ? "Paid" : "Payment Pending";
  };

  return (
    <div className={styles.orderCard}>
      <div
        className={styles.orderHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={styles.orderBasicInfo}>
          <div className={styles.orderNumber}>
            <span className={styles.orderLabel}>Order ID:</span>
            <span className={styles.orderId}>{order.id}</span>
            <button
              className={styles.copyButton}
              onClick={handleCopyOrderId}
              title="Copy Order ID"
            >
              {copied ? <FaCheck /> : <FaCopy />}
            </button>
          </div>
          <div className={styles.orderDate}>{formatDate(order.createdAt)}</div>
        </div>

        <div className={styles.orderStatusSection}>
          <div
            className={`${styles.statusBadge} ${getStatusClass(order.status)}`}
          >
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
          </div>
          <div className={styles.orderTotal}>
            {formatCurrency(order.totalAmount / 100)}
          </div>
          <button className={styles.expandButton}>
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.orderDetails}>
          <div className={styles.orderItems}>
            <h4 className={styles.sectionTitle}>Items</h4>
            {order.items?.map((item, index) => (
              <div key={index} className={styles.orderItem}>
                <div className={styles.itemImageContainer}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className={styles.itemImage}
                    onError={(e) => {
                      e.target.src = "/images/placeholder.jpg";
                    }}
                  />
                </div>
                <div className={styles.itemDetails}>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemVariants}>
                    {item.size && <span>Size: {item.size}</span>}
                    {item.color && (
                      <span className={styles.colorDisplay}>
                        Color:
                        <span
                          className={styles.colorSwatch}
                          style={{
                            backgroundColor: item.displayColor || item.color,
                          }}
                        />
                      </span>
                    )}
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
                <div className={styles.itemPrice}>{item.price}</div>
              </div>
            ))}
          </div>

          <div className={styles.orderSummary}>
            <h4 className={styles.sectionTitle}>Order Summary</h4>
            <div className={styles.summaryRow}>
              <span>Payment Method</span>
              <span>
                {order.paymentMethod === "cod"
                  ? "Cash On Delivery"
                  : "Card Payment"}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span>Payment Status</span>
              <span>
                {getPaymentStatusText(order.paymentStatus, order.paymentMethod)}
              </span>
            </div>
            {order.shippingAddress && (
              <div className={styles.addressSection}>
                <h4 className={styles.sectionTitle}>Shipping Address</h4>
                <p className={styles.addressText}>
                  {order.shippingAddress.firstName}{" "}
                  {order.shippingAddress.lastName}
                  <br />
                  {order.shippingAddress.address}
                  {order.shippingAddress.apartment && (
                    <>
                      <br />
                      {order.shippingAddress.apartment}
                    </>
                  )}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zipCode}
                  <br />
                  {order.shippingAddress.country}
                </p>
              </div>
            )}
          </div>

          <div className={styles.orderTotal}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalAmount}>
                {formatCurrency(order.totalAmount / 100)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCard;
