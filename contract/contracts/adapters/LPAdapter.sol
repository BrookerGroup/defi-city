// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/INonfungiblePositionManager.sol";

/**
 * @title LPAdapter
 * @notice Prepares batched calldata for Uniswap V3 LP operations via NonfungiblePositionManager
 * @dev Used with SmartWallet.executeBatch - approve + mint/increase/decrease/collect
 */
contract LPAdapter {
    address public immutable positionManager;

    struct MintParams {
        address token0;  // must be < token1 by address
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    struct IncreaseLiquidityParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

    constructor(address _positionManager) {
        require(_positionManager != address(0), "Invalid manager");
        positionManager = _positionManager;
    }

    /**
     * @notice Prepare batch for mint: [approve token0, approve token1, mint]
     */
    function prepareMint(MintParams calldata params)
        external
        view
        returns (address[] memory targets, uint256[] memory values, bytes[] memory datas)
    {
        require(params.token0 != address(0) && params.token1 != address(0), "Invalid tokens");
        require(params.token0 < params.token1, "token0 must be < token1");
        require(params.amount0Desired > 0 || params.amount1Desired > 0, "Amount must be > 0");
        require(params.recipient != address(0), "Invalid recipient");
        require(params.deadline >= block.timestamp, "Expired deadline");

        targets = new address[](3);
        values = new uint256[](3);
        datas = new bytes[](3);

        // 1. Approve token0
        targets[0] = params.token0;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC20.approve.selector,
            positionManager,
            params.amount0Desired
        );

        // 2. Approve token1
        targets[1] = params.token1;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            IERC20.approve.selector,
            positionManager,
            params.amount1Desired
        );

        // 3. Mint
        INonfungiblePositionManager.MintParams memory mintParams = INonfungiblePositionManager.MintParams({
            token0: params.token0,
            token1: params.token1,
            fee: params.fee,
            tickLower: params.tickLower,
            tickUpper: params.tickUpper,
            amount0Desired: params.amount0Desired,
            amount1Desired: params.amount1Desired,
            amount0Min: params.amount0Min,
            amount1Min: params.amount1Min,
            recipient: params.recipient,
            deadline: params.deadline
        });

        targets[2] = positionManager;
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(
            INonfungiblePositionManager.mint.selector,
            mintParams
        );
    }

    /**
     * @notice Prepare batch for increaseLiquidity: [approve token0, approve token1, increaseLiquidity]
     * @param token0 From positions(tokenId)
     * @param token1 From positions(tokenId)
     */
    function prepareIncreaseLiquidity(
        address token0,
        address token1,
        IncreaseLiquidityParams calldata params
    ) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas) {
        require(token0 != address(0) && token1 != address(0), "Invalid tokens");
        require(params.deadline >= block.timestamp, "Expired deadline");

        targets = new address[](3);
        values = new uint256[](3);
        datas = new bytes[](3);

        targets[0] = token0;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC20.approve.selector,
            positionManager,
            params.amount0Desired
        );

        targets[1] = token1;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            IERC20.approve.selector,
            positionManager,
            params.amount1Desired
        );

        INonfungiblePositionManager.IncreaseLiquidityParams memory incParams =
            INonfungiblePositionManager.IncreaseLiquidityParams({
                tokenId: params.tokenId,
                amount0Desired: params.amount0Desired,
                amount1Desired: params.amount1Desired,
                amount0Min: params.amount0Min,
                amount1Min: params.amount1Min,
                deadline: params.deadline
            });

        targets[2] = positionManager;
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(
            INonfungiblePositionManager.increaseLiquidity.selector,
            incParams
        );
    }

    /**
     * @notice Prepare single call for decreaseLiquidity
     */
    function prepareDecreaseLiquidity(
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0Min,
        uint256 amount1Min
    ) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas) {
        uint256 deadline = block.timestamp + 600;
        INonfungiblePositionManager.DecreaseLiquidityParams memory params =
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: tokenId,
                liquidity: liquidity,
                amount0Min: amount0Min,
                amount1Min: amount1Min,
                deadline: deadline
            });

        targets = new address[](1);
        values = new uint256[](1);
        datas = new bytes[](1);
        targets[0] = positionManager;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            INonfungiblePositionManager.decreaseLiquidity.selector,
            params
        );
    }

    /**
     * @notice Prepare single call for collect
     */
    function prepareCollect(
        uint256 tokenId,
        address recipient,
        uint128 amount0Max,
        uint128 amount1Max
    ) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas) {
        INonfungiblePositionManager.CollectParams memory params =
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: recipient,
                amount0Max: amount0Max,
                amount1Max: amount1Max
            });

        targets = new address[](1);
        values = new uint256[](1);
        datas = new bytes[](1);
        targets[0] = positionManager;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            INonfungiblePositionManager.collect.selector,
            params
        );
    }
}
