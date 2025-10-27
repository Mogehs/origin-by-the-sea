const puppeteer = require("puppeteer");
const transporter = require("../config/email");
const { UAE_TRN } = require("../config/constants");
const Logger = require("../utils/logger");

class EmailService {
  /**
   * Convert SVG to PDF using Puppeteer
   */
  async convertSVGToPDF(svgContent) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });

      const page = await browser.newPage();

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; }
    svg { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      const dimensions = await page.evaluate(() => {
        const svg = document.querySelector("svg");
        return {
          width: svg.getAttribute("width") || svg.viewBox.baseVal.width,
          height: svg.getAttribute("height") || svg.viewBox.baseVal.height,
        };
      });

      await page.setViewport({
        width: parseInt(dimensions.width),
        height: parseInt(dimensions.height),
        deviceScaleFactor: 2,
      });

      const pdfBuffer = await page.pdf({
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        printBackground: true,
        preferCSSPageSize: true,
      });

      await browser.close();
      return pdfBuffer;
    } catch (error) {
      Logger.error("Error converting SVG to PDF:", error);
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  }

  /**
   * Send receipt email with PDF attachment
   */
  async sendReceiptEmail(orderData, orderId, receiptSVG) {
    try {
      const isGuest =
        orderData.isGuest ||
        orderData.metadata?.isGuest ||
        orderData.metadata?.isGuestCheckout ||
        orderData.isGuestOrder ||
        false;

      const customerEmail =
        orderData.customerInfo?.email ||
        orderData.metadata?.email ||
        orderData.metadata?.customerEmail ||
        orderData.metadata?.userEmail ||
        orderData.email;

      Logger.info(`Email check for order ${orderId}:`, {
        isGuest,
        hasEmail: !!customerEmail,
        email: customerEmail ? `${customerEmail.substring(0, 3)}***` : "None",
        userId: orderData.userId || orderData.metadata?.userId || "unknown",
      });

      if (isGuest || !customerEmail) {
        Logger.info(
          `Skipping email for guest order ${orderId} or missing email`
        );
        return { success: false, reason: "Guest order or no email" };
      }

      const customerName =
        orderData.customerInfo?.name ||
        orderData.metadata?.customerName ||
        "Valued Customer";

      const subtotal = ((orderData.subtotalAmount || 0) / 100).toFixed(2);
      const vat = ((orderData.vatAmount || 0) / 100).toFixed(2);
      const total = (orderData.totalAmount / 100).toFixed(2);
      const currency = (orderData.currency || "AED").toUpperCase();
      const trn = orderData.taxRegistrationNumber || UAE_TRN;
      const orderDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      Logger.info(`Converting receipt SVG to PDF for order ${orderId}...`);

      const pdfBuffer = await this.convertSVGToPDF(receiptSVG);

      Logger.info(
        `PDF generated successfully (${pdfBuffer.length} bytes) for order ${orderId}`
      );

      const emailHTML = this._buildEmailHTML({
        customerName,
        orderId,
        orderDate,
        currency,
        subtotal,
        vat,
        total,
        trn,
      });

      const mailOptions = {
        from: {
          name: "Origins By The Sea",
          address: process.env.SMTP_USER,
        },
        to: customerEmail,
        subject: `Your Order Receipt - Order #${orderId.toUpperCase()}`,
        html: emailHTML,
        attachments: [
          {
            filename: `Tax-Invoice-${orderId}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };

      Logger.info(
        `Sending receipt email with PDF attachment to: ${customerEmail}`
      );

      const info = await transporter.sendMail(mailOptions);

      Logger.info(`Receipt email sent successfully to ${customerEmail}`);
      Logger.info(`PDF attachment: Tax-Invoice-${orderId}.pdf`);
      Logger.info(`Message ID: ${info.messageId}`);

      return {
        success: true,
        recipient: customerEmail,
        orderId: orderId,
        messageId: info.messageId,
      };
    } catch (error) {
      Logger.error("Error sending receipt email:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order status email based on order status
   */
  async sendOrderStatusEmail(orderData, orderId) {
    try {
      const customerEmail =
        orderData.customerInfo?.email ||
        orderData.metadata?.email ||
        orderData.metadata?.customerEmail ||
        orderData.metadata?.userEmail ||
        orderData.email;

      if (!customerEmail) {
        Logger.warn(`No email found for order ${orderId}`);
        return { success: false, reason: "No email provided" };
      }

      const customerName =
        orderData.customerInfo?.name ||
        orderData.customerInfo?.customerName ||
        orderData.metadata?.customerName ||
        orderData.shipping?.name ||
        "Valued Customer";

      const orderStatus = orderData.status || "pending";
      const total = ((orderData.totalAmount || 0) / 100).toFixed(2);
      const currency = (orderData.currency || "AED").toUpperCase();
      const orderDate = orderData.createdAt?.toDate?.()
        ? orderData.createdAt.toDate().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

      // Generate email based on status
      const emailConfig = this._getEmailConfigByStatus(orderStatus);
      const emailHTML = this._buildStatusEmailHTML({
        customerName,
        orderId,
        orderDate,
        currency,
        total,
        status: orderStatus,
        emailConfig,
        orderData,
      });

      const mailOptions = {
        from: {
          name: "Origins By The Sea",
          address: process.env.SMTP_USER,
        },
        to: customerEmail,
        subject: emailConfig.subject.replace(
          "{orderId}",
          orderId.toUpperCase()
        ),
        html: emailHTML,
      };

      Logger.info(
        `Sending ${orderStatus} status email to: ${customerEmail} for order ${orderId}`
      );

      const info = await transporter.sendMail(mailOptions);

      Logger.info(
        `Status email sent successfully to ${customerEmail} - Status: ${orderStatus}`
      );
      Logger.info(`Message ID: ${info.messageId}`);

      return {
        success: true,
        recipient: customerEmail,
        orderId: orderId,
        status: orderStatus,
        messageId: info.messageId,
      };
    } catch (error) {
      Logger.error("Error sending order status email:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get email configuration based on order status
   */
  _getEmailConfigByStatus(status) {
    const configs = {
      pending: {
        subject: "Order Confirmation - Order #{orderId}",
        title: "ORDER CONFIRMATION",
        heading: "Thank You for Your Order!",
        message:
          "We've received your order and it's being processed. You'll receive another email once your order has been confirmed.",
        statusColor: "#f59e0b",
        statusBg: "#fef3c7",
        statusText: "PENDING",
        icon: "⏳",
      },
      confirmed: {
        subject: "Order Confirmed - Order #{orderId}",
        title: "ORDER CONFIRMED",
        heading: "Your Order is Confirmed!",
        message:
          "Great news! Your order has been confirmed and is being prepared for shipment. We'll notify you once it's on its way.",
        statusColor: "#3b82f6",
        statusBg: "#dbeafe",
        statusText: "CONFIRMED",
        icon: "✓",
      },
      paid: {
        subject: "Payment Received - Order #{orderId}",
        title: "PAYMENT RECEIVED",
        heading: "Payment Successfully Processed!",
        message:
          "Your payment has been received and confirmed. Your order is now being prepared for shipment.",
        statusColor: "#10b981",
        statusBg: "#d1fae5",
        statusText: "PAID",
        icon: "✓",
      },
      processing: {
        subject: "Order Processing - Order #{orderId}",
        title: "ORDER PROCESSING",
        heading: "We're Preparing Your Order!",
        message:
          "Your order is currently being processed and prepared. We're working hard to get it ready for shipment.",
        statusColor: "#8b5cf6",
        statusBg: "#ede9fe",
        statusText: "PROCESSING",
        icon: "📦",
      },
      shipped: {
        subject: "Order Shipped - Order #{orderId}",
        title: "ORDER SHIPPED",
        heading: "Your Order is On Its Way!",
        message:
          "Exciting news! Your order has been shipped and is on its way to you. Track your shipment using the link below.",
        statusColor: "#0ea5e9",
        statusBg: "#e0f2fe",
        statusText: "SHIPPED",
        icon: "🚚",
      },
      delivered: {
        subject: "Order Delivered - Order #{orderId}",
        title: "ORDER DELIVERED",
        heading: "Your Order Has Been Delivered!",
        message:
          "Your order has been successfully delivered. We hope you love your new beachwear! Thank you for shopping with us.",
        statusColor: "#10b981",
        statusBg: "#d1fae5",
        statusText: "DELIVERED",
        icon: "🎉",
      },
      cancelled: {
        subject: "Order Cancelled - Order #{orderId}",
        title: "ORDER CANCELLED",
        heading: "Your Order Has Been Cancelled",
        message:
          "Your order has been cancelled as requested. If you have any questions or this was done in error, please contact our support team.",
        statusColor: "#ef4444",
        statusBg: "#fee2e2",
        statusText: "CANCELLED",
        icon: "✕",
      },
      refunded: {
        subject: "Order Refunded - Order #{orderId}",
        title: "REFUND PROCESSED",
        heading: "Your Refund Has Been Processed",
        message:
          "Your refund has been successfully processed. The amount will be credited to your original payment method within 5-10 business days.",
        statusColor: "#f59e0b",
        statusBg: "#fef3c7",
        statusText: "REFUNDED",
        icon: "💰",
      },
      partially_refunded: {
        subject: "Partial Refund Processed - Order #{orderId}",
        title: "PARTIAL REFUND PROCESSED",
        heading: "Your Partial Refund Has Been Processed",
        message:
          "A partial refund has been processed for your order. The amount will be credited to your original payment method within 5-10 business days.",
        statusColor: "#f59e0b",
        statusBg: "#fef3c7",
        statusText: "PARTIALLY REFUNDED",
        icon: "💰",
      },
    };

    return (
      configs[status] || {
        subject: "Order Update - Order #{orderId}",
        title: "ORDER UPDATE",
        heading: "Order Status Update",
        message: "There has been an update to your order status.",
        statusColor: "#6b7280",
        statusBg: "#f3f4f6",
        statusText: status.toUpperCase(),
        icon: "ℹ️",
      }
    );
  }

  /**
   * Build status-based email HTML template
   */
  _buildStatusEmailHTML(data) {
    const {
      customerName,
      orderId,
      orderDate,
      currency,
      total,
      emailConfig,
      orderData,
    } = data;
    const frontendUrl =
      process.env.FRONTEND_URL?.split(",")[0] || "https://originbythesea.com";

    const items = orderData.items || [];
    const itemsHTML = items
      .map(
        (item, index) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 15px; text-align: left;">
            <strong style="color: #1f2937; font-size: 14px;">${
              item.name
            }</strong>
            ${
              item.size
                ? `<br/><span style="color: #6b7280; font-size: 12px;">Size: ${item.size}</span>`
                : ""
            }
            ${
              item.color
                ? `<br/><span style="color: #6b7280; font-size: 12px;">Color: ${item.color}</span>`
                : ""
            }
          </td>
          <td style="padding: 15px; text-align: center; color: #374151;">×${
            item.quantity || 1
          }</td>
          <td style="padding: 15px; text-align: right; color: #1f2937; font-weight: 600;">${currency} ${(
          (parseFloat(String(item.price).replace(/[^0-9.]/g, "")) || 0) *
          (item.quantity || 1)
        ).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const subtotal = ((orderData.subtotalAmount || 0) / 100).toFixed(2);
    const vat = ((orderData.vatAmount || 0) / 100).toFixed(2);
    const shippingInfo = orderData.shipping || {};

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #e6994b 0%, #d78a3f 50%, #c97a35 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 1px; }
    .header p { margin: 10px 0 0; font-size: 14px; opacity: 0.9; }
    .status-badge { display: inline-block; background-color: ${
      emailConfig.statusBg
    }; color: ${
      emailConfig.statusColor
    }; padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 14px; margin: 20px 0; }
    .icon { font-size: 48px; margin: 20px 0; }
    .content { padding: 40px 20px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
    .heading { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 15px; text-align: center; }
    .message { font-size: 16px; color: #6b7280; line-height: 1.6; margin-bottom: 30px; text-align: center; }
    .order-info { background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .order-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .order-row:last-child { border-bottom: none; }
    .order-label { color: #6b7280; font-size: 14px; }
    .order-value { color: #1f2937; font-weight: 600; font-size: 14px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .items-table th { background-color: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .items-table td { padding: 15px; }
    .total-row { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 10px; display: flex; justify-content: space-between; align-items: center; }
    .total-label { color: #92400e; font-size: 16px; font-weight: 700; }
    .total-value { color: #92400e; font-size: 20px; font-weight: 800; }
    .button { display: inline-block; background: linear-gradient(135deg, #e6994b, #c97a35); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; color: #9ca3af; font-size: 12px; }
    .footer p { margin: 5px 0; }
    .shipping-info { background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
    .shipping-info p { margin: 5px 0; font-size: 13px; color: #0c4a6e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emailConfig.title}</h1>
      <p>Origins By The Sea</p>
      <p>Luxury Beachwear Collection</p>
    </div>
    
    <div class="content">
      <div style="text-align: center;">
        <div class="icon">${emailConfig.icon}</div>
        <div class="status-badge">${emailConfig.statusText}</div>
      </div>
      
      <div class="greeting">Dear ${customerName},</div>
      
      <div class="heading">${emailConfig.heading}</div>
      
      <div class="message">
        ${emailConfig.message}
      </div>
      
      <div class="order-info">
        <h3 style="margin-top: 0; color: #1f2937;">Order Details</h3>
        <div class="order-row">
          <span class="order-label">Order ID:</span>
          <span class="order-value" style="font-family: monospace;">${orderId.toUpperCase()}</span>
        </div>
        <div class="order-row">
          <span class="order-label">Order Date:</span>
          <span class="order-value">${orderDate}</span>
        </div>
        <div class="order-row">
          <span class="order-label">Status:</span>
          <span class="order-value" style="color: ${
            emailConfig.statusColor
          };">${emailConfig.statusText}</span>
        </div>
      </div>
      
      ${
        items.length > 0
          ? `
      <h3 style="color: #1f2937; margin-top: 30px;">Order Items</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align: center;">Quantity</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      
      <div style="padding: 0 20px;">
        <div class="order-row">
          <span class="order-label">Subtotal:</span>
          <span class="order-value">${currency} ${subtotal}</span>
        </div>
        <div class="order-row">
          <span class="order-label">VAT (5%):</span>
          <span class="order-value">${currency} ${vat}</span>
        </div>
        <div class="order-row">
          <span class="order-label">Shipping:</span>
          <span class="order-value" style="color: #10b981;">FREE</span>
        </div>
      </div>
      
      <div class="total-row">
        <span class="total-label">Total:</span>
        <span class="total-value">${currency} ${total}</span>
      </div>
      `
          : ""
      }
      
      ${
        shippingInfo.address
          ? `
      <div class="shipping-info">
        <p><strong>Shipping Address:</strong></p>
        <p>${shippingInfo.name || ""}</p>
        <p>${shippingInfo.address.line1 || ""}</p>
        ${
          shippingInfo.address.line2
            ? `<p>${shippingInfo.address.line2}</p>`
            : ""
        }
        <p>${shippingInfo.address.city || ""}, ${
              shippingInfo.address.state || ""
            } ${shippingInfo.address.postal_code || ""}</p>
        <p>${shippingInfo.address.country || ""}</p>
        ${shippingInfo.phone ? `<p>Phone: ${shippingInfo.phone}</p>` : ""}
      </div>
      `
          : ""
      }
      
      <div style="text-align: center;">
        <a href="${frontendUrl}/track-order?orderId=${orderId}" class="button">
          Track Your Order
        </a>
      </div>
      
      <div class="message">
        If you have any questions about your order, please don't hesitate to contact our support team.
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Origins By The Sea</strong></p>
      <p>For support, visit originbythesea.com or email support@originbythesea.com</p>
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>&copy; ${new Date().getFullYear()} Origins By The Sea. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Build email HTML template
   */
  _buildEmailHTML(data) {
    const {
      customerName,
      orderId,
      orderDate,
      currency,
      subtotal,
      vat,
      total,
      trn,
    } = data;
    const frontendUrl =
      process.env.FRONTEND_URL?.split(",")[0] || "https://originbythesea.com";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #e6994b 0%, #d78a3f 50%, #c97a35 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 1px; }
    .header p { margin: 10px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 40px 20px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
    .message { font-size: 16px; color: #6b7280; line-height: 1.6; margin-bottom: 30px; }
    .order-summary { background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .order-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .order-row:last-child { border-bottom: none; }
    .order-label { color: #6b7280; font-size: 14px; }
    .order-value { color: #1f2937; font-weight: 600; font-size: 14px; }
    .total-row { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 10px; }
    .total-row .order-label { color: #92400e; font-size: 16px; font-weight: 700; }
    .total-row .order-value { color: #92400e; font-size: 18px; font-weight: 800; }
    .button { display: inline-block; background: linear-gradient(135deg, #e6994b, #c97a35); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; color: #9ca3af; font-size: 12px; }
    .footer p { margin: 5px 0; }
    .tax-info { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e6994b; }
    .tax-info p { margin: 5px 0; font-size: 13px; color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TAX INVOICE</h1>
      <p>Origins By The Sea</p>
      <p>Luxury Beachwear Collection</p>
    </div>
    
    <div class="content">
      <div class="greeting">Dear ${customerName},</div>
      
      <div class="message">
        Thank you for your purchase! Your order has been successfully confirmed and payment has been received.
        Your tax invoice is attached to this email.
      </div>
      
      <div class="order-summary">
        <h3 style="margin-top: 0; color: #1f2937;">Order Summary</h3>
        <div class="order-row">
          <span class="order-label">Order ID:</span>
          <span class="order-value">${orderId.toUpperCase()}</span>
        </div>
        <div class="order-row">
          <span class="order-label">Order Date:</span>
          <span class="order-value">${orderDate}</span>
        </div>
        <div class="order-row">
          <span class="order-label">Subtotal (Before VAT):</span>
          <span class="order-value">${currency} ${subtotal}</span>
        </div>
        <div class="order-row">
          <span class="order-label">VAT (5%):</span>
          <span class="order-value">${currency} ${vat}</span>
        </div>
        <div class="total-row">
          <div class="order-row" style="border: none;">
            <span class="order-label">Total (Including VAT):</span>
            <span class="order-value">${currency} ${total}</span>
          </div>
        </div>
      </div>
      
      <div class="tax-info">
        <p><strong>Tax Compliance Information</strong></p>
        <p>Tax Registration Number (TRN): ${trn}</p>
        <p>This is a valid tax invoice as per UAE Federal Tax Authority regulations.</p>
        <p>VAT is calculated at 5% as per UAE law.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${frontendUrl}/track-order?orderId=${orderId}" class="button">
          Track Your Order
        </a>
      </div>
      
      <div class="message">
        If you have any questions about your order, please don't hesitate to contact our support team.
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Origins By The Sea</strong></p>
      <p>For support, visit originbythesea.com or email support@originbythesea.com</p>
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>&copy; ${new Date().getFullYear()} Origins By The Sea. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

module.exports = new EmailService();
