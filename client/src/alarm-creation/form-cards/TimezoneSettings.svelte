<script>
  import FormCard from "../FormCard.svelte";
  import { timezoneOffset } from "../alarmCreation";
</script>

<FormCard
  itemNumber={6}
  emptyHeader="change timezone"
  filledHeader="Timezone"
  inputEmpty={$timezoneOffset === null}
  inputValid={false}
/>
