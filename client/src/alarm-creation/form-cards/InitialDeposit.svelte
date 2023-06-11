<script>
  import FormCard from "../FormCard.svelte";
  import EthSymbol from "../../lib/components/EthSymbol.svelte";
  import { deposit } from "../alarmCreation";
  import EthereumIcon from "../../assets/ethereum-icon.svelte";

  const ethPrice = 1950;
  $: localCurrencyAmount = `($${Math.round(ethPrice * $deposit)})`;
</script>

<FormCard
  itemNumber={4}
  emptyHeader="set initial deposit"
  filledHeader="Initial Bet Deposit"
  inputEmpty={$deposit === 0}
  inputValid={true}
>
  <div class="flex items-center gap-1">
    <input
      type="number"
      class="bg-highlight-transparent-grey w-[100px] rounded-lg text-center"
      min="0"
      step="0.001"
      bind:value={$deposit}
    />
    <div class=" h-4 w-4 fill-zinc-400"><EthereumIcon /></div>
    <div class=" min-w-[50px] px-1">{localCurrencyAmount}</div>
  </div>
</FormCard>
