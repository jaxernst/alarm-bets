<script lang="ts">
  import AlarmActiveDays from "../lib/components/AlarmActiveDays.svelte";
  import { getRequiredAccount } from "../lib/chainClient";
  import type { EvmAddress } from "../types";
  import type { AlarmInfo } from "../lib/alarmHelpers";
  import { getOtherPlayer } from "../lib/alarmHelpers";
  import { transactions } from "../lib/transactions";
  import ClockDisplay from "../lib/components/ClockDisplay.svelte";
  import { timeString } from "../lib/util";

  export let userAlarm: AlarmInfo<"PartnerAlarmClock">;

  $: account = $getRequiredAccount();
  $: daysActive = userAlarm.contract.alarmDays();
  $: alarmTime = userAlarm.contract.alarmTime();
  $: penaltyVal = userAlarm.contract.missedAlarmPenalty();
  $: submissionWindow = userAlarm.contract
    .submissionWindow()
    .then((res) => res.toNumber());

  let otherPlayer: EvmAddress | null = null;
  $: getOtherPlayer(userAlarm.contract, $account.address ?? "").then(
    (res) => (otherPlayer = res as EvmAddress)
  );

  let timeToNextDeadline: number = 0;

  const syncTimeToDeadline = async () => {
    timeToNextDeadline = (
      await userAlarm.contract.timeToNextDeadline($account.address)
    ).toNumber();
  };

  setInterval(syncTimeToDeadline, 15000);
  setInterval(() => {
    if (timeToNextDeadline) timeToNextDeadline -= 1;
  }, 1000);

  const submitConfirmation = () => {
    transactions.addTransaction(userAlarm.contract.submitConfirmation());
  };
</script>

<div class="flex items-center gap-2">
  <div>
    <div class="pt-1" style="font-size: 2em">
      {#await alarmTime then time}
        <ClockDisplay
          overrideTime={timeString(time.toNumber())}
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
