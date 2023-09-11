<script lang="ts">
  import AlarmActiveDays from "../lib/components/AlarmActiveDays.svelte";
  import { getCurrentAccount } from "../lib/chainConfig";
  import type { UserAlarm } from "../lib/contractStores";
  import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
  import { displayedAlarmId } from "./stores";
  import { correctAlarmTime } from "../lib/time";
  import AlarmOverviewCardSm from "./AlarmOverviewCardSm.svelte";
  import AlarmOverviewCardLg from "./AlarmOverviewCardLg.svelte";
  import { formatEther } from "viem";

  export let userAlarm: UserAlarm;

  $: [id, daysActive, alarmTime, status, missedAlarmPenalty] = [
    $userAlarm.id,
    $userAlarm.alarmDays as number[],
    $userAlarm.alarmTime,
    $userAlarm.status,
    $userAlarm.missedAlarmPenalty,
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
      ? "border border-dashed border-zinc-500 my-[1px] text-cyan-500"
      : "";

  $: styleSelected = (alarmId: number) =>
    $displayedAlarmId === alarmId ? "bg-highlight-transparent-grey" : "";

  $: alarmCardProps = {
    alarmTime: correctedAlarmTime,
    timeToNextDeadline: Number($userAlarm.timeToNextDeadline),
    alarmTimeCorrected: correctedAlarmTime !== Number(alarmTime),
    daysActive,
    missedAlarmPenalty: Number(formatEther(missedAlarmPenalty)),
  };
</script>

<button
  class="h-[60px] w-full rounded-xl px-2 py-1 text-left transition hover:bg-zinc-700 {stylePending(
    status
  )} {styleSelected(id)}"
  on:click={() => ($displayedAlarmId = id)}
>
  {#if status === AlarmStatus.INACTIVE}
    <div class="text-sm font-bold">Alarm ID: {id}</div>
    <div class="text-xs text-zinc-300">
      Waiting on Player 2 to start alarm...
    </div>
  {:else if status === AlarmStatus.ACTIVE}
    <div class="hidden h-full sm:block">
      <AlarmOverviewCardSm {...alarmCardProps} />
    </div>
    <div class="h-full sm:hidden">
      <AlarmOverviewCardLg {...alarmCardProps} />
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
