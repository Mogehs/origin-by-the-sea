const serverless = require("serverless-http");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");

dotenv.config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === "true", 
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
});

const UAE_VAT_RATE = 0.05; 
const UAE_TRN = "104803456300003"; 

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

let firebaseInitialized = false;
try {
  
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("Using Firebase service account from environment variable");
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    console.log("Using Firebase service account from file");
    try {
      serviceAccount = require("./serviceAccountKey.json");
    } catch (fileError) {
      console.error("Error loading serviceAccountKey.json:", fileError);
      throw new Error(
        "Firebase service account not found. Please set FIREBASE_SERVICE_ACCOUNT environment variable."
      );
    }
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  firebaseInitialized = true;
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
  console.error(
    "Please check your serviceAccountKey.json file or FIREBASE_SERVICE_ACCOUNT environment variable"
  );
}

const db = firebaseInitialized
  ? admin.firestore()
  : {
      collection: () => ({
        doc: () => ({
          set: async () =>
            console.error("Firebase not initialized, operation failed"),
          get: async () => ({ exists: false, data: () => ({}) }),
          update: async () =>
            console.error("Firebase not initialized, operation failed"),
        }),
        add: async () =>
          console.error("Firebase not initialized, operation failed"),
        where: () => ({
          limit: () => ({
            get: async () => ({ empty: true, docs: [] }),
          }),
        }),
      }),
    };

const app = express();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/webhook") {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

const corsOptions = {
  origin: function (origin, callback) {
    
    const allowedOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
      : [];

    console.log("CORS Check - Origin:", origin);
    console.log("CORS Check - Allowed Origins:", allowedOrigins);

    if (!origin) {
      console.log("CORS: Allowing request with no origin");
      return callback(null, true);
    }

    if (allowedOrigins.length === 0) {
      console.warn("CORS: No FRONTEND_URL configured, allowing all origins");
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log("CORS: Origin allowed");
      return callback(null, true);
    } else {
      console.error("CORS: Origin blocked -", origin);
      return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true, 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Length", "X-Request-Id"],
  maxAge: 86400, 
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "origin-by-the-sea-backend",
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Origin by the Sea API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      debug: "/debug",
      createPaymentIntent: "POST /api/payment/create-intent",
      getPaymentIntent: "GET /api/payment/:paymentIntentId",
      refund: "POST /api/payment/refund",
      webhook: "POST /api/payment/webhook",
      receipt: "GET /api/receipt/:orderId",
      calculateVAT: "POST /api/calculate-vat",
      vatCalculate: "POST /api/vat/calculate",
    },
  });
});

app.get("/debug", (req, res) => {
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
    : [];

  res.json({
    environment: process.env.NODE_ENV,
    vercel: {
      is_vercel: !!process.env.VERCEL,
      env: process.env.VERCEL_ENV,
      region: process.env.VERCEL_REGION,
      url: process.env.VERCEL_URL,
    },
    cors: {
      allowedOrigins,
      originCount: allowedOrigins.length,
      requestOrigin: req.headers.origin || "no-origin",
    },
    frontend_url: process.env.FRONTEND_URL,
    firebase_setup: !!firebaseInitialized,
    stripe_setup: !!stripe,
    routes: [
      { method: "GET", path: "/health" },
      { method: "GET", path: "/debug" },
      { method: "POST", path: "/api/payment/create-intent" },
      { method: "GET", path: "/api/payment/:paymentIntentId" },
      { method: "POST", path: "/api/payment/refund" },
      { method: "POST", path: "/api/payment/webhook" },
      { method: "GET", path: "/api/receipt/:orderId" },
      { method: "POST", path: "/api/calculate-vat" },
      { method: "POST", path: "/api/vat/calculate" },
    ],
  });
});

