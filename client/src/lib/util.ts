export const isIosSafari = () => {
	const ua = window.navigator.userAgent;
	const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
	const webkit = !!ua.match(/WebKit/i);
	iOS && webkit && !ua.match(/CriOS/i);
};

export function getPWADisplayMode() {
	const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
	if (document.referrer.startsWith('android-app://')) {
		return 'twa';
	} else if ((navigator as any).standalone || isStandalone) {
		return 'standalone';
	}
	return 'browser';
}

export const shorthandAddress = (address: string) => {
	return '0x' + address.slice(2, 4) + '...' + address.slice(-4);
};

export function timeString(secondsAfterMidnight: number) {
	var hours = Math.floor(secondsAfterMidnight / 3600);
	var minutes = Math.floor((secondsAfterMidnight % 3600) / 60);
	var ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	var minutesFormatted = minutes < 10 ? '0' + minutes : minutes;
	var strTime = hours + ':' + minutesFormatted + ' ' + ampm;
	return strTime;
}

export function formatTime(timeInSeconds: number) {
	const MINUTE_IN_SECONDS = 60;
	const HOUR_IN_SECONDS = MINUTE_IN_SECONDS * 60;
	const DAY_IN_SECONDS = HOUR_IN_SECONDS * 24;
	const WEEK_IN_SECONDS = DAY_IN_SECONDS * 7;

	if (timeInSeconds < MINUTE_IN_SECONDS) {
		return `${timeInSeconds} second${timeInSeconds === 1 ? '' : 's'}`;
	} else if (timeInSeconds < HOUR_IN_SECONDS) {
		const minutes = Math.floor(timeInSeconds / MINUTE_IN_SECONDS);
		const seconds = timeInSeconds % MINUTE_IN_SECONDS;
		return `${minutes} minute${minutes === 1 ? '' : 's'} and ${seconds} second${
			seconds === 1 ? '' : 's'
		}`;
	} else if (timeInSeconds < DAY_IN_SECONDS) {
		const hours = Math.floor(timeInSeconds / HOUR_IN_SECONDS);
		const minutes = Math.floor((timeInSeconds % HOUR_IN_SECONDS) / MINUTE_IN_SECONDS);
		return `${hours} hour${hours === 1 ? '' : 's'}, ${minutes} minute${minutes === 1 ? '' : 's'}`;
	} else if (timeInSeconds < WEEK_IN_SECONDS) {
		const days = Math.floor(timeInSeconds / DAY_IN_SECONDS);
		const hours = Math.floor((timeInSeconds % DAY_IN_SECONDS) / HOUR_IN_SECONDS);
		return `${days} day${days === 1 ? '' : 's'}, ${hours} hour${hours === 1 ? '' : 's'}`;
	} else {
		const weeks = Math.floor(timeInSeconds / WEEK_IN_SECONDS);
		const days = Math.floor((timeInSeconds % WEEK_IN_SECONDS) / DAY_IN_SECONDS);
		return `${weeks} week${weeks === 1 ? '' : 's'}, ${days} day${days === 1 ? '' : 's'}`;
	}
}

export async function getEtherPrice() {
	const res = await fetch('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD');
	return Number((await res.json())['USD']);
}

export function mobileCheck() {
	let check = false;
	(function (a) {
		if (
			/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
				a
			) ||
			/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
				a.substr(0, 4)
			)
		)
			check = true;
	})(navigator.userAgent || navigator.vendor || (window as any).opera);
	return check;
}

export function checkForServiceWorkerUpdate() {
	let updated = false;
	let activated = false;
	let hadControllingServiceWorker = !!navigator.serviceWorker.controller;
	function checkUpdate() {
		if (activated && updated && hadControllingServiceWorker) {
			console.log('Application was updated refreshing the page...');
			window.location.reload();
		}
	}

	navigator.serviceWorker.register('service-worker.js').then((registration) => {
		registration.addEventListener('updatefound', () => {
			const worker = registration.installing;
			worker?.addEventListener('statechange', () => {
				console.log({ state: worker.state });
				if (worker.state === 'activated') {
					activated = true;
					checkUpdate();
				}
			});
		});
	});
	navigator.serviceWorker.addEventListener('controllerchange', () => {
		updated = true;
		checkUpdate();
	});
}

function urlBase64ToUint8Array(base64String: string) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

export function subcribeToPushNotifications() {
	// Convert the VAPID key to a usable format
	if (!PUBLIC_VAPID_KEY) {
		console.warn('VAPID key not found');
		return;
	}

	if ('serviceWorker' in navigator && 'PushManager' in window) {
		navigator.serviceWorker.ready.then((registration) => {
			registration.pushManager
				.subscribe({
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
				})
				.then((subscription) => {
					// TODO: Send the subscription to your server here
					console.log(JSON.stringify(subscription));
					window.fetch('api/notifications/subscribe', {
						method: 'POST',
						body: JSON.stringify(subscription),
						headers: {
							'content-type': 'application/json'
						}
					});
					console.log('User is subscribed:', subscription);
				})
				.catch((error) => {
					console.error('Failed to subscribe the user: ', error);
				});
		});
	}
}
