
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const getSupabaseClient = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("Missing Supabase environment variables! Using fallback client.");
        // Return a dummy client that warns on use but doesn't crash app load
        return {
            from: () => ({
                select: () => ({ single: () => Promise.resolve({ data: null, error: { message: "No Supabase Config" } }), order: () => ({}), eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
                upsert: () => Promise.resolve({ error: null }),
                insert: () => Promise.resolve({ error: null }),
                update: () => ({ eq: () => Promise.resolve({ error: null }) })
            }),
            storage: {
                from: () => ({ upload: () => Promise.resolve({ data: null, error: { message: "No Storage Config" } }), getPublicUrl: () => ({ data: { publicUrl: "" } }) })
            }
        } as any;
    }
    return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = getSupabaseClient();
