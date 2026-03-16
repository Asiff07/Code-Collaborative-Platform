const { v4: uuidv4 } = require("uuid");
const { getOrCreateRoom } = require("../services/roomService");

/**
 * POST /api/rooms
 * Creates a new room with a randomly-generated UUID roomId.
 */
const createRoom = async (req, res) => {
  try {
    const roomId = uuidv4();
    const room = await getOrCreateRoom(roomId);
    res.status(201).json({ roomId: room.roomId, language: room.language });
  } catch (error) {
    console.error("createRoom error:", error);
    res.status(500).json({ message: "Failed to create room" });
  }
};

/**
 * GET /api/rooms/:roomId
 * Returns metadata for an existing room (language, existence).
 */
const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId?.trim()) {
      return res.status(400).json({ message: "Room ID is required" });
    }
    const room = await getOrCreateRoom(roomId.trim());
    res.status(200).json({
      roomId: room.roomId,
      language: room.language,
      lastUpdated: room.lastUpdated,
      createdAt: room.createdAt,
    });
  } catch (error) {
    console.error("getRoom error:", error);
    res.status(500).json({ message: "Failed to fetch room" });
  }
};

module.exports = { createRoom, getRoom };
