require("dotenv").config();
const { generateReview } = require("./services/aiService");

async function run() {
  try {
    console.log("Testing generateReview...");
    const res = await generateReview("console.log('hello world');", "javascript");
    console.log("SUCCESS:\n", res);
  } catch(e) {
    console.error("ERROR:");
    console.error(e);
  }
}
run();
