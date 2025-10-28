const paymentService = require("../services/paymentService");
const orderService = require("../services/orderService");
const stripe = require("../config/stripe");
const Logger = require("../utils/logger");

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

      // Create order with metadata including orderId
      const orderId = await orderService.createOrder({
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

      // Update metadata with orderId
      enhancedMetadata.orderId = orderId;

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId,
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
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      Logger.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          await orderService.updateOrderStatus(
            paymentIntent.metadata.orderId,
            "paid",
            paymentIntent
          );
          break;

        case "payment_intent.payment_failed":
          const failedPayment = event.data.object;
          await orderService.updateOrderStatus(
            failedPayment.metadata.orderId,
            "failed",
            failedPayment
          );
          break;

        case "charge.refunded":
          const refund = event.data.object;
          await orderService.handleRefund(refund);
          break;

        default:
          Logger.info(`Unhandled event type ${event.type}`);
      }

      res.send({ received: true });
    } catch (error) {
      Logger.error(`Error processing webhook ${event.type}:`, error);
      res.status(500).send({ error: "Webhook processing failed" });
    }
  }
}

module.exports = new PaymentController();
