const { UAE_TRN } = require("../config/constants");
const { escapeXml } = require("../utils/xmlHelper");

class ReceiptService {
  /**
   * Generate SVG receipt for an order
   */
  generateReceiptSVG(orderData, orderId) {
    const items = orderData.items || [];
    const total = orderData.totalAmount || 0;
    const currency = (orderData.currency || "AED").toUpperCase();
    const createdAt = orderData.createdAt?.toDate?.() || new Date();
    const customerInfo = orderData.customerInfo || orderData.metadata || {};
    const shipping = orderData.shipping || {};

    const formattedDate = createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedTime = createdAt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Calculate SVG height dynamically
    const headerHeight = 200;
    const orderInfoCardHeight = 160;
    const customerShippingHeight = 140;
    const itemsHeaderHeight = 50;
    const itemHeight = 60;
    const itemsHeight = items.length * itemHeight;
    const summaryHeight = 240;
    const footerHeight = 140;
    const spacing = 20;

    const totalHeight =
      headerHeight +
      orderInfoCardHeight +
      spacing +
      customerShippingHeight +
      spacing +
      itemsHeaderHeight +
      itemsHeight +
      spacing +
      summaryHeight +
      spacing +
      footerHeight;

    // Generate items HTML
    const itemsHTML = this._generateItemsHTML(items);

    // Calculate totals
    const vatAmount = orderData.vatAmount || 0;
    const subtotalAmount = orderData.subtotalAmount || 0;
    const vatPercentage = orderData.vatPercentage || "5%";
    const taxRegistrationNumber = orderData.taxRegistrationNumber || UAE_TRN;

    const calculatedSubtotal = items.reduce((sum, item) => {
      const itemPrice =
        parseFloat(String(item.price).replace(/[^0-9.]/g, "")) || 0;
      return sum + itemPrice * (item.quantity || 1);
    }, 0);

    const subtotal =
      subtotalAmount > 0 ? subtotalAmount / 100 : calculatedSubtotal;
    const vat = vatAmount > 0 ? vatAmount / 100 : subtotal * 0.05;
    const totalWithVAT = subtotal + vat;

    const svg = this._buildSVG({
      totalHeight,
      orderId,
      formattedDate,
      formattedTime,
      orderData,
      customerInfo,
      shipping,
      itemsHTML,
      subtotal,
      vat,
      totalWithVAT,
      vatPercentage,
      taxRegistrationNumber,
    });

    return svg;
  }

  /**
   * Generate items HTML for receipt
   */
  _generateItemsHTML(items) {
    let itemsHTML = "";
    let yPos = 610;

    items.forEach((item, index) => {
      const itemPrice =
        parseFloat(String(item.price).replace(/[^0-9.]/g, "")) || 0;
      const quantity = item.quantity || 1;
      const itemTotal = itemPrice * quantity;

      itemsHTML += `
      <!-- Table Row Background -->
      <rect x="40" y="${yPos}" width="720" height="60" fill="${
        index % 2 === 0 ? "#ffffff" : "#f9fafb"
      }" stroke="#e5e7eb" stroke-width="1"/>
      
      <!-- Vertical Separators -->
      <line x1="280" y1="${yPos}" x2="280" y2="${
        yPos + 60
      }" stroke="#d1d5db" stroke-width="1"/>
      <line x1="360" y1="${yPos}" x2="360" y2="${
        yPos + 60
      }" stroke="#d1d5db" stroke-width="1"/>
      <line x1="480" y1="${yPos}" x2="480" y2="${
        yPos + 60
      }" stroke="#d1d5db" stroke-width="1"/>
      <line x1="570" y1="${yPos}" x2="570" y2="${
        yPos + 60
      }" stroke="#d1d5db" stroke-width="1"/>
      <line x1="660" y1="${yPos}" x2="660" y2="${
        yPos + 60
      }" stroke="#d1d5db" stroke-width="1"/>
      
      <!-- Product Name Column -->
      <text x="55" y="${
        yPos + 35
      }" font-size="11" font-weight="600" fill="#1f2937">${escapeXml(
        item.name
      )}</text>
      
      <!-- Size Column -->
      <text x="320" y="${
        yPos + 35
      }" font-size="11" fill="#374151" text-anchor="middle">${escapeXml(
        item.size || "-"
      )}</text>
      
      <!-- Color Column -->
      ${
        item.displayColor
          ? `<circle cx="420" cy="${yPos + 30}" r="7" fill="${
              item.displayColor
            }" stroke="#9ca3af" stroke-width="1.5"/>`
          : `<text x="420" y="${
              yPos + 35
            }" font-size="11" fill="#9ca3af" text-anchor="middle">-</text>`
      }
      
      <!-- Quantity Column -->
      <text x="525" y="${
        yPos + 35
      }" font-size="11" fill="#374151" text-anchor="middle">${quantity}</text>
      
