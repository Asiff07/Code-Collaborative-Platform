const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createCommit, getCommits, revertCommit } = require("../controllers/commitController");

const router = express.Router();

router.post("/", protect, createCommit);
router.get("/:roomId", protect, getCommits);
router.post("/revert", protect, revertCommit);

module.exports = router;
