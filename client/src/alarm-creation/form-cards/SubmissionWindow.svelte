<script lang="ts">
  import FormCard from "../FormCard.svelte";
  import { submissionWindow } from "../alarmCreation";

  const MINUTES_30 = 30 * 60;
  const MINUTES_10 = 10 * 60;
  const MINUTES_5 = 5 * 60;
</script>

<FormCard
  itemNumber={6}
  emptyHeader="set submission window"
  filledHeader="Submission Window"
  inputEmpty={!$submissionWindow}
  inputValid={true}
>
  <div class="flex gap-2 px-2">
    <button style="all:unset" on:click={() => ($submissionWindow = MINUTES_30)}>
      <div
        class={"letter" + ($submissionWindow === MINUTES_30 ? "active" : "")}
      >
        30min
      </div>
    </button>
    <button style="all:unset" on:click={() => ($submissionWindow = MINUTES_10)}>
      <div
        class={"letter" + ($submissionWindow === MINUTES_10 ? "active" : "")}
      >
        10min
      </div>
    </button>
    <button style="all:unset" on:click={() => ($submissionWindow = MINUTES_5)}>
      <div class={"letter" + ($submissionWindow === MINUTES_5 ? "active" : "")}>
        5min
      </div>
    </button>
  </div></FormCard
>

<style>
  .letter {
    color: rgb(133, 133, 133);
    font-weight: 400;
    cursor: pointer;
  }

  .letter:hover {
    text-shadow: 1px 1px 2px black;
  }

  .active {
    color: white;
    font-weight: 800;
  }
</style>
