
const https = require('https');

// 1. CONFIGURATION
const API_KEY = "AIzaSyAXA7DteqTMFjHtZmSVWV1ZOYoDQ3X2_b4";
const MODEL_NAME = "imagen-3.0-generate-001"; // Using the stable model we switched to

// 2. MOCK DATA (Simulating what the app generates)
const subjectDescription = "A happy 5-year-old boy with curly brown hair, distinct freckles on nose, wearing a blue t-shirt.";
const style = "3D Pixar Style, cute, vibrant, detailed texture";
const themeContext = `CONTEXT: The child is in a "Space Adventure" setting. (e.g.Space, Jungle, etc).`;
const masterGuardrails = "DO NOT USE TEXT. NO WATERMARKS.";

// 3. CONSTRUCT THE PROMPT (Exact logic from geminiService.ts)
const prompt = `TASK: CLOSE - UP PORTRAIT of Main Character.
        STYLE: ${style}.
    PROTAGONIST: ${subjectDescription}
    CAMERA: Medium - Close shot(Head & Shoulders).Focus heavily on FACE and EXPRESSION.
        ${themeContext}
    
${masterGuardrails} `;

// 4. PREPARE REQUEST
const payload = JSON.stringify({
    instances: [{ prompt: prompt }],
    parameters: {
        sampleCount: 1,
        aspectRatio: "1:1" // The app uses 1:1 for previews
    }
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

// 5. EXECUTE AND LOG
console.log("---------------------------------------------------");
console.log("TESTING 'VERIFY THE HERO' GENERATION");
console.log("---------------------------------------------------");
console.log("FULL PROMPT BEING SENT:");
console.log(prompt);
console.log("---------------------------------------------------");
console.log(`Sending request to ${MODEL_NAME}...`);

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log("---------------------------------------------------");
        console.log(`STATUS CODE: ${res.statusCode}`);

        if (res.statusCode === 200) {
            console.log("SUCCESS! The API generated an image.");
            // Don't dump the huge base64 string, just confirm it exists
            const parsed = JSON.parse(data);
            if (parsed.predictions && parsed.predictions[0].bytesBase64Encoded) {
                console.log(`IMAGE DATA RECEIVED: ${parsed.predictions[0].bytesBase64Encoded.substring(0, 50)}... (truncated)`);
            } else {
                console.log("WARNING: 200 OK but no image data found in response?");
                console.log(data.substring(0, 200));
            }
        } else {
            console.log("FAILURE! API returned an error.");
            console.log("ERROR BODY:");
            console.log(data);
        }
        console.log("---------------------------------------------------");
    });
});

req.on('error', (e) => {
    console.error(`NETWORK ERROR: ${e.message}`);
});

req.write(payload);
req.end();
