# DefiCity Smart Contract — Deployment Status

> Last updated: 2026-02-17

---

## Architecture Overview

```
DefiCityCore (Game State)
├── BuildingRegistry (Adapter Router)
├── WalletFactory (CREATE2 SmartWallet)
│
├── BankAdapter ──────── Aave V3 (supply/borrow)
├── LotteryAdapter ───── Megapot (lottery tickets)
├── ShopAdapter ──────── Aerodrome (LP + rewards)
├── UniswapLPAdapter ─── Uniswap V3 (LP positions)
├── SwapAdapter ──────── Uniswap V3 (token swaps)
├── VaultAdapter ─────── Morpho MetaMorpho (ERC4626 yield vault)
└── StakingAdapter ───── Pendle (PT fixed yield)
```

---

## Contract Inventory

### Core Contracts

| Contract | File | Description |
|---|---|---|
| DefiCityCore | `contracts/core/DefiCityCore.sol` | Game state: buildings, user stats, grid |
| BuildingRegistry | `contracts/core/BuildingRegistry.sol` | Routes building type → adapter |
| WalletFactory | `contracts/factory/WalletFactory.sol` | CREATE2 deterministic wallet deployment |
| SmartWallet | `contracts/wallet/SmartWallet.sol` | ERC-4337 wallet with session keys + batch execution |

### Building Adapters

| Adapter | File | Building Type | Protocol | Testnet Mock |
|---|---|---|---|---|
| BankAdapter | `contracts/adapters/BankAdapter.sol` | `bank` | Aave V3 | MockAavePool |
| LotteryAdapter | `contracts/adapters/LotteryAdapter.sol` | `lottery` | Megapot | MockMegapot |
| ShopAdapter | `contracts/adapters/ShopAdapter.sol` | `shop` | Aerodrome | MockAerodromeRouter |
| VaultAdapter | `contracts/adapters/VaultAdapter.sol` | `vault` | Morpho (ERC4626) | MockMorphoVault |
| StakingAdapter | `contracts/adapters/StakingAdapter.sol` | `staking` | Pendle (PT) | MockPendleRouter |

### Utility Adapters (No Building Placement)

| Adapter | File | Protocol |
|---|---|---|
| SwapAdapter | `contracts/adapters/SwapAdapter.sol` | Uniswap V3 SwapRouter02 |
| LPAdapter | `contracts/adapters/LPAdapter.sol` | Uniswap V3 NonfungiblePositionManager |
| UniswapLPBuildingAdapter | `contracts/adapters/UniswapLPBuildingAdapter.sol` | Uniswap V3 LP (building type: `lp`) |

### Mock Contracts (Testnet Only)

| Mock | File | Simulates |
|---|---|---|
| MockAavePool | `contracts/mocks/MockAavePool.sol` | Aave V3 Pool |
| MockMegapot | `contracts/mocks/MockMegapot.sol` | Megapot Lottery |
| MockAerodromeRouter | `contracts/mocks/MockAerodromeRouter.sol` | Aerodrome DEX |
| MockAerodromePair | `contracts/mocks/MockAerodromePair.sol` | Aerodrome LP Pair |
| MockAerodromeGauge | `contracts/mocks/MockAerodromeGauge.sol` | Aerodrome Gauge |
| MockMorphoVault | `contracts/mocks/MockMorphoVault.sol` | MetaMorpho ERC4626 Vault |
| MockPendleRouter | `contracts/mocks/MockPendleRouter.sol` | Pendle Router V4 (+ MockPT, MockPendleMarket) |
| MockEntryPoint | `contracts/mocks/MockEntryPoint.sol` | ERC-4337 EntryPoint |
| MockERC20 | `contracts/MockERC20.sol` | Generic ERC20 token |

---

## Deployment Status by Network

### Base Sepolia (Testnet) — Chain ID: 84532

#### Core Contracts — DEPLOYED

