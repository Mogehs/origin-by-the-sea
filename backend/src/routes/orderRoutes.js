const express = require("express");
const orderController = require("../controllers/orderController");

const router = express.Router();

// Get receipt
router.get("/:orderId", orderController.getReceipt.bind(orderController));

// Send order status email
router.post(
  "/:orderId/send-email",
  orderController.sendOrderEmail.bind(orderController)
);

module.exports = router;
