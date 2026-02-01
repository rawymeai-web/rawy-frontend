
const https = require('https');

const API_KEY = "AIzaSyAXA7DteqTMFjHtZmSVWV1ZOYoDQ3X2_b4";
const MODEL_NAME = "imagen-4.0-generate-001";

// Simple prompt payload
const payload = JSON.stringify({
    instances: [
        { prompt: "A water color painting of a cat" }
    ],
    parameters: {
        sampleCount: 1,
        aspectRatio: "1:1"
    }
});

function testEndpoint(method, pathDesc) {
    const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1beta/models/${MODEL_NAME}:${method}?key=${API_KEY}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    };

    console.log(`Testing ${pathDesc} -> /v1beta/models/${MODEL_NAME}:${method}`);

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`[${pathDesc}] Status: ${res.statusCode}`);
            if (res.statusCode !== 200) {
                console.log(`Response: ${data.substring(0, 300)}`);
            } else {
                console.log("SUCCESS!");
            }
            console.log('-----------------------------------');
        });
    });

    req.on('error', (e) => {
        console.error(`[${pathDesc}] Error: ${e.message}`);
    });

    req.write(payload);
    req.end();
}

// Test 1: Standard predict (used in app)
testEndpoint('predict', 'Standard Predict');

// Test 2: generateContent (Gemini style)
// Payload is different for generateContent, so we make a quick separate request if needed,
// but let's just see if predict is indeed 405 or 404.
