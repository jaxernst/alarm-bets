import type { RequestEvent } from '@sveltejs/kit';
import { PRIVATE_VAPID_KEY } from '$env/static/private';
import { PUBLIC_VAPID_KEY } from '$env/static/public';
import type { PushSubscription } from 'web-push';
import webpush from 'web-push';
import { supabase } from '$lib/supabaseClient';
import type { EvmAddress } from '$lib/types';

export type AlarmNoticationParams = {
	alarmTime: number;
	timezoneOffset: number;
	alarmId: number; // Should be a string
	userAddress: EvmAddress;
	alarmDays: number[];
}[];

type SubscriptionBody = {
	subscription: PushSubscription;
	params: AlarmNoticationParams;
};

export async function POST({ request }: RequestEvent) {
	const { subscription, params }: SubscriptionBody = await request.json();
	webpush.setVapidDetails('mailto:jaxernst@gmail.com', PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY);

	// Save subscription to "alarm_notifications" table
	try {
		// This should eventually be refactored to insert multiple rows at once
		for (const param of Object.values(params)) {
			const { data, error } = await supabase.from('alarm_notifications').insert([
				{
					subscription: subscription as any,
					alarm_time: param.alarmTime,
					timezone_offset: param.timezoneOffset,
					alarm_id: param.alarmId,
					alarm_days: param.alarmDays.toString(),
					user_address: param.userAddress
				}
			]);

			if (error) throw error;

			console.log('Subscription saved');
		}
	} catch (error) {
		console.error('Failed to save the subscription to the database: ', error);
		return new Response(null, { status: 500 });
	}

	return new Response(null, { status: 201 });
}
