const admin = require("firebase-admin");

let serviceAccount;

try {
  // Try to load from environment variable first (for production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Load from file for local development
    serviceAccount = require("../../serviceAccountKey.json");
  }
} catch (error) {
  console.error("Error loading Firebase credentials:", error);
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();

module.exports = { admin, db };
