import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Single shared client instance for the whole app.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);