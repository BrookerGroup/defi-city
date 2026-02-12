// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockMorphoVault
 * @notice Mock ERC4626 vault simulating MetaMorpho for testing
 * @dev Pure ERC4626 — deposit/withdraw freely, no lock, no cooldown
 *      Use simulateYield() to add USDC and increase share value
 *      On mainnet, replace with real MetaMorpho vault address
 */
contract MockMorphoVault is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    constructor(
        IERC20 _asset
    )
        ERC20("Mock Morpho USDC Vault", "mmUSDC")
        ERC4626(_asset)
        Ownable(msg.sender)
    {}

    /**
     * @notice Decimals offset for inflation attack protection (USDC = 6 decimals)
     */
    function _decimalsOffset() internal pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Simulate yield by transferring USDC into the vault
     * @dev Increases totalAssets() → share value goes up for all holders
     * @param amount Amount of USDC to add as yield
     */
    function simulateYield(uint256 amount) external {
        SafeERC20.safeTransferFrom(IERC20(asset()), msg.sender, address(this), amount);
    }
}
