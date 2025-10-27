const express = require("express");
const paymentRoutes = require("./paymentRoutes");
const orderRoutes = require("./orderRoutes");
const vatRoutes = require("./vatRoutes");
const healthRoutes = require("./healthRoutes");
const vatController = require("../controllers/vatController");

const router = express.Router();

// Mount routes
router.use("/payment", paymentRoutes);
router.use("/receipt", orderRoutes);
router.use("/orders", orderRoutes); // Added orders route
router.use("/vat", vatRoutes);

// Legacy route for backward compatibility
router.post(
  "/calculate-vat",
  vatController.calculateFromSubtotal.bind(vatController)
);

module.exports = { router, healthRoutes };
