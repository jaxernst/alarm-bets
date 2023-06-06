<script>
  import FormCard from "../FormCard.svelte";
  import { timezoneOffset } from "../alarmCreation";
</script>

<FormCard
  itemNumber={6}
  emptyHeader="set timzone settings"
  filledHeader="Timezone"
  inputEmpty={$timezoneOffset === null}
  inputValid={false}
/>
