<script lang="ts">
	import FormCard from '../FormCard.svelte';
	import { deposit, missedAlarmPenalty, penaltyInputErrorMsg } from '../alarmCreation';
	import EthereumIcon from '$lib/icon-components/ethereum-icon.svelte';
	import { getEtherPrice } from '$lib/util';

	let ethPrice: number;
	getEtherPrice().then((res) => (ethPrice = res));

	$: localCurrencyAmount = ethPrice
		? `($${(ethPrice * $missedAlarmPenalty).toFixed(2)})`
		: '$x.xxd';

	$: if ($missedAlarmPenalty && $missedAlarmPenalty >= $deposit) {
		$penaltyInputErrorMsg = 'Missed alarm penalty must be less than initial deposit';
	} else {
		$penaltyInputErrorMsg = undefined;
	}
</script>

<FormCard
	itemNumber={5}
	emptyHeader="set missed alarm penalty"
	filledHeader="Missed Alarm Penalty"
	inputEmpty={$missedAlarmPenalty === 0}
	inputValid={$missedAlarmPenalty < $deposit}
	><div class="flex items-center gap-1">
		<input
			type="number"
			class="bg-highlight-transparent-grey w-[90px] rounded-lg text-center"
			min="0"
			step="0.001"
			bind:value={$missedAlarmPenalty}
		/>
		<div class=" h-4 w-4 fill-zinc-400"><EthereumIcon /></div>
		<div class="px-1">{localCurrencyAmount}</div>
	</div>
</FormCard>
