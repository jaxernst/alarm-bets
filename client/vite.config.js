import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit()
		/*VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Alarm Bets',
				short_name: 'Alarm Bets',
				icons: [
					{
						src: '/android-chrome-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/android-chrome-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					}
				],
				theme_color: '#252525',
				background_color: '#252525',
				display: 'standalone'
			}
		}) */
	]
};

export default config;
