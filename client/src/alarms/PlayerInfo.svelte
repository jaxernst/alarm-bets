<script lang="ts">
  import { formatEther } from "viem";
  import EthereumIcon from "../assets/ethereum-icon.svelte";
  import SunIcon from "../assets/sun-icon.svelte";
  import type { UserAlarm } from "../lib/dappStores";
  import { shorthandAddress } from "../lib/util";
  import { getBetStanding } from "../lib/alarmHelpers";
  import { AlarmStatus } from "@sac/contracts/lib/types";
  import Deadline from "../assets/deadline.svelte";
  import { HOUR } from "../lib/time";

  export let player: 1 | 2;
  export let alarm: UserAlarm;

  $: address = player === 1 ? $alarm.player1 : $alarm.player2;

  let balance: bigint;
  $: if ($alarm.status === AlarmStatus.INACTIVE) {
    balance = player === 1 ? $alarm.betAmount : BigInt(0);
  } else {
    balance =
      (player === 1 ? $alarm.player1Balance : $alarm.player2Balance) ??
      BigInt(0);
  }

  let confirmations: bigint | undefined;
  let missedAlarms: bigint | undefined;
  let timezone: bigint | undefined;
  $: if (player === 1) {
    confirmations = $alarm.player1Confirmations;
    missedAlarms = $alarm.player1MissedDeadlines;
    timezone = $alarm.player1Timezone;
  } else {
    confirmations = $alarm.player2Confirmations;
    missedAlarms = $alarm.player2MissedDeadlines;
    timezone = $alarm.player2Timezone;
  }

  $: standing = $alarm && getBetStanding(alarm, address);

  const formatTimezone = (tzSecs: number) => {
    const tz = tzSecs / HOUR;
    return "utc" + (tz >= 0 ? `+${tz}` : tz);
  };

  const row = "flex w-full items-center justify-between text-xs";
  const icon = "flex h-3 w-3 fill-cyan-600";
</script>

<div class="flex justify-between gap-1">
  <div class="font-bold text-zinc-500">{shorthandAddress(address)}</div>
  <div class="text-[10px] text-zinc-500">
    {timezone ? formatTimezone(Number(timezone)) : ""}
  </div>
</div>
<div class="flex flex-grow flex-col items-center justify-evenly gap-1 pb-2">
  <div class="flex items-center">
    <div
      class={`flex flex-grow items-center gap-2 py-1 ${
        standing < BigInt(0) ? "text-red-700" : "text-green-600"
      }`}
    >
      {standing > BigInt(0)
        ? "+"
        : standing === BigInt(0)
        ? "+ "
        : ""}{formatEther(standing)}
      <div class={icon}>
        <EthereumIcon />
      </div>
    </div>
  </div>
  <div class={row}>
    Balance
    <div class="flex items-center gap-1">
      {formatEther(balance) ?? "-"}
      <div class={icon}>
        <EthereumIcon />
      </div>
    </div>
  </div>

  <div class={row}>
    Wakeups
    <div class="flex items-center gap-1">
      {confirmations ?? "-"}
      <div class={icon}>
        <SunIcon />
      </div>
    </div>
  </div>

  <div class={row}>
    Missed Alarms
    <div class="flex items-center gap-1">
      {missedAlarms ?? "-"}
      <div class={icon}>
        <Deadline />
      </div>
    </div>
  </div>
</div>
