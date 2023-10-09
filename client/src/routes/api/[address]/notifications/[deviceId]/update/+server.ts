import type { RequestEvent } from './$types';
import type { PushSubscription } from 'web-push';
import { supabase } from '$lib/server/supabaseClient';
import { deepEqual } from '@wagmi/core';

export type AlarmSubscriptionBody = PushSubscription;

export async function POST({ request, params }: RequestEvent) {
	const { deviceId } = params;
	const subscription: AlarmSubscriptionBody = await request.json();
	console.log('deviceId', deviceId, 'subscription', subscription);
	if (!subscription) {
		return new Response('No subscription received', { status: 400 });
	}

	// Save subscription to "alarm_notifications" table
	try {
		const { data } = await supabase
			.from('alarm_notifications')
			.select('subscription')
			.match({ device_id: deviceId });

		// If all subscriptions match the new one, don't update
		if (
			data &&
			data.every((row) => {
				return deepEqual(row.subscription, subscription);
			})
		) {
			console.log('Subscription already up to date');
			return new Response(null, { status: 200 });
		}

		// Update db notifications for all matching deviceID subscriptions
		// TODO: Don't update if the subscriptions is the same
		const { error } = await supabase
			.from('alarm_notifications')
			.update({
				subscription: subscription as any
			})
			.match({ device_id: deviceId });

		console.log('Subscription update for device', deviceId);
		if (error) throw error;
	} catch (error) {
		console.error('Failed to save the subscription to the database: ', error);
		return new Response(null, { status: 500 });
	}

	return new Response(null, { status: 201 });
}
