// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * Enumeration of the commitment types registered through the commitment hub
 */
enum RegisteredAlarmType {
    PARTNER_ALARM_CLOCK
}

/**
 * Status represents all the states that alarms can be in
 */
enum CommitmentStatus {
    INACTIVE,
    ACTIVE,
    PAUSED,
    COMPLETE,
    CANCELLED
}
