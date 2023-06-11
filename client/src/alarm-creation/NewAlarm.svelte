<script lang="ts">
  import { createAlarm, isReady } from "./alarmCreation";

  import { transactions } from "../lib/transactions";
  import { toast } from "@zerodevx/svelte-toast";

  import ChoosePartner from "./form-cards/Partner.svelte";
  import ChooseAlarmTime from "./form-cards/AlarmTime.svelte";
  import ChooseAlarmDays from "./form-cards/Days.svelte";
  import ChooseInitialDeposit from "./form-cards/InitialDeposit.svelte";
  import ChoosePenalty from "./form-cards/AlarmPenalty.svelte";
  import ChooseSubmissionWindow from "./form-cards/SubmissionWindow.svelte";
  import ChooseTimezoneSettings from "./form-cards/TimezoneSettings.svelte";

  $: create = async () => {
    const createAlarmResult = $createAlarm();
    if (!createAlarmResult) return;

    const txResult = await transactions.addTransaction(createAlarmResult);
    if (!txResult.error) {
      toast.push("Alarm creation successful!");
    } else {
      toast.push("Alarm creation failed with: " + txResult.error.message);
    }
  };

  const cards = [
    ChoosePartner,
    ChooseAlarmTime,
    ChooseAlarmDays,
    ChooseInitialDeposit,
    ChoosePenalty,
    ChooseSubmissionWindow,
    ChooseTimezoneSettings,
  ];
</script>

<div class="flex h-full flex-col">
  <h3 class="px-2 py-0">Create a new Alarm Contract</h3>
  <div class="flex-grow">
    <div class="flex flex-wrap gap-2 overflow-x-auto px-3 py-2 text-zinc-300">
      {#each cards as card}
        <svelte:component this={card} />
      {/each}
    </div>
  </div>

  <div class="self-end">
    <button
      on:click={create}
      disabled={!$isReady}
      class={`text-bold text-bold bg-highlight-transparent-grey rounded-xl px-4 py-1 text-cyan-400 transition duration-200 
        ${
          $isReady
            ? "submit-bg hover:scale-105 hover:shadow-lg"
            : "text-opacity-50"
        }`}
    >
      Submit
    </button>
  </div>
</div>

<style>
  .submit-bg:hover {
    background: rgba(0, 0, 0, 0.321187850140056);
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.221187850140056) 0%,
      rgba(33, 33, 33, 0.19793855042016806) 100%
    );
  }
</style>
