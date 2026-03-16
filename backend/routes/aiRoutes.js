const express = require("express");
const router = express.Router();
const { reviewCode, explainCode, assistCode } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect); // All AI routes require auth

router.post("/review", reviewCode);
router.post("/explain", explainCode);
router.post("/assist", assistCode);

module.exports = router;
