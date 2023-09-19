<script lang="ts">
  import { writable } from "svelte/store";
  import FormCard from "../FormCard.svelte";
  import {
    timezoneOffset as offset,
    timezoneOffsetConfirmed,
  } from "../alarmCreation";

  const updateOffset = (increment: number) => {
    let newVal = $offset + increment;
    if (newVal > 11) {
      $offset = 11;
    } else if (newVal < -11) {
      $offset = -11;
    } else {
      $offset = newVal;
    }
  };

  $: getReadableOffset = () => {
    return $offset >= 0 ? `+${$offset}` : $offset;
  };

  $: getReadableTimezone = () => {
    let localTimezone;
    if ($offset === -new Date().getTimezoneOffset() / 60) {
      localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return `UTC${getReadableOffset()} (${localTimezone ?? "non-local"}) `;
  };
</script>

<FormCard
  itemNumber={7}
  emptyHeader="confirm timezone"
  filledHeader="Timezone Offset"
  inputEmpty={!$timezoneOffsetConfirmed}
  inputValid={true}
  onCardFocus={() => ($timezoneOffsetConfirmed = true)}
>
  <div class="flex items-center gap-1">
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
    <p class="whitespace-nowrap px-1 text-sm">
      Timezone: {getReadableTimezone()}
    </p>
  </div>
</FormCard>
