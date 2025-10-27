/**
 * Logger utility for consistent logging across the application
 */
class Logger {
  static info(message, data = null) {
    console.log(`[INFO] [${new Date().toISOString()}]`, message, data || "");
  }

  static error(message, error = null) {
    console.error(
      `[ERROR] [${new Date().toISOString()}]`,
      message,
      error || ""
    );
  }

  static warn(message, data = null) {
    console.warn(`[WARN] [${new Date().toISOString()}]`, message, data || "");
  }

  static debug(message, data = null) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(
        `[DEBUG] [${new Date().toISOString()}]`,
        message,
        data || ""
      );
    }
  }

  static request(method, url) {
    console.log(`[${new Date().toISOString()}] ${method} ${url}`);
  }
}

module.exports = Logger;
