<script lang="ts">
  import { activeTab } from "../view";

  import { onDestroy } from "svelte";

  import { writable } from "svelte/store";

  import { onMount } from "svelte";
  import { fade, scale, slide } from "svelte/transition";

  type T = $$Generic;
  export let inputEmpty: boolean = true;
  export let inputValid: boolean;
  export let emptyHeader: string;
  export let filledHeader: string;
  export let itemNumber: number;
  export let completeOnFocus: boolean = false;
  let active = false;
  let container: HTMLElement;
  let initialWidth = writable(0);
  onMount(() => {
    $initialWidth = container.getBoundingClientRect().width;
  });

  function activeOnChildFocus(node: HTMLElement) {
    const handleFocusIn = () => {
      if (completeOnFocus && $activeTab) {
        inputEmpty = false;
      }
      active = node.contains(document.activeElement);
    };

    document.addEventListener("focusin", handleFocusIn);
    return {
      destroy: () => {
        document.removeEventListener("focusin", handleFocusIn);
      },
    };
  }

  $: buttonClasses = () => {
    const classes = [];
    if (active) classes.push(" duration-500 scale-105 shadow-lg ");
    if (inputEmpty) return classes.join(" ");
    if (inputValid) classes.push(" border border-cyan-400 ");
    if (!inputValid) classes.push(" border border-red-500 ");
    return classes.join(" ");
  };
</script>

<button
  class={`bg-highlight-transparent-grey relative flex h-[65px] flex-col justify-start rounded-xl px-2 pb-2 transition
    ${buttonClasses()}`}
  use:activeOnChildFocus
  bind:this={container}
>
  <div class={"text-s text-bold pt-1 text-zinc-500"} style="line-height: 1em">
    {itemNumber}
    {#if active || !inputEmpty}
      <span transition:fade>{active || !inputEmpty ? filledHeader : ""}</span>
    {/if}
  </div>
  <div class="grid flex-grow items-center">
    {#if active || !inputEmpty}
      <div class="col-start-1 row-start-1 self-center px-1" transition:scale>
        <slot />
      </div>
    {:else}
      <div
        out:fade={{ duration: 200 }}
        in:fade={{ delay: 200 }}
        class="col-start-1 row-start-1 whitespace-nowrap"
      >
        {emptyHeader}
      </div>
    {/if}
  </div>
</button>
