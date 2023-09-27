import { supabase } from '$lib/server/supabaseClient';
import type { RequestEvent } from './$types';

/** @type {import('./$types').RequestHandler<{ address: EvmAddress}>} */
export async function GET({ params }: RequestEvent) {
	const { address: user, deviceId } = params;

	const { data, error } = await supabase
		.from('alarm_notifications')
		.select('device_id')
		.eq('user_address', user)
		.eq('device_id', deviceId);

	if (error) {
		console.log('error', error);
		return new Response(null, { status: 500 });
	}

	return new Response(JSON.stringify({ subscribed: data.length > 0 }), { status: 200 });
}
