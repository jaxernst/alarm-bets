<script lang="ts">
	import { account, ensName } from '../state/chainConfig';
	import { web3Modal as _web3Modal } from '../state/chainConfig';
	import { shorthandAddress } from '../util';
	import { networkError } from '../state/contractStores';
	import { onMount } from 'svelte';

	let displayName: string | undefined;
	$: if ($account?.address) {
		displayName = $ensName ? $ensName : shorthandAddress($account.address);
	}
	$: indicatorColor = $account && $account.isConnected ? 'green' : 'red';

	let web3Modal: undefined | typeof _web3Modal;
	onMount(() => {
		web3Modal = _web3Modal;
	});
</script>

<div class="flex h-full items-center gap-4">
	<button class="flex items-center" on:click={() => $web3Modal?.openModal()}>
		{#if !$account || !$account.isConnected}
			<button
				class="rounded-2xl bg-local px-3 py-1 text-cyan-500 transition-colors duration-200 hover:text-cyan-300"
				on:click={() => $web3Modal?.openModal()}
			>
				Connect Wallet
			</button>
		{:else if $networkError === 'UNSUPPORTED_NETWORK'}
			<div class="indicator" style="background-color:{indicatorColor}" />
			<div class="px-1 text-sm text-red-500">Wrong Network</div>
		{:else}
			<div class="indicator" style="background-color:{indicatorColor}" />
			<div class="displayName px-1 text-sm font-bold">
				{displayName || ''}
			</div>
		{/if}
	</button>
</div>

<style>
	.indicator {
		height: 8px;
		width: 8px;
		transform: translate(0, -6px);
		border-radius: 100%;
		background-color: var(--indicator-color);
	}

	.displayName {
		color: rgb(201, 145, 34);
	}

	.bg-local {
		background-color: rgba(52, 52, 54, 0.603);
	}
</style>
