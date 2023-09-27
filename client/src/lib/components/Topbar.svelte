<script lang="ts">
	import InfoIcon from '../icon-components/info-icon.svelte';
	import NotificationIcon from '../icon-components/notification-icon.svelte';
	import ClockDisplay from './ClockDisplay.svelte';
	import { showWelcome } from '../state/appState';
	import { notifications } from '../state/appState';
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
			{#if $notifications.enableReady}
				<button class="h-5 w-5" on:click={$notifications.toggle}>
					<div
						class={`${$notifications.enabled ? 'fill-green-600' : 'fill-zinc-400'} ${
							$notifications.loading ? 'animate-pulse opacity-25' : ''
						} opacity-80 transition-colors`}
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
