const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
      : [];

    console.log("CORS Check - Origin:", origin);
    console.log("CORS Check - Allowed Origins:", allowedOrigins);

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log("CORS: Allowing request with no origin");
      return callback(null, true);
    }

    // If no origins configured, allow all (development mode)
    if (allowedOrigins.length === 0) {
      console.warn("CORS: No FRONTEND_URL configured, allowing all origins");
      return callback(null, true);
    }

    // Check if origin is in allowed list
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

module.exports = corsOptions;
