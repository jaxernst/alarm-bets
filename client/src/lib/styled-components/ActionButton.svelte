<script lang="ts">
  export let onClick: () => void;
  export let isReady: boolean;
</script>

<button
  on:click={onClick}
  disabled={!isReady}
  class={`text-bold text-bold bg-highlight-transparent-grey rounded-xl px-4 py-1 text-cyan-400 transition duration-200 
        ${
          isReady
            ? "submit-bg hover:scale-105 hover:shadow-lg"
            : "text-opacity-50"
        }`}
>
  Submit
</button>

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
