import { derived, get, writable, type Readable } from 'svelte/store';
import { account } from './chainConfig';
import { userAlarms } from './contractStores';
import { AlarmStatus } from '@alarm-bets/contracts/lib/types';
import { subscribeToPushNotifications } from '$lib/util';

export type Tab = 'alarms' | 'new' | 'join';
export const activeTab = writable<Tab>('alarms');

export const showWelcome = writable(true);
export const welcomeHasBeenViewed = writable(false);

export const alarmNotifications = (() => {
	const notifications = writable<number[]>([]);

	account.subscribe(async ($account) => {
		if (!$account?.address) return;

		const res = await fetch(`/api/${$account.address}/notifications/status`);
		const data: number[] = await res.json();
		notifications.set(data);
	});

	const enableReady = derived([account, userAlarms], ([$account, $userAlarms]) => {
		if (!$account?.address || $userAlarms.loadingState !== 'loaded') {
			return false;
		}
		return true;
	});

	const enableAll = derived([account, enableReady], ([$account, $enableReady]) => {
		return () => {
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

			subscribeToPushNotifications($account.address, subscriptionParams);
		};
	}) as Readable<() => void>;

	const store = derived(
		[notifications, enableReady, enableAll],
		([notifications, enableReady, enableAll]) => {
			return {
				notifications,
				enableReady,
				enableAll
			};
		}
	);

	return store;
})();
