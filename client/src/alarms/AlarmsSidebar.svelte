<script lang="ts">
  import { AlarmStatus } from "@sac/contracts/lib/types";
  import { userAlarms } from "../lib/contractStores";
  import { get } from "svelte/store";
  import AlarmOverview from "./AlarmOverview.svelte";
  $: Object.values($userAlarms).forEach((alarm) => {
    console.log("userAlarms", get(alarm));
  });

  // Active alarms go first, then pending. Sort active alarms by alarm time (earliest -> latest)
  $: sortedAlarms = Object.values($userAlarms).sort((a, b) => {
    if (get(a).status === AlarmStatus.ACTIVE) {
      return -1;
    }
    return 1;
  });
</script>

<div class="bg-transparent-grey flex flex-col gap-1 overflow-y-auto rounded-xl">
  {#each sortedAlarms as userAlarm}
    {#if get(userAlarm).status !== AlarmStatus.CANCELLED}
      <AlarmOverview {userAlarm} />
    {/if}
  {/each}
</div>
