
const https = require('https');

const API_KEY = "AIzaSyAXA7DteqTMFjHtZmSVWV1ZOYoDQ3X2_b4";
const MODEL_NAME = "gemini-1.5-flash";

const payload = JSON.stringify({
    contents: [{ parts: [{ text: "Hello, are you working?" }] }]
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
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
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
