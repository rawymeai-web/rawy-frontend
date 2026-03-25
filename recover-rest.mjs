import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

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
