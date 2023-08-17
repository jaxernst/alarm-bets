// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ICommitment} from "./interfaces/ICommitment.sol";
import "./types.sol";

/**
 * The base commitment defines a primitive commitment implementation, where
 * the only functionality includes confirming (with or without proof) that the commitment
 * was completed, and emitting events to log commitment submissions.
 *
 * @dev Customized commitments inhereit from this contract, and can override functions as needed.
 */
contract BaseCommitment is ICommitment {
    string public name;
    CommitmentStatus public status;
    address public owner;
    uint nextProofId = 1;

    bool initialized = false;
    modifier initializer() {
        require(!initialized, "ALREADY_INITIALIZED");
        owner = tx.origin;
        status = CommitmentStatus.ACTIVE;
        initialized = true;
        _;
    }

    function init(bytes calldata data) public payable virtual initializer {
        string memory description;
        (name, description) = abi.decode(data, (string, string));

        emit CommitmentInitialized(description);
    }

    function _submitConfirmationWithProof(string memory proofUri) internal {
        emit ProofSubmitted(proofUri, ++nextProofId);
        _submitConfirmation();
    }

    function _submitConfirmation() internal {
        emit ConfirmationSubmitted(msg.sender);
    }

    function _updateStatus(CommitmentStatus newStatus) internal {
        emit StatusChanged(status, newStatus);
        status = newStatus;
    }
}
