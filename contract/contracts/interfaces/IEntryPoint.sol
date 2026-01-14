// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./UserOperation.sol";

/**
 * @title IEntryPoint
 * @notice Interface for the ERC-4337 EntryPoint contract
 * @dev This is the canonical EntryPoint interface deployed at:
 *      0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789 (on most EVM chains)
 *
 * The EntryPoint is a singleton contract that:
 * - Validates and executes UserOperations
 * - Manages gas payments and refunds
 * - Handles nonce management for replay protection
 * - Coordinates between wallets, bundlers, and paymasters
 */
interface IEntryPoint {
    /**
     * @notice Execute a batch of UserOperations
     * @param ops Array of UserOperations to execute
     * @param beneficiary Address to receive the gas payment surplus
     * @dev Called by bundler to submit UserOps. Each UserOp is:
     *      1. Validated (wallet deployed if needed)
     *      2. Executed (if validation succeeds)
     *      3. Gas fees are collected and bundler is refunded
     */
    function handleOps(UserOperation[] calldata ops, address payable beneficiary) external;

    /**
     * @notice Execute a batch of UserOperations with an aggregated signature
     * @param opsPerAggregator Array of UserOps grouped by aggregator
     * @param beneficiary Address to receive the gas payment surplus
     * @dev Used for signature aggregation (BLS, etc.) to save gas
     */
    function handleAggregatedOps(
        UserOpsPerAggregator[] calldata opsPerAggregator,
        address payable beneficiary
    ) external;

    /**
     * @notice Compute the hash of a UserOperation
     * @param userOp The UserOperation to hash
     * @return Hash that should be signed by the wallet owner
     * @dev This hash is what the user signs. It includes chainId to prevent cross-chain replays
     */
    function getUserOpHash(UserOperation calldata userOp) external view returns (bytes32);

    /**
     * @notice Deposit ETH for a wallet to pay for gas
     * @param account The wallet address to deposit for
     * @dev Anyone can deposit for any wallet. The wallet uses this to pay gas fees.
     *      The wallet must have sufficient deposit before executing UserOps.
     */
    function depositTo(address account) external payable;

    /**
     * @notice Get the deposit balance for a wallet
     * @param account The wallet address to query
     * @return The current deposit balance in wei
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @notice Withdraw deposit to a specific address
     * @param withdrawAddress Address to send the withdrawn ETH
     * @param withdrawAmount Amount to withdraw in wei
     * @dev Only the wallet itself can withdraw its deposit
     */
    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external;

    /**
     * @notice Get the nonce for a wallet (with key support)
     * @param sender The wallet address
     * @param key The nonce key (default is 0 for sequential nonces)
     * @return The current nonce
     * @dev Nonces prevent replay attacks. Format: (key << 64) | sequence
     *      - Sequential mode (key=0): nonces must be used in order (0,1,2,...)
     *      - Parallel mode (key>0): different keys allow parallel nonces
     */
    function getNonce(address sender, uint192 key) external view returns (uint256);

    /**
     * @notice Emitted when a UserOperation is executed successfully
     * @param userOpHash Hash of the UserOperation
     * @param sender The wallet that executed the operation
     * @param paymaster The paymaster that sponsored gas (or address(0))
     * @param nonce The nonce used
     * @param success Whether the inner execution succeeded
     * @param actualGasCost Actual gas cost paid
     * @param actualGasUsed Actual gas used
     */
    event UserOperationEvent(
        bytes32 indexed userOpHash,
        address indexed sender,
        address indexed paymaster,
        uint256 nonce,
        bool success,
        uint256 actualGasCost,
        uint256 actualGasUsed
    );

    /**
     * @notice Emitted when a wallet's deposit changes
     * @param account The wallet address
     * @param totalDeposit The new total deposit
     */
    event Deposited(address indexed account, uint256 totalDeposit);

    /**
     * @notice Emitted when a wallet withdraws deposit
     * @param account The wallet address
     * @param withdrawAddress The address that received the withdrawal
     * @param amount The amount withdrawn
     */
    event Withdrawn(address indexed account, address withdrawAddress, uint256 amount);

    /**
     * @notice Error thrown when a UserOperation validation fails
     * @param opIndex Index of the failed operation in the batch
     * @param reason Human-readable failure reason
     */
    error FailedOp(uint256 opIndex, string reason);

    /**
     * @notice Error thrown when signature aggregation fails
     * @param aggregator The aggregator that failed validation
     */
    error SignatureValidationFailed(address aggregator);
}

/**
 * @notice Structure for aggregated UserOperations
 * @dev Used by handleAggregatedOps for signature aggregation schemes
 */
struct UserOpsPerAggregator {
    UserOperation[] userOps;
    address aggregator;
    bytes signature;
}

/**
 * @title IStakeManager
 * @notice Stake management interface (part of EntryPoint)
 * @dev Factories and Paymasters can stake ETH to build reputation
 *      and be allowed to execute UserOps without simulation
 */
interface IStakeManager {
    /**
     * @notice Add stake for the calling entity
     * @param unstakeDelaySec Time in seconds before stake can be withdrawn
     */
    function addStake(uint32 unstakeDelaySec) external payable;

    /**
     * @notice Unlock stake (start the withdrawal delay)
     */
    function unlockStake() external;

    /**
     * @notice Withdraw stake after the delay has passed
     * @param withdrawAddress Address to send the stake to
     */
    function withdrawStake(address payable withdrawAddress) external;

    /**
     * @notice Get stake info for an entity
     * @param account The entity address (factory or paymaster)
     * @return info Stake information
     */
    function getDepositInfo(address account) external view returns (DepositInfo memory info);

    struct DepositInfo {
        uint112 deposit;
        bool staked;
        uint112 stake;
        uint32 unstakeDelaySec;
        uint48 withdrawTime;
    }
}
