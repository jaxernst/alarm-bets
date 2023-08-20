<script lang="ts">
  import { isAddress } from "viem";
  import FormCard from "../FormCard.svelte";
  import { otherPlayer, playerInputErrorMsg } from "../alarmCreation";
  import { getCurrentAccount } from "../../lib/chainClient";
  import { fetchEnsAddress } from "@wagmi/core";

  let inputValid: boolean;

  $: checkInput = async (input: string) => {
    let isEns =
      input.length > 2 && (input.endsWith(".eth") || !input.startsWith("0x"));
    let resolvedAddress: string | undefined = undefined;
    if (isEns) {
      try {
        resolvedAddress =
          (await fetchEnsAddress({
            name: input,
            chainId: 1,
          })) ?? "";
      } catch (err) {
        console.log("failed to fetch ens", err);
        inputValid = false;
        $playerInputErrorMsg = "Could not find ENS address";
        return;
      }
    } else {
      resolvedAddress = input;
    }

    if (resolvedAddress && !isAddress(resolvedAddress)) {
      inputValid = false;
      $playerInputErrorMsg = "Invalid address";
    } else if (resolvedAddress === $getCurrentAccount().address) {
      inputValid = false;
      $playerInputErrorMsg = "Other player cannot be yourself";
    } else {
      inputValid = true;
      $otherPlayer = resolvedAddress;
    }
  };

  let timer: NodeJS.Timeout;
  $: otherPlayer.subscribe((val) => {
    playerInputErrorMsg.set(undefined);
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      checkInput(val);
    }, 600);
  });

  let otherPlayerInput = "";
  $: $otherPlayer = otherPlayerInput;
</script>

<FormCard
  itemNumber={1}
  emptyHeader="select a partner"
  filledHeader="Partner"
  inputEmpty={!$otherPlayer}
  {inputValid}
>
  <input
    class="w-full bg-transparent text-center outline-none sm:w-min"
    type="text"
    placeholder="Enter address or ENS"
    bind:value={otherPlayerInput}
  />
</FormCard>
