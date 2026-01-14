# DeFi City Builder - Product Requirements Document

## Overview

**DeFi City** เป็นเกม City Builder ที่ทำให้การบริหารเงินบน DeFi เป็นเรื่องง่ายและสนุก

### Core Concept

| Game | DeFi |
|------|------|
| เมือง (City) | Portfolio |
| อาคาร (Building) | DeFi Position |
| รายได้ (Income) | Yield |

---

## Target Users

- **Web3 Beginners**: สนใจ DeFi แต่ไม่รู้จะเริ่มยังไง
- **Passive Investors**: ต้องการ yield โดยไม่ต้องเรียนรู้ protocol ที่ซับซ้อน
- **Gamers**: ชอบเกม City Builder และต้องการ earn real crypto

---

## Building Types

### Phase 1 Buildings (3 Types)

| ID | Building | Protocol | Function |
|----|----------|----------|----------|
| 0 | 🏛️ Town Hall | - | Deposit / Withdraw |
| 1 | 🏦 Bank | Aave V3 | Lending / Borrow |
| 2 | 🏪 Shop | Aerodrome | LP Provide |

### Building Details

```
┌─────────────────────────────────────────────────────────┐
│  🏛️ TOWN HALL                                          │
├─────────────────────────────────────────────────────────┤
│  Protocol:    None                                      │
│  Function:    Wallet - ศูนย์กลางเก็บเงินของ user        │
│                                                         │
│  Features:                                              │
│  • deposit()   → ฝากเงินเข้า wallet                    │
│  • withdraw()  → ถอนเงินออก wallet                     │
│                                                         │
│  Notes:                                                 │
│  • ต้องมี Town Hall ก่อนสร้างตึกอื่น                    │
│  • เก็บ USDC/ETH ไว้ใช้สร้างตึกอื่น                    │
│  • ไม่มี yield                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🏦 BANK (Aave V3)                                     │
├─────────────────────────────────────────────────────────┤
│  Protocol:    Aave V3 (Base)                           │
│  Asset:       USDC                                      │
│                                                         │
│  Features:                                              │
│  • supply()    → ฝาก USDC รับดอกเบี้ย (~3-6% APY)      │
│  • withdraw()  → ถอน USDC + ดอกเบี้ย                   │
│  • borrow()    → กู้ USDC (ใช้ aUSDC เป็น collateral)  │
│  • repay()     → คืนเงินกู้                             │
│                                                         │
│  Risk:        🟢 Low                                   │
│  Min:         100 USDC                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🏪 SHOP (Aerodrome)                                   │
├─────────────────────────────────────────────────────────┤
│  Protocol:    Aerodrome (Base Native DEX)              │
│  Asset:       USDC + ETH                                │
│                                                         │
│  Features:                                              │
│  • addLiquidity()    → Provide LP (USDC/ETH pair)      │
│  • removeLiquidity() → ถอน LP คืนเป็น USDC + ETH       │
│  • claimRewards()    → เก็บ AERO rewards + fees        │
│                                                         │
│  Risk:        🟡 Medium (Impermanent Loss)             │
│  Min:         500 USDC                                  │
│  APY:         15-30% (AERO emissions + trading fees)   │
└─────────────────────────────────────────────────────────┘
```

---

## Protocol Mapping

```
┌─────────────────────────────────────────────────────────┐
│                  BUILDING → PROTOCOL                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🏛️ Town Hall ────────▶ Smart Wallet                   │
│     │                      │                            │
│     │  deposit()           │  รับ USDC/ETH จาก user    │
│     │  withdraw()          │  ส่ง USDC/ETH กลับ user   │
│                                                         │
│  🏦 Bank ─────────────▶ Aave V3 (Base)                 │
│     │                      │                            │
│     │  supply()            │  ฝาก USDC → ได้ aUSDC     │
│     │  withdraw()          │  ถอน aUSDC → ได้ USDC     │
│     │  borrow()            │  กู้ USDC (collateral)    │
│     │  repay()             │  คืนเงินกู้                │
│                                                         │
│  🏪 Shop ─────────────▶ Aerodrome (Base)              │
│     │                      │                            │
│     │  addLiquidity()      │  USDC+ETH → LP Token      │
│     │  removeLiquidity()   │  LP Token → USDC+ETH      │
│     │  claimRewards()      │  เก็บ AERO + fees         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Base Mainnet Addresses

```solidity
// Aave V3
AAVE_POOL = 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5
USDC      = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
aUSDC     = 0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB

// Aerodrome (Base Native DEX)
AERO_ROUTER = 0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43
AERO_FACTORY = 0x420DD381b31aEf6683db6B902084cB0FFECe40Da
AERO_TOKEN = 0x940181a94A35A4569E4529A3CDfB74e38FD98631
WETH       = 0x4200000000000000000000000000000000000006
```

---

## Fee Structure

| Fee Type | Rate | When |
|----------|------|------|
| Building Fee | 0.05% | เมื่อสร้างตึก (place building) |

```
User สร้าง Bank:
├── Deposit:     1,000 USDC
├── Fee (0.05%):   0.5 USDC → Treasury
├── Net to Aave: 999.5 USDC
└── User gets:   aUSDC worth 999.5 USDC

