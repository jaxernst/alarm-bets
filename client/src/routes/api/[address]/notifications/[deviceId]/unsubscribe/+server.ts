import type { RequestEvent } from './$types';
import { supabase } from '$lib/server/supabaseClient';

export async function POST({ params }: RequestEvent) {
	// Remove all entries from the supabase table with the given address
	const { error } = await supabase
		.from('alarm_notifications')
		.delete()
		.eq('user_address', params.address)
		.eq('device_id', params.deviceId);

	if (error) {
		return new Response(null, { status: 500 });
	}

	console.log('Unsubscribed from notifications');
	return new Response(null, { status: 200 });
}
