// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IEntryPoint.sol";

/**
 * @title MockEntryPoint
 * @notice Simplified EntryPoint for testing
 * @dev This mock implements only the functions needed for testing
 */
contract MockEntryPoint is IEntryPoint {
    // Nonce management
    mapping(address => mapping(uint192 => uint256)) public nonceSequenceNumber;

    // Deposits
    mapping(address => uint256) private deposits;

    function handleOps(
        UserOperation[] calldata,
        address payable
    ) external override {}

    function handleAggregatedOps(
        UserOpsPerAggregator[] calldata,
        address payable
    ) external override {}

    function getNonce(
        address sender,
        uint192 key
    ) external view override returns (uint256 nonce) {
        return nonceSequenceNumber[sender][key];
    }

    function balanceOf(address account) external view override returns (uint256) {
        return deposits[account];
    }

    function depositTo(address account) external payable override {
        deposits[account] += msg.value;
    }

    function withdrawTo(
        address payable withdrawAddress,
        uint256 withdrawAmount
    ) external override {
        require(deposits[msg.sender] >= withdrawAmount, "Insufficient deposit");
        deposits[msg.sender] -= withdrawAmount;
        (bool success,) = withdrawAddress.call{value: withdrawAmount}("");
        require(success, "Withdraw failed");
    }

    function getUserOpHash(
        UserOperation calldata
    ) external pure override returns (bytes32) {
        return bytes32(0);
    }

    // Helper for tests
    function incrementNonce(address sender, uint192 key) external {
        nonceSequenceNumber[sender][key]++;
    }

    receive() external payable {
        deposits[msg.sender] += msg.value;
    }
}