      <!-- Unit Price Column -->
      <text x="650" y="${
        yPos + 35
      }" font-size="11" fill="#374151" text-anchor="end">AED ${itemPrice.toFixed(
        2
      )}</text>
      
      <!-- Total Column -->
      <text x="750" y="${
        yPos + 35
      }" font-size="12" font-weight="600" fill="#1f2937" text-anchor="end">AED ${itemTotal.toFixed(
        2
      )}</text>
    `;
      yPos += 60;
    });

    return itemsHTML;
  }

  /**
   * Build complete SVG
   */
  _buildSVG(data) {
    const {
      totalHeight,
      orderId,
      formattedDate,
      formattedTime,
      orderData,
      customerInfo,
      shipping,
      itemsHTML,
      subtotal,
      vat,
      totalWithVAT,
      vatPercentage,
      taxRegistrationNumber,
    } = data;

    const yPosBase = 610 + (orderData.items?.length || 0) * 60;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${totalHeight}" viewBox="0 0 800 ${totalHeight}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;display=swap');
      text { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    </style>
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e6994b;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#d78a3f;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c97a35;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="totalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#fef3c7;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fde68a;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.1"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="800" height="${totalHeight}" fill="#ffffff"/>
  
  <!-- Header Section -->
  <rect width="800" height="180" fill="url(#headerGradient)" filter="url(#shadow)"/>
  
  <!-- Header Text -->
  <text x="400" y="70" font-size="36" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">TAX INVOICE</text>
  <text x="400" y="105" font-size="16" fill="#ffffff" opacity="0.95" text-anchor="middle">Origins By The Sea</text>
  <text x="400" y="130" font-size="12" fill="#ffffff" opacity="0.85" text-anchor="middle">Luxury Beachwear Collection</text>
  <text x="400" y="155" font-size="11" fill="#ffffff" opacity="0.9" text-anchor="middle">TRN: ${escapeXml(
    taxRegistrationNumber
  )} | VAT Registered</text>
  
  <!-- Order Info Card -->
  <rect x="40" y="200" width="720" height="160" fill="#ffffff" rx="12" stroke="#e5e7eb" stroke-width="1" filter="url(#shadow)"/>
  
  <!-- Order Details -->
  <text x="60" y="230" font-size="12" font-weight="600" fill="#9ca3af" letter-spacing="1">ORDER ID</text>
  <text x="60" y="255" font-size="16" font-weight="700" fill="#1f2937" font-family="monospace">${escapeXml(
    orderId.toUpperCase()
  )}</text>
  
  <text x="60" y="290" font-size="12" font-weight="600" fill="#9ca3af" letter-spacing="1">DATE & TIME</text>
  <text x="60" y="315" font-size="15" font-weight="500" fill="#1f2937">${escapeXml(
    formattedDate
  )}</text>
  <text x="60" y="338" font-size="13" fill="#6b7280">${escapeXml(
    formattedTime
  )}</text>
  
  <!-- Status Badge -->
  <rect x="620" y="220" width="120" height="32" fill="#d1fae5" rx="16"/>
  <text x="680" y="242" font-size="13" font-weight="700" fill="#065f46" text-anchor="middle">${escapeXml(
    (orderData.status || "pending").toUpperCase()
  )}</text>
  
  <!-- Customer & Shipping Section -->
  <rect x="40" y="380" width="350" height="140" fill="#f9fafb" rx="10" stroke="#e5e7eb" stroke-width="1"/>
  <text x="60" y="410" font-size="13" font-weight="700" fill="#374151">CUSTOMER</text>
  <text x="60" y="435" font-size="14" font-weight="500" fill="#1f2937">${escapeXml(
    customerInfo.customerName || shipping.name || "Guest User"
  )}</text>
  <text x="60" y="460" font-size="13" fill="#6b7280">${escapeXml(
    customerInfo.email || "N/A"
  )}</text>
  <text x="60" y="483" font-size="13" fill="#6b7280">${escapeXml(
    shipping.phone || customerInfo.phone || ""
  )}</text>
  
  <rect x="410" y="380" width="350" height="140" fill="#f9fafb" rx="10" stroke="#e5e7eb" stroke-width="1"/>
  <text x="430" y="410" font-size="13" font-weight="700" fill="#374151">SHIPPING ADDRESS</text>
  <text x="430" y="435" font-size="14" font-weight="500" fill="#1f2937">${escapeXml(
    shipping.address?.line1 || customerInfo.address || "N/A"
  )}</text>
  <text x="430" y="458" font-size="13" fill="#6b7280">${escapeXml(
    shipping.address?.line2 || ""
  )}</text>
  <text x="430" y="481" font-size="13" fill="#6b7280">${escapeXml(
    shipping.address
      ? `${shipping.address.city || ""}, ${shipping.address.state || ""} ${
          shipping.address.postal_code || ""
        }`
      : ""
  )}</text>
  <text x="430" y="503" font-size="13" font-weight="500" fill="#374151">${escapeXml(
    shipping.address?.country || ""
  )}</text>
  
  <!-- Items Section Header -->
  <text x="40" y="550" font-size="16" font-weight="700" fill="#1f2937">ORDER ITEMS</text>
  <rect x="40" y="560" width="720" height="1" fill="#d1d5db"/>
  
  <!-- Table Header -->
  <rect x="40" y="565" width="720" height="40" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1"/>
  <text x="55" y="590" font-size="10" font-weight="700" fill="#6b7280" letter-spacing="0.5">PRODUCT</text>
  <text x="320" y="590" font-size="10" font-weight="700" fill="#6b7280" text-anchor="middle" letter-spacing="0.5">SIZE</text>
  <text x="420" y="590" font-size="10" font-weight="700" fill="#6b7280" text-anchor="middle" letter-spacing="0.5">COLOR</text>
  <text x="525" y="590" font-size="10" font-weight="700" fill="#6b7280" text-anchor="middle" letter-spacing="0.5">QTY</text>
  <text x="650" y="590" font-size="10" font-weight="700" fill="#6b7280" text-anchor="end" letter-spacing="0.5">UNIT PRICE</text>
  <text x="750" y="590" font-size="10" font-weight="700" fill="#6b7280" text-anchor="end" letter-spacing="0.5">TOTAL</text>
  
  <line x1="280" y1="565" x2="280" y2="605" stroke="#d1d5db" stroke-width="1"/>
  <line x1="360" y1="565" x2="360" y2="605" stroke="#d1d5db" stroke-width="1"/>
  <line x1="480" y1="565" x2="480" y2="605" stroke="#d1d5db" stroke-width="1"/>
  <line x1="570" y1="565" x2="570" y2="605" stroke="#d1d5db" stroke-width="1"/>
  <line x1="660" y1="565" x2="660" y2="605" stroke="#d1d5db" stroke-width="1"/>
  
  <!-- Items List -->
  ${itemsHTML}
  
  <!-- Summary Section -->
  <rect x="40" y="${
    yPosBase + 20
  }" width="720" height="220" fill="#ffffff" rx="12" stroke="#e5e7eb" stroke-width="1" filter="url(#shadow)"/>
  
  <text x="60" y="${
    yPosBase + 55
  }" font-size="15" fill="#6b7280">Subtotal (Before VAT)</text>
  <text x="740" y="${
    yPosBase + 55
  }" font-size="15" fill="#6b7280" text-anchor="end">AED ${subtotal.toFixed(
      2
    )}</text>
  
  <text x="60" y="${
    yPosBase + 85
  }" font-size="15" fill="#6b7280">Shipping</text>
  <text x="740" y="${
    yPosBase + 85
  }" font-size="15" font-weight="700" fill="#10b981" text-anchor="end">FREE</text>
  
  <text x="60" y="${
    yPosBase + 115
  }" font-size="15" font-weight="600" fill="#dc2626">VAT (${vatPercentage})</text>
  <text x="740" y="${
    yPosBase + 115
  }" font-size="15" font-weight="600" fill="#dc2626" text-anchor="end">AED ${vat.toFixed(
      2
    )}</text>
  
  <text x="60" y="${
    yPosBase + 140
  }" font-size="11" fill="#9ca3af">Tax Registration No: ${escapeXml(
      taxRegistrationNumber
    )}</text>
  <text x="740" y="${
    yPosBase + 140
  }" font-size="10" fill="#9ca3af" text-anchor="end">VAT Compliant - UAE FTA</text>
  
  <line x1="60" y1="${yPosBase + 155}" x2="740" y2="${
      yPosBase + 155
    }" stroke="#e5e7eb" stroke-width="2"/>
  
  <rect x="60" y="${
    yPosBase + 170
  }" width="680" height="50" fill="url(#totalGradient)" rx="8"/>
  <text x="80" y="${
    yPosBase + 198
  }" font-size="18" font-weight="700" fill="#92400e">TOTAL (Including VAT)</text>
  <text x="720" y="${
    yPosBase + 202
  }" font-size="26" font-weight="800" fill="#92400e" text-anchor="end">AED ${totalWithVAT.toFixed(
      2
    )}</text>
  
  <!-- Footer -->
  <rect x="40" y="${
    yPosBase + 240
  }" width="720" height="120" fill="#f9fafb" rx="10"/>
  <text x="400" y="${
    yPosBase + 270
  }" font-size="16" font-weight="700" fill="#1f2937" text-anchor="middle">Origins By The Sea</text>
  <text x="400" y="${
    yPosBase + 293
  }" font-size="13" fill="#6b7280" text-anchor="middle">Thank you for your purchase!</text>
  <text x="400" y="${
    yPosBase + 316
  }" font-size="11" fill="#9ca3af" text-anchor="middle">Tax Invoice - Valid for VAT refund as per UAE Federal Tax Authority</text>
  <text x="400" y="${
    yPosBase + 338
  }" font-size="11" fill="#9ca3af" text-anchor="middle">For support, visit originbythesea.com or email support@originbythesea.com</text>
  
  <rect x="0" y="0" width="800" height="${totalHeight}" fill="none" stroke="#e5e7eb" stroke-width="2" rx="4"/>
</svg>`;
  }
}

module.exports = new ReceiptService();
