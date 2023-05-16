<script lang="ts">
  import { AlarmStatus } from "@sac/contracts/lib/types";
  import { userAlarms } from "../lib/contractInterface";
  import AlarmOverview from "./AlarmOverview.svelte";
  import { displayedAlarmId } from "./displayedAlarm";

  $: console.log(Object.entries($userAlarms));

  const stylePending = (status: AlarmStatus) =>
    status === AlarmStatus.INACTIVE
      ? "border border-dashed border-zinc-600"
      : "";

  $: styleSelected = (alarmId: string) =>
    $displayedAlarmId === alarmId ? "bg-zinc-800" : "";
</script>

<div class="bg-transparent-grey flex flex-col gap-1 overflow-y-auto rounded-xl">
  {#each Object.entries($userAlarms) as [alarmId, alarm]}
    <button
      class="rounded-xl px-2 py-1 text-left transition hover:bg-zinc-700 {stylePending(
        alarm.status
      )} {styleSelected(alarmId)}"
      on:click={() => ($displayedAlarmId = alarmId)}
    >
      {#if alarm.status === AlarmStatus.INACTIVE}
        <div class="text-sm font-bold">Alarm ID: {alarmId}</div>
        <div class="text-xs">Waiting on Player 2 to start alarm...</div>
      {:else if alarm.status === AlarmStatus.ACTIVE}
        <AlarmOverview userAlarm={alarm} />
      {/if}
    </button>
  {/each}
</div>
