<script lang="ts">
  import { getRequiredAccount } from "../lib/chainClient";
  import { transactions } from "../lib/transactions";
  import SettingsIcon from "../assets/settings-icon.svelte";
  import SunIcon from "../assets/sun-icon.svelte";
  import EthereumIcon from "../assets/ethereum-icon.svelte";
  import { MINUTE } from "../lib/time";
  import { submitConfirmation } from "../lib/alarmHelpers";
  import { AlarmStatus } from "@sac/contracts/lib/types";
  import { formatTime, shorthandAddress, timeString } from "../lib/util";
  import ClockDisplay from "../lib/components/ClockDisplay.svelte";
  import type { UserAlarm } from "../lib/contractStores";
  import { formatEther } from "viem";

  export let alarm: UserAlarm;

  if (!alarm) {
    throw new Error("required alarm prop not available");
  }

  $: alarmAddress = $alarm.address;
  $: p1Balance = $alarm.player1Balance;
  $: p2Balance = $alarm.player2Balance;

  let initialQuery = false;
  if (!initialQuery && $alarm.status === AlarmStatus.ACTIVE) {
    alarm.initAlarmState();
    initialQuery = true;
  }

  $: account = $getRequiredAccount();

  const submitConfirmationTransaction = () => {
    transactions.addTransaction(submitConfirmation(alarmAddress));
  };

  let expanded = false;
</script>

<div class="flex h-full flex-col">
  <div class="flex flex-grow flex-col gap-1 px-2 py-1">
    <div class="custom-grid gap-4">
      <div>
        <div class=" rounded-lg p-1 text-xs">ID: {$alarm.id}</div>
      </div>
      <div class="justify-self-center" style="font-size: 1.6em">
        <ClockDisplay
          overrideTime={timeString(Number($alarm.alarmTime))}
          overrideColor={"zinc-500"}
        />
      </div>
      <div class="m-1 h-[15px] w-[15px] justify-self-end fill-zinc-500">
        <SettingsIcon />
      </div>
    </div>
    {#if $alarm.status === AlarmStatus.INACTIVE}
      <div class="-translate-y-1 pb-1 text-center">
        Alarm request pending...
      </div>
    {:else if $alarm.status === AlarmStatus.ACTIVE}
      <div class="-translate-y-1 rounded-md pb-1 text-center">
        Next Deadline in {formatTime(Number($alarm.timeToNextDeadline))}...
      </div>
    {/if}

    <div class="bg-transparent-grey rounded-t-md p-2 text-sm">
      <div class="flex justify-between gap-2">
        <span class="text-zinc-500">submission window:</span>
        <span
          ><span class="h-3 w-3 text-cyan-600"
            >{Number($alarm.submissionWindow) / MINUTE}</span
          > minutes</span
        >
      </div>

      <div class="flex justify-between gap-2">
        <span class="text-zinc-500">missed alarm penalty:</span>
        <span
          ><span class="h-3 w-3 text-cyan-600"
            >{formatEther($alarm.missedAlarmPenalty)}</span
          > eth</span
        >
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-zinc-500">initial deposit:</span>
        <span
          ><span class="h-3 w-3 text-cyan-600"
            >{formatEther($alarm.betAmount)}</span
          > eth</span
        >
      </div>
    </div>
    <div class="flex flex-grow justify-center gap-1 text-sm font-bold">
      <div
        class="bg-transparent-grey flex flex-grow flex-col rounded-bl-md px-2"
      >
        <span class="text-zinc-500"
          >{$alarm.player1 ? shorthandAddress($alarm.player1) : ""}</span
        >
        <div class="flex flex-grow items-center justify-evenly pb-1">
          <div class="flex items-center gap-1">
            {$alarm.player1Confirmations || "-"}
            <div class="h-3 w-3 fill-cyan-600">
              <SunIcon />
            </div>
          </div>
          <div class="flex items-center gap-1">
            {(p1Balance && formatEther(p1Balance)) || "-"}
            <div class="h-3 w-3 fill-cyan-600">
              <EthereumIcon />
            </div>
          </div>
        </div>
      </div>
      <div
        class="bg-transparent-grey flex flex-grow flex-col rounded-br-md px-2"
      >
        <span class="text-zinc-500"
          >{$alarm.player2 ? shorthandAddress($alarm.player2) : ""}</span
        >
        <div class="flex flex-grow items-center justify-evenly pb-1">
          <div class="flex items-center gap-1">
            {$alarm.player2Confirmations || "-"}
            <div class="h-3 w-3 fill-cyan-600">
              <SunIcon />
            </div>
          </div>
          <div class="flex items-center gap-1">
            {(p2Balance && formatEther(p2Balance)) || "-"}
            <div class="h-3 w-3 fill-cyan-600">
              <EthereumIcon />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    class="bottom-0 right-0 flex w-full justify-center rounded-b-xl bg-zinc-800 p-1"
  >
    {#if $alarm.status === AlarmStatus.INACTIVE}
      <button
        class="shadow-l p-1 text-sm font-bold text-red-700 transition hover:scale-105 hover:text-green-600"
        >Cancel Request</button
      >
    {:else}
      <button
        class="shadow-l p-1 text-sm font-bold text-green-600 transition hover:scale-105 disabled:text-green-900"
        disabled={$alarm.timeToNextDeadline > $alarm.submissionWindow}
        on:click={submitConfirmationTransaction}>Confirm Wakeup</button
      >
    {/if}
  </div>
</div>

<style>
  .custom-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }
</style>
