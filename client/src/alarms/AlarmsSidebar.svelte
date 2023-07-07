<script lang="ts">
  import { AlarmStatus } from "@sac/contracts/lib/types";
  import { userAlarms } from "../lib/dappStores";
  import { get } from "svelte/store";
  import AlarmOverview from "./AlarmOverview.svelte";
  import { displayedAlarmId } from "./stores";
  import { flip } from "svelte/animate"; // add this import

  // Split into active and non-active, sort active by time
  $: activeAlarms = Object.values($userAlarms)
    .filter((alarm) => get(alarm).status === AlarmStatus.ACTIVE)
    .sort((a, b) => {
      const aTime = get(a).timeToNextDeadline ?? 0;
      const bTime = get(b).timeToNextDeadline ?? 0;
      return Number(BigInt(aTime) - BigInt(bTime));
    });

  $: nonActiveAlarms = Object.values($userAlarms).filter(
    (alarm) =>
      get(alarm).status !== AlarmStatus.ACTIVE &&
      get(alarm).status !== AlarmStatus.CANCELLED
  );

  $: sortedAlarms = [...activeAlarms, ...nonActiveAlarms];
  $: alarmIds = sortedAlarms.map((alarm) => get(alarm).id);

  $: if ($displayedAlarmId && !alarmIds.includes($displayedAlarmId)) {
    $displayedAlarmId = undefined;
  }
</script>

<div class="max-h-[320px] overflow-y-auto">
  <div class="bg-transparent-grey flex flex-col rounded-xl">
    {#each sortedAlarms as userAlarm (get(userAlarm).id)}
      <div animate:flip={{ duration: 500 }}>
        {#if get(userAlarm).status !== AlarmStatus.CANCELLED}
          <!-- use the flip function to animate the list reordering -->
          <AlarmOverview {userAlarm} />
        {/if}
      </div>
    {/each}
  </div>
</div>
