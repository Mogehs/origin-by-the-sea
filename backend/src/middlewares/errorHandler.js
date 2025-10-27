const Logger = require("../utils/logger");

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  Logger.error(`Error processing ${req.method} ${req.url}:`, err);

  res.status(err.status || 500).json({
    error: err.name || "Internal Server Error",
    message: err.message,
    path: req.path,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  Logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: `Cannot ${req.method} ${req.originalUrl}`,
    message: "Route not found",
  });
};

module.exports = { errorHandler, notFoundHandler };
