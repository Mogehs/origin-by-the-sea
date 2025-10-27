const Logger = require("../utils/logger");

/**
 * Request logger middleware
 */
const requestLogger = (req, res, next) => {
  Logger.request(req.method, req.url);
  next();
};

module.exports = requestLogger;
