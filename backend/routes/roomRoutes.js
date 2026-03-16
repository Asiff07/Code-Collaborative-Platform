const express = require("express");
const router = express.Router();
const { createRoom, getRoom } = require("../controllers/roomController");

// POST /api/rooms      — create new room
router.post("/", createRoom);

// GET /api/rooms/:roomId — get room info
router.get("/:roomId", getRoom);

module.exports = router;
