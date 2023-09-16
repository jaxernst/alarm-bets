<script>
	import Welcome from '$lib/Welcome.svelte';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { pwaInfo } from 'virtual:pwa-info';
	import { onMount } from 'svelte';
	import { checkForServiceWorkerUpdate } from '$lib/util';

	$: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';
	onMount(checkForServiceWorkerUpdate);
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>
<SvelteToast />

<Welcome />

<main>
	<slot />
</main>
