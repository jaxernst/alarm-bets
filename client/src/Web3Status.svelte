<script lang="ts">
  import { account, ensName } from "./lib/chainClient";
  import { web3Modal } from "./lib/chainClient";
  import { shorthandAddress } from "./lib/util";
  import { transactions } from "./lib/transactions";

  import AlarmClockSymbol from "./assets/alarm-clock-symbol.svelte";
  import { userAlarms } from "./lib/contractStores";
  import ShadowSpinner from "./lib/components/ShadowSpinner.svelte";
  import DiamondSpinner from "./lib/components/DiamondSpinner.svelte";
  import { get } from "svelte/store";

  let displayName: string | undefined;
  $: if ($account?.address) {
    displayName = $ensName ? $ensName : shorthandAddress($account.address);
  }
  $: console.log($transactions.pending);
  $: indicatorColor = $account && $account.isConnected ? "green" : "red";
</script>

<div class="flex h-full items-center gap-4">
  {#if $transactions.pending}
    <DiamondSpinner size={"30"} color={"white"} />
  {/if}
  <button class="flex items-center" on:click={() => $web3Modal.openModal()}>
    <div class="indicator" style="background-color:{indicatorColor}" />
    <div class="displayName">
      {displayName || ""}
    </div>
  </button>
</div>

<style>
  .indicator {
    height: 8px;
    width: 8px;
    transform: translate(0, -6px);
    border-radius: 100%;
    background-color: var(--indicator-color);
  }

  .displayName {
    font-size: smaller;
    color: rgb(201, 145, 34);
  }
</style>
