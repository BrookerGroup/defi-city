// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBuildingAdapter
 * @notice Standard interface for all building type adapters
 * @dev Each building type (Bank, Shop, Lottery) implements this interface
 *      Adapters prepare batched calldata for SmartWallet execution
 */
interface IBuildingAdapter {

    // ============ Core Building Operations ============

    /**
     * @notice Prepare calldata for building placement
     * @dev Returns batch calldata for SmartWallet execution
     * @param user User's EOA address
     * @param userSmartWallet User's SmartWallet address
     * @param params Encoded parameters specific to building type
     * @return targets Array of target addresses
     * @return values Array of ETH values
     * @return datas Array of encoded calls
     */
    function preparePlace(
        address user,
        address userSmartWallet,
        bytes calldata params
    ) external view returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    );

    /**
     * @notice Prepare calldata for harvesting rewards
     * @param user User's EOA address
     * @param userSmartWallet User's SmartWallet address
     * @param buildingId Building ID
     * @param params Encoded harvest parameters
     * @return targets Array of target addresses
     * @return values Array of ETH values
     * @return datas Array of encoded calls
     */
    function prepareHarvest(
        address user,
        address userSmartWallet,
        uint256 buildingId,
        bytes calldata params
    ) external view returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    );

    /**
     * @notice Prepare calldata for building demolition
     * @param user User's EOA address
     * @param userSmartWallet User's SmartWallet address
     * @param buildingId Building ID
     * @param params Encoded demolish parameters
     * @return targets Array of target addresses
     * @return values Array of ETH values
     * @return datas Array of encoded calls
     */
    function prepareDemolish(
        address user,
        address userSmartWallet,
        uint256 buildingId,
        bytes calldata params
    ) external view returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    );

    // ============ View Functions ============

    /**
     * @notice Get building type identifier
     * @return Building type string (e.g., "bank", "shop", "lottery")
     */
    function getBuildingType() external view returns (string memory);

    /**
     * @notice Get required protocols for this building type
     * @return Array of protocol addresses (e.g., [AavePool, USDC])
     */
    function getRequiredProtocols() external view returns (address[] memory);

    /**
     * @notice Validate building placement parameters
     * @param params Encoded parameters
     * @return isValid True if parameters are valid
     * @return reason Error message if invalid
     */
    function validatePlacement(
        bytes calldata params
    ) external view returns (bool isValid, string memory reason);

    /**
     * @notice Estimate yield/rewards for a building
     * @param buildingId Building ID
     * @return estimatedYield Estimated yield amount
     * @return yieldAsset Asset address for yield
     */
    function estimateYield(
        uint256 buildingId
    ) external view returns (uint256 estimatedYield, address yieldAsset);

    // ============ Fee Management ============

    /**
     * @notice Get placement fee for this building type (in basis points)
     * @return feeBps Fee in basis points (e.g., 5 = 0.05%, 100 = 1%)
     */
    function getPlacementFee() external view returns (uint256 feeBps);

    /**
     * @notice Calculate fee amount for a given value
     * @param amount Amount to calculate fee on
     * @return feeAmount Fee amount to collect
     * @return netAmount Amount after fee deduction
     */
    function calculateFee(
        uint256 amount
    ) external view returns (uint256 feeAmount, uint256 netAmount);

    /**
     * @notice Get treasury address for this adapter
     * @return Treasury address where fees are sent
     */
    function getTreasury() external view returns (address);
}
