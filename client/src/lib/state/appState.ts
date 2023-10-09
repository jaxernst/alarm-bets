import { derived, get, writable, type Readable } from 'svelte/store';
import { account } from './chainConfig';
import { userAlarms } from './contractStores';
import {
	deviceHash,
	notificationPermissionGranted,
	subscribeToPushNotifications,
	updatePushSubscription
} from '$lib/util';
import type { EvmAddress } from '$lib/types';

export type Tab = 'alarms' | 'new' | 'join';
export const activeTab = writable<Tab>('alarms');

export const showWelcome = writable(true);
export const welcomeHasBeenViewed = writable(false);

const fetchNotificationState = async (address: EvmAddress) => {
	const res = await fetch(`/api/${address}/notifications/${await deviceHash()}/status`);
	const { subscribed }: { subscribed: boolean } = await res.json();
	return subscribed;
};

export const notifications = (() => {
	const enabledBackend = writable<boolean>();
	const enabledClient = writable<boolean>(notificationPermissionGranted());
	const enabled = derived([enabledBackend, enabledClient], ([$enabledBackend, $enabledClient]) => {
		return $enabledBackend && $enabledClient;
	});

	const loading = writable(false);
	let subscriptionRefreshed = false;

	// Auto fetch notification status once an account is available
	account.subscribe(async ($account) => {
		if (!$account?.address) return;
		const enabled = await fetchNotificationState($account.address);
		enabledBackend.set(enabled);

		// Push subscriptions need to be resubscribed to to keep them active, do this once
		if (enabled && !subscriptionRefreshed && notificationPermissionGranted()) {
			subscriptionRefreshed = true;
			updatePushSubscription();
		}
	});

	const enableReady = derived([account, userAlarms], ([$account, $userAlarms]) => {
		return $account?.address ? true : false;
	});

	const toggleNotifications = derived(
		[account, enabledBackend, enabledClient],
		([$account, $enabledBackend, $enabledClient]) => {
			const toggle = async () => {
				if (!$account?.address) return;

				const deviceId = await deviceHash();

				if ($enabledBackend && $enabledClient) {
					const res = await fetch(
						`/api/${$account.address}/notifications/${deviceId}/unsubscribe`,
						{
							method: 'POST'
						}
					);

					res.ok && enabledBackend.set(false);
				} else {
					// Get subscription object from the browser web-push api
					const subscription = await subscribeToPushNotifications();
					if (!subscription) return;

					enabledClient.set(notificationPermissionGranted());

					if (!$enabledBackend) {
						const res = await fetch(`api/${$account.address}/notifications/${deviceId}/subscribe`, {
							method: 'POST',
							body: JSON.stringify(subscription),
							headers: {
								'content-type': 'application/json'
							}
						});

						res.ok && enabledBackend.set(true);
					}
				}
			};

			return async () => {
				loading.set(true);
				try {
					await toggle();
				} finally {
					loading.set(false);
				}
			};
		}
	) as Readable<() => Promise<void>>;

	return derived(
		[enabled, enableReady, toggleNotifications, loading],
		([enabled, enableReady, toggle, loading]) => {
			return {
				enabled,
				enableReady,
				loading,
				toggle
			};
		}
	);
})();