app.post("/api/vat/calculate", (req, res) => {
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
    console.error("Error calculating VAT:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/calculate-vat", async (req, res) => {
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
        vatRate: `${(UAE_VAT_RATE * 100).toFixed(0)}%`,
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
    console.error("Error calculating VAT:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/receipt/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    if (!firebaseInitialized) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: Firebase not initialized" });
    }

    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderData = orderDoc.data();

    const receiptSVG = generateReceiptSVG(orderData, orderId);

    sendReceiptEmail(orderData, orderId, receiptSVG)
      .then((emailResult) => {
        if (emailResult.success) {
          console.log(`Receipt email queued for ${emailResult.recipient}`);
        } else {
          console.log(
            `Email not sent: ${emailResult.reason || emailResult.error}`
          );
        }
      })
      .catch((err) => {
        console.error("Email sending failed:", err);
      });

    const base64Receipt = Buffer.from(receiptSVG).toString("base64");

    res.json({
      success: true,
      orderId,
      receipt: base64Receipt,
      mimeType: "image/svg+xml",
      format: "svg", 
      orderDetails: {
        orderId,
        total: orderData.totalAmount,
        currency: orderData.currency || "AED",
        status: orderData.status,
        createdAt: orderData.createdAt?.toDate?.() || new Date(),
        items: orderData.items || [],
        customerInfo: orderData.customerInfo || orderData.metadata,
        shipping: orderData.shipping,
      },
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    res.status(500).json({ error: error.message });
  }
});

function generateReceiptSVG(orderData, orderId) {
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
      
      <!-- Product Name Column (40 to 280) -->
      <text x="55" y="${
        yPos + 35
      }" font-size="11" font-weight="600" fill="#1f2937">${escapeXml(
      item.name
    )}</text>
      
      <!-- Size Column (280 to 360) -->
      <text x="320" y="${
        yPos + 35
      }" font-size="11" fill="#374151" text-anchor="middle">${escapeXml(
      item.size || "-"
    )}</text>
      
      <!-- Color Column (360 to 480) - centered at 420 -->
      ${
        item.displayColor
          ? `<circle cx="420" cy="${yPos + 30}" r="7" fill="${
              item.displayColor
            }" stroke="#9ca3af" stroke-width="1.5"/>`
          : `<text x="420" y="${
              yPos + 35
            }" font-size="11" fill="#9ca3af" text-anchor="middle">-</text>`
      }
      
      <!-- Quantity Column (480 to 570) - centered at 525 -->
      <text x="525" y="${
        yPos + 35
      }" font-size="11" fill="#374151" text-anchor="middle">${quantity}</text>
      
      <!-- Unit Price Column (570 to 660) -->
      <text x="650" y="${
        yPos + 35
      }" font-size="11" fill="#374151" text-anchor="end">AED ${itemPrice.toFixed(
      2
    )}</text>
      
      <!-- Total Column (660 to 760) -->
      <text x="750" y="${
        yPos + 35
      }" font-size="12" font-weight="600" fill="#1f2937" text-anchor="end">AED ${itemTotal.toFixed(
      2
    )}</text>
    `;
    yPos += 60;
  });

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
  const vat = vatAmount > 0 ? vatAmount / 100 : subtotal * UAE_VAT_RATE;
  const totalWithVAT = subtotal + vat;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
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
  <text x="400" y="105" font-size="16" fill="#ffffff" opacity="0.95" text-anchor="middle">Origin By The Sea</text>
  <text x="400" y="130" font-size="12" fill="#ffffff" opacity="0.85" text-anchor="middle">Luxury Beachwear Collection</text>
  <text x="400" y="155" font-size="11" fill="#ffffff" opacity="0.9" text-anchor="middle">TRN: ${escapeXml(
    taxRegistrationNumber
  )} | VAT Registered</text>
  
  <!-- Order Info Card -->
  <rect x="40" y="200" width="720" height="160" fill="#ffffff" rx="12" stroke="#e5e7eb" stroke-width="1" filter="url(#shadow)"/>
  
  <!-- Order Details Grid -->
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
  
  <!-- Table Header Background -->
  <rect x="40" y="565" width="720" height="40" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1"/>
  
  <!-- Table Column Headers -->
  <text x="55" y="590" font-size="10" font-weight="700" fill="#6b7280" letter-spacing="0.5">PRODUCT</text>
  <text x="320" y="590" font-size="10" font-weight="700" fill="#6b7280" text-anchor="middle" letter-spacing="0.5">SIZE</text>
  <text x="420" y="590" font-size="10" font-weight="700" fill="#6b7280" text-anchor="middle" letter-spacing="0.5">COLOR</text>
  <text x="525" y="590" font-size="10" font-weight="700" fill="#6b7280" text-anchor="middle" letter-spacing="0.5">QTY</text>
  <text x="650" y="590" font-size="10" font-weight="700" fill="#6b7280" text-anchor="end" letter-spacing="0.5">UNIT PRICE</text>
  <text x="750" y="590" font-size="10" font-weight="700" fill="#6b7280" text-anchor="end" letter-spacing="0.5">TOTAL</text>
  
  <!-- Vertical separators for columns -->
  <line x1="280" y1="565" x2="280" y2="605" stroke="#d1d5db" stroke-width="1"/>
  <line x1="360" y1="565" x2="360" y2="605" stroke="#d1d5db" stroke-width="1"/>
  <line x1="480" y1="565" x2="480" y2="605" stroke="#d1d5db" stroke-width="1"/>
  <line x1="570" y1="565" x2="570" y2="605" stroke="#d1d5db" stroke-width="1"/>
  <line x1="660" y1="565" x2="660" y2="605" stroke="#d1d5db" stroke-width="1"/>
  
  <!-- Items List -->
  ${itemsHTML}
  
  <!-- Summary Section -->
  <rect x="40" y="${
    yPos + 20
  }" width="720" height="220" fill="#ffffff" rx="12" stroke="#e5e7eb" stroke-width="1" filter="url(#shadow)"/>
  
  <!-- Subtotal (Before VAT) -->
  <text x="60" y="${
    yPos + 55
  }" font-size="15" fill="#6b7280">Subtotal (Before VAT)</text>
  <text x="740" y="${
    yPos + 55
  }" font-size="15" fill="#6b7280" text-anchor="end">AED ${subtotal.toFixed(
    2
  )}</text>
  
  <!-- Shipping -->
  <text x="60" y="${yPos + 85}" font-size="15" fill="#6b7280">Shipping</text>
  <text x="740" y="${
    yPos + 85
  }" font-size="15" font-weight="700" fill="#10b981" text-anchor="end">FREE</text>
  
  <!-- VAT (5% as per UAE Law) -->
  <text x="60" y="${
    yPos + 115
  }" font-size="15" font-weight="600" fill="#dc2626">VAT (${vatPercentage})</text>
  <text x="740" y="${
    yPos + 115
  }" font-size="15" font-weight="600" fill="#dc2626" text-anchor="end">AED ${vat.toFixed(
    2
  )}</text>
  
  <!-- TRN Information -->
  <text x="60" y="${
    yPos + 140
  }" font-size="11" fill="#9ca3af">Tax Registration No: ${escapeXml(
    taxRegistrationNumber
  )}</text>
  <text x="740" y="${
    yPos + 140
  }" font-size="10" fill="#9ca3af" text-anchor="end">VAT Compliant - UAE FTA</text>
  
  <!-- Divider -->
  <line x1="60" y1="${yPos + 155}" x2="740" y2="${
    yPos + 155
  }" stroke="#e5e7eb" stroke-width="2"/>
  
  <!-- Total (Including VAT) -->
  <rect x="60" y="${
    yPos + 170
  }" width="680" height="50" fill="url(#totalGradient)" rx="8"/>
  <text x="80" y="${
    yPos + 198
  }" font-size="18" font-weight="700" fill="#92400e">TOTAL (Including VAT)</text>
  <text x="720" y="${
    yPos + 202
  }" font-size="26" font-weight="800" fill="#92400e" text-anchor="end">AED ${totalWithVAT.toFixed(
    2
  )}</text>
  
  <!-- Footer -->
  <rect x="40" y="${
    yPos + 240
  }" width="720" height="120" fill="#f9fafb" rx="10"/>
  <text x="400" y="${
    yPos + 270
  }" font-size="16" font-weight="700" fill="#1f2937" text-anchor="middle">Origin By The Sea</text>
  <text x="400" y="${
    yPos + 293
  }" font-size="13" fill="#6b7280" text-anchor="middle">Thank you for your purchase!</text>
  <text x="400" y="${
    yPos + 316
  }" font-size="11" fill="#9ca3af" text-anchor="middle">Tax Invoice - Valid for VAT refund as per UAE Federal Tax Authority</text>
  <text x="400" y="${
    yPos + 338
  }" font-size="11" fill="#9ca3af" text-anchor="middle">For support, visit originbythesea.com or email support@originbythesea.com</text>
  
  <!-- Decorative Border -->
  <rect x="0" y="0" width="800" height="${totalHeight}" fill="none" stroke="#e5e7eb" stroke-width="2" rx="4"/>
</svg>`;

  return svg;
}

