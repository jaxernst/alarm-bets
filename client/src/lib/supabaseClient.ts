import { createClient } from '@supabase/supabase-js';

export const SUPA_API_URL = 'https://grrfumsrhgxumskbpmxw.supabase.co';
export const supabase = createClient(SUPA_API_URL, import.meta.env.VITE_SUPA_ANON_KEY);
