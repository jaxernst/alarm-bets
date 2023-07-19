<script lang="ts">
  import {
    Dialog,
    DialogOverlay,
    DialogTitle,
  } from "@rgossiaux/svelte-headlessui";
  import Typewriter from "./lib/components/Typewriter.svelte";
  import { crossfade, fade, slide } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { showWelcome } from "./view";

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
  open={$showWelcome}
  on:close={() => ($showWelcome = false)}
  class="fixed left-0 top-0 flex h-screen w-full items-center justify-center"
>
  <DialogOverlay
    class="fixed left-0 top-0 -z-10 h-screen w-screen bg-black bg-opacity-20 backdrop-blur-lg "
  />

  {#if !showAbout}
    <div class="w-full px-2 md:w-[500px]" out:fade in:fade={{ delay: 500 }}>
      <DialogTitle class="font-digital text-center text-4xl md:text-3xl"
        ><Typewriter
          text="Welcome to the Social Alarm Clock."
          speed={typewriterComplete ? 0 : 35}
          onComplete={() => (typewriterComplete = true)}
        /></DialogTitle
      >

      <div class="flex min-h-[120px] flex-col justify-between p-2">
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
          <div
            in:fade={{ delay: 2600, duration: 800 }}
            class="flex justify-center"
          >
            <button
              on:click={() => ($showWelcome = false)}
              class="rounded-lg border border-cyan-500 px-4 py-1 font-bold text-zinc-300 transition-all duration-300 ease-in-out ease-in-out hover:scale-105 hover:bg-cyan-500 hover:text-white hover:shadow-md active:bg-cyan-700 active:text-zinc-400"
            >
              Enter
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if typewriterComplete}
    {#key showAbout}
      <div
        class={`absolute ${
          showAbout ? "top-3" : " bottom-28"
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
          <i class="text-zinc-400">
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
        class="absolute bottom-10 my-3 flex max-h-[80%] max-w-[800px] flex-col gap-6 overflow-y-auto p-3"
      >
        <div>
          The Social Alarm Clock is a two player onchain betting game that
          incentivizes waking up early.
        </div>

        <div>
          <b class="text-cyan-500">The Gist</b>
          <p>
            Two players put down money and challenge each other to wake up at a
            specific time on a recurring schedule. On these mornings, each
            player must submit a 'wakeup' confirmation before their alarm time,
            else they risk losing a portion of your bet to the other player.
          </p>
        </div>

        <div>
          <b class="text-cyan-500">How to play</b>
          <div>
            This is an onchain application and requires a <span
              ><a
                href="https://ethereum.org/en/wallets/"
                class="text-cyan-600 underline underline-offset-1"
                >web3 wallet</a
              ></span
            > to play!
          </div>
        </div>
        <div>
          <div>
            Before play can begin, you must find a friend or stranger willing to
            enter into an alarm 'wakeup' bet. Next, both players must agree on
            the terms of the bet. This includes the following:
          </div>
        </div>

        <div>
          <ul class="list-disc pl-4 marker:text-cyan-500">
            <li>The alarm time</li>
            <li>The days of the week to enforce it</li>
            <li>The initial value to bet</li>
            <li>The penalty for missing a 'wakeup'</li>
            <li>
              The window of time BEFORE the alarm each player will have to
              confirm their wakeup (submission window).
            </li>
          </ul>
        </div>

        <div>
          One player then creates the alarm, the second player joins, and the
          alarm automatically activates. The alarm will remain active
          indefinetly, or until either players decides to withdraw.
        </div>

        <div>
          <b class="text-cyan-500">Confirming Wakeups</b>
          <div>
            In order to prove to your partner that you have woken, you simply
            need to sign a blockchain transaction as an attestation of your
            wakefulness. (Must be done within the submission window)
          </div>
        </div>

        <div>
          Remember, this is a game to help you and your partner build better
          sleep habits. If you suspect your partner is falling back asleep after
          their confirmation or being dishonest about waking up, you can
          withdraw at any time to find a new partner.
        </div>

        <div>
          <b class="text-cyan-500">Important Notes</b>
          <ul class="list-disc pl-4 marker:text-cyan-500">
            <li>
              The Social Alarm Clock is free to play. The smart contracts do not
              impose any fee or tax.
            </li>
            <li>
              The Social Alarm Clock is open source. All smart contracts +
              frontend code can be viewed on <span
                ><a
                  href="https://github.com/jaxernst/the-social-alarm-clock"
                  class="text-cyan-600 underline">Github</a
                ></span
              >
            </li>
            <li>
              Though the Social Alarm Clock smart contracts are well tested,
              there are no gurantees that they are bug free. This is
              experimental software. Only put in what what you are willing to
              lose.
            </li>
            <li>
              Timezones: Each player must specify their timezone when creating
              an alarm. Individual player timezones can be offset when creating
              the alarm, but it is recommended to choose the timezone you expect
              to play in. The 'alarm' time displayed in the UI will adjust based
              on the timezone you are physically in.
            </li>
          </ul>
        </div>
      </div>
    {/if}
  {/if}
</Dialog>
