<script lang="ts">
  import { toast } from "@zerodevx/svelte-toast";
  import { getCurrentAccount } from "../lib/chainConfig";
  import {
    getAlarmById,
    getAlarmConstants,
    getPlayer,
    getPlayerTimezone,
    getStatus,
    startAlarm,
  } from "../lib/alarmHelpers";
  import { transactions } from "../lib/transactions";
  import { shorthandAddress, timeString } from "../lib/util";
  import { formatEther } from "viem";
  import { MINUTE, localTzOffsetHrs } from "../lib/time";
  import ClockDisplay from "../lib/components/ClockDisplay.svelte";
  import AlarmActiveDays from "../lib/components/AlarmActiveDays.svelte";
  import ActionButton from "../lib/styled-components/ActionButton.svelte";
  import type { EvmAddress } from "../types";
  import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
  import DiamondSpinner from "../lib/components/DiamondSpinner.svelte";
  import { hub } from "../lib/contractStores";
  import { activeTab } from "../view";

  let alarmId = "";
  let error: null | string = null;
  let tzOffset = localTzOffsetHrs();

  $: account = $getCurrentAccount().address;

  let joinPending = false;
  const joinAlarm = async () => {
    if (joinPending || !$hub) return;
    joinPending = true;

    try {
      // Check if other player has an alarm with connected account's address
      const targetAlarm = await getAlarmById(alarmId, $hub);
      const otherPlayer = await getPlayer(targetAlarm, 1);

      const txResult = await transactions.addTransaction(
        startAlarm(targetAlarm, tzOffset)
      );
      if (!txResult.error) {
        toast.push(
          `Successfully joined alarm with ${shorthandAddress(otherPlayer)}!`
        );
        $activeTab = "alarms";
      } else {
        toast.push("Alarm creation failed with: " + txResult.error);
      }
    } finally {
      joinPending = false;
    }
  };

  let searchedAlarm:
    | null
    | ({
        player1: EvmAddress;
        player1Timezone: number;
        player2: EvmAddress;
        status: AlarmStatus;
        id: string;
      } & Awaited<ReturnType<typeof getAlarmConstants>>) = null;

  let searching = false;
  const searchForAlarm = async () => {
    if (!$hub) {
      // Lower level error - shouldn'tbe exposed to users
      error = "No alarm clock hub available on this network";
      return;
    }

    searching = true;
    error = null;
    try {
      const alarmAddr = await getAlarmById(alarmId, $hub);
      const constants = await getAlarmConstants(alarmAddr);
      searchedAlarm = {
        ...constants,
        id: alarmId,
        status: await getStatus(alarmAddr),
        player1Timezone: Number(
          await getPlayerTimezone(alarmAddr, constants.player1)
        ),
      };
    } catch {
      error = "No alarm contract found for provided ID";
      return;
    } finally {
      searching = false;
    }

    if (searchedAlarm?.status !== AlarmStatus.INACTIVE) {
      error = "This alarm has already been activated";
    }

    if (searchedAlarm?.player1 === account) {
      error = "You cannot join your own alarm";
    }

    if (searchedAlarm?.player2 !== account) {
      error = "This alarm has not specified you as a partner";
    }
  };

  $: getReadableOffset = () => {
    return tzOffset >= 0 ? `+${tzOffset}` : tzOffset;
  };

  $: getReadableTimezone = () => {
    let localTimezone;
    if (tzOffset === -new Date().getTimezoneOffset() / 60) {
      localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return `UTC${getReadableOffset()} (${localTimezone ?? "non-local"}) `;
  };

  const updateOffset = (increment: number) => {
    let newVal = tzOffset + increment;
    if (newVal > 11) {
      tzOffset = 11;
    } else if (newVal < -11) {
      tzOffset = -11;
    } else {
      tzOffset = newVal;
    }
  };

  const formatTimezone = (offset: number) => {
    return `UTC${tzOffset >= 0 ? `+${tzOffset}` : tzOffset}`;
  };
</script>

<div class="flex h-full flex-col gap-2 px-2 pt-2">
  <div class=" flex h-[30px] items-center gap-2 rounded-xl px-2">
    <input
      type="text"
      class=" bg-highlight-transparent-grey h-full flex-grow rounded-xl px-3 text-zinc-300 placeholder-zinc-500"
      placeholder="Enter alarm id"
      bind:value={alarmId}
    />
    {#if searching}
      <DiamondSpinner klass="mx-4" size={"30"} color={"#22D3EE"} />
    {:else}
      <button
        class={`rounded-xl px-2 text-sm text-cyan-400 ${
          !account ? "opacity-50" : ""
        }`}
        on:click={() => searchForAlarm()}
        disabled={!account}>Search</button
      >
    {/if}
  </div>

  {#if error}
    <div class="pl-3 text-red-600">{error}</div>
  {/if}

  {#if !error && searchedAlarm && !searching}
    <div class="flex flex-grow flex-col justify-between">
      <h3 class="mt-1 text-zinc-400">Alarm #{searchedAlarm.id} Details</h3>
      <div class="flex justify-center">
        <div class="flex-grow px-2 sm:max-w-[70%]">
          <div class="flex flex-col items-center justify-center py-2">
            <div class=" text-[2.5em] sm:pt-1" style="line-height: .8em">
              <ClockDisplay
                overrideTime={timeString(Number(searchedAlarm.alarmTime))}
                overrideColor={"orange"}
              />
            </div>
            <div>
              <AlarmActiveDays daysActive={searchedAlarm.alarmDays} />
            </div>
            <div class="flex w-full justify-between gap-2 pt-2">
              <div class="px-1 text-sm">
                <div>Play with Timezone:</div>
                <div class="whitespace-nowrap text-cyan-600">
                  {getReadableTimezone()}
                </div>
              </div>
              <div class="flex flex-nowrap items-center gap-1">
                <button
                  class="bg-highlight-transparent-grey rounded p-1 focus:border active:bg-zinc-400"
                  style="line-height: .5"
                  on:click={() => updateOffset(-1)}>-</button
                >
                <button
                  class="bg-highlight-transparent-grey rounded p-1 focus:border focus:border-zinc-300 active:bg-zinc-400
                "
                  style="line-height: .5"
                  on:click={() => updateOffset(1)}>+</button
                >
              </div>
            </div>
          </div>
          <div class="flex justify-between gap-2">
            <span class="text-zinc-500">initiating player:</span>
            <span
              ><span class="h-3 w-3 text-cyan-600"
                >{shorthandAddress(searchedAlarm.player1)}</span
              ></span
            >
          </div>
          <div class="flex justify-between gap-2">
            <span class="text-zinc-500">initiating player timezone:</span>
            <span
              ><span class="h-3 w-3 text-cyan-600"
                >{formatTimezone(searchedAlarm.player1Timezone)}</span
              ></span
            >
          </div>
          <div class="flex justify-between gap-2">
            <span class="text-zinc-500">submission window:</span>
            <span
              ><span class="h-3 w-3 text-cyan-600"
                >{Number(searchedAlarm.submissionWindow) / MINUTE}</span
              > minutes</span
            >
          </div>
          <div class="flex justify-between gap-2">
            <span class="text-zinc-500">missed alarm penalty:</span>
            <span
              ><span class="h-3 w-3 text-cyan-600"
                >{formatEther(searchedAlarm.missedAlarmPenalty)}</span
              > eth</span
            >
          </div>
          <div class="flex justify-between gap-2">
            <span class="text-zinc-500">initial deposit:</span>
            <span
              ><span class="h-3 w-3 text-cyan-600"
                >{formatEther(searchedAlarm.betAmount)}</span
              > eth</span
            >
          </div>
        </div>
      </div>
      <div class="mb-1 mt-4 flex justify-end">
        <ActionButton onClick={joinAlarm} isReady={!error}>
          {#if joinPending}
            <div class="p-1">
              <DiamondSpinner size={"30"} color={"white"} />
            </div>
          {:else}
            Join and Activate Alarm
          {/if}
        </ActionButton>
      </div>
    </div>
  {/if}
</div>
