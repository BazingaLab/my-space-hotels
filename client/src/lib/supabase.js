import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create ONE single instance shared across the entire app
// Multiple instances cause undefined auth behavior
if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase env vars missing");
}

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: "myspace-hotels-auth", // unique key prevents conflicts
      },
    })
  : null;