<script lang="ts">
	import '../app.css';

	import { checkForServiceWorkerUpdate } from '$lib/util';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { pwaInfo } from 'virtual:pwa-info';
	import { onMount } from 'svelte';

	$: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';

	onMount(checkForServiceWorkerUpdate);
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>

<SvelteToast />

<main>
	<slot />
</main>
