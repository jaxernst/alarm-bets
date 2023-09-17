<script lang="ts">
	import Welcome from '$lib/Welcome.svelte';
	import { HOUR, localTzOffsetHrs, systemTimestamp } from '$lib/time';
	import { checkForServiceWorkerUpdate, subcribeToPushNotifications } from '$lib/util';
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

<Welcome />

<main>
	<slot />
</main>
