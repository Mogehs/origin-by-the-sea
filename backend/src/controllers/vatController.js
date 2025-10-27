const { calculateVATBreakdown } = require("../utils/vatCalculator");
const { UAE_TRN } = require("../config/constants");
const Logger = require("../utils/logger");

class VATController {
  /**
   * Calculate VAT for given amount
   * POST /api/vat/calculate
   */
  async calculateVAT(req, res) {
    try {
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }

      const breakdown = calculateVATBreakdown(amount);

      res.json({
        success: true,
        input: {
          totalAmountWithVAT: amount,
          currency: "AED",
        },
        breakdown: {
          subtotal: (breakdown.subtotalAmount / 100).toFixed(2),
          vat: (breakdown.vatAmount / 100).toFixed(2),
          total: (breakdown.totalAmount / 100).toFixed(2),
          vatRate: breakdown.vatPercentage,
        },
        compliance: {
          taxRegistrationNumber: UAE_TRN,
          vatCompliant: true,
          region: "UAE",
          authority: "Federal Tax Authority (FTA)",
        },
      });
    } catch (error) {
      Logger.error("Error calculating VAT:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Calculate VAT from subtotal
   * POST /api/calculate-vat
   */
  async calculateFromSubtotal(req, res) {
    try {
      const { subtotal } = req.body;

      if (!subtotal || typeof subtotal !== "number") {
        return res.status(400).json({
          error: "Subtotal is required and must be a number (in fils/cents)",
        });
      }

      const vatBreakdown = calculateVATBreakdown(subtotal);

      res.json({
        success: true,
        calculation: {
          subtotal: `${(vatBreakdown.subtotalAmount / 100).toFixed(2)} AED`,
          vatRate: `${(0.05 * 100).toFixed(0)}%`,
          vatAmount: `${(vatBreakdown.vatAmount / 100).toFixed(2)} AED`,
          total: `${(vatBreakdown.totalAmount / 100).toFixed(2)} AED`,
        },
        breakdown: {
          subtotalFils: vatBreakdown.subtotalAmount,
          vatFils: vatBreakdown.vatAmount,
          totalFils: vatBreakdown.totalAmount,
        },
        note: "VAT is calculated as an ADDITIONAL 5% charge on top of the subtotal, not included in product prices",
      });
    } catch (error) {
      Logger.error("Error calculating VAT:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new VATController();
