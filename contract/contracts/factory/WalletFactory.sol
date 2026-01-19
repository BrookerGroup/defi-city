// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../wallet/SmartWallet.sol";
import "../interfaces/IEntryPoint.sol";
import "../core/DefiCityCore.sol";

/**
 * @title WalletFactory
 * @notice Factory for deterministic SmartWallet deployment using CREATE2
 * @dev Deploys wallets with deterministic addresses and maintains registry.
 *      Supports counterfactual addresses and prevents duplicate deployments.
 */
contract WalletFactory {
    // ============ State Variables ============

    /// @notice The ERC-4337 EntryPoint contract
    IEntryPoint public immutable entryPoint;

    /// @notice DefiCityCore contract for game bookkeeping
    DefiCityCore public immutable core;

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
    error ArrayLengthMismatch();

    // ============ Constructor ============

    /**
     * @notice Initialize the factory
     * @param _entryPoint Address of the ERC-4337 EntryPoint
     * @param _core Address of the DefiCityCore contract
     * @dev EntryPoint and Core addresses are immutable and shared across all wallets
     */
    constructor(IEntryPoint _entryPoint, DefiCityCore _core) {
        if (address(_entryPoint) == address(0)) revert InvalidEntryPoint();
        if (address(_core) == address(0)) revert InvalidOwner();  // Reuse error for invalid core
        entryPoint = _entryPoint;
        core = _core;
    }

    // ============ Factory Functions ============

    /**
     * @notice Creates a new SmartWallet using CREATE2 deterministic deployment
     * @dev Computes address, checks existence, deploys if needed, and registers in Core.
     *      Salt 0 = default wallet, salt > 0 = additional wallets.
     * @param owner Address of the wallet owner
     * @param salt Salt for CREATE2 (use 0 for default wallet)
     * @return wallet Address of the deployed wallet
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
        wallet = new SmartWallet{salt: bytes32(salt)}(entryPoint, owner, core);

        // 4. Register wallet in DefiCityCore
        core.registerWallet(owner, address(wallet));

        // 5. Update local registry
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
     * @notice Computes the deterministic wallet address for given owner and salt
     * @dev Enables counterfactual addresses - users can know their wallet address before deployment.
     * @param owner Address of the wallet owner
     * @param salt Salt for CREATE2
     * @return Address where the wallet will be (or is) deployed
     */
    function getAddress(address owner, uint256 salt) public view returns (address) {
        // Compute the initCode hash
        bytes32 initCodeHash = keccak256(
            abi.encodePacked(
                type(SmartWallet).creationCode,
                abi.encode(entryPoint, owner, core)
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
        if (owners.length != salts.length) revert ArrayLengthMismatch();

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
        if (owners.length != salts.length) revert ArrayLengthMismatch();

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
