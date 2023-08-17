// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @notice Enforces and tracks 'confirmations' made to an alarm-clock style schedule, where confirmations
 * are only allowed to be submitted within a configurable window around the alarm deadlines.
 */
library AlarmSchedule {
    event ScheduleInitialized(uint alarmTime);

    struct Schedule {
        // Init vars
        uint alarmTime; // Seconds after midnight the alarm is to be set for
        uint8[] alarmDays; // Days of the week the alarm is to be enforced on (1 Sunday - 7 Saturday)
        uint submissionWindow; // Seconds before the deadline that the user can submit a confirmation
        int timezoneOffset; // The user's timezone offset (+/- 12 hrs) from UTC in seconds
        // Schedule state vars
        uint activationTimestamp;
        uint lastEntryTime;
        bool initialized;
        uint alarmEntries;
    }

    modifier started(Schedule storage self) {
        require(self.activationTimestamp > 0, "NOT_STARTED");
        _;
    }

    function init(
        Schedule storage self,
        uint alarmTime,
        uint8[] memory alarmDaysOfWeek,
        uint submissionWindow,
        int timezoneOffset
    ) internal {
        require(_validateDaysArr(alarmDaysOfWeek), "INVALID_DAYS");
        require(alarmTime < 1 days, "INVALID_ALARM_TIME");
        require(
            -43200 < timezoneOffset &&
                timezoneOffset < 43200 &&
                timezoneOffset % 1 hours == 0,
            "INVALID_TIMEZONE_OFFSET"
        );

        emit ScheduleInitialized(alarmTime);

        self.alarmTime = alarmTime;
        self.alarmDays = alarmDaysOfWeek;
        self.submissionWindow = submissionWindow;
        self.timezoneOffset = timezoneOffset;
        self.initialized = true;
        self.activationTimestamp = 0;
    }

    function start(Schedule storage self) internal {
        require(self.initialized, "NOT_INITIALIZED");
        self.activationTimestamp = _nextDeadlineInterval(self);
    }

    function entries(
        Schedule storage self
    ) internal view started(self) returns (uint) {
        return self.alarmEntries;
    }

    function recordEntry(Schedule storage self) internal started(self) {
        uint timeSinceLastEntry = block.timestamp - self.lastEntryTime;
        // Require that the user has waited at least 1 day since last entry (with margin for the submission window)
        require(
            timeSinceLastEntry >= 1 days - self.submissionWindow,
            "ALREADY_SUBMITTED_TODAY"
        );
        require(inSubmissionWindow(self), "NOT_IN_SUBMISSION_WINDOW");
        self.lastEntryTime = block.timestamp;
        self.alarmEntries++;
    }

    function inSubmissionWindow(
        Schedule storage self
    ) internal view started(self) returns (bool) {
        if (_deadlinePassedToday(self)) {
            return false;
        }
        return
            (_nextDeadlineInterval(self) - block.timestamp) <
            self.submissionWindow;
    }

    /**
     * Determine how many total alarm deadlines have been missed for this schedule.
     * We do this by calculating the number of whole weeks which have passed since
     * activation, then figuring out how many additional (remainder) alarms days to add,
     * and comparing that with the total entry count.
     */
    function missedDeadlines(
        Schedule storage self
    ) internal view started(self) returns (uint numMissedDeadlines) {
        if (block.timestamp < self.activationTimestamp) return 0;

        // The last deadline is the last timestamp where the local time of day == alarmTime
        // (does not have to fall on an alarm day of the week)
        // (used as a reference point for calculating the number of days passed)
        uint256 lastDeadline = _lastDeadlineInterval(self);

        uint256 daysPassed = (lastDeadline - self.activationTimestamp) / 1 days;

        uint weeksPassed = daysPassed / 7;
        uint remainderDays = daysPassed % 7;

        // Get expected entries for full weeks passed
        uint expectedEntriesForFullWeeks = weeksPassed * self.alarmDays.length;

        // Figure out additional expected entries for remainder days based on which
        // of those remainder days are alarm days

        uint8 startDayOfWeek = _dayOfWeek(
            _offsetTimestamp(
                lastDeadline - (remainderDays * 1 days),
                self.timezoneOffset
            )
        );
        uint8 endDayOfWeek = _dayOfWeek(
            _offsetTimestamp(lastDeadline, self.timezoneOffset)
        );

        uint8 alarmsInRemainderDays = 0;
        for (uint j = 0; j < self.alarmDays.length; j++) {
            // I'm sorry you're reading this.
            if (
                (self.alarmDays[j] >= startDayOfWeek &&
                    self.alarmDays[j] <= endDayOfWeek) ||
                (startDayOfWeek > endDayOfWeek &&
                    (self.alarmDays[j] >= startDayOfWeek ||
                        self.alarmDays[j] <= endDayOfWeek))
            ) {
                alarmsInRemainderDays++;
            }
        }

        uint totalExpectedEntries = expectedEntriesForFullWeeks +
            alarmsInRemainderDays;

        return totalExpectedEntries - self.alarmEntries;
    }

    function timeToNextDeadline(
        Schedule storage self
    ) internal view started(self) returns (uint) {
        return nextDeadlineTimestamp(self) - block.timestamp;
    }

    function nextDeadlineTimestamp(
        Schedule storage self
    ) internal view started(self) returns (uint) {
        uint referenceTimestamp = _lastDeadlineInterval(self);

        uint8 curDay = _dayOfWeek(
            _offsetTimestamp(referenceTimestamp, self.timezoneOffset)
        );

        uint8 nextDay = _nextAlarmDay(self, curDay);

        uint8 daysAway;
        if (nextDay > curDay) {
            daysAway = nextDay - curDay;
        } else {
            daysAway = 7 - curDay + _nextAlarmDay(self, 0);
        }

        return referenceTimestamp + uint(daysAway) * 1 days;
    }

    function _nextAlarmDay(
        Schedule storage self,
        uint8 currentDay
    ) internal view returns (uint8) {
        /**
         * Iterate over the alarmDays and take the first day that that's greater than today
         * If there are none, return the earliest alarmDay (lowest index)
         */
        for (uint i; i < self.alarmDays.length; i++) {
            if (self.alarmDays[i] > currentDay) {
                return self.alarmDays[i];
            }
        }

        return self.alarmDays[0];
    }

    function _nextDeadlineInterval(
        Schedule storage self
    ) internal view returns (uint256) {
        uint lastMidnight = _lastMidnightTimestamp(self);
        if (_deadlinePassedToday(self)) {
            return lastMidnight + 1 days + self.alarmTime;
        } else {
            return lastMidnight + self.alarmTime;
        }
    }

    function _lastDeadlineInterval(
        Schedule storage self
    ) internal view returns (uint256) {
        uint lastMidnight = _lastMidnightTimestamp(self);
        if (_deadlinePassedToday(self)) {
            return lastMidnight + self.alarmTime;
        } else {
            return lastMidnight - 1 days + self.alarmTime;
        }
    }

    function _deadlinePassedToday(
        Schedule storage self
    ) internal view returns (bool) {
        uint _now = _offsetTimestamp(block.timestamp, self.timezoneOffset);
        return (_now % 1 days) > self.alarmTime;
    }

    // 1 = Sunday, 7 = Saturday
    function _dayOfWeek(
        uint256 timestamp
    ) internal pure returns (uint8 dayOfWeek) {
        uint256 _days = timestamp / 1 days;
        dayOfWeek = uint8(((_days + 4) % 7) + 1);
    }

    /**
     * @notice 'midnight' is timezone specific so we must offset the timestamp before taking the modulus.
     * this is like pretending UTC started in the user's timezone instead of GMT.
     */
    function _lastMidnightTimestamp(
        Schedule storage self
    ) internal view returns (uint) {
        uint localTimestamp = _offsetTimestamp(
            block.timestamp,
            self.timezoneOffset
        );
        uint lastMidnightLocal = localTimestamp - (localTimestamp % 1 days);
        return _offsetTimestamp(lastMidnightLocal, -self.timezoneOffset);
    }

    function _offsetTimestamp(
        uint timestamp,
        int offset
    ) internal pure returns (uint256) {
        return uint(int(timestamp) + offset);
    }

    function _validateDaysArr(
        uint8[] memory daysActive
    ) internal pure returns (bool) {
        if (daysActive.length > 7 || daysActive.length == 0) {
            return false;
        }
        uint8 lastDay;
        for (uint i; i < daysActive.length; i++) {
            uint8 day = daysActive[i];
            if (day == 0 || day > 7 || lastDay > day) {
                return false;
            }
            lastDay = day;
        }
        return true;
    }
}
