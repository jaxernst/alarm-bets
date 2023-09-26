import type { RequestEvent } from '@sveltejs/kit';
import { PRIVATE_VAPID_KEY } from '$env/static/private';
import { PUBLIC_VAPID_KEY } from '$env/static/public';
import type { PushSubscription } from 'web-push';
import webpush from 'web-push';
import { supabase } from '$lib/supabaseClient';
import type { EvmAddress } from '$lib/types';

export type AlarmSubscriptionBody = {
	subscription: PushSubscription;
	deviceId: string;
	userAddress: EvmAddress;
}[];

export async function POST({ request }: RequestEvent) {
	const subscriptions: AlarmSubscriptionBody = await request.json();
	webpush.setVapidDetails('mailto:jaxernst@gmail.com', PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY);

	// Save subscription to "alarm_notifications" table
	try {
		// This should eventually be refactored to insert multiple rows at once
		const { error } = await supabase.from('alarm_notifications').insert(
			subscriptions.map(({ subscription, userAddress, deviceId }) => ({
				subscription: subscription as any,
				user_address: userAddress,
				device_id: deviceId
			}))
		);

		if (error) throw error;

		console.log('Subscriptions saved');
	} catch (error) {
		console.error('Failed to save the subscription to the database: ', error);
		return new Response(null, { status: 500 });
	}

	return new Response(null, { status: 201 });
}
