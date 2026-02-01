
const { GoogleGenAI } = require("@google/genai");

// MOCK ENV for testing
const API_KEY = process.env.GEMINI_API_KEY || process.argv[2];

if (!API_KEY) {
    console.error("Error: GEMINI_API_KEY is missing.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function testGen() {
    console.log("Testing ai.models.generateImages...");
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001', // Trying Imagen 4
            prompt: "A cute robot cat",
            config: {
                aspectRatio: "1:1",
                sampleCount: 1
            }
        });

        console.log("Response Received.");
        console.log("Keys:", Object.keys(response));
        if (response.predictions) {
            console.log("Predictions found:", response.predictions.length);
            console.log("First prediction keys:", Object.keys(response.predictions[0]));
            if (response.predictions[0].bytesBase64Encoded) {
                console.log("SUCCESS: Image generated (Base64 length: " + response.predictions[0].bytesBase64Encoded.length + ")");
            }
        } else {
            console.log("Response JSON:", JSON.stringify(response, null, 2));
        }

    } catch (e) {
        console.error("Generation Failed:", e);
    }
}

testGen();
