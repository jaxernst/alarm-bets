<script lang="ts">
  import {
    Dialog,
    DialogDescription,
    DialogOverlay,
    DialogTitle,
  } from "@rgossiaux/svelte-headlessui";
  import Typewriter from "./lib/components/Typewriter.svelte";
  import { crossfade, fade, slide } from "svelte/transition";
  import { cubicIn, cubicInOut, cubicOut } from "svelte/easing";
  import { flip } from "svelte/animate";

  let isOpen = true;
  let typewriterComplete = false;
  let showAbout = false;

  const pullUpParams = { duration: 600, easing: cubicInOut };
  const [send, receive] = crossfade(pullUpParams);

  let singleFadeInComplete = false;
  function singleFadeIn(
    node: HTMLElement,
    { delay, duration }: { delay: number; duration: number }
  ) {
    if (singleFadeInComplete) return {};
    singleFadeInComplete = true;
    return fade(node, { delay, duration });
  }
</script>

<Dialog
  open={isOpen}
  on:close={() => (isOpen = false)}
  class="fixed left-0 top-0 flex h-screen w-full items-center justify-center"
>
  <DialogOverlay
    class="fixed left-0 top-0 -z-10 h-screen w-screen bg-black bg-opacity-20 backdrop-blur-lg "
  />

  {#if !showAbout}
    <div class="w-full md:w-[500px]" out:fade in:fade={{ delay: 500 }}>
      <DialogTitle class="font-digital text-center text-4xl md:text-3xl"
        ><Typewriter
          text="Welcome to the Social Alarm Clock."
          speed={typewriterComplete ? 0 : 35}
          onComplete={() => (typewriterComplete = true)}
        /></DialogTitle
      >

      <div class="flex min-h-[100px] flex-col justify-between p-2">
        {#if typewriterComplete}
          <div class="flex justify-center gap-2 text-zinc-400">
            <div
              in:fade={{
                delay: 500,
                duration: 500,
              }}
            >
              Find a friend.
            </div>
            <div in:fade={{ delay: 700 * 2, duration: 500 }}>Make a bet.</div>
            <div in:fade={{ delay: 700 * 3, duration: 500 }}>
              Wake up earlier.
            </div>
          </div>
        {/if}
      </div>
      <button />
    </div>
  {/if}

  {#if typewriterComplete}
    {#key showAbout}
      <div
        class={`absolute ${
          showAbout ? "top-0" : "bottom-20"
        } flex flex-col items-center justify-center`}
        in:receive={{ key: "about" }}
        out:send={{ key: "about" }}
      >
        <button
          on:click={() => (showAbout = !showAbout)}
          class="flex flex-col items-center justify-center transition-all hover:scale-105 hover:stroke-zinc-300"
          in:singleFadeIn={{ delay: 2600, duration: 800 }}
          out:fade
        >
          <i class="mt-3 text-zinc-400">
            {#if showAbout}
              About the Social Alarm Clock
            {:else}
              New here? Read more
            {/if}
          </i>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            class={`h-6 w-6 stroke-zinc-500 transition-transform ${
              showAbout ? "rotate-180 " : ""
            }`}
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    {/key}

    {#if showAbout}
      <div
        transition:slide={pullUpParams}
        class="overflow-y- absolute bottom-10 my-3 flex max-w-[580px] flex-col gap-6 p-3"
      >
        <div>
          The Social Alarm Clock is a two player onchain betting game that
          incentives waking up early.
        </div>

        <div>
          <b>The Gist</b>
          <p>
            Two players put down money and challenge each other to wake up at a
            specific time on a recurring schedule. On these mornings, each
            player must submit a 'wakeup' confirmation before their alarm time,
            else they risk losing a portion of your bet to the other player.
          </p>
        </div>

        <div>
          <b>How to play</b>
          <div>
            Before play can begin, you must find a friend or stranger willing to
            enter into an alarm 'wakeup' bet. Next, both players must agree on
            the terms of the bet. This includes the following:
          </div>
        </div>

        <div>
          <ul class="list-disc pl-4">
            <li>The alarm time</li>
            <li>The days of the week to enforce it</li>
            <li>The initial value to bet</li>
            <li>The penalty for missing a 'wakeup'</li>
            <li>
              The window of time BEFORE the alarm each player will have to
              confirm their wakeup.
            </li>
          </ul>
        </div>

        <div>
          Next either player can create the alarm contract, and after the second
          player joins, the game will begin. The bet continues indefinitely
          until one player decides to end the game and withdraw their funds.
        </div>

        <div />
      </div>
    {/if}
  {/if}
</Dialog>
