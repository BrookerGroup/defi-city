// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAavePool
 * @notice Interface for Aave V3 Pool contract
 * @dev Used in Epic 4 (Bank Building) for supply/borrow operations
 *
 * Aave V3 Pool on Base:
 * - Sepolia Testnet: TBD
 * - Mainnet: Check https://docs.aave.com/developers/deployed-contracts/v3-mainnet/base
 */
interface IAavePool {
    /**
     * @notice Supplies an `amount` of underlying asset into the reserve
     * @param asset The address of the underlying asset to supply
     * @param amount The amount to be supplied
     * @param onBehalfOf The address that will receive the aTokens
     * @param referralCode Code used to register the integrator
     *
     * Epic 4 Support: US-011 (Supply Mode)
     */
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    /**
     * @notice Withdraws an `amount` of underlying asset from the reserve
     * @param asset The address of the underlying asset to withdraw
     * @param amount The underlying amount to be withdrawn
     * @param to The address that will receive the underlying
     * @return The final amount withdrawn
     *
     * Epic 4 Support: US-015 (Harvest)
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);

    /**
     * @notice Allows users to borrow a specific `amount` of the reserve underlying asset
     * @param asset The address of the underlying asset to borrow
     * @param amount The amount to be borrowed
     * @param interestRateMode The interest rate mode (1 = Stable, 2 = Variable)
     * @param referralCode Code used to register the integrator
     * @param onBehalfOf The address of the user who will receive the debt
     *
     * Epic 4 Support: US-012 (Borrow Mode)
     */
    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        uint16 referralCode,
        address onBehalfOf
    ) external;

    /**
     * @notice Repays a borrowed `amount` on a specific reserve
     * @param asset The address of the borrowed underlying asset
     * @param amount The amount to repay (use type(uint256).max for full repayment)
     * @param interestRateMode The interest rate mode (1 = Stable, 2 = Variable)
     * @param onBehalfOf The address of the user who will get his debt reduced
     * @return The final amount repaid
     *
     * Epic 4 Support: US-012 (Repay)
     */
    function repay(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf
    ) external returns (uint256);

    /**
     * @notice Returns the user account data across all the reserves
     * @param user The address of the user
     * @return totalCollateralBase Total collateral of the user in base currency
     * @return totalDebtBase Total debt of the user in base currency
     * @return availableBorrowsBase Borrowing power left of the user in base currency
     * @return currentLiquidationThreshold Liquidation threshold of the user
     * @return ltv Loan to Value of the user
     * @return healthFactor Health factor of the user
     *
     * Epic 4 Support: US-014 (View Health Factor)
     */
    function getUserAccountData(
        address user
    ) external view returns (
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    );

    /**
     * @notice Returns the configuration of the reserve
     * @param asset The address of the underlying asset
     * @return Configuration data
     */
    function getReserveData(
        address asset
    ) external view returns (ReserveData memory);

    struct ReserveData {
        // Configuration
        uint256 configuration;
        // Liquidity index (for supply)
        uint128 liquidityIndex;
        // Current supply rate
        uint128 currentLiquidityRate;
        // Variable borrow index
        uint128 variableBorrowIndex;
        // Current variable borrow rate
        uint128 currentVariableBorrowRate;
        // Current stable borrow rate
        uint128 currentStableBorrowRate;
        uint40 lastUpdateTimestamp;
        uint16 id;
        // aToken address
        address aTokenAddress;
        // Stable debt token address
        address stableDebtTokenAddress;
        // Variable debt token address
        address variableDebtTokenAddress;
        // Interest rate strategy address
        address interestRateStrategyAddress;
        uint128 accruedToTreasury;
        uint128 unbacked;
        uint128 isolationModeTotalDebt;
    }
}
