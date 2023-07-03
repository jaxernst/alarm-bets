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
  import { userAlarms } from "./lib/dappStores";

  import { displayedAlarmId } from "./alarms/stores";
  import Topbar from "./Topbar.svelte";
  import AlarmClockSymbol from "./assets/alarm-clock-symbol.svelte";
  import JoinAlarm from "./alarm-creation/JoinAlarm.svelte";
  import { type Tab, activeTab } from "./view";
  import { get } from "svelte/store";
  import { AlarmStatus } from "@sac/contracts/lib/types";
  import { account } from "./lib/chainClient";

  $: activeTabStyles = (t: Tab) =>
    t === $activeTab
      ? " underline underline-offset-4 text-bold font-bold "
      : " ";

  $: currentAlarms =
    $userAlarms &&
    userAlarms.getByStatus([
      AlarmStatus.INACTIVE,
      AlarmStatus.ACTIVE,
      AlarmStatus.COMPLETE,
      AlarmStatus.PAUSED,
    ]);

  $: if (currentAlarms.length > 0) {
    $displayedAlarmId = get(currentAlarms[0]).id;
  }
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
          <button
            class={activeTabStyles("join")}
            on:click={() => activeTab.set("join")}>Join</button
          >
        </div>
        <div class="flex gap-2">
          <div class="flex items-center gap-1 px-2">
            <div class="h-[18px] w-[18px] stroke-cyan-500">
              <AlarmClockSymbol />
            </div>
            <div>{Object.keys($userAlarms).length}</div>
          </div>
          {#if $account}
            <Web3Status />
          {/if}
        </div>
      </div>

      <!-- Main content -->
      <div class="relative grid flex-grow pt-1">
        {#if $activeTab === "alarms"}
          <div transition:blur class="col-start-1 row-start-1 flex flex-col">
            {#if currentAlarms.length === 0}
              <div
                class="flex-grow rounded-2xl p-2 align-middle tracking-tight text-zinc-400"
              >
                You have no active alarms. Create a new alarm or join an
                existing one.
              </div>
            {:else}
              <div
                class="grid flex-grow grid-cols-1 gap-3 self-stretch text-zinc-400 sm:grid-cols-[1fr_60%]"
              >
                <AlarmsSidebar />
                <div class="row-start-1 rounded-2xl sm:col-start-2">
                  {#if $displayedAlarmId}
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
        {:else if $activeTab === "join"}
          <div transition:blur class="col-start-1 row-start-1">
            <JoinAlarm />
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
    box-shadow: 0px 0px 18px 7px rgba(10, 10, 10, 0.676);
  }

  .bg-trans {
    background: rgba(0, 0, 0, 0.48);
    backdrop-filter: blur(20px);
  }

  .alarms-container-grid {
    display: grid;
    grid-template-columns: 1fr 60%;
  }
</style>
