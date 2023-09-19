<script lang="ts">
	import { createAlarm, creationErrorMsg, isReady } from './alarmCreation';

	import { transactions } from '$lib/transactions';
	import { toast } from '@zerodevx/svelte-toast';

	import ChoosePartner from './form-cards/Partner.svelte';
	import ChooseAlarmTime from './form-cards/AlarmTime.svelte';
	import ChooseAlarmDays from './form-cards/Days.svelte';
	import ChooseInitialDeposit from './form-cards/InitialDeposit.svelte';
	import ChoosePenalty from './form-cards/AlarmPenalty.svelte';
	import ChooseSubmissionWindow from './form-cards/SubmissionWindow.svelte';
	import ChooseTimezoneSettings from './form-cards/TimezoneSettings.svelte';
	import ActionButton from '$lib/styled-components/ActionButton.svelte';
	import DiamondSpinner from '$lib/components/DiamondSpinner.svelte';

	let creationPending = false;
	$: create = async () => {
		if (creationPending) return;
		creationPending = true;
		const createAlarmResult = $createAlarm();
		if (!createAlarmResult) return;

		transactions
			.addTransaction(createAlarmResult)
			.then((txResult) => {
				if (!txResult.error) {
					toast.push('Alarm creation successful!');
				} else {
					toast.push('Alarm creation failed with: ' + txResult.error.message);
				}
			})
			.finally(() => {
				creationPending = false;
			});
	};

	const cards = [
		ChoosePartner,
		ChooseAlarmTime,
		ChooseAlarmDays,
		ChooseInitialDeposit,
		ChoosePenalty,
		ChooseSubmissionWindow,
		ChooseTimezoneSettings
	];
</script>

<div class="flex h-full flex-col justify-between">
	<h3 class="px-5">Create a new Alarm Contract</h3>
	<div class="overflow-y-auto px-5 py-3">
		<div class="z-50 flex flex-wrap gap-2 pb-3 text-zinc-300 sm:pb-0">
			{#each cards as card}
				<svelte:component this={card} />
			{/each}
		</div>
	</div>

	<div class="mt-2 flex justify-between px-3">
		<div>
			{#if $creationErrorMsg}
				<i class="text-xs text-red-700">{$creationErrorMsg}</i>
			{/if}
		</div>
		<ActionButton onClick={create} isReady={!!$isReady}>
			{#if creationPending}
				<div class="p-1">
					<DiamondSpinner size={'30'} color={'white'} />
				</div>
			{:else}
				Submit
			{/if}
		</ActionButton>
	</div>
</div>
