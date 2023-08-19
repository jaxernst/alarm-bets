<script lang="ts">
  import SettingsIcon from "../assets/settings-icon.svelte";
  import ClockDisplay from "../lib/components/ClockDisplay.svelte";
  import EndAlarmModal from "./EndAlarmModal.svelte";
  import {
    Menu,
    MenuButton,
    MenuItems,
    MenuItem,
  } from "@rgossiaux/svelte-headlessui";

  import { formatEther } from "viem";
  import { transactions } from "../lib/transactions";
  import { MINUTE, correctAlarmTime } from "../lib/time";
  import { submitConfirmation } from "../lib/alarmHelpers";
  import { AlarmStatus } from "@sac/contracts/lib/types";
  import { formatTime, timeString } from "../lib/util";
  import type { UserAlarm } from "../lib/dappStores";
  import { showEndAlarmModal } from "./stores";
  import PlayerInfo from "./PlayerInfo.svelte";
  import { slide } from "svelte/transition";
  import { expoOut } from "svelte/easing";
  import { toast } from "@zerodevx/svelte-toast";
  import DiamondSpinner from "../lib/components/DiamondSpinner.svelte";
  import { writable } from "svelte/store";
  import { getCurrentAccount } from "../lib/chainClient";
  import EthereumIcon from "../assets/ethereum-icon.svelte";
  import { alarmTime } from "../alarm-creation/alarmCreation";

  export let alarm: UserAlarm;

  if (!alarm) {
    throw new Error("required alarm prop not available");
  }

  let deviceTimezone = new Date().getTimezoneOffset() / -60;

  $: account = $getCurrentAccount().address;
  $: alarmAddress = $alarm.address;
  $: correctedAlarmTime = Number($alarm.alarmTime);

  $: if (
    $alarm.alarmTime &&
    $alarm.player1Timezone &&
    ($alarm.player2 === account ? $alarm.player2Timezone : true)
  ) {
    correctedAlarmTime = correctAlarmTime(
      Number($alarm.alarmTime),
      Number(
        account === $alarm.player1
          ? $alarm.player1Timezone
          : $alarm.player2Timezone
      )
    );
  }

  let initialQuery = false;
  if (!initialQuery && $alarm.status === AlarmStatus.ACTIVE) {
    alarm.initAlarmState();
    initialQuery = true;
  }

  let submitPending = false;
  let confirmationSubmitted = false;
  const submitConfirmationTransaction = async () => {
    if (submitPending) return;
    submitPending = true;
    try {
      const txResult = await transactions.addTransaction(
        submitConfirmation(alarmAddress)
      );
      if (!txResult.error) {
        toast.push("You woke up on time!");
        confirmationSubmitted = true;
      } else {
        toast.push("Confirmation failed. Were you too late?");
      }
    } finally {
      submitPending = false;
    }
  };

  // Show details by default when alarm is pending
  let showAlarmInfo = $alarm.status === AlarmStatus.INACTIVE;
  $: rotatedDropdown = () => (showAlarmInfo ? "rotate-180" : "");

  let showAddToBalance = false;
  let addingToBalance = false;
  const addToBalanceAmount = writable<number>(0);

  const addToBalance = async () => {
    addingToBalance = true;
    try {
      const res = await alarm.addToBalance(account, $addToBalanceAmount);
      if (res.error) {
        toast.push("Failed to add funds to alarm balance");
      } else {
        toast.push("Added funds to alarm balance!");
      }
    } finally {
      addingToBalance = false;
      showAddToBalance = false;
    }
  };
</script>

<EndAlarmModal {alarm} />

