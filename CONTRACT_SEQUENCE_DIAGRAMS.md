# DefiCity - Smart Contract Sequence Diagrams

**Version:** 2.1 (Adapter Pattern Architecture)
**Date:** 2026-01-16
**Architecture:** Modular Adapter Pattern with BuildingRegistry

---

## Table of Contents

1. [UC-001: Create Town Hall (New Player Onboarding)](#uc-001-create-town-hall-new-player-onboarding)
2. [UC-002: Place Bank Building - Supply Mode](#uc-002-place-bank-building---supply-mode)
3. [UC-003: Place Bank Building - Borrow Mode](#uc-003-place-bank-building---borrow-mode)
4. [UC-004: Place Shop Building - Aerodrome LP](#uc-004-place-shop-building---aerodrome-lp)
5. [UC-005: Place Lottery Building - Megapot](#uc-005-place-lottery-building---megapot)
6. [UC-006: Harvest Yield from Building](#uc-006-harvest-yield-from-building)
7. [UC-007: Demolish Building](#uc-007-demolish-building)
8. [UC-008: Withdraw Funds to External Wallet](#uc-008-withdraw-funds-to-external-wallet)
9. [UC-009: Session Key Management](#uc-009-session-key-management)

---

## Architecture Overview

```mermaid
graph TB
    User[User EOA] --> Frontend[Frontend DApp]
    Frontend --> Registry[BuildingRegistry]
    Frontend --> Wallet[SmartWallet]
    Frontend --> Core[DefiCityCore]

    Core --> Factory[WalletFactory]

    Registry --> BankAdapter[BankAdapter]
    Registry --> ShopAdapter[ShopAdapter]
    Registry --> LotteryAdapter[LotteryAdapter]

    BankAdapter -.prepares calldata.-> Wallet
    ShopAdapter -.prepares calldata.-> Wallet
    LotteryAdapter -.prepares calldata.-> Wallet

    Wallet --> EntryPoint[EntryPoint ERC-4337]
    Wallet --> Aave[Aave V3 Pool]
    Wallet --> Aerodrome[Aerodrome DEX]
    Wallet --> Megapot[Megapot Lottery]

    Factory -.creates.-> Wallet

    style Core fill:#f96,stroke:#333,stroke-width:4px
    style Registry fill:#f9f,stroke:#333,stroke-width:4px
    style Wallet fill:#9cf,stroke:#333,stroke-width:4px
    style BankAdapter fill:#fc9,stroke:#333,stroke-width:2px
    style ShopAdapter fill:#fc9,stroke:#333,stroke-width:2px
    style LotteryAdapter fill:#fc9,stroke:#333,stroke-width:2px
```

**Key Contracts:**
- **DefiCityCore**: Game logic & state tracking (NEVER holds tokens)
- **BuildingRegistry**: Routes operations to correct building adapter
- **BankAdapter**: Prepares Aave V3 interactions (supply/borrow)
- **ShopAdapter**: Prepares Aerodrome DEX LP provision
- **LotteryAdapter**: Prepares Megapot lottery ticket purchases
- **WalletFactory**: Creates SmartWallets only (no game logic)
- **SmartWallet**: User's self-custodial wallet (holds all assets)
- **EntryPoint**: ERC-4337 bundler interaction

**Adapter Pattern Benefits:**
- ✅ Modular: Each building type is independent (~300-400 lines)
- ✅ Extensible: Add new buildings without touching existing code
- ✅ Upgradeable: Hot-swap adapters independently
- ✅ Maintainable: Test and deploy each adapter separately

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
    participant Registry as BuildingRegistry
    participant Adapter as BankAdapter
    participant Wallet as SmartWallet
    participant Token as ERC20 (USDC)
    participant Aave as Aave V3 Pool
    participant Core as DefiCityCore

    Note over User,Core: User has deposited USDC to SmartWallet

    User->>Frontend: Select "Place Bank"
    Frontend->>Frontend: User enters:<br/>- Asset: USDC<br/>- Amount: 200 USDC<br/>- Mode: Supply Only<br/>- Position: (x, y)

    rect rgb(255, 240, 240)
        Note over Frontend,Adapter: Step 1: Encode parameters
        Frontend->>Frontend: params = abi.encode({<br/>  asset: USDC,<br/>  amount: 200e6,<br/>  x: x, y: y,<br/>  isBorrowMode: false,<br/>  borrowAsset: 0x0,<br/>  borrowAmount: 0<br/>})

        Note over Frontend,Registry: Step 2: Get calldata from Registry
        Frontend->>Registry: preparePlace(<br/>  "bank",<br/>  user,<br/>  userSmartWallet,<br/>  params<br/>)

        Registry->>Registry: adapter = adapters["bank"]
        Registry->>Registry: require(adapter != 0)

        Registry->>Adapter: preparePlace(<br/>  user,<br/>  userSmartWallet,<br/>  params<br/>)

        Note over Adapter: Decode PlaceParams
        Adapter->>Adapter: PlaceParams memory p = decode(params)
        Adapter->>Adapter: require(p.asset != 0)
        Adapter->>Adapter: require(p.amount > 0)

        Note over Adapter: Prepare batch [approve, supply, recordBuilding]

        Note over Adapter: Batch[0]: Approve Aave Pool
        Adapter->>Adapter: targets[0] = USDC<br/>datas[0] = approve(aavePool, 200e6)

        Note over Adapter: Batch[1]: Supply to Aave
        Adapter->>Adapter: targets[1] = aavePool<br/>datas[1] = supply(USDC, 200e6, wallet, 0)

        Note over Adapter: Batch[2]: Record in Core
        Adapter->>Adapter: metadata = encode("supply", 0, 0)<br/>targets[2] = core<br/>datas[2] = recordBuildingPlacement(<br/>  user, "bank", USDC, 200e6, x, y, metadata<br/>)

        Adapter-->>Registry: (targets[], values[], datas[])
        Registry-->>Frontend: (targets[], values[], datas[])
    end

    rect rgb(240, 255, 240)
        Note over Frontend,Wallet: Step 3: Execute via Session Key (gasless)
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

**Adapter Pattern Benefits:**
- ✅ BankAdapter handles all Aave-specific logic
- ✅ BuildingRegistry routes "bank" to BankAdapter
- ✅ Easy to upgrade Aave integration without touching Core
- ✅ 0.05% placement fee managed by adapter

---

## UC-003: Place Bank Building - Borrow Mode

**Epic 4: US-012 - Supply collateral and borrow assets**

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Registry as BuildingRegistry
    participant Adapter as BankAdapter
    participant Wallet as SmartWallet
    participant Aave as Aave V3 Pool
    participant Core as DefiCityCore

    Note over User,Core: User wants to supply ETH and borrow USDC

    User->>Frontend: Select "Place Bank - Borrow Mode"
    Frontend->>Frontend: User enters:<br/>- Collateral: ETH (0.5 ETH)<br/>- Borrow: USDC (600 USDC)<br/>- Position: (x, y)

    rect rgb(255, 240, 240)
        Frontend->>Frontend: params = abi.encode({<br/>  asset: ETH,<br/>  amount: 0.5e18,<br/>  x: x, y: y,<br/>  isBorrowMode: true,<br/>  borrowAsset: USDC,<br/>  borrowAmount: 600e6<br/>})

        Frontend->>Registry: preparePlace("bank", user, wallet, params)

        Registry->>Adapter: preparePlace(user, wallet, params)

        Note over Adapter: Decode borrow params
        Adapter->>Adapter: PlaceParams memory p = decode(params)
        Adapter->>Adapter: require(p.isBorrowMode)
        Adapter->>Adapter: require(p.borrowAsset != 0)
        Adapter->>Adapter: require(p.borrowAmount > 0)

        rect rgb(255, 255, 200)
            Note over Adapter: SECURITY FIX: Check health factor BEFORE
            Adapter->>Aave: getUserAccountData(userWallet)
            Aave-->>Adapter: (collateral, debt, ..., healthFactor)

            alt Health factor exists and < 1.5
                Adapter->>Adapter: revert HealthFactorTooLow() ❌
            else Safe to borrow
                Note over Adapter: Continue with borrow
            end
        end

        Note over Adapter: Prepare batch [approve, supply, borrow, record]

        Note over Adapter: Batch[0]: Approve ETH
        Note over Adapter: Batch[1]: Supply ETH as collateral
        Adapter->>Adapter: targets[1] = aavePool<br/>datas[1] = supply(ETH, 0.5e18, wallet, 0)

        Note over Adapter: Batch[2]: Borrow USDC
        Adapter->>Adapter: targets[2] = aavePool<br/>datas[2] = borrow(<br/>  USDC, 600e6,<br/>  VARIABLE_RATE, 0, wallet<br/>)

        Note over Adapter: Batch[3]: Record building
        Adapter->>Adapter: metadata = encode("borrow", 0.5e18, 600e6)<br/>targets[3] = core<br/>datas[3] = recordBuildingPlacement(...)

        Adapter-->>Registry: (targets[], values[], datas[])
        Registry-->>Frontend: (targets[], values[], datas[])
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
        Wallet->>Aave: borrow(<br/>  USDC, 600e6,<br/>  VARIABLE_RATE, 0, wallet<br/>)
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
        Core->>Core: metadata = abi.encode(<br/>  "borrow", 0.5e18, 600e6<br/>)
        Core->>Core: Save building with metadata
        Core-->>Wallet: buildingId

        Wallet-->>Frontend: ✓
    end

    Frontend->>Frontend: Show building with:<br/>- Collateral: 0.5 ETH<br/>- Borrowed: 600 USDC<br/>- Health Factor: 2.0 (safe)<br/>- Net APY: -2% (borrow cost)

    Frontend-->>User: "Bank Created with Borrow! ⚠️<br/>Monitor health factor"

    Note over User,Core: User has leveraged position:<br/>- Earning on ETH collateral<br/>- Paying interest on USDC debt
```

**Health Factor Management:**
- ✅ Pre-check by BankAdapter before allowing borrow
- ⚠️ Warning when HF < 1.5
- ❌ Liquidation risk when HF < 1.0
- ℹ️ User can repay anytime to improve HF

---

## UC-004: Place Shop Building - Aerodrome LP

**Epic 4: US-013 - Provide liquidity on Aerodrome DEX**

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Registry as BuildingRegistry
    participant Adapter as ShopAdapter
    participant Wallet as SmartWallet
    participant Router as Aerodrome Router
    participant Core as DefiCityCore

    Note over User,Core: User wants to provide liquidity

    User->>Frontend: Select "Place Shop"
    Frontend->>Frontend: User enters:<br/>- Token A: USDC<br/>- Token B: WETH<br/>- Amount A: 1000 USDC<br/>- Amount B: 0.5 WETH<br/>- Pool Type: Stable<br/>- Position: (x, y)

    rect rgb(255, 240, 240)
        Frontend->>Frontend: params = abi.encode({<br/>  tokenA: USDC,<br/>  tokenB: WETH,<br/>  amountA: 1000e6,<br/>  amountB: 0.5e18,<br/>  stable: true,<br/>  x: x, y: y<br/>})

        Frontend->>Registry: preparePlace("shop", user, wallet, params)

        Registry->>Adapter: preparePlace(user, wallet, params)

        Note over Adapter: Decode ShopParams
        Adapter->>Adapter: PlaceParams memory p = decode(params)
        Adapter->>Adapter: require(p.tokenA != 0 && p.tokenB != 0)
        Adapter->>Adapter: require(p.amountA > 0 && p.amountB > 0)
        Adapter->>Adapter: require(p.tokenA != p.tokenB)

        Note over Adapter: Prepare batch [approve A, approve B, addLiquidity, record]

        Adapter->>Adapter: targets[0] = USDC<br/>datas[0] = approve(router, 1000e6)

        Adapter->>Adapter: targets[1] = WETH<br/>datas[1] = approve(router, 0.5e18)

        Note over Adapter: Calculate min amounts (5% slippage)
        Adapter->>Adapter: minA = 1000e6 * 95%<br/>minB = 0.5e18 * 95%

        Adapter->>Adapter: targets[2] = aerodromeRouter<br/>datas[2] = addLiquidity(<br/>  USDC, WETH, true,<br/>  1000e6, 0.5e18,<br/>  minA, minB,<br/>  wallet, deadline<br/>)

        Adapter->>Adapter: metadata = encode("aerodrome_lp", USDC, WETH, true)<br/>targets[3] = core<br/>datas[3] = recordBuildingPlacement(...)

        Adapter-->>Registry: (targets[], values[], datas[])
        Registry-->>Frontend: (targets[], values[], datas[])
    end

    rect rgb(240, 255, 240)
        Frontend->>Wallet: executeFromGame(targets, values, datas)

        Wallet->>Wallet: Validate session key ✓

        Wallet->>Wallet: Execute approvals

        Note over Wallet: Add Liquidity
        Wallet->>Router: addLiquidity(USDC, WETH, stable, ...)
        Router->>Router: Create or use existing pool
        Router->>Router: Transfer tokens from wallet
        Router->>Router: Mint LP tokens to wallet
        Router-->>Wallet: (amountA, amountB, liquidity)

        Wallet->>Core: recordBuildingPlacement(...)
        Core->>Core: Save shop building
        Core-->>Wallet: buildingId

        Wallet-->>Frontend: ✓
    end

    Frontend-->>User: "Shop Created!<br/>Earning trading fees 💱"

    Note over User,Core: Building earning trading fees from LP
```

**ShopAdapter Features:**
- ✅ Handles Aerodrome DEX integration
- ✅ Supports both stable and volatile pools
- ✅ 5% slippage protection
- ✅ Records metadata for LP position tracking

---

## UC-005: Place Lottery Building - Megapot

**Epic 4: US-014 - Buy lottery tickets**

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Registry as BuildingRegistry
    participant Adapter as LotteryAdapter
    participant Wallet as SmartWallet
    participant Megapot as Megapot Protocol
    participant Core as DefiCityCore

    Note over User,Core: User wants to buy lottery tickets

    User->>Frontend: Select "Place Lottery"
    Frontend->>Frontend: User enters:<br/>- Amount: 100 USDC<br/>- Position: (x, y)

    rect rgb(255, 240, 240)
        Frontend->>Frontend: params = abi.encode({<br/>  amount: 100e6,<br/>  x: x,<br/>  y: y<br/>})

        Frontend->>Registry: preparePlace("lottery", user, wallet, params)

        Registry->>Adapter: preparePlace(user, wallet, params)

        Note over Adapter: Decode LotteryParams
        Adapter->>Adapter: PlaceParams memory p = decode(params)
        Adapter->>Adapter: require(p.amount > 0)

        Note over Adapter: Prepare batch [approve, buyTickets, record]

        Adapter->>Adapter: targets[0] = USDC<br/>datas[0] = approve(megapot, 100e6)

        Note over Adapter: Use treasury as referrer (for referral fees)
        Adapter->>Adapter: targets[1] = megapot<br/>datas[1] = buyTickets(100e6, treasury)

        Adapter->>Adapter: metadata = encode("megapot_lottery", 100e6)<br/>targets[2] = core<br/>datas[2] = recordBuildingPlacement(...)

        Adapter-->>Registry: (targets[], values[], datas[])
        Registry-->>Frontend: (targets[], values[], datas[])
    end

    rect rgb(240, 255, 240)
        Frontend->>Wallet: executeFromGame(targets, values, datas)

        Wallet->>Wallet: Validate session key ✓

        Wallet->>Wallet: Execute approval

        Note over Wallet: Buy Tickets
        Wallet->>Megapot: buyTickets(100e6, treasury)
        Megapot->>Megapot: Transfer USDC from wallet
        Megapot->>Megapot: Mint lottery tickets
        Megapot->>Megapot: Pay referral fee to treasury
        Megapot-->>Wallet: ticketIds[]

        Wallet->>Core: recordBuildingPlacement(...)
        Core->>Core: Save lottery building
        Core-->>Wallet: buildingId

        Wallet-->>Frontend: ✓
    end

    Frontend-->>User: "Lottery Created!<br/>Tickets purchased 🎰"

    Note over User,Core: Building holds lottery tickets<br/>Can claim prizes when winning
```

**LotteryAdapter Features:**
- ✅ USDC-only (Megapot requirement)
- ✅ Treasury as referrer (protocol earns referral fees)
- ✅ No refund on demolish (tickets stay in Megapot)
- ✅ Variable yield (based on lottery draws)

---

## UC-006: Harvest Yield from Building

**Epic 4: US-015 - Claim accumulated yield**

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Registry as BuildingRegistry
    participant Adapter as BankAdapter
    participant Wallet as SmartWallet
    participant Aave as Aave V3 Pool
    participant Core as DefiCityCore

    Note over User,Core: Building has pending yield

    User->>Frontend: Click building
    Frontend->>Frontend: Show "Pending: 2.5 USDC"

    User->>Frontend: Click "Harvest"

    rect rgb(255, 240, 240)
        Frontend->>Frontend: params = abi.encode({<br/>  asset: USDC,<br/>  amount: 2.5e6<br/>})

        Frontend->>Registry: prepareHarvest(<br/>  "bank",<br/>  user,<br/>  wallet,<br/>  buildingId,<br/>  params<br/>)

        Registry->>Adapter: prepareHarvest(user, wallet, buildingId, params)

        Note over Adapter: Validate building ownership
        Adapter->>Core: buildings(buildingId)
        Core-->>Adapter: (owner, wallet, type, asset...)

        rect rgb(255, 255, 200)
            Note over Adapter: SECURITY: Validate building
            Adapter->>Adapter: require(<br/>  keccak256(type) == keccak256("bank")<br/>)
            Adapter->>Adapter: require(buildingOwner == user)
        end

        Note over Adapter: Prepare batch [withdraw, recordHarvest]

        Adapter->>Adapter: targets[0] = aavePool<br/>datas[0] = withdraw(USDC, 2.5e6, wallet)

        Adapter->>Adapter: targets[1] = core<br/>datas[1] = recordHarvest(user, buildingId, 2.5e6)

        Adapter-->>Registry: (targets[], values[], datas[])
        Registry-->>Frontend: (targets[], values[], datas[])
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

**Multi-Adapter Harvest:**
- Bank: Withdraw from Aave
- Shop: Claim trading fees + AERO rewards
- Lottery: Claim prizes from winning tickets

---

## UC-007: Demolish Building

**Remove building and withdraw all funds**

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Registry as BuildingRegistry
    participant Adapter as BankAdapter
    participant Wallet as SmartWallet
    participant Aave as Aave V3 Pool
    participant Core as DefiCityCore

    Note over User,Core: User wants to demolish Bank

    User->>Frontend: Click building
    User->>Frontend: Click "Demolish"

    Frontend->>Frontend: Show confirmation:<br/>"Withdraw all funds?<br/>Building will be removed"

    User->>Frontend: Confirm

    rect rgb(255, 240, 240)
        Frontend->>Frontend: params = abi.encode({<br/>  asset: USDC<br/>})

        Frontend->>Registry: prepareDemolish(<br/>  "bank",<br/>  user,<br/>  wallet,<br/>  buildingId,<br/>  params<br/>)

        Registry->>Adapter: prepareDemolish(user, wallet, buildingId, params)

        Adapter->>Core: buildings(buildingId)
        Core-->>Adapter: (owner, wallet, type, amount...)

        Adapter->>Adapter: Validate building type & owner

        Note over Adapter: Prepare batch [withdrawAll, recordDemolition]

        Adapter->>Adapter: targets[0] = aavePool<br/>datas[0] = withdraw(<br/>  USDC,<br/>  type(uint256).max,<br/>  wallet<br/>)

        Adapter->>Adapter: targets[1] = core<br/>datas[1] = recordDemolition(<br/>  user, buildingId, amount<br/>)

        Adapter-->>Registry: (targets[], values[], datas[])
        Registry-->>Frontend: (targets[], values[], datas[])
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
- ⚠️ Lottery: tickets stay in Megapot (no refund)

---

## UC-008: Withdraw Funds to External Wallet

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

## UC-009: Session Key Management

**Epic 7: Gasless gameplay with session keys**

### 9a. Create Session Key (First Time)

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

### 9b. Session Key Spending Tracking

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

## Summary of Adapter Pattern Architecture

### ✅ Key Components

**1. BuildingRegistry (Central Router)**
- Routes all building operations to correct adapter
- Manages adapter registration/upgrades
- Pass-through for validation, fees, yields

**2. Building Adapters**
- **BankAdapter**: Aave V3 supply/borrow (~436 lines)
- **ShopAdapter**: Aerodrome DEX LP provision (~370 lines)
- **LotteryAdapter**: Megapot lottery tickets (~290 lines)

**3. Core Contracts**
- **DefiCityCore**: Game state & building records (no tokens)
- **SmartWallet**: User's self-custodial wallet (holds all assets)
- **WalletFactory**: Creates SmartWallets only

### 🎯 Key Flows

- **New Player**: EOA → Core.createTownHall() → Factory creates wallet → Core records building
- **Place Building**: Registry → Adapter.preparePlace() → Wallet executes via session key → DeFi protocol → Core records
- **Harvest**: Registry → Adapter.prepareHarvest() → Withdraw from protocol → Update stats
- **Demolish**: Registry → Adapter.prepareDemolish() → Withdraw all → Mark inactive
- **Withdraw**: Owner pays gas → Direct transfer to external wallet

### ✨ Adapter Pattern Benefits

**Maintainability:**
- ✅ Each adapter ~300-400 lines (vs 940+ monolithic)
- ✅ Test each adapter independently
- ✅ Deploy/upgrade adapters independently

**Extensibility:**
- ✅ Add new building types without touching existing code
- ✅ Just deploy new adapter + register
- ✅ Example: FarmAdapter (Beefy) = deploy + register("farm")

**Fee Management:**
- ✅ Each adapter manages its own fees (0.05% default)
- ✅ Easy to adjust per building type

**Protocol Integration:**
- ✅ Adapter encapsulates protocol-specific logic
- ✅ Easy to upgrade protocol integrations
- ✅ Example: Aave V3 → V4 = upgrade BankAdapter only

---

**END OF DOCUMENT**
