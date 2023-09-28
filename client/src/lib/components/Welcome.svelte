<script lang="ts">
	import {
		Dialog,
		DialogDescription,
		DialogOverlay,
		DialogTitle
	} from '@rgossiaux/svelte-headlessui';
	import Typewriter from './Typewriter.svelte';
	import { crossfade, fade, slide } from 'svelte/transition';
	import { cubicIn, cubicInOut } from 'svelte/easing';
	import { showWelcome, welcomeHasBeenViewed } from '../state/appState';
	import {
		hubDeployments,
		partnerAlarmClockContractTemplates
	} from '@alarm-bets/contracts/lib/deployments';
	import { onMount } from 'svelte';
	import Deadline from '../icon-components/deadline.svelte';
	import { isIosSafari } from '../util';

	let pwaRequired = false;
	let typewriterComplete = false;
	let showAbout = false;
	let showAppInstall = false;

	let iOSSafari = false;
	onMount(() => {
		isIosSafari();
	});

	// Show the about section by default after showing the welcome for the first time
	showWelcome.subscribe((show) => {
		if (show && $welcomeHasBeenViewed) {
			showAbout = true;
			typewriterComplete = true;
		}
	});

	onMount(() => {
		$welcomeHasBeenViewed = true;
	});

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
	open={showAppInstall}
	on:close={() => (showAppInstall = false)}
	class="fixed left-0 top-0 z-50 flex h-screen w-full items-center justify-center "
