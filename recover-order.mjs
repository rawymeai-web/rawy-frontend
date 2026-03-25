import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function extractOrder(orderNumber) {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();
    if (error) {
        console.error('Error fetching order:', error.message);
        return;
    }
    fs.writeFileSync('recovered_order.json', JSON.stringify(data.story_data, null, 2));
    console.log(`Successfully saved ${orderNumber} to recovered_order.json`);
}

extractOrder('RWY-XEUWLDJ9X');
