<script lang="ts">
  import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
  import { userAlarms, type UserAlarm } from "../lib/contractStores";
  import { get } from "svelte/store";
  import AlarmOverview from "./AlarmOverview.svelte";
  import { displayedAlarmId } from "./stores";
  import { flip } from "svelte/animate"; // add this import
  import { onDestroy } from "svelte";

  // Keep track of the time to next deadline for each alarm (used for sorting)
  let alarmTimesToNextDeadline: Record<string, bigint | undefined> = {};
  let unsubs: (() => void)[] = [];
  const unsubAllTimeToNextDeadlineListeners = () => {
    unsubs.forEach((unsub) => unsub());
    unsubs = [];
  };

  // manage time to next deadline listeners (Praying this doesn't cause a memory leak)
  let activeAlarms: UserAlarm[] = [];
  let nonActiveAlarms: UserAlarm[] = [];
  userAlarms.subscribe(() => {
    // Separate by status
    activeAlarms = userAlarms.getByStatus([AlarmStatus.ACTIVE]);
    nonActiveAlarms = userAlarms.getByStatus([
      AlarmStatus.INACTIVE,
      AlarmStatus.COMPLETE,
      AlarmStatus.PAUSED,
    ]);

    // Reset listeners (lazy way to do this)
    unsubAllTimeToNextDeadlineListeners();
    activeAlarms.forEach((alarm) => {
      unsubs.push(
        alarm.subscribe((a) => {
          alarmTimesToNextDeadline[a.id] = a.timeToNextDeadline;
        })
      );
    });
  });

  $: sortedActiveAlarms = activeAlarms.sort((a, b) => {
    const aTime = alarmTimesToNextDeadline[get(a).id];
    const bTime = alarmTimesToNextDeadline[get(b).id];
    if (aTime === undefined || bTime === undefined) {
      return 0;
    }
    return aTime < bTime ? -1 : 1;
  });

  $: sortedAlarms = [...sortedActiveAlarms, ...nonActiveAlarms];
  $: alarmIds = sortedAlarms.map((alarm) => get(alarm).id);

  $: if ($displayedAlarmId && !alarmIds.includes($displayedAlarmId)) {
    $displayedAlarmId = undefined;
  }

  onDestroy(unsubAllTimeToNextDeadlineListeners);
</script>

<div class="text-sm sm:hidden">Your Alarms</div>
<div
  class="bg-transparent-grey flex max-h-[320px] flex-col overflow-y-auto rounded-xl"
>
  {#each sortedAlarms as userAlarm}
    <div class="w-full">
      {#if get(userAlarm).status !== AlarmStatus.CANCELLED}
        <!-- use the flip function to animate the list reordering -->
        <AlarmOverview {userAlarm} />
      {/if}
    </div>
  {/each}
</div>
