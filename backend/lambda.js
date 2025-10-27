const serverless = require("serverless-http");
const dotenv = require("dotenv");

dotenv.config();

// Import the refactored application
const app = require("./src/app");

module.exports.handler = serverless(app);
