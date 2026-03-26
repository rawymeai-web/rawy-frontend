import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wqklukruzxicjaeblser.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxa2x1a3J1enhpY2phZWJsc2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODAwNTEsImV4cCI6MjA4NTI1NjA1MX0.JN9StTmoN-icdJL3sg-HH9Q8bDlPuHxWIvjoopGEhD8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: latestOrder, error } = await supabase
        .from('orders')
        .select('order_number, story_data')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (error) {
        console.error('Error fetching order', error);
        return;
    }
    
    const storyData = latestOrder.story_data;
    
    console.log("== ORDER", latestOrder.order_number, "==");
    
    console.log("Blueprint Spreads length:", storyData.blueprint?.structure?.spreads?.length);
    if (storyData.blueprint?.structure?.spreads) {
        storyData.blueprint.structure.spreads.forEach(s => {
            console.log(`Blueprint Spread ${s.spreadNumber}: focus="${s.visualFocus}", action="${s.highlightAction}"`);
        });
    }

    console.log("\nSpread Plan (Director) Spreads length:", storyData.spreadPlan?.spreads?.length);
    if (storyData.spreadPlan?.spreads) {
        storyData.spreadPlan.spreads.forEach(s => {
            console.log(`Plan Spread ${s.spreadNumber}: action="${s.keyActions}"`);
        });
    }
    
    console.log("\nFinal Prompts length:", storyData.finalPrompts?.length);
    if (storyData.finalPrompts) {
        storyData.finalPrompts.forEach((p, idx) => {
            console.log(`Prompt ${idx} (Spread ${p.spreadNumber}):\n`, p.imagePrompt.split("pose_orientation\": \"")[1]?.split("\",")[0]);
        });
    }
}
run();
