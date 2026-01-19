// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IBuildingAdapter.sol";
import "../interfaces/IAavePool.sol";
import "../core/DefiCityCore.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BankAdapter
 * @notice Adapter for Bank buildings using Aave V3
 * @dev Handles supply, borrow, harvest, and demolish operations for Banks
 */
contract BankAdapter is IBuildingAdapter, Ownable {

    // ============ Constants ============

    string public constant BUILDING_TYPE = "bank";
    uint256 public constant INTEREST_RATE_MODE_VARIABLE = 2;
    uint256 public constant MIN_HEALTH_FACTOR = 1.5e18;
    uint256 public constant MAX_FEE_BPS = 100;
    uint256 public constant BASIS_POINTS = 10000;

    // ============ State Variables ============

    DefiCityCore public immutable core;
    address public aavePool;
    uint256 public placementFeeBps = 5; // 0.05%
    address public treasury;

    // ============ Structs ============

    struct PlaceParams {
        address asset;
        uint256 amount;
        uint256 x;
        uint256 y;
        bool isBorrowMode;
        address borrowAsset;
        uint256 borrowAmount;
    }

    struct HarvestParams {
        address asset;
        uint256 amount;
    }

    struct DemolishParams {
        address asset;
    }

    // ============ Events ============

    event AavePoolUpdated(address aavePool);
    event PlacementFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    // ============ Errors ============

    error InvalidAddress();
    error HealthFactorTooLow();
    error InvalidFee();

    // ============ Constructor ============

    constructor(
        address _core,
        address _aavePool,
        address _treasury
    ) Ownable(msg.sender) {
        if (_core == address(0) || _aavePool == address(0)) revert InvalidAddress();
        if (_treasury == address(0)) revert InvalidAddress();

        core = DefiCityCore(_core);
        aavePool = _aavePool;
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

        if (p.isBorrowMode) {
            return _prepareBorrow(user, userSmartWallet, p);
        } else {
            return _prepareSupply(user, userSmartWallet, p);
        }
    }

    function prepareHarvest(
        address user,
        address userSmartWallet,
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
            address smartWallet,
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
            "Not a bank"
        );
        require(buildingOwner == user, "Not owner");

        targets = new address[](2);
        values = new uint256[](2);
        datas = new bytes[](2);

        // 1. Withdraw from Aave
        targets[0] = aavePool;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IAavePool.withdraw.selector,
            p.asset,
            p.amount,
            smartWallet
        );

        // 2. Record harvest
        targets[1] = address(core);
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            DefiCityCore.recordHarvest.selector,
            user,
            buildingId,
            p.amount
        );

        return (targets, values, datas);
    }

    function prepareDemolish(
        address user,
        address userSmartWallet,
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
            "Not a bank"
        );
        require(buildingOwner == user, "Not owner");

        targets = new address[](2);
        values = new uint256[](2);
        datas = new bytes[](2);

        // 1. Withdraw all from Aave
        targets[0] = aavePool;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IAavePool.withdraw.selector,
            p.asset,
            type(uint256).max,
            smartWallet
        );

        // 2. Record demolition
        targets[1] = address(core);
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
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
        protocols[0] = aavePool;
        return protocols;
    }

    function validatePlacement(
        bytes calldata params
    ) external pure override returns (bool isValid, string memory reason) {
        PlaceParams memory p = abi.decode(params, (PlaceParams));

        if (p.asset == address(0)) {
            return (false, "Invalid asset");
        }
        if (p.amount == 0) {
            return (false, "Amount must be > 0");
        }
        if (p.isBorrowMode) {
            if (p.borrowAsset == address(0)) {
                return (false, "Invalid borrow asset");
            }
            if (p.borrowAmount == 0) {
                return (false, "Borrow amount must be > 0");
            }
        }

        return (true, "");
    }

    function estimateYield(
        uint256 buildingId
    ) external view override returns (uint256 estimatedYield, address yieldAsset) {
        // Get building info
        (
            ,
            ,
            ,
            ,
            address asset,
            ,
            ,
            ,
            ,
            ,
        ) = core.buildings(buildingId);

        // Simplified - should query Aave for aToken balance
        return (0, asset);
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

    // ============ Internal Functions ============

    function _prepareSupply(
        address user,
        address userSmartWallet,
        PlaceParams memory p
    ) internal view returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        targets = new address[](3);
        values = new uint256[](3);
        datas = new bytes[](3);

        // 1. Approve Aave Pool
        targets[0] = p.asset;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC20.approve.selector,
            aavePool,
            p.amount
        );

        // 2. Supply to Aave
        targets[1] = aavePool;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            IAavePool.supply.selector,
            p.asset,
            p.amount,
            userSmartWallet,
            0
        );

        // 3. Record in Core
        bytes memory metadata = abi.encode("supply", uint256(0), uint256(0));

        targets[2] = address(core);
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(
            DefiCityCore.recordBuildingPlacement.selector,
            user,
            BUILDING_TYPE,
            p.asset,
            p.amount,
            p.x,
            p.y,
            metadata
        );

        return (targets, values, datas);
    }

    function _prepareBorrow(
        address user,
        address userSmartWallet,
        PlaceParams memory p
    ) internal view returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        // Check health factor
        (,,,,, uint256 currentHealthFactor) = IAavePool(aavePool)
            .getUserAccountData(userSmartWallet);

        if (currentHealthFactor != type(uint256).max &&
            currentHealthFactor < MIN_HEALTH_FACTOR) {
            revert HealthFactorTooLow();
        }

        targets = new address[](4);
        values = new uint256[](4);
        datas = new bytes[](4);

        // 1. Approve Aave Pool
        targets[0] = p.asset;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC20.approve.selector,
            aavePool,
            p.amount
        );

        // 2. Supply collateral
        targets[1] = aavePool;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            IAavePool.supply.selector,
            p.asset,
            p.amount,
            userSmartWallet,
            0
        );

        // 3. Borrow
        targets[2] = aavePool;
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(
            IAavePool.borrow.selector,
            p.borrowAsset,
            p.borrowAmount,
            INTEREST_RATE_MODE_VARIABLE,
            0,
            userSmartWallet
        );

        // 4. Record in Core
        bytes memory metadata = abi.encode("borrow", p.amount, p.borrowAmount);

        targets[3] = address(core);
        values[3] = 0;
        datas[3] = abi.encodeWithSelector(
            DefiCityCore.recordBuildingPlacement.selector,
            user,
            BUILDING_TYPE,
            p.asset,
            p.amount,
            p.x,
            p.y,
            metadata
        );

        return (targets, values, datas);
    }

    // ============ Admin Functions ============

    function setAavePool(address _aavePool) external onlyOwner {
        if (_aavePool == address(0)) revert InvalidAddress();
        aavePool = _aavePool;
        emit AavePoolUpdated(_aavePool);
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
