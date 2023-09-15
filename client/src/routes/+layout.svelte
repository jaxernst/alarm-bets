<script>
	import Welcome from '$lib/Welcome.svelte';
	import { checkForServiceWorkerUpdate } from '$lib/util';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';

	$: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';
	onMount(checkForServiceWorkerUpdate)
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>
<SvelteToast />

<Welcome />

<main>
	<slot />
</main>
