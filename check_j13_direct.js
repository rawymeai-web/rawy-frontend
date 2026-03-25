const https = require('https');

const supabaseUrl = 'https://klnszzngiuzsclcvkgrf.supabase.co'; // Baryonic Solstice endpoint from previous logs? Wait, the user said `wqklukruzxicjaeblser` on Pulsing Planetary. Let's use that one.
const url = 'https://wqklukruzxicjaeblser.supabase.co/rest/v1/orders?order_number=eq.RWY-J13I0G07L&select=story_data';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxa2x1a3J1enhpY2phZWJsc2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODAwNTEsImV4cCI6MjA4NTI1NjA1MX0.JN9StTmoN-icdJL3sg-HH9Q8bDlPuHxWIvjoopGEhD8';

const options = {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(data.substring(0, 500) + '...');
        require('fs').writeFileSync('j13_direct.json', data);
    });
}).on('error', err => console.log('Error:', err.message));
