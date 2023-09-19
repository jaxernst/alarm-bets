export const localTzOffsetHrs = () => {
	return -new Date().getTimezoneOffset() / 60;
};

export function systemTimestamp(): number {
	return Math.floor(Date.now() / 1000);
}

export const timeOfDay = (timestamp: number, timezoneOffsetHrs: number = 0): number => {
	const date = new Date((timestamp + timezoneOffsetHrs * HOUR) * 1000);
	return date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds();
};

// Takes the alarm time of day in seconds (0 - 86400) and a UTC timezone offset (-12 - 12)
// add offsets
export const correctAlarmTime = (alarmTimeS: number, onchainTimezoneOffsetS: number) => {
	const localTimezoneOffsetS = localTzOffsetHrs() * 60 * 60;
	const tzDiff = localTimezoneOffsetS - onchainTimezoneOffsetS;

	let correctedAlarmTimeS = alarmTimeS + tzDiff;

	// Correcting the alarm time so it wraps around 0 and 86400
	if (correctedAlarmTimeS < 0) {
		correctedAlarmTimeS = DAY + correctedAlarmTimeS;
	} else if (correctedAlarmTimeS >= DAY) {
		correctedAlarmTimeS = correctedAlarmTimeS - DAY;
	}

	return correctedAlarmTimeS;
};

export const SECOND = 1;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;
export const WEEK = DAY * 7;
export const MONTH = DAY * 30;
