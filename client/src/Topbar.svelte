<script lang="ts">
  import Web3Status from "./Web3Status.svelte";
  import SunIcon from "./assets/sun-icon.svelte";
  import { account, web3Modal } from "./lib/chainClient";
  import ClockDisplay from "./lib/components/ClockDisplay.svelte";

  let backgroundMode: "day" | "night" = "day";
  const toggleBackgroundMode = () => {
    backgroundMode === "day"
      ? (backgroundMode = "night")
      : (backgroundMode = "day");
  };
</script>

<div class="mx-6 mt-4 grid w-full items-center">
  <div
    class="grid grid-cols-2 items-center gap-3 rounded-3xl px-4 sm:grid-cols-3"
  >
    <div class="justify-self-start text-lg font-bold">
      The Social Alarm Clock
    </div>
    <!-- Empty div for the first column -->
    <div class="flex items-center justify-center sm:visible">
      <div class="top-clock-bg rounded-2xl">
        {#if $account?.address}
          <div class=" px-4 pb-1 pt-2" style="font-size: 2em; line-height: 1em">
            <ClockDisplay />
          </div>
        {:else}
          <button
            class="hover:bg-highlight-transparent-grey rounded-2xl p-2 px-3 text-cyan-500 transition hover:font-bold"
            on:click={() => $web3Modal.openModal()}
          >
            Connect Wallet
          </button>
        {/if}
      </div>
    </div>
    <div class="flex justify-end">
      <Web3Status />
    </div>
  </div>
</div>

<style>
  .top-clock-bg {
    background: rgba(37, 37, 37, 0.3);
    backdrop-filter: blur(4px);
  }
</style>