| Contract | Address | Status |
|---|---|---|
| EntryPoint (v0.6) | `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` | Official (shared) |
| DefiCityCore | `0xf9678a801Bf0E16C3781157A859741B87c9bC8eF` | Deployed |
| WalletFactory | `0xdA507eDd7A24Fe36f2f3d8EC47FC29b3dFa76c85` | Deployed |
| BuildingRegistry | `0x90e4f5c8A17F896641A51Df540a54DB5df6C807B` | Deployed |
| Treasury | `0x05CA1c1250e1515e56B3Fd5946bB59cAd0fa7e76` | Deployer wallet |

Deployer: `0x05CA1c1250e1515e56B3Fd5946bB59cAd0fa7e76`
Deployed: 2026-01-27
File: `deployments/baseSepolia-core.json`

#### Aave — DEPLOYED (Real Protocol on Sepolia)

| Contract | Address |
|---|---|
| BankAdapter | `0xf616fc3AcDa7d33533FF17ba73745a6cF3f8b7ad` |
| Aave Pool | `0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27` |
| Aave Pool Addresses Provider | `0xE4C23309117Aa30342BFaae6c95c6478e0A4Ad00` |
| Aave Data Provider | `0xBc9f5b7E248451CdD7cA54e717a2BFe1F32b566b` |
| USDC (Aave testnet) | `0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f` |

#### Megapot — DEPLOYED (Real Protocol on Sepolia)

| Contract | Address |
|---|---|
| Megapot | `0x6f03c7BCaDAdBf5E6F5900DA3d56AdD8FbDac5De` |
| MPUSDC | `0xA4253E7C13525287C56550b8708100f93E60509f` |

Note: LotteryAdapter address is not recorded in deployment files.

#### Uniswap V3 — DEPLOYED (Real Protocol on Sepolia)

| Contract | Address |
|---|---|
| SwapAdapter | `0xf692caBc47D0E05DeDEeF8e39Ef762E7a4940f35` |
| SwapRouter02 | `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4` |
| QuoterV2 | `0xC5290058841028F1614F3A6F0F5816cAd0df5E27` |
| Uniswap V3 Factory | `0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24` |
| NonfungiblePositionManager | `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2` |

File: `deployments/baseSepolia-uniswap.json`

#### Morpho (Vault) — NOT DEPLOYED

VaultAdapter + MockMorphoVault ยังไม่ได้ deploy บน Base Sepolia

#### Pendle (Staking) — NOT DEPLOYED

StakingAdapter + MockPendleRouter ยังไม่ได้ deploy บน Base Sepolia

---

### Localhost — Chain ID: 31337

Mock deployment สำหรับ local testing

| Category | Contracts | Addresses |
|---|---|---|
| Core | EntryPoint, Core, Factory | See `deployments/localhost-aave-megapot-aerodrome.json` |
| Tokens | MockUSDC, MockWETH, MockAERO | See deployment file |
| Mocks | MockAavePool, MockMegapot, MockAerodromeRouter | See deployment file |
| Adapters | BankAdapter, LotteryAdapter, ShopAdapter | See deployment file |

Note: VaultAdapter, StakingAdapter, UniswapLP ไม่ได้อยู่ใน localhost deployment

---

### Base Mainnet — Chain ID: 8453

**NOT DEPLOYED** — ยังไม่มี contract ใดถูก deploy บน mainnet

---

## Test Coverage

| Test File | Adapter | Tests | Status |
|---|---|---|---|
| `test/VaultAdapter.test.ts` | VaultAdapter (Morpho) | 29 | Passing |
| `test/StakingAdapter.test.ts` | StakingAdapter (Pendle) | 29 | Passing |
| BankAdapter | — | — | No tests |
| LotteryAdapter | — | — | No tests |
| ShopAdapter | — | — | No tests |
| UniswapLPBuildingAdapter | — | — | No tests |

---

## Deployment Scripts

