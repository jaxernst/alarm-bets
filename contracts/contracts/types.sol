// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * Status represents all the states that comittments can be in
 */
enum CommitmentStatus {
    INACTIVE,
    ACTIVE,
    PAUSED,
    COMPLETE,
    CANCELLED
}
/**
 * Enumeration of the commitment types registered through the commitment hub
 */
enum RegisteredAlarmType {
    PARTNER_ALARM_CLOCK
}
