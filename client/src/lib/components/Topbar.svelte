<script lang="ts">
	import InfoIcon from '../icon-components/info-icon.svelte';
	import NotificationIcon from '../icon-components/notification-icon.svelte';
	import ClockDisplay from './ClockDisplay.svelte';
	import { showWelcome } from '../state/appState';
	import { alarmNotifications } from '../state/appState';
	import { account } from '$lib/state/chainConfig';

	// On page load there should be preloaded variable to indicate whether there is a database
	// subscription set for this user (alarmNotificationsActive).
	$: alarmNotificationsActive =
		$alarmNotifications.notifications.length && Notification.permission === 'granted';

	$: toggleAlarmNotifications = () => {
		if (!$account?.address) return;

		if (alarmNotificationsActive) {
			$alarmNotifications.disableAll();
		} else {
			$alarmNotifications.enableAll();
		}
	};
</script>

<div class="mx-6 mt-2 grid w-full items-center sm:mt-4">
	<div class="grid grid-cols-3 items-center gap-3 rounded-3xl">
		<div class="font-digital justify-self-start font-bold">
			{'['}beta{']'}
		</div>
		<!-- Empty div for the first column -->
		<div class="flex items-center justify-center">
			<div class="top-clock-bg rounded-2xl">
				<div class=" px-4 pb-1 pt-2" style="font-size: 2em; line-height: 1em">
					<ClockDisplay />
				</div>
			</div>
		</div>
		<div class="flex justify-end gap-2">
			{#if $alarmNotifications.enableReady}
				<button class="h-5 w-5" on:click={toggleAlarmNotifications}>
					<div
						class={`${alarmNotificationsActive ? 'fill-green-600' : 'fill-zinc-400'} opacity-80`}
					>
						<NotificationIcon />
					</div>
				</button>
			{/if}
			<button
				class="h-5 w-5"
				on:click={() => {
					$showWelcome = true;
				}}
			>
				<InfoIcon />
			</button>
		</div>
	</div>
</div>

<style>
	.top-clock-bg {
		background: rgba(37, 37, 37, 0.3);
		backdrop-filter: blur(4px);
	}
</style>
