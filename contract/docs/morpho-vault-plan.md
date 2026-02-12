# Morpho Vault Building Plan

## Overview

Building type: **"vault"** -- User ฝาก USDC เข้า MetaMorpho Vault (ERC4626)
Vault จัดสรรไป lend หลายตลาดบน Morpho Blue → ได้ yield ~5-12% APY
**ไม่มี lock** -- ฝาก/ถอนได้ตลอด

## ทำไมต้อง Morpho?

- **Yield ดีกว่า Aave ปกติ** 1.5-2x เพราะ optimize allocation ข้ามหลายตลาด
- **MetaMorpho = pure ERC4626** → integrate ง่ายมาก (deposit/withdraw เหมือน ERC20)
- **ไม่ต้องเขียน vault เอง** -- ใช้ vault ที่มีอยู่แล้วบน Base (Spark USDC, Blue Chip USDC, etc.)
- **ต่างจาก Bank (Aave Lending)** ตรงที่ Morpho optimize yield ให้อัตโนมัติ

## Contract Addresses (Base Mainnet)

| Contract | Address |
|---|---|
| Morpho Blue Core | `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb` |
| Spark USDC Vault | `0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A` |
| Blue Chip USDC Vault | `0x8A034f069D59d62a4643ad42E49b846d036468D7` |
| Seamless USDC Vault | `0x616a4E1db48e22028f6bbf20444Cd3b8e3273738` |

> **Testnet:** ไม่มี official deployment บน Base Sepolia → ต้องสร้าง Mock ERC4626

## Architecture

```
User → SmartWallet → VaultAdapter (preparePlace/Harvest/Demolish)
                          |
                    MetaMorpho Vault (ERC4626)
                          |
                    Morpho Blue Markets (auto-allocated)
```

## Interface ที่ใช้

MetaMorpho เป็น **pure ERC4626** -- ไม่ต้องสร้าง interface ใหม่

```solidity
// Deposit
IERC20(usdc).approve(vault, amount);
IERC4626(vault).deposit(amount, receiver);     // → ได้ shares

// Withdraw
IERC4626(vault).withdraw(amount, receiver, owner);  // → ได้ USDC
// หรือ
IERC4626(vault).redeem(shares, receiver, owner);     // → ได้ USDC

// View
IERC4626(vault).convertToAssets(shares);   // shares → USDC value
IERC4626(vault).totalAssets();             // TVL ทั้งหมด
```

## Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `contracts/mocks/MockMorphoVault.sol` | Mock ERC4626 vault สำหรับ test |
| 2 | `contracts/adapters/VaultAdapter.sol` | IBuildingAdapter for "vault" |

## Files to Modify

| File | Change |
|------|--------|
| `ignition/modules/IntegrationContracts.ts` | Deploy MockMorphoVault + VaultAdapter + register |

## MockMorphoVault.sol

ERC4626 ธรรมดา + test helpers:
- `simulateYield(amount)` -- จำลอง yield
- ไม่ต้องมี cooldown / lock / penalty (เพราะ Morpho ไม่มี)
- `totalAssets()` = `USDC.balanceOf(this)`

```solidity
contract MockMorphoVault is ERC4626, Ownable {
    constructor(IERC20 _asset) ERC4626(_asset) ERC20("Mock Morpho USDC", "mmUSDC") {}

    function simulateYield(uint256 amount) external {
        // transfer USDC เข้า vault เพื่อจำลอง yield
        SafeERC20.safeTransferFrom(IERC20(asset()), msg.sender, address(this), amount);
    }
}
```

## VaultAdapter.sol

Follow BankAdapter/LotteryAdapter pattern → implement IBuildingAdapter

**Constructor:** `(address _core, address _morphoVault, address _asset, address _treasury)`

**Structs:**
```solidity
struct PlaceParams { uint256 amount; uint256 x; uint256 y; }
struct HarvestParams { uint256 sharesToRedeem; }
struct DemolishParams { uint256 shares; }
```

### preparePlace → 3 calls:
1. `USDC.approve(vault, amount)`
2. `IERC4626(vault).deposit(amount, smartWallet)`
3. `core.recordBuildingPlacement(user, "vault", USDC, amount, x, y, metadata)`
   - metadata: `abi.encode("morpho_vault", amount)`

### prepareHarvest → 2 calls:
1. `IERC4626(vault).redeem(sharesToRedeem, smartWallet, smartWallet)`
2. `core.recordHarvest(user, buildingId, 0)` -- actual yield tracked off-chain

### prepareDemolish → 2 calls:
1. `IERC4626(vault).redeem(shares, smartWallet, smartWallet)` -- ถอนทั้งหมด
2. `core.recordDemolition(user, buildingId, amount)`

## IntegrationContracts.ts Changes

```typescript
const mockMorphoVault = m.contract("MockMorphoVault", [mockUSDC]);

const vaultAdapter = m.contract("VaultAdapter", [
  defiCityCore, mockMorphoVault, mockUSDC, treasuryAddress
]);

m.call(buildingRegistry, "registerAdapter", [
  "vault", vaultAdapter
], { id: "RegisterVaultAdapter" });
```

## Data Flow

```
Place:  SmartWallet → [USDC.approve, Vault.deposit, Core.record]
        MetaMorpho → allocate USDC across Morpho Blue markets

Harvest: SmartWallet → [Vault.redeem(yieldShares), Core.recordHarvest]
         MetaMorpho → withdraw from markets → USDC to SmartWallet

Demolish: SmartWallet → [Vault.redeem(allShares), Core.recordDemolition]
          MetaMorpho → withdraw all → USDC to SmartWallet
```

## Mainnet vs Testnet

| | Testnet (local/Base Sepolia) | Mainnet (Base) |
|---|---|---|
| Vault | MockMorphoVault | MetaMorpho Vault (e.g., Spark USDC) |
| Adapter | VaultAdapter (same) | VaultAdapter (same) |
| Config | MockMorphoVault address | `0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A` |

VaultAdapter ไม่ต้องเปลี่ยน code -- แค่เปลี่ยน vault address ตอน deploy

## Verification

1. `npx hardhat compile`
2. deposit → ได้ shares
3. simulateYield → share value เพิ่ม
4. redeem → ได้ USDC + yield
5. demolish → ได้ USDC ทั้งหมด
