import type { RequestEvent } from './$types';
import type { PushSubscription } from 'web-push';
import { supabase } from '$lib/server/supabaseClient';

export type AlarmSubscriptionBody = PushSubscription;

export async function POST({ request, params }: RequestEvent) {
	const { address: userAddress, deviceId } = params;
	const subscription: AlarmSubscriptionBody = await request.json();

	// Save subscription to "alarm_notifications" table
	try {
		const { error } = await supabase.from('alarm_notifications').insert({
			subscription: subscription as any,
			user_address: userAddress,
			device_id: deviceId
		});

		if (error) throw error;

		console.log('Subscriptions saved');
	} catch (error) {
		console.error('Failed to save the subscription to the database: ', error);
		return new Response(null, { status: 500 });
	}

	return new Response(null, { status: 201 });
}
