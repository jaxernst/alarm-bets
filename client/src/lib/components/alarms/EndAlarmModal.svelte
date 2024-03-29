<script lang="ts">
	import { Dialog } from '@rgossiaux/svelte-headlessui';
	import type { UserAlarm } from '$lib/state/contractStores';
	import { getCurrentAccount } from '$lib/state/chainConfig';
	import { showEndAlarmModal } from './stores';
	import { shorthandAddress } from '$lib/util';
	import { toast } from '@zerodevx/svelte-toast';
	import DiamondSpinner from '$lib/components/DiamondSpinner.svelte';

	export let alarm: UserAlarm;

	$: otherPlayer = $getCurrentAccount().address ? $alarm.player2 : $alarm.player1;

	let endPending = false;
	const endAlarm = async () => {
		if (endPending) return;
		endPending = true;

		try {
			const txResult = await alarm.endAlarm();
			if (!txResult.error) {
				toast.push('Alarm ended successfully');
			} else {
				toast.push('Transaction failed with: ' + txResult.error.message);
			}
			$showEndAlarmModal = false;
		} finally {
			endPending = false;
		}
	};
</script>

{#if $showEndAlarmModal}
	<div class="fixed inset-0 z-50 rounded-3xl bg-black/60" aria-hidden="true" />
{/if}

<Dialog
	open={$showEndAlarmModal}
	on:close={() => ($showEndAlarmModal = false)}
	class="absolute inset-1/2 z-50 flex min-h-fit w-[300px] -translate-x-1/2 -translate-y-1/2 transform flex-col gap-2 rounded-xl bg-zinc-900 p-4 md:w-[400px]"
>
	<div class="relative">
		Are you sure you want to end your alarm with {shorthandAddress(otherPlayer)}?
	</div>
	<div class="text-sm text-zinc-500">
		This will withdraw and return each player's remaining balance
	</div>
	<div class="flex justify-end gap-4">
		<button class="text-cyan-600 hover:font-bold" on:click={endAlarm}>
			{#if endPending}
				<div class="p-1">
					<DiamondSpinner size={'30'} color={'white'} />
				</div>
			{:else}
				End
			{/if}
		</button>
		<button class="text-red-700 hover:font-bold" on:click={() => ($showEndAlarmModal = false)}
			>Cancel</button
		>
	</div>
</Dialog>
