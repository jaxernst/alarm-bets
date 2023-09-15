<script>
	import Welcome from '$lib/Welcome.svelte';
	import { checkForServiceWorkerUpdate, subcribeToPushNotifications } from '$lib/util';
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

<button on:click={subcribeToPushNotifications} class="bg-white m-1 p-1 border border-red-500 rounded active:bg-gray-300 text-red-500">
	Test Alarm Notification
</button>

<main>
	<slot />
</main>
