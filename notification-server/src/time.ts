const HOUR = 60 * 60;

export const timeOfDay = (
  timestamp: number,
  timezoneOffsetHrs: number = 0
): number => {
  const date = new Date((timestamp + timezoneOffsetHrs * HOUR) * 1000);
  return (
    date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds()
  );
};

export function systemTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
