import type { RequestEvent } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export async function POST({ params }: RequestEvent) {
	// Remove all entries from the supabase table with the given address
	const { error } = await supabase
		.from('alarm_notifications')
		.delete()
		.match({ user_address: params.address });

	if (error) {
		return new Response(null, { status: 500 });
	}

	console.log('Unsubscribed from notifications');
	return new Response(null, { status: 200 });
}
