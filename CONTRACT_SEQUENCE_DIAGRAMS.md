# DefiCity - Smart Contract Sequence Diagrams

**Version:** 2.0 (Post Security Audit Fixes)
**Date:** 2026-01-16
**Architecture:** Refactored with Security Improvements

---

## Table of Contents

1. [UC-001: Create Town Hall (New Player Onboarding)](#uc-001-create-town-hall-new-player-onboarding)
2. [UC-002: Place Bank Building - Supply Mode](#uc-002-place-bank-building---supply-mode)
3. [UC-003: Place Bank Building - Borrow Mode](#uc-003-place-bank-building---borrow-mode)
4. [UC-004: Harvest Yield from Building](#uc-004-harvest-yield-from-building)
5. [UC-005: Demolish Building](#uc-005-demolish-building)
6. [UC-006: Withdraw Funds to External Wallet](#uc-006-withdraw-funds-to-external-wallet)
7. [UC-007: Session Key Management](#uc-007-session-key-management)
8. [UC-008: Deposit More to Existing Building](#uc-008-deposit-more-to-existing-building)

---

## Architecture Overview

```mermaid
graph TB
    User[User EOA] --> Frontend[Frontend DApp]
    Frontend --> Core[DefiCityCore]
    Frontend --> Wallet[SmartWallet]

    Core --> Factory[WalletFactory]
    Core --> Manager[BuildingManager]

    Wallet --> EntryPoint[EntryPoint ERC-4337]
    Wallet --> Aave[Aave V3 Pool]

    Factory -.creates.-> Wallet
    Manager -.prepares calldata.-> Wallet

    style Core fill:#f96,stroke:#333,stroke-width:4px
    style Wallet fill:#9cf,stroke:#333,stroke-width:4px
    style Factory fill:#fc9,stroke:#333,stroke-width:2px
    style Manager fill:#fc9,stroke:#333,stroke-width:2px
```

**Key Contracts:**
- **DefiCityCore**: Game logic & building management (NEVER holds tokens)
- **WalletFactory**: Creates SmartWallets only (no game logic)
- **SmartWallet**: User's self-custodial wallet (holds all assets)
- **BuildingManager**: Prepares DeFi interaction calldata
- **EntryPoint**: ERC-4337 bundler interaction

---

## UC-001: Create Town Hall (New Player Onboarding)

**NEW ARCHITECTURE**: Town Hall creation moved from Factory to Core

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Core as DefiCityCore
    participant Factory as WalletFactory
    participant Wallet as SmartWallet
    participant EP as EntryPoint

    Note over User,EP: User connects EOA (MetaMask) to game

    User->>Frontend: Click "Create Town Hall"
    Frontend->>Frontend: User selects position (x, y)

    Frontend->>Core: createTownHall(x, y)
    Note over Core: msg.sender = User's EOA

    rect rgb(255, 240, 240)
        Note over Core: Security: Check if user already has wallet
        Core->>Core: require(userSmartWallets[user] == 0)
        Core->>Core: require(gridBuildings[x][y] == 0)
    end

    rect rgb(240, 255, 240)
        Note over Core,Factory: Step 1: Create SmartWallet
        Core->>Factory: createWallet(user, salt=0)
        Factory->>Factory: Compute CREATE2 address
        Factory->>Factory: Check if wallet exists

        alt Wallet doesn't exist
            Factory->>Wallet: deploy with CREATE2
            Note over Wallet: constructor(entryPoint, user, core)
            Wallet-->>Factory: wallet address
        else Wallet exists
            Factory-->>Factory: Return existing wallet
        end

        Factory->>Core: registerWallet(user, walletAddr)

        rect rgb(255, 255, 200)
            Note over Core: SECURITY FIX: Update both mappings
            Core->>Core: userSmartWallets[user] = wallet
            Core->>Core: walletToOwner[wallet] = user ✓
            Core->>Core: userStats[user].cityCreatedAt = now
        end

        Factory-->>Core: SmartWallet address
    end

    rect rgb(240, 240, 255)
        Note over Core: Step 2: Record Town Hall Building
        Core->>Core: buildingId = ++buildingIdCounter
        Core->>Core: buildings[id] = Building({<br/>  type: "townhall",<br/>  owner: user,<br/>  wallet: walletAddr,<br/>  amount: 0,<br/>  asset: 0x0,<br/>  x, y<br/>})

        Core->>Core: userBuildings[user].push(buildingId)
        Core->>Core: gridBuildings[x][y] = buildingId
        Core->>Core: userStats[user].buildingCount++
    end

    Core->>Core: emit BuildingPlaced(...)
    Core-->>Frontend: (walletAddress, buildingId)

    Frontend->>Frontend: Show success animation
    Frontend->>Frontend: Update UI with new building
    Frontend-->>User: "Town Hall Created! 🏛️"

    Note over User,EP: User now has SmartWallet + Town Hall<br/>Ready to deposit and build
```

**Key Changes from Old Architecture:**
- ✅ Core handles Town Hall creation (not Factory)
- ✅ Factory only creates wallets
- ✅ Both `userSmartWallets` and `walletToOwner` mappings updated
- ✅ No UserOperation needed (direct EOA call)

---

## UC-002: Place Bank Building - Supply Mode

**Epic 4: US-011 - Supply assets to Aave and earn yield**

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Manager as BuildingManager
    participant Wallet as SmartWallet
    participant Token as ERC20 (USDC)
    participant Aave as Aave V3 Pool
    participant Core as DefiCityCore

    Note over User,Core: User has deposited USDC to SmartWallet

    User->>Frontend: Select "Place Bank"
    Frontend->>Frontend: User enters:<br/>- Asset: USDC<br/>- Amount: 200 USDC<br/>- Mode: Supply Only

    rect rgb(255, 240, 240)
        Note over Frontend: Get prepared calldata from BuildingManager
        Frontend->>Manager: prepareBankSupply(<br/>  userWallet,<br/>  user,<br/>  USDC,<br/>  200e6,<br/>  x, y<br/>)

        Manager->>Manager: require(aavePool != 0)

        Manager->>Manager: Prepare batch [approve, supply, recordBuilding]

        Note over Manager: Batch[0]: Approve Aave Pool
        Manager->>Manager: targets[0] = USDC<br/>datas[0] = approve(aavePool, 200e6)

        Note over Manager: Batch[1]: Supply to Aave
        Manager->>Manager: targets[1] = aavePool<br/>datas[1] = supply(USDC, 200e6, wallet, 0)

        Note over Manager: Batch[2]: Record in Core
        Manager->>Manager: targets[2] = core<br/>datas[2] = recordBuildingPlacement(<br/>  user,<br/>  "bank",<br/>  USDC,<br/>  200e6,<br/>  x, y,<br/>  metadata<br/>)

        Manager-->>Frontend: (targets[], values[], datas[])
    end

    rect rgb(240, 255, 240)
        Note over Frontend,Wallet: Execute via Session Key (gasless)
        Frontend->>Wallet: executeFromGame(targets, values, datas)
        Note over Wallet: Called by game server with session key

        rect rgb(255, 255, 200)
            Note over Wallet: SECURITY: Validate session key
            Wallet->>Wallet: require(sessionKeys[msg.sender].active)
            Wallet->>Wallet: require(now <= validUntil)
            Wallet->>Wallet: require(!paused) ✓

            Note over Wallet: Check 24-hour spending window
            Wallet->>Wallet: if (now >= windowStart + 24h):<br/>  windowStart = now<br/>  spentInWindow = 0

            Wallet->>Wallet: Check whitelisted targets
            Wallet->>Wallet: require(whitelistedTargets[target])

            Wallet->>Wallet: Calculate total USD value
            Wallet->>Wallet: require(spentInWindow + value <= dailyLimit)
            Wallet->>Wallet: spentInWindow += value ✓
        end

        Note over Wallet: Execute Batch[0]: Approve
        Wallet->>Token: approve(aavePool, 200 USDC)
        Token-->>Wallet: ✓

        Note over Wallet: Execute Batch[1]: Supply
        Wallet->>Aave: supply(USDC, 200e6, wallet, 0)
        Aave->>Token: transferFrom(wallet, aave, 200 USDC)
        Token-->>Aave: ✓
        Aave->>Aave: mint aUSDC to wallet
        Aave-->>Wallet: ✓

        Note over Wallet: Execute Batch[2]: Record Building
        Wallet->>Core: recordBuildingPlacement(<br/>  user, "bank", USDC, 200e6, x, y<br/>)

        rect rgb(255, 255, 200)
            Note over Core: SECURITY: Validate SmartWallet caller
            Core->>Core: require(walletToOwner[msg.sender] != 0) ✓
            Core->>Core: userWallet = userSmartWallets[user]
            Core->>Core: require(msg.sender == userWallet)
        end

        Core->>Core: buildingId = ++counter
        Core->>Core: buildings[id] = Building({<br/>  type: "bank",<br/>  owner: user,<br/>  wallet: msg.sender,<br/>  asset: USDC,<br/>  amount: 200e6<br/>})
        Core->>Core: userBuildings[user].push(id)
        Core->>Core: gridBuildings[x][y] = id

        Core->>Core: emit BuildingPlaced(...)
        Core-->>Wallet: buildingId

        Wallet->>Wallet: emit SessionKeyUsed(...)
        Wallet-->>Frontend: ✓
    end

    Frontend->>Frontend: Update UI with new building
    Frontend-->>User: "Bank Created!<br/>Earning ~4% APY 📊"

    Note over User,Core: Building now earning yield from Aave
```

**Key Security Improvements:**
- ✅ Session key time-window tracking (not day-based)
- ✅ Pause mechanism on SmartWallet
- ✅ Proper `onlyUserWallet` modifier with reverse mapping
- ✅ Whitelisted targets validation

---

## UC-003: Place Bank Building - Borrow Mode

**Epic 4: US-012 - Supply collateral and borrow assets**

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Manager as BuildingManager
    participant Wallet as SmartWallet
    participant Aave as Aave V3 Pool
    participant Core as DefiCityCore

    Note over User,Core: User wants to supply ETH and borrow USDC

    User->>Frontend: Select "Place Bank - Borrow Mode"
    Frontend->>Frontend: User enters:<br/>- Collateral: ETH (0.5 ETH)<br/>- Borrow: USDC (600 USDC)

    rect rgb(255, 240, 240)
        Frontend->>Manager: prepareBankBorrow(<br/>  wallet, user,<br/>  ETH, 0.5e18,<br/>  USDC, 600e6,<br/>  x, y<br/>)

        rect rgb(255, 255, 200)
            Note over Manager: SECURITY FIX: Check health factor BEFORE
            Manager->>Aave: getUserAccountData(userWallet)
            Aave-->>Manager: (collateral, debt, ..., healthFactor)

            alt Health factor exists and < 1.5
                Manager->>Manager: revert HealthFactorTooLow() ❌
            else Safe to borrow
                Note over Manager: Continue with borrow
            end
        end

        Manager->>Manager: Prepare batch [approve, supply, borrow, record]

        Note over Manager: Batch[0]: Approve ETH
        Note over Manager: Batch[1]: Supply ETH as collateral
        Note over Manager: Batch[2]: Borrow USDC
        Note over Manager: Batch[3]: Record building

        Manager-->>Frontend: (targets[], values[], datas[])
    end

    rect rgb(240, 255, 240)
        Frontend->>Wallet: executeFromGame(targets, values, datas)

        Wallet->>Wallet: Validate session key ✓

        Note over Wallet: Batch[0]: Approve
        Wallet->>Aave: approve collateral

        Note over Wallet: Batch[1]: Supply ETH
        Wallet->>Aave: supply(ETH, 0.5e18, wallet, 0)
        Aave->>Aave: User receives aETH
        Aave-->>Wallet: ✓

        Note over Wallet: Batch[2]: Borrow USDC
        Wallet->>Aave: borrow(<br/>  USDC,<br/>  600e6,<br/>  VARIABLE_RATE,<br/>  0,<br/>  wallet<br/>)
        Aave->>Aave: Check health factor

        alt Health factor >= 1.0
            Aave->>Aave: Transfer 600 USDC to wallet
            Aave->>Aave: Record debt
            Aave-->>Wallet: ✓
        else Health factor < 1.0
            Aave-->>Wallet: revert InsufficientCollateral ❌
        end

        Note over Wallet: Batch[3]: Record in Core
        Wallet->>Core: recordBuildingPlacement(...)
        Core->>Core: metadata = abi.encode(<br/>  "borrow",<br/>  collateralAmount,<br/>  borrowAmount<br/>)
        Core->>Core: Save building with metadata
        Core-->>Wallet: buildingId

        Wallet-->>Frontend: ✓
    end

    Frontend->>Frontend: Show building with:<br/>- Collateral: 0.5 ETH<br/>- Borrowed: 600 USDC<br/>- Health Factor: 2.0 (safe)<br/>- Net APY: -2% (borrow cost)

    Frontend-->>User: "Bank Created with Borrow! ⚠️<br/>Monitor health factor"

    Note over User,Core: User has leveraged position:<br/>- Earning on ETH collateral<br/>- Paying interest on USDC debt
```

**Health Factor Management:**
- ✅ Pre-check before allowing borrow
- ⚠️ Warning when HF < 1.5
- ❌ Liquidation risk when HF < 1.0
- ℹ️ User can repay anytime to improve HF

---

## UC-004: Harvest Yield from Building

**Epic 4: US-015 - Claim accumulated yield**

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Manager as BuildingManager
    participant Wallet as SmartWallet
    participant Aave as Aave V3 Pool
    participant Core as DefiCityCore

    Note over User,Core: Building has pending yield

    User->>Frontend: Click building
    Frontend->>Frontend: Show "Pending: 2.5 USDC"

    User->>Frontend: Click "Harvest"

    Frontend->>Manager: prepareHarvest(<br/>  buildingId,<br/>  user,<br/>  USDC,<br/>  2.5e6<br/>)

    rect rgb(255, 240, 240)
        Manager->>Core: buildings(buildingId)
        Core-->>Manager: (owner, wallet, type, asset...)

        rect rgb(255, 255, 200)
            Note over Manager: SECURITY FIX: Use constant
            Manager->>Manager: require(<br/>  keccak256(type) == BUILDING_TYPE_BANK<br/>)
            Manager->>Manager: require(buildingOwner == user)
        end

        Manager->>Manager: Prepare batch [withdraw, recordHarvest]

        Note over Manager: Batch[0]: Withdraw from Aave
        Manager->>Manager: targets[0] = aavePool<br/>datas[0] = withdraw(USDC, 2.5e6, wallet)

        Note over Manager: Batch[1]: Record harvest
        Manager->>Manager: targets[1] = core<br/>datas[1] = recordHarvest(user, buildingId, 2.5e6)

        Manager-->>Frontend: (targets[], values[], datas[])
    end

    rect rgb(240, 255, 240)
        Frontend->>Wallet: executeFromGame(targets, values, datas)

        Wallet->>Wallet: Validate session key ✓

        Note over Wallet: Batch[0]: Withdraw yield
        Wallet->>Aave: withdraw(USDC, 2.5e6, wallet)
        Aave->>Aave: Burn 2.5 aUSDC
        Aave->>Wallet: Transfer 2.5 USDC
        Aave-->>Wallet: ✓

        Note over Wallet: Batch[1]: Record in Core
        Wallet->>Core: recordHarvest(user, buildingId, 2.5e6)

        rect rgb(255, 255, 200)
            Note over Core: SECURITY: Only SmartWallet can call
            Core->>Core: require(walletToOwner[msg.sender] == user) ✓
        end

        Core->>Core: building = buildings[buildingId]
        Core->>Core: require(building.active)
        Core->>Core: require(building.owner == user)

        Core->>Core: userStats[user].totalHarvested += 2.5e6
        Core->>Core: emit Harvested(buildingId, user, 2.5e6)
        Core-->>Wallet: ✓

        Wallet-->>Frontend: ✓
    end

    Frontend->>Frontend: Update UI:<br/>- Building rewards: 0<br/>- Wallet balance: +2.5 USDC
    Frontend-->>User: "Harvested 2.5 USDC! 💰"

    Note over User,Core: Yield claimed, building continues earning
```

**No Fees for Harvesting:**
- ✅ Gasless via session key
- ✅ No protocol fees on harvest
- ✅ Funds go directly to user's wallet

---

## UC-005: Demolish Building

**Remove building and withdraw all funds**

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Manager as BuildingManager
    participant Wallet as SmartWallet
    participant Aave as Aave V3 Pool
    participant Core as DefiCityCore

    Note over User,Core: User wants to demolish Bank

    User->>Frontend: Click building
    User->>Frontend: Click "Demolish"

    Frontend->>Frontend: Show confirmation:<br/>"Withdraw all funds?<br/>Building will be removed"

    User->>Frontend: Confirm

    Frontend->>Manager: prepareBankDemolition(<br/>  buildingId,<br/>  user,<br/>  USDC<br/>)

    rect rgb(255, 240, 240)
        Manager->>Core: buildings(buildingId)
        Core-->>Manager: (owner, wallet, type, amount...)

        Manager->>Manager: Validate building type & owner

        Manager->>Manager: Prepare batch [withdrawAll, recordDemolition]

        Note over Manager: Batch[0]: Withdraw all from Aave
        Manager->>Manager: targets[0] = aavePool<br/>datas[0] = withdraw(<br/>  USDC,<br/>  type(uint256).max,  // Withdraw all<br/>  wallet<br/>)

        Note over Manager: Batch[1]: Record demolition
        Manager->>Manager: targets[1] = core<br/>datas[1] = recordDemolition(<br/>  user,<br/>  buildingId,<br/>  amount<br/>)

        Manager-->>Frontend: (targets[], values[], datas[])
    end

    rect rgb(240, 255, 240)
        Frontend->>Wallet: executeFromGame(targets, values, datas)

        Wallet->>Wallet: Validate session key ✓

        Note over Wallet: Batch[0]: Withdraw all funds
        Wallet->>Aave: withdraw(USDC, MAX, wallet)
        Aave->>Aave: Calculate total balance<br/>(principal + yield)
        Aave->>Aave: Burn all aUSDC
        Aave->>Wallet: Transfer 202.5 USDC<br/>(200 principal + 2.5 yield)
        Aave-->>Wallet: 202.5 USDC

        Note over Wallet: Batch[1]: Record demolition
        Wallet->>Core: recordDemolition(user, buildingId, 200e6)

        Core->>Core: building = buildings[buildingId]
        Core->>Core: require(building.active)
        Core->>Core: require(building.owner == user)

        Core->>Core: building.active = false
        Core->>Core: userStats[user].buildingCount--
        Core->>Core: gridBuildings[x][y] = 0

        Core->>Core: emit BuildingDemolished(...)
        Core-->>Wallet: ✓

        Wallet-->>Frontend: ✓
    end

    Frontend->>Frontend: Remove building from map
    Frontend->>Frontend: Update wallet balance: +202.5 USDC
    Frontend-->>User: "Building demolished!<br/>202.5 USDC returned 🏗️"

    Note over User,Core: All funds returned, no fees charged
```

**Important Notes:**
- ✅ No demolition fees
- ✅ All funds (principal + yield) returned
- ⚠️ Town Hall cannot be demolished
- ⚠️ Bank with active borrow must repay first

---

## UC-006: Withdraw Funds to External Wallet

**Not gasless - user pays gas for external transfer**

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Wallet as SmartWallet
    participant Token as ERC20 (USDC)
    participant External as External Wallet

    Note over User,External: User has 200 USDC in SmartWallet

    User->>Frontend: Click "Withdraw"
    Frontend->>Frontend: User enters:<br/>- Asset: USDC<br/>- Amount: 200 USDC<br/>- To: 0xExternal...

    Frontend->>Frontend: Show warning:<br/>"External transaction<br/>Gas fee: ~$0.30"

    User->>Frontend: Confirm (signs transaction)

    rect rgb(255, 240, 240)
        Note over Frontend,Wallet: Direct call from owner (not session key)
        Frontend->>Wallet: execute(<br/>  dest: USDC,<br/>  value: 0,<br/>  func: transfer(external, 200e6)<br/>)
        Note over Wallet: msg.sender = User's EOA

        rect rgb(255, 255, 200)
            Note over Wallet: SECURITY: Validate caller
            Wallet->>Wallet: require(msg.sender == owner) ✓
            Wallet->>Wallet: require(!paused) ✓
        end

        Note over Wallet: Execute transfer
        Wallet->>Token: transfer(external, 200 USDC)
        Token->>Token: balanceOf[wallet] -= 200e6
        Token->>Token: balanceOf[external] += 200e6
        Token-->>Wallet: ✓

        Wallet->>Wallet: emit ExecutionSuccess(...)
        Wallet-->>Frontend: ✓
    end

    Frontend->>Frontend: Update UI:<br/>- Wallet balance: 0 USDC<br/>- Show transaction hash
    Frontend-->>User: "Withdrawn 200 USDC<br/>Gas paid: $0.30"

    Note over User,External: Funds in external wallet<br/>User paid gas fee
```

**Why User Pays Gas:**
- ❌ Not a game action (external transfer)
- ❌ Not sponsored by paymaster
- ℹ️ Direct owner call to SmartWallet
- ℹ️ Typical cost: $0.30 on Base

---

## UC-007: Session Key Management

**Epic 7: Gasless gameplay with session keys**

### 7a. Create Session Key (First Time)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Wallet as SmartWallet

    Note over User,Wallet: User's first gameplay action

    User->>Frontend: Click "Place Building"
    Frontend->>Frontend: Check if session key exists
    Frontend->>Frontend: Not found

    Frontend->>Frontend: Show prompt:<br/>"Allow DefiCity to act on your behalf?<br/>- Valid: 24 hours<br/>- Limit: 1,000 USD<br/>- Targets: Game contracts only"

    User->>Frontend: Approve

    rect rgb(240, 255, 240)
        Frontend->>Wallet: createSessionKey(<br/>  sessionKey: gameServer,<br/>  validUntil: now + 24h,<br/>  dailyLimit: 1000e6<br/>)
        Note over Wallet: msg.sender = User's EOA (owner)

        rect rgb(255, 255, 200)
            Note over Wallet: SECURITY FIXES Applied
            Wallet->>Wallet: require(msg.sender == owner) ✓
            Wallet->>Wallet: require(!paused) ✓
            Wallet->>Wallet: require(sessionKey != 0)
            Wallet->>Wallet: require(sessionKey != owner) ✓
            Wallet->>Wallet: require(validUntil > now)

            Note over Wallet: Validate period
            Wallet->>Wallet: duration = validUntil - now
            Wallet->>Wallet: require(duration >= 1 hour) ✓
            Wallet->>Wallet: require(duration <= 30 days) ✓
        end

        Wallet->>Wallet: sessionKeys[gameServer] = SessionKeyInfo({<br/>  active: true,<br/>  validUntil: now + 24h,<br/>  dailyLimit: 1000e6,<br/>  windowStart: now,<br/>  spentInWindow: 0<br/>})

        Wallet->>Wallet: emit SessionKeyCreated(...)
        Wallet-->>Frontend: ✓
    end

    Frontend->>Frontend: Save session key (encrypted)
    Frontend-->>User: "Session key created!<br/>Next 24 hours are gasless ✨"

    Note over User,Wallet: User can now play without approvals
```

### 7b. Update Session Key

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Wallet as SmartWallet

    User->>Frontend: Settings → "Extend Session Key"

    Frontend->>Wallet: updateSessionKey(<br/>  sessionKey,<br/>  validUntil: now + 48h,<br/>  dailyLimit: 2000e6<br/>)

    rect rgb(255, 255, 200)
        Note over Wallet: NEW FEATURE (security fix)
        Wallet->>Wallet: require(sessionKeys[key].active)
        Wallet->>Wallet: Validate new period

        Wallet->>Wallet: session.validUntil = now + 48h
        Wallet->>Wallet: session.dailyLimit = 2000e6

        Wallet->>Wallet: emit SessionKeyCreated(...)
        Wallet-->>Frontend: ✓
    end

    Frontend-->>User: "Session key updated!<br/>Valid for 48h, limit 2000 USD"
```

### 7c. Session Key Spending Tracking

```mermaid
sequenceDiagram
    participant Game as Game Server
    participant Wallet as SmartWallet

    Note over Game,Wallet: Game server executing action

    Game->>Wallet: executeFromGame(targets, values, datas)

    rect rgb(255, 255, 200)
        Note over Wallet: SECURITY FIX: Time-window tracking

        Wallet->>Wallet: session = sessionKeys[msg.sender]
        Wallet->>Wallet: require(session.active)
        Wallet->>Wallet: require(now <= session.validUntil)

        Note over Wallet: Check 24-hour window
        Wallet->>Wallet: if (now >= session.windowStart + 24h):
        Wallet->>Wallet:   session.windowStart = now
        Wallet->>Wallet:   session.spentInWindow = 0

        Note over Wallet: Calculate transaction value
        Wallet->>Wallet: totalValue = estimateValue(targets, values, datas)

        Note over Wallet: Check limit
        Wallet->>Wallet: require(<br/>  session.spentInWindow + totalValue<br/>  <= session.dailyLimit<br/>)

        Wallet->>Wallet: session.spentInWindow += totalValue ✓
    end

    Note over Wallet: Prevents exploit:<br/>Spend $1000 at 23:59<br/>Wait 1 sec<br/>Spend $1000 at 00:00 ❌

    Note over Wallet: NEW SYSTEM:<br/>Rolling 24-hour window ✓
```

**Security Improvements:**
- ✅ Time-window instead of day-based
- ✅ Cannot set owner as session key
- ✅ Min 1 hour, max 30 days validity
- ✅ Update existing keys
- ✅ Pause mechanism

---

## UC-008: Deposit More to Existing Building

**Add funds to increase building size**

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Wallet as SmartWallet
    participant Token as ERC20 (USDC)
    participant Aave as Aave V3 Pool
    participant Core as DefiCityCore

    Note over User,Core: User has Bank with 200 USDC

    User->>Frontend: Click building
    User->>Frontend: Click "Deposit More"
    Frontend->>Frontend: User enters: +100 USDC

    Frontend->>Frontend: Show:<br/>"No fee for additional deposits<br/>New total: 300 USDC"

    User->>Frontend: Confirm

    rect rgb(240, 255, 240)
        Note over Frontend,Wallet: Simple supply (no building record)
        Frontend->>Wallet: executeFromGame([<br/>  approve(aave, 100),<br/>  supply(USDC, 100)<br/>])

        Wallet->>Wallet: Validate session key ✓

        Wallet->>Token: approve(aave, 100 USDC)
        Token-->>Wallet: ✓

        Wallet->>Aave: supply(USDC, 100e6, wallet, 0)
        Aave->>Aave: mint 100 aUSDC
        Aave-->>Wallet: ✓

        Wallet-->>Frontend: ✓
    end

    Frontend->>Frontend: Update UI:<br/>- Building value: 300 USDC<br/>- No new building created<br/>- Same buildingId
    Frontend-->>User: "Deposited +100 USDC!<br/>Building now worth 300 USDC"

    Note over User,Core: No fee charged for additional deposits
```

---

## Summary of Architectural Changes

### ✅ Security Fixes Implemented

1. **DefiCityCore**:
   - Fixed broken `onlyUserWallet` modifier with reverse mapping
   - Added access control to `recordDeposit/Withdrawal`
   - Moved Town Hall creation from Factory to Core
   - Added validation to all setters

2. **SmartWallet**:
   - Changed to time-window based session key tracking
   - Added min/max validity validation
   - Added `updateSessionKey()` function
   - Added emergency `pause()/unpause()`
   - Added constants for all magic numbers
   - Added `whenNotPaused` modifiers

3. **BuildingManager**:
   - Added health factor validation before borrowing
   - Removed dead code (unused protocols)
   - Added constants for building types
   - Gas-efficient string comparisons
   - Proper validation on all setters

4. **WalletFactory**:
   - Removed Town Hall logic (moved to Core)
   - Now only creates wallets
   - Cleaner separation of concerns

### 🎯 Key Flows

- **New Player**: EOA → Core.createTownHall() → Factory creates wallet → Core records building
- **Place Building**: Manager prepares calldata → Wallet executes via session key → DeFi interaction → Core records
- **Harvest**: Gasless via session key → Withdraw from protocol → Update stats
- **Withdraw**: Owner pays gas → Direct transfer to external wallet

---

**END OF DOCUMENT**
