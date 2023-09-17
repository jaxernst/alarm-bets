<script lang="ts">
	import InfoIcon from '../assets/info-icon.svelte';
	import NotificationIcon from '../assets/notification-icon.svelte';
	import ClockDisplay from './components/ClockDisplay.svelte';
	import { showWelcome } from '../routes/view';
	import { subcribeToPushNotifications } from './util';
	import { localTzOffsetHrs, systemTimestamp, timeOfDay } from './time';

	let backgroundMode: 'day' | 'night' = 'day';
	const toggleBackgroundMode = () => {
		backgroundMode === 'day' ? (backgroundMode = 'night') : (backgroundMode = 'day');
	};

	// On page load there should be preloaded variable to indicate whether there is a database
	// subscription set for this user (alarmNotificationsActive).
	const alarmNotificationsActive = true;
	let notificationsEnabled = Notification.permission === 'granted' && alarmNotificationsActive;
	const enableAlarmNotifications = () => {
		subcribeToPushNotifications({
			alarmTime: timeOfDay(systemTimestamp() + 15),
			timezoneOffset: localTzOffsetHrs(),
			alarmId: 1233,
			userAddress: '0x1ddd3d23',
			alarmDays: [1, 2, 3, 4, 5, 6, 7],
			submissionWindow: 60 * 5
		});

		notificationsEnabled = Notification.permission === 'granted' && alarmNotificationsActive;
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
			<button class="h-5 w-5" on:click={enableAlarmNotifications}>
				<div class={`${notificationsEnabled ? 'fill-green-500' : 'fill-zinc-400'} opacity-80`}>
					<NotificationIcon />
				</div>
			</button>
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
