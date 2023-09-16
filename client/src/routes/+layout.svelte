<script lang="ts">
	import Welcome from '$lib/Welcome.svelte';
	import { HOUR, localTzOffsetHrs, systemTimestamp } from '$lib/time';
	import { checkForServiceWorkerUpdate, subcribeToPushNotifications } from '$lib/util';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { pwaInfo } from 'virtual:pwa-info';
	import { onMount } from 'svelte';
	import { checkForServiceWorkerUpdate } from '$lib/util';

	$: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';
	onMount(checkForServiceWorkerUpdate);

	const timeOfDay = (timestamp: number, timezoneOffsetHrs: number = 0): number => {
		const date = new Date((timestamp + timezoneOffsetHrs * HOUR) * 1000);
		return date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds();
	};

	const subscribeToAlarmNotifications = () => {
		subcribeToPushNotifications({
			alarmTime: timeOfDay(systemTimestamp() + 15),
			timezoneOffset: localTzOffsetHrs(),
			alarmId: 1,
			userAddress: '0x123',
			alarmDays: [1, 2, 3, 4, 5, 6]
		});
	};
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>
<SvelteToast />

<Welcome />

<main>
	<slot />
</main>
