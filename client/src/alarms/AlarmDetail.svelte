<script lang="ts">
  import { getRequiredAccount } from "../lib/chainClient";
  import type { EvmAddress } from "../types";
  import { formatEther } from "ethers/lib/utils.js";
  import { transactions } from "../lib/transactions";
  import SettingsIcon from "../assets/settings-icon.svelte";
  import SunIcon from "../assets/sun-icon.svelte";
  import EthereumIcon from "../assets/ethereum-icon.svelte";
  import { MINUTE } from "../lib/time";
  import { onMount } from "svelte";
  import {
    queryAlarm,
    type AlarmBaseInfo,
    submitConfirmation,
  } from "../lib/alarmHelpers";
  import { AlarmStatus } from "@sac/contracts/lib/types";
  import { formatTime, shorthandAddress, timeString } from "../lib/util";
  import ClockDisplay from "../lib/components/ClockDisplay.svelte";

  export let alarm: AlarmBaseInfo;
  const alarmAddress = alarm.contractAddress;

  $: account = $getRequiredAccount();

  // Contract constants - Will eventually be refactored to avoid duplicate queries
  $: alarmTime = queryAlarm(alarmAddress, "alarmTime");
  let penaltyVal: string;
  let submissionWindow: number;
  let initialDeposit: string;
  let player1: EvmAddress;
  let player2: EvmAddress;

  // Contract variables
  let player1Balance: string = "";
  let player2Balance: string = "";
  let player1Confirmations: number = 0;
  let player2Confirmations: number = 0;
  let timeToNextDeadline: number = 0;

  queryAlarm(alarmAddress, "missedAlarmPenalty").then(
    (res) => (penaltyVal = formatEther(res))
  );

  queryAlarm(alarmAddress, "submissionWindow").then(
    (res) => (submissionWindow = Number(res))
  );

  queryAlarm(alarmAddress, "betAmount").then(
    (res) => (initialDeposit = formatEther(res))
  );

  queryAlarm(alarmAddress, "player1").then(
    (res) => (player1 = res as EvmAddress)
  );
  queryAlarm(alarmAddress, "player2").then(
    (res) => (player2 = res as EvmAddress)
  );

  $: if (player1 && alarm.status === AlarmStatus.ACTIVE) {
    queryAlarm(alarmAddress, "getPlayerBalance", [player1]).then((res) => {
      player1Balance = formatEther(res);
    });

    queryAlarm(alarmAddress, "numConfirmations", [player1]).then(
      (res) => (player1Confirmations = Number(res))
    );
  }

  $: if (player2 && alarm.status === AlarmStatus.ACTIVE) {
    queryAlarm(alarmAddress, "getPlayerBalance", [player2]).then((res) => {
      player2Balance = formatEther(res);
    });

    queryAlarm(alarmAddress, "numConfirmations", [player2]).then(
      (res) => (player2Confirmations = Number(res))
    );
  }

  const syncTimeToDeadline = async () => {
    if (alarm.status === AlarmStatus.ACTIVE) {
      timeToNextDeadline = Number(
        await queryAlarm(alarmAddress, "timeToNextDeadline", [$account.address])
      );
    }
  };

  onMount(syncTimeToDeadline);
  setInterval(syncTimeToDeadline, 15000);
  setInterval(() => {
    if (timeToNextDeadline) timeToNextDeadline -= 1;
  }, 1000);

  const submitConfirmationTransaction = () => {
    transactions.addTransaction(submitConfirmation(alarmAddress));
  };

  let expanded = false;
</script>

<div class="flex h-full flex-col">
  <div class="flex flex-grow flex-col gap-1 px-2 py-1">
    <div class="custom-grid gap-4">
      <div>
        <div class=" rounded-lg p-1 text-xs">ID: {alarm.id}</div>
      </div>
      <div class="justify-self-center" style="font-size: 1.6em">
        {#await alarmTime then time}
          <ClockDisplay
            overrideTime={timeString(Number(time))}
            overrideColor={"zinc-500"}
          />
        {/await}
      </div>
      <div class="m-1 h-[15px] w-[15px] justify-self-end fill-zinc-500">
        <SettingsIcon />
      </div>
    </div>
    {#if alarm.status === AlarmStatus.INACTIVE}
      <div class="-translate-y-1 pb-1 text-center">
        Alarm request pending...
      </div>
    {:else if alarm.status === AlarmStatus.ACTIVE}
      <div class="-translate-y-1 rounded-md pb-1 text-center">
        Next Deadline in {formatTime(timeToNextDeadline)}...
      </div>
    {/if}

    <div class="bg-transparent-grey rounded-t-md p-2 text-sm">
      <div class="flex justify-between gap-2">
        <span class="text-zinc-500">submission window:</span>
        <span
          ><span class="h-3 w-3 text-cyan-600">{submissionWindow / MINUTE}</span
          > minutes</span
        >
      </div>

      <div class="flex justify-between gap-2">
        <span class="text-zinc-500">missed alarm penalty:</span>
        <span><span class="h-3 w-3 text-cyan-600">{penaltyVal}</span> eth</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-zinc-500">initial deposit:</span>
        <span
          ><span class="h-3 w-3 text-cyan-600">{initialDeposit}</span> eth</span
        >
      </div>
    </div>
    <div class="flex flex-grow justify-center gap-1 text-sm font-bold">
      <div
        class="bg-transparent-grey flex flex-grow flex-col rounded-bl-md px-2"
      >
        <span class="text-zinc-500"
          >{player1 ? shorthandAddress(player1) : ""}</span
        >
        <div class="flex flex-grow items-center justify-evenly pb-1">
          <div class="flex items-center gap-1">
            {player1Confirmations || "-"}
            <div class="h-3 w-3 fill-cyan-600">
              <SunIcon />
            </div>
          </div>
          <div class="flex items-center gap-1">
            {player1Balance || "-"}
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
          >{player2 ? shorthandAddress(player2) : ""}</span
        >
        <div class="flex flex-grow items-center justify-evenly pb-1">
          <div class="flex items-center gap-1">
            {player2Confirmations || "-"}
            <div class="h-3 w-3 fill-cyan-600">
              <SunIcon />
            </div>
          </div>
          <div class="flex items-center gap-1">
            {player2Balance || "-"}
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
    {#if alarm.status === AlarmStatus.INACTIVE}
      <button
        class="shadow-l p-1 text-sm font-bold text-red-700 transition hover:scale-105 hover:text-green-600"
        >Cancel Request</button
      >
    {:else}
      <button
        class="shadow-l p-1 text-sm font-bold text-green-600 transition hover:scale-105 disabled:text-green-900"
        disabled={timeToNextDeadline > submissionWindow}
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
