const stripe = require("../config/stripe");
const { calculateVATBreakdown } = require("../utils/vatCalculator");
const { UAE_TRN } = require("../config/constants");
const Logger = require("../utils/logger");

class PaymentService {
  /**
   * Create a payment intent with Stripe
   */
  async createPaymentIntent({
    amount,
    currency,
    metadata,
    shipping,
    userId,
    cartItems,
  }) {
    try {
      if (!amount || !userId) {
        throw new Error("Missing required parameters: amount and userId");
      }

      const vatBreakdown = calculateVATBreakdown(amount);

      Logger.info("VAT Calculation:", {
        subtotal: `${(vatBreakdown.subtotalAmount / 100).toFixed(2)} ${
          currency?.toUpperCase() || "AED"
        }`,
        vat: `${(vatBreakdown.vatAmount / 100).toFixed(2)} ${
          currency?.toUpperCase() || "AED"
        } (5%)`,
        total: `${(vatBreakdown.totalAmount / 100).toFixed(2)} ${
          currency?.toUpperCase() || "AED"
        }`,
      });

      const enhancedMetadata = {
        ...metadata,
        userId,
        vatAmount: vatBreakdown.vatAmount.toString(),
        vatRate: vatBreakdown.vatPercentage,
        subtotalAmount: vatBreakdown.subtotalAmount.toString(),
        taxRegistrationNumber: UAE_TRN,
        taxCompliant: "UAE_VAT_5_PERCENT",
      };

      const paymentIntent = await stripe.paymentIntents.create({
        amount: vatBreakdown.totalAmount,
        currency: currency || "aed",
        metadata: enhancedMetadata,
        shipping,
        automatic_payment_methods: {
          enabled: true,
        },
        description: `Subtotal: ${(vatBreakdown.subtotalAmount / 100).toFixed(
          2
        )} + VAT (5%): ${(vatBreakdown.vatAmount / 100).toFixed(2)} = Total: ${(
          vatBreakdown.totalAmount / 100
        ).toFixed(2)} ${currency?.toUpperCase() || "AED"}`,
      });

      return {
        paymentIntent,
        vatBreakdown,
        enhancedMetadata,
      };
    } catch (error) {
      Logger.error("Error creating payment intent:", error);
      throw error;
    }
  }

  /**
   * Retrieve payment intent from Stripe
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      if (!paymentIntentId) {
        throw new Error("Payment intent ID is required");
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );
      return paymentIntent;
    } catch (error) {
      Logger.error("Error retrieving payment intent:", error);
      throw error;
    }
  }

  /**
   * Process refund for a payment
   */
  async processRefund({ paymentIntentId, amount, reason }) {
    try {
      if (!paymentIntentId) {
        throw new Error("Payment intent ID is required");
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (!paymentIntent.latest_charge) {
        throw new Error("No charge found for this payment");
      }

      const refund = await stripe.refunds.create({
        charge: paymentIntent.latest_charge,
        amount: amount || undefined,
        reason: reason || "requested_by_customer",
      });

      return { refund, paymentIntent };
    } catch (error) {
      Logger.error("Error processing refund:", error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
