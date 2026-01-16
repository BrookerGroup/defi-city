// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAavePool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./DefiCityCore.sol";

/**
 * @title BuildingManager
 * @notice Manages building placement logic and prepares DeFi interactions
 * @dev Does NOT hold tokens - prepares calls for SmartWallet execution
 *
 * Epic 4 Support: US-011, US-012, US-015 (Bank operations)
 *
 * This contract prepares batched calldata for SmartWallet to execute.
 * It ensures proper sequencing of DeFi interactions and bookkeeping.
 */
contract BuildingManager {

    // ============ Constants ============

    // Interest rate modes for Aave
    uint256 public constant INTEREST_RATE_MODE_STABLE = 1;
    uint256 public constant INTEREST_RATE_MODE_VARIABLE = 2;

    // ============ State Variables ============

    DefiCityCore public immutable core;

    /// @notice DeFi protocol addresses (Base network)
    address public aavePool;
    address public aerodromeRouter;
    address public megapotLottery;

    /// @notice Fee percentage (basis points) - 0.05% = 5 bps
    uint256 public placementFeeBps = 5;

    /// @notice Owner
    address public owner;

    // ============ Events ============

    event ProtocolsUpdated(
        address aavePool,
        address aerodromeRouter,
        address megapotLottery
    );
    event FeesUpdated(uint256 placementFeeBps);

    // ============ Errors ============

    error OnlyOwner();
    error InvalidHealthFactor();
    error InvalidAddress();

    // ============ Modifiers ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // ============ Constructor ============

    constructor(address _core) {
        if (_core == address(0)) revert InvalidAddress();
        core = DefiCityCore(_core);
        owner = msg.sender;
    }

    // ============ Bank Building (Aave) - Supply Mode (Epic 4: US-011) ============

    /**
     * @notice Prepare Bank building placement (Supply Mode)
     * @dev Returns calldata for SmartWallet to execute
     *
     * Epic 4 Support: US-011 (Place Bank - Supply Only)
     *
     * Flow:
     * 1. Approve Aave Pool to spend tokens
     * 2. Supply tokens to Aave (receive aTokens)
     * 3. Record building in Core
     *
     * @param userSmartWallet User's SmartWallet address
     * @param user User's EOA address
     * @param asset Asset to supply (USDC, USDT, ETH, WBTC)
     * @param amount Amount to supply
     * @param x Grid X coordinate
     * @param y Grid Y coordinate
     * @return targets Array of target addresses
     * @return values Array of ETH values
     * @return datas Array of encoded calls
     */
    function prepareBankSupply(
        address userSmartWallet,
        address user,
        address asset,
        uint256 amount,
        uint256 x,
        uint256 y
    ) external view returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        if (aavePool == address(0)) revert InvalidAddress();

        // Prepare batch: [approve, supply, recordBuilding]
        targets = new address[](3);
        values = new uint256[](3);
        datas = new bytes[](3);

        // 1. Approve Aave Pool
        targets[0] = asset;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC20.approve.selector,
            aavePool,
            amount
        );

        // 2. Supply to Aave
        targets[1] = aavePool;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            IAavePool.supply.selector,
            asset,
            amount,
            userSmartWallet,  // onBehalfOf (aTokens go to SmartWallet)
            0                 // referralCode
        );

        // 3. Record in Core
        // Metadata: mode = "supply"
        bytes memory metadata = abi.encode("supply", uint256(0), uint256(0));

        targets[2] = address(core);
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(
            DefiCityCore.recordBuildingPlacement.selector,
            user,
            "bank",  // Building type as string
            asset,
            amount,
            x,
            y,
            metadata
        );

        return (targets, values, datas);
    }

    // ============ Bank Building (Aave) - Borrow Mode (Epic 4: US-012) ============

    /**
     * @notice Prepare Bank building placement (Borrow Mode)
     * @dev Returns calldata for SmartWallet to execute
     *
     * Epic 4 Support: US-012 (Place Bank - Supply + Borrow)
     *
     * Flow:
     * 1. Approve Aave Pool to spend collateral
     * 2. Supply collateral to Aave
     * 3. Borrow asset from Aave
     * 4. Record building in Core
     *
     * @param userSmartWallet User's SmartWallet address
     * @param user User's EOA address
     * @param collateralAsset Collateral asset (e.g., ETH)
     * @param collateralAmount Amount to supply as collateral
     * @param borrowAsset Asset to borrow (e.g., USDC)
     * @param borrowAmount Amount to borrow
     * @param x Grid X coordinate
     * @param y Grid Y coordinate
     * @return targets Array of target addresses
     * @return values Array of ETH values
     * @return datas Array of encoded calls
     */
    function prepareBankBorrow(
        address userSmartWallet,
        address user,
        address collateralAsset,
        uint256 collateralAmount,
        address borrowAsset,
        uint256 borrowAmount,
        uint256 x,
        uint256 y
    ) external view returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        if (aavePool == address(0)) revert InvalidAddress();

        // Prepare batch: [approve, supply, borrow, recordBuilding]
        targets = new address[](4);
        values = new uint256[](4);
        datas = new bytes[](4);

        // 1. Approve Aave Pool for collateral
        targets[0] = collateralAsset;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC20.approve.selector,
            aavePool,
            collateralAmount
        );

        // 2. Supply collateral to Aave
        targets[1] = aavePool;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            IAavePool.supply.selector,
            collateralAsset,
            collateralAmount,
            userSmartWallet,
            0
        );

        // 3. Borrow from Aave (variable rate)
        targets[2] = aavePool;
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(
            IAavePool.borrow.selector,
            borrowAsset,
            borrowAmount,
            INTEREST_RATE_MODE_VARIABLE,
            0,
            userSmartWallet
        );

        // 4. Record in Core
        // Metadata: mode = "borrow", collateralAmount, borrowAmount
        bytes memory metadata = abi.encode(
            "borrow",
            collateralAmount,
            borrowAmount
        );

        targets[3] = address(core);
        values[3] = 0;
        datas[3] = abi.encodeWithSelector(
            DefiCityCore.recordBuildingPlacement.selector,
            user,
            "bank",  // Building type as string
            collateralAsset,
            collateralAmount,
            x,
            y,
            metadata
        );

        return (targets, values, datas);
    }

    // ============ Harvest (Epic 4: US-015) ============

    /**
     * @notice Prepare harvest from Bank building
     * @dev Returns calldata for SmartWallet to execute
     *
     * Epic 4 Support: US-015 (Harvest Bank Rewards)
     *
     * Flow:
     * 1. Withdraw interest from Aave (partial withdrawal)
     * 2. Record harvest in Core
     *
     * @param buildingId Building ID
     * @param user User's EOA address
     * @param asset Asset to harvest
     * @param amount Amount to harvest
     * @return targets Array of target addresses
     * @return values Array of ETH values
     * @return datas Array of encoded calls
     */
    function prepareHarvest(
        uint256 buildingId,
        address user,
        address asset,
        uint256 amount
    ) external view returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        if (aavePool == address(0)) revert InvalidAddress();

        // Get building info from Core
        (
            ,
            address owner,
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
            keccak256(bytes(buildingType)) == keccak256(bytes("bank")),
            "Not a bank"
        );
        require(owner == user, "Not owner");

        // Prepare: [withdraw, recordHarvest]
        targets = new address[](2);
        values = new uint256[](2);
        datas = new bytes[](2);

        // 1. Withdraw from Aave
        targets[0] = aavePool;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IAavePool.withdraw.selector,
            asset,
            amount,
            smartWallet  // Tokens go back to SmartWallet
        );

        // 2. Record harvest
        targets[1] = address(core);
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            DefiCityCore.recordHarvest.selector,
            user,
            buildingId,
            amount
        );

        return (targets, values, datas);
    }

    // ============ Demolish Bank ============

    /**
     * @notice Prepare demolition of Bank building
     * @dev Withdraws all funds from Aave and records demolition
     *
     * @param buildingId Building ID
     * @param user User's EOA address
     * @param asset Asset to withdraw
     * @return targets Array of target addresses
     * @return values Array of ETH values
     * @return datas Array of encoded calls
     */
    function prepareBankDemolition(
        uint256 buildingId,
        address user,
        address asset
    ) external view returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        if (aavePool == address(0)) revert InvalidAddress();

        // Get building info
        (
            ,
            address owner,
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
            keccak256(bytes(buildingType)) == keccak256(bytes("bank")),
            "Not a bank"
        );
        require(owner == user, "Not owner");

        // Prepare: [withdraw all, recordDemolition]
        targets = new address[](2);
        values = new uint256[](2);
        datas = new bytes[](2);

        // 1. Withdraw all from Aave
        targets[0] = aavePool;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IAavePool.withdraw.selector,
            asset,
            type(uint256).max,  // Withdraw all
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

    // ============ Admin Functions ============

    /**
     * @notice Set DeFi protocol addresses
     * @param _aavePool Aave V3 Pool address
     * @param _aerodromeRouter Aerodrome Router address
     * @param _megapotLottery Megapot Lottery address
     */
    function setProtocolAddresses(
        address _aavePool,
        address _aerodromeRouter,
        address _megapotLottery
    ) external onlyOwner {
        aavePool = _aavePool;
        aerodromeRouter = _aerodromeRouter;
        megapotLottery = _megapotLottery;

        emit ProtocolsUpdated(_aavePool, _aerodromeRouter, _megapotLottery);
    }

    /**
     * @notice Update placement fee
     * @param _placementFeeBps New fee in basis points
     */
    function setPlacementFee(uint256 _placementFeeBps) external onlyOwner {
        require(_placementFeeBps <= 100, "Fee too high"); // Max 1%
        placementFeeBps = _placementFeeBps;

        emit FeesUpdated(_placementFeeBps);
    }

    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        owner = newOwner;
    }
}
