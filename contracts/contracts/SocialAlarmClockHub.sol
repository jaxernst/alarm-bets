// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BaseCommitment} from "./BaseCommitment.sol";
import {ISocialAlarmClockHub} from "./interfaces/ISocialAlarmClockHub.sol";
import "./types.sol";

import "hardhat/console.sol";

/**
 * @notice The Hub and the Factory are dervied from their implementations in the social commitment
 * protocol repository and adpated to be used only for the Social Alarm Clock
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
 *
 * Alarm contracts are deployed as Minimal Proxies (clones), to reduce alarm creation costs.
 */
contract SocialAlarmClockHub is AlarmFactory, ISocialAlarmClockHub {
    uint public nextAlarmId = 1;
    mapping(uint => BaseCommitment) public alarms; // Lookup alarm by id
    mapping(address => uint) public alarmIds; // Lookup alarms by address

    event UserJoined(
        RegisteredAlarmType indexed _type,
        address indexed user,
        address alarmAddr
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
        require(alarmIds[msg.sender] != 0, "NOT_HUB_REGISTERED_COMMITMENT");
        emit UserJoined(_type, user, msg.sender);
    }
}
