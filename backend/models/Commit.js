const mongoose = require("mongoose");

const commitSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    codeContent: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String, // Keeping it simple: username of creator
      required: true,
    },
    type: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto",
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Commit", commitSchema);
