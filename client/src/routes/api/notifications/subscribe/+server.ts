import type { RequestEvent } from '@sveltejs/kit';
import { PRIVATE_VAPID_KEY } from '$env/static/private';
import { PUBLIC_VAPID_KEY } from '$env/static/public';
import type { PushSubscription } from 'web-push';
import webpush from 'web-push';

/**
 * Update cached user alarm data
 * TODO: Make this an authenticated route so alarm data can only be updated by
 * a signed in wallet
 * */
export async function POST({ request }: RequestEvent) {
	const subscription: PushSubscription = await request.json();
	webpush.setVapidDetails('mailto:jaxernst@gmail.com', PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY);

	await new Promise((resolve) => {
		setTimeout(resolve, 1000);
	});

	webpush.sendNotification(subscription, JSON.stringify({ title: 'Hello Notification' }));

	return new Response(null, { status: 200 });
}
