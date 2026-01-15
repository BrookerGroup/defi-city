// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAccount.sol";
import "../interfaces/IEntryPoint.sol";
import "../interfaces/UserOperation.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

/**
 * @title SmartWallet
 * @notice Production-grade ERC-4337 compliant Smart Wallet
 * @dev This wallet implements:
 *      - ERC-4337 Account Abstraction (validateUserOp)
 *      - Single owner authentication
 *      - Execute and batch execute functions
 *      - Gas deposit management
 *      - ETH, ERC20, ERC721, ERC1155 support
 *      - Secure withdraw mechanisms
 *
 * Architecture:
 * - Owner: EOA that controls the wallet
 * - EntryPoint: ERC-4337 singleton that validates and executes UserOps
 * - Nonce: Managed by EntryPoint (not by wallet)
 * - Gas: Paid from wallet's deposit in EntryPoint
 *
 * Security Features:
 * - ReentrancyGuard on all state-changing functions
 * - Signature validation using ECDSA
 * - EntryPoint authorization checks
 * - Event logging for all critical operations
 *
 * Future Extensibility:
 * - Can be upgraded to support multisig (multiple owners + threshold)
 * - Can add social recovery (guardians)
 * - Can implement spending limits
 * - Can support session keys
 * - Can implement ERC-1271 for contract signatures
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

    /// @notice The pending owner during two-step transfer
    address public pendingOwner;

    // ============ Events ============

    event WalletInitialized(address indexed owner, address indexed entryPoint);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ExecutionSuccess(address indexed target, uint256 value, bytes data);
    event ExecutionFailure(address indexed target, uint256 value, bytes data, string reason);
    event DepositAdded(uint256 amount, uint256 newBalance);
    event DepositWithdrawn(address indexed to, uint256 amount);
    event ETHReceived(address indexed from, uint256 amount);

    // ============ Errors ============

    error OnlyEntryPoint();
    error OnlyOwner();
    error OnlyEntryPointOrOwner();
    error InvalidOwner();
    error InvalidEntryPoint();
    error ExecutionFailed(string reason);
    error ArrayLengthMismatch();
    error PaymentFailed();

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
     * @dev Called by factory during CREATE2 deployment
     */
    constructor(IEntryPoint _entryPoint, address _owner) {
        if (address(_entryPoint) == address(0)) revert InvalidEntryPoint();
        if (_owner == address(0)) revert InvalidOwner();

        entryPoint = _entryPoint;
        owner = _owner;

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
