// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/ISwapRouter02.sol";

/**
 * @title SwapAdapter
 * @notice Prepares batched calldata for token swaps via Uniswap V3 SwapRouter02
 * @dev Used with SmartWallet.executeBatch - no building placement, utility only
 */
contract SwapAdapter {

    address public immutable swapRouter;

    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint24 fee; // 500 = 0.05%, 3000 = 0.3%, 10000 = 1%
        address recipient;
        uint256 deadline;
    }

    constructor(address _swapRouter) {
        require(_swapRouter != address(0), "Invalid router");
        swapRouter = _swapRouter;
    }

    /**
     * @notice Prepare batch for swap: [approve tokenIn, exactInputSingle]
     * @param params Swap parameters
     * @return targets Batch targets
     * @return values Batch values (all 0)
     * @return datas Batch calldatas
     */
    function prepareSwap(
        SwapParams calldata params
    ) external view returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        require(params.tokenIn != address(0) && params.tokenOut != address(0), "Invalid tokens");
        require(params.amountIn > 0, "Amount must be > 0");
        require(params.recipient != address(0), "Invalid recipient");
        require(params.deadline >= block.timestamp, "Expired deadline");

        targets = new address[](2);
        values = new uint256[](2);
        datas = new bytes[](2);

        // 1. Approve tokenIn to SwapRouter02
        targets[0] = params.tokenIn;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC20.approve.selector,
            swapRouter,
            params.amountIn
        );

        // 2. exactInputSingle on SwapRouter02 (no deadline in Base Sepolia router)
        ISwapRouter02.ExactInputSingleParams memory swapParams = ISwapRouter02.ExactInputSingleParams({
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            fee: params.fee,
            recipient: params.recipient,
            amountIn: params.amountIn,
            amountOutMinimum: params.amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        targets[1] = swapRouter;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            ISwapRouter02.exactInputSingle.selector,
            swapParams
        );

        return (targets, values, datas);
    }
}
