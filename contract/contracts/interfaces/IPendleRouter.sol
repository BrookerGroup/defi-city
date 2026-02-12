// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPendleRouter
 * @notice Simplified Pendle V2 Router interface for DefiCity integration
 * @dev Full router on Base: 0x888888888889758F76e7103c6CbF23ABbF58F946
 *      Only includes functions needed for PT buy/sell/redeem
 */

// ============ Enums ============

enum SwapType { NONE, KYBERSWAP, ONE_INCH, ETH_WETH }
enum OrderType { SY_FOR_PT, PT_FOR_SY, SY_FOR_YT, YT_FOR_SY }

// ============ Structs ============

struct SwapData {
    SwapType swapType;
    address extRouter;
    bytes extCalldata;
    bool needScale;
}

struct TokenInput {
    address tokenIn;
    uint256 netTokenIn;
    address tokenMintSy;
    address pendleSwap;
    SwapData swapData;
}

struct TokenOutput {
    address tokenOut;
    uint256 minTokenOut;
    address tokenRedeemSy;
    address pendleSwap;
    SwapData swapData;
}

struct ApproxParams {
    uint256 guessMin;
    uint256 guessMax;
    uint256 guessOffchain;
    uint256 maxIteration;
    uint256 eps;
}

struct Order {
    uint256 salt;
    uint256 expiry;
    uint256 nonce;
    OrderType orderType;
    address token;
    address YT;
    address maker;
    address receiver;
    uint256 makingAmount;
    uint256 lnImpliedRate;
    uint256 failSafeRate;
    bytes permit;
}

struct FillOrderParams {
    Order order;
    bytes signature;
    uint256 makingAmount;
}

struct LimitOrderData {
    address limitRouter;
    uint256 epsSkipMarket;
    FillOrderParams[] normalFills;
    FillOrderParams[] flashFills;
    bytes optData;
}

// ============ Router Interface ============

interface IPendleRouter {
    /**
     * @notice Swap exact token (e.g., USDC) for PT
     * @param receiver Address to receive PT
     * @param market Pendle market address
     * @param minPtOut Minimum PT output (slippage)
     * @param guessPtOut Approximation params for binary search
     * @param input Token input details
     * @param limit Limit order data (pass empty for market orders)
     */
    function swapExactTokenForPt(
        address receiver,
        address market,
        uint256 minPtOut,
        ApproxParams calldata guessPtOut,
        TokenInput calldata input,
        LimitOrderData calldata limit
    ) external payable returns (uint256 netPtOut, uint256 netSyFee, uint256 netSyInterm);

    /**
     * @notice Swap exact PT for token (sell PT before maturity via AMM)
     * @param receiver Address to receive tokens
     * @param market Pendle market address
     * @param exactPtIn Exact PT amount to sell
     * @param output Token output details
     * @param limit Limit order data (pass empty for market orders)
     */
    function swapExactPtForToken(
        address receiver,
        address market,
        uint256 exactPtIn,
        TokenOutput calldata output,
        LimitOrderData calldata limit
    ) external returns (uint256 netTokenOut, uint256 netSyFee, uint256 netSyInterm);

    /**
     * @notice Redeem PT+YT (PY) to token at/after maturity
     * @param receiver Address to receive tokens
     * @param YT YT token address (used to find the PT/YT pair)
     * @param netPyIn Amount of PT to redeem
     * @param output Token output details
     */
    function redeemPyToToken(
        address receiver,
        address YT,
        uint256 netPyIn,
        TokenOutput calldata output
    ) external returns (uint256 netTokenOut, uint256 netSyInterm);
}

// ============ Market Interface ============

interface IPendleMarket {
    function readTokens() external view returns (address SY, address PT, address YT);
    function expiry() external view returns (uint256);
    function isExpired() external view returns (bool);
}
