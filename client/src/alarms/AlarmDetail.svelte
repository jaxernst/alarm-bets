<script lang="ts">
  import SettingsIcon from "../assets/settings-icon.svelte";
  import SunIcon from "../assets/sun-icon.svelte";
  import EthereumIcon from "../assets/ethereum-icon.svelte";
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
  import { MINUTE } from "../lib/time";
  import { submitConfirmation } from "../lib/alarmHelpers";
  import { AlarmStatus } from "@sac/contracts/lib/types";
  import { formatTime, timeString } from "../lib/util";
  import type { UserAlarm } from "../lib/contractStores";
  import { showEndAlarmModal } from "./stores";
  import PlayerInfo from "./PlayerInfo.svelte";
  import { slide } from "svelte/transition";
  import { expoOut } from "svelte/easing";

  export let alarm: UserAlarm;

  if (!alarm) {
    throw new Error("required alarm prop not available");
  }

  $: alarmAddress = $alarm.address;

  let initialQuery = false;
  if (!initialQuery && $alarm.status === AlarmStatus.ACTIVE) {
    alarm.initAlarmState();
    initialQuery = true;
  }

  const submitConfirmationTransaction = () => {
    transactions.addTransaction(submitConfirmation(alarmAddress));
  };

  // Show details by default when alarm is pending
  let showAlarmInfo = $alarm.status === AlarmStatus.INACTIVE;
  $: rotatedDropdown = () => (showAlarmInfo ? "rotate-180" : "");
</script>

<EndAlarmModal {alarm} />

<div class="flex h-full flex-col">
  <div class="flex flex-grow flex-col gap-1">
    <div class="custom-grid gap-4">
      <div>
        <div class=" rounded-lg p-1 text-xs">ID: {$alarm.id}</div>
      </div>
      <div
        class="justify-self-center py-1"
        style="font-size: 2em; line-height: 1em;"
      >
        <ClockDisplay
          overrideTime={timeString(Number($alarm.alarmTime))}
          overrideColor={"zinc-500"}
        />
      </div>
      <div class="justify-self-end">
        <Menu class="relative">
          <MenuButton class="z-50 justify-self-end">
            <SettingsIcon
              klass="m-1 h-[15px] w-[15px] fill-zinc-500 hover:fill-zinc-300 hover:scale-105"
            />
          </MenuButton>
          <MenuItems
            class="absolute right-5 top-5 z-50 flex flex-col gap-0 rounded-lg bg-zinc-900 text-xs font-bold"
          >
            <MenuItem>
              <button
                class="w-full whitespace-nowrap rounded-lg p-2 hover:bg-zinc-700"
              >
                Add Collateral
              </button>
            </MenuItem>
            <MenuItem>
              <button
                class="w-full whitespace-nowrap rounded-lg p-2 text-red-700 hover:bg-zinc-700"
                on:click={() => ($showEndAlarmModal = !$showEndAlarmModal)}
                >End Alarm</button
              >
            </MenuItem>
          </MenuItems>
        </Menu>
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

    <!--Players Info-->
    <div
      class={`flex flex-grow justify-center gap-1 text-sm font-bold ${
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
        <div class="flex justify-between">
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
      {/if}
    </div>
  </div>

  <!--Bottom Buttons-->
  <div
    class="bg-highlight-transparent-grey mt-1 flex justify-center rounded-lg"
  >
    {#if $alarm.status === AlarmStatus.ACTIVE}
      <button
        class="shadow-l p-2 text-sm font-bold text-green-600 transition hover:scale-105 disabled:text-green-900"
        disabled={($alarm.timeToNextDeadline ?? 0) > $alarm.submissionWindow}
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
