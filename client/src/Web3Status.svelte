<script lang="ts">
  import { account, ensName } from "./lib/chainClient";
  import { web3Modal } from "./lib/chainClient";
  import { shorthandAddress } from "./lib/util";
  import { transactions } from "./lib/transactions";
  import DiamondSpinner from "./lib/components/DiamondSpinner.svelte";

  let displayName: string | undefined;
  $: if ($account?.address) {
    displayName = $ensName ? $ensName : shorthandAddress($account.address);
  }
  $: indicatorColor = $account && $account.isConnected ? "green" : "red";
</script>

<div class="flex h-full items-center gap-4">
  {#if !$account || !$account.isConnected}
    <button
      class=" rounded-2xl bg-local px-2 py-1 text-cyan-500 transition-colors duration-200 hover:text-cyan-300"
      on:click={() => $web3Modal.openModal()}
    >
      Connect Wallet
    </button>
  {:else}
    <button class="flex items-center" on:click={() => $web3Modal.openModal()}>
      <div class="indicator" style="background-color:{indicatorColor}" />
      <div class="displayName">
        {displayName || ""}
      </div>
    </button>
  {/if}
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

  .bg-local {
    background-color: rgba(37, 37, 37, 0.3);
  }
</style>
