import { supabase } from '$lib/supabaseClient';

/** @type {import('./$types').RequestHandler<{ address: EvmAddress}>} */
export async function GET({ params }) {
	const user = params.address;

	const { data, error } = await supabase
		.from('alarm_notifications')
		.select('alarm_id')
		.eq('user_address', user);

	if (error) {
		console.log('error', error);
		return new Response(null, { status: 500 });
	}

	return new Response(JSON.stringify(data), { status: 200 });
}
