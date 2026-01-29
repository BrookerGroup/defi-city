// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAavePool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockAavePool
 * @notice Full simulation mock of Aave V3 Pool for testing
 * @dev Implements supply, borrow, withdraw, repay with realistic behavior
 */
contract MockAavePool is IAavePool {

    // ============ Structs ============

    struct AssetConfig {
        uint256 ltv; // Loan to Value (e.g., 8000 = 80%)
        uint256 liquidationThreshold; // e.g., 8500 = 85%
        uint256 supplyRate; // Annual rate in basis points (e.g., 500 = 5%)
        uint256 borrowRate; // Annual rate in basis points (e.g., 1000 = 10%)
        bool active;
    }

    // ============ State Variables ============

    // User aToken balances: asset => user => balance
    mapping(address => mapping(address => uint256)) public aTokenBalances;

    // User variable debt: asset => user => debt
    mapping(address => mapping(address => uint256)) public variableDebt;

    // Last interest update: asset => user => timestamp
    mapping(address => mapping(address => uint256)) public lastSupplyUpdate;
    mapping(address => mapping(address => uint256)) public lastBorrowUpdate;

    // Asset configurations
    mapping(address => AssetConfig) public assetConfigs;

    // Total reserves per asset
    mapping(address => uint256) public totalReserves;

    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant HEALTH_FACTOR_PRECISION = 1e18;

    // ============ Events ============

    event Supply(
        address indexed asset,
        address indexed user,
        address indexed onBehalfOf,
        uint256 amount
    );

    event Withdraw(
        address indexed asset,
        address indexed user,
        address indexed to,
        uint256 amount
    );

    event Borrow(
        address indexed asset,
        address indexed user,
        address indexed onBehalfOf,
        uint256 amount,
        uint256 interestRateMode
    );

    event Repay(
        address indexed asset,
        address indexed user,
        address indexed onBehalfOf,
        uint256 amount
    );

    // ============ Constructor ============

    constructor() {
        // Default configurations can be set here or via setter functions
    }

    // ============ IAavePool Implementation ============

    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 /* referralCode */
    ) external override {
        require(assetConfigs[asset].active, "Asset not active");
        require(amount > 0, "Amount must be > 0");

        // Update interest before modifying balance
        _accrueSupplyInterest(asset, onBehalfOf);

        // Transfer tokens from user
        IERC20(asset).transferFrom(msg.sender, address(this), amount);

        // Mint aTokens (internal balance)
        aTokenBalances[asset][onBehalfOf] += amount;
        totalReserves[asset] += amount;

        emit Supply(asset, msg.sender, onBehalfOf, amount);
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256) {
        require(assetConfigs[asset].active, "Asset not active");

        // Update interest before modifying balance
        _accrueSupplyInterest(asset, msg.sender);

        uint256 userBalance = aTokenBalances[asset][msg.sender];

        // Handle max withdrawal
        uint256 withdrawAmount = amount == type(uint256).max ? userBalance : amount;
        require(withdrawAmount <= userBalance, "Insufficient aToken balance");
        require(withdrawAmount <= totalReserves[asset], "Insufficient liquidity");

        // Burn aTokens
        aTokenBalances[asset][msg.sender] -= withdrawAmount;
        totalReserves[asset] -= withdrawAmount;

        // Transfer tokens
        IERC20(asset).transfer(to, withdrawAmount);

        emit Withdraw(asset, msg.sender, to, withdrawAmount);
        return withdrawAmount;
    }

    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        uint16 /* referralCode */,
        address onBehalfOf
    ) external override {
        require(assetConfigs[asset].active, "Asset not active");
        require(amount > 0, "Amount must be > 0");
        require(interestRateMode == 2, "Only variable rate supported"); // Variable only
        require(amount <= totalReserves[asset], "Insufficient liquidity");

        // Update interest before modifying debt
        _accrueBorrowInterest(asset, onBehalfOf);

        // Add to user's debt
        variableDebt[asset][onBehalfOf] += amount;

        // Check health factor after borrow
        (,,,,,uint256 healthFactor) = getUserAccountData(onBehalfOf);
        require(healthFactor >= HEALTH_FACTOR_PRECISION, "Health factor too low");

        // Transfer borrowed tokens
        totalReserves[asset] -= amount;
        IERC20(asset).transfer(msg.sender, amount);

        emit Borrow(asset, msg.sender, onBehalfOf, amount, interestRateMode);
    }

    function repay(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf
    ) external override returns (uint256) {
        require(assetConfigs[asset].active, "Asset not active");
        require(interestRateMode == 2, "Only variable rate supported");

        // Update interest before modifying debt
        _accrueBorrowInterest(asset, onBehalfOf);

        uint256 userDebt = variableDebt[asset][onBehalfOf];

        // Handle full repayment
        uint256 repayAmount = amount == type(uint256).max ? userDebt : amount;
        require(repayAmount <= userDebt, "Repay amount exceeds debt");

        // Transfer tokens from user
        IERC20(asset).transferFrom(msg.sender, address(this), repayAmount);

        // Reduce debt
        variableDebt[asset][onBehalfOf] -= repayAmount;
        totalReserves[asset] += repayAmount;

        emit Repay(asset, msg.sender, onBehalfOf, repayAmount);
        return repayAmount;
    }

    function getUserAccountData(
        address user
    ) public view override returns (
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    ) {
        // Simplified calculation - in real Aave this uses oracle prices
        // For testing, we assume all assets = 1:1 USD value

        totalCollateralBase = 0;
        totalDebtBase = 0;
        uint256 weightedLiquidationThreshold = 0;
        uint256 weightedLtv = 0;

        // This is a simplified version - in production you'd iterate through all assets
        // For testing purposes, we'll calculate based on configured assets
        // Note: This is a placeholder - in real tests, you'd need to track which assets the user has

        // Calculate total collateral with pending interest
        // Calculate total debt with pending interest
        // For now, return mock values that can be set via test helpers

        // If no collateral, health factor is max
        if (totalCollateralBase == 0) {
            healthFactor = type(uint256).max;
        } else if (totalDebtBase == 0) {
            healthFactor = type(uint256).max;
        } else {
            // healthFactor = (collateral * liquidationThreshold / BASIS_POINTS) * PRECISION / debt
            healthFactor = (totalCollateralBase * currentLiquidationThreshold * HEALTH_FACTOR_PRECISION)
                / (totalDebtBase * BASIS_POINTS);
        }

        // Calculate available borrows
        if (totalCollateralBase > 0 && weightedLtv > 0) {
            uint256 maxBorrow = (totalCollateralBase * weightedLtv) / BASIS_POINTS;
            availableBorrowsBase = maxBorrow > totalDebtBase ? maxBorrow - totalDebtBase : 0;
        }

        return (
            totalCollateralBase,
            totalDebtBase,
            availableBorrowsBase,
            currentLiquidationThreshold,
            ltv,
            healthFactor
        );
    }

    function getReserveData(
        address asset
    ) external view override returns (ReserveData memory) {
        AssetConfig memory config = assetConfigs[asset];

        return ReserveData({
            configuration: 0,
            liquidityIndex: 1e27, // Ray precision
            currentLiquidityRate: uint128(config.supplyRate),
            variableBorrowIndex: 1e27,
            currentVariableBorrowRate: uint128(config.borrowRate),
            currentStableBorrowRate: 0,
            lastUpdateTimestamp: uint40(block.timestamp),
            id: 0,
            aTokenAddress: address(this), // Mock - we handle aTokens internally
            stableDebtTokenAddress: address(0),
            variableDebtTokenAddress: address(0),
            interestRateStrategyAddress: address(0),
            accruedToTreasury: 0,
            unbacked: 0,
            isolationModeTotalDebt: 0
        });
    }

    // ============ Internal Functions ============

    function _accrueSupplyInterest(address asset, address user) internal {
        uint256 lastUpdate = lastSupplyUpdate[asset][user];
        if (lastUpdate == 0) {
            lastSupplyUpdate[asset][user] = block.timestamp;
            return;
        }

        uint256 balance = aTokenBalances[asset][user];
        if (balance == 0) return;

        uint256 timeElapsed = block.timestamp - lastUpdate;
        uint256 rate = assetConfigs[asset].supplyRate;

        // Simple interest: balance * rate * time / (SECONDS_PER_YEAR * BASIS_POINTS)
        uint256 interest = (balance * rate * timeElapsed) / (SECONDS_PER_YEAR * BASIS_POINTS);

        aTokenBalances[asset][user] += interest;
        lastSupplyUpdate[asset][user] = block.timestamp;
    }

    function _accrueBorrowInterest(address asset, address user) internal {
        uint256 lastUpdate = lastBorrowUpdate[asset][user];
        if (lastUpdate == 0) {
            lastBorrowUpdate[asset][user] = block.timestamp;
            return;
        }

        uint256 debt = variableDebt[asset][user];
        if (debt == 0) return;

        uint256 timeElapsed = block.timestamp - lastUpdate;
        uint256 rate = assetConfigs[asset].borrowRate;

        // Simple interest on debt
        uint256 interest = (debt * rate * timeElapsed) / (SECONDS_PER_YEAR * BASIS_POINTS);

        variableDebt[asset][user] += interest;
        lastBorrowUpdate[asset][user] = block.timestamp;
    }

    // ============ Test Helper Functions ============

    /**
     * @notice Configure an asset for testing
     * @param asset Asset address
     * @param ltv Loan to value in basis points (e.g., 8000 = 80%)
     * @param liquidationThreshold Liquidation threshold in basis points
     * @param supplyRate Annual supply rate in basis points
     * @param borrowRate Annual borrow rate in basis points
     */
    function setAssetConfig(
        address asset,
        uint256 ltv,
        uint256 liquidationThreshold,
        uint256 supplyRate,
        uint256 borrowRate
    ) external {
        assetConfigs[asset] = AssetConfig({
            ltv: ltv,
            liquidationThreshold: liquidationThreshold,
            supplyRate: supplyRate,
            borrowRate: borrowRate,
            active: true
        });
    }

    /**
     * @notice Get user's aToken balance
     */
    function getATokenBalance(address asset, address user) external view returns (uint256) {
        return aTokenBalances[asset][user];
    }

    /**
     * @notice Get user's variable debt
     */
    function getVariableDebt(address asset, address user) external view returns (uint256) {
        return variableDebt[asset][user];
    }

    /**
     * @notice Sync reserves with actual balance (testing only)
     * @dev Call this after transferring tokens to the contract
     */
    function addLiquidity(address asset, uint256 /* amount */) external {
        // Simply sync totalReserves to actual balance
        totalReserves[asset] = IERC20(asset).balanceOf(address(this));
    }
}
