// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAccount.sol";
import "../interfaces/IEntryPoint.sol";
import "../interfaces/UserOperation.sol";
import "../core/DefiCityCore.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

/**
 * @title SmartWallet
 * @notice ERC-4337 compliant Smart Wallet with session key support for gasless gameplay
 * @dev Implements ERC-4337 Account Abstraction with single owner authentication,
 *      session keys with spending limits, batch execution, and multi-token support.
 */
contract SmartWallet is
    IAccount,
    IAccountExecute,
    ReentrancyGuard,
    IERC721Receiver,
    IERC1155Receiver
{
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ Constants ============

    /// @notice Estimated ETH price in USD (6 decimals) for session key limits
    /// @dev In production, use Chainlink oracle
    uint256 public constant ETH_PRICE_USD = 2000 * 1e6;

    /// @notice Seconds in a day (for session key time windows)
    uint256 public constant SECONDS_PER_DAY = 1 days;

    /// @notice Minimum session key validity period (1 hour)
    uint256 public constant MIN_SESSION_VALIDITY = 1 hours;

    /// @notice Maximum session key validity period (30 days)
    uint256 public constant MAX_SESSION_VALIDITY = 30 days;

    // ============ State Variables ============

    /// @notice The ERC-4337 EntryPoint contract
    IEntryPoint public immutable entryPoint;

    /// @notice The owner of this wallet (EOA)
    address public owner;

    /// @notice DefiCityCore contract for game bookkeeping
    DefiCityCore public immutable core;

    /// @notice Emergency pause state
    bool public paused;

    /// @notice Session key information with rolling 24-hour window tracking
    struct SessionKeyInfo {
        bool active;              // Is session key active
        uint256 validUntil;       // Expiration timestamp
        uint256 dailyLimit;       // Spending limit per 24-hour window (USD, 6 decimals)
        uint256 windowStart;      // Start of current 24-hour window
        uint256 spentInWindow;    // Amount spent in current window
    }

    /// @notice Session key address → SessionKeyInfo
    mapping(address => SessionKeyInfo) public sessionKeys;

    /// @notice Whitelisted target contracts that session keys can interact with
    mapping(address => bool) public whitelistedTargets;

    /// @notice Daily spending tracking (day => total spent)
    mapping(uint256 => uint256) public dailySpending;

    // ============ Events ============

    event WalletInitialized(address indexed owner, address indexed entryPoint);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ExecutionSuccess(address indexed target, uint256 value, bytes data);
    event ExecutionFailure(address indexed target, uint256 value, bytes data, string reason);
    event DepositAdded(uint256 amount, uint256 newBalance);
    event DepositWithdrawn(address indexed to, uint256 amount);
    event ETHReceived(address indexed from, uint256 amount);

    // Session key events
    event SessionKeyCreated(
        address indexed sessionKey,
        uint256 validUntil,
        uint256 dailyLimit
    );
    event SessionKeyRevoked(address indexed sessionKey);
    event SessionKeyUsed(
        address indexed sessionKey,
        address indexed target,
        uint256 value
    );
    event TargetWhitelisted(address indexed target);
    event TargetRemoved(address indexed target);

    // ============ Errors ============

    error OnlyEntryPoint();
    error OnlyOwner();
    error OnlyEntryPointOrOwner();
    error InvalidOwner();
    error InvalidEntryPoint();
    error ExecutionFailed(string reason);
    error ArrayLengthMismatch();
    error PaymentFailed();

    // Session key errors
    error InvalidSessionKey();
    error SessionKeyExpired();
    error SessionKeyNotActive();
    error DailyLimitExceeded();
    error TargetNotWhitelisted();
    error InvalidCore();
    error InvalidValidityPeriod();

    // Pause errors
    error WalletPaused();
    error WalletNotPaused();

    // ============ Modifiers ============

    /**
     * @notice Ensure caller is the EntryPoint
     * @dev Critical for validateUserOp - only EntryPoint should call it
     */
    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint)) revert OnlyEntryPoint();
        _;
    }

    /**
     * @notice Ensure caller is the wallet owner
     * @dev Used for direct calls from owner (emergency functions)
     */
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    /**
     * @notice Ensure caller is either EntryPoint or owner
     * @dev Used for execute functions - can be called via UserOp or directly
     */
    modifier onlyEntryPointOrOwner() {
        if (msg.sender != address(entryPoint) && msg.sender != owner) {
            revert OnlyEntryPointOrOwner();
        }
        _;
    }

    /**
     * @notice Ensure wallet is not paused
     * @dev Emergency circuit breaker
     */
    modifier whenNotPaused() {
        if (paused) revert WalletPaused();
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the wallet
     * @param _entryPoint Address of the ERC-4337 EntryPoint
     * @param _owner Address of the wallet owner (EOA)
     * @param _core Address of the DefiCityCore contract
     * @dev Called by factory during CREATE2 deployment
     */
    constructor(IEntryPoint _entryPoint, address _owner, DefiCityCore _core) {
        if (address(_entryPoint) == address(0)) revert InvalidEntryPoint();
        if (_owner == address(0)) revert InvalidOwner();
        if (address(_core) == address(0)) revert InvalidCore();

        entryPoint = _entryPoint;
        owner = _owner;
        core = _core;

        emit WalletInitialized(_owner, address(_entryPoint));
    }

    // ============ ERC-4337 Core Functions ============

    /**
     * @notice Validate a UserOperation
     * @param userOp The UserOperation to validate
     * @param userOpHash Hash of the UserOperation (what user signed)
     * @param missingAccountFunds Amount of ETH to send to EntryPoint for gas
     * @return validationData 0 for success, 1 for signature failure
     *
     * @dev This is the heart of ERC-4337 compliance. It:
     *      1. Verifies the signature matches the owner
     *      2. Pays for gas by sending ETH to EntryPoint
     *      3. Returns validation status
     *
     * SECURITY: Only callable by EntryPoint
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override onlyEntryPoint returns (uint256 validationData) {
        // 1. Validate signature
        validationData = _validateSignature(userOp, userOpHash);

        // 2. Pay for gas if needed
        if (missingAccountFunds > 0) {
            // Send ETH from wallet balance to EntryPoint to cover gas
            (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
            if (!success) revert PaymentFailed();
        }

        // 3. Return validation result (0 = success, 1 = failed)
        return validationData;
    }

    /**
     * @notice Validate the signature of a UserOperation
     * @param userOp The UserOperation containing the signature
     * @param userOpHash The hash that was signed
     * @return validationData 0 if signature is valid, 1 if invalid
     * @dev Uses ECDSA signature verification
     */
    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view returns (uint256 validationData) {
        // Convert to Ethereum Signed Message format
        bytes32 hash = userOpHash.toEthSignedMessageHash();

        // Recover signer from signature
        address recovered = hash.recover(userOp.signature);

        // Check if signer is the owner
        if (recovered != owner) {
            return ValidationData.SIG_VALIDATION_FAILED; // Return 1
        }

        return ValidationData.SIG_VALIDATION_SUCCESS; // Return 0
    }

    // ============ Execution Functions ============

    /**
     * @notice Executes a single transaction from the wallet
     * @dev Can be called via UserOp (by EntryPoint) or directly by owner. Protected by pause mechanism.
     * @param dest Target contract address
     * @param value Amount of ETH to send
     * @param func Calldata for the function call
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external override onlyEntryPointOrOwner nonReentrant whenNotPaused {
        _call(dest, value, func);
    }

    /**
     * @notice Executes multiple transactions in a single batch
     * @dev All arrays must have equal length. Reverts if any call fails. Protected by pause mechanism.
     * @param dest Array of target addresses
     * @param value Array of ETH values
     * @param func Array of calldata
     */
    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external override onlyEntryPointOrOwner nonReentrant whenNotPaused {
        if (dest.length != value.length || dest.length != func.length) {
            revert ArrayLengthMismatch();
        }

        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], value[i], func[i]);
        }
    }

    /**
     * @notice Internal function to execute a call
     * @param dest Target address
     * @param value ETH value
     * @param func Calldata
     * @dev Reverts with detailed error if call fails
     */
    function _call(address dest, uint256 value, bytes memory func) internal {
        (bool success, bytes memory result) = dest.call{value: value}(func);

        if (!success) {
            // Extract revert reason if available
            if (result.length > 0) {
                assembly {
                    let returndata_size := mload(result)
                    revert(add(32, result), returndata_size)
                }
            } else {
                revert ExecutionFailed("Call failed without reason");
            }
        }

        emit ExecutionSuccess(dest, value, func);
    }

    // ============ Gas Deposit Management ============

    /**
     * @notice Add ETH deposit to EntryPoint for gas payments
     * @dev Anyone can call this to fund the wallet's gas
     */
    function addDeposit() public payable {
        entryPoint.depositTo{value: msg.value}(address(this));
        emit DepositAdded(msg.value, getDeposit());
    }

    /**
     * @notice Get the wallet's current deposit in EntryPoint
     * @return Current deposit balance in wei
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    /**
     * @notice Withdraw deposit from EntryPoint
     * @param withdrawAddress Address to send the withdrawn ETH
     * @param amount Amount to withdraw
     * @dev Only owner can withdraw. Use this to reclaim unused gas funds.
     */
    function withdrawDepositTo(
        address payable withdrawAddress,
        uint256 amount
    ) public onlyOwner {
        entryPoint.withdrawTo(withdrawAddress, amount);
        emit DepositWithdrawn(withdrawAddress, amount);
    }

    // ============ Owner Management ============

    /**
     * @notice Start ownership transfer to a new address (step 1 of 2)
     * @param newOwner Address of the new owner
     * @dev New owner must call acceptOwnership() to complete the transfer
     *      This two-step process prevents accidentally locking the wallet
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();

        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /**
     * @notice Accept ownership transfer (step 2 of 2)
     * @dev Only the pending owner can call this function
     */
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert OnlyOwner();

        address oldOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);

        emit OwnershipTransferred(oldOwner, owner);
    }

    // ============ Asset Reception ============

    /**
     * @notice Receive ETH
     * @dev Allows the wallet to receive ETH from any source
     */
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    /**
     * @notice Fallback function
     * @dev Called when no other function matches
     */
    fallback() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    /**
     * @notice Handle ERC721 token reception
     * @dev Required to receive NFTs via safeTransferFrom
     */
    function onERC721Received(
        address, /* operator */
        address, /* from */
        uint256, /* tokenId */
        bytes calldata /* data */
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @notice Handle ERC1155 single token reception
     */
    function onERC1155Received(
        address, /* operator */
        address, /* from */
        uint256, /* id */
        uint256, /* value */
        bytes calldata /* data */
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /**
     * @notice Handle ERC1155 batch token reception
     */
    function onERC1155BatchReceived(
        address, /* operator */
        address, /* from */
        uint256[] calldata, /* ids */
        uint256[] calldata, /* values */
        bytes calldata /* data */
    ) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    /**
     * @notice ERC1155 interface support
     */
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return
            interfaceId == type(IERC721Receiver).interfaceId ||
            interfaceId == type(IERC1155Receiver).interfaceId;
    }

    // ============ View Functions ============

    /**
     * @notice Get the next nonce for this wallet
     * @param key Nonce key (0 for sequential mode)
     * @return The next nonce value
     */
    function getNonce(uint192 key) public view returns (uint256) {
        return entryPoint.getNonce(address(this), key);
    }

    /**
     * @notice Get the EntryPoint address
     * @return The EntryPoint contract address
     */
    function getEntryPoint() public view returns (address) {
        return address(entryPoint);
    }

    // ============ Session Key Management ============

    /**
     * @notice Creates a session key for gasless gameplay with spending limits
     * @dev Only owner can create. Validates expiration and enforces min/max validity period.
     * @param sessionKey Address of the session key (typically backend server key)
     * @param validUntil Expiration timestamp
     * @param dailyLimit Spending limit per 24-hour rolling window in USD (6 decimals)
     */
    function createSessionKey(
        address sessionKey,
        uint256 validUntil,
        uint256 dailyLimit
    ) external onlyOwner whenNotPaused {
        if (sessionKey == address(0)) revert InvalidSessionKey();
        if (sessionKey == owner) revert InvalidSessionKey(); // Can't make owner a session key
        if (validUntil <= block.timestamp) revert SessionKeyExpired();

        // Validate validity period
        uint256 validityDuration = validUntil - block.timestamp;
        if (validityDuration < MIN_SESSION_VALIDITY) revert InvalidValidityPeriod();
        if (validityDuration > MAX_SESSION_VALIDITY) revert InvalidValidityPeriod();

        sessionKeys[sessionKey] = SessionKeyInfo({
            active: true,
            validUntil: validUntil,
            dailyLimit: dailyLimit,
            windowStart: block.timestamp,
            spentInWindow: 0
        });

        emit SessionKeyCreated(sessionKey, validUntil, dailyLimit);
    }

    /**
     * @notice Updates an existing active session key's parameters
     * @dev Only owner can update. Validates expiration and enforces min/max validity period.
     * @param sessionKey Address of the session key to update
     * @param validUntil New expiration timestamp
     * @param dailyLimit New spending limit in USD (6 decimals)
     */
    function updateSessionKey(
        address sessionKey,
        uint256 validUntil,
        uint256 dailyLimit
    ) external onlyOwner whenNotPaused {
        SessionKeyInfo storage session = sessionKeys[sessionKey];
        if (!session.active) revert SessionKeyNotActive();
        if (validUntil <= block.timestamp) revert SessionKeyExpired();

        uint256 validityDuration = validUntil - block.timestamp;
        if (validityDuration < MIN_SESSION_VALIDITY) revert InvalidValidityPeriod();
        if (validityDuration > MAX_SESSION_VALIDITY) revert InvalidValidityPeriod();

        session.validUntil = validUntil;
        session.dailyLimit = dailyLimit;

        emit SessionKeyCreated(sessionKey, validUntil, dailyLimit);
    }

    /**
     * @notice Revoke a session key
     * @param sessionKey Address of the session key to revoke
     * @dev Only owner can revoke. Immediate effect.
     */
    function revokeSessionKey(address sessionKey) external onlyOwner {
        sessionKeys[sessionKey].active = false;
        emit SessionKeyRevoked(sessionKey);
    }

    /**
     * @notice Add or remove a whitelisted target contract
     * @param target Contract address to whitelist/remove
     * @param whitelisted True to whitelist, false to remove
     * @dev Only owner can manage whitelist
     *
     * Whitelisted targets typically include:
     * - BuildingManager (for building operations)
     * - DefiCityCore (for bookkeeping)
     * - Aave Pool (for DeFi interactions)
     * - Other game contracts
     */
    function updateWhitelistedTarget(
        address target,
        bool whitelisted
    ) external onlyOwner {
        whitelistedTargets[target] = whitelisted;

        if (whitelisted) {
            emit TargetWhitelisted(target);
        } else {
            emit TargetRemoved(target);
        }
    }

    /**
     * @notice Executes batch transactions using session key authentication from game server
     * @dev Validates session key, checks rolling window spending limit, and verifies whitelisted targets.
     *      Enables gasless gameplay by allowing backend to execute on behalf of user.
     * @param targets Array of target contract addresses
     * @param values Array of ETH values
     * @param datas Array of calldata
     */
    function executeFromGame(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external nonReentrant whenNotPaused {
        // 1. Validate session key
        SessionKeyInfo storage session = sessionKeys[msg.sender];
        if (!session.active) revert SessionKeyNotActive();
        if (block.timestamp > session.validUntil) revert SessionKeyExpired();

        // 2. Check if we need to start a new 24-hour window
        if (block.timestamp >= session.windowStart + SECONDS_PER_DAY) {
            // Start new window
            session.windowStart = block.timestamp;
            session.spentInWindow = 0;
        }

        // 3. Validate array lengths
        if (targets.length != values.length || targets.length != datas.length) {
            revert ArrayLengthMismatch();
        }

        // 4. Calculate total value and check targets
        uint256 totalValue = 0;
        for (uint256 i = 0; i < targets.length; i++) {
            // Check target is whitelisted
            if (!whitelistedTargets[targets[i]]) {
                revert TargetNotWhitelisted();
            }

            // Estimate USD value (simplified - in production use oracle)
            totalValue += _estimateValue(targets[i], values[i], datas[i]);
        }

        // 5. Check window limit
        if (session.spentInWindow + totalValue > session.dailyLimit) {
            revert DailyLimitExceeded();
        }

        // 6. Update spending
        session.spentInWindow += totalValue;

        // 7. Execute batch
        for (uint256 i = 0; i < targets.length; i++) {
            _call(targets[i], values[i], datas[i]);
            emit SessionKeyUsed(msg.sender, targets[i], values[i]);
        }
    }

    /**
     * @notice Estimates USD value of a transaction for spending limit tracking
     * @dev Simplified estimation using constant ETH price. Production should use Chainlink oracles.
     * @param target Target contract
     * @param value ETH value
     * @param data Calldata
     * @return Estimated USD value (6 decimals)
     */
    function _estimateValue(
        address target,
        uint256 value,
        bytes memory data
    ) internal pure returns (uint256) {
        // ETH value (using constant)
        uint256 ethValue = (value * ETH_PRICE_USD) / 1e18;

        // If calling ERC20 transfer/approve, try to parse amount
        // This is a simplified version - production should use oracles
        if (data.length >= 68) {
            bytes4 selector = bytes4(data);
            // transfer(address,uint256) or approve(address,uint256)
            if (selector == 0xa9059cbb || selector == 0x095ea7b3) {
                // Parse amount from calldata (second parameter)
                uint256 amount;
                assembly {
                    amount := mload(add(data, 68))
                }
                // Assume USDC/USDT (6 decimals) for simplicity
                return ethValue + amount;
            }
        }

        return ethValue;
    }

    // ============ Emergency Functions ============

    /**
     * @notice Emergency pause to disable all execute and session key operations
     * @dev Only owner can pause. Owner can still transfer ownership and unpause when paused.
     */
    function pause() external onlyOwner {
        if (paused) revert WalletPaused();
        paused = true;
    }

    /**
     * @notice Unpause the wallet
     * @dev Only owner can unpause
     */
    function unpause() external onlyOwner {
        if (!paused) revert WalletNotPaused();
        paused = false;
    }

    /**
     * @notice Emergency function to recover stuck tokens
     * @param token Token address (address(0) for ETH)
     * @param to Recipient address
     * @param amount Amount to transfer
     * @dev Only callable by owner. Use with caution.
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidOwner();

        if (token == address(0)) {
            // Withdraw ETH
            (bool success,) = payable(to).call{value: amount}("");
            if (!success) revert ExecutionFailed("ETH transfer failed");
        } else {
            // Withdraw ERC20
            (bool success, bytes memory result) = token.call(
                abi.encodeWithSignature("transfer(address,uint256)", to, amount)
            );
            if (!success || (result.length > 0 && !abi.decode(result, (bool)))) {
                revert ExecutionFailed("Token transfer failed");
            }
        }

        emit ExecutionSuccess(token, amount, "");
    }
}
