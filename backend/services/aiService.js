const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

const getAiModel = () => {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  // Upgraded to gemini-2.5-flash as the API key is using the latest model endpoint!
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

const generateReview = async (code, language) => {
  const model = getAiModel();
  const prompt = `You are an expert ${language} code reviewer. Review the following code snippet and suggest improvements focusing on readability, performance, security, and best practices. Respond in markdown format.

Here is the code:
\`\`\`${language}
${code}
\`\`\`
`;
  const result = await model.generateContent(prompt);
  return result.response.text();
};

const generateExplanation = async (code, language) => {
  const model = getAiModel();
  const prompt = `You are a helpful programming tutor. Explain the following ${language} code snippet in simple, easy-to-understand terms meant for a beginner to intermediate developer. Respond in markdown format.

Here is the code:
\`\`\`${language}
${code}
\`\`\`
`;
  const result = await model.generateContent(prompt);
  return result.response.text();
};

const generateAssistance = async (userPrompt, code, language) => {
  const model = getAiModel();
  const prompt = `You are a pair-programming AI assistant. The user is asking you for help regarding this specific ${language} code snippet:

\`\`\`${language}
${code}
\`\`\`

User Request: "${userPrompt}"

Provide a comprehensive, accurate response. If you are suggesting new or refactored code, include it in standard markdown code blocks.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

module.exports = {
  generateReview,
  generateExplanation,
  generateAssistance,
};
