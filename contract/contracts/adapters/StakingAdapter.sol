// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IBuildingAdapter.sol";
import "../interfaces/IPendleRouter.sol";
import "../core/DefiCityCore.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StakingAdapter
 * @notice Adapter for Staking buildings using Pendle PT (fixed yield)
 * @dev User deposits USDC → buys PT via Pendle Router → lock until maturity
 *      At maturity: redeem PT → get USDC + fixed yield
 *      Before maturity: sell PT via AMM → may get less than face value
 *
 *      On testnet: uses MockPendleRouter
 *      On mainnet: uses Pendle Router 0x888888888889758F76e7103c6CbF23ABbF58F946
 */
contract StakingAdapter is IBuildingAdapter, Ownable {

    // ============ Constants ============

    string public constant BUILDING_TYPE = "staking";
    uint256 public constant MAX_FEE_BPS = 100;
    uint256 public constant BASIS_POINTS = 10000;

    // ============ State Variables ============

    DefiCityCore public immutable core;
    address public pendleRouter;
    address public stakingAsset; // USDC
    uint256 public placementFeeBps = 5; // 0.05%
    address public treasury;

    // ============ Structs ============

    struct PlaceParams {
        uint256 amount;      // USDC amount to stake
        address market;      // Pendle market address
        uint256 minPtOut;    // Min PT out (slippage)
        uint256 x;
        uint256 y;
    }

    struct DemolishParams {
        uint256 ptAmount;    // PT amount to sell/redeem
        address market;      // Pendle market address
        bool isMatured;      // true = redeem at maturity, false = sell via AMM
        uint256 minTokenOut; // Min USDC out (slippage)
    }

    // ============ Events ============

    event PendleRouterUpdated(address pendleRouter);
    event PlacementFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    // ============ Errors ============

    error InvalidAddress();
    error InvalidFee();

    // ============ Constructor ============

    constructor(
        address _core,
        address _pendleRouter,
        address _stakingAsset,
        address _treasury
    ) Ownable(msg.sender) {
        if (_core == address(0) || _pendleRouter == address(0)) revert InvalidAddress();
        if (_stakingAsset == address(0) || _treasury == address(0)) revert InvalidAddress();

        core = DefiCityCore(_core);
        pendleRouter = _pendleRouter;
        stakingAsset = _stakingAsset;
        treasury = _treasury;
    }

    // ============ Internal Helpers ============

    function _validateBuilding(uint256 buildingId, address user) internal view {
        (
            uint256 id,
            address buildingOwner,
            address smartWallet,
            string memory buildingType,
            address asset,
            uint256 amount,
            uint256 placedAt,
            uint256 coordinateX,
            uint256 coordinateY,
            bool active,
            bytes memory metadata
        ) = core.buildings(buildingId);

        id; smartWallet; asset; amount; placedAt; coordinateX; coordinateY; active; metadata;

        require(
            keccak256(bytes(buildingType)) == keccak256(bytes(BUILDING_TYPE)),
            "Not a staking building"
        );
        require(buildingOwner == user, "Not owner");
    }

    /**
     * @dev Create default ApproxParams for Pendle binary search
     */
    function _defaultApproxParams() internal pure returns (ApproxParams memory) {
        return ApproxParams({
            guessMin: 0,
            guessMax: type(uint256).max,
            guessOffchain: 0,
            maxIteration: 256,
            eps: 1e14 // 0.01% precision
        });
    }

    /**
     * @dev Create empty SwapData (no aggregator)
     */
    function _emptySwapData() internal pure returns (SwapData memory) {
        return SwapData({
            swapType: SwapType.NONE,
            extRouter: address(0),
            extCalldata: "",
            needScale: false
        });
    }

    /**
     * @dev Create TokenInput for USDC
     */
    function _createTokenInput(uint256 amount) internal view returns (TokenInput memory) {
        return TokenInput({
            tokenIn: stakingAsset,
            netTokenIn: amount,
            tokenMintSy: stakingAsset,
            pendleSwap: address(0),
            swapData: _emptySwapData()
        });
    }

    /**
     * @dev Create TokenOutput for USDC
     */
    function _createTokenOutput(uint256 minTokenOut) internal view returns (TokenOutput memory) {
        return TokenOutput({
            tokenOut: stakingAsset,
            minTokenOut: minTokenOut,
            tokenRedeemSy: stakingAsset,
            pendleSwap: address(0),
            swapData: _emptySwapData()
        });
    }

    /**
     * @dev Create empty LimitOrderData
     */
    function _emptyLimitOrderData() internal pure returns (LimitOrderData memory) {
        FillOrderParams[] memory emptyFills = new FillOrderParams[](0);
        return LimitOrderData({
            limitRouter: address(0),
            epsSkipMarket: 0,
            normalFills: emptyFills,
            flashFills: emptyFills,
            optData: ""
        });
    }

    // ============ IBuildingAdapter Implementation ============

    function preparePlace(
        address user,
        address /* userSmartWallet */,
        bytes calldata params
    ) external view override returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        PlaceParams memory p = abi.decode(params, (PlaceParams));

        // 3 calls: approve USDC, buy PT via router, record
        targets = new address[](3);
        values = new uint256[](3);
        datas = new bytes[](3);

        // 1. Approve USDC to Pendle Router
        targets[0] = stakingAsset;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC20.approve.selector,
            pendleRouter,
            p.amount
        );

        // 2. Buy PT via Pendle Router
        targets[1] = pendleRouter;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            IPendleRouter.swapExactTokenForPt.selector,
            user,                      // receiver of PT
            p.market,                  // Pendle market
            p.minPtOut,                // slippage protection
            _defaultApproxParams(),
            _createTokenInput(p.amount),
            _emptyLimitOrderData()
        );

        // 3. Record in Core
        bytes memory metadata = abi.encode("pendle_pt", p.market, p.minPtOut);
        targets[2] = address(core);
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(
            DefiCityCore.recordBuildingPlacement.selector,
            user,
            BUILDING_TYPE,
            stakingAsset,
            p.amount,
            p.x,
            p.y,
            metadata
        );

        return (targets, values, datas);
    }

    function prepareHarvest(
        address /* user */,
        address /* userSmartWallet */,
        uint256 /* buildingId */,
        bytes calldata /* params */
    ) external pure override returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        // Pendle PT has no intermediate harvest — yield is realized at maturity
        // Return empty arrays
        targets = new address[](0);
        values = new uint256[](0);
        datas = new bytes[](0);

        return (targets, values, datas);
    }

    function prepareDemolish(
        address user,
        address /* userSmartWallet */,
        uint256 buildingId,
        bytes calldata params
    ) external view override returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        DemolishParams memory p = abi.decode(params, (DemolishParams));
        _validateBuilding(buildingId, user);

        (,,,,, uint256 amount,,,,,) = core.buildings(buildingId);

        // Get PT address from market
        (,address ptAddress,address ytAddress) = IPendleMarket(p.market).readTokens();

        // 3 calls: approve PT, sell/redeem PT, record demolition
        targets = new address[](3);
        values = new uint256[](3);
        datas = new bytes[](3);

        // 1. Approve PT to router
        targets[0] = ptAddress;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC20.approve.selector,
            pendleRouter,
            p.ptAmount
        );

        if (p.isMatured) {
            // Path A: Redeem at maturity (1 PT = 1 USDC)
            targets[1] = pendleRouter;
            values[1] = 0;
            datas[1] = abi.encodeWithSelector(
                IPendleRouter.redeemPyToToken.selector,
                user,                               // receiver
                ytAddress,                           // YT address
                p.ptAmount,                          // amount
                _createTokenOutput(p.minTokenOut)
            );
        } else {
            // Path B: Sell PT via AMM before maturity
            targets[1] = pendleRouter;
            values[1] = 0;
            datas[1] = abi.encodeWithSelector(
                IPendleRouter.swapExactPtForToken.selector,
                user,                               // receiver
                p.market,                            // market
                p.ptAmount,                          // exact PT to sell
                _createTokenOutput(p.minTokenOut),
                _emptyLimitOrderData()
            );
        }

        // 2. Record demolition
        targets[2] = address(core);
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(
            DefiCityCore.recordDemolition.selector,
            user,
            buildingId,
            amount
        );

        return (targets, values, datas);
    }

    // ============ View Functions ============

    function getBuildingType() external pure override returns (string memory) {
        return BUILDING_TYPE;
    }

    function getRequiredProtocols() external view override returns (address[] memory) {
        address[] memory protocols = new address[](2);
        protocols[0] = pendleRouter;
        protocols[1] = stakingAsset;
        return protocols;
    }

    function validatePlacement(
        bytes calldata params
    ) external pure override returns (bool isValid, string memory reason) {
        PlaceParams memory p = abi.decode(params, (PlaceParams));
        if (p.amount == 0) {
            return (false, "Amount must be > 0");
        }
        if (p.market == address(0)) {
            return (false, "Invalid market");
        }
        return (true, "");
    }

    function estimateYield(
        uint256 /* buildingId */
    ) external pure override returns (uint256 estimatedYield, address yieldAsset) {
        // Fixed yield determined at purchase — tracked off-chain via PT price
        return (0, address(0));
    }

    function getPlacementFee() external view override returns (uint256) {
        return placementFeeBps;
    }

    function calculateFee(
        uint256 amount
    ) external view override returns (uint256 feeAmount, uint256 netAmount) {
        feeAmount = (amount * placementFeeBps) / BASIS_POINTS;
        netAmount = amount - feeAmount;
        return (feeAmount, netAmount);
    }

    function getTreasury() external view override returns (address) {
        return treasury;
    }

    // ============ Admin Functions ============

    function setPendleRouter(address _pendleRouter) external onlyOwner {
        if (_pendleRouter == address(0)) revert InvalidAddress();
        pendleRouter = _pendleRouter;
        emit PendleRouterUpdated(_pendleRouter);
    }

    function setPlacementFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert InvalidFee();
        uint256 oldFee = placementFeeBps;
        placementFeeBps = newFeeBps;
        emit PlacementFeeUpdated(oldFee, newFeeBps);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
}
