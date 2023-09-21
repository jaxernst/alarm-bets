const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function systemTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export function timeOfDay(timestamp: number, timezoneOffsetHrs: number = 0) {
  const date = new Date((timestamp + timezoneOffsetHrs * HOUR) * 1000);
  return (
    date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds()
  );
}

export function getTimeUntilNextAlarm(
  alarmTimeSeconds: number,
  timezoneOffset: number,
  alarmDays: number[]
) {
  const curTimestamp = systemTimestamp();

  function _offsetTimestamp(timestamp: number, offset: number) {
    return timestamp + offset;
  }

  function _deadlinePassedToday() {
    const time = _offsetTimestamp(curTimestamp, timezoneOffset) % DAY;
    return time > alarmTimeSeconds;
  }

  function _lastMidnightTimestamp() {
    const localTimestamp = _offsetTimestamp(curTimestamp, timezoneOffset);
    const lastMidnightLocal = localTimestamp - (localTimestamp % DAY);
    return _offsetTimestamp(lastMidnightLocal, -timezoneOffset);
  }

  function _lastDeadlineInterval() {
    const lastMidnight = _lastMidnightTimestamp();
    if (_deadlinePassedToday()) {
      return lastMidnight + alarmTimeSeconds;
    } else {
      return lastMidnight - DAY + alarmTimeSeconds;
    }
  }

  function _dayOfWeek() {
    const _days = Math.floor(
      Math.floor(_offsetTimestamp(curTimestamp, timezoneOffset) / DAY)
    );
    return ((_days + 4) % 7) + 1;
  }

  function _nextAlarmDay(curDay: number) {
    return alarmDays.find((day) => day > curDay) ?? alarmDays[0];
  }

  const referenceTimestamp = _lastDeadlineInterval();
  const curDay = _dayOfWeek();
  const nextDay = _nextAlarmDay(curDay);

  let daysAway;
  if (nextDay > curDay) {
    daysAway = nextDay - curDay;
  } else {
    daysAway = 7 - curDay + _nextAlarmDay(0);
  }

  return referenceTimestamp + daysAway * DAY - curTimestamp;
}
