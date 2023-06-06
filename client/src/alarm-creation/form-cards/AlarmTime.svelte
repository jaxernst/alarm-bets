<script>
  import FormCard from "../FormCard.svelte";
  import { alarmTime } from "../alarmCreation";

  const defaultTime = "06:30";
</script>

<FormCard
  itemNumber={2}
  emptyHeader="select wakeup time"
  filledHeader="Wakeup Time"
  inputEmpty={!$alarmTime}
  inputValid={true}
>
  <div class="min-w-[140px]">
    <input
      id="select-time"
      class="bg-transparent text-center outline-none"
      type="time"
      bind:value={$alarmTime}
    />
  </div>
</FormCard>
