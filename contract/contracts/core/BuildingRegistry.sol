// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IBuildingAdapter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BuildingRegistry
 * @notice Central registry for building type adapters
 * @dev Routes building operations to the correct adapter contract
 *      Allows adding/upgrading adapters without redeploying core logic
 */
contract BuildingRegistry is Ownable, ReentrancyGuard {

    // ============ State Variables ============

    /// @notice Building type → Adapter address
    mapping(string => address) public adapters;

    /// @notice List of all registered building types
    string[] public buildingTypes;

    /// @notice Building type → is registered
    mapping(string => bool) public isRegistered;

    // ============ Events ============

    event AdapterRegistered(
        string indexed buildingType,
        address indexed adapter,
        uint256 timestamp
    );

    event AdapterUpgraded(
        string indexed buildingType,
        address indexed oldAdapter,
        address indexed newAdapter,
        uint256 timestamp
    );

    event AdapterRemoved(
        string indexed buildingType,
        address indexed adapter,
        uint256 timestamp
    );

    // ============ Errors ============

    error InvalidAdapter();
    error AdapterNotFound();
    error AdapterAlreadyRegistered();
    error InvalidBuildingType();

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Core Functions ============

    /**
     * @notice Prepare building placement via adapter
     * @dev Routes to the correct adapter based on building type
     * @param buildingType Type of building (e.g., "bank", "shop", "lottery")
     * @param user User's EOA address
     * @param userSmartWallet User's SmartWallet address
     * @param params Encoded parameters for the specific building type
     * @return targets Array of target addresses
     * @return values Array of ETH values
     * @return datas Array of encoded calls
     */
    function preparePlace(
        string calldata buildingType,
        address user,
        address userSmartWallet,
        bytes calldata params
    ) external view returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        address adapter = adapters[buildingType];
        if (adapter == address(0)) revert AdapterNotFound();

        return IBuildingAdapter(adapter).preparePlace(
            user,
            userSmartWallet,
            params
        );
    }

    /**
     * @notice Prepare harvest via adapter
     * @param buildingType Type of building
     * @param user User's EOA address
     * @param userSmartWallet User's SmartWallet address
     * @param buildingId Building ID
     * @param params Encoded parameters
     * @return targets Array of target addresses
     * @return values Array of ETH values
     * @return datas Array of encoded calls
     */
    function prepareHarvest(
        string calldata buildingType,
        address user,
        address userSmartWallet,
        uint256 buildingId,
        bytes calldata params
    ) external view returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        address adapter = adapters[buildingType];
        if (adapter == address(0)) revert AdapterNotFound();

        return IBuildingAdapter(adapter).prepareHarvest(
            user,
            userSmartWallet,
            buildingId,
            params
        );
    }

    /**
     * @notice Prepare demolish via adapter
     * @param buildingType Type of building
     * @param user User's EOA address
     * @param userSmartWallet User's SmartWallet address
     * @param buildingId Building ID
     * @param params Encoded parameters
     * @return targets Array of target addresses
     * @return values Array of ETH values
     * @return datas Array of encoded calls
     */
    function prepareDemolish(
        string calldata buildingType,
        address user,
        address userSmartWallet,
        uint256 buildingId,
        bytes calldata params
    ) external view returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) {
        address adapter = adapters[buildingType];
        if (adapter == address(0)) revert AdapterNotFound();

        return IBuildingAdapter(adapter).prepareDemolish(
            user,
            userSmartWallet,
            buildingId,
            params
        );
    }

    // ============ Adapter Management ============

    /**
     * @notice Register a new building adapter
     * @dev Only owner can register. Validates adapter implements IBuildingAdapter.
     * @param buildingType Type of building (e.g., "bank")
     * @param adapter Address of the adapter contract
     */
    function registerAdapter(
        string calldata buildingType,
        address adapter
    ) external onlyOwner {
        if (bytes(buildingType).length == 0) revert InvalidBuildingType();
        if (adapter == address(0)) revert InvalidAdapter();
        if (isRegistered[buildingType]) revert AdapterAlreadyRegistered();

        // Validate adapter implements IBuildingAdapter
        try IBuildingAdapter(adapter).getBuildingType() returns (string memory adapterType) {
            require(
                keccak256(bytes(adapterType)) == keccak256(bytes(buildingType)),
                "Adapter type mismatch"
            );
        } catch {
            revert InvalidAdapter();
        }

        adapters[buildingType] = adapter;
        buildingTypes.push(buildingType);
        isRegistered[buildingType] = true;

        emit AdapterRegistered(buildingType, adapter, block.timestamp);
    }

    /**
     * @notice Upgrade an existing adapter to a new version
     * @dev Allows hot-swapping adapter implementations without affecting other building types
     * @param buildingType Type of building
     * @param newAdapter Address of the new adapter contract
     */
    function upgradeAdapter(
        string calldata buildingType,
        address newAdapter
    ) external onlyOwner {
        if (!isRegistered[buildingType]) revert AdapterNotFound();
        if (newAdapter == address(0)) revert InvalidAdapter();

        // Validate new adapter
        try IBuildingAdapter(newAdapter).getBuildingType() returns (string memory adapterType) {
            require(
                keccak256(bytes(adapterType)) == keccak256(bytes(buildingType)),
                "Adapter type mismatch"
            );
        } catch {
            revert InvalidAdapter();
        }

        address oldAdapter = adapters[buildingType];
        adapters[buildingType] = newAdapter;

        emit AdapterUpgraded(buildingType, oldAdapter, newAdapter, block.timestamp);
    }

    /**
     * @notice Remove an adapter (disable building type)
     * @dev Use carefully - existing buildings of this type will not be operable
     * @param buildingType Type of building to remove
     */
    function removeAdapter(string calldata buildingType) external onlyOwner {
        if (!isRegistered[buildingType]) revert AdapterNotFound();

        address oldAdapter = adapters[buildingType];
        delete adapters[buildingType];
        isRegistered[buildingType] = false;

        emit AdapterRemoved(buildingType, oldAdapter, block.timestamp);
    }

    // ============ View Functions ============

    /**
     * @notice Get adapter address for a building type
     * @param buildingType Type of building
     * @return Adapter address (or address(0) if not registered)
     */
    function getAdapter(string calldata buildingType) external view returns (address) {
        return adapters[buildingType];
    }

    /**
     * @notice Get all registered building types
     * @return Array of building type strings
     */
    function getAllBuildingTypes() external view returns (string[] memory) {
        return buildingTypes;
    }

    /**
     * @notice Check if building type is registered
     * @param buildingType Type to check
     * @return True if registered
     */
    function isBuildingTypeRegistered(string calldata buildingType) external view returns (bool) {
        return isRegistered[buildingType];
    }

    /**
     * @notice Validate placement parameters for a building type
     * @param buildingType Type of building
     * @param params Encoded parameters
     * @return isValid True if valid
     * @return reason Error message if invalid
     */
    function validatePlacement(
        string calldata buildingType,
        bytes calldata params
    ) external view returns (bool isValid, string memory reason) {
        address adapter = adapters[buildingType];
        if (adapter == address(0)) {
            return (false, "Adapter not found");
        }

        return IBuildingAdapter(adapter).validatePlacement(params);
    }

    /**
     * @notice Get placement fee for a building type
     * @param buildingType Type of building
     * @return feeBps Fee in basis points
     */
    function getPlacementFee(string calldata buildingType) external view returns (uint256 feeBps) {
        address adapter = adapters[buildingType];
        if (adapter == address(0)) revert AdapterNotFound();

        return IBuildingAdapter(adapter).getPlacementFee();
    }

    /**
     * @notice Calculate fee for a building placement
     * @param buildingType Type of building
     * @param amount Amount to calculate fee on
     * @return feeAmount Fee to collect
     * @return netAmount Amount after fee
     */
    function calculateFee(
        string calldata buildingType,
        uint256 amount
    ) external view returns (uint256 feeAmount, uint256 netAmount) {
        address adapter = adapters[buildingType];
        if (adapter == address(0)) revert AdapterNotFound();

        return IBuildingAdapter(adapter).calculateFee(amount);
    }

    /**
     * @notice Get required protocols for a building type
     * @param buildingType Type of building
     * @return Array of protocol addresses
     */
    function getRequiredProtocols(
        string calldata buildingType
    ) external view returns (address[] memory) {
        address adapter = adapters[buildingType];
        if (adapter == address(0)) revert AdapterNotFound();

        return IBuildingAdapter(adapter).getRequiredProtocols();
    }

    /**
     * @notice Estimate yield for a building
     * @param buildingType Type of building
     * @param buildingId Building ID
     * @return estimatedYield Estimated yield amount
     * @return yieldAsset Yield asset address
     */
    function estimateYield(
        string calldata buildingType,
        uint256 buildingId
    ) external view returns (uint256 estimatedYield, address yieldAsset) {
        address adapter = adapters[buildingType];
        if (adapter == address(0)) revert AdapterNotFound();

        return IBuildingAdapter(adapter).estimateYield(buildingId);
    }

    /**
     * @notice Get count of registered building types
     * @return Number of registered types
     */
    function getBuildingTypeCount() external view returns (uint256) {
        return buildingTypes.length;
    }
}
