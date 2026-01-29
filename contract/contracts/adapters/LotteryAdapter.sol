// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IBuildingAdapter.sol";
import "../interfaces/IMegapot.sol";
import "../core/DefiCityCore.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LotteryAdapter
 * @notice Adapter for Lottery buildings using Megapot protocol
 * @dev Handles ticket purchases, prize claims, and demolition for Lotteries
 */
contract LotteryAdapter is IBuildingAdapter, Ownable {

    // ============ Constants ============

    string public constant BUILDING_TYPE = "lottery";
    uint256 public constant MAX_FEE_BPS = 100;
    uint256 public constant BASIS_POINTS = 10000;

    // ============ State Variables ============

    DefiCityCore public immutable core;
    address public megapot;
    address public usdc;
    uint256 public placementFeeBps = 5; // 0.05%
    address public treasury;

    // ============ Structs ============

    struct PlaceParams {
        uint256 amount;
        uint256 x;
        uint256 y;
    }

    struct HarvestParams {
        uint256[] ticketIds;
    }

    // ============ Events ============

    event MegapotUpdated(address megapot);
    event USDCUpdated(address usdc);
    event PlacementFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    // ============ Errors ============

    error InvalidAddress();
    error InvalidFee();

    // ============ Constructor ============

    constructor(
        address _core,
        address _megapot,
        address _usdc,
        address _treasury
    ) Ownable(msg.sender) {
        if (_core == address(0) || _megapot == address(0)) revert InvalidAddress();
        if (_usdc == address(0) || _treasury == address(0)) revert InvalidAddress();

        core = DefiCityCore(_core);
        megapot = _megapot;
        usdc = _usdc;
        treasury = _treasury;
    }

    // ============ Internal Helper Functions ============

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

        // Silence unused variable warnings
        id; smartWallet; asset; amount; placedAt; coordinateX; coordinateY; active; metadata;

        require(
            keccak256(bytes(buildingType)) == keccak256(bytes(BUILDING_TYPE)),
            "Not a lottery"
        );
        require(buildingOwner == user, "Not owner");
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

        // Prepare batch: [approve, buyTickets, recordBuilding]
        targets = new address[](3);
        values = new uint256[](3);
        datas = new bytes[](3);

        // 1. Approve USDC to Megapot
        targets[0] = usdc;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC20.approve.selector,
            megapot,
            p.amount
        );

        // 2. Buy lottery tickets (treasury as referrer)
        targets[1] = megapot;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            IMegapot.buyTickets.selector,
            p.amount,
            treasury
        );

        // 3. Record in Core
        bytes memory metadata = abi.encode("megapot_lottery", p.amount);

        targets[2] = address(core);
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(
            DefiCityCore.recordBuildingPlacement.selector,
            user,
            BUILDING_TYPE,
            usdc,
            p.amount,
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
        _validateBuilding(buildingId, user);

        // Prepare: [claimPrizes, recordHarvest]
        targets = new address[](2);
        values = new uint256[](2);
        datas = new bytes[](2);

        // 1. Claim prizes
        targets[0] = megapot;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IMegapot.claimPrizes.selector,
            p.ticketIds
        );

        // 2. Record harvest
        targets[1] = address(core);
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
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
        bytes calldata /* params */
    ) external view override returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        // Validate building
        _validateBuilding(buildingId, user);

        // Get amount for demolition record
        (,,,,, uint256 amount,,,,,) = core.buildings(buildingId);

        // Lottery demolition only records (tickets stay in Megapot)
        targets = new address[](1);
        values = new uint256[](1);
        datas = new bytes[](1);

        // Record demolition
        targets[0] = address(core);
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
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
        address[] memory protocols = new address[](2);
        protocols[0] = megapot;
        protocols[1] = usdc;
        return protocols;
    }

    function validatePlacement(
        bytes calldata params
    ) external pure override returns (bool isValid, string memory reason) {
        PlaceParams memory p = abi.decode(params, (PlaceParams));

        if (p.amount == 0) {
            return (false, "Amount must be > 0");
        }

        return (true, "");
    }

    function estimateYield(
        uint256 /* buildingId */
    ) external pure override returns (uint256 estimatedYield, address yieldAsset) {
        // Lottery has variable yield based on winning
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

    function setMegapot(address _megapot) external onlyOwner {
        if (_megapot == address(0)) revert InvalidAddress();
        megapot = _megapot;
        emit MegapotUpdated(_megapot);
    }

    function setUSDC(address _usdc) external onlyOwner {
        if (_usdc == address(0)) revert InvalidAddress();
        usdc = _usdc;
        emit USDCUpdated(_usdc);
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