>
	<DialogOverlay class="fixed left-0 top-0 -z-10 h-screen w-screen" />
	{#if showAppInstall}
		<div in:slide={{ duration: 600, easing: cubicInOut, axis: 'y' }}>
			<div
				transition:fade={{ duration: 300, easing: cubicIn }}
				class="flex min-h-[48%] w-full flex-col items-center justify-evenly gap-5 rounded-2xl bg-zinc-800 p-6 shadow-lg sm:scale-100"
			>
				<div class="flex flex-col items-center gap-2">
					<div class="flex h-10 w-10 justify-center fill-cyan-400">
						<Deadline />
					</div>
					<DialogTitle class="font-digital text-center text-2xl md:text-3xl">
						Install Alarm Bets
					</DialogTitle>
				</div>
				<DialogDescription class="font-bold sm:text-lg">
					We noticed you are using a mobile device. For the best mobile experience, please install
					the application by adding it to your home screen.
				</DialogDescription>

				<DialogDescription class="font-bold sm:text-lg">
					In your {iOSSafari ? 'Safari' : ''} browser, click the
					<span class="text-cyan-400">{iOSSafari ? 'Share' : 'Menu'}</span>
					button and select
					<span class="text-cyan-400"
						>{iOSSafari ? 'Add to Home Screen' : 'Install / Add Application'}</span
					>.
				</DialogDescription>
			</div>
		</div>
	{/if}
</Dialog>

<Dialog
	open={pwaRequired || $showWelcome}
	on:close={() => (pwaRequired ? null : ($showWelcome = false))}
	class="fixed left-0 top-0 flex h-screen w-full items-center justify-center"
>
	<DialogOverlay
		class="fixed left-0 top-0 -z-10 h-screen w-screen bg-black bg-opacity-20 backdrop-blur-lg "
	/>

	{#if !showAbout}
		<div class="w-full px-2 md:w-[500px]" out:fade in:fade={{ delay: 500 }}>
			<DialogTitle class="font-digital text-center text-4xl md:text-3xl"
				><Typewriter
					text="Welcome to Alarm Bets."
					speed={typewriterComplete ? 0 : 35}
					onComplete={() => (typewriterComplete = true)}
				/></DialogTitle
			>

			<div class="flex min-h-[120px] flex-col justify-between p-2">
				{#if typewriterComplete}
					<div class="flex justify-center gap-2 text-zinc-300">
						<div
							in:fade={{
								delay: 500,
								duration: 500
							}}
						>
							Find a friend.
						</div>
						<div in:fade={{ delay: 700 * 2, duration: 500 }}>Make a bet.</div>
						<div in:fade={{ delay: 700 * 3, duration: 500 }}>Wake up earlier.</div>
					</div>
					<div in:fade={{ delay: 2600, duration: 800 }} class="flex justify-center">
						<button
							on:click={() => (pwaRequired ? (showAppInstall = true) : ($showWelcome = false))}
							class="rounded-lg border border-cyan-500 px-4 py-1 font-bold text-zinc-300 transition-all duration-300 ease-in-out hover:scale-105 hover:bg-cyan-500 hover:text-white hover:shadow-md active:bg-cyan-700 active:text-zinc-400"
						>
							{#if !pwaRequired}
								Enter
							{:else}
								Install
							{/if}
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
					showAbout ? 'top-3' : ' bottom-28'
				} flex flex-col items-center justify-center`}
				in:receive={{ key: 'about' }}
				out:send={{ key: 'about' }}
			>
				<button
					on:click={() => (showAbout = !showAbout)}
					class="flex flex-col items-center justify-center transition-all hover:scale-105 hover:stroke-zinc-300"
					in:singleFadeIn={{ delay: 2600, duration: 800 }}
					out:fade
				>
					<i class="font-bold text-zinc-300">
						{#if showAbout}
							About Alarm Bets
						{:else}
							New here? Read more
						{/if}
					</i>

					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						class={`h-6 w-6 stroke-zinc-500 transition-transform ${showAbout ? 'rotate-180 ' : ''}`}
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
					Alarm Bets is a two player onchain betting game that incentivizes waking up early.
				</div>

				<div>
					<b class="text-cyan-500">The Gist</b>
					<p>
						Two players put down money and challenge each other to wake up at a specific time on a
						recurring schedule. On these mornings, each player must submit a 'wakeup' confirmation
						BEFORE their alarm time, else they risk losing a portion of your bet to the other
						player.
					</p>
				</div>

				<div>
					<b class="text-cyan-500">How to play</b>
					<div>
						This is an onchain application and requires a <span
							><a
								href="https://ethereum.org/en/wallets/"
								class="text-cyan-600 underline underline-offset-1"
								target="_blank">web3 wallet</a
							></span
						> to play!
					</div>
				</div>
				<div>
					<div>
						Before play can begin, you must find a friend or stranger willing to enter into an alarm
						'wakeup' bet. Next, both players must agree on the terms of the bet. This includes the
						following:
					</div>
				</div>

				<div>
					<ul class="list-disc pl-4 marker:text-cyan-500">
						<li>The alarm time</li>
						<li>The days of the week to enforce it</li>
						<li>The initial value to bet</li>
						<li>The penalty for missing a 'wakeup'</li>
						<li>
							The window of time BEFORE the alarm each player will have to confirm their wakeup
							(submission window).
						</li>
					</ul>
				</div>

				<div>
					After the terms are agreed upon, choose a player to create the alarm (via the 'New' tab).
					After this player creates the alarm, they must provide their partner with the alarm ID.
					Once player 2 has this ID, they can join the alarm via the 'Join' tab.
				</div>

				<div>
					Once both players have joined, the alarm is active and the game begins. The alarm will
					remain active indefinetly, or until either players decides to withdraw.
				</div>

				<div>
					<b class="text-cyan-500">Confirming Wakeups</b>
					<div>
						In order to prove to your partner that you have woken, you simply need to sign a
						blockchain transaction as an attestation of your wakefulness. (Must be done within the
						submission window)
					</div>
				</div>

				<div>
					Remember, this is a game to help you and your partner build better sleep habits. If you
					suspect your partner is falling back asleep after their confirmation or being dishonest
					about waking up, you can withdraw at any time to find a new partner.
				</div>

				<div>
					<b class="text-cyan-500">Gameplay Notes</b>
					<ul class="flex list-disc flex-col gap-3 pl-4 marker:text-cyan-500">
						<li>Alarm Bets is free to play. The smart contracts do not impose any fee or tax.</li>
						<li>
							Either player can end their alarm at any time. Ending the alarm will return both
							players remaining balance to their wallet.
						</li>
						<li>
							Alarm Bets can be played with fake money on the Optimism Goerli test network. To do
							so, you must add Optimism Goerli to your wallet and get testnet funds. Reach out to (<a
								class="text-cyan-600 underline"
								target="_blank"
								href="https://jaxer.eth.co">jaxer.eth</a
							> for testnet funds)
						</li>
						<li>
							Timezones: Each player must specify their timezone when creating an alarm. Individual
							player timezones can be offset when creating the alarm, but it is recommended to
							choose the timezone you expect to play in. The 'alarm' time displayed in the UI will
							adjust based on the timezone you are physically in.
						</li>
					</ul>
				</div>

				<div>
					<b class="text-cyan-500">Open Source + Smart Contract</b>
					<ul class="flex list-disc flex-col gap-3 pl-4 marker:text-cyan-500">
						<li>
							Alarm Bets is open source. All smart contracts + frontend code can be viewed on <span
								><a
									href="https://github.com/jaxernst/the-social-alarm-clock"
									class="text-cyan-600 underline">Github</a
								></span
							>
						</li>
						<li>
							Optimism Goerli Contracts:
							<ul class="indent-4">
								<li>
									Hub Contract: <div
										class="overflow-x-visible break-words text-xs text-cyan-500 sm:text-sm"
									>
										{hubDeployments[420]}
									</div>
								</li>
								<li>
									Partner Alarm Contract: <div
										class="overflow-x-auto text-xs text-cyan-500 sm:text-sm"
									>
										{partnerAlarmClockContractTemplates[420]}
									</div>
								</li>
							</ul>
						</li>
						<!--
						<li>
							OP Mainnet Contracts:
							<ul class="indent-4">
								<li>
									Hub Contract: <div
										class="overflow-x-visible break-words text-xs text-cyan-500 sm:text-sm"
									>
										{hubDeployments[10]}
									</div>
								</li>
								<li>
									Partner Alarm Contract: <div
										class="overflow-x-auto text-xs text-cyan-500 sm:text-sm"
									>
										{partnerAlarmClockContractTemplates[10]}
									</div>
								</li>
							</ul>
						</li>
						-->
					</ul>
				</div>
				<div class="text-yellow-500">
					** Warning and Disclaimer **: Though Alarm Bets smart contracts are well tested, there are
					no gurantees that they are bug free. This is experimental software. Only put in what what
					you are willing to lose.
				</div>
			</div>
		{/if}
	{/if}
</Dialog>
