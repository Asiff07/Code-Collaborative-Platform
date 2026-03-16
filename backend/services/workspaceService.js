const Workspace = require("../models/Workspace");

/**
 * Finds a workspace by roomId.
 * @param {string} roomId
 * @returns {Promise<Workspace|null>}
 */
const getWorkspaceByRoomId = async (roomId) => {
  return await Workspace.findOne({ roomId });
};

/**
 * Saves the latest code snapshot for a workspace (called after debounce).
 * @param {string} roomId
 * @param {string} code
 */
const updateWorkspaceCode = async (roomId, code) => {
  await Workspace.findOneAndUpdate(
    { roomId },
    { codeContent: code, lastUpdated: Date.now() },
    { new: true }
  );
};

/**
 * Updates the language setting for a workspace.
 * @param {string} roomId
 * @param {string} language
 */
const updateWorkspaceLanguage = async (roomId, language) => {
  await Workspace.findOneAndUpdate({ roomId }, { language });
};

module.exports = {
  getWorkspaceByRoomId,
  updateWorkspaceCode,
  updateWorkspaceLanguage,
};
