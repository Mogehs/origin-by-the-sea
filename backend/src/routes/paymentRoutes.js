const express = require("express");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

// Create payment intent
router.post(
  "/create-intent",
  paymentController.createPaymentIntent.bind(paymentController)
);

// Get payment intent
router.get(
  "/:paymentIntentId",
  paymentController.getPaymentIntent.bind(paymentController)
);

// Process refund
router.post("/refund", paymentController.processRefund.bind(paymentController));

// Webhook handler (raw body needed)
router.post(
  "/webhook",
  paymentController.handleWebhook.bind(paymentController)
);

module.exports = router;
