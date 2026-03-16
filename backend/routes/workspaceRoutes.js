const express = require("express");
const router = express.Router();
const {
  createWorkspace,
  getUserWorkspaces,
  joinWorkspace,
  getWorkspace,
  deleteWorkspace,
} = require("../controllers/workspaceController");

const { protect } = require("../middleware/authMiddleware");

// Require auth for all workspace routes
router.use(protect);

// GET /api/workspaces — get list of workspaces for user
router.get("/", getUserWorkspaces);

// POST /api/workspaces — create new workspace
router.post("/", createWorkspace);

// POST /api/workspaces/join — join existing workspace
router.post("/join", joinWorkspace);

// GET /api/workspaces/:roomId — get workspace details
router.get("/:roomId", getWorkspace);

// DELETE /api/workspaces/:roomId — delete workspace
router.delete("/:roomId", deleteWorkspace);

module.exports = router;
