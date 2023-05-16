// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../types.sol";

interface ISocialAlarmClockHub {
    function emitUserJoined(RegisteredAlarmType _type, address user) external;
}