<div class="flex h-full flex-col">
  <div class="flex flex-grow flex-col gap-1">
    <div class="custom-grid gap-4">
      <div>
        <div class=" whitespace-nowrap rounded-lg p-1 text-xs">
          ID: {$alarm.id}
        </div>
      </div>
      <div
        class="justify-self-center py-1"
        style="font-size: 2em; line-height: 1em;"
      >
        <ClockDisplay
          overrideTime={timeString(
            correctedAlarmTime ?? Number($alarm.alarmTime)
          )}
          overrideColor={"zinc-500"}
        />
      </div>
      <div class="justify-self-end">
        <Menu class="relative" let:open>
          <MenuButton class="z-50 justify-self-end">
            <SettingsIcon
              klass="m-1 h-[15px] w-[15px] fill-zinc-500 hover:fill-zinc-300 hover:scale-105"
            />
          </MenuButton>
          {#if open || showAddToBalance}
            <MenuItems
              class="absolute right-5 top-5 z-50 flex flex-col gap-0 rounded-lg bg-zinc-900 text-xs font-bold"
              static
            >
              <MenuItem>
                {#if !showAddToBalance}
                  <button
                    class="w-full whitespace-nowrap rounded-lg p-2 hover:bg-zinc-700"
                    on:click={() => (showAddToBalance = true)}
                  >
                    Add to Balance
                  </button>
                {:else}
                  <div class="flex items-center px-2">
                    <div>
                      <input
                        type="number"
                        class="bg-highlight-transparent-grey w-[75px] rounded-lg py-[.17em] text-center"
                        min="0"
                        step="0.001"
                        bind:value={$addToBalanceAmount}
                      />
                    </div>
                    <div class="py-3">
                      <div class="h-3 w-3 fill-zinc-400">
                        <EthereumIcon />
                      </div>
                    </div>
                    <button
                      class="w-full whitespace-nowrap rounded-lg p-2"
                      on:click={addToBalance}
                      disabled={$addToBalanceAmount === 0}
                    >
                      {#if !addingToBalance}
                        Add
                      {:else}
                        <DiamondSpinner size={"30"} color={"white"} />
                      {/if}
                    </button>
                  </div>
                {/if}
              </MenuItem>
              <MenuItem>
                <button
                  class="w-full whitespace-nowrap rounded-lg p-2 text-red-700 hover:bg-zinc-700"
                  on:click={() => ($showEndAlarmModal = !$showEndAlarmModal)}
                  >End Alarm</button
                >
              </MenuItem>
            </MenuItems>
          {/if}
        </Menu>
      </div>
    </div>
    {#if $alarm.status === AlarmStatus.INACTIVE}
      <div class="-translate-y-1 text-center">Alarm request pending...</div>
    {:else if $alarm.status === AlarmStatus.ACTIVE && $alarm.timeToNextDeadline !== undefined}
      <div class="-translate-y-1 rounded-md text-center">
        Next Deadline in {formatTime(Number($alarm.timeToNextDeadline))}...
      </div>
    {/if}

    {#if Number($alarm.alarmTime) !== correctedAlarmTime}
      <div class="pb-1 text-center text-xs text-red-600">
        ! Your device timezone ({`UTC${
          deviceTimezone < 0 ? deviceTimezone : "+" + deviceTimezone
        }`}) differs from your preset alarm timezone. (Displaying adjusted alarm
        times)
      </div>
    {/if}

    <!--Players Info-->
    <div
      class={`mt-1 flex flex-grow justify-center gap-1 text-sm font-bold ${
        showAlarmInfo && "overflow-y-auto"
      }`}
    >
      <div class="bg-transparent-grey flex flex-grow flex-col rounded-lg px-2">
        <PlayerInfo player={1} {alarm} />
      </div>
      <div class="bg-transparent-grey flex flex-grow flex-col rounded-lg px-2">
        <PlayerInfo player={2} {alarm} />
      </div>
    </div>

    <!--Alarm Info-->
    <div class="bg-transparent-grey rounded-lg p-2 text-sm">
      <button class="w-full" on:click={() => (showAlarmInfo = !showAlarmInfo)}>
        <div class="flex justify-between font-bold text-zinc-400">
          <div>Alarm Info</div>
          <div
            class={`text-[8px] ${rotatedDropdown()} transition duration-100`}
          >
            &#9660;
          </div>
        </div>
      </button>
      {#if showAlarmInfo}
        <div transition:slide={{ easing: expoOut, duration: 600 }}>
          <div class="flex justify-between gap-2">
            <span class="text-zinc-400">submission window:</span>
            <span
              ><span class="h-3 w-3 text-cyan-600"
                >{Number($alarm.submissionWindow) / MINUTE}</span
              > minutes</span
            >
          </div>

          <div class="flex justify-between gap-2">
            <span class="text-zinc-400">missed alarm penalty:</span>
            <span
              ><span class="h-3 w-3 text-cyan-600"
                >{formatEther($alarm.missedAlarmPenalty)}</span
              > eth</span
            >
          </div>
          <div class="flex justify-between gap-2">
            <span class="text-zinc-400">initial deposit:</span>
            <span
              ><span class="h-3 w-3 text-cyan-600"
                >{formatEther($alarm.betAmount)}</span
              > eth</span
            >
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!--Bottom Button-->
  {#if $alarm.status === AlarmStatus.ACTIVE}
    <div
      class="bg-highlight-transparent-grey mt-1 flex justify-center rounded-lg"
    >
      {#if submitPending}
        <div class="p-3">
          <DiamondSpinner size={"30"} color={"white"} />
        </div>
      {:else}
        <button
          class="shadow-l p-2 text-sm font-bold text-green-600 transition hover:scale-105 disabled:text-green-900"
          disabled={($alarm.timeToNextDeadline ?? 0) >
            $alarm.submissionWindow || confirmationSubmitted}
          on:click={submitConfirmationTransaction}
          >{confirmationSubmitted
            ? "Wakeup Submitted"
            : "Confirm Wakeup"}</button
        >
      {/if}
    </div>
  {/if}
</div>

<style>
  .custom-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }
</style>
