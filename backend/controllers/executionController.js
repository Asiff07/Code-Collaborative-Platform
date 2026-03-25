

const JDOODLE_EXECUTE_URL = "https://api.jdoodle.com/v1/execute";

// Map our frontend language keys to JDoodle language codes and version indexes
const LANGUAGE_MAP = {
  javascript: { jdoodleLang: "nodejs", versionIndex: "4" }, // Node.js 17.x
  typescript: { jdoodleLang: "nodejs", versionIndex: "4" }, // Executed as JS via JDoodle requires manual transpiling or simple execution if pure JS syntax. For safety, we'll treat TS as JS.
  python: { jdoodleLang: "python3", versionIndex: "4" }, // Python 3.9.9
  java: { jdoodleLang: "java", versionIndex: "4" }, // JDK 17
  cpp: { jdoodleLang: "cpp", versionIndex: "5" }, // GCC 11.1.0
  "c++": { jdoodleLang: "cpp", versionIndex: "5" },
};

exports.executeCode = async (req, res) => {
  const { language, code } = req.body;

  try {
    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        message: "Server missing JDoodle API tokens. Please add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to the backend .env file." 
      });
    }

    const config = LANGUAGE_MAP[language];
    if (!config) {
      return res.status(400).json({ message: `Language '${language}' is not supported for execution.` });
    }

    const response = await fetch(JDOODLE_EXECUTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        clientSecret,
        script: code,
        language: config.jdoodleLang,
        versionIndex: config.versionIndex,
      })
    });

    const responseData = await response.json();

    // Translate JDoodle format to our standard output format
    const { output, statusCode, memory, cpuTime, error } = responseData;
    
    // Determine if execution failed
    const hasError = output && output.toLowerCase().includes("error");

    res.json({
      run: {
        stdout: !hasError ? output : "",
        stderr: hasError ? output : "",
        code: statusCode || 0,
        signal: null,
      },
      compile: {
        output: error || null
      }
    });

  } catch (error) {
    console.error("Execution error:", error.response?.data || error.message);
    res.status(500).json({ 
      message: error.response?.data?.error || "An error occurred while executing code." 
    });
  }
};
