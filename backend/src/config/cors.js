const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
      : [
          "http://localhost:5173",
          "http://localhost:3000",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:3000",
        ]; // Default development origins

    console.log("CORS Check - Origin:", origin);
    console.log("CORS Check - Allowed Origins:", allowedOrigins);

    // Allow requests with no origin (mobile apps, Postman, curl, server-to-server, etc.)
    if (!origin) {
      console.log(
        "CORS: Allowing request with no origin (server-to-server or testing tool)"
      );
      return callback(null, true);
    }

    // Check if origin is in allowed list OR if it's an ngrok domain
    const isNgrokDomain = origin.includes("ngrok");

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log("CORS: Origin allowed from whitelist");
      return callback(null, true);
    } else if (isNgrokDomain && process.env.NODE_ENV !== "production") {
      // Allow ngrok domains in development/testing
      console.log("CORS: Allowing ngrok domain in development mode");
      return callback(null, true);
    } else {
      console.error("CORS: Origin blocked -", origin);
      console.error("CORS: Add this origin to FRONTEND_URL in .env:", origin);
      return callback(
        new Error(
          `CORS policy: Origin ${origin} not allowed. Add it to FRONTEND_URL environment variable.`
        )
      );
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "stripe-signature", // For Stripe webhooks
  ],
  exposedHeaders: ["Content-Length", "X-Request-Id"],
  maxAge: 86400, // Cache preflight requests for 24 hours
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

module.exports = corsOptions;
