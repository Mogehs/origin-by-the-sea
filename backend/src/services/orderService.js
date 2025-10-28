const { db, admin } = require("../config/firebase");
const { UAE_TRN } = require("../config/constants");
const Logger = require("../utils/logger");

class OrderService {
  /**
   * Create a new order in Firestore
   */
  async createOrder({
    userId,
    cartItems,
    vatBreakdown,
    currency,
    paymentIntentId,
    shipping,
    metadata,
  }) {
    try {
      const orderRef = db.collection("orders").doc();
      const orderId = orderRef.id;

      await orderRef.set({
        userId,
        items: cartItems || [],
        totalAmount: vatBreakdown.totalAmount,
        subtotalAmount: vatBreakdown.subtotalAmount,
        vatAmount: vatBreakdown.vatAmount,
        vatRate: vatBreakdown.vatRate,
        vatPercentage: vatBreakdown.vatPercentage,
        taxRegistrationNumber: UAE_TRN,
        currency: currency || "aed",
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentIntentId,
        shipping: shipping || null,
        metadata,
      });

      Logger.info(`Order created: ${orderId}`);
      return orderId;
    } catch (error) {
      Logger.error("Error creating order:", error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId) {
    try {
      if (!orderId) {
        throw new Error("Order ID is required");
      }

      const orderRef = db.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }

      return { id: orderId, ...orderDoc.data() };
    } catch (error) {
      Logger.error("Error getting order:", error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status, paymentData = null) {
    try {
      if (!orderId) {
        Logger.warn("No orderId provided, skipping order update");
        return;
      }

      const orderRef = db.collection("orders").doc(orderId);
      const orderSnapshot = await orderRef.get();

      if (!orderSnapshot.exists) {
        Logger.warn(`Order ${orderId} not found in database`);
        return;
      }

      await orderRef.update({
        paymentStatus: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentData: paymentData || null,
      });

      // If payment succeeded, create payment record and clear cart
      if (status === "paid") {
        await this._handleSuccessfulPayment(orderId, paymentData);
      }

      Logger.info(`Updated order ${orderId} to status ${status}`);
    } catch (error) {
      Logger.error(`Error updating order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  async _handleSuccessfulPayment(orderId, paymentData) {
    try {
      // Create payment record
      await db.collection("payments").add({
        orderId,
        paymentIntentId: paymentData.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: "succeeded",
        paymentMethod: paymentData.payment_method_types[0],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: paymentData.metadata,
      });

      // Clear user cart if userId is provided
      if (paymentData.metadata.userId) {
        await this._clearUserCart(paymentData.metadata.userId);
      }
    } catch (error) {
      Logger.error("Error handling successful payment:", error);
      throw error;
    }
  }

  /**
   * Clear user cart
   */
  async _clearUserCart(userId) {
    try {
      const userCartRef = db.collection("users").doc(userId).collection("cart");
      const cartItems = await userCartRef.get();

      const batch = db.batch();
      cartItems.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      Logger.info(`Cleared cart for user ${userId}`);
    } catch (error) {
      Logger.error(`Error clearing cart for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update order with refund information
   */
  async updateOrderRefund(orderId, refundAmount, fullAmount, refundId) {
    try {
      const orderRef = db.collection("orders").doc(orderId);
      const refundStatus =
        refundAmount === fullAmount ? "refunded" : "partially_refunded";

      await orderRef.update({
        paymentStatus: refundStatus,
        refundId,
        refundAmount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      Logger.info(`Updated order ${orderId} with refund information`);
    } catch (error) {
      Logger.error("Error updating order refund:", error);
      throw error;
    }
  }

  /**
   * Handle refund event
   */
  async handleRefund(refundData) {
    try {
      const chargeId = refundData.id;
      const orderQuery = await db
        .collection("orders")
        .where("paymentData.latest_charge", "==", chargeId)
        .limit(1)
        .get();

      if (orderQuery.empty) {
        Logger.warn(`No order found for charge ${chargeId}`);
        return;
      }

      const orderDoc = orderQuery.docs[0];
      const orderId = orderDoc.id;

      const refundStatus =
        refundData.amount_refunded === refundData.amount
          ? "refunded"
          : "partially_refunded";

      await orderDoc.ref.update({
        paymentStatus: refundStatus,
        refundAmount: refundData.amount_refunded,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create refund record
      await db.collection("refunds").add({
        orderId,
        chargeId,
        amount: refundData.amount_refunded,
        currency: refundData.currency,
        reason: refundData.reason || null,
        status: refundData.status,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      Logger.info(`Processed refund for order ${orderId}`);
    } catch (error) {
      Logger.error("Error handling refund:", error);
      throw error;
    }
  }
}

module.exports = new OrderService();
