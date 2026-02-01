
const https = require('https');

// Read API Key from arguments or hardcode for test (simulating env)
const API_KEY = process.argv[2] || "AIzaSyB6TkL5sgK3u72V1FsZuubhmegq9OrMHpE";

if (!API_KEY) {
    console.error("Please provide API KEY as argument");
    process.exit(1);
}

const prompt = "A cute cartoon dinosaur in space suit, 3d render style";
// UPDATED MODEL
const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`;

const payload = {
    instances: [{ prompt }],
    parameters: {
        sampleCount: 1,
        aspectRatio: "1:1"
    }
};

console.log("Testing Imagen 4.0 API...");
console.log("URL:", url.replace(API_KEY, "HIDDEN_KEY"));

const req = https.request(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        if (res.statusCode !== 200) {
            console.error("Error Response:", data);
        } else {
            try {
                const json = JSON.parse(data);
                // Check for predictions (standard Vertex/Imagen format)
                if (json.predictions && json.predictions[0] && json.predictions[0].bytesBase64Encoded) {
                    console.log("SUCCESS! Image generated. Base64 length:", json.predictions[0].bytesBase64Encoded.length);
                } else {
                    console.log("Response OK but unexpected structure:", JSON.stringify(json, null, 2));
                }
            } catch (e) {
                console.error("Failed to parse JSON:", e);
                console.log("Raw Response:", data);
            }
        }
    });
});

req.on('error', (e) => {
    console.error("Request Error:", e);
});

req.write(JSON.stringify(payload));
req.end();