function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Create payment intent endpoint
app.post("/api/payment/create-intent", async (req, res) => {
  try {
    // Extract order data from request
    const { amount, currency, metadata, shipping, userId, cartItems } =
      req.body;

    if (!amount || !userId) {
      return res
        .status(400)
        .json({ error: "Missing required parameters: amount and userId" });
    }

    if (!firebaseInitialized) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: Firebase not initialized" });
    }

    // Calculate VAT breakdown
    // amount = subtotal (product prices WITHOUT VAT)
    // VAT = 5% ADDITIONAL charge on top of subtotal
    // Total = Subtotal + VAT (5%)
    const vatBreakdown = calculateVATBreakdown(amount);

    console.log("💰 VAT Calculation:", {
      subtotal: `${(vatBreakdown.subtotalAmount / 100).toFixed(2)} ${
        currency?.toUpperCase() || "AED"
      }`,
      vat: `${(vatBreakdown.vatAmount / 100).toFixed(2)} ${
        currency?.toUpperCase() || "AED"
      } (5%)`,
      total: `${(vatBreakdown.totalAmount / 100).toFixed(2)} ${
        currency?.toUpperCase() || "AED"
      }`,
    });

    // Create a temporary order document in Firestore
    const orderRef = db.collection("orders").doc();
    const orderId = orderRef.id;

    // Add orderId, VAT info, and TRN to metadata
    const enhancedMetadata = {
      ...metadata,
      orderId,
      userId,
      vatAmount: vatBreakdown.vatAmount.toString(),
      vatRate: vatBreakdown.vatPercentage,
      subtotalAmount: vatBreakdown.subtotalAmount.toString(),
      taxRegistrationNumber: UAE_TRN,
      taxCompliant: "UAE_VAT_5_PERCENT",
    };

    // Create a PaymentIntent with the TOTAL amount (Subtotal + VAT)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: vatBreakdown.totalAmount, // Total = Subtotal + 5% VAT
      currency: currency || "aed",
      metadata: enhancedMetadata,
      shipping,
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Order ${orderId} | Subtotal: ${(
        vatBreakdown.subtotalAmount / 100
      ).toFixed(2)} + VAT (5%): ${(vatBreakdown.vatAmount / 100).toFixed(
        2
      )} = Total: ${(vatBreakdown.totalAmount / 100).toFixed(2)} ${
        currency?.toUpperCase() || "AED"
      }`,
    });

    console.log(`Created payment intent: ${paymentIntent.id}`);

    // Save pending order in Firestore with payment intent ID and VAT breakdown
    await orderRef.set({
      userId,
      items: cartItems || [],
      totalAmount: vatBreakdown.totalAmount,
      subtotalAmount: vatBreakdown.subtotalAmount,
      vatAmount: vatBreakdown.vatAmount,
      vatRate: UAE_VAT_RATE,
      vatPercentage: vatBreakdown.vatPercentage,
      taxRegistrationNumber: UAE_TRN,
      currency: currency || "aed",
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentIntentId: paymentIntent.id,
      shipping: shipping || null,
      metadata: enhancedMetadata,
    });

    console.log(`Saved order ${orderId} to Firestore`);

    // Send client secret to client-side
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment status endpoint
app.get("/api/payment/:paymentIntentId", async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment intent ID is required" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      created: paymentIntent.created,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    res.status(500).json({ error: error.message });
  }
});

// Process refunds endpoint
app.post("/api/payment/refund", async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment intent ID is required" });
    }

    // Get the payment intent to find the charge ID
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent.latest_charge) {
      return res
        .status(400)
        .json({ error: "No charge found for this payment" });
    }

    // Process the refund
    const refund = await stripe.refunds.create({
      charge: paymentIntent.latest_charge,
      amount: amount || undefined,
      reason: reason || "requested_by_customer",
    });

    // Update the order in Firestore
    if (paymentIntent.metadata.orderId) {
      const orderRef = db
        .collection("orders")
        .doc(paymentIntent.metadata.orderId);
      const orderSnapshot = await orderRef.get();

      if (orderSnapshot.exists) {
        await orderRef.update({
          status: amount ? "partially_refunded" : "refunded",
          refundId: refund.id,
          refundAmount: amount || paymentIntent.amount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    res.json({
      success: true,
      refundId: refund.id,
      status: refund.status,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler endpoint
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // Handle the event
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          await updateOrderStatus(
            paymentIntent.metadata.orderId,
            "paid",
            paymentIntent
          );
          break;

        case "payment_intent.payment_failed":
          const failedPayment = event.data.object;
          await updateOrderStatus(
            failedPayment.metadata.orderId,
            "payment_failed",
            failedPayment
          );
          break;

        case "charge.refunded":
          const refund = event.data.object;
          await handleRefund(refund);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.send({ received: true });
    } catch (error) {
      console.error(`Error processing webhook ${event.type}:`, error);
      res.status(500).send({ error: "Webhook processing failed" });
    }
  }
);

// Function to update order status in Firebase
async function updateOrderStatus(orderId, status, paymentData) {
  if (!orderId) {
    console.warn("No orderId provided in metadata, skipping order update");
    return;
  }

  if (!firebaseInitialized) {
    console.warn("Firebase not initialized, skipping order update");
    return;
  }

  try {
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      console.warn(`Order ${orderId} not found in database`);
      return;
    }

    // Update order status
    await orderRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentData: paymentData || null,
    });

    // If payment succeeded, create a new payment record
    if (status === "paid") {
      await db.collection("payments").add({
        orderId,
        paymentIntentId: paymentData.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: "succeeded",
        paymentMethod: paymentData.payment_method_types[0],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: paymentData.metadata,
      });

      // Clear cart for the user if userId is provided
      if (paymentData.metadata.userId) {
        const userId = paymentData.metadata.userId;

        // Check if we should clear the cart from Firebase
        const userCartRef = db
          .collection("users")
          .doc(userId)
          .collection("cart");
        const cartItems = await userCartRef.get();

        // Delete cart items in a batch
        const batch = db.batch();
        cartItems.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`Cleared cart for user ${userId}`);
      }
    }

    console.log(`Updated order ${orderId} to status ${status}`);
  } catch (error) {
    console.error(`Error updating order ${orderId}:`, error);
    throw error;
  }
}

// Function to handle refund events
async function handleRefund(refundData) {
  if (!firebaseInitialized) {
    console.warn("Firebase not initialized, skipping refund handling");
    return;
  }

  try {
    // Find the order using the charge ID
    const chargeId = refundData.id;
    const orderQuery = await db
      .collection("orders")
      .where("paymentData.latest_charge", "==", chargeId)
      .limit(1)
      .get();

    if (orderQuery.empty) {
      console.warn(`No order found for charge ${chargeId}`);
      return;
    }

    const orderDoc = orderQuery.docs[0];
    const orderId = orderDoc.id;

    // Determine if it's a full or partial refund
    const refundStatus =
      refundData.amount_refunded === refundData.amount
        ? "refunded"
        : "partially_refunded";

    // Update the order
    await orderDoc.ref.update({
      status: refundStatus,
      refundAmount: refundData.amount_refunded,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create a refund record
    await db.collection("refunds").add({
      orderId,
      chargeId,
      amount: refundData.amount_refunded,
      currency: refundData.currency,
      reason: refundData.reason || null,
      status: refundData.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Processed refund for order ${orderId}`);
  } catch (error) {
    console.error("Error handling refund:", error);
    throw error;
  }
}

