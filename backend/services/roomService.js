const Room = require("../models/Room");

/**
 * Finds a room by roomId, or creates it if it doesn't exist.
 * @param {string} roomId
 * @returns {Promise<Room>}
 */
const getOrCreateRoom = async (roomId) => {
  let room = await Room.findOne({ roomId });
  if (!room) {
    room = await Room.create({ roomId, codeContent: "", language: "javascript" });
  }
  return room;
};

/**
 * Saves the latest code snapshot for a room (called after debounce).
 * @param {string} roomId
 * @param {string} code
 */
const updateRoomCode = async (roomId, code) => {
  await Room.findOneAndUpdate(
    { roomId },
    { codeContent: code, lastUpdated: Date.now() },
    { upsert: true, new: true }
  );
};

/**
 * Returns a room's current code content from MongoDB.
 * @param {string} roomId
 * @returns {Promise<string>}
 */
const getRoomCode = async (roomId) => {
  const room = await Room.findOne({ roomId });
  return room ? room.codeContent : "";
};

/**
 * Updates the language setting for a room.
 * @param {string} roomId
 * @param {string} language
 */
const updateRoomLanguage = async (roomId, language) => {
  await Room.findOneAndUpdate({ roomId }, { language }, { upsert: true });
};

module.exports = { getOrCreateRoom, updateRoomCode, getRoomCode, updateRoomLanguage };
