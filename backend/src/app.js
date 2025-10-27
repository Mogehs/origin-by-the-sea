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

// Body parser middleware (skip for webhook routes)
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/webhook") {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

// CORS configuration
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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
