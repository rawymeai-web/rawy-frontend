
const https = require('https');

const API_KEY = "AIzaSyAXA7DteqTMFjHtZmSVWV1ZOYoDQ3X2_b4"; // Hardcoded from .env for the test script
const MODEL_NAME = "imagen-4.0-generate-001"; // The problem model

const payload = JSON.stringify({
    instances: [{ prompt: "A cute magical cat." }],
    parameters: { sampleCount: 1 }
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/${MODEL_NAME}:predict?key=${API_KEY}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

console.log(`Testing access to ${MODEL_NAME}...`);

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response Body: ${data}`);

        if (res.statusCode === 200) {
            console.log("SUCCESS: The model is responding!");
        } else {
            console.log("FAILURE: The model returned an error as expected.");
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
