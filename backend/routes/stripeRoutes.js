const express = require("express");
const router = express.Router();
const { createCheckoutSession, webhookHandler } = require("../controllers/stripeController");
const { protect } = require("../middleware/authMiddleware");

// Protected route for creating checkout session
router.post("/create-checkout-session", protect, createCheckoutSession);

// Protected route for verifying checkout session
router.post("/verify-session", protect, require("../controllers/stripeController").verifySession);

// Note: webhook URL is defined directly in server.js 
// because it requires express.raw() instead of express.json()

module.exports = router;
