<script lang="ts">
  import AlarmActiveDays from "../lib/components/AlarmActiveDays.svelte";
  import { getRequiredAccount } from "../lib/chainClient";
  import ClockDisplay from "../lib/components/ClockDisplay.svelte";
  import { timeString } from "../lib/util";
  import type { UserAlarm } from "../lib/contractStores";
  import { AlarmStatus } from "@sac/contracts/lib/types";
  import { displayedAlarmId } from "./displayedAlarm";

  export let userAlarm: UserAlarm;

  $: id = $userAlarm.id;
  $: account = $getRequiredAccount();
  $: daysActive = $userAlarm.alarmDays as number[];
  $: alarmTime = $userAlarm.alarmTime;
  $: status = $userAlarm.status;

  const stylePending = (status: AlarmStatus) =>
    status === AlarmStatus.INACTIVE
      ? "border border-dashed border-zinc-600"
      : "";

  $: styleSelected = (alarmId: number) =>
    $displayedAlarmId === alarmId ? "bg-zinc-800" : "";
</script>

<button
  class="rounded-xl px-2 py-1 text-left transition hover:bg-zinc-700 {stylePending(
    status
  )} {styleSelected(id)}"
  on:click={() => ($displayedAlarmId = id)}
>
  {#if status === AlarmStatus.INACTIVE}
    <div class="text-sm font-bold">Alarm ID: {id}</div>
    <div class="text-xs">Waiting on Player 2 to start alarm...</div>
  {:else if status === AlarmStatus.ACTIVE}
    <div class="flex items-center gap-2">
      <div>
        <div class="pt-1" style="font-size: 2em">
          <ClockDisplay
            overrideTime={timeString(Number(alarmTime))}
            overrideColor={"orange"}
          />
        </div>
        <div />
      </div>
      <div class="" style="font-size: .7em">
        <AlarmActiveDays {daysActive} />
      </div>
    </div>
  {/if}
</button>

<style>
  .custom-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
  }
</style>
