// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../types.sol";

interface ICommitment {
    event ConfirmationSubmitted(address from);
    event ProofSubmitted(string uri, uint proofId);
    event ConfirmationRevoked(string uri, uint proofId);

    function init(bytes calldata) external payable;

    function status() external view returns (CommitmentStatus);

    function name() external view returns (string memory);
}

interface ICommitmentConfirmationSubmitter is ICommitment {
    function submitConfirmation() external;
}

interface ICommitmentProofSubmitter {
    function submitConfirmationWithProof(string memory) external;
}
