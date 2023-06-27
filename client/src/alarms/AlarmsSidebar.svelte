<script lang="ts">
  import { AlarmStatus } from "@sac/contracts/lib/types";
  import { userAlarms } from "../lib/contractStores";
  import { get } from "svelte/store";
  import AlarmOverview from "./AlarmOverview.svelte";
  import { displayedAlarmId } from "./stores";

  // Active alarms go first, then pending. Sort active alarms by alarm time (earliest -> latest)
  $: sortedAlarms = Object.values($userAlarms)
    .filter((alarm) => get(alarm).status !== AlarmStatus.CANCELLED)
    .sort((a, b) => {
      if (get(a).status === AlarmStatus.ACTIVE) {
        return -1;
      }
      return 1;
    });

  $: alarmIds = sortedAlarms.map((alarm) => get(alarm).id);
  $: if ($displayedAlarmId && !alarmIds.includes($displayedAlarmId)) {
    // Reset if the displayed alarm is no longer available
    $displayedAlarmId = undefined;
  }
</script>

<div class="bg-transparent-grey flex flex-col overflow-y-auto rounded-xl">
  {#each sortedAlarms as userAlarm}
    {#if get(userAlarm).status !== AlarmStatus.CANCELLED}
      <AlarmOverview {userAlarm} />
    {/if}
  {/each}
</div>
