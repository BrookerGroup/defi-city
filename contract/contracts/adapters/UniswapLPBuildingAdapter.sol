// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IBuildingAdapter.sol";
import "../interfaces/INonfungiblePositionManager.sol";
import "../core/DefiCityCore.sol";

/**
 * @title UniswapLPBuildingAdapter
 * @notice Adapter for LP buildings (Uniswap V3 positions)
 * @dev Prepares batched calldata for SmartWallet execution
 */
contract UniswapLPBuildingAdapter is IBuildingAdapter {
    string public constant BUILDING_TYPE = "lp";
    uint256 public constant BASIS_POINTS = 10000;

    DefiCityCore public immutable core;
    address public immutable positionManager;

    struct PlaceParams {
        address tokenA;
        address tokenB;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amountA;
        uint256 amountB;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 x;
        uint256 y;
    }

    struct HarvestParams {
        uint128 amount0Max;
        uint128 amount1Max;
    }

    struct DemolishParams {
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
    }

    struct IncreaseLiquidityParams {
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
    }

    struct DecreaseLiquidityParams {
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
    }

    constructor(address _core, address _positionManager) {
        require(_core != address(0) && _positionManager != address(0), "Invalid address");
        core = DefiCityCore(_core);
        positionManager = _positionManager;
    }

    function preparePlace(
        address user,
        address userSmartWallet,
        bytes calldata params
    ) external view override returns (address[] memory targets, uint256[] memory values, bytes[] memory datas) {
        PlaceParams memory p = abi.decode(params, (PlaceParams));
        require(p.tokenA != address(0) && p.tokenB != address(0), "Invalid tokens");
        require(p.tokenA != p.tokenB, "Same token");
        require(p.amountA > 0 || p.amountB > 0, "Amount must be > 0");
        require(p.tickLower < p.tickUpper, "Invalid ticks");

        // Sort tokens by address
        (address token0, address token1, uint256 amount0, uint256 amount1) = _sortTokens(
            p.tokenA,
            p.tokenB,
            p.amountA,
            p.amountB
        );

        targets = new address[](4);
        values = new uint256[](4);
        datas = new bytes[](4);

        // 1. Approve token0
        targets[0] = token0;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(IERC20.approve.selector, positionManager, amount0);

        // 2. Approve token1
        targets[1] = token1;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(IERC20.approve.selector, positionManager, amount1);

        // 3. Mint position
        INonfungiblePositionManager.MintParams memory mintParams = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: p.fee,
            tickLower: p.tickLower,
            tickUpper: p.tickUpper,
            amount0Desired: amount0,
            amount1Desired: amount1,
            amount0Min: p.amount0Min,
            amount1Min: p.amount1Min,
            recipient: userSmartWallet,
            deadline: block.timestamp + 600
        });
        targets[2] = positionManager;
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(INonfungiblePositionManager.mint.selector, mintParams);

        // 4. Record placement in core (metadata stores pair + fee + ticks)
        bytes memory metadata = abi.encode(token0, token1, p.fee, p.tickLower, p.tickUpper);
        targets[3] = address(core);
        values[3] = 0;
        datas[3] = abi.encodeWithSelector(
            DefiCityCore.recordBuildingPlacement.selector,
            user,
            BUILDING_TYPE,
            token0,
            amount0 + amount1,
            p.x,
            p.y,
            metadata
        );
    }

    function prepareHarvest(
        address user,
        address userSmartWallet,
        uint256 buildingId,
        bytes calldata params
    ) external view override returns (address[] memory targets, uint256[] memory values, bytes[] memory datas) {
        HarvestParams memory p = abi.decode(params, (HarvestParams));
        uint256 tokenId = core.lpTokenIdByBuilding(buildingId);
        require(tokenId != 0, "LP tokenId not set");

        // Validate building
        ( , address buildingOwner, , string memory buildingType, , , , , , , ) = core.buildings(buildingId);
        require(keccak256(bytes(buildingType)) == keccak256(bytes(BUILDING_TYPE)), "Not LP");
        require(buildingOwner == user, "Not owner");

        targets = new address[](2);
        values = new uint256[](2);
        datas = new bytes[](2);

        INonfungiblePositionManager.CollectParams memory collectParams =
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: userSmartWallet,
                amount0Max: p.amount0Max,
                amount1Max: p.amount1Max
            });

        // 1. Collect fees
        targets[0] = positionManager;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(INonfungiblePositionManager.collect.selector, collectParams);

        // 2. Record harvest (unknown yield, set 0)
        targets[1] = address(core);
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(DefiCityCore.recordHarvest.selector, user, buildingId, 0);
    }

    function prepareDemolish(
        address user,
        address userSmartWallet,
        uint256 buildingId,
        bytes calldata params
    ) external view override returns (address[] memory targets, uint256[] memory values, bytes[] memory datas) {
        DemolishParams memory p = abi.decode(params, (DemolishParams));
        uint256 tokenId = core.lpTokenIdByBuilding(buildingId);
        require(tokenId != 0, "LP tokenId not set");

        // Validate building
        ( , address buildingOwner, , string memory buildingType, , , , , , , ) = core.buildings(buildingId);
        require(keccak256(bytes(buildingType)) == keccak256(bytes(BUILDING_TYPE)), "Not LP");
        require(buildingOwner == user, "Not owner");

        targets = new address[](4);
        values = new uint256[](4);
        datas = new bytes[](4);

        INonfungiblePositionManager.DecreaseLiquidityParams memory decParams =
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: tokenId,
                liquidity: p.liquidity,
                amount0Min: p.amount0Min,
                amount1Min: p.amount1Min,
                deadline: block.timestamp + 600
            });

        INonfungiblePositionManager.CollectParams memory collectParams =
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: userSmartWallet,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            });

        // 1. Decrease liquidity
        targets[0] = positionManager;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(INonfungiblePositionManager.decreaseLiquidity.selector, decParams);

        // 2. Collect
        targets[1] = positionManager;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(INonfungiblePositionManager.collect.selector, collectParams);

        // 3. Burn NFT
        targets[2] = positionManager;
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(INonfungiblePositionManager.burn.selector, tokenId);

        // 4. Record demolition (unknown returned amount)
        targets[3] = address(core);
        values[3] = 0;
        datas[3] = abi.encodeWithSelector(DefiCityCore.recordDemolition.selector, user, buildingId, 0);
    }

    /**
     * @notice Prepare calldata for increasing liquidity on an LP position (LP-only, not in IBuildingAdapter)
     */
    function prepareIncreaseLiquidity(
        address user,
        address userSmartWallet,
        uint256 buildingId,
        bytes calldata params
    ) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas) {
        IncreaseLiquidityParams memory p = abi.decode(params, (IncreaseLiquidityParams));
        uint256 tokenId = core.lpTokenIdByBuilding(buildingId);
        require(tokenId != 0, "LP tokenId not set");

        ( , address buildingOwner, , string memory buildingType, , , , , , , bytes memory metadata) = core.buildings(buildingId);
        require(keccak256(bytes(buildingType)) == keccak256(bytes(BUILDING_TYPE)), "Not LP");
        require(buildingOwner == user, "Not owner");
        require(metadata.length >= 40, "Invalid metadata");
        (address token0, address token1, , , ) = abi.decode(metadata, (address, address, uint24, int24, int24));

        targets = new address[](3);
        values = new uint256[](3);
        datas = new bytes[](3);

        targets[0] = token0;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(IERC20.approve.selector, positionManager, p.amount0Desired);

        targets[1] = token1;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(IERC20.approve.selector, positionManager, p.amount1Desired);

        INonfungiblePositionManager.IncreaseLiquidityParams memory incParams =
            INonfungiblePositionManager.IncreaseLiquidityParams({
                tokenId: tokenId,
                amount0Desired: p.amount0Desired,
                amount1Desired: p.amount1Desired,
                amount0Min: p.amount0Min,
                amount1Min: p.amount1Min,
                deadline: block.timestamp + 600
            });
        targets[2] = positionManager;
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(INonfungiblePositionManager.increaseLiquidity.selector, incParams);
    }

    /**
     * @notice Prepare calldata for decreasing liquidity on an LP position (LP-only, not in IBuildingAdapter)
     */
    function prepareDecreaseLiquidity(
        address user,
        address userSmartWallet,
        uint256 buildingId,
        bytes calldata params
    ) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas) {
        DecreaseLiquidityParams memory p = abi.decode(params, (DecreaseLiquidityParams));
        uint256 tokenId = core.lpTokenIdByBuilding(buildingId);
        require(tokenId != 0, "LP tokenId not set");

        ( , address buildingOwner, , string memory buildingType, , , , , , , ) = core.buildings(buildingId);
        require(keccak256(bytes(buildingType)) == keccak256(bytes(BUILDING_TYPE)), "Not LP");
        require(buildingOwner == user, "Not owner");

        targets = new address[](1);
        values = new uint256[](1);
        datas = new bytes[](1);

        INonfungiblePositionManager.DecreaseLiquidityParams memory decParams =
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: tokenId,
                liquidity: p.liquidity,
                amount0Min: p.amount0Min,
                amount1Min: p.amount1Min,
                deadline: block.timestamp + 600
            });
        targets[0] = positionManager;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(INonfungiblePositionManager.decreaseLiquidity.selector, decParams);
    }

    function getBuildingType() external pure override returns (string memory) {
        return BUILDING_TYPE;
    }

    function getRequiredProtocols() external view override returns (address[] memory protocols) {
        protocols = new address[](1);
        protocols[0] = positionManager;
    }

    function validatePlacement(bytes calldata params) external pure override returns (bool isValid, string memory reason) {
        PlaceParams memory p = abi.decode(params, (PlaceParams));
        if (p.tokenA == address(0) || p.tokenB == address(0)) return (false, "Invalid tokens");
        if (p.tokenA == p.tokenB) return (false, "Same token");
        if (p.amountA == 0 && p.amountB == 0) return (false, "Amount must be > 0");
        if (p.tickLower >= p.tickUpper) return (false, "Invalid ticks");
        return (true, "");
    }

    function estimateYield(uint256) external pure override returns (uint256 estimatedYield, address yieldAsset) {
        return (0, address(0));
    }

    function getPlacementFee() external pure override returns (uint256 feeBps) {
        return 0;
    }

    function calculateFee(uint256 amount) external pure override returns (uint256 feeAmount, uint256 netAmount) {
        return (0, amount);
    }

    function getTreasury() external pure override returns (address) {
        return address(0);
    }

    function _sortTokens(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) internal pure returns (address token0, address token1, uint256 amount0, uint256 amount1) {
        if (tokenA < tokenB) {
            return (tokenA, tokenB, amountA, amountB);
        }
        return (tokenB, tokenA, amountB, amountA);
    }
}