// Function to send receipt email using Nodemailer
async function sendReceiptEmail(orderData, orderId, receiptSVG) {
  try {
    // Check if user is a guest - check multiple possible fields
    const isGuest =
      orderData.isGuest ||
      orderData.metadata?.isGuest ||
      orderData.metadata?.isGuestCheckout ||
      orderData.isGuestOrder ||
      false;

    // Get customer email from multiple possible locations
    const customerEmail =
      orderData.customerInfo?.email ||
      orderData.metadata?.email ||
      orderData.metadata?.customerEmail ||
      orderData.metadata?.userEmail ||
      orderData.email;

    console.log(`📧 Email check for order ${orderId}:`, {
      isGuest,
      hasEmail: !!customerEmail,
      email: customerEmail ? `${customerEmail.substring(0, 3)}***` : "None",
      userId: orderData.userId || orderData.metadata?.userId || "unknown",
    });

    if (isGuest || !customerEmail) {
      console.log(`Skipping email for guest order ${orderId} or missing email`);
      return { success: false, reason: "Guest order or no email" };
    }

    const customerName =
      orderData.customerInfo?.name ||
      orderData.metadata?.customerName ||
      "Valued Customer";

    // Calculate totals
    const subtotal = ((orderData.subtotalAmount || 0) / 100).toFixed(2);
    const vat = ((orderData.vatAmount || 0) / 100).toFixed(2);
    const total = (orderData.totalAmount / 100).toFixed(2);
    const currency = (orderData.currency || "AED").toUpperCase();
    const trn = orderData.taxRegistrationNumber || UAE_TRN;
    const orderDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    console.log(`📄 Converting receipt SVG to PDF for order ${orderId}...`);

    // Convert SVG to PDF
    const pdfBuffer = await convertSVGToPDF(receiptSVG);

    console.log(
      `✅ PDF generated successfully (${pdfBuffer.length} bytes) for order ${orderId}`
    );

    // Create email HTML
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #e6994b 0%, #d78a3f 50%, #c97a35 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 1px; }
    .header p { margin: 10px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 40px 20px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
    .message { font-size: 16px; color: #6b7280; line-height: 1.6; margin-bottom: 30px; }
    .order-summary { background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .order-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .order-row:last-child { border-bottom: none; }
    .order-label { color: #6b7280; font-size: 14px; }
    .order-value { color: #1f2937; font-weight: 600; font-size: 14px; }
    .total-row { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 10px; }
    .total-row .order-label { color: #92400e; font-size: 16px; font-weight: 700; }
    .total-row .order-value { color: #92400e; font-size: 18px; font-weight: 800; }
    .button { display: inline-block; background: linear-gradient(135deg, #e6994b, #c97a35); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; color: #9ca3af; font-size: 12px; }
    .footer p { margin: 5px 0; }
    .tax-info { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e6994b; }
    .tax-info p { margin: 5px 0; font-size: 13px; color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TAX INVOICE</h1>
      <p>Origin By The Sea</p>
      <p>Luxury Beachwear Collection</p>
    </div>
    
    <div class="content">
      <div class="greeting">Dear ${customerName},</div>
      
      <div class="message">
        Thank you for your purchase! Your order has been successfully confirmed and payment has been received.
        Your tax invoice is attached to this email.
      </div>
      
      <div class="order-summary">
        <h3 style="margin-top: 0; color: #1f2937;">Order Summary</h3>
        <div class="order-row">
          <span class="order-label">Order ID:</span>
          <span class="order-value">${orderId.toUpperCase()}</span>
        </div>
        <div class="order-row">
          <span class="order-label">Order Date:</span>
          <span class="order-value">${orderDate}</span>
        </div>
        <div class="order-row">
          <span class="order-label">Subtotal (Before VAT):</span>
          <span class="order-value">${currency} ${subtotal}</span>
        </div>
        <div class="order-row">
          <span class="order-label">VAT (5%):</span>
          <span class="order-value">${currency} ${vat}</span>
        </div>
        <div class="total-row">
          <div class="order-row" style="border: none;">
            <span class="order-label">Total (Including VAT):</span>
            <span class="order-value">${currency} ${total}</span>
          </div>
        </div>
      </div>
      
      <div class="tax-info">
        <p><strong>Tax Compliance Information</strong></p>
        <p>Tax Registration Number (TRN): ${trn}</p>
        <p>This is a valid tax invoice as per UAE Federal Tax Authority regulations.</p>
        <p>VAT is calculated at 5% as per UAE law.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONTEND_URL?.split(",")[0] ||
          "https://originbythesea.com"
        }/track-order?orderId=${orderId}" class="button">
          Track Your Order
        </a>
      </div>
      
      <div class="message">
        If you have any questions about your order, please don't hesitate to contact our support team.
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Origin By The Sea</strong></p>
      <p>For support, visit originbythesea.com or email support@originbythesea.com</p>
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>&copy; ${new Date().getFullYear()} Origin By The Sea. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Email options
    const mailOptions = {
      from: {
        name: "Origin By The Sea",
        address: process.env.SMTP_USER,
      },
      to: customerEmail,
      subject: `Your Order Receipt - Order #${orderId.toUpperCase()}`,
      html: emailHTML,
      attachments: [
        {
          filename: `Tax-Invoice-${orderId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    console.log(
      `📧 Sending receipt email with PDF attachment to: ${customerEmail}`
    );

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Receipt email sent successfully to ${customerEmail}`);
    console.log(`📎 PDF attachment: Tax-Invoice-${orderId}.pdf`);
    console.log(`Message ID: ${info.messageId}`);

    return {
      success: true,
      recipient: customerEmail,
      orderId: orderId,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending receipt email:", error);
    return { success: false, error: error.message };
  }
}

// Catch-all route for undefined routes (MUST BE AFTER ALL OTHER ROUTES)
app.use("*", (req, res) => {
  console.log(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Function to convert SVG to PDF using Puppeteer
async function convertSVGToPDF(svgContent) {
  let browser;
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Create HTML wrapper for SVG
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; }
    svg { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

    // Set content and wait for fonts to load
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Get SVG dimensions
    const dimensions = await page.evaluate(() => {
      const svg = document.querySelector("svg");
      return {
        width: svg.getAttribute("width") || svg.viewBox.baseVal.width,
        height: svg.getAttribute("height") || svg.viewBox.baseVal.height,
      };
    });

    // Set viewport to match SVG dimensions
    await page.setViewport({
      width: parseInt(dimensions.width),
      height: parseInt(dimensions.height),
      deviceScaleFactor: 2, // Higher quality
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error("Error converting SVG to PDF:", error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// Error handling middleware (MUST BE AFTER ALL ROUTES)
app.use((err, req, res, next) => {
  console.error(`Error processing ${req.method} ${req.url}:`, err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    path: req.path,
  });
});

// Error handling for unhandled promises
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Export the handler for Lambda
module.exports.handler = serverless(app);
