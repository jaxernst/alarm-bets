if (!self.define) {
	let e,
		s = {};
	const i = (i, n) => (
		(i = new URL(i + '.js', n).href),
		s[i] ||
			new Promise((s) => {
				if ('document' in self) {
					const e = document.createElement('script');
					(e.src = i), (e.onload = s), document.head.appendChild(e);
				} else (e = i), importScripts(i), s();
			}).then(() => {
				let e = s[i];
				if (!e) throw new Error(`Module ${i} didn’t register its module`);
				return e;
			})
	);
	self.define = (n, r) => {
		const l = e || ('document' in self ? document.currentScript.src : '') || location.href;
		if (s[l]) return;
		let o = {};
		const t = (e) => i(e, l),
			u = { module: { uri: l }, exports: o, require: t };
		s[l] = Promise.all(n.map((e) => u[e] || t(e))).then((e) => (r(...e), o));
	};
}
define(['./workbox-b1f6ddb5'], function (e) {
	'use strict';
	self.skipWaiting(),
		e.clientsClaim(),
		e.precacheAndRoute(
			[
				{ url: 'assets/browser-3852a342.js', revision: null },
				{ url: 'assets/browser-99a01eee.js', revision: null },
				{ url: 'assets/ccip-f77f6598.js', revision: null },
				{ url: 'assets/index-3ca0b635.js', revision: null },
				{ url: 'assets/index-3e773744.js', revision: null },
				{ url: 'assets/index-3fe52a7b.js', revision: null },
				{ url: 'assets/index-709fbc41.css', revision: null },
				{ url: 'assets/index-e25785ec.js', revision: null },
				{ url: 'assets/index.es-3fbe4b5f.js', revision: null },
				{ url: 'index.html', revision: '388f4188e99e8511c85dbc8913ec16b6' },
				{ url: 'registerSW.js', revision: '1872c500de691dce40960bb85481de07' },
				{ url: 'android-chrome-192x192.png', revision: 'e613c75239e314a61f55b132a6903911' },
				{ url: 'android-chrome-512x512.png', revision: '132927e709a43ea7d1ee2ef28f2efded' },
				{ url: 'manifest.webmanifest', revision: '1c039410aa8e163d30dc8e3050e41c7d' }
			],
			{}
		),
		e.cleanupOutdatedCaches(),
		e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL('index.html')));
});
