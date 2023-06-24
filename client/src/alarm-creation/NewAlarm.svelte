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
  import ActionButton from "../lib/styled-components/ActionButton.svelte";

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
    <ActionButton onClick={create} isReady={!!$isReady} />
  </div>
</div>
