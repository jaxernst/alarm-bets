// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../types.sol";

interface IAlarmBetsHub {
    function emitUserJoined(RegisteredAlarmType _type, address user) external;

    function emitStatusChanged(
        CommitmentStatus oldStatus,
        CommitmentStatus newStatus
    ) external;
}
