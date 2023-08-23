<script lang="ts">
  import EthereumIcon from "../assets/ethereum-icon.svelte";
  import AlarmActiveDays from "../lib/components/AlarmActiveDays.svelte";
  import ClockDisplay from "../lib/components/ClockDisplay.svelte";
  import WarningPopup from "../lib/components/WarningPopup.svelte";
  import { formatTime, timeString } from "../lib/util";

  export let alarmTime: number;
  export let timeToNextDeadline: number | undefined;
  export let missedAlarmPenalty: number;
  export let daysActive: number[];
  export let alarmTimeCorrected: boolean;
</script>

<div class="flex h-full items-center justify-evenly">
  <div class="flex flex-col">
    <div
      class="min-w-[120px] pt-1"
      style="font-size: 1.9em; line-height: .85em"
    >
      <ClockDisplay
        overrideTime={timeString(alarmTime)}
        overrideColor={"orange"}
      />
      {#if alarmTimeCorrected}
        <div class="absolute -right-4 -top-1">
          <WarningPopup
            message="The timezone set for this alarm is different then your device's local timezone. The displayed alarm time is corrected for your local timezone."
          />
        </div>
      {/if}
    </div>
    <div style="font-size: .8em; line-height: 1.3em">
      <AlarmActiveDays {daysActive} />
    </div>
  </div>

  <div class="flex flex-col justify-evenly self-stretch pl-1">
    {#if timeToNextDeadline}
      <div class="flex items-center text-sm">
        <span class="text-cyan-400">{missedAlarmPenalty}</span>
        <span class="mr-1 h-[14px] w-[14px] fill-cyan-500 p-[1px]">
          <EthereumIcon />
        </span>
        at risk
      </div>
      <div class="w-[160px] overflow-visible whitespace-nowrap text-xs">
        In <span class="">{formatTime(timeToNextDeadline) + "..."}</span>
      </div>
    {/if}
  </div>
</div>
