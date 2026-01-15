// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SimpleSmartWallet
 * @notice Simplified smart wallet for DeFi City MVP
 * @dev Basic wallet with deposit and withdraw functionality
 *
 * Features:
 * - Owner-based access control
 * - Deposit ETH and ERC20 tokens
 * - Withdraw ETH and ERC20 tokens
 * - View balances
 * - Reentrancy protection
 * - SafeERC20 for token operations
 */
contract SimpleSmartWallet is ReentrancyGuard {
    using SafeERC20 for IERC20;
    // ============ State Variables ============

    /// @notice Owner of this wallet
    address public owner;

    // ============ Events ============

    event Deposited(address indexed token, uint256 amount, address indexed from);
    event Withdrawn(address indexed token, uint256 amount, address indexed to);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============ Errors ============

    error OnlyOwner();
    error InvalidAddress();
    error InsufficientBalance();
    error TransferFailed();

    // ============ Modifiers ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize wallet with owner
     * @param _owner Address of the wallet owner
     */
    constructor(address _owner) {
        if (_owner == address(0)) revert InvalidAddress();
        owner = _owner;
    }

    // ============ Deposit Functions ============

    /**
     * @notice Deposit ETH to this wallet
     * @dev Simply send ETH to this contract
     */
    receive() external payable {
        emit Deposited(address(0), msg.value, msg.sender);
    }

    /**
     * @notice Deposit ERC20 tokens to this wallet
     * @param token Address of the ERC20 token
     * @param amount Amount to deposit
     * @dev User must approve this wallet first
     */
    function depositToken(address token, uint256 amount) external nonReentrant {
        if (token == address(0)) revert InvalidAddress();

        // Transfer tokens from sender to this wallet using SafeERC20
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(token, amount, msg.sender);
    }

    // ============ Withdraw Functions ============

    /**
     * @notice Withdraw ETH from wallet
     * @param to Address to send ETH to
     * @param amount Amount of ETH to withdraw
     */
    function withdrawETH(address payable to, uint256 amount) public onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        if (address(this).balance < amount) revert InsufficientBalance();

        (bool success,) = to.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Withdrawn(address(0), amount, to);
    }

    /**
     * @notice Withdraw all ETH from wallet
     * @param to Address to send ETH to
     */
    function withdrawAllETH(address payable to) external onlyOwner {
        uint256 balance = address(this).balance;
        withdrawETH(to, balance);
    }

    /**
     * @notice Withdraw ERC20 tokens from wallet
     * @param token Address of the ERC20 token
     * @param to Address to send tokens to
     * @param amount Amount to withdraw
     */
    function withdrawToken(address token, address to, uint256 amount) public onlyOwner nonReentrant {
        if (token == address(0) || to == address(0)) revert InvalidAddress();

        // Transfer tokens from this wallet to recipient using SafeERC20
        IERC20(token).safeTransfer(to, amount);

        emit Withdrawn(token, amount, to);
    }

    /**
     * @notice Withdraw all tokens of a specific type
     * @param token Address of the ERC20 token
     * @param to Address to send tokens to
     */
    function withdrawAllTokens(address token, address to) external onlyOwner {
        uint256 balance = getTokenBalance(token);
        withdrawToken(token, to, balance);
    }

    // ============ View Functions ============

    /**
     * @notice Get ETH balance of this wallet
     * @return Balance in wei
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get ERC20 token balance of this wallet
     * @param token Address of the ERC20 token
     * @return Balance of the token
     */
    function getTokenBalance(address token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // ============ Owner Management ============

    /**
     * @notice Transfer ownership to a new address
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();

        address oldOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
