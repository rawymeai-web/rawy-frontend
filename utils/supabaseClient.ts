
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const getSupabaseClient = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("Missing Supabase environment variables! Using fallback client.");
        // Return a dummy client that warns on use but triggers error handling
        const dummyError = { message: "No Supabase Config (Dev Mode)" };
        return {
            from: () => ({
                select: () => ({
                    single: () => Promise.resolve({ data: null, error: dummyError }),
                    order: () => Promise.resolve({ data: [], error: dummyError }), // Correct return shape
                    eq: () => ({ single: () => Promise.resolve({ data: null, error: dummyError }) })
                }),
                upsert: () => Promise.resolve({ error: dummyError }), // Trigger fallback
                insert: () => Promise.resolve({ error: dummyError }), // Trigger fallback
                update: () => ({ eq: () => Promise.resolve({ error: dummyError }) })
            }),
            storage: {
                from: () => ({
                    upload: () => Promise.resolve({ data: null, error: dummyError }),
                    getPublicUrl: () => ({ data: { publicUrl: "" } })
                })
            }
        } as any;
    }
    return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = getSupabaseClient();
