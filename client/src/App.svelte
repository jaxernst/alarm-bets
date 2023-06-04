<script lang="ts">
  import "./app.css";

  import ClockDisplay from "./lib/components/ClockDisplay.svelte";
  import Web3Status from "./Web3Status.svelte";
  import NewAlarm from "./alarm-creation/NewAlarm.svelte";
  import AlarmsSidebar from "./alarms/AlarmsSidebar.svelte";
  import AlarmDetail from "./alarms/AlarmDetail.svelte";
  import SunIcon from "./assets/sun-icon.svelte";

  import { SvelteToast } from "@zerodevx/svelte-toast";
  import { fade, blur } from "svelte/transition";
  import { userAlarms } from "./lib/contractStores";
  import { writable } from "svelte/store";
  import { displayedAlarmId } from "./alarms/stores";
  import Topbar from "./Topbar.svelte";
  import AlarmClockSymbol from "./assets/alarm-clock-symbol.svelte";

  type Tab = "alarms" | "new";
  const activeTab = writable<Tab>("alarms");
  $: activeTabStyles = (t: Tab) =>
    t === $activeTab
      ? " underline underline-offset-4 text-bold font-bold "
      : " ";

  $: numUserAlarms = Object.keys($userAlarms ?? {}).length;
</script>

<SvelteToast />

<div class="background h-full">
  <div class="absolute flex w-full justify-center">
    <Topbar />
  </div>

  <main
    class=" box-border flex min-h-screen items-center justify-center"
    in:fade={{ duration: 500, delay: 500 }}
  >
    <div
      class="bg-trans main-container-shadow flex min-h-[340px] w-[620px] flex-col gap-2 rounded-3xl p-3 text-zinc-400 shadow-neutral-500"
    >
      <!-- Main content header -->
      <div class="flex justify-between align-middle">
        <div class="flex gap-4 rounded-xl px-2">
          <button
            class={activeTabStyles("alarms")}
            on:click={() => activeTab.set("alarms")}>Alarms</button
          >
          <button
            class={activeTabStyles("new")}
            on:click={() => activeTab.set("new")}>New</button
          >
        </div>
        <div>
          <div class="flex items-center gap-1 px-2">
            <div class="h-[18px] w-[18px] stroke-cyan-500">
              <AlarmClockSymbol />
            </div>
            <div>{Object.keys($userAlarms).length}</div>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <div class="relative grid flex-grow">
        {#if $activeTab === "alarms"}
          <div transition:blur class="col-start-1 row-start-1 flex flex-col">
            {#if numUserAlarms === 0}
              <div
                class="flex-grow rounded-2xl p-2 align-middle tracking-tight text-zinc-400"
              >
                You have no active alarms. Create a new alarm or join an
                existing one.
              </div>
            {:else}
              <div
                class="alarms-container-grid flex-grow gap-3 self-stretch text-zinc-400"
              >
                <AlarmsSidebar />
                <div class="bg-transparent-grey rounded-2xl">
                  {#if $displayedAlarmId && $userAlarms[Number($displayedAlarmId)]}
                    <AlarmDetail alarm={$userAlarms[$displayedAlarmId]} />
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {:else if $activeTab === "new"}
          <div transition:blur class="col-start-1 row-start-1">
            <NewAlarm />
          </div>
        {/if}
      </div>
    </div>
  </main>
</div>

<style>
  .background .radial-background {
    background: radial-gradient(
      circle,
      rgba(26, 26, 26, 1) 0%,
      rgba(31, 31, 31, 1) 100%
    );
  }

  .main-container-shadow {
    box-shadow: 0px 0px 35px 5px rgba(18, 18, 18, 0.55);
  }

  .bg-trans {
    background: rgba(10, 10, 10, 0.48);
    backdrop-filter: blur(20px);
  }

  .alarms-container-grid {
    display: grid;
    grid-template-columns: 1fr 60%;
  }
</style>
