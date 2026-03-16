const aiService = require("../services/aiService");
const User = require("../models/User");
const fs = require("fs");

// Helper to check credit
const checkCredit = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if (user.credits <= 0) {
    throw new Error("Insufficient credits. Please upgrade or wait for a refill.");
  }
  return user;
};

// Helper to actually deduct
const deductCredit = async (user) => {
  user.credits -= 1;
  await user.save();
  return user.credits;
};

const reviewCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ message: "Code snippet is required" });

    // Check credit first
    const user = await checkCredit(req.user._id);

    // Run AI request
    const responseText = await aiService.generateReview(code, language || "javascript");

    // Deduct credit only after success
    const newCredits = await deductCredit(user);

    res.status(200).json({ result: responseText, credits: newCredits });
  } catch (error) {
    console.error("AI Review error:", error);
    fs.appendFileSync("debug-error.log", `\n[REVIEW] ${error.message}\n${error.stack}\n`);
    res.status(error.message.includes("Insufficient") ? 403 : 500).json({ message: error.message || "Failed to generate AI review" });
  }
};

const explainCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ message: "Code snippet is required" });

    const user = await checkCredit(req.user._id);
    const responseText = await aiService.generateExplanation(code, language || "javascript");
    const newCredits = await deductCredit(user);

    res.status(200).json({ result: responseText, credits: newCredits });
  } catch (error) {
    console.error("AI Explain error:", error);
    fs.appendFileSync("debug-error.log", `\n[EXPLAIN] ${error.message}\n${error.stack}\n`);
    res.status(error.message.includes("Insufficient") ? 403 : 500).json({ message: error.message || "Failed to generate AI explanation" });
  }
};

const assistCode = async (req, res) => {
  try {
    const { prompt, code, language } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt is required" });
    if (!code) return res.status(400).json({ message: "Code snippet is required" });

    const user = await checkCredit(req.user._id);
    const responseText = await aiService.generateAssistance(prompt, code, language || "javascript");
    const newCredits = await deductCredit(user);

    res.status(200).json({ result: responseText, credits: newCredits });
  } catch (error) {
    console.error("AI Assist error:", error);
    fs.appendFileSync("debug-error.log", `\n[ASSIST] ${error.message}\n${error.stack}\n`);
    res.status(error.message.includes("Insufficient") ? 403 : 500).json({ message: error.message || "Failed to generate AI assistance" });
  }
};

module.exports = {
  reviewCode,
  explainCode,
  assistCode,
};
