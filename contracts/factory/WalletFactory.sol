// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../wallet/SmartWallet.sol";
import "../interfaces/IEntryPoint.sol";

/**
 * @title WalletFactory
 * @notice Factory contract for deploying SmartWallet contracts using CREATE2
 * @dev This factory:
 *      - Deploys wallets deterministically (same owner + salt = same address)
 *      - Allows counterfactual wallet addresses (know address before deployment)
 *      - Prevents duplicate deployments
 *      - Maintains a registry of deployed wallets
 *
 * CREATE2 Benefits:
 * - Deterministic addresses: getAddress(owner, salt) returns the same address always
 * - Users can receive funds before wallet is deployed
 * - First UserOp can deploy + execute in one transaction
 * - No need to deploy upfront (gas savings)
 *
 * Architecture:
 * - Uses CREATE2 opcode for deterministic deployment
 * - Salt allows multiple wallets per owner
 * - Registry pattern for easy lookup
 * - Can be used in UserOp.initCode for counterfactual deployment
 *
 * Gas Optimization:
 * - Checks if wallet exists before deploying (saves gas on re-deployments)
 * - Uses immutable EntryPoint for gas savings
 * - Efficient address computation
 */
contract WalletFactory {
    // ============ State Variables ============

    /// @notice The ERC-4337 EntryPoint contract
    IEntryPoint public immutable entryPoint;

    /// @notice Mapping from owner address to their wallet address (for salt=0)
    mapping(address => address) public walletsByOwner;

    /// @notice Mapping to check if an address is a wallet deployed by this factory
    mapping(address => bool) public isWallet;

    /// @notice Total number of wallets deployed
    uint256 public totalWallets;

    // ============ Events ============

    event WalletCreated(
        address indexed wallet,
        address indexed owner,
        uint256 salt,
        uint256 walletNumber
    );

    // ============ Errors ============

    error InvalidOwner();
    error InvalidEntryPoint();
    error WalletAlreadyExists();

    // ============ Constructor ============

    /**
     * @notice Initialize the factory
     * @param _entryPoint Address of the ERC-4337 EntryPoint
     * @dev EntryPoint address is immutable and shared across all wallets
     */
    constructor(IEntryPoint _entryPoint) {
        if (address(_entryPoint) == address(0)) revert InvalidEntryPoint();
        entryPoint = _entryPoint;
    }

    // ============ Factory Functions ============

    /**
     * @notice Create a new SmartWallet using CREATE2
     * @param owner Address of the wallet owner
     * @param salt Salt for CREATE2 (use 0 for default wallet)
     * @return wallet Address of the deployed wallet
     *
     * @dev This function:
     *      1. Computes the deterministic address
     *      2. Checks if wallet already exists at that address
     *      3. If not, deploys using CREATE2
     *      4. Updates registry
     *
     * Usage:
     * - Direct call: factory.createWallet(owner, 0)
     * - Via UserOp initCode: factory + abi.encode(createWallet(owner, 0))
     *
     * Salt Strategy:
     * - salt = 0: Default wallet for owner (one per owner)
     * - salt > 0: Additional wallets (owner can have multiple)
     */
    function createWallet(address owner, uint256 salt) external virtual returns (SmartWallet wallet) {
        if (owner == address(0)) revert InvalidOwner();

        // 1. Compute deterministic address
        address walletAddress = getAddress(owner, salt);

        // 2. Check if wallet already exists
        uint256 codeSize = walletAddress.code.length;
        if (codeSize > 0) {
            // Wallet already deployed, return existing instance
            return SmartWallet(payable(walletAddress));
        }

        // 3. Deploy wallet using CREATE2
        wallet = new SmartWallet{salt: bytes32(salt)}(entryPoint, owner);

        // 4. Update registry
        if (salt == 0) {
            // Register as default wallet for owner
            walletsByOwner[owner] = address(wallet);
        }
        isWallet[address(wallet)] = true;
        totalWallets++;

        emit WalletCreated(address(wallet), owner, salt, totalWallets);

        return wallet;
    }

    /**
     * @notice Get the deterministic address for a wallet
     * @param owner Address of the wallet owner
     * @param salt Salt for CREATE2
     * @return Address where the wallet will be (or is) deployed
     *
     * @dev This allows users to know their wallet address BEFORE deployment.
     *      They can receive funds at this address even if wallet doesn't exist yet.
     *
     * CREATE2 address formula:
     * address = keccak256(0xff ++ factory ++ salt ++ keccak256(initCode))[12:]
     *
     * Where initCode = creationCode + constructor arguments
     */
    function getAddress(address owner, uint256 salt) public view returns (address) {
        // Compute the initCode hash
        bytes32 initCodeHash = keccak256(
            abi.encodePacked(
                type(SmartWallet).creationCode,
                abi.encode(entryPoint, owner)
            )
        );

        // Compute CREATE2 address
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                bytes32(salt),
                initCodeHash
            )
        );

        return address(uint160(uint256(hash)));
    }

    /**
     * @notice Check if a wallet exists at the computed address
     * @param owner Address of the wallet owner
     * @param salt Salt used for CREATE2
     * @return True if wallet is deployed, false otherwise
     */
    function isWalletDeployed(address owner, uint256 salt) external view returns (bool) {
        address walletAddress = getAddress(owner, salt);
        return walletAddress.code.length > 0;
    }

    /**
     * @notice Get the default wallet address for an owner
     * @param owner Address of the wallet owner
     * @return Wallet address (or address(0) if not deployed)
     * @dev This returns the wallet created with salt=0
     */
    function getWalletByOwner(address owner) external view returns (address) {
        return walletsByOwner[owner];
    }

    /**
     * @notice Create or get wallet for an owner (convenience function)
     * @param owner Address of the wallet owner
     * @return wallet The wallet address (deployed if needed)
     * @dev This is the recommended function for frontend integration.
     *      It will deploy if needed, or return existing wallet.
     */
    function createOrGetWallet(address owner) external returns (SmartWallet wallet) {
        address existing = walletsByOwner[owner];

        if (existing != address(0)) {
            // Wallet already exists
            return SmartWallet(payable(existing));
        }

        // Create new wallet with salt=0
        return this.createWallet(owner, 0);
    }

    // ============ View Functions ============

    /**
     * @notice Get the EntryPoint address used by all wallets
     * @return The EntryPoint contract address
     */
    function getEntryPoint() external view returns (address) {
        return address(entryPoint);
    }

    /**
     * @notice Check if an address is a wallet deployed by this factory
     * @param wallet Address to check
     * @return True if it's a wallet from this factory
     */
    function isFactoryWallet(address wallet) external view returns (bool) {
        return isWallet[wallet];
    }

    /**
     * @notice Get total number of wallets deployed
     * @return Total wallet count
     */
    function getTotalWallets() external view returns (uint256) {
        return totalWallets;
    }

    // ============ Advanced Functions ============

    /**
     * @notice Batch create multiple wallets
     * @param owners Array of owner addresses
     * @param salts Array of salts (must match owners length)
     * @return wallets Array of deployed wallet addresses
     * @dev Useful for onboarding multiple users at once
     */
    function createWalletsBatch(
        address[] calldata owners,
        uint256[] calldata salts
    ) external returns (SmartWallet[] memory wallets) {
        require(owners.length == salts.length, "Length mismatch");

        wallets = new SmartWallet[](owners.length);

        for (uint256 i = 0; i < owners.length; i++) {
            wallets[i] = this.createWallet(owners[i], salts[i]);
        }

        return wallets;
    }

    /**
     * @notice Compute multiple wallet addresses at once
     * @param owners Array of owner addresses
     * @param salts Array of salts
     * @return addresses Array of computed wallet addresses
     * @dev Useful for frontend to compute multiple addresses efficiently
     */
    function getAddressesBatch(
        address[] calldata owners,
        uint256[] calldata salts
    ) external view returns (address[] memory addresses) {
        require(owners.length == salts.length, "Length mismatch");

        addresses = new address[](owners.length);

        for (uint256 i = 0; i < owners.length; i++) {
            addresses[i] = getAddress(owners[i], salts[i]);
        }

        return addresses;
    }
}

/*
 * WalletFactoryV2 - Advanced version with fees and whitelist
 * Commented out for now to simplify deployment
 * See full implementation in git history if needed
 */
