import { derived, get, writable, type Readable } from 'svelte/store';
import { account } from './chainConfig';
import { userAlarms } from './contractStores';
import { AlarmStatus } from '@alarm-bets/contracts/lib/types';
import { deviceHash, subscribeToPushNotifications } from '$lib/util';
import type { EvmAddress } from '$lib/types';

export type Tab = 'alarms' | 'new' | 'join';
export const activeTab = writable<Tab>('alarms');

export const showWelcome = writable(true);
export const welcomeHasBeenViewed = writable(false);

export const alarmNotifications = (() => {
	const notifications = writable<number[]>([]);

	const fetchNotificationState = async (address: EvmAddress) => {
		const res = await fetch(`/api/${address}/notifications/status`);
		const data: number[] = await res.json();
		notifications.set(data);
	};

	let initialFetch = false;
	account.subscribe(($account) => {
		if (!$account?.address) return;
		if (!initialFetch) {
			initialFetch = true;
			fetchNotificationState($account.address);
		}
	});

	const enableReady = derived([account, userAlarms], ([$account, $userAlarms]) => {
		if (
			!$account?.address ||
			$userAlarms.loadingState !== 'loaded' ||
			Object.keys($userAlarms.alarmRecord).length === 0
		) {
			return false;
		}
		return true;
	});

	/**
	 * TODO: This should check the alarm id being subscribed to to avoid duplicate subscriptions
	 */
	const enableAll = derived([account, enableReady], ([$account, $enableReady]) => {
		return async () => {
			if (!$enableReady || !$account?.address) {
				console.log('Enable notifications failed: Deps not ready');
				return;
			}

			const activeAlarms = userAlarms.getByStatus([AlarmStatus.ACTIVE]);
			const subscriptionParams = activeAlarms.map((alarm) => {
				const a = get(alarm);
				const isP1 = a.player1.toLowerCase() === $account.address?.toLowerCase();
				return {
					alarmTime: Number(a.alarmTime),
					timezoneOffset: isP1 ? Number(a.player1Timezone) : Number(a.player2Timezone),
					alarmId: Number(a.id),
					userAddress: $account.address,
					alarmDays: a.alarmDays
				};
			});

			const subscription = subscribeToPushNotifications();

			// Update state optimistically
			notifications.update((n) => [...n, ...activeAlarms.map((a) => get(a).id)]);

			const saveSubscriptionBody = {
				subscription,
				deviceId: await deviceHash(),
				params: { ...subscriptionParams }
			};

			const res = await fetch(`api/${$account.address}/notifications/subscribe`, {
				method: 'POST',
				body: JSON.stringify(saveSubscriptionBody),
				headers: {
					'content-type': 'application/json'
				}
			});

			if (!res.ok) {
				notifications.set([]);
			}
		};
	}) as Readable<() => void>;

	const disableAll = derived([account], ([$account]) => {
		return async () => {
			if (!$account?.address) return;
			const old = get(notifications);
			notifications.set([]);
			const res = await fetch(`/api/${$account.address}/notifications/unsubscribe`, {
				method: 'POST'
			});

			// Undo optimistic update if it failed
			if (!res.ok) {
				notifications.set(old);
				return;
			}
		};
	}) as Readable<() => Promise<void>>;

	const store = derived(
		[notifications, enableReady, enableAll, disableAll],
		([notifications, enableReady, enableAll, disableAll]) => {
			return {
				notifications,
				enableReady,
				enableAll,
				disableAll
			};
		}
	);

	return store;
})();
