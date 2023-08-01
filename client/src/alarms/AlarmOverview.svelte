<script lang="ts">
  import AlarmActiveDays from "../lib/components/AlarmActiveDays.svelte";
  import { getCurrentAccount } from "../lib/chainClient";
  import ClockDisplay from "../lib/components/ClockDisplay.svelte";
  import { formatTime, timeString } from "../lib/util";
  import type { UserAlarm } from "../lib/dappStores";
  import { AlarmStatus } from "@sac/contracts/lib/types";
  import { displayedAlarmId } from "./stores";
  import { correctAlarmTime } from "../lib/time";
  import WarningPopup from "../lib/components/WarningPopup.svelte";

  export let userAlarm: UserAlarm;

  $: [id, daysActive, alarmTime, status] = [
    $userAlarm.id,
    $userAlarm.alarmDays as number[],
    $userAlarm.alarmTime,
    $userAlarm.status,
  ];

  $: correctedAlarmTime = Number(alarmTime);
  $: if (
    $userAlarm.alarmTime &&
    $userAlarm.player1Timezone &&
    $userAlarm.player2Timezone
  ) {
    correctedAlarmTime = correctAlarmTime(
      Number($userAlarm.alarmTime),
      Number(
        $getCurrentAccount().address === $userAlarm.player1
          ? $userAlarm.player1Timezone
          : $userAlarm.player2Timezone
      )
    );
  }

  const stylePending = (status: AlarmStatus) =>
    status === AlarmStatus.INACTIVE
      ? "border border-dashed border-zinc-600 my-[1px]"
      : "";

  $: styleSelected = (alarmId: number) =>
    $displayedAlarmId === alarmId ? "bg-highlight-transparent-grey" : "";
</script>

<button
  class="h-[60px] w-full max-w-[225px] rounded-xl px-2 py-1 text-left transition hover:bg-zinc-700 {stylePending(
    status
  )} {styleSelected(id)}"
  on:click={() => ($displayedAlarmId = id)}
>
  {#if status === AlarmStatus.INACTIVE}
    <div class="text-sm font-bold">Alarm ID: {id}</div>
    <div class="text-xs">Waiting on Player 2 to start alarm...</div>
  {:else if status === AlarmStatus.ACTIVE}
    <div class="grid grid-cols-[63%_1fr]">
      <div
        class="flex h-full flex-col items-start justify-center overflow-visible"
      >
        <div class="relative pt-1" style="font-size: 2.1em; line-height: .85em">
          <ClockDisplay
            overrideTime={timeString(correctedAlarmTime)}
            overrideColor={"orange"}
          />
          {#if correctedAlarmTime !== Number(alarmTime)}
            <div class="absolute -right-4 -top-1">
              <WarningPopup
                message="The timezone set for this alarm is different then your device's local timezone. The displayed alarm time is corrected for your local timezone."
              />
            </div>
          {/if}
        </div>
      </div>
      <div class="pb-[.2em]" style="font-size: .78em; line-height: 1.3em">
        <AlarmActiveDays {daysActive} />
      </div>
    </div>
    {#if $userAlarm.timeToNextDeadline}
      <div class="overflow-visible whitespace-nowrap text-xs">
        In <span class=""
          >{formatTime(Number($userAlarm.timeToNextDeadline))}</span
        >
      </div>
    {/if}
  {/if}
</button>

<style>
  .custom-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
  }
</style>
