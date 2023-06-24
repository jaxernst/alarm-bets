<script lang="ts">
  import { toast } from "@zerodevx/svelte-toast";
  import { getCurrentAccount } from "../lib/chainClient";
  import { hub } from "../lib/contractStores";
  import {
    getAlarmById,
    getAlarmConstants,
    getPlayer,
    getStatus,
    startAlarm,
  } from "../lib/alarmHelpers";
  import { transactions } from "../lib/transactions";
  import { shorthandAddress, timeString } from "../lib/util";
  import { formatEther } from "viem";
  import { MINUTE } from "../lib/time";
  import ClockDisplay from "../lib/components/ClockDisplay.svelte";
  import AlarmActiveDays from "../lib/components/AlarmActiveDays.svelte";
  import ActionButton from "../lib/styled-components/ActionButton.svelte";
  import type { EvmAddress } from "../types";
  import { AlarmStatus } from "@sac/contracts/lib/types";

  // TODO: Make sure user can't join an already active alarm
  // Todo: Make button styling consistent with other pages

  let alarmId = "";
  let error: null | string = null;

  $: account = $getCurrentAccount().address;

  const joinAlarm = async () => {
    // Check if other player has an alarm with connected account's address
    const targetAlarm = await getAlarmById(alarmId, $hub);

    // Check if other player's alarm has the connected account's address as a partner
    const player2 = await getPlayer(targetAlarm, 2);

    const otherPlayer = await getPlayer(targetAlarm, 1);
    const txResult = await transactions.addTransaction(startAlarm(targetAlarm));

    if (!txResult.error) {
      toast.push(
        `Successfully joined alarm with ${shorthandAddress(otherPlayer)}!`
      );
    } else {
      toast.push("Alarm creation failed with: " + txResult.error.message);
    }
  };

  let searchedAlarm: null | {
    player1: EvmAddress;
    player2: EvmAddress;
    status: AlarmStatus;
    id: string;
  } = null;

  const searchForAlarm = async () => {
    error = null;
    try {
      const alarmAddr = await getAlarmById(alarmId, $hub);
      searchedAlarm = {
        ...(await getAlarmConstants(alarmAddr)),
        status: await getStatus(alarmAddr),
        id: alarmId,
      };
    } catch {
      error = "No alarm contract found for provided ID";
      return;
    }

    if (searchedAlarm?.status !== AlarmStatus.INACTIVE) {
      error = "This alarm is already active";
    }

    if (searchedAlarm?.player1 === account) {
      error = "You cannot join your own alarm";
    }

    if (searchedAlarm?.player2 !== account) {
      error = "This alarm has not specified you as a partner";
    }
  };
</script>

<div class="flex h-full flex-col gap-2 px-2">
  <h3 class="">Join an Alarm</h3>
  <div class=" flex h-[30px] gap-2 rounded-xl px-2">
    <input
      type="text"
      class=" bg-highlight-transparent-grey h-full flex-grow rounded-xl px-3 text-zinc-300 placeholder-zinc-500"
      placeholder="Enter alarm id"
      bind:value={alarmId}
    />
    <button
      class={`rounded-xl px-2 text-sm text-cyan-400 ${
        !account ? "opacity-50" : ""
      }`}
      on:click={() => searchForAlarm()}
      disabled={!account}>Search</button
    >
  </div>

  {#if error}
    <div class="pl-3 text-red-600">{error}</div>
  {/if}

  {#if !error && searchedAlarm}
    <div class="flex flex-grow flex-col">
      <h3 class="">Alarm #{searchedAlarm.id} Details</h3>
      <div class="flex justify-center">
        <div class="max-w-[60%] flex-grow px-2">
          <div class="flex justify-center py-2">
            <div>
              <div class="pt-1" style="font-size: 2em; line-height: .8em">
                <ClockDisplay
                  overrideTime={timeString(Number(searchedAlarm.alarmTime))}
                  overrideColor={"orange"}
                />
              </div>
              <div>
                <AlarmActiveDays daysActive={searchedAlarm.alarmDays} />
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
      <div class="mb-1 flex justify-end">
        <ActionButton onClick={joinAlarm} isReady={!error}>Join</ActionButton>
      </div>
    </div>
  {/if}
</div>
