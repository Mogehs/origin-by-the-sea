const { db, admin } = require("../config/firebase");
const { UAE_TRN } = require("../config/constants");
const Logger = require("../utils/logger");

class OrderService {
  /**
   * Create a temporary order in Firestore (for card payments)
   * This order will be moved to permanent orders collection after payment success
   */
  async createTempOrder({
    userId,
    cartItems,
    vatBreakdown,
    currency,
    paymentIntentId,
    shipping,
    metadata,
  }) {
    try {
      const tempOrderRef = db.collection("tempOrders").doc();
      const tempOrderId = tempOrderRef.id;

      // Temp order structure should be EXACTLY the same as permanent order
      const tempOrderData = {
        userId,
        items: cartItems || [],
        totalAmount: vatBreakdown.totalAmount,
        subtotalAmount: vatBreakdown.subtotalAmount,
        vatAmount: vatBreakdown.vatAmount,
        vatRate: vatBreakdown.vatRate,
        vatPercentage: vatBreakdown.vatPercentage,
        taxRegistrationNumber: UAE_TRN,
        currency: currency || "aed",
        status: "pending", // Order fulfillment status (pending, processing, shipped, delivered)
        paymentStatus: "pending", // Payment status (pending, paid, failed, refunded)
        paymentMethod: "card",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentIntentId,
        shipping: shipping || null,
        metadata,
      };

      await tempOrderRef.set(tempOrderData);

      Logger.info(
        `Temporary order created: ${tempOrderId} for Payment Intent: ${paymentIntentId}`
      );
      return tempOrderId;
    } catch (error) {
      Logger.error("Error creating temporary order:", error);
      throw error;
    }
  }

  /**
   * Create a new order in Firestore (for COD payments)
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
        status: "pending", // Order fulfillment status (pending, processing, shipped, delivered)
        paymentStatus: "pending", // Payment status (pending, paid, failed, refunded) - for COD
        paymentMethod: "cod",
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
   * Convert temporary order to permanent order after successful payment
   */
  async convertTempOrderToPermanent(tempOrderId, paymentData) {
    try {
      Logger.info(
        `🔄 Converting temp order ${tempOrderId} to permanent order...`
      );

      // Get the temporary order
      const tempOrderRef = db.collection("tempOrders").doc(tempOrderId);
      const tempOrderDoc = await tempOrderRef.get();

      if (!tempOrderDoc.exists) {
        Logger.error(`❌ Temporary order ${tempOrderId} not found`);
        throw new Error(`Temporary order ${tempOrderId} not found`);
      }

      const tempOrderData = tempOrderDoc.data();
      Logger.info(
        `✅ Temporary order ${tempOrderId} found, creating permanent order...`
      );

      // Create permanent order with same ID
      const orderRef = db.collection("orders").doc(tempOrderId);
      await orderRef.set({
        ...tempOrderData,
        // Keep status as is (pending) - status is for order fulfillment (pending → processing → shipped → delivered)
        // Only update paymentStatus - this is for payment tracking (pending → paid)
        paymentStatus: "paid", // Update ONLY payment status to paid
        paymentMethod: "card",
        paymentData,
        paymentConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      Logger.info(
        `✅ Permanent order ${tempOrderId} created successfully with paymentStatus: paid, order status: ${tempOrderData.status}`
      );

      // Delete the temporary order
      await tempOrderRef.delete();
      Logger.info(`✅ Temporary order ${tempOrderId} deleted`);

      return tempOrderId;
    } catch (error) {
      Logger.error(
        `❌ Error converting temp order ${tempOrderId} to permanent:`,
        error
      );
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
   * For card payments with status 'paid', it converts temp order to permanent
   */
  async updateOrderStatus(orderId, status, paymentData = null) {
    try {
      Logger.info(
        `📝 updateOrderStatus called with orderId: ${orderId}, status: ${status}`
      );

      if (!orderId) {
        Logger.warn("⚠️ No orderId provided, skipping order update");
        return;
      }

      // For successful payments, check if this is a temp order that needs conversion
      if (status === "paid") {
        Logger.info(
          `💳 Payment succeeded for order ${orderId}, checking if it's a temp order...`
        );

        // Check if order exists in tempOrders collection
        const tempOrderRef = db.collection("tempOrders").doc(orderId);
        const tempOrderSnapshot = await tempOrderRef.get();

        if (tempOrderSnapshot.exists) {
          Logger.info(
            `✅ Found temp order ${orderId}, converting to permanent order...`
          );
          await this.convertTempOrderToPermanent(orderId, paymentData);

          // Handle post-payment tasks
          Logger.info(`💰 Handling post-payment tasks for order ${orderId}...`);
          await this._handleSuccessfulPayment(orderId, paymentData);

          Logger.info(
            `🎉 Successfully converted temp order ${orderId} to permanent and completed post-payment tasks`
          );
          return;
        }
      }

      // For non-paid status or regular orders, update normally
      const orderRef = db.collection("orders").doc(orderId);
      Logger.info(`🔍 Fetching order ${orderId} from database...`);

      const orderSnapshot = await orderRef.get();

      if (!orderSnapshot.exists) {
        Logger.warn(`⚠️ Order ${orderId} not found in database`);
        return;
      }

      Logger.info(
        `✅ Order ${orderId} found. Current status: ${
          orderSnapshot.data().status
        }`
      );
      Logger.info(`🔄 Updating order ${orderId} to status: ${status}...`);

      await orderRef.update({
        paymentStatus: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentData: paymentData || null,
      });

      Logger.info(`✅ Order ${orderId} successfully updated in Firestore`);

      Logger.info(
        `🎉 Successfully updated order ${orderId} to status ${status}`
      );
    } catch (error) {
      Logger.error(`❌ Error updating order ${orderId}:`, error);
      Logger.error("Error stack:", error.stack);
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