หลังจากนั้น:
├── Harvest yield: ฟรี (100% ของ yield)
├── Withdraw:      ฟรี (100% ของ principal + yield)
└── Demolish:      ฟรี
```

---

## Smart Contract Architecture

**Version:** 1.0 - Modular Architecture (No Proxy)

```
┌─────────────────────────────────────────────────────────┐
│                      DEFICITY                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐                                       │
│  │   User      │                                       │
│  └──────┬──────┘                                       │
│         │                                              │
│         ▼                                              │
│  ┌─────────────────────────────────────────────┐      │
│  │         DefiCityCore (Immutable State)      │      │
│  │  • placeBuilding()                          │      │
│  │  • deposit()                                │      │
│  │  • harvest()                                │      │
│  │  • demolish()                               │      │
│  │  • emergencyWithdraw()                      │      │
│  │  • updateModules() [Admin]                  │      │
│  └──────────────────┬──────────────────────────┘      │
│                     │                                  │
│         ┌───────────┼──────────┬──────────┐           │
│         ▼           ▼          ▼          ▼           │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐    │
│  │ Strategy │ │ Building │ │  Fee   │ │Emergency│    │
│  │ Registry │ │ Manager  │ │Manager │ │ Manager │    │
│  │(Swappable)│ │(Swappable)│ │(Swap) │ │(Swap)  │    │
│  └────┬─────┘ └──────────┘ └────────┘ └────────┘    │
│       │                                               │
│       │ (Dynamic Routing)                             │
│       │                                               │
│       ├───────────┬───────────┐                       │
│       ▼           ▼           ▼                       │
│  ┌─────────┐ ┌──────────────┐                        │
│  │  Aave   │ │  Aerodrome   │                        │
│  │Strategy │ │  Strategy    │                        │
│  └────┬────┘ └──────┬───────┘                        │
│       │             │                                 │
│       ▼             ▼                                 │
│  ┌─────────┐ ┌─────────────┐                         │
│  │ Aave V3 │ │  Aerodrome  │                         │
│  │  Pool   │ │   Router    │                         │
│  └─────────┘ └─────────────┘                         │
│                                                       │
└─────────────────────────────────────────────────────────┘
```

### Contract Files

| Contract | Path | Description |
|----------|------|-------------|
| DefiCityCore | `src/DefiCityCore.sol` | Core state storage (immutable) |
| StrategyRegistry | `src/StrategyRegistry.sol` | Strategy routing (swappable) |
| BuildingManager | `src/BuildingManager.sol` | Building logic (swappable) |
| FeeManager | `src/FeeManager.sol` | Fee calculation (swappable) |
| EmergencyManager | `src/EmergencyManager.sol` | Emergency withdrawals (swappable) |
| IStrategy | `src/interfaces/IStrategy.sol` | Strategy interface |
| AaveStrategy | `src/strategies/AaveStrategy.sol` | Aave integration |
| AerodromeStrategy | `src/strategies/AerodromeStrategy.sol` | Aerodrome LP integration |
| DefiCityWallet | `src/wallet/DefiCityWallet.sol` | ERC-4337 Smart Wallet (UUPS) |
| DefiCityPaymaster | `src/wallet/DefiCityPaymaster.sol` | Gas sponsorship |

### Architecture Benefits

**Modular design with no proxy overhead:**

| Feature | Value |
|---------|-------|
| **Gas Cost** | ~220k per transaction |
| **Upgradeability** | ✅ Modular (strategies + managers) |
| **Strategy Updates** | Register new version in registry |
| **Emergency Pause** | ✅ Yes |
| **State Safety** | ✅ Immutable core |
| **Complexity** | ⭐⭐ Moderate |

---

## Dynamic Building Types

Building types ไม่ hardcode เป็น enum แต่สามารถเพิ่ม/ลดได้ผ่าน admin functions:

```solidity
// Add new building type
function addBuildingType(
    string memory name,      // "Bank"
    address strategy,        // AaveStrategy address
    uint256 minDeposit,      // 100 USDC
    uint256 maxPerUser,      // 10
    bool canDemolish         // true
) external onlyOwner returns (uint256 buildingTypeId);

// Update existing building type
function updateBuildingType(
    uint256 buildingType,
    address strategy,
    uint256 minDeposit,
    uint256 maxPerUser
) external onlyOwner;

// Activate/deactivate building type
function setBuildingTypeActive(uint256 buildingType, bool isActive) external onlyOwner;
```

### Example: Adding New Building Types

```solidity
// Deploy Phase 1 buildings
core.addBuildingType("Town Hall", address(0), 0, 1, false);           // ID: 0
core.addBuildingType("Bank", aaveStrategy, 100e6, 10, true);          // ID: 1
core.addBuildingType("Shop", aerodromeStrategy, 500e6, 5, true);      // ID: 2
```

---

## User Flow

### 1. Connect Wallet

```
┌─────────────────────────────────────────────────────────┐
│                    🎮 DeFi City                         │
│                                                         │
│         ┌─────────────────────────────┐                │
│         │   🦊 Connect with MetaMask  │                │
│         └─────────────────────────────┘                │
│         ┌─────────────────────────────┐                │
│         │   📧 Connect with Email     │                │
│         └─────────────────────────────┘                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Create Smart Wallet (ERC-4337)

