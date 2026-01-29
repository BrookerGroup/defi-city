// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAerodromeRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockAerodromeGauge
 * @notice Full simulation mock of Aerodrome Gauge for testing
 * @dev Implements LP token staking and AERO reward distribution
 */
contract MockAerodromeGauge is IAerodromeGauge {

    // ============ State Variables ============

    // Staking token (LP token)
    address public immutable stakingToken;

    // Reward token (AERO)
    address public immutable rewardToken;

    // Staking balances
    mapping(address => uint256) public stakedBalance;

    // Reward tracking
    mapping(address => uint256) public lastRewardTime;
    mapping(address => uint256) public pendingRewards;

    // Reward rate (AERO per second per LP token staked)
    // Scaled by 1e18 for precision
    uint256 public rewardRate = 1e15; // Default: 0.001 AERO per second per LP token

    // Total staked
    uint256 public totalStaked;

    // ============ Events ============

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);

    // ============ Constructor ============

    constructor(address _stakingToken, address _rewardToken) {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_rewardToken != address(0), "Invalid reward token");

        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
    }

    // ============ IAerodromeGauge Implementation ============

    function deposit(uint256 amount) external override {
        require(amount > 0, "Cannot deposit 0");

        // Update rewards before changing balance
        _updateRewards(msg.sender);

        // Transfer LP tokens from user
        IERC20(stakingToken).transferFrom(msg.sender, address(this), amount);

        // Update balances
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;

        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external override {
        require(amount > 0, "Cannot withdraw 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient balance");

        // Update rewards before changing balance
        _updateRewards(msg.sender);

        // Update balances
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        // Transfer LP tokens back to user
        IERC20(stakingToken).transfer(msg.sender, amount);

        emit Withdraw(msg.sender, amount);
    }

    function getReward(address account) external override {
        // Update rewards
        _updateRewards(account);

        uint256 reward = pendingRewards[account];
        if (reward > 0) {
            pendingRewards[account] = 0;

            // Transfer AERO rewards
            IERC20(rewardToken).transfer(account, reward);

            emit RewardClaimed(account, reward);
        }
    }

    function earned(address account) external view override returns (uint256) {
        return _calculateRewards(account) + pendingRewards[account];
    }

    function balanceOf(address account) external view override returns (uint256) {
        return stakedBalance[account];
    }

    // ============ Internal Functions ============

    function _updateRewards(address account) internal {
        uint256 newRewards = _calculateRewards(account);
        if (newRewards > 0) {
            pendingRewards[account] += newRewards;
        }
        lastRewardTime[account] = block.timestamp;
    }

    function _calculateRewards(address account) internal view returns (uint256) {
        uint256 balance = stakedBalance[account];
        if (balance == 0) return 0;

        uint256 lastUpdate = lastRewardTime[account];
        if (lastUpdate == 0) return 0;

        uint256 timeElapsed = block.timestamp - lastUpdate;
        if (timeElapsed == 0) return 0;

        // rewards = balance * rewardRate * timeElapsed / 1e18
        // rewardRate is already scaled by 1e18
        return (balance * rewardRate * timeElapsed) / 1e18;
    }

    // ============ Test Helper Functions ============

    /**
     * @notice Set reward rate for testing
     * @param _rewardRate New reward rate (scaled by 1e18)
     * @dev Example: 1e15 = 0.001 AERO per second per LP token
     */
    function setRewardRate(uint256 _rewardRate) external {
        uint256 oldRate = rewardRate;
        rewardRate = _rewardRate;
        emit RewardRateUpdated(oldRate, _rewardRate);
    }

    /**
     * @notice Add AERO tokens to the gauge for reward distribution
     */
    function addRewards(uint256 amount) external {
        IERC20(rewardToken).transferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Get pending rewards for an account
     */
    function getPendingRewards(address account) external view returns (uint256) {
        return _calculateRewards(account) + pendingRewards[account];
    }

    /**
     * @notice Emergency withdraw without caring about rewards
     */
    function emergencyWithdraw() external {
        uint256 amount = stakedBalance[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        stakedBalance[msg.sender] = 0;
        totalStaked -= amount;
        pendingRewards[msg.sender] = 0;

        IERC20(stakingToken).transfer(msg.sender, amount);

        emit Withdraw(msg.sender, amount);
    }

    /**
     * @notice Get total staked amount
     */
    function getTotalStaked() external view returns (uint256) {
        return totalStaked;
    }
}
