<script lang="ts">
  import AlarmActiveDays from "../lib/components/AlarmActiveDays.svelte";
  import { getCurrentAccount } from "../lib/chainClient";
  import ClockDisplay from "../lib/components/ClockDisplay.svelte";
  import { formatTime, shorthandAddress, timeString } from "../lib/util";
  import type { UserAlarm } from "../lib/dappStores";
  import { AlarmStatus } from "@sac/contracts/lib/types";
  import { displayedAlarmId } from "./stores";
  import { getOtherPlayer, getTimeToNextDeadline } from "../lib/alarmHelpers";

  export let userAlarm: UserAlarm;

  $: id = $userAlarm.id;
  $: account = $getCurrentAccount();
  $: daysActive = $userAlarm.alarmDays as number[];
  $: otherPlayer =
    account.address === $userAlarm.player1
      ? $userAlarm.player2
      : $userAlarm.player1;
  $: alarmTime = $userAlarm.alarmTime;
  $: status = $userAlarm.status;

  const stylePending = (status: AlarmStatus) =>
    status === AlarmStatus.INACTIVE
      ? "border border-dashed border-zinc-600 my-[1px]"
      : "";

  $: styleSelected = (alarmId: number) =>
    $displayedAlarmId === alarmId ? "bg-highlight-transparent-grey" : "";
</script>

<button
  class="h-[60px] max-w-[230px] rounded-xl p-1 text-left transition hover:bg-zinc-700 {stylePending(
    status
  )} {styleSelected(id)}"
  on:click={() => ($displayedAlarmId = id)}
>
  {#if status === AlarmStatus.INACTIVE}
    <div class="text-sm font-bold">Alarm ID: {id}</div>
    <div class="text-xs">Waiting on Player 2 to start alarm...</div>
  {:else if status === AlarmStatus.ACTIVE}
    <div class="grid h-full grid-cols-[63%_1fr] items-start">
      <div
        class="flex h-full flex-col items-start justify-center overflow-visible px-1"
      >
        <div class="pt-1" style="font-size: 2.1em; line-height: .8em">
          <ClockDisplay
            overrideTime={timeString(Number(alarmTime))}
            overrideColor={"orange"}
          />
        </div>
        {#if $userAlarm.timeToNextDeadline}
          <div class="overflow-visible whitespace-nowrap text-xs">
            In <span class=""
              >{formatTime(Number($userAlarm.timeToNextDeadline))}</span
            >
          </div>
        {/if}
      </div>
      <div class="" style="font-size: .78em; line-height: 1.3em">
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
