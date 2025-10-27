const express = require("express");
const vatController = require("../controllers/vatController");

const router = express.Router();

// Calculate VAT
router.post("/calculate", vatController.calculateVAT.bind(vatController));

module.exports = router;
