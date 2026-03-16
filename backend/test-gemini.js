require("dotenv").config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("NO API KEY");
    return;
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data.error) {
       console.error("API Error:", data.error);
    } else {
       console.log("AVAILABLE MODELS:");
       data.models.forEach(m => console.log(`- ${m.name} (Supported: ${m.supportedGenerationMethods.join(", ")})`));
    }
  } catch(e) {
    console.error("List error:", e.message);
  }
}
run();
