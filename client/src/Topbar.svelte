<script lang="ts">
  import InfoIcon from "./assets/info-icon.svelte";
  import ClockDisplay from "./lib/components/ClockDisplay.svelte";
  import { showWelcome } from "./view";

  let backgroundMode: "day" | "night" = "day";
  const toggleBackgroundMode = () => {
    backgroundMode === "day"
      ? (backgroundMode = "night")
      : (backgroundMode = "day");
  };
</script>

<div class="mx-6 mt-2 grid w-full items-center sm:mt-4">
  <div class="grid grid-cols-3 items-center gap-3 rounded-3xl">
    <div class="font-digital justify-self-start font-bold">
      {"["}beta{"]"}
    </div>
    <!-- Empty div for the first column -->
    <div class="flex items-center justify-center">
      <div class="top-clock-bg rounded-2xl">
        <div class=" px-4 pb-1 pt-2" style="font-size: 2em; line-height: 1em">
          <ClockDisplay />
        </div>
      </div>
    </div>
    <div class="flex justify-end">
      <button
        class="h-5 w-5"
        on:click={() => {
          $showWelcome = true;
        }}
      >
        <InfoIcon />
      </button>
    </div>
  </div>
</div>

<style>
  .top-clock-bg {
    background: rgba(37, 37, 37, 0.3);
    backdrop-filter: blur(4px);
  }
</style>
