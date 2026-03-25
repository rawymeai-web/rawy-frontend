import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' }); // Fallback

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env or .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepWipeOrder(orderNumber) {
    const { data, error } = await supabase
        .from('orders')
        .select('story_data')
        .eq('order_number', orderNumber)
        .single();
        
    if (error) {
        console.error('Error fetching order:', error.message);
        return;
    }
    
    let storyData = data.story_data;
    if (!storyData) {
        console.error('No story_data found for order.');
        return;
    }
    
    console.log(`Starting deep wipe of all intermediate AI artifacts for ${orderNumber} to simulate a completely fresh "Process Legacy" run...`);

    // Wipe EVERYTHING except base user inputs
    const baseAttrs = [
        'theme', 'themeVisualDNA', 'childName', 'childGender', 'childAge',
        'mainCharacter', 'secondCharacter', 'mainCharacterImageBase64', 'secondCharacterImageBase64',
        'useSecondCharacter', 'occasion', 'customGoal', 'customIllustrationNotes', 'language', 'orderId'
    ];

    let cleanStoryData = {};
    for (const attr of baseAttrs) {
        if (storyData[attr] !== undefined) {
            cleanStoryData[attr] = storyData[attr];
        }
    }

    // Overwrite the story_data with just the base user inputs
    // This forcibly wipes blueprint, script, spreadPlan, finalPrompts, pages, coverImageUrl, selectedStylePrompt, etc.
    
    const { error: updateError } = await supabase
        .from('orders')
        .update({ story_data: cleanStoryData })
        .eq('order_number', orderNumber);
        
    if (updateError) {
        console.error('Error updating order:', updateError.message);
    } else {
        console.log(`\n✅ Successfully wiped EVERYTHING except base inputs for ${orderNumber}.`);
        console.log(`The database is totally pristine. You can run "Process Legacy" to generate fresh DNA, Story, Prompts, and Images from absolute scratch!`);
    }
}

deepWipeOrder('RWY-C3W1ASEWF');
