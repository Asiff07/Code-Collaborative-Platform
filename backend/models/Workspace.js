const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    codeContent: {
      type: String,
      default: "",
    },
    currentCommitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commit",
    },
    language: {
      type: String,
      default: "javascript",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);
