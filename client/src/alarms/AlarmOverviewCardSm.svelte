<script lang="ts">
  import AlarmActiveDays from "../lib/components/AlarmActiveDays.svelte";
  import ClockDisplay from "../lib/components/ClockDisplay.svelte";
  import WarningPopup from "../lib/components/WarningPopup.svelte";
  import { formatTime, timeString } from "../lib/util";

  export let alarmTime: number;
  export let timeToNextDeadline: number;
  export let daysActive: number[];
  export let alarmTimeCorrected: boolean;
</script>

<div class="grid grid-cols-[63%_1fr]">
  <div class="flex h-full flex-col items-start justify-center overflow-visible">
    <div class="relative pt-1" style="font-size: 2.1em; line-height: .85em">
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
  </div>
  <div class="pb-[.2em]" style="font-size: .78em; line-height: 1.3em">
    <AlarmActiveDays {daysActive} />
  </div>
</div>
{#if timeToNextDeadline}
  <div class="overflow-visible whitespace-nowrap pl-2 text-xs">
    In <span class="">{formatTime(timeToNextDeadline)}</span>
  </div>
{/if}
