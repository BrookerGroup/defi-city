// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./UserOperation.sol";

/**
 * @title IAccount
 * @notice Interface that ERC-4337 wallets must implement
 * @dev This is the core interface for Account Abstraction wallets.
 *      All smart wallets must implement validateUserOp() to be ERC-4337 compliant.
 *
 * The wallet contract is responsible for:
 * 1. Validating the UserOperation (signature, nonce, etc.)
 * 2. Paying for gas (if not using a paymaster)
 * 3. Executing the operation (via execute or executeBatch)
 */
interface IAccount {
    /**
     * @notice Validate a UserOperation
     * @param userOp The UserOperation to validate
     * @param userOpHash Hash of the UserOperation (for signature verification)
     * @param missingAccountFunds Amount of ETH the wallet needs to send to EntryPoint
     * @return validationData Validation result (0 = success, 1 = sig failed, or packed time range)
     *
     * @dev This function is called by EntryPoint during the validation phase.
     *
     * CRITICAL SECURITY:
     * - This function MUST ONLY be callable by EntryPoint
     * - Use: require(msg.sender == address(entryPoint), "only EntryPoint");
     *
     * Responsibilities:
     * 1. Verify the signature in userOp.signature
     *    - Check that the signer is authorized (owner, guardian, session key, etc.)
     *    - Use ECDSA.recover() or ERC-1271 for signature verification
     *
     * 2. Pay for gas if needed
     *    - If missingAccountFunds > 0, send ETH to EntryPoint:
     *      (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
     *    - This ETH comes from the wallet's balance (not the deposit in EntryPoint)
     *    - The wallet must have sufficient ETH balance
     *
     * 3. Return validation result
     *    - 0: Signature valid, no time restrictions
     *    - 1: Signature validation failed (SIG_VALIDATION_FAILED)
     *    - Packed value: Include time range or authorizer address
     *
     * Return value format:
     * ┌─────────────────┬─────────────────┬──────────────────────┐
     * │ validAfter      │ validUntil      │ authorizer           │
     * │ (6 bytes)       │ (6 bytes)       │ (20 bytes)           │
     * │ timestamp       │ timestamp       │ address or 0         │
     * └─────────────────┴─────────────────┴──────────────────────┘
     *
     * Examples:
     * - return 0;  // Valid indefinitely
     * - return 1;  // Signature failed
     * - return uint256(validUntil) << 160 | uint256(validAfter) << 208;
     *
     * Gas Considerations:
     * - verificationGasLimit determines gas available for this function
     * - Keep this function gas-efficient (avoid loops, external calls)
     * - Failed validation should revert with clear error message
     *
     * Nonce Management:
     * - Nonce is managed by EntryPoint, not the wallet
     * - EntryPoint checks and increments nonce automatically
     * - Wallet doesn't need to track nonces
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
}

/**
 * @title IAccountExecute
 * @notice Optional interface for wallets that support execute functions
 * @dev While not strictly required by ERC-4337, most wallets implement
 *      execute() and executeBatch() for flexibility
 */
interface IAccountExecute {
    /**
     * @notice Execute a single transaction
     * @param dest Target contract address
     * @param value ETH value to send
     * @param func Calldata for the function call
     * @dev Should be callable by EntryPoint (via UserOp) or owner (directly)
     */
    function execute(address dest, uint256 value, bytes calldata func) external;

    /**
     * @notice Execute multiple transactions in one call
     * @param dest Array of target addresses
     * @param value Array of ETH values
     * @param func Array of calldata
     * @dev All arrays must have same length. Fails if any call reverts.
     */
    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external;
}

/**
 * @title IAccountInitialize
 * @notice Interface for wallet initialization after deployment
 * @dev Used by factories to initialize wallets after CREATE2 deployment
 */
interface IAccountInitialize {
    /**
     * @notice Initialize the wallet with owner and configuration
     * @param anOwner The initial owner address
     * @dev Called by factory immediately after deployment
     *      Should be idempotent or protected against re-initialization
     */
    function initialize(address anOwner) external;
}