```
User connects
      │
      ▼
Check wallet exists?
      │
      ├── Yes → Load game
      │
      └── No → Create Smart Wallet (gasless)
                    │
                    ▼
              Load game
```

### 3. Play Game

```
┌─────────────────────────────────────────────────────────┐
│  💰 2500 USDC    ◇ 1.50 ETH           🔗 Connected     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              🏛️                                        │
│           Town Hall                                     │
│                                                         │
│     🏦              🏪                                  │
│    Bank            Shop                                 │
│   +5.2% APY       +15% APY                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [🏛️ Town Hall] [🏦 Bank] [🏪 Shop]                   │
└─────────────────────────────────────────────────────────┘
```

### 4. Build → Deposit → Earn

```
User clicks "Build Bank"
      │
      ▼
Enter deposit amount: 1000 USDC
      │
      ▼
DefiCityCore.placeBuilding(1, 1000e6)
      │
      ├── Deduct fee: 0.5 USDC → Treasury
      │
      └── AaveStrategy.deposit(999.5 USDC)
                │
                ▼
          Aave Pool.supply(USDC)
                │
                ▼
          User gets aUSDC (earning yield)
```

---

## Sequence Diagrams

### Place Building

```
User          Frontend       DefiCityCore      AaveStrategy       Aave
  │               │                │                │               │
  │ Build Bank    │                │                │               │
  │──────────────▶│ placeBuilding()│                │               │
  │               │───────────────▶│ transfer USDC  │               │
  │               │                │───────────────▶│               │
  │               │                │                │ supply()      │
  │               │                │                │──────────────▶│
  │               │                │                │◀──────────────│
  │               │                │◀───────────────│               │
  │               │◀───────────────│                │               │
  │◀──────────────│                │                │               │
  │ Building placed                │                │               │
```

### Harvest Yield

```
User          Frontend       DefiCityCore      AaveStrategy
  │               │                │                │
  │ Harvest       │                │                │
  │──────────────▶│ harvest()      │                │
  │               │───────────────▶│ harvest()      │
  │               │                │───────────────▶│
  │               │                │                │ (calculate)
  │               │                │◀───────────────│
  │               │◀───────────────│                │
  │◀──────────────│                │                │
  │ Yield received│                │                │
```

---

## Technical Stack

### Smart Contracts
- Solidity 0.8.20
- Foundry (forge, cast)
- OpenZeppelin Contracts

### Frontend
- React + Vite
- PixiJS (Game rendering)
- wagmi + viem (Web3)
- TailwindCSS

### Blockchain
- Base Mainnet (Primary)
- Base Sepolia (Testnet)

---

## Development Status

### Smart Contracts

| Component | Status |
|-----------|--------|
| DefiCityCore | ✅ Done |
| StrategyRegistry | ✅ Done |
| BuildingManager | ✅ Done |
| FeeManager | ✅ Done |
| EmergencyManager | ✅ Done |
| IStrategy | ✅ Done |
| AaveStrategy | 🔄 Need update |
| AerodromeStrategy | 🔄 Need update |
| DefiCityWallet | ✅ Done (UUPS) |
| DefiCityPaymaster | ✅ Done |

### Frontend

| Component | Status |
|-----------|--------|
| Game UI (React) | ✅ Done |
| Landing Page | ✅ Done |
| Contract Integration | ⏳ Pending |

---

## Roadmap

### Phase 1: MVP (Current)
- [x] Modular Architecture Design
- [x] DefiCityCore (immutable state)
- [x] StrategyRegistry (swappable routing)
- [x] BuildingManager (swappable logic)
- [x] FeeManager (swappable fees)
- [x] EmergencyManager (emergency pause)
- [x] Smart Wallet (ERC-4337)
- [x] Game UI with PixiJS
- [ ] Update strategies for compatibility
- [ ] Deployment script
- [ ] Tests
- [ ] Testnet deployment (Base Sepolia)

### Phase 2: Launch
- [ ] Update frontend for contracts
- [ ] Audit smart contracts ($40k-60k)
- [ ] Mainnet deployment (Base)
- [ ] Add more building types (Factory, Temple, Castle)
- [ ] Mobile responsive UI
- [ ] Setup Multisig + Timelock governance

### Phase 3: Growth
- [ ] More DeFi protocols (Curve, Compound, Lido)
- [ ] Migration tools for strategy upgrades
- [ ] Social features
- [ ] Leaderboards
- [ ] Cross-chain support

---

## Revenue Model

| Source | Rate |
|--------|------|
| Building Creation Fee | 0.05% of deposit |

---

*Last Updated: January 2025*
*Version: 1.0 - Modular Architecture (No Proxy)*
