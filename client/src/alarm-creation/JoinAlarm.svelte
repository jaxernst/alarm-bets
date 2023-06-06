<script lang="ts">
  import { toast } from "@zerodevx/svelte-toast";
  import { account } from "../lib/chainClient";
  import { hub } from "../lib/contractStores";
  import { getAlarmById, getPlayer, startAlarm } from "../lib/alarmHelpers";
  import { transactions } from "../lib/transactions";
  import { shorthandAddress } from "../lib/util";

  let alarmId = "";
  let error: null | string = null;

  const joinAlarm = async () => {
    if (!$account) return;

    // Check if other player has an alarm with connected account's address
    const targetAlarm = await getAlarmById(alarmId, $hub);
    if (!targetAlarm) {
      return (error = "No alarm contract found for provided ID");
    }

    // Check if other player's alarm has the connected account's address as a partner
    const player2 = await getPlayer(targetAlarm, 2);
    if (player2 !== $account.address) {
      error = "This address is not apart of this alarm";
      return;
    }

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
</script>

<div>
  <h3 class="py-2">Join an Alarm</h3>
  <div class=" flex h-[30px] gap-2 rounded-xl px-3">
    <input
      type="text"
      class=" bg-highlight-transparent-grey h-full flex-grow rounded-xl px-2 text-zinc-300 placeholder-zinc-500"
      placeholder="Enter alarm id to join"
      bind:value={alarmId}
    />
    <button
      class="text-bold text-bold rounded-xl bg-zinc-800 px-4 text-cyan-400"
      on:click={() => (error = "") || joinAlarm()}>join</button
    >
  </div>
  {#if error}
    <div class="pl-3 text-red-600">{error}</div>
  {/if}
</div>
