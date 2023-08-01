<script lang="ts">
  import FormCard from "../FormCard.svelte";
  import { deposit } from "../alarmCreation";
  import EthereumIcon from "../../assets/ethereum-icon.svelte";
  import { getEtherPrice } from "../../lib/util";

  let ethPrice: number;
  getEtherPrice().then((res) => (ethPrice = res));

  $: localCurrencyAmount = ethPrice
    ? `($${(ethPrice * $deposit).toFixed(2)})`
    : "$x.xxd";
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
      class="bg-highlight-transparent-grey w-[75px] rounded-lg text-center"
      min="0"
      step="0.001"
      bind:value={$deposit}
    />
    <div class=" h-4 w-4 fill-zinc-400"><EthereumIcon /></div>
    <div class=" min-w-[35px] px-1">{localCurrencyAmount}</div>
  </div>
</FormCard>
