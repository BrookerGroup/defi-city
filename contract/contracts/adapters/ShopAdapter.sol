// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IBuildingAdapter.sol";
import "../interfaces/IAerodromeRouter.sol";
import "../core/DefiCityCore.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ShopAdapter
 * @notice Adapter for Shop buildings using Aerodrome DEX
 * @dev Handles LP provision, fee harvesting, and liquidity removal for Shops
 */
contract ShopAdapter is IBuildingAdapter, Ownable {

    // ============ Constants ============

    string public constant BUILDING_TYPE = "shop";
    uint256 public constant MAX_FEE_BPS = 100;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SLIPPAGE_TOLERANCE = 500; // 5%

    // ============ State Variables ============

    DefiCityCore public immutable core;
    address public aerodromeRouter;
    uint256 public placementFeeBps = 5; // 0.05%
    address public treasury;

    // ============ Structs ============

    struct PlaceParams {
        address tokenA;
        address tokenB;
        uint256 amountA;
        uint256 amountB;
        bool stable;
        uint256 x;
        uint256 y;
    }

    struct HarvestParams {
        address pairAddress;
        address gaugeAddress; // address(0) if not staked
    }

    struct DemolishParams {
        address tokenA;
        address tokenB;
        bool stable;
        uint256 liquidity;
    }

    // ============ Events ============

    event AerodromeRouterUpdated(address aerodromeRouter);
    event PlacementFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    // ============ Errors ============

    error InvalidAddress();
    error InvalidFee();

    // ============ Constructor ============

    constructor(
        address _core,
        address _aerodromeRouter,
        address _treasury
    ) Ownable(msg.sender) {
        if (_core == address(0) || _aerodromeRouter == address(0)) revert InvalidAddress();
        if (_treasury == address(0)) revert InvalidAddress();

        core = DefiCityCore(_core);
        aerodromeRouter = _aerodromeRouter;
        treasury = _treasury;
    }

    // ============ IBuildingAdapter Implementation ============

    function preparePlace(
        address user,
        address userSmartWallet,
        bytes calldata params
    ) external view override returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        PlaceParams memory p = abi.decode(params, (PlaceParams));

        // Prepare batch: [approve tokenA, approve tokenB, addLiquidity, recordBuilding]
        targets = new address[](4);
        values = new uint256[](4);
        datas = new bytes[](4);

        // 1. Approve tokenA to Aerodrome Router
        targets[0] = p.tokenA;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC20.approve.selector,
            aerodromeRouter,
            p.amountA
        );

        // 2. Approve tokenB to Aerodrome Router
        targets[1] = p.tokenB;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            IERC20.approve.selector,
            aerodromeRouter,
            p.amountB
        );

        // 3. Add liquidity to Aerodrome
        targets[2] = aerodromeRouter;
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(
            IAerodromeRouter.addLiquidity.selector,
            p.tokenA,
            p.tokenB,
            p.stable,
            p.amountA,
            p.amountB,
            (p.amountA * (BASIS_POINTS - SLIPPAGE_TOLERANCE)) / BASIS_POINTS,
            (p.amountB * (BASIS_POINTS - SLIPPAGE_TOLERANCE)) / BASIS_POINTS,
            userSmartWallet,
            block.timestamp + 300
        );

        // 4. Record in Core
        bytes memory metadata = abi.encode(
            "aerodrome_lp",
            p.tokenA,
            p.tokenB,
            p.stable
        );

        targets[3] = address(core);
        values[3] = 0;
        datas[3] = abi.encodeWithSelector(
            DefiCityCore.recordBuildingPlacement.selector,
            user,
            BUILDING_TYPE,
            p.tokenA,
            p.amountA + p.amountB,
            p.x,
            p.y,
            metadata
        );

        return (targets, values, datas);
    }

    function prepareHarvest(
        address user,
        address /* userSmartWallet */,
        uint256 buildingId,
        bytes calldata params
    ) external view override returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        HarvestParams memory p = abi.decode(params, (HarvestParams));

        // Validate building
        (
            ,
            address buildingOwner,
            ,
            string memory buildingType,
            ,
            ,
            ,
            ,
            ,
            ,
        ) = core.buildings(buildingId);

        require(
            keccak256(bytes(buildingType)) == keccak256(bytes(BUILDING_TYPE)),
            "Not a shop"
        );
        require(buildingOwner == user, "Not owner");

        // Determine batch size
        uint256 batchSize = p.gaugeAddress == address(0) ? 2 : 3;
        targets = new address[](batchSize);
        values = new uint256[](batchSize);
        datas = new bytes[](batchSize);

        uint256 idx = 0;

        // 1. Claim trading fees from pair
        targets[idx] = p.pairAddress;
        values[idx] = 0;
        datas[idx] = abi.encodeWithSelector(
            IAerodromePair.claimFees.selector
        );
        idx++;

        // 2. Claim AERO rewards if staked
        if (p.gaugeAddress != address(0)) {
            targets[idx] = p.gaugeAddress;
            values[idx] = 0;
            datas[idx] = abi.encodeWithSelector(
                IAerodromeGauge.getReward.selector,
                user
            );
            idx++;
        }

        // 3. Record harvest
        targets[idx] = address(core);
        values[idx] = 0;
        datas[idx] = abi.encodeWithSelector(
            DefiCityCore.recordHarvest.selector,
            user,
            buildingId,
            0
        );

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

        // Validate building
        (
            ,
            address buildingOwner,
            address smartWallet,
            string memory buildingType,
            ,
            uint256 amount,
            ,
            ,
            ,
            ,
        ) = core.buildings(buildingId);

        require(
            keccak256(bytes(buildingType)) == keccak256(bytes(BUILDING_TYPE)),
            "Not a shop"
        );
        require(buildingOwner == user, "Not owner");

        // Get pair address
        address pairAddress = IAerodromeRouter(aerodromeRouter).pairFor(
            p.tokenA,
            p.tokenB,
            p.stable
        );

        // Prepare: [approve LP, removeLiquidity, recordDemolition]
        targets = new address[](3);
        values = new uint256[](3);
        datas = new bytes[](3);

        // 1. Approve LP tokens
        targets[0] = pairAddress;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC20.approve.selector,
            aerodromeRouter,
            p.liquidity
        );

        // 2. Remove liquidity
        targets[1] = aerodromeRouter;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            IAerodromeRouter.removeLiquidity.selector,
            p.tokenA,
            p.tokenB,
            p.stable,
            p.liquidity,
            0,
            0,
            smartWallet,
            block.timestamp + 300
        );

        // 3. Record demolition
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

    function getBuildingType() external pure override returns (string memory) {
        return BUILDING_TYPE;
    }

    function getRequiredProtocols() external view override returns (address[] memory) {
        address[] memory protocols = new address[](1);
        protocols[0] = aerodromeRouter;
        return protocols;
    }

    function validatePlacement(
        bytes calldata params
    ) external pure override returns (bool isValid, string memory reason) {
        PlaceParams memory p = abi.decode(params, (PlaceParams));

        if (p.tokenA == address(0) || p.tokenB == address(0)) {
            return (false, "Invalid tokens");
        }
        if (p.amountA == 0 || p.amountB == 0) {
            return (false, "Amounts must be > 0");
        }
        if (p.tokenA == p.tokenB) {
            return (false, "Cannot LP same token");
        }

        return (true, "");
    }

    function estimateYield(
        uint256 /* buildingId */
    ) external pure override returns (uint256 estimatedYield, address yieldAsset) {
        // Shop yield comes from trading fees + AERO rewards
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

    function setAerodromeRouter(address _aerodromeRouter) external onlyOwner {
        if (_aerodromeRouter == address(0)) revert InvalidAddress();
        aerodromeRouter = _aerodromeRouter;
        emit AerodromeRouterUpdated(_aerodromeRouter);
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
