const orderService = require("../services/orderService");
const receiptService = require("../services/receiptService");
const emailService = require("../services/emailService");
const Logger = require("../utils/logger");

class OrderController {
  /**
   * Get receipt for an order
   * GET /api/receipt/:orderId
   */
  async getReceipt(req, res) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({ error: "Order ID is required" });
      }

      const orderData = await orderService.getOrderById(orderId);

      const receiptSVG = receiptService.generateReceiptSVG(orderData, orderId);

      // Send email asynchronously without blocking response
      emailService
        .sendReceiptEmail(orderData, orderId, receiptSVG)
        .then((emailResult) => {
          if (emailResult.success) {
            Logger.info(`Receipt email queued for ${emailResult.recipient}`);
          } else {
            Logger.info(
              `Email not sent: ${emailResult.reason || emailResult.error}`
            );
          }
        })
        .catch((err) => {
          Logger.error("Email sending failed:", err);
        });

      const base64Receipt = Buffer.from(receiptSVG).toString("base64");

      res.json({
        success: true,
        orderId,
        receipt: base64Receipt,
        mimeType: "image/svg+xml",
        format: "svg",
        orderDetails: {
          orderId,
          total: orderData.totalAmount,
          currency: orderData.currency || "AED",
          status: orderData.status,
          createdAt: orderData.createdAt?.toDate?.() || new Date(),
          items: orderData.items || [],
          customerInfo: orderData.customerInfo || orderData.metadata,
          shipping: orderData.shipping,
        },
      });
    } catch (error) {
      Logger.error("Error in getReceipt:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Send order status email
   * POST /api/orders/:orderId/send-email
   */
  async sendOrderEmail(req, res) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: "Order ID is required",
        });
      }

      Logger.info(`Fetching order details for ${orderId}...`);

      // Fetch fresh order data from database
      const orderData = await orderService.getOrderById(orderId);

      if (!orderData) {
        return res.status(404).json({
          success: false,
          error: "Order not found",
        });
      }

      Logger.info(`Order found. Status: ${orderData.status}`);

      // Send status-based email
      const emailResult = await emailService.sendOrderStatusEmail(
        orderData,
        orderId
      );

      if (emailResult.success) {
        Logger.info(
          `Status email sent successfully to ${emailResult.recipient} for order ${orderId}`
        );

        return res.json({
          success: true,
          message: "Order status email sent successfully",
          orderId,
          status: orderData.status,
          recipient: emailResult.recipient,
          emailSent: true,
          messageId: emailResult.messageId,
          orderDetails: {
            orderId,
            status: orderData.status,
            total: orderData.totalAmount,
            currency: orderData.currency || "AED",
            createdAt: orderData.createdAt?.toDate?.() || new Date(),
            items: orderData.items || [],
          },
        });
      } else {
        Logger.warn(
          `Failed to send email for order ${orderId}: ${
            emailResult.reason || emailResult.error
          }`
        );

        return res.status(400).json({
          success: false,
          message: "Failed to send email",
          orderId,
          status: orderData.status,
          reason: emailResult.reason || emailResult.error,
          emailSent: false,
          orderDetails: {
            orderId,
            status: orderData.status,
            total: orderData.totalAmount,
            currency: orderData.currency || "AED",
            createdAt: orderData.createdAt?.toDate?.() || new Date(),
          },
        });
      }
    } catch (error) {
      Logger.error("Error in sendOrderEmail:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to send order email",
      });
    }
  }
}

module.exports = new OrderController();
