<script lang="ts">
  import AlarmActiveDays from "../lib/components/AlarmActiveDays.svelte";
  import { getRequiredAccount } from "../lib/chainClient";
  import type { EvmAddress } from "../types";
  import { queryAlarm, type AlarmBaseInfo } from "../lib/alarmHelpers";
  import { getOtherPlayer } from "../lib/alarmHelpers";
  import { transactions } from "../lib/transactions";
  import ClockDisplay from "../lib/components/ClockDisplay.svelte";
  import { timeString } from "../lib/util";

  export let userAlarm: AlarmBaseInfo;

  $: account = $getRequiredAccount();
  $: daysActive = queryAlarm(userAlarm.contractAddress, "alarmDays");
  $: alarmTime = queryAlarm(userAlarm.contractAddress, "alarmTime");

  let otherPlayer: EvmAddress | null = null;
  $: getOtherPlayer(userAlarm.contractAddress, $account.address ?? "").then(
    (res) => (otherPlayer = res as EvmAddress)
  );

  let timeToNextDeadline: number = 0;
  const syncTimeToDeadline = async () => {
    timeToNextDeadline = Number(
      await queryAlarm(userAlarm.contractAddress, "timeToNextDeadline", [
        $account.address ?? "",
      ])
    );
  };

  setInterval(syncTimeToDeadline, 15000);
  setInterval(() => {
    if (timeToNextDeadline) timeToNextDeadline -= 1;
  }, 1000);
</script>

<div class="flex items-center gap-2">
  <div>
    <div class="pt-1" style="font-size: 2em">
      {#await alarmTime then time}
        <ClockDisplay
          overrideTime={timeString(Number(time))}
          overrideColor={"orange"}
        />
      {/await}
    </div>
    <div />
  </div>
  <div class="" style="font-size: .7em">
    {#await daysActive}
      <AlarmActiveDays daysActive={[]} />
    {:then days}
      <AlarmActiveDays daysActive={days} />
    {/await}
  </div>
</div>

<style>
  .custom-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
  }
</style>
