<script lang="ts">
	import Web3Status from '$lib/components/Web3Status.svelte';
	import NewAlarm from '$lib/components/alarm-creation/NewAlarm.svelte';
	import AlarmsSidebar from '$lib/components/alarms/AlarmsSidebar.svelte';
	import AlarmDetail from '$lib/components/alarms/AlarmDetail.svelte';

	import { fade, blur } from 'svelte/transition';
	import { userAlarms } from '$lib/state/contractStores';

	import { displayedAlarmId } from '$lib/components/alarms/stores';
	import Topbar from '$lib/components/Topbar.svelte';
	import AlarmClockSymbol from '../../lib/icon-components/alarm-clock-symbol.svelte';
	import JoinAlarm from '$lib/components/alarm-creation/JoinAlarm.svelte';
	import { type Tab, activeTab } from '../../lib/state/appState';
	import { get } from 'svelte/store';
	import { AlarmStatus } from '@alarm-bets/contracts/lib/types';
	import { account } from '$lib/state/chainConfig';
	import { onMount } from 'svelte';
	import { getPWADisplayMode, mobileCheck } from '$lib/util';
	import Footer from '$lib/components/Footer.svelte';

	$: activeTabStyles = (t: Tab) =>
		t === $activeTab ? ' underline underline-offset-4 text-bold font-bold ' : ' ';

	$: currentAlarms =
		$userAlarms.alarmRecord &&
		userAlarms.getByStatus([
			AlarmStatus.INACTIVE,
			AlarmStatus.ACTIVE,
			AlarmStatus.COMPLETE,
			AlarmStatus.PAUSED
		]);

	$: if (currentAlarms.length > 0) {
		$displayedAlarmId = get(currentAlarms[0]).id;
	}

	let pwaRequired = false;
	onMount(() => {
		if (mobileCheck() && getPWADisplayMode() === 'browser') {
			pwaRequired = true;
		}
	});
</script>

<div class="flex h-screen flex-col justify-between gap-2">
	<div class="flex w-full justify-center">
		<Topbar />
	</div>

	<div
		class="bg-trans main-container-shadow flex min-h-[574px] min-w-full flex-col gap-2 self-center rounded-3xl py-3 text-zinc-300 shadow-neutral-500 sm:min-h-[340px] sm:w-[620px] sm:min-w-0 md:scale-125"
		in:fade={{ duration: 500, delay: 500 }}
	>
		<!-- Main content header -->
		<div class="flex justify-between px-3 align-middle">
			<div class="flex gap-4 rounded-xl px-2">
				<button class={activeTabStyles('alarms')} on:click={() => activeTab.set('alarms')}
					>Alarms</button
				>
				<button class={activeTabStyles('new')} on:click={() => activeTab.set('new')}>New</button>
				<button class={activeTabStyles('join')} on:click={() => activeTab.set('join')}>Join</button>
			</div>
			<div class="flex gap-2">
				{#if $account?.isConnected}<div class="flex items-center gap-1 px-2">
						<div class="h-[18px] w-[18px] stroke-cyan-500">
							<AlarmClockSymbol />
						</div>
						<div>{Object.keys($userAlarms.alarmRecord).length}</div>
					</div>
				{/if}

				<Web3Status />
			</div>
		</div>

		<!-- Main content -->
		<div class="relative grid h-full overflow-hidden">
			{#if $activeTab === 'alarms'}
				<div transition:blur class="col-start-1 row-start-1 h-full overflow-hidden px-3">
					{#if currentAlarms.length === 0}
						<div class=" rounded-2xl p-2 align-middle tracking-tight">
							You have no active alarms. Create a new alarm or join an existing one.
						</div>
					{:else}
						<div
							class="flex h-full flex-col gap-2 self-stretch overflow-hidden sm:grid sm:grid-cols-[1fr_60%]"
						>
							<div class="row-start-1 rounded-2xl sm:col-start-2">
								{#if $displayedAlarmId}
									<AlarmDetail alarm={$userAlarms.alarmRecord[$displayedAlarmId]} />
								{/if}
							</div>
							<AlarmsSidebar />
						</div>
					{/if}
				</div>
			{:else if $activeTab === 'new'}
				<div transition:blur class="col-start-1 row-start-1 max-h-[510px]">
					<NewAlarm />
				</div>
			{:else if $activeTab === 'join'}
				<div transition:blur class="col-start-1 row-start-1 px-3">
					<JoinAlarm />
				</div>
			{/if}
		</div>
	</div>

	<div class="text-s flex min-h-[25px] w-full justify-start px-2">
		<Footer />
	</div>
</div>

<style>
	.main-container-shadow {
		box-shadow: 0px 0px 12px 0px rgba(10, 10, 10, 0.476);
	}

	.bg-trans {
		background: rgba(0, 0, 0, 0.48);
		backdrop-filter: blur(20px);
	}

	.alarms-container-grid {
		display: grid;
		grid-template-columns: 1fr 60%;
	}
</style>
