import type { RequestEvent } from '@sveltejs/kit';
import { PRIVATE_VAPID_KEY } from '$env/static/private';
import { PUBLIC_VAPID_KEY } from '$env/static/public';
import type { PushSubscription } from 'web-push';
import webpush from 'web-push';
import { supabase } from '$lib/supabaseClient';
import type { EvmAddress } from '$lib/types';

type SubscriptionBody = {
	subscription: PushSubscription;
	params: {
		alarmTime: number;
		timezoneOffset: number;
		alarmId: number;
		userAddress: EvmAddress;
		alarmDays: number[];
	};
};

export async function POST({ request }: RequestEvent) {
	const { subscription, params }: SubscriptionBody = await request.json();

	webpush.setVapidDetails('mailto:jaxernst@gmail.com', PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY);

	// Save subscription to "alarm_notifications" table
	try {
		const { data, error } = await supabase.from('alarm_notifications').insert([
			{
				subscription, // jsonb
				alarm_time: params.alarmTime,
				timezone_offset: params.timezoneOffset,
				alarm_id: params.alarmId,
				alarm_days: params.alarmDays.toString(),
				user_address: params.userAddress
			}
		]);

		if (error) throw error;

		console.log('Subscription saved');
	} catch (error) {
		console.error('Failed to save the subscription to the database: ', error);
		return new Response(null, { status: 500 });
	}

	return new Response(null, { status: 201 });
}
