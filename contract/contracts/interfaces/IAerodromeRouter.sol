// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAerodromeRouter
 * @notice Interface for Aerodrome DEX Router on Base
 * @dev Based on Aerodrome V2 Router
 */
interface IAerodromeRouter {

    struct Route {
        address from;
        address to;
        bool stable;
        address factory;
    }

    /**
     * @notice Add liquidity to a pool
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param stable Whether the pool is stable (correlated assets) or volatile
     * @param amountADesired Desired amount of tokenA
     * @param amountBDesired Desired amount of tokenB
     * @param amountAMin Minimum amount of tokenA (slippage protection)
     * @param amountBMin Minimum amount of tokenB (slippage protection)
     * @param to Recipient of LP tokens
     * @param deadline Transaction deadline
     * @return amountA Actual amount of tokenA added
     * @return amountB Actual amount of tokenB added
     * @return liquidity Amount of LP tokens minted
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );

    /**
     * @notice Remove liquidity from a pool
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param stable Whether the pool is stable or volatile
     * @param liquidity Amount of LP tokens to burn
     * @param amountAMin Minimum amount of tokenA to receive
     * @param amountBMin Minimum amount of tokenB to receive
     * @param to Recipient of tokens
     * @param deadline Transaction deadline
     * @return amountA Amount of tokenA received
     * @return amountB Amount of tokenB received
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);

    /**
     * @notice Get pair/pool address for two tokens
     * @param tokenA First token
     * @param tokenB Second token
     * @param stable Stable or volatile pool
     * @return pair Pair contract address
     */
    function pairFor(
        address tokenA,
        address tokenB,
        bool stable
    ) external view returns (address pair);

    /**
     * @notice Quote liquidity amount
     * @param amountA Amount of tokenA
     * @param reserveA Reserve of tokenA in pool
     * @param reserveB Reserve of tokenB in pool
     * @return amountB Corresponding amount of tokenB
     */
    function quoteLiquidity(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) external pure returns (uint256 amountB);

    /**
     * @notice Get factory address
     * @return Factory contract address
     */
    function factory() external view returns (address);
}

/**
 * @title IAerodromePair
 * @notice Interface for Aerodrome liquidity pool
 */
interface IAerodromePair {

    /**
     * @notice Get pool reserves
     * @return reserve0 Reserve of token0
     * @return reserve1 Reserve of token1
     * @return blockTimestampLast Last update timestamp
     */
    function getReserves() external view returns (
        uint256 reserve0,
        uint256 reserve1,
        uint256 blockTimestampLast
    );

    /**
     * @notice Get token addresses
     * @return token0 First token
     * @return token1 Second token
     */
    function tokens() external view returns (address token0, address token1);

    /**
     * @notice Check if pool is stable
     * @return True if stable pool (correlated assets)
     */
    function stable() external view returns (bool);

    /**
     * @notice Claim accumulated trading fees
     * @return claimed0 Amount of token0 fees claimed
     * @return claimed1 Amount of token1 fees claimed
     */
    function claimFees() external returns (uint256 claimed0, uint256 claimed1);

    /**
     * @notice Get claimable fees for an address
     * @return Amount of fees claimable
     */
    function claimable0(address account) external view returns (uint256);
    function claimable1(address account) external view returns (uint256);
}

/**
 * @title IAerodromeGauge
 * @notice Interface for Aerodrome staking gauge (for AERO rewards)
 */
interface IAerodromeGauge {

    /**
     * @notice Deposit LP tokens to earn AERO rewards
     * @param amount Amount of LP tokens to stake
     */
    function deposit(uint256 amount) external;

    /**
     * @notice Withdraw LP tokens
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external;

    /**
     * @notice Claim AERO rewards
     * @param account Address to claim for
     */
    function getReward(address account) external;

    /**
     * @notice Get earned AERO rewards
     * @param account Address to check
     * @return Earned AERO amount
     */
    function earned(address account) external view returns (uint256);

    /**
     * @notice Get staked balance
     * @param account Address to check
     * @return Staked LP token balance
     */
    function balanceOf(address account) external view returns (uint256);
}
