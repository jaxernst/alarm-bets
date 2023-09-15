<script>
	import Welcome from '$lib/Welcome.svelte';
	import { checkForServiceWorkerUpdate, subcribeToPushNotifications } from '$lib/util';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { supabase } from '$lib/supabaseClient';

	$: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';
	onMount(checkForServiceWorkerUpdate)
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>
<SvelteToast />

<Welcome />

<button on:click={subcribeToPushNotifications} >
	Subscribe
</button>

<main>
	<slot />
</main>
