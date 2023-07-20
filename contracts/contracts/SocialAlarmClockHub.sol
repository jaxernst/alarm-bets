// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BaseCommitment} from "./BaseCommitment.sol";
import {ISocialAlarmClockHub} from "./interfaces/ISocialAlarmClockHub.sol";
import "./types.sol";

/**
 * @notice The Hub and the Factory are derived from their implementations in the Social Commitment
 * Protocol repository and adpated to be used only for the Social Alarm Clock
 */

/**
 * @notice The AlarmFactory is responsible for creating new alarms from pre-registered alarm contract
 * templates. The factory is used to deploy new alarms as minimal proxies to reduce alarm creation costs
 */
contract AlarmFactory is Ownable {
    mapping(RegisteredAlarmType => address) public alarmTypeRegistry;

    function _createAlarm(
        RegisteredAlarmType _type
    ) internal returns (BaseCommitment) {
        require(alarmTypeRegistry[_type] != address(0), "TYPE_NOT_REGISTERED");
        return BaseCommitment(Clones.clone(alarmTypeRegistry[_type]));
    }

    function registerAlarmType(
        RegisteredAlarmType _type,
        address deployedAt
    ) public onlyOwner {
        require(alarmTypeRegistry[_type] == address(0), "TYPE_REGISTERED");
        alarmTypeRegistry[_type] = deployedAt;
    }
}

/**
 * @notice Manage the process of creating new alarms and tracking currently deployed alarms.
 * The hub stores deployed alarm references and contains events for frontends to index and track
 * users alarms
 */
contract SocialAlarmClockHub is AlarmFactory, ISocialAlarmClockHub {
    uint public nextAlarmId = 1;
    mapping(uint => BaseCommitment) public alarms; // Lookup alarm by id
    mapping(address => uint) public alarmIds; // Lookup alarms by address

    event UserJoined(
        address indexed user,
        RegisteredAlarmType indexed _type,
        address alarmAddr,
        uint id
    );

    event AlarmCreation(
        address indexed user,
        RegisteredAlarmType indexed _type,
        address alarmAddr,
        uint id
    );

    /**
     * Creates and initializes an alarm
     */
    function createAlarm(
        RegisteredAlarmType _type,
        bytes memory _initData
    ) public payable {
        BaseCommitment alarm = _createAlarm(_type);
        alarm.init{value: msg.value}(_initData);

        uint id = nextAlarmId++;
        alarms[id] = alarm;
        alarmIds[address(alarm)] = id;
        emit AlarmCreation(msg.sender, _type, address(alarm), id);
    }

    /**
     * Called by alarm to indicate a user has joined
     */
    function emitUserJoined(RegisteredAlarmType _type, address user) external {
        require(alarmIds[msg.sender] != 0, "NOT_HUB_REGISTERED_ALARM");
        emit UserJoined(user, _type, msg.sender, alarmIds[msg.sender]);
    }
}
