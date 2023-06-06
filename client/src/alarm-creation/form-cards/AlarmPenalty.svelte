<script>
  import FormCard from "../FormCard.svelte";
  import EthSymbol from "../../lib/components/EthSymbol.svelte";
  import { deposit, missedAlarmPenalty } from "../alarmCreation";
  import EthereumIcon from "../../assets/ethereum-icon.svelte";

  const ethPrice = 1950;
  $: localCurrencyAmount = `($${Math.round(ethPrice * $missedAlarmPenalty)})`;
</script>

<FormCard
  itemNumber={5}
  emptyHeader="set missed alarm penalty"
  filledHeader="Penalty"
  inputEmpty={$missedAlarmPenalty === 0}
  inputValid={$missedAlarmPenalty < $deposit}
  ><div class="flex items-center gap-1">
    <input
      type="number"
      class="bg-highlight-transparent-grey w-[80px] rounded-lg text-center"
      min="0"
      step="0.001"
      bind:value={$missedAlarmPenalty}
    />
    <div class=" h-4 w-4 fill-zinc-400"><EthereumIcon /></div>
    <div class="px-1">{localCurrencyAmount}</div>
  </div>
</FormCard>
