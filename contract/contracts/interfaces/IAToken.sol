// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IAToken
 * @notice Interface for Aave V3 aToken
 * @dev aTokens are interest-bearing tokens minted when supplying to Aave
 *
 * Epic 4 Support: US-013, US-014 (View balances)
 */
interface IAToken is IERC20 {
    /**
     * @notice Returns the scaled balance of the user
     * @param user The address of the user
     * @return The scaled balance
     */
    function scaledBalanceOf(address user) external view returns (uint256);

    /**
     * @notice Returns the principal balance of the user
     * @param user The address of the user
     * @return The principal balance (without interest)
     */
    function balanceOf(address user) external view override returns (uint256);
}
