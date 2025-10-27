const { admin } = require("../config/firebase");
const stripe = require("../config/stripe");

class HealthController {
  /**
   * Health check
   * GET /health
   */
  health(req, res) {
    res.status(200).send("Server is running");
  }

  /**
   * Debug information
   * GET /debug
   */
  debug(req, res) {
    const allowedOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
      : [];

    res.json({
      environment: process.env.NODE_ENV,
      vercel: {
        is_vercel: !!process.env.VERCEL,
        env: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION,
        url: process.env.VERCEL_URL,
      },
      cors: {
        allowedOrigins,
        originCount: allowedOrigins.length,
        requestOrigin: req.headers.origin || "no-origin",
      },
      frontend_url: process.env.FRONTEND_URL,
      firebase_setup: !!admin.apps.length,
      stripe_setup: !!stripe,
      port: process.env.PORT || 3001,
      routes: [
        { method: "GET", path: "/health" },
        { method: "GET", path: "/debug" },
        { method: "POST", path: "/api/payment/create-intent" },
        { method: "GET", path: "/api/payment/:paymentIntentId" },
        { method: "POST", path: "/api/payment/refund" },
        { method: "POST", path: "/api/payment/webhook" },
        { method: "GET", path: "/api/receipt/:orderId" },
        { method: "POST", path: "/api/vat/calculate" },
        { method: "POST", path: "/api/calculate-vat" },
      ],
    });
  }
}

module.exports = new HealthController();
