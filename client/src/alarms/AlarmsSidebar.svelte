<script lang="ts">
  import { userAlarms } from "../lib/contractStores";
  import AlarmOverview from "./AlarmOverview.svelte";
  import { get } from "svelte/store";

  $: Object.values($userAlarms).forEach((alarm) => {
    //console.log("userAlarms", get(alarm));
  });
</script>

<div class="bg-transparent-grey flex flex-col gap-1 overflow-y-auto rounded-xl">
  {#each Object.values($userAlarms) as userAlarm}
    <AlarmOverview {userAlarm} />
  {/each}
</div>
