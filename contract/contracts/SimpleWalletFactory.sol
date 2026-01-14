// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SimpleSmartWallet.sol";

/**
 * @title SimpleWalletFactory
 * @notice Factory for deploying SimpleSmartWallet contracts
 * @dev One wallet per owner (mapped by address)
 *
 * Usage:
 * 1. Call createWallet(ownerAddress) to deploy a new wallet
 * 2. Get wallet address via getWallet(ownerAddress)
 */
contract SimpleWalletFactory {
    // ============ State Variables ============

    /// @notice Mapping from owner address to wallet address
    mapping(address => address) public wallets;

    /// @notice Total number of wallets created
    uint256 public totalWallets;

    // ============ Events ============

    event WalletCreated(
        address indexed owner,
        address indexed wallet,
        uint256 walletNumber
    );

    // ============ Errors ============

    error InvalidOwner();
    error WalletAlreadyExists();

    // ============ Main Functions ============

    /**
     * @notice Create a new smart wallet for an owner
     * @param owner Address of the wallet owner
     * @return wallet Address of the created wallet
     *
     * @dev One wallet per owner. Reverts if wallet already exists.
     */
    function createWallet(address owner) external returns (address wallet) {
        // Validate owner address
        if (owner == address(0)) revert InvalidOwner();

        // Check if wallet already exists
        if (wallets[owner] != address(0)) revert WalletAlreadyExists();

        // Deploy new wallet
        SimpleSmartWallet newWallet = new SimpleSmartWallet(owner);
        wallet = address(newWallet);

        // Store in registry
        wallets[owner] = wallet;
        totalWallets++;

        emit WalletCreated(owner, wallet, totalWallets);

        return wallet;
    }

    /**
     * @notice Get wallet address for an owner
     * @param owner Address of the wallet owner
     * @return Wallet address (or address(0) if not exists)
     */
    function getWallet(address owner) external view returns (address) {
        return wallets[owner];
    }

    /**
     * @notice Check if a wallet exists for an owner
     * @param owner Address of the wallet owner
     * @return True if wallet exists
     */
    function hasWallet(address owner) external view returns (bool) {
        return wallets[owner] != address(0);
    }

    /**
     * @notice Get or create wallet (convenience function)
     * @param owner Address of the wallet owner
     * @return wallet Address of the wallet (existing or newly created)
     *
     * @dev Returns existing wallet if it exists, otherwise creates new one
     */
    function getOrCreateWallet(address owner) external returns (address wallet) {
        wallet = wallets[owner];

        if (wallet == address(0)) {
            // Wallet doesn't exist, create it
            SimpleSmartWallet newWallet = new SimpleSmartWallet(owner);
            wallet = address(newWallet);

            wallets[owner] = wallet;
            totalWallets++;

            emit WalletCreated(owner, wallet, totalWallets);
        }

        return wallet;
    }

    // ============ View Functions ============

    /**
     * @notice Get total number of wallets created
     * @return Total wallet count
     */
    function getTotalWallets() external view returns (uint256) {
        return totalWallets;
    }
}
