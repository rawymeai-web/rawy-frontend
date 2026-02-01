
const https = require('https');

const API_KEY = "AIzaSyAXA7DteqTMFjHtZmSVWV1ZOYoDQ3X2_b4";

const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models?key=${API_KEY}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
};

const fs = require('fs');

console.log(`Listing models...`);

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        let output = `Status Code: ${res.statusCode}\n`;
        if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            if (parsed.models) {
                console.log("AVAILABLE MODELS (Saving to file...):");
                output += "AVAILABLE MODELS:\n";
                parsed.models.forEach(m => {
                    console.log(`- ${m.name}`);
                    output += `- ${m.name}\n`;
                });
            } else {
                output += "No models found in response.\n";
            }
        } else {
            output += "Error Response:\n" + data;
        }
        fs.writeFileSync('valid_models.txt', output, 'utf8');
        console.log("Saved to valid_models.txt");
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
