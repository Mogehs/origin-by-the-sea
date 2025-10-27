const { UAE_VAT_RATE } = require("../config/constants");

/**
 * Calculate VAT breakdown for a given subtotal amount
 * @param {number} subtotalAmount - Amount in fils/cents before VAT
 * @returns {Object} VAT breakdown including subtotal, VAT amount, and total
 */
function calculateVATBreakdown(subtotalAmount) {
  const vatAmount = Math.round(subtotalAmount * UAE_VAT_RATE);
  const totalAmount = subtotalAmount + vatAmount;

  return {
    subtotalAmount: Math.round(subtotalAmount),
    vatAmount: vatAmount,
    totalAmount: totalAmount,
    vatRate: UAE_VAT_RATE,
    vatPercentage: (UAE_VAT_RATE * 100).toFixed(0) + "%",
  };
}

module.exports = { calculateVATBreakdown };
