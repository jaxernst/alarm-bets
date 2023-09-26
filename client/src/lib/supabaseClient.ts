import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPA_ANON_KEY, PUBLIC_SUPA_API_URL } from '$env/static/public';
import type { Database } from '../../../alarm-bets-db';

export const supabase = createClient<Database>(PUBLIC_SUPA_API_URL, PUBLIC_SUPA_ANON_KEY, {
	auth: {
		persistSession: false
	}
});
