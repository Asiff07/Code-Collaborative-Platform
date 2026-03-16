const { v4: uuidv4 } = require("uuid");
const Workspace = require("../models/Workspace");

/**
 * POST /api/workspaces
 * Creates a new workspace.
 * Requires auth token (protect middleware), sets req.user._id as ownerId.
 */
const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    const roomId = uuidv4();
    const newWorkspace = await Workspace.create({
      roomId,
      name: name.trim(),
      ownerId: req.user._id,
      collaborators: [],
    });

    res.status(201).json(newWorkspace);
  } catch (error) {
    console.error("createWorkspace error:", error);
    res.status(500).json({ message: "Failed to create workspace" });
  }
};

/**
 * GET /api/workspaces
 * Returns list of workspaces where the user is either the owner or a collaborator.
 */
const getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.user._id;
    const workspaces = await Workspace.find({
      $or: [{ ownerId: userId }, { collaborators: userId }],
    })
      .populate("ownerId", "name email")
      .populate("collaborators", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(workspaces);
  } catch (error) {
    console.error("getUserWorkspaces error:", error);
    res.status(500).json({ message: "Failed to fetch workspaces" });
  }
};

/**
 * POST /api/workspaces/join
 * Joins an existing workspace using a roomId. Adds the user to the collaborators array if not already owner/collaborator.
 */
const joinWorkspace = async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId || !roomId.trim()) {
      return res.status(400).json({ message: "Room ID is required to join" });
    }

    const cleanRoomId = roomId.trim();
    const workspace = await Workspace.findOne({ roomId: cleanRoomId });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const userId = req.user._id;

    // Check if user is already owner or collaborator
    const isOwner = workspace.ownerId.equals(userId);
    const isCollaborator = workspace.collaborators.includes(userId);

    if (!isOwner && !isCollaborator) {
      workspace.collaborators.push(userId);
      await workspace.save();
    }

    res.status(200).json(workspace);
  } catch (error) {
    console.error("joinWorkspace error:", error);
    res.status(500).json({ message: "Failed to join workspace" });
  }
};

/**
 * GET /api/workspaces/:roomId
 * Returns details for a single workspace.
 */
const getWorkspace = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId || !roomId.trim()) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    const workspace = await Workspace.findOne({ roomId: roomId.trim() })
      .populate("ownerId", "name email")
      .populate("collaborators", "name email");

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Optional: check if user has access. We'll allow any logged in user who knows the ID to fetch it, 
    // but the frontend requires them to join it first typically.
    res.status(200).json(workspace);
  } catch (error) {
    console.error("getWorkspace error:", error);
    res.status(500).json({ message: "Failed to fetch workspace" });
  }
};

/**
 * DELETE /api/workspaces/:roomId
 * Deletes a workspace. Only the owner can delete it.
 */
const deleteWorkspace = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const workspace = await Workspace.findOne({ roomId });
    
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    
    if (!workspace.ownerId.equals(req.user._id)) {
      return res.status(403).json({ message: "You are not authorized to delete this workspace" });
    }

    await Workspace.deleteOne({ roomId });
    res.status(200).json({ message: "Workspace deleted successfully", roomId });
  } catch (error) {
    console.error("deleteWorkspace error:", error);
    res.status(500).json({ message: "Failed to delete workspace" });
  }
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  joinWorkspace,
  getWorkspace,
  deleteWorkspace,
};
