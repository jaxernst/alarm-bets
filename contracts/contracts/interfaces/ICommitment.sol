// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../types.sol";

interface ICommitment {
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