| Script | Description |
|---|---|
| `ignition/modules/CoreContracts.ts` | Ignition: Core contracts deployment |
| `ignition/modules/IntegrationContracts.ts` | Ignition: All mocks + adapters (deploys everything) |
| `scripts/deploy-base-sepolia.js` | Legacy: Core contracts to Base Sepolia |
| `scripts/deploy.js` | Legacy: Full localhost deployment |
| `scripts/auto-verify-wallets.ts` | Verify contracts on BaseScan |
| `scripts/verify-contracts.ts` | Contract verification helper |

---

## Deployment Guide

### Option A: Deploy Morpho + Pendle to Base Sepolia (Mock)

Deploy MockMorphoVault, MockPendleRouter, VaultAdapter, StakingAdapter แยกจาก Core ที่มีอยู่แล้ว

สร้าง deploy script ใหม่ที่:
1. Deploy MockMorphoVault ชี้ไป USDC testnet (`0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f`)
2. Deploy MockPendleRouter ชี้ไป USDC testnet
3. Deploy VaultAdapter ชี้ไป Core (`0xf9678a801Bf0E16C3781157A859741B87c9bC8eF`) + MockMorphoVault
4. Deploy StakingAdapter ชี้ไป Core + MockPendleRouter
5. Register adapters ใน BuildingRegistry (`0x90e4f5c8A17F896641A51Df540a54DB5df6C807B`)
6. บันทึก addresses ลง `deployments/baseSepolia-morpho-pendle.json`

Estimated cost: ~$0.01 (Base Sepolia testnet gas is free via faucet)

### Option B: Deploy ทั้งระบบขึ้น Base Mainnet (Real Protocols)

Deploy Core contracts + adapters ทั้งหมดชี้ไป protocol จริง

#### Real Protocol Addresses บน Base Mainnet

| Protocol | Contract | Address |
|---|---|---|
| EntryPoint v0.6 | Official | `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` |
| **USDC** | Native USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| **Aave V3** | Pool | ต้องหา address จาก Aave docs สำหรับ Base |
| **Megapot** | Lottery | ต้อง verify ว่ามีบน Base mainnet |
| **Uniswap V3** | SwapRouter02 | `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4` (same on Base) |
| **Uniswap V3** | NonfungiblePositionManager | `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2` |
| **Morpho** | Gauntlet USDC Core Vault | `0xc0c5689e6f4D256E861F65465b691aeEcC0dEb12` |
| **Morpho** | Seamless USDC Vault | `0x616a4E1db48e22028f6bbf20444Cd3b8e3273738` |
| **Morpho** | Spark USDC Vault | `0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A` |
| **Pendle** | Router V4 | `0x888888888889758F76e7103c6CbF23ABbF58F946` |
| **Pendle** | Market Factory V6 | `0x81E80A50E56d10C501fF17B5Fe2F662bd9EA4590` |

Steps:
1. Deploy Core: BuildingRegistry, DefiCityCore, WalletFactory
2. Deploy Adapters ชี้ไป protocol จริง (ไม่ต้องมี mock)
3. Register ทุก adapter ใน BuildingRegistry
4. Update frontend addresses
5. Verify contracts on BaseScan

Estimated cost: ~$0.10-0.50 (~5-20 THB)

### Option C: Fork Base Mainnet บน Local

ทดสอบกับ protocol จริง โดยไม่เสียเงิน

```bash
npx hardhat node --fork https://mainnet.base.org
```

จากนั้น deploy adapters ชี้ไป protocol จริงบน forked chain — ทดสอบ flow ครบก่อน deploy mainnet จริง

---

## Known Issues

### StakingAdapter — PT Receiver Bug

`preparePlace` ส่ง PT ไปที่ **user EOA** (receiver = user) แต่ `prepareDemolish` execute จาก **SmartWallet** ซึ่งต้องถือ PT เพื่อ `burn(msg.sender)`

**Impact**: ต้อง transfer PT จาก EOA → SmartWallet ก่อนจะ demolish ได้
**Fix**: เปลี่ยน receiver ใน `preparePlace` จาก `user` เป็น `userSmartWallet`
