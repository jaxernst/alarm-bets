// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./BaseCommitment.sol";
import "./library/AlarmSchedule.sol";
import {ISocialAlarmClockHub} from "./interfaces/ISocialAlarmClockHub.sol";
import {IConfirmationSubmitter, ICommitment} from "./interfaces/ICommitment.sol";

/**
 * The partner alarm clock is a commitment contract that allows two people to set an 'alarm'
 * together, which represents an agreement for both parties to wake up at the same time on the
 * designated days. To verify that each party has woken up, they simply need to submit a
 * confirmation transaction before the alarm time. Failure to do so can result in a penalty
 * that will transfer funds to the other party.
 */
contract PartnerAlarmClock is BaseCommitment, IConfirmationSubmitter {
    ISocialAlarmClockHub deploymentHub;

    using AlarmSchedule for AlarmSchedule.Schedule;

    struct Player {
        AlarmSchedule.Schedule schedule;
        uint depositAmount;
    }

    mapping(address => Player) players;

    uint public alarmTime;
    uint8[] public alarmActiveDays;
    uint public submissionWindow;
    uint public betAmount;
    address public player1;
    address public player2;
    uint public missedAlarmPenalty;

    modifier onlyPlayer() {
        require(
            msg.sender == player1 || msg.sender == player2,
            "ONLY_PLAYER_ACTION"
        );
        _;
    }

    modifier onlyPlayerArg(address player) {
        require(
            player == player1 || player == player2,
            "INVALID_PLAYER_SPECIFIED"
        );
        _;
    }

    function init(
        bytes calldata data
    ) public payable virtual override initializer {
        require(msg.value > 0, "BET_VALUE_REQUIRED");
        deploymentHub = ISocialAlarmClockHub(msg.sender);

        // Initialize to an inactive state, commitment becomes activated once player 2 starts
        // Note: Alarm should never return to the INACTIVE state after starting
        status = CommitmentStatus.INACTIVE;
        betAmount = msg.value;
        int p1TimezoneOffset;

        (
            alarmTime,
            alarmActiveDays,
            missedAlarmPenalty,
            submissionWindow,
            p1TimezoneOffset,
            player1,
            player2
        ) = abi.decode(
            data,
            (uint, uint8[], uint, uint, int, address, address)
        );

        require(player1 != player2, "NON_UNIQUE_PLAYERS");
        require(submissionWindow < 1 days, "INVALID_SUBMISSION_WINDOW");

        players[player1].depositAmount = msg.value;
        players[player1].schedule.init(
            alarmTime,
            alarmActiveDays,
            submissionWindow,
            p1TimezoneOffset
        );
    }

    /*
     * Start and activate the alarm (can only be done by player 2)
     */
    function start(int p2TimezoneOffset) public payable {
        require(status == CommitmentStatus.INACTIVE, "ALREADY_STARTED");
        require(msg.value >= betAmount, "INSUFFICIENT_FUNDS_SENT");
        require(msg.sender == player2, "ONLY_PLAYER_2_CAN_START");

        players[player1].schedule.start();

        players[player2].depositAmount += msg.value;
        players[player2].schedule.init(
            alarmTime,
            alarmActiveDays,
            submissionWindow,
            p2TimezoneOffset
        );

        players[player2].schedule.start();

        deploymentHub.emitUserJoined(
            RegisteredAlarmType.PARTNER_ALARM_CLOCK,
            player2
        );

        status = CommitmentStatus.ACTIVE;
        emit CommitmentInitialized("Alarm Bet Started");
    }

    function addToBalance(address player) public payable onlyPlayerArg(player) {
        require(status == CommitmentStatus.ACTIVE, "NOT_ACTIVE");
        players[msg.sender].depositAmount += msg.value;
    }

    /**
     * Allow either player to 'confirm' a wakeup. Wakeups must be submitted within
     * the submission window on an alarm day for the entry to be recorded
     */
    function submitConfirmation() external override onlyPlayer {
        players[msg.sender].schedule.recordEntry();
        _submitConfirmation();
    }

    function missedDeadlines(
        address player
    ) public view onlyPlayerArg(player) returns (uint) {
        return players[player].schedule.missedDeadlines();
    }

    function numConfirmations(address player) public view returns (uint) {
        return players[player].schedule.entries();
    }

    function timeToNextDeadline(address player) public view returns (uint) {
        return players[player].schedule.timeToNextDeadline();
    }

    function alarmDays() public view returns (uint8[] memory) {
        return alarmActiveDays;
    }

    function playerTimezone(address player) public view returns (int) {
        return players[player].schedule.timezoneOffset;
    }

    // Ends the alarm and withdraw funds for both players with penalties/earnings applied
    function withdraw() public onlyPlayer {
        if (status == CommitmentStatus.INACTIVE) {
            _updateStatus(CommitmentStatus.CANCELLED);
            uint transferAmount = players[msg.sender].depositAmount;
            players[msg.sender].depositAmount = 0;
            payable(msg.sender).transfer(transferAmount);
            return;
        } else if (status != CommitmentStatus.ACTIVE) {
            revert("UNEXPECTED_STATUS_ON_WITHDRAW");
        }

        // In the ACTIVE state, both player's balances are returned (with any penalties applied)
        // In any other state (INACTIVE, CANCELLED), it will return the
        address otherPlayer = msg.sender == player1 ? player2 : player1;

        // Get balances with penalties applied
        uint senderBalance = getPlayerBalance(msg.sender);
        uint otherPlayerBalance = getPlayerBalance(
            msg.sender == player1 ? player2 : player1
        );

        _updateStatus(CommitmentStatus.CANCELLED);

        players[msg.sender].depositAmount = 0;
        players[otherPlayer].depositAmount = 0;
        payable(otherPlayer).transfer(otherPlayerBalance);
        payable(msg.sender).transfer(senderBalance);
    }

    function getPlayerBalance(
        address player
    ) public view onlyPlayerArg(player) returns (uint) {
        uint targetPlayerMissedDeadlines = missedDeadlines(player);
        uint otherPlayerMissedDeadlines = missedDeadlines(
            player == player1 ? player2 : player1
        );

        uint depositAmount = players[player].depositAmount;
        if (targetPlayerMissedDeadlines == otherPlayerMissedDeadlines) {
            // Players tied -> no penalty applied
            return depositAmount;
        } else if (targetPlayerMissedDeadlines > otherPlayerMissedDeadlines) {
            // Target player has missed more than other -> apply penalty
            uint penalty = (targetPlayerMissedDeadlines -
                otherPlayerMissedDeadlines) * missedAlarmPenalty;
            if (penalty >= depositAmount) {
                return 0;
            }
            return depositAmount - penalty;
        } else {
            // Target player has missed less deadlines than other -> apply reward
            uint reward = (otherPlayerMissedDeadlines -
                targetPlayerMissedDeadlines) * missedAlarmPenalty;
            return depositAmount + reward;
        }
    }
}
