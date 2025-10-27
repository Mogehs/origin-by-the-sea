const app = require("./src/app");

const { PORT } = require("./src/config/constants");
const { admin } = require("./src/config/firebase");
const stripe = require("./src/config/stripe");
const Logger = require("./src/utils/logger");

try {
  const vercelHelper = require("./helpers/vercel-config");
  if (process.env.VERCEL === "1") {
    vercelHelper.logVercelEnvironment();
  }
} catch (err) {
  Logger.info("Vercel helper not available:", err.message);
}

if (require.main === module) {
  app.listen(PORT, () => {
    Logger.info(`Server running on port ${PORT}`);
    Logger.info(`NODE_ENV: ${process.env.NODE_ENV || "development"}`);
    Logger.info(
      `CORS allowed origin: ${process.env.FRONTEND_URL || "Not configured"}`
    );
    Logger.info(`Firebase initialized: ${!!admin.apps.length}`);
    Logger.info(`Stripe initialized: ${!!stripe}`);
  });
}

module.exports = app;
