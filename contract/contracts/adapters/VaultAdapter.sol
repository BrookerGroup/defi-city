// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IBuildingAdapter.sol";
import "../core/DefiCityCore.sol";
import "@openzeppelin/contracts/interfaces/IERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VaultAdapter
 * @notice Adapter for Vault buildings using MetaMorpho (ERC4626)
 * @dev Handles deposit, harvest (partial withdraw), and demolish (full withdraw)
 *      No lock period — user can withdraw anytime
 *      On testnet: uses MockMorphoVault
 *      On mainnet: uses real MetaMorpho vault (e.g., Spark USDC Vault)
 */
contract VaultAdapter is IBuildingAdapter, Ownable {

    // ============ Constants ============

    string public constant BUILDING_TYPE = "vault";
    uint256 public constant MAX_FEE_BPS = 100;
    uint256 public constant BASIS_POINTS = 10000;

    // ============ State Variables ============

    DefiCityCore public immutable core;
    address public morphoVault;     // ERC4626 vault
    address public vaultAsset;      // USDC
    uint256 public placementFeeBps = 5; // 0.05%
    address public treasury;

    // ============ Structs ============

    struct PlaceParams {
        uint256 amount;
        uint256 x;
        uint256 y;
    }

    struct HarvestParams {
        uint256 sharesToRedeem;
    }

    struct DemolishParams {
        uint256 shares;
    }

    // ============ Events ============

    event MorphoVaultUpdated(address morphoVault);
    event PlacementFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    // ============ Errors ============

    error InvalidAddress();
    error InvalidFee();

    // ============ Constructor ============

    constructor(
        address _core,
        address _morphoVault,
        address _vaultAsset,
        address _treasury
    ) Ownable(msg.sender) {
        if (_core == address(0) || _morphoVault == address(0)) revert InvalidAddress();
        if (_vaultAsset == address(0) || _treasury == address(0)) revert InvalidAddress();

        core = DefiCityCore(_core);
        morphoVault = _morphoVault;
        vaultAsset = _vaultAsset;
        treasury = _treasury;
    }

    // ============ Internal Helper ============

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
            "Not a vault"
        );
        require(buildingOwner == user, "Not owner");
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

        // 3 calls: approve USDC, deposit to vault, record
        targets = new address[](3);
        values = new uint256[](3);
        datas = new bytes[](3);

        // 1. Approve USDC to vault
        targets[0] = vaultAsset;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC20.approve.selector,
            morphoVault,
            p.amount
        );

        // 2. Deposit into ERC4626 vault (shares go to SmartWallet)
        targets[1] = morphoVault;
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            IERC4626.deposit.selector,
            p.amount,
            userSmartWallet
        );

        // 3. Record in Core
        bytes memory metadata = abi.encode("morpho_vault", p.amount);
        targets[2] = address(core);
        values[2] = 0;
        datas[2] = abi.encodeWithSelector(
            DefiCityCore.recordBuildingPlacement.selector,
            user,
            BUILDING_TYPE,
            vaultAsset,
            p.amount,
            p.x,
            p.y,
            metadata
        );

        return (targets, values, datas);
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
        _validateBuilding(buildingId, user);

        // 2 calls: redeem shares, record harvest
        targets = new address[](2);
        values = new uint256[](2);
        datas = new bytes[](2);

        // 1. Redeem shares from vault (USDC to SmartWallet)
        targets[0] = morphoVault;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC4626.redeem.selector,
            p.sharesToRedeem,
            userSmartWallet,  // receiver
            userSmartWallet   // owner of shares
        );

        // 2. Record harvest
        targets[1] = address(core);
        values[1] = 0;
        datas[1] = abi.encodeWithSelector(
            DefiCityCore.recordHarvest.selector,
            user,
            buildingId,
            0 // actual yield tracked off-chain
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
        _validateBuilding(buildingId, user);

        (,,,,, uint256 amount,,,,,) = core.buildings(buildingId);

        // 2 calls: redeem all shares, record demolition
        targets = new address[](2);
        values = new uint256[](2);
        datas = new bytes[](2);

        // 1. Redeem all shares
        targets[0] = morphoVault;
        values[0] = 0;
        datas[0] = abi.encodeWithSelector(
            IERC4626.redeem.selector,
            p.shares,
            userSmartWallet,  // receiver
            userSmartWallet   // owner
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

    // ============ View Functions ============

    function getBuildingType() external pure override returns (string memory) {
        return BUILDING_TYPE;
    }

    function getRequiredProtocols() external view override returns (address[] memory) {
        address[] memory protocols = new address[](2);
        protocols[0] = morphoVault;
        protocols[1] = vaultAsset;
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

    function setMorphoVault(address _morphoVault) external onlyOwner {
        if (_morphoVault == address(0)) revert InvalidAddress();
        morphoVault = _morphoVault;
        emit MorphoVaultUpdated(_morphoVault);
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
