
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAXA7DteqTMFjHtZmSVWV1ZOYoDQ3X2_b4";
const HOST = "http://127.0.0.1:4000";
// Guessing the endpoint logic based on SDK
const PROXY_URL = `${HOST}/api/gemini/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`;

async function testProxy() {
    try {
        console.log("Testing POST to:", PROXY_URL.replace(API_KEY, "HIDDEN_KEY"));

        const payload = {
            instances: [
                { prompt: "A fuzzy unshaped blob" }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "1:1"
            }
        };

        const response = await fetch(PROXY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Proxy POST Failed:", response.status, response.statusText);
            const text = await response.text();
            console.error("Response Body:", text);
        } else {
            console.log("Proxy POST Success! Status:", response.status);
            const data = await response.json();
            console.log("Image data received:", JSON.stringify(data).substring(0, 100) + "...");
        }
    } catch (e) {
        console.error("Proxy POST Error:", e.message);
    }
}

testProxy();
