const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'wqklukruzxicjaeblser.supabase.co',
  port: 443,
  path: '/rest/v1/orders?order_number=eq.RWY-C3W1ASEWF&select=*',
  method: 'GET',
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxa2x1a3J1enhpY2phZWJsc2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODAwNTEsImV4cCI6MjA4NTI1NjA1MX0.JN9StTmoN-icdJL3sg-HH9Q8bDlPuHxWIvjoopGEhD8",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxa2x1a3J1enhpY2phZWJsc2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODAwNTEsImV4cCI6MjA4NTI1NjA1MX0.JN9StTmoN-icdJL3sg-HH9Q8bDlPuHxWIvjoopGEhD8"
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (!data || data.length === 0) {
        console.log("No order found");
        return;
      }
      const order = data[0];
      const sd = order.story_data;
      if (sd) {
          if (sd.mainCharacter) {
              delete sd.mainCharacter.imageBases64;
              delete sd.mainCharacter.imageDNA;
              delete sd.mainCharacter.base64;
          }
          if (sd.secondCharacter) {
              delete sd.secondCharacter.imageBases64;
              delete sd.secondCharacter.imageDNA;
              delete sd.secondCharacter.base64;
          }
          if (sd.finalPrompts) {
              sd.finalPrompts.forEach(p => {
                  if (p.imagePrompt && p.imagePrompt.includes('/9j/')) {
                      p.imagePrompt = p.imagePrompt.substring(0, 500) + '...[REDACTED]';
                  }
              });
          }
          if (sd.pages) {
              sd.pages.forEach(p => {
                  if (p.illustrationUrl && p.illustrationUrl.length > 200) {
                      p.illustrationUrl = p.illustrationUrl.substring(0, 50) + '...';
                  }
              });
          }
          if (sd.styleReferenceImageUrl && sd.styleReferenceImageUrl.length > 200) {
              sd.styleReferenceImageUrl = sd.styleReferenceImageUrl.substring(0, 50) + '...';
          }
      }
      fs.writeFileSync('clean_order.json', JSON.stringify(order, null, 2));
      console.log("Wrote clean_order.json successfully.");
      console.log("Has useSecondCharacter:", sd && sd.useSecondCharacter);
    } catch(e) { console.error("Parse error", e); }
  });
});

req.on('error', (e) => { console.error(e); });
req.end();
