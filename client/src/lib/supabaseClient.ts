import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPA_ANON_KEY } from '$env/static/public';

export const SUPA_API_URL = 'https://grrfumsrhgxumskbpmxw.supabase.co';
export const supabase = createClient(SUPA_API_URL, PUBLIC_SUPA_ANON_KEY);
