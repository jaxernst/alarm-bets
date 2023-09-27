import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPA_API_URL } from '$env/static/public';
import { PRIVATE_SUPA_SERVICE_KEY } from '$env/static/private';
import type { Database } from '../../../../alarm-bets-db';

export const supabase = createClient<Database>(PUBLIC_SUPA_API_URL, PRIVATE_SUPA_SERVICE_KEY, {
	auth: {
		persistSession: false
	}
});
