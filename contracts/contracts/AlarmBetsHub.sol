// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BaseCommitment} from "./BaseCommitment.sol";
import {ICommitment} from "./interfaces/ICommitment.sol";
import {IAlarmBetsHub} from "./interfaces/IAlarmBetsHub.sol";
import "./types.sol";

/**
 * Starting to introduce points systems for when alarms record confirmations
 * Need some sort of point multiplier to be adjusted by governance

 *  - Naive partner alarm clock should start at with a 1x multiplier, as botting is trivial
 * 
 *  - A type of attestable partner puzzle alarm clock could be next where the multiplier is higher,
 *   but the alarm bets backend has to attest to the user completing a puzzle (perhaps this can
 *   be done by having an EOA for the backend which is registered as an attestor in the alarm hub. When
 *   users complete puzzles, they must get a signature from the backend prooving they complete the puzzle )
 **/

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
contract SocialAlarmClockHub is AlarmFactory, IAlarmBetsHub {
    uint public nextAlarmId = 1;

    mapping(uint => BaseCommitment) public alarms; // Lookup alarm by id
    mapping(address => uint) public alarmIds; // AAlarm address loopup
    mapping(address => RegisteredAlarmType) // Alarm type lookup

    mapping(address => uint) public alarmBetsPoints;
    mapping(RegisteredAlarmType => uint) public pointMultipliers;

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

    event StatusChanged(
        uint indexed alarmId,
        CommitmentStatus from,
        CommitmentStatus to
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

    modifier onlyHubRegisteredAlarm() {
        require(alarmIds[msg.sender] != 0, "NOT_HUB_REGISTERED_ALARM");
        _;
    }

    /**
     * Called by alarm to indicate a user has joined
     */
    function onUserJoined(
        RegisteredAlarmType _type,
        address user
    ) external onlyHubRegisteredAlarm {
        emit UserJoined(user, _type, msg.sender, alarmIds[msg.sender]);
    }

    function onStatusChanged(
        CommitmentStatus oldStatus,
        CommitmentStatus newStatus
    ) external onlyHubRegisteredAlarm {
        emit StatusChanged(msg.sender, oldStatus, newStatus);
    }

    function onConfirmationSubmitted(
        address submittingUser,
        uint pointsEarned
    ) external onlyHubRegisteredAlarm {
        
        alarmBetsPoints[submittingUser] +=
            pointsEarned *
            pointMultipliers[RegisteredAlarmType.ALARM_BETS];
    }
}
