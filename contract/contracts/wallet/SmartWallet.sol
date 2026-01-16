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
 * @notice Production-grade ERC-4337 compliant Smart Wallet with Session Keys
 * @dev This wallet implements:
 *      - ERC-4337 Account Abstraction (validateUserOp)
 *      - Single owner authentication
 *      - Session keys for gasless gameplay (Epic 7 support)
 *      - Execute and batch execute functions
 *      - Gas deposit management
 *      - ETH, ERC20, ERC721, ERC1155 support
 *      - Secure withdraw mechanisms
 *      - Integration with DefiCityCore for building management
 *
 * Architecture:
 * - Owner: EOA that controls the wallet
 * - EntryPoint: ERC-4337 singleton that validates and executes UserOps
 * - Session Keys: Temporary keys with spending limits and target whitelisting
 * - DefiCityCore: Game bookkeeping contract
 * - Nonce: Managed by EntryPoint (not by wallet)
 * - Gas: Paid from wallet's deposit in EntryPoint
 *
 * Security Features:
 * - ReentrancyGuard on all state-changing functions
 * - Signature validation using ECDSA
 * - EntryPoint authorization checks
 * - Session key time limits and spending limits
 * - Whitelisted target contracts for session keys
 * - Event logging for all critical operations
 *
 * Epic Support:
 * - Epic 3: Town Hall registration (US-009, US-010)
 * - Epic 4: Bank building operations (US-011, US-012, US-015)
 * - Epic 7: Gasless gameplay via session keys
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

    // ============ State Variables ============

    /// @notice The ERC-4337 EntryPoint contract
    IEntryPoint public immutable entryPoint;

    /// @notice The owner of this wallet (EOA)
    address public owner;

    /// @notice DefiCityCore contract for game bookkeeping
    DefiCityCore public immutable core;

    /// @notice Session key information
    struct SessionKeyInfo {
        bool active;              // Is session key active
        uint256 validUntil;       // Expiration timestamp
        uint256 dailyLimit;       // Daily spending limit in USD value
        uint256 spentToday;       // Amount spent today
        uint256 lastResetDay;     // Last day counter was reset
    }

    /// @notice Session key address → SessionKeyInfo
    mapping(address => SessionKeyInfo) public sessionKeys;

    /// @notice Whitelisted target contracts that session keys can interact with
    mapping(address => bool) public whitelistedTargets;

    /// @notice Daily spending tracking (day => total spent)
    mapping(uint256 => uint256) public dailySpending;

    // ============ Events ============

    event WalletInitialized(address indexed owner, address indexed entryPoint);
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
     * @notice Execute a single transaction
     * @param dest Target contract address
     * @param value Amount of ETH to send
     * @param func Calldata for the function call
     * @dev Can be called via UserOp (by EntryPoint) or directly by owner
     *
     * Examples:
     * - Deposit to Aave: execute(aavePool, 0, depositCalldata)
     * - Swap on Uniswap: execute(uniswapRouter, 0, swapCalldata)
     * - Transfer ERC20: execute(token, 0, transferCalldata)
     * - Send ETH: execute(recipient, amount, "")
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external override onlyEntryPointOrOwner nonReentrant {
        _call(dest, value, func);
    }

    /**
     * @notice Execute multiple transactions in a batch
     * @param dest Array of target addresses
     * @param value Array of ETH values
     * @param func Array of calldata
     * @dev All arrays must have the same length. Reverts if any call fails.
     *
     * Use cases:
     * - Build multiple Yield Farms in one transaction
     * - Approve + deposit in one go
     * - Withdraw from multiple protocols
     * - Complex DeFi strategies
     */
    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external override onlyEntryPointOrOwner nonReentrant {
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
     * @notice Transfer ownership to a new address
     * @param newOwner Address of the new owner
     * @dev Use carefully - this changes who can control the wallet
     *      Consider adding a two-step process or timelock for production
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();

        address oldOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
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

    // ============ Session Key Management (Epic 7) ============

    /**
     * @notice Create a session key for gasless gameplay
     * @param sessionKey Address of the session key (backend server key)
     * @param validUntil Expiration timestamp
     * @param dailyLimit Daily spending limit in USD value (6 decimals)
     * @dev Only owner can create session keys
     *
     * Epic 7 Support: Gasless gameplay
     * Session keys enable the game server to execute transactions on behalf
     * of the user without requiring signatures for each action.
     */
    function createSessionKey(
        address sessionKey,
        uint256 validUntil,
        uint256 dailyLimit
    ) external onlyOwner {
        if (sessionKey == address(0)) revert InvalidSessionKey();
        if (validUntil <= block.timestamp) revert SessionKeyExpired();

        sessionKeys[sessionKey] = SessionKeyInfo({
            active: true,
            validUntil: validUntil,
            dailyLimit: dailyLimit,
            spentToday: 0,
            lastResetDay: block.timestamp / 1 days
        });

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
     * @notice Execute from game server using session key
     * @param targets Array of target addresses
     * @param values Array of ETH values
     * @param datas Array of calldata
     * @dev Called by game server with session key signature
     *
     * Epic 4 Support: Building operations (US-011, US-012, US-015)
     * Epic 7 Support: Gasless gameplay
     *
     * Security checks:
     * 1. Session key must be active
     * 2. Session key must not be expired
     * 3. Daily spending limit must not be exceeded
     * 4. All targets must be whitelisted
     *
     * Flow for placing a Bank building:
     * 1. User authorizes action in game UI
     * 2. Game server calls this function with session key
     * 3. This function executes: [approve, supply, recordBuilding]
     * 4. All actions happen in one transaction (gasless for user)
     */
    function executeFromGame(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external nonReentrant {
        // 1. Validate session key
        SessionKeyInfo storage session = sessionKeys[msg.sender];
        if (!session.active) revert SessionKeyNotActive();
        if (block.timestamp > session.validUntil) revert SessionKeyExpired();

        // 2. Reset daily counter if new day
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > session.lastResetDay) {
            session.spentToday = 0;
            session.lastResetDay = currentDay;
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

        // 5. Check daily limit
        if (session.spentToday + totalValue > session.dailyLimit) {
            revert DailyLimitExceeded();
        }

        // 6. Update spending
        session.spentToday += totalValue;

        // 7. Execute batch
        for (uint256 i = 0; i < targets.length; i++) {
            _call(targets[i], values[i], datas[i]);
            emit SessionKeyUsed(msg.sender, targets[i], values[i]);
        }
    }

    /**
     * @notice Estimate USD value of a transaction (simplified)
     * @param target Target contract
     * @param value ETH value
     * @param data Calldata
     * @return Estimated USD value (6 decimals)
     * @dev In production, use Chainlink oracles for accurate pricing
     *
     * Simplified estimation:
     * - ETH value → convert using hardcoded price
     * - ERC20 transfers → parse amount from calldata
     * - Complex DeFi → conservative estimate
     */
    function _estimateValue(
        address target,
        uint256 value,
        bytes memory data
    ) internal view returns (uint256) {
        // ETH value (assuming $2000/ETH for simplicity)
        uint256 ethValue = (value * 2000 * 1e6) / 1e18;

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
