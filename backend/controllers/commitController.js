const Workspace = require("../models/Workspace");
const Commit = require("../models/Commit");

/**
 * POST /api/commits
 * Create a new commit (auto or manual).
 */
const createCommit = async (req, res) => {
  try {
    const { roomId, codeContent, type, message } = req.body;
    
    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    const workspace = await Workspace.findOne({ roomId });
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const createdBy = req.user ? req.user.name : "Anonymous";
    const commitType = type === "manual" ? "manual" : "auto";

    // Fetch the latest commit for this workspace
    const latestCommit = await Commit.findOne({ workspaceId: workspace._id }).sort({ createdAt: -1 });

    // Do NOT create commit if code is identical to last commit
    if (latestCommit && latestCommit.codeContent === codeContent) {
      return res.status(400).json({ message: "Code is identical to the last commit" });
    }

    // Limit to max 1 auto commit every 30 seconds
    if (commitType === "auto" && latestCommit && latestCommit.type === "auto") {
      const timeDiff = Date.now() - new Date(latestCommit.createdAt).getTime();
      if (timeDiff < 30000) {
        return res.status(429).json({ message: "Auto commit rate limit exceeded (30 seconds)" });
      }
    }

    const newCommit = await Commit.create({
      workspaceId: workspace._id,
      codeContent,
      createdBy,
      type: commitType,
      message: commitType === "manual" ? message : undefined,
    });

    workspace.currentCommitId = newCommit._id;
    await workspace.save();

    // Clean up older commits (keep max 100)
    const commitCount = await Commit.countDocuments({ workspaceId: workspace._id });
    if (commitCount > 100) {
      const commitsToDelete = await Commit.find({ workspaceId: workspace._id })
        .sort({ createdAt: 1 }) // oldest first
        .limit(commitCount - 100);
      
      const idsToDelete = commitsToDelete.map(c => c._id);
      await Commit.deleteMany({ _id: { $in: idsToDelete } });
    }

    res.status(201).json(newCommit);
  } catch (error) {
    console.error("createCommit error:", error);
    res.status(500).json({ message: "Failed to create commit" });
  }
};

/**
 * GET /api/commits/:roomId
 * Get commit history for a workspace.
 */
const getCommits = async (req, res) => {
  try {
    const { roomId } = req.params;

    const workspace = await Workspace.findOne({ roomId });
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const commits = await Commit.find({ workspaceId: workspace._id }).sort({ createdAt: -1 });

    res.status(200).json(commits);
  } catch (error) {
    console.error("getCommits error:", error);
    res.status(500).json({ message: "Failed to fetch commits" });
  }
};

/**
 * POST /api/commits/revert
 * Revert workspace code to a specific commit. ONLY owner can revert.
 */
const revertCommit = async (req, res) => {
  try {
    const { roomId, commitId } = req.body;

    if (!roomId || !commitId) {
      return res.status(400).json({ message: "Room ID and Commit ID are required" });
    }

    const workspace = await Workspace.findOne({ roomId });
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Check ownership
    if (!workspace.ownerId.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the workspace owner can revert commits" });
    }

    const commit = await Commit.findOne({ _id: commitId, workspaceId: workspace._id });
    if (!commit) {
      return res.status(404).json({ message: "Commit not found" });
    }

    // Replace workspace codeContent
    workspace.codeContent = commit.codeContent;
    workspace.currentCommitId = commit._id;
    await workspace.save();

    // Broadcast updated code via Socket.IO
    const io = req.app.get("io");
    if (io) {
      // Broadcast to everyone in the room
      io.to(roomId).emit("code-update", commit.codeContent);
    }

    res.status(200).json({ message: "Reverted successfully", code: commit.codeContent });
  } catch (error) {
    console.error("revertCommit error:", error);
    res.status(500).json({ message: "Failed to revert commit" });
  }
};

module.exports = {
  createCommit,
  getCommits,
  revertCommit,
};
