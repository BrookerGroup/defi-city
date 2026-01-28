# DeFi City - Contract Architecture & Flow Diagrams

## Table of Contents
1. [Create Town Hall (First Time Setup)](#1-create-town-hall-first-time-setup)
2. [Deposit Asset (EOA → AA Wallet)](#2-deposit-asset-eoa--aa-wallet)
3. [Create Bank Building (Supply to Aave)](#3-create-bank-building-supply-to-aave)
4. [Harvest Bank Rewards (Withdraw from Aave)](#4-harvest-bank-rewards-withdraw-from-aave)
5. [Demolish Bank Building (Full Withdrawal)](#5-demolish-bank-building-full-withdrawal)
6. [Withdraw Asset (AA Wallet → EOA)](#6-withdraw-asset-aa-wallet--eoa)
7. [Key Architecture Points](#key-architecture-points)

---

## 1️⃣ Create Town Hall (First Time Setup)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Privy
    participant WalletFactory
    participant SmartWallet
    participant DefiCityCore

    User->>Frontend: Click "Create Town Hall"
    Frontend->>Privy: Get EOA address
    Privy-->>Frontend: EOA address

    Frontend->>WalletFactory: createWallet(EOA)
    WalletFactory->>SmartWallet: Deploy new SmartWallet
    SmartWallet-->>WalletFactory: SmartWallet address
    WalletFactory->>DefiCityCore: registerWallet(EOA, SmartWallet)
    DefiCityCore-->>WalletFactory: Wallet registered
    WalletFactory-->>Frontend: SmartWallet address

    Frontend->>SmartWallet: execute(recordBuildingPlacement)
    SmartWallet->>DefiCityCore: recordBuildingPlacement("townhall", x, y)
    DefiCityCore->>DefiCityCore: Validate SmartWallet
    DefiCityCore->>DefiCityCore: Create building record
    DefiCityCore->>DefiCityCore: userBuildings[user].push(buildingId)
    DefiCityCore-->>SmartWallet: buildingId
    SmartWallet-->>Frontend: Success

    Frontend->>User: Show Town Hall on grid
```

**Key Points:**
- First-time user setup
- WalletFactory deploys deterministic SmartWallet for user
- DefiCityCore tracks EOA ↔ SmartWallet mapping
- Town Hall is the first building (no asset required)

---

## 2️⃣ Deposit Asset (EOA → AA Wallet)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant EOA as User's EOA
    participant Token as ERC20 Token
    participant SmartWallet as AA Wallet

    User->>Frontend: Click "Deposit 100 USDC"
    Frontend->>Frontend: Get EOA & SmartWallet addresses

    Frontend->>Token: approve(SmartWallet, 100 USDC)
    Note over Frontend,Token: Signed by EOA
    Token-->>Frontend: Approval confirmed

    Frontend->>Token: transfer(SmartWallet, 100 USDC)
    Note over Frontend,Token: Signed by EOA
    Token->>Token: balanceOf[EOA] -= 100
    Token->>Token: balanceOf[SmartWallet] += 100
    Token-->>Frontend: Transfer success

    Frontend->>User: ✅ Deposited 100 USDC to AA Wallet
```

**Key Points:**
- User transfers assets from EOA to SmartWallet
- Required before building placement
- Simple ERC20 transfer pattern

---

## 3️⃣ Create Bank Building (Supply to Aave)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant BankAdapter
    participant SmartWallet as AA Wallet
    participant USDC
    participant AavePool
    participant DefiCityCore

    User->>Frontend: Create Bank (10 USDC at x,y)

    Note over Frontend,BankAdapter: Step 1: Prepare Batch Data
    Frontend->>BankAdapter: preparePlace(user, SmartWallet, params)
    Note over BankAdapter: View function - No state change
    BankAdapter->>BankAdapter: _prepareSupply()
    BankAdapter-->>Frontend: (targets[], values[], datas[])
    Note over Frontend: targets = [USDC, AavePool, Core]<br/>datas = [approve(), supply(), record()]

    Note over Frontend,DefiCityCore: Step 2: Execute Batch
    Frontend->>SmartWallet: executeBatch(targets, values, datas)
    Note over SmartWallet: msg.sender = EOA owner

    SmartWallet->>SmartWallet: Verify owner

    loop For each target
        Note over SmartWallet,DefiCityCore: Execute sequentially

        alt Transaction 1: Approve
            SmartWallet->>USDC: approve(AavePool, 10 USDC)
            Note over SmartWallet,USDC: msg.sender = SmartWallet
            USDC-->>SmartWallet: Approval success
        end

        alt Transaction 2: Supply
            SmartWallet->>AavePool: supply(USDC, 10, SmartWallet, 0)
            Note over SmartWallet,AavePool: msg.sender = SmartWallet
            AavePool->>USDC: transferFrom(SmartWallet, Pool, 10)
            AavePool->>AavePool: Mint aUSDC to SmartWallet
            AavePool-->>SmartWallet: Supply success
        end

        alt Transaction 3: Record Building
            SmartWallet->>DefiCityCore: recordBuildingPlacement(...)
            Note over SmartWallet,DefiCityCore: msg.sender = SmartWallet
            DefiCityCore->>DefiCityCore: Validate SmartWallet == userSmartWallets[user]
            DefiCityCore->>DefiCityCore: buildings[id] = Building(...)
            DefiCityCore->>DefiCityCore: userBuildings[user].push(id)
            DefiCityCore->>DefiCityCore: userGridBuildings[user][x][y] = id
            DefiCityCore-->>SmartWallet: buildingId
        end
    end

    SmartWallet-->>Frontend: Success
    Frontend->>Frontend: Refetch buildings
    Frontend->>User: ✅ Bank created at (x,y)
```

**Key Points:**
- **BankAdapter.preparePlace()** is view-only, returns batch data
- **SmartWallet.executeBatch()** executes all 3 transactions atomically
- If any transaction fails, entire batch reverts
- SmartWallet receives aUSDC (yield-bearing token)
- DefiCityCore validates msg.sender == userSmartWallet

**Important:** BankAdapter is NOT called during execution - it's only used to prepare the batch!

---

## 4️⃣ Harvest Bank Rewards (Withdraw from Aave)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant BankAdapter
    participant SmartWallet as AA Wallet
    participant AavePool
    participant aToken as aUSDC
    participant DefiCityCore

    User->>Frontend: Click "Harvest" (Withdraw 5 USDC)

    Note over Frontend,BankAdapter: Step 1: Prepare Harvest Batch
    Frontend->>BankAdapter: prepareHarvest(user, SmartWallet, buildingId, params)
    Note over BankAdapter: View function only
    BankAdapter->>DefiCityCore: buildings(buildingId)
    DefiCityCore-->>BankAdapter: Building data
    BankAdapter->>BankAdapter: Validate building owner
    BankAdapter-->>Frontend: (targets[], values[], datas[])
    Note over Frontend: targets = [AavePool, Core]<br/>datas = [withdraw(), recordHarvest()]

    Note over Frontend,DefiCityCore: Step 2: Execute Batch
    Frontend->>SmartWallet: executeBatch(targets, values, datas)

    loop For each target
        alt Transaction 1: Withdraw from Aave
            SmartWallet->>AavePool: withdraw(USDC, 5, SmartWallet)
            Note over SmartWallet,AavePool: msg.sender = SmartWallet
            AavePool->>aToken: Burn 5 aUSDC from SmartWallet
            AavePool->>AavePool: Transfer 5 USDC to SmartWallet
            AavePool-->>SmartWallet: Withdrawal success
        end

        alt Transaction 2: Record Harvest
            SmartWallet->>DefiCityCore: recordHarvest(user, buildingId, amount)
            Note over SmartWallet,DefiCityCore: msg.sender = SmartWallet
            DefiCityCore->>DefiCityCore: Validate SmartWallet
            DefiCityCore->>DefiCityCore: userStats[user].totalHarvested += 5
            DefiCityCore-->>SmartWallet: Success
        end
    end

    SmartWallet-->>Frontend: Success
    Frontend->>User: ✅ Harvested 5 USDC
```

**Key Points:**
- Partial withdrawal from Aave position
- aUSDC is burned, USDC is returned to SmartWallet
- DefiCityCore updates harvest statistics

---

## 5️⃣ Demolish Bank Building (Full Withdrawal)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant BankAdapter
    participant SmartWallet as AA Wallet
    participant AavePool
    participant aToken as aUSDC
    participant DefiCityCore

    User->>Frontend: Click "Demolish Bank"

    Note over Frontend,BankAdapter: Step 1: Prepare Demolish Batch
    Frontend->>BankAdapter: prepareDemolish(user, SmartWallet, buildingId, params)
    Note over BankAdapter: View function only
    BankAdapter->>DefiCityCore: buildings(buildingId)
    DefiCityCore-->>BankAdapter: Building data
    BankAdapter->>BankAdapter: Validate owner
    BankAdapter-->>Frontend: (targets[], values[], datas[])
    Note over Frontend: targets = [AavePool, Core]<br/>datas = [withdraw(MAX), recordDemolition()]

    Note over Frontend,DefiCityCore: Step 2: Execute Batch
    Frontend->>SmartWallet: executeBatch(targets, values, datas)

    loop For each target
        alt Transaction 1: Withdraw All from Aave
            SmartWallet->>AavePool: withdraw(USDC, type(uint256).max, SmartWallet)
            Note over SmartWallet,AavePool: msg.sender = SmartWallet<br/>Withdraw ALL aUSDC balance
            AavePool->>aToken: Burn all aUSDC from SmartWallet
            AavePool->>AavePool: Transfer all USDC to SmartWallet
            AavePool-->>SmartWallet: Full withdrawal success
        end

        alt Transaction 2: Record Demolition
            SmartWallet->>DefiCityCore: recordDemolition(user, buildingId, amount)
            Note over SmartWallet,DefiCityCore: msg.sender = SmartWallet
            DefiCityCore->>DefiCityCore: Validate SmartWallet
            DefiCityCore->>DefiCityCore: buildings[buildingId].active = false
            DefiCityCore->>DefiCityCore: userGridBuildings[user][x][y] = 0
            DefiCityCore->>DefiCityCore: userStats[user].buildingCount--
            DefiCityCore-->>SmartWallet: Success
        end
    end

    SmartWallet-->>Frontend: Success
    Frontend->>User: ✅ Bank demolished, funds returned
```

**Key Points:**
- Complete withdrawal using `type(uint256).max`
- Building marked as inactive
- Grid position freed up
- All aUSDC burned, all USDC returned

---

## 6️⃣ Withdraw Asset (AA Wallet → EOA)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant SmartWallet as AA Wallet
    participant Token as ERC20 Token
    participant EOA as User's EOA

    User->>Frontend: Click "Withdraw 50 USDC to EOA"
    Frontend->>Frontend: Get SmartWallet & EOA addresses

    Frontend->>SmartWallet: execute(transfer, EOA, 50 USDC)
    Note over Frontend,SmartWallet: Signed by EOA owner
    SmartWallet->>SmartWallet: Verify owner

    SmartWallet->>Token: transfer(EOA, 50 USDC)
    Note over SmartWallet,Token: msg.sender = SmartWallet
    Token->>Token: balanceOf[SmartWallet] -= 50
    Token->>Token: balanceOf[EOA] += 50
    Token-->>SmartWallet: Transfer success

    SmartWallet-->>Frontend: Success
    Frontend->>User: ✅ Withdrawn 50 USDC to EOA
```

**Key Points:**
- Transfer assets back from SmartWallet to EOA
- User retains full control over funds
- Simple ERC20 transfer

---

## Key Architecture Points

### 🏗️ Contract Roles

#### **BankAdapter (Helper/Recipe Builder)**
```solidity
// View functions only - NO state changes
function preparePlace(...) external view returns (
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory datas
)

// Returns batch transaction data:
// targets = [USDC, AavePool, DefiCityCore]
// values  = [0, 0, 0]
// datas   = [approve(), supply(), recordPlacement()]
```

**Responsibilities:**
- ✅ Prepare batch transaction data
- ✅ Validate placement parameters
- ✅ Calculate fees
- ❌ **NOT called during execution**
- ❌ **NO state changes**

#### **SmartWallet (AA Wallet / Execution Engine)**
```solidity
function executeBatch(
    address[] calldata dest,
    uint256[] calldata value,
    bytes[] calldata func
) external {
    require(msg.sender == owner);

    for (uint i = 0; i < dest.length; i++) {
        (bool success, ) = dest[i].call{value: value[i]}(func[i]);
        require(success);
    }
}
```

**Responsibilities:**
- ✅ Execute all protocol interactions
- ✅ Hold user assets (USDC, aUSDC, etc.)
- ✅ Act as msg.sender for all calls
- ✅ Verify owner signature

#### **DefiCityCore (Bookkeeper)**
```solidity
function recordBuildingPlacement(...) external {
    // ✅ Validate caller is user's SmartWallet
    require(msg.sender == userSmartWallets[user]);

    // Store building data
    buildings[id] = Building(...);
    userBuildings[user].push(id);
}
```

**Responsibilities:**
- ✅ Track buildings, stats, grid positions
- ✅ Validate SmartWallet ownership
- ❌ **NEVER holds user tokens**
- ❌ **Bookkeeping only**

---

### 🔐 Security Model

```
┌─────────────────────────────────────────┐
│ Security Validation Chain               │
├─────────────────────────────────────────┤
│ 1. EOA signs transaction                │
│ 2. SmartWallet validates owner          │
│ 3. DefiCityCore validates SmartWallet   │
└─────────────────────────────────────────┘

DefiCityCore.recordBuildingPlacement():
    require(msg.sender == userSmartWallets[user]);

    ⚠️ NOTE: Does NOT validate Adapter!
    ⚠️ Adapter is NOT in execution flow!
```

**Why this works:**
- Only the user's SmartWallet can execute
- Only the EOA owner can call SmartWallet
- DefiCityCore trusts SmartWallet, not Adapter

---

### ⚡ Gas Efficiency

**Pattern: View Function + Batch Execution**

```typescript
// ✅ EFFICIENT: 1 transaction
const [targets, values, datas] = await BankAdapter.preparePlace(...) // View call (free)
await SmartWallet.executeBatch(targets, values, datas) // 1 transaction

// ❌ INEFFICIENT: 2 transactions
await BankAdapter.executePlace(...) // Transaction 1
await DefiCityCore.recordBuilding(...) // Transaction 2
```

**Benefits:**
1. **Lower Gas**: Single transaction vs multiple
2. **Atomic Execution**: All-or-nothing
3. **Flexibility**: Adapter can be upgraded without changing SmartWallet
4. **No State**: Adapter doesn't need to store anything

---

### 🎯 Data Flow Summary

```
Frontend
    ↓ (View call - FREE)
BankAdapter.preparePlace()
    ↓ (Returns batch data)
Frontend
    ↓ (1 Transaction)
SmartWallet.executeBatch()
    ├─→ USDC.approve()
    ├─→ AavePool.supply()
    └─→ DefiCityCore.recordPlacement()
         ↓
    ✅ Success
```

**Key Insight:**
- BankAdapter is a **"Recipe Builder"**
- SmartWallet is the **"Chef"** that executes the recipe
- DefiCityCore is the **"Ledger"** that records what happened

---

### 📝 Contract Addresses (Base Sepolia)

```typescript
// Core Contracts
DefiCityCore:    0xf9678a801Bf0E16C3781157A859741B87c9bC8eF
WalletFactory:   0xdA507eDd7A24Fe36f2f3d8EC47FC29b3dFa76c85
BankAdapter:     0x4c614D612FE404406b0875bE01725EE07eb27592

// Aave V3 (Base Sepolia)
POOL:            0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
POOL_PROVIDER:   0xe20fCBdBfFC4Dd138cE8b2E6FBb6CB49777ad64D

// Tokens
USDC (Official): 0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f
WETH:            0x4200000000000000000000000000000000000006
```

---

## 🎓 Common Misconceptions

### ❌ Myth: "BankAdapter executes the transaction"
**✅ Reality:** BankAdapter only prepares the batch data (view function). SmartWallet executes everything.

### ❌ Myth: "DefiCityCore validates Adapter"
**✅ Reality:** DefiCityCore validates SmartWallet ownership. Adapter is not in the execution path.

### ❌ Myth: "Each step is a separate transaction"
**✅ Reality:** All steps execute in a single atomic transaction via `executeBatch()`.

### ❌ Myth: "DefiCityCore holds user funds"
**✅ Reality:** DefiCityCore is bookkeeping only. SmartWallet holds all user assets.

---

## 📚 Additional Resources

- **Aave V3 Docs**: https://docs.aave.com/developers/
- **ERC-4337 Account Abstraction**: https://eips.ethereum.org/EIPS/eip-4337
- **Base Sepolia Explorer**: https://sepolia.basescan.org/

---

**Last Updated:** 2026-01-28
