<script>
	import Welcome from '$lib/Welcome.svelte';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { pwaInfo } from 'virtual:pwa-info';

	$: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';

	(function () {
		// We are going to track an updated flag and an activated flag.
		// When both of these are flagged true the service worker was updated and activated.
		let updated = false;
		let activated = false;
		navigator.serviceWorker.register('service-worker.js').then((regitration) => {
			regitration.addEventListener('updatefound', () => {
				const worker = regitration.installing;
				worker?.addEventListener('statechange', () => {
					console.log({ state: worker.state });
					if (worker.state === 'activated') {
						// Here is when the activated state was triggered from the lifecycle of the service worker.
						// This will trigger on the first install and any updates.
						activated = true;
						checkUpdate();
					}
				});
			});
		});
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			// This will be triggered when the service worker is replaced with a new one.
			// We do not just reload the page right away, we want to make sure we are fully activated using the checkUpdate function.
			console.log({ state: 'updated' });
			updated = true;
			checkUpdate();
		});

		function checkUpdate() {
			if (activated && updated) {
				console.log('Application was updated refreshing the page...');
				window.location.reload();
			}
		}
	})();
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>
<SvelteToast />

<Welcome />

<main>
	<slot />
</main>
