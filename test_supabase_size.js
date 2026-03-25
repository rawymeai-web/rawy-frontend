import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log("Fetching order RWY-J13I0G07L...");
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', 'RWY-J13I0G07L')
        .single();

    if (error) {
        console.error("Supabase Error:", error);
    } else {
        console.log("Success! Data keys:", Object.keys(data));
        console.log("story_data size:", JSON.stringify(data.story_data).length);
    }
}

testFetch();
