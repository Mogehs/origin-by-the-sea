const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import configurations
const corsOptions = require("./config/cors");

// Import middleware
const requestLogger = require("./middlewares/requestLogger");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

// Import routes
const { router: apiRoutes, healthRoutes } = require("./routes");

// Initialize Firebase (must be done before using any Firebase services)
require("./config/firebase");

const app = express();

// Request logging
app.use(requestLogger);

// CORS configuration - MUST be before body parser
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Body parser middleware (raw body for Stripe webhook, JSON for everything else)
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/webhook") {
    // Stripe needs raw body for signature verification
    bodyParser.raw({ type: "application/json" })(req, res, next);
  } else {
    // Parse JSON for all other routes
    bodyParser.json()(req, res, next);
  }
});

// Health and debug routes
app.use("/", healthRoutes);

// API routes
app.use("/api", apiRoutes);

// 404 handler - must be after all routes
app.use("*", notFoundHandler);

// Error handling middleware - must be last
app.use(errorHandler);

// Unhandled promise rejection handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

module.exports = app;
