<script lang="ts">
  import { formatEther } from "viem";
  import EthereumIcon from "../assets/ethereum-icon.svelte";
  import SunIcon from "../assets/sun-icon.svelte";
  import type { UserAlarm } from "../lib/contractStores";
  import { shorthandAddress } from "../lib/util";
  import { getBetStanding } from "../lib/alarmHelpers";
  import EthSymbol from "../lib/components/EthSymbol.svelte";
  import { AlarmStatus } from "@sac/contracts/lib/types";

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

  $: confirmations =
    player === 1 ? $alarm.player1Confirmations : $alarm.player2Confirmations;

  $: standing = getBetStanding(alarm, address);

  const row = "flex w-full items-center justify-between text-xs";
  const icon = "flex h-3 w-3 fill-cyan-600";
</script>

<div class="bg-transparent-grey flex flex-grow flex-col rounded-md px-2">
  <span class="text-zinc-500">{shorthandAddress(address)}</span>
  <div class="flex flex-grow flex-col items-center justify-evenly pb-2">
    <div class="flex items-center">
      <div
        class={`flex flex-grow items-center gap-2 py-1 ${
          standing <= BigInt(0) ? "text-red-600" : "text-green-500"
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
  </div>
</div>
