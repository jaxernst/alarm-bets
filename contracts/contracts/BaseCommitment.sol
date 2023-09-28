// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ICommitment} from "./interfaces/ICommitment.sol";
import {IAlarmBetsHub} from "./interfaces/IAlarmBetsHub.sol";

import "./types.sol";

/**
 * The base commitment defines a primitive commitment implementation, where
 * the only functionality includes confirming (with or without proof) that the commitment
 * was completed, and emitting events to log commitment submissions.
 *
 * @dev Customized commitments inhereit from this contract, and can override functions as needed.
 */
abstract contract BaseCommitment is ICommitment {
    IAlarmBetsHub deploymentHub;

    CommitmentStatus public status;

    bool initialized = false;
    modifier initializer() {
        require(!initialized, "ALREADY_INITIALIZED");
        status = CommitmentStatus.ACTIVE;
        initialized = true;
        _;
    }

    function baseInit() public payable virtual initializer {
        deploymentHub = IAlarmBetsHub(msg.sender);
    }

    function _recordUserJoined(address user) internal {
        deploymentHub.onUserJoined(user);
    }

    function _submitConfirmation(address submittingUser, uint points) internal {
        deploymentHub.onConfirmationSubmitted(submittingUser, points);
    }

    function _updateStatus(CommitmentStatus newStatus) internal {
        deploymentHub.onStatusChanged(status, newStatus);
        status = newStatus;
    }
}
