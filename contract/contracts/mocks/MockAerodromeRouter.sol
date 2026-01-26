// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAerodromeRouter.sol";
import "./MockAerodromePair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockAerodromeRouter
 * @notice Full simulation mock of Aerodrome Router for testing
 * @dev Implements liquidity provision and removal with automatic pair creation
 */
contract MockAerodromeRouter is IAerodromeRouter {

    // ============ State Variables ============

    // Pair registry: keccak256(tokenA, tokenB, stable) => pair address
    mapping(bytes32 => address) public pairs;

    // All created pairs
    address[] public allPairs;

    // Factory address (this contract acts as factory)
    address public immutable factory;

    // ============ Events ============

    event PairCreated(
        address indexed token0,
        address indexed token1,
        bool stable,
        address pair,
        uint256 allPairsLength
    );

    event LiquidityAdded(
        address indexed pair,
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );

    event LiquidityRemoved(
        address indexed pair,
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );

    // ============ Constructor ============

    constructor() {
        factory = address(this);
    }

    // ============ IAerodromeRouter Implementation ============

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
    ) external override returns (
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    ) {
        require(deadline >= block.timestamp, "Expired");
        require(amountADesired >= amountAMin, "Insufficient A");
        require(amountBDesired >= amountBMin, "Insufficient B");

        // Get or create pair
        address pair = _getPairOrCreate(tokenA, tokenB, stable);

        // For simplicity, use desired amounts
        amountA = amountADesired;
        amountB = amountBDesired;

        // Transfer tokens from sender to pair
        IERC20(tokenA).transferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).transferFrom(msg.sender, pair, amountB);

        // Mint LP tokens
        liquidity = MockAerodromePair(pair).mint(to, amountA, amountB);

        emit LiquidityAdded(pair, to, amountA, amountB, liquidity);
        return (amountA, amountB, liquidity);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external override returns (uint256 amountA, uint256 amountB) {
        require(deadline >= block.timestamp, "Expired");

        // Get pair
        address pair = pairFor(tokenA, tokenB, stable);
        require(pair != address(0), "Pair does not exist");

        // Transfer LP tokens to pair for burning
        MockAerodromePair(pair).transferFrom(msg.sender, pair, liquidity);

        // Burn LP tokens and get underlying
        (amountA, amountB) = MockAerodromePair(pair).burn(to);

        require(amountA >= amountAMin, "Insufficient A");
        require(amountB >= amountBMin, "Insufficient B");

        emit LiquidityRemoved(pair, to, amountA, amountB, liquidity);
        return (amountA, amountB);
    }

    function pairFor(
        address tokenA,
        address tokenB,
        bool stable
    ) public view override returns (address pair) {
        (address token0, address token1) = _sortTokens(tokenA, tokenB);
        bytes32 pairKey = keccak256(abi.encodePacked(token0, token1, stable));
        return pairs[pairKey];
    }

    function quoteLiquidity(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) external pure override returns (uint256 amountB) {
        require(amountA > 0, "Insufficient amount");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");

        amountB = (amountA * reserveB) / reserveA;
        return amountB;
    }

    // ============ Internal Functions ============

    function _getPairOrCreate(
        address tokenA,
        address tokenB,
        bool stable
    ) internal returns (address pair) {
        pair = pairFor(tokenA, tokenB, stable);

        if (pair == address(0)) {
            // Create new pair
            (address token0, address token1) = _sortTokens(tokenA, tokenB);

            MockAerodromePair newPair = new MockAerodromePair(token0, token1, stable);
            pair = address(newPair);

            bytes32 pairKey = keccak256(abi.encodePacked(token0, token1, stable));
            pairs[pairKey] = pair;
            allPairs.push(pair);

            emit PairCreated(token0, token1, stable, pair, allPairs.length);
        }

        return pair;
    }

    function _sortTokens(
        address tokenA,
        address tokenB
    ) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "Identical addresses");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Zero address");
    }

    // ============ View Functions ============

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function getPair(uint256 index) external view returns (address) {
        return allPairs[index];
    }
}
