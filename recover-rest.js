const fs = require('fs');

const supabaseUrl = 'https://ofsznchhhymfowdtnuux.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mc3puY2hoaHltZm93ZHRudXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgzMTU4MTcsImV4cCI6MjAzMzg5MTgxN30.HH9Q8bDlPuHxWIvjoopGEhD89Q8bDlPuHxWIvjoopGEhD8';

async function extractOrder(orderNumber) {
    const url = `${supabaseUrl}/rest/v1/orders?order_number=eq.${orderNumber}&select=story_data`;
    console.log(`Fetching from: ${url}`);

    const response = await fetch(url, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });

    if (!response.ok) {
        console.error('HTTP Error:', response.status);
        console.error(await response.text());
        return;
    }

    const json = await response.json();
    if (json && json.length > 0) {
        fs.writeFileSync('recovered_order.json', JSON.stringify(json[0].story_data, null, 2));
        console.log(`Successfully saved ${orderNumber} payload to recovered_order.json`);
    } else {
        console.log('Order not found or no data returned.');
    }
}

extractOrder('RWY-XEUWLDJ9X');
