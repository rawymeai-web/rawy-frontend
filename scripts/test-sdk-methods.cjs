
const { GoogleGenAI } = require("@google/genai");

// MOCK ENV for testing
const API_KEY = process.env.GEMINI_API_KEY || process.argv[2];

if (!API_KEY) {
    console.error("Error: GEMINI_API_KEY is missing.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function inspectSDK() {
    console.log("Inspecting SDK keys...");
    console.log("ai keys:", Object.keys(ai));
    if (ai.models) {
        console.log("ai.models keys:", Object.keys(ai.models));
        console.log("ai.models prototype keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(ai.models)));
    }
}

inspectSDK();
