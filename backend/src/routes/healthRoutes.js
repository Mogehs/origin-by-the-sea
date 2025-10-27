const express = require("express");
const healthController = require("../controllers/healthController");

const router = express.Router();

// Health check
router.get("/health", healthController.health.bind(healthController));

// Debug info
router.get("/debug", healthController.debug.bind(healthController));

module.exports = router;
