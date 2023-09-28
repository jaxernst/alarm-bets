// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../types.sol";

interface IAlarmBetsHub {
    function onUserJoined(address user) external;

    function onStatusChanged(
        CommitmentStatus oldStatus,
        CommitmentStatus newStatus
    ) external;

    function onConfirmationSubmitted(
        address submittingUser,
        uint pointsEarned
    ) external;
}
