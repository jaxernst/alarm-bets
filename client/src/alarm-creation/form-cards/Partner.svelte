<script>
  import { isAddress } from "viem";
  import FormCard from "../FormCard.svelte";
  import { otherPlayer } from "../alarmCreation";
  import { getCurrentAccount } from "../../lib/chainClient";

  $: inputValid =
    (isAddress($otherPlayer) || $otherPlayer.endsWith(".eth")) &&
    $otherPlayer !== $getCurrentAccount().address;
</script>

<FormCard
  itemNumber={1}
  emptyHeader="select a partner"
  filledHeader="Partner"
  inputEmpty={!$otherPlayer}
  {inputValid}
>
  <input
    class="w-min bg-transparent text-center outline-none"
    type="text"
    placeholder="Enter address or ENS"
    bind:value={$otherPlayer}
  />
</FormCard>
