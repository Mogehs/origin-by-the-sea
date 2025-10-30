const paymentService = require("../services/paymentService");
const orderService = require("../services/orderService");
const stripe = require("../config/stripe");
const Logger = require("../utils/logger");
const { db } = require("../config/firebase");

class PaymentController {
  /**
   * Create payment intent
   * POST /api/payment/create-intent
   */
  async createPaymentIntent(req, res) {
    try {
      const { amount, currency, metadata, shipping, userId, cartItems } =
        req.body;

      if (!amount || !userId) {
        return res.status(400).json({
          error: "Missing required parameters: amount and userId",
        });
      }

      // Create payment intent
      const { paymentIntent, vatBreakdown, enhancedMetadata } =
        await paymentService.createPaymentIntent({
          amount,
          currency,
          metadata,
          shipping,
          userId,
          cartItems,
        });

      // Create TEMPORARY order (will be converted to permanent after webhook confirmation)
      const tempOrderId = await orderService.createTempOrder({
        userId,
        cartItems,
        vatBreakdown,
        currency,
        paymentIntentId: paymentIntent.id,
        shipping,
        metadata: {
          ...enhancedMetadata,
          orderId: enhancedMetadata.orderId || null,
        },
      });

      Logger.info(
        `✅ Temporary order created with ID: ${tempOrderId} for Payment Intent: ${paymentIntent.id}`
      );

      // Update the payment intent metadata with the tempOrderId so webhook can access it
      try {
        await stripe.paymentIntents.update(paymentIntent.id, {
          metadata: {
            ...enhancedMetadata,
            orderId: tempOrderId, // This is actually a tempOrderId, webhook will handle conversion
          },
        });
        Logger.info(
          `✅ Payment Intent ${paymentIntent.id} metadata updated with tempOrderId: ${tempOrderId}`
        );
      } catch (updateError) {
        Logger.error(
          `❌ Failed to update Payment Intent metadata:`,
          updateError
        );
      }

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId: tempOrderId, // Return tempOrderId as orderId for frontend
      });
    } catch (error) {
      Logger.error("Error in createPaymentIntent:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get payment intent
   * GET /api/payment/:paymentIntentId
   */
  async getPaymentIntent(req, res) {
    try {
      const { paymentIntentId } = req.params;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID is required" });
      }

      const paymentIntent = await paymentService.getPaymentIntent(
        paymentIntentId
      );

      res.json({
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        created: paymentIntent.created,
        metadata: paymentIntent.metadata,
      });
    } catch (error) {
      Logger.error("Error in getPaymentIntent:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Process refund
   * POST /api/payment/refund
   */
  async processRefund(req, res) {
    try {
      const { paymentIntentId, amount, reason } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID is required" });
      }

      const { refund, paymentIntent } = await paymentService.processRefund({
        paymentIntentId,
        amount,
        reason,
      });

      // Update order with refund info
      if (paymentIntent.metadata.orderId) {
        await orderService.updateOrderRefund(
          paymentIntent.metadata.orderId,
          amount || paymentIntent.amount,
          paymentIntent.amount,
          refund.id
        );
      }

      res.json({
        success: true,
        refundId: refund.id,
        status: refund.status,
      });
    } catch (error) {
      Logger.error("Error in processRefund:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Webhook handler
   * POST /api/payment/webhook
   */
  async handleWebhook(req, res) {
    Logger.info("🔔 Webhook received!");

    const sig = req.headers["stripe-signature"];

    if (!sig) {
      Logger.error("❌ No Stripe signature found in webhook request");
      return res.status(400).send("No Stripe signature found");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      Logger.info(
        `✅ Webhook signature verified. Event type: ${event.type}, Event ID: ${event.id}`
      );
    } catch (err) {
      Logger.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      Logger.info(`🎯 Processing webhook event: ${event.type}`);

      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          Logger.info(
            `💳 Payment succeeded for Payment Intent: ${paymentIntent.id}`
          );
          Logger.info(
            `📦 Temp Order ID from metadata: ${paymentIntent.metadata.orderId}`
          );

          if (!paymentIntent.metadata.orderId) {
            Logger.error("❌ No orderId found in payment intent metadata!");
            Logger.info(
              "Payment Intent metadata:",
              JSON.stringify(paymentIntent.metadata, null, 2)
            );
          } else {
            Logger.info(
              `🔄 Converting temp order ${paymentIntent.metadata.orderId} to permanent order and updating to 'paid' status...`
            );
            // This will convert temp order to permanent and update status
            await orderService.updateOrderStatus(
              paymentIntent.metadata.orderId,
              "paid",
              paymentIntent
            );
            Logger.info(
              `✅ Temp order ${paymentIntent.metadata.orderId} successfully converted to permanent order with 'paid' status`
            );
          }
          break;

        case "payment_intent.payment_failed":
          const failedPayment = event.data.object;
          Logger.info(
            `❌ Payment failed for Payment Intent: ${failedPayment.id}`
          );
          Logger.info(
            `📦 Temp Order ID from metadata: ${failedPayment.metadata.orderId}`
          );

          if (failedPayment.metadata.orderId) {
            // Delete the temp order since payment failed
            try {
              const tempOrderRef = db
                .collection("tempOrders")
                .doc(failedPayment.metadata.orderId);
              const tempOrderDoc = await tempOrderRef.get();

              if (tempOrderDoc.exists) {
                await tempOrderRef.delete();
                Logger.info(
                  `✅ Temp order ${failedPayment.metadata.orderId} deleted after payment failure`
                );
              } else {
                Logger.warn(
                  `⚠️ Temp order ${failedPayment.metadata.orderId} not found, may have already been processed`
                );
              }
            } catch (deleteError) {
              Logger.error(
                `❌ Error deleting temp order ${failedPayment.metadata.orderId}:`,
                deleteError
              );
            }
          }
          break;

        case "charge.refunded":
          const refund = event.data.object;
          Logger.info(`💰 Refund processed for charge: ${refund.id}`);
          await orderService.handleRefund(refund);
          break;

        default:
          Logger.info(`ℹ️ Unhandled event type ${event.type}`);
      }

      Logger.info(`✅ Webhook ${event.type} processed successfully`);
      res.send({ received: true });
    } catch (error) {
      Logger.error(`❌ Error processing webhook ${event.type}:`, error);
      Logger.error("Error stack:", error.stack);
      res.status(500).send({ error: "Webhook processing failed" });
    }
  }
}

module.exports = new PaymentController();
