<script lang="ts">
  import { isAddress } from "viem";
  import FormCard from "../FormCard.svelte";
  import {
    creationErrorMsg,
    otherPlayer,
    playerInputErrorMsg,
  } from "../alarmCreation";
  import { getCurrentAccount } from "../../lib/chainClient";
  import { fetchEnsAddress } from "@wagmi/core";

  let debouncedInput: string | undefined;
  let inputValid: boolean;

  $: checkInput = async (input: string) => {
    let isEns =
      input.length > 2 && (input.endsWith(".eth") || !input.startsWith("0x"));
    let resolvedAddress: string | undefined = undefined;
    if (isEns) {
      try {
        console.log("fetch ens");
        const res = await fetchEnsAddress({
          name: debouncedInput!,
          chainId: 1,
        });
        if (res) resolvedAddress = res;
      } catch (err) {
        console.log("failed to fetch ens");
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
