# DefiCity Contract Architecture v2.0: Self-Custodial Design

**Document Version:** 2.2
**Last Updated:** 2026-01-29
**Status:** Implemented (Base Sepolia Testnet)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Principles](#core-principles)
3. [Architecture Overview](#architecture-overview)
4. [Contract Overview](#contract-overview)
5. [Asset Flow](#asset-flow)
6. [Session Key Mechanism](#session-key-mechanism)
7. [Adapter Pattern](#adapter-pattern)
8. [Security & Trust Model](#security--trust-model)
9. [User Experience Flow](#user-experience-flow)
10. [Deployed Addresses](#deployed-addresses)
11. [Supported Assets](#supported-assets)

---

## Executive Summary

DefiCity v2.0 uses a **self-custodial architecture** where users maintain full control and ownership of their assets at all times. Users own an ERC-4337 SmartWallet that holds all tokens and interacts directly with DeFi protocols (Aave, Aerodrome, Megapot). The game contracts only track state (bookkeeping).

### Key Design Decisions

- **SmartWallet holds all tokens** - Game contracts never custody user funds
- **BuildingRegistry + Adapter pattern** - Modular, hot-swappable building type implementations
- **Direct DeFi interaction** - SmartWallet calls protocols directly (no intermediary strategies)
- **Session keys** - Allow gasless gameplay with time and spending limits
- **On-chain grid** - Building positions tracked on-chain in a 13x13 grid

---

## Core Principles

### 1. Separation of Custody and Accounting

```
Custody Layer (SmartWallet)        Accounting Layer (DefiCityCore)
├── Holds all user tokens          ├── Tracks buildings and game state
├── Executes DeFi interactions     ├── Records user actions
├── Owned and controlled by user   ├── Maintains leaderboard stats
├── Can be accessed independently  ├── NEVER holds tokens
└── Emergency withdrawal anytime   └── Emits events for indexing
```

### 2. User Authorization Model

```
User EOA → SmartWallet → execute/executeBatch → DeFi Protocols
  (owns)     (holds $)    (approved actions)     (Aave, etc.)
```

- User owns SmartWallet via EOA
- Owner can execute any transaction through SmartWallet
- Session keys allow limited automated execution
- Emergency withdrawal always available

### 3. Trustless Operation

Users can:

- View SmartWallet balance on-chain without game UI
- Withdraw from SmartWallet directly via block explorer
- Revoke session keys at any time
- Verify all transactions on BaseScan

---

## Architecture Overview

```
┌─────────────┐
│   User EOA  │ (MetaMask)
└──────┬──────┘
       │ owns
       ↓
┌─────────────────┐
│  SmartWallet    │ ← HOLDS ALL TOKENS (ERC20 + ETH)
│  (ERC-4337 AA)  │ ← Receives aTokens from Aave
│  per user       │
└────┬────────┬───┘
     │        │
     │        │ executeBatch() via owner or session key
     │        ↓
     │  ┌─────────────────────────────────────┐
     │  │         BuildingRegistry             │ ← Routes to correct adapter
     │  │  ┌───────────┬───────────┬────────┐  │
     │  │  │BankAdapter│ShopAdapter│Lottery │  │
     │  │  │  (Aave)   │(Aerodrome)│(Megapot)│  │
     │  │  └───────────┴───────────┴────────┘  │
     │  └─────────────────────────────────────┘
     │        │
     │        │ preparePlace() → returns calldata
     │        ↓
     │  ┌─────────────────┐
     │  │  DefiCityCore   │ ← BOOKKEEPING ONLY
     │  │  Game State     │    Buildings, Grid, Stats
     │  └─────────────────┘
     │
     │ direct interaction via executeBatch
     ↓
┌─────────────────┐
│  DeFi Protocols │
│  ├── Aave V3    │ (supply, withdraw, borrow, repay)
│  ├── Aerodrome  │ (LP provision, fee claiming)
│  └── Megapot    │ (lottery tickets, prize claims)
└─────────────────┘
```

---

## Contract Overview

### 1. DefiCityCore (`contracts/core/DefiCityCore.sol`)

**Type:** Central bookkeeping contract
**Inheritance:** `ReentrancyGuard`, `Pausable`, `Ownable`, `AccessControl`

**Access Control Roles:**

| Role                  | Purpose                           |
| --------------------- | --------------------------------- |
| `PAUSER_ROLE`         | Can pause/unpause the contract    |
| `ASSET_MANAGER_ROLE`  | Can add/remove supported assets   |
| `MODULE_MANAGER_ROLE` | Can update module addresses       |
| `EMERGENCY_ROLE`      | Reserved for emergency operations |
| `DEFAULT_ADMIN_ROLE`  | Can grant/revoke all roles        |

**Responsibilities:**

- Track buildings and game state on a 13x13 grid
- Record user actions for analytics
- Maintain user statistics and leaderboards
- Manage wallet registration via WalletFactory
- **NEVER holds user tokens**

**Key State:**

```solidity
mapping(address => address) public userSmartWallets;    // EOA → SmartWallet
mapping(address => address) public walletToOwner;       // SmartWallet → EOA
mapping(uint256 => Building) public buildings;           // Building data by ID
mapping(address => uint256[]) public userBuildings;      // User's building IDs
mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public userGridBuildings;
                                                         // user → x → y → buildingId
mapping(address => UserStats) public userStats;          // User statistics
mapping(address => bool) public supportedAssets;         // Whitelisted assets
uint256 public buildingIdCounter;                        // Auto-increment ID
```

**Building Struct:**

```solidity
struct Building {
    uint256 id;
    address owner;          // User's EOA
    address smartWallet;    // User's SmartWallet
    string buildingType;    // "bank", "shop", "lottery", "townhall"
    address asset;          // Token address (USDC, WETH, etc.)
    uint256 amount;         // Initial amount invested
    uint256 placedAt;       // Timestamp of placement
    uint256 coordinateX;    // Grid position X (1-13)
    uint256 coordinateY;    // Grid position Y (1-13)
    bool active;            // Is building active
    bytes metadata;         // Extra data (e.g., borrow mode, LP pair)
}
```

**UserStats Struct:**

```solidity
struct UserStats {
    uint256 totalDeposited;
    uint256 totalWithdrawn;
    uint256 totalHarvested;
    uint256 buildingCount;
    uint256 cityCreatedAt;
}
```

**Key Functions:**

| Function                                                                            | Access              | Purpose                                            |
| ----------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------- |
| `createTownHall(uint256 x, uint256 y)`                                              | External            | Entry point: deploy SmartWallet + create Town Hall |
| `registerWallet(address user, address smartWallet)`                                 | WalletFactory       | Register SmartWallet mapping                       |
| `recordBuildingPlacement(...)`                                                      | onlyModules         | Record building after DeFi action                  |
| `recordDemolition(address user, uint256 buildingId, uint256 returnedAmount)`        | onlyModules         | Record building demolition                         |
| `recordHarvest(address user, uint256 buildingId, uint256 yieldAmount)`              | onlyModules         | Record reward harvest                              |
| `recordDeposit(address user, address asset, uint256 amount)`                        | onlyModules         | Record deposit for analytics                       |
| `recordWithdrawal(address user, address asset, uint256 amount)`                     | onlyModules         | Record withdrawal                                  |
| `moveBuilding(uint256 buildingId, uint256 newX, uint256 newY)`                      | onlyUserWallet      | Move building on grid                              |
| `getUserBuildings(address user)`                                                    | View                | Get all user's buildings                           |
| `getBuildingAt(address user, uint256 x, uint256 y)`                                 | View                | Get building at grid position                      |
| `getUserStats(address user)`                                                        | View                | Get user statistics                                |
| `addSupportedAsset(address asset)`                                                  | ASSET_MANAGER_ROLE  | Whitelist asset                                    |
| `removeSupportedAsset(address asset)`                                               | ASSET_MANAGER_ROLE  | Remove asset from whitelist                        |
| `setModules(address buildingManager, address feeManager, address emergencyManager)` | MODULE_MANAGER_ROLE | Set module addresses                               |
| `pause()`                                                                           | PAUSER_ROLE         | Pause contract                                     |
| `unpause()`                                                                         | PAUSER_ROLE         | Unpause contract                                   |

**Events:**

```solidity
event WalletRegistered(address indexed user, address indexed smartWallet);
event BuildingPlaced(uint256 indexed buildingId, address indexed user, address indexed smartWallet,
                     string buildingType, address asset, uint256 amount, uint256 x, uint256 y);
event BuildingDemolished(uint256 indexed buildingId, address indexed user, uint256 returnedAmount);
event Harvested(uint256 indexed buildingId, address indexed user, uint256 yieldAmount);
event DepositRecorded(address indexed user, address indexed asset, uint256 amount);
event WithdrawalRecorded(address indexed user, address indexed asset, uint256 amount);
event ModulesUpdated(address buildingManager, address feeManager, address emergencyManager);
event FactoryUpdated(address walletFactory);
event AssetAdded(address indexed asset);
event AssetRemoved(address indexed asset);
```

---

### 2. SmartWallet (`contracts/wallet/SmartWallet.sol`)

**Type:** ERC-4337 Account Abstraction Wallet
**Inheritance:** `IAccount`, `IAccountExecute`, `ReentrancyGuard`, `IERC721Receiver`, `IERC1155Receiver`

**Responsibilities:**

- Hold all user tokens (ERC20, native ETH, ERC721, ERC1155)
- Execute DeFi protocol interactions
- Manage session key permissions
- ERC-4337 UserOperation validation
- Emergency withdrawal capability

**Key State:**

```solidity
IEntryPoint public immutable entryPoint;
address public owner;                                    // User's EOA
DefiCityCore public immutable core;                     // Game contract
bool public paused;                                      // Emergency pause
mapping(address => SessionKeyInfo) public sessionKeys;   // Session key data
mapping(address => bool) public whitelistedTargets;      // Allowed targets for session keys
```

**SessionKeyInfo Struct:**

```solidity
struct SessionKeyInfo {
    bool active;
    uint256 validUntil;       // Expiry timestamp
    uint256 dailyLimit;       // Max spending per 24h window (USD, 6 decimals)
    uint256 windowStart;      // Current window start
    uint256 spentInWindow;    // Amount spent in current window
}
```

**Key Functions:**

| Function                                                                | Access           | Purpose                         |
| ----------------------------------------------------------------------- | ---------------- | ------------------------------- |
| `validateUserOp(UserOperation, bytes32, uint256)`                       | EntryPoint       | ERC-4337 validation             |
| `execute(address dest, uint256 value, bytes func)`                      | Owner/EntryPoint | Execute single transaction      |
| `executeBatch(address[] dest, uint256[] value, bytes[] func)`           | Owner/EntryPoint | Execute batch transactions      |
| `executeFromGame(address[] targets, uint256[] values, bytes[] datas)`   | SessionKey       | Execute via session key         |
| `createSessionKey(address key, uint256 validUntil, uint256 dailyLimit)` | Owner            | Create session key              |
| `revokeSessionKey(address key)`                                         | Owner            | Revoke session key              |
| `updateWhitelistedTarget(address target, bool whitelisted)`             | Owner            | Manage target whitelist         |
| `emergencyWithdraw(address token, address to, uint256 amount)`          | Owner            | Recover tokens                  |
| `transferOwnership(address newOwner)`                                   | Owner            | Start 2-step ownership transfer |
| `acceptOwnership()`                                                     | PendingOwner     | Accept ownership transfer       |
| `pause()` / `unpause()`                                                 | Owner            | Emergency pause                 |

**Token Reception:**

- Supports receiving ETH, ERC-721, ERC-1155 tokens
- Implements `onERC721Received()`, `onERC1155Received()`

---

### 3. WalletFactory (`contracts/factory/WalletFactory.sol`)

**Type:** Deterministic wallet deployer using CREATE2
**Inheritance:** `AccessControl`

**Access Control Roles:**

| Role                 | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `DEPLOYER_ROLE`      | Can deploy wallets (granted to DefiCityCore) |
| `ADMIN_ROLE`         | Administrative operations                    |
| `DEFAULT_ADMIN_ROLE` | Can grant/revoke all roles                   |

**Key State:**

```solidity
IEntryPoint public immutable entryPoint;
DefiCityCore public immutable core;
mapping(address => address) public walletsByOwner;   // Owner → Wallet (salt=0)
mapping(address => bool) public isWallet;            // Wallet registry
uint256 public totalWallets;
```

**Key Functions:**

| Function                                                | Access        | Purpose                             |
| ------------------------------------------------------- | ------------- | ----------------------------------- |
| `createWallet(address owner, uint256 salt)`             | DEPLOYER_ROLE | Deploy wallet via CREATE2           |
| `createOrGetWallet(address owner)`                      | DEPLOYER_ROLE | Create if needed or return existing |
| `getAddress(address owner, uint256 salt)`               | View          | Compute counterfactual address      |
| `isWalletDeployed(address owner, uint256 salt)`         | View          | Check if wallet exists              |
| `getWalletByOwner(address owner)`                       | View          | Get default wallet                  |
| `createWalletsBatch(address[] owners, uint256[] salts)` | DEPLOYER_ROLE | Batch deployment                    |
| `getAddressesBatch(address[] owners, uint256[] salts)`  | View          | Compute multiple addresses          |

**Events:**

```solidity
event WalletCreated(address indexed wallet, address indexed owner, uint256 salt, uint256 walletNumber);
```

---

### 4. BuildingRegistry (`contracts/core/BuildingRegistry.sol`)

**Type:** Adapter routing and management
**Inheritance:** `AccessControl`, `Pausable`, `ReentrancyGuard`

**Access Control Roles:**

| Role                   | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| `ADAPTER_MANAGER_ROLE` | Can register, upgrade, and remove adapters |
| `PAUSER_ROLE`          | Can pause/unpause the contract             |
| `DEFAULT_ADMIN_ROLE`   | Can grant/revoke all roles                 |

**Purpose:** Central registry that routes building operations to the correct adapter. Enables hot-swappable adapter implementations without changing core contracts.

**Key State:**

```solidity
mapping(string => address) public adapters;      // buildingType → adapter address
string[] public buildingTypes;                    // Registered types list
mapping(string => bool) public isRegistered;      // Registration status
```

**Key Functions:**

| Function                                                                               | Access               | Purpose                                  |
| -------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------- |
| `preparePlace(string type, address user, address wallet, bytes params)`                | View (whenNotPaused) | Route to adapter's preparePlace          |
| `prepareHarvest(string type, address user, address wallet, uint256 id, bytes params)`  | View (whenNotPaused) | Route to adapter's prepareHarvest        |
| `prepareDemolish(string type, address user, address wallet, uint256 id, bytes params)` | View (whenNotPaused) | Route to adapter's prepareDemolish       |
| `registerAdapter(string type, address adapter)`                                        | ADAPTER_MANAGER_ROLE | Register new adapter                     |
| `upgradeAdapter(string type, address newAdapter)`                                      | ADAPTER_MANAGER_ROLE | Hot-swap adapter                         |
| `removeAdapter(string type)`                                                           | ADAPTER_MANAGER_ROLE | Remove adapter                           |
| `validatePlacement(string type, bytes params)`                                         | View                 | Validate placement params                |
| `getPlacementFee(string type)`                                                         | View                 | Get fee in basis points                  |
| `calculateFee(string type, uint256 amount)`                                            | View                 | Calculate fee amount                     |
| `getRequiredProtocols(string type)`                                                    | View                 | Get protocol addresses for building type |
| `estimateYield(string type, uint256 buildingId)`                                       | View                 | Estimate yield for building              |
| `pause()`                                                                              | PAUSER_ROLE          | Pause contract                           |
| `unpause()`                                                                            | PAUSER_ROLE          | Unpause contract                         |

---

## Asset Flow

### Flow 1: Deposit (EOA → SmartWallet)

```
1. User has USDC in MetaMask (EOA)
2. User clicks "Deposit 100 USDC"
3. Frontend: USDC.transfer(smartWallet, 100 USDC)  ← user signs in MetaMask
4. USDC now in user's SmartWallet
5. UI refetches balances
```

**For ETH:** Direct ETH transfer from EOA to SmartWallet (no approve needed)
**For ERC20:** `Token.transfer(smartWallet, amount)` (no approve needed, direct transfer)

---

### Flow 2: Place Bank Building (Supply to Aave)

```
1. User has 100 USDC in SmartWallet
2. User clicks tile on map → selects USDC → enters amount
3. Frontend calls BankAdapter.preparePlace(user, smartWallet, params)
   → Returns batch calldata: [approve, supply, recordBuilding]
4. For ETH: prepend WETH.deposit() to batch (wrap native ETH)
5. Frontend calls SmartWallet.executeBatch(targets, values, datas)
6. SmartWallet executes batch:
   a. [ETH only] WETH.deposit{value: amount}()         ← wrap to WETH
   b. Token.approve(AAVE_POOL, amount)                  ← approve pool
   c. AAVE_POOL.supply(token, amount, smartWallet, 0)   ← supply to Aave
   d. DefiCityCore.recordBuildingPlacement(...)          ← record on grid
7. SmartWallet receives aTokens (interest-bearing)
8. Building appears on map
```

**Upgrade (existing building):** Same flow but skip step (d) - no new building record

---

### Flow 3: Withdraw from Aave

```
1. User clicks building → "WITHDRAW" button
2. Frontend calls BankAdapter.prepareDemolish(user, smartWallet, buildingId, params)
   → Returns batch calldata: [withdraw, recordDemolition]
3. SmartWallet.executeBatch():
   a. AAVE_POOL.withdraw(token, amount, smartWallet)    ← withdraw from Aave
   b. [ETH only] WETH.withdraw(amount)                  ← unwrap to ETH
   c. DefiCityCore.recordDemolition(...)                 ← demolish building
4. Tokens return to SmartWallet
5. Building removed from map (if full withdrawal)
```

---

### Flow 4: Withdraw from Vault (SmartWallet → EOA)

```
1. User clicks "Withdraw to Wallet"
2. Frontend: SmartWallet.execute(token, 0, transfer_calldata)
   - For ETH: SmartWallet.execute(userEOA, amount, "0x")
   - For ERC20: SmartWallet.execute(token, 0, encode(transfer(userEOA, amount)))
3. Tokens transferred to user's EOA
```

---

### Flow 5: Move Building on Grid

```
1. User drags building to new tile
2. Frontend: SmartWallet.execute(core, 0, encode(moveBuilding(id, newX, newY)))
3. DefiCityCore updates grid position on-chain
4. UI refreshes building positions
```

---

### Emergency Direct Withdrawal

```
1. User opens BaseScan
2. Calls SmartWallet.emergencyWithdraw(token, userEOA, amount) directly
3. Only owner (user's EOA) can call this
4. Tokens transferred to EOA immediately
5. Game state becomes inconsistent, but user has funds
```

---

## Session Key Mechanism

### Purpose

Session keys allow automated game actions (e.g., backend-triggered harvests) without requiring user signature for every transaction.

### SessionKeyInfo

```solidity
struct SessionKeyInfo {
    bool active;
    uint256 validUntil;       // Max: 30 days from creation
    uint256 dailyLimit;       // Rolling 24-hour spending cap (USD, 6 decimals)
    uint256 windowStart;      // Current 24h window start
    uint256 spentInWindow;    // Amount spent in current window
}
```

### Lifecycle

**1. Creation (user signs once):**

```solidity
smartWallet.createSessionKey(
    sessionKeyAddress,
    block.timestamp + 24 hours,  // Min: 1 hour, Max: 30 days
    1000 * 1e6                    // $1000 daily limit
);
```

**2. Usage (no user signature needed):**

```solidity
// Backend calls with session key signature
smartWallet.executeFromGame(
    [aavePool, core],                          // targets
    [0, 0],                                     // values
    [supplyCalldata, recordBuildingCalldata]    // datas
);
```

**3. Validation (automatic):**

- Session key must be active and not expired
- Rolling 24-hour spending window enforced
- All targets must be whitelisted
- ETH value estimated at $2000/ETH for limit tracking

**4. Revocation (user can revoke anytime):**

```solidity
smartWallet.revokeSessionKey(sessionKeyAddress);
```

### Security Constraints

| Constraint             | Limit                                 |
| ---------------------- | ------------------------------------- |
| Min validity           | 1 hour                                |
| Max validity           | 30 days                               |
| Daily spending cap     | Configurable per key                  |
| Target whitelist       | Only approved contracts               |
| Withdrawal restriction | Cannot transfer to external addresses |
| Revocation             | Owner can revoke immediately          |

---

## Adapter Pattern

### IBuildingAdapter Interface

All building types implement this interface:

```solidity
interface IBuildingAdapter {
    // Core operations - return batch calldata for SmartWallet
    function preparePlace(address user, address userSmartWallet, bytes calldata params)
        external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas);

    function prepareHarvest(address user, address userSmartWallet, uint256 buildingId, bytes calldata params)
        external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas);

    function prepareDemolish(address user, address userSmartWallet, uint256 buildingId, bytes calldata params)
        external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas);

    // Metadata
    function getBuildingType() external view returns (string memory);
    function getRequiredProtocols() external view returns (address[] memory);
    function validatePlacement(bytes calldata params) external view returns (bool, string memory);
    function estimateYield(uint256 buildingId) external view returns (uint256, address);

    // Fee management
    function getPlacementFee() external view returns (uint256 feeBps);
    function calculateFee(uint256 amount) external view returns (uint256 feeAmount, uint256 netAmount);
    function getTreasury() external view returns (address);
}
```

### Implemented Adapters

#### BankAdapter (Aave V3)

**Building Type:** `"bank"`
**Protocol:** Aave V3 Pool
**Fee:** 0.05% (5 basis points)

**PlaceParams:**

```solidity
struct PlaceParams {
    address asset;          // Token to supply
    uint256 amount;         // Amount to supply
    uint256 x;              // Grid position
    uint256 y;
    bool isBorrowMode;      // Supply-only vs supply+borrow
    address borrowAsset;    // Asset to borrow (if borrow mode)
    uint256 borrowAmount;   // Amount to borrow
}
```

**Supply mode batch:** `[approve, supply, recordBuilding]`
**Borrow mode batch:** `[approve, supply, borrow, recordBuilding]` (with health factor check >= 1.5)

#### ShopAdapter (Aerodrome DEX)

**Building Type:** `"shop"`
**Protocol:** Aerodrome Router
**Fee:** 0.05% (5 basis points)

**PlaceParams:**

```solidity
struct PlaceParams {
    address tokenA;
    address tokenB;
    uint256 amountA;
    uint256 amountB;
    bool stable;            // Stable vs Volatile pool
    uint256 x;
    uint256 y;
}
```

**Place batch:** `[approve A, approve B, addLiquidity, recordBuilding]`
**Harvest batch:** `[claimFees]` or `[gauge.getReward]`
**Demolish batch:** `[removeLiquidity, recordDemolition]`

#### LotteryAdapter (Megapot)

**Building Type:** `"lottery"`
**Protocol:** Megapot
**Fee:** 0.05% (5 basis points)

**PlaceParams:**

```solidity
struct PlaceParams {
    uint256 amount;         // USDC amount for tickets
    uint256 x;
    uint256 y;
}
```

**Place batch:** `[approve USDC, buyTickets, recordBuilding]`
**Harvest batch:** `[claimPrizes(ticketIds)]`

---

## Security & Trust Model

### Trust Requirements (Self-Custodial)

Users must trust:

1. Their own SmartWallet contract (they own it)
2. Session key is properly scoped (they created it)

Users DON'T need to trust:

- Game contracts holding funds correctly (they don't hold any)
- Admin won't drain funds (can't access SmartWallet)
- Emergency pause won't lock funds (funds in SmartWallet, not Core)

### Security Features

| Feature                   | Implementation                                             |
| ------------------------- | ---------------------------------------------------------- |
| Reentrancy Protection     | `ReentrancyGuard` on all critical functions                |
| Pausable                  | Emergency pause on Core, BuildingRegistry, and SmartWallet |
| Role-Based Access Control | OpenZeppelin `AccessControl` with granular roles           |
| Legacy Access Control     | `onlyOwner`, `onlyModules`, `onlyUserWallet` modifiers     |
| Session Key Limits        | Rolling 24h window with USD spending cap                   |
| Health Factor             | BankAdapter checks HF >= 1.5 before borrowing              |
| Grid Occupancy            | Prevents duplicate buildings at same coordinates           |
| 2-Step Ownership          | `transferOwnership()` + `acceptOwnership()` pattern        |
| Target Whitelist          | Session keys can only call whitelisted contracts           |
| CREATE2                   | Deterministic wallet addresses via factory                 |

### Access Control Roles Summary

| Contract         | Role                   | Purpose                     |
| ---------------- | ---------------------- | --------------------------- |
| DefiCityCore     | `PAUSER_ROLE`          | Pause/unpause contract      |
| DefiCityCore     | `ASSET_MANAGER_ROLE`   | Add/remove supported assets |
| DefiCityCore     | `MODULE_MANAGER_ROLE`  | Update module addresses     |
| DefiCityCore     | `EMERGENCY_ROLE`       | Emergency operations        |
| BuildingRegistry | `ADAPTER_MANAGER_ROLE` | Manage adapters             |
| BuildingRegistry | `PAUSER_ROLE`          | Pause/unpause contract      |
| WalletFactory    | `DEPLOYER_ROLE`        | Deploy new wallets          |
| WalletFactory    | `ADMIN_ROLE`           | Administrative operations   |

### Attack Vector Analysis

| Attack                    | Mitigation                                       |
| ------------------------- | ------------------------------------------------ |
| Session key compromise    | Limited: daily cap, time limit, target whitelist |
| Core contract bug         | Funds safe: Core is bookkeeping-only             |
| Bookkeeping inconsistency | UI issues only, funds unaffected                 |
| Admin key compromise      | Cannot access user SmartWallets                  |
| Grid manipulation         | `onlyUserWallet` modifier, occupancy checks      |

---

## User Experience Flow

### First-Time Onboarding

```
1. User visits DefiCity → connects wallet (MetaMask)
2. No SmartWallet found → mandatory "Create Town Hall" modal
3. User clicks "CREATE TOWN HALL"
4. DefiCityCore.createTownHall(7, 7):
   a. WalletFactory.createWallet(user, 0) → deploy SmartWallet via CREATE2
   b. Register wallet mapping (EOA ↔ SmartWallet)
   c. Create Town Hall building at center of 13x13 grid
5. User pays gas (one-time)
6. Dashboard loads with Town Hall on map
```

### Building a Bank (After Town Hall)

```
1. User deposits tokens to SmartWallet (Vault):
   - ETH: direct transfer
   - ERC20: Token.transfer(smartWallet, amount)

2. User clicks empty tile on City Map
3. Build Modal opens → AavePanel shown
4. User selects asset (USDC, USDT, ETH, WBTC, LINK)
5. AavePanel shows: vault balance, reserve data (APY, cap, oracle price, LTV)
6. User enters amount → clicks "SUPPLY & BUILD"

7. SmartWallet.executeBatch():
   [WETH.deposit (ETH only)] → [approve] → [supply to Aave] → [recordBuilding]

8. Building appears on map with level based on USD value
9. Interest accrues automatically via Aave aTokens
```

---

## Deployed Addresses

### Base Sepolia Testnet (Chain ID: 84532)

**Core Contracts:**

| Contract         | Address                                      |
| ---------------- | -------------------------------------------- |
| DefiCityCore     | `0x641adC5d1e2AB02f772E86Dc3694d3e763fC549B` |
| WalletFactory    | `0x764f2D0F274d23B4cf51e5ae0c27e4020eD8ee2A` |
| EntryPoint       | `0x5864A489a25e8cE84b22903dc8f3038F6b0484f3` |
| BuildingRegistry | `0x4c85d20BEF9D52ae6f4dAA05DE758932A3042486` |
| BankAdapter      | `0x16306E942AE4140ff4114C4548Bcb89500DaE5af` |

**Aave V3 Protocol:**

| Contract                     | Address                                      |
| ---------------------------- | -------------------------------------------- |
| Aave Pool                    | `0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27` |
| Aave Data Provider           | `0xBc9f5b7E248451CdD7cA54e717a2BFe1F32b566b` |
| Aave Pool Addresses Provider | `0xE4C23309117Aa30342BFaae6c95c6478e0A4Ad00` |

**Token Addresses:**

| Token      | Address                                      | Decimals |
| ---------- | -------------------------------------------- | -------- |
| USDC       | `0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f` | 6        |
| USDT       | `0x0a215D8ba66387DCA84B284D18c3B4ec3de6E54a` | 6        |
| ETH (WETH) | `0x4200000000000000000000000000000000000006` | 18       |
| WBTC       | `0x54114591963CF60EF3aA63bEfD6eC263D98145a4` | 8        |
| LINK       | `0x810D46F9a9027E28F9B01F75E2bdde839dA61115` | 18       |

---

## Supported Assets

| Asset      | Decimals | Building Type | DeFi Protocol  | Status |
| ---------- | -------- | ------------- | -------------- | ------ |
| USDC       | 6        | Bank          | Aave V3 Supply | Active |
| USDT       | 6        | Bank          | Aave V3 Supply | Active |
| ETH (WETH) | 18       | Bank          | Aave V3 Supply | Active |
| WBTC       | 8        | Bank          | Aave V3 Supply | Active |
| LINK       | 18       | Bank          | Aave V3 Supply | Active |

Assets are whitelisted via `DefiCityCore.addSupportedAsset()` by contract owner.

---

## Development Setup

### Compiler

- Solidity: `0.8.20`
- viaIR: enabled
- Optimizer: 200 runs

### Project Structure

```
contract/
├── contracts/
│   ├── core/
│   │   ├── DefiCityCore.sol         # Central bookkeeping
│   │   └── BuildingRegistry.sol     # Adapter routing
│   ├── wallet/
│   │   └── SmartWallet.sol          # ERC-4337 AA wallet
│   ├── factory/
│   │   └── WalletFactory.sol        # CREATE2 wallet deployer
│   ├── adapters/
│   │   ├── BankAdapter.sol          # Aave V3 adapter
│   │   ├── ShopAdapter.sol          # Aerodrome DEX adapter
│   │   └── LotteryAdapter.sol       # Megapot adapter
│   ├── interfaces/
│   │   ├── IBuildingAdapter.sol     # Adapter interface
│   │   ├── IAccount.sol             # ERC-4337 interfaces
│   │   ├── IEntryPoint.sol          # ERC-4337 EntryPoint
│   │   ├── UserOperation.sol        # ERC-4337 UserOp struct
│   │   ├── IAavePool.sol            # Aave V3 Pool
│   │   ├── IAerodromeRouter.sol     # Aerodrome Router
│   │   ├── IAerodromePair.sol       # Aerodrome Pair
│   │   ├── IAerodromeGauge.sol      # Aerodrome Gauge
│   │   ├── IMegapot.sol             # Megapot Lottery
│   │   └── IAToken.sol              # Aave aToken
│   ├── mocks/
│   │   ├── MockEntryPoint.sol       # ERC-4337 EntryPoint mock
│   │   ├── MockAavePool.sol         # Aave V3 Pool mock
│   │   ├── MockAerodromeRouter.sol  # Aerodrome Router mock
│   │   ├── MockAerodromePair.sol    # Aerodrome Pair mock
│   │   ├── MockAerodromeGauge.sol   # Aerodrome Gauge mock
│   │   └── MockMegapot.sol          # Megapot lottery mock
│   └── MockERC20.sol               # Test token
├── deployments/
│   └── baseSepolia.json            # Deployed addresses
├── scripts/
│   ├── deploy-base-sepolia.js      # Main deployment
│   ├── deploy.js                   # Generic deployment
│   └── test-deployed.js            # Verify deployment
├── scripts/
│   ├── verify-contracts.ts         # Contract verification script
│   └── auto-verify-wallets.ts      # Auto-verify deployed wallets

```
