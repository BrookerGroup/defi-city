# DefiCity Contract Architecture v3.0: Self-Custodial Design

**Document Version:** 3.0
**Last Updated:** 2026-02-10
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

DefiCity v3.0 uses a **self-custodial architecture** where users maintain full control and ownership of their assets at all times. Users own an ERC-4337 SmartWallet that holds all tokens and interacts directly with DeFi protocols (Aave, Uniswap V3, Megapot). The game contracts only track state (bookkeeping).

### Key Design Decisions

- **SmartWallet holds all tokens** - Game contracts never custody user funds
- **BuildingRegistry + Adapter pattern** - Modular, hot-swappable building type implementations
- **Direct DeFi interaction** - SmartWallet calls protocols directly (no intermediary strategies)
- **Session keys** - Allow gasless gameplay with time and spending limits
- **On-chain grid** - Building positions tracked on-chain in a 13x13 grid

### What's New in v3.0

- **Uniswap V3 Integration** - SwapAdapter, LPAdapter, UniswapLPBuildingAdapter
- **LP Building Type** - Uniswap V3 liquidity positions as buildings
- **LP Token ID Tracking** - DefiCityCore links building IDs to Uniswap V3 NFT position IDs
- **MPUSDC Token** - Megapot lottery token support
- **Updated Contract Addresses** - New deployments on Base Sepolia

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
  (owns)     (holds $)    (approved actions)     (Aave, Uniswap, Megapot)
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
│  SmartWallet    │ ← HOLDS ALL TOKENS (ERC20 + ETH + NFTs)
│  (ERC-4337 AA)  │ ← Receives aTokens from Aave
│  per user       │ ← Receives LP NFTs from Uniswap V3
└────┬────────┬───┘
     │        │
     │        │ executeBatch() via owner or session key
     │        ↓
     │  ┌─────────────────────────────────────────────────────┐
     │  │                 BuildingRegistry                     │ ← Routes to correct adapter
     │  │  ┌──────────┬───────────┬────────┬────────┬───────┐ │
     │  │  │  Bank    │   Shop    │Lottery │  LP    │ Swap  │ │
     │  │  │ (Aave)   │(Aerodrome)│(Megapot)│(UniV3)│(UniV3)│ │
     │  │  └──────────┴───────────┴────────┴────────┴───────┘ │
     │  └─────────────────────────────────────────────────────┘
     │        │
     │        │ preparePlace() → returns calldata
     │        ↓
     │  ┌─────────────────┐
     │  │  DefiCityCore   │ ← BOOKKEEPING ONLY
     │  │  Game State     │    Buildings, Grid, Stats, LP Token IDs
     │  └─────────────────┘
     │
     │ direct interaction via executeBatch
     ↓
┌─────────────────┐
│  DeFi Protocols │
│  ├── Aave V3    │ (supply, withdraw, borrow, repay)
│  ├── Uniswap V3 │ (swap, mint LP, collect fees, manage liquidity)
│  ├── Aerodrome  │ (LP provision, fee claiming)
│  └── Megapot    │ (lottery tickets, prize claims, LP deposit)
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
- Track LP Token IDs (Uniswap V3 NFT → Building mapping)
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
mapping(uint256 => uint256) public lpTokenIdByBuilding;  // buildingId → Uniswap V3 NFT tokenId
uint256 public buildingIdCounter;                        // Auto-increment ID
```

**Building Struct:**

```solidity
struct Building {
    uint256 id;
    address owner;          // User's EOA
    address smartWallet;    // User's SmartWallet
    string buildingType;    // "bank", "shop", "lottery", "lp", "townhall"
    address asset;          // Token address (USDC, WETH, etc.)
    uint256 amount;         // Initial amount invested
    uint256 placedAt;       // Timestamp of placement
    uint256 coordinateX;    // Grid position X (1-13)
    uint256 coordinateY;    // Grid position Y (1-13)
    bool active;            // Is building active
    bytes metadata;         // Extra data (borrow mode, LP pair, tick range, etc.)
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
| `setLPTokenId(address user, uint256 buildingId, uint256 tokenId)`                   | onlyModules         | Link Uniswap V3 NFT to LP building                |
| `moveBuilding(uint256 buildingId, uint256 newX, uint256 newY)`                      | onlyUserWallet      | Move building on grid                              |
| `getUserBuildings(address user)`                                                    | View                | Get all user's buildings                           |
| `getBuildingAt(address user, uint256 x, uint256 y)`                                 | View                | Get building at grid position                      |
| `getUserStats(address user)`                                                        | View                | Get user statistics                                |
| `lpTokenIdByBuilding(uint256 buildingId)`                                           | View                | Get Uniswap V3 NFT token ID for building          |
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
| `updateSessionKey(address key, uint256 validUntil, uint256 dailyLimit)` | Owner            | Update existing session key     |
| `revokeSessionKey(address key)`                                         | Owner            | Revoke session key              |
| `updateWhitelistedTarget(address target, bool whitelisted)`             | Owner            | Manage target whitelist         |
| `emergencyWithdraw(address token, address to, uint256 amount)`          | Owner            | Recover tokens                  |
| `transferOwnership(address newOwner)`                                   | Owner            | Start 2-step ownership transfer |
| `acceptOwnership()`                                                     | PendingOwner     | Accept ownership transfer       |
| `addDeposit()`                                                          | External         | Fund gas in EntryPoint          |
| `getDeposit()`                                                          | View             | Check gas balance               |
| `withdrawDepositTo(address, uint256)`                                   | Owner            | Reclaim unused gas funds        |
| `pause()` / `unpause()`                                                 | Owner            | Emergency pause                 |

**Token Reception:**

- Supports receiving ETH, ERC-721 (Uniswap V3 LP NFTs), ERC-1155 tokens
- Implements `onERC721Received()`, `onERC1155Received()`

**Constants:**

- `MIN_SESSION_VALIDITY`: 1 hour
- `MAX_SESSION_VALIDITY`: 30 days
- `ETH_PRICE_USD`: 2000 * 1e6 (hardcoded; production should use Chainlink)

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

### Flow 4: Create Uniswap V3 LP Position

```
1. User drags "LP" from BottomBar → drops on empty tile
2. User selects token pair, fee tier, price range
3. Frontend calls UniswapLPBuildingAdapter.preparePlace(user, smartWallet, params)
   → Returns batch: [approve token0, approve token1, mint, recordBuilding]
4. SmartWallet.executeBatch():
   a. Token0.approve(NonfungiblePositionManager, amount0)
   b. Token1.approve(NonfungiblePositionManager, amount1)
   c. NonfungiblePositionManager.mint(params)           ← creates LP NFT
   d. DefiCityCore.recordBuildingPlacement(...)          ← record LP building
5. Frontend calls DefiCityCore.setLPTokenId(user, buildingId, tokenId)
   → Links Uniswap V3 NFT to building
6. LP Building appears on map
```

---

### Flow 5: Swap via Uniswap V3

```
1. User opens SwapPanel
2. Frontend calls SwapAdapter.prepareSwap(params)
   → Returns batch: [approve tokenIn, exactInputSingle]
3. SmartWallet.executeBatch():
   a. TokenIn.approve(SwapRouter02, amount)
   b. SwapRouter02.exactInputSingle(params)
4. TokenOut appears in SmartWallet balance
```

---

### Flow 6: Buy Lottery Tickets (Megapot)

```
1. User drags "Lottery" → drops on tile
2. Frontend calls LotteryAdapter.preparePlace(user, smartWallet, params)
   → Returns batch: [approve MPUSDC, buyTickets, recordBuilding]
3. SmartWallet.executeBatch():
   a. MPUSDC.approve(Megapot, amount)
   b. Megapot.purchaseTickets(referrer, amount, smartWallet)
   c. DefiCityCore.recordBuildingPlacement(...)
4. Lottery building appears on map
```

---

### Flow 7: Megapot LP Deposit

```
1. User opens LotteryDialog → LP tab
2. SmartWallet.executeBatch():
   a. MPUSDC.approve(Megapot, amount)
   b. Megapot.lpDeposit(riskPercentage, amount)
3. LP position tracked in Megapot contract
```

---

### Flow 8: Withdraw from Vault (SmartWallet → EOA)

```
1. User clicks "Withdraw to Wallet"
2. Frontend: SmartWallet.execute(token, 0, transfer_calldata)
   - For ETH: SmartWallet.execute(userEOA, amount, "0x")
   - For ERC20: SmartWallet.execute(token, 0, encode(transfer(userEOA, amount)))
3. Tokens transferred to user's EOA
```

---

### Flow 9: Move Building on Grid

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
    uint256 amount;         // MPUSDC amount for tickets
    uint256 x;
    uint256 y;
}
```

**Place batch:** `[approve MPUSDC, buyTickets, recordBuilding]`
**Harvest batch:** `[claimPrizes(ticketIds)]`
**Demolish:** Record only (tickets remain in Megapot, cannot be withdrawn)

#### UniswapLPBuildingAdapter (Uniswap V3 LP) - NEW

**Building Type:** `"lp"`
**Protocol:** Uniswap V3 NonfungiblePositionManager
**Fee:** 0 bps (no placement fee)

**PlaceParams:**

```solidity
// Encoded as: abi.encode(token0, token1, fee, tickLower, tickUpper, amount0Desired, amount1Desired, amount0Min, amount1Min, x, y)
```

**Place batch:** `[approve token0, approve token1, mint NFT, recordBuilding]`
**Harvest batch:** `[collect fees from NFT]`
**Demolish batch:** `[decreaseLiquidity, collect, burn NFT, recordDemolition]`

**Additional Functions (not in IBuildingAdapter):**
- `prepareIncreaseLiquidity(user, wallet, buildingId, params)` - Add more liquidity to existing position
- `prepareDecreaseLiquidity(user, wallet, buildingId, params)` - Remove partial liquidity

**LP Token ID Linking:**
- After placing an LP building, `DefiCityCore.setLPTokenId(user, buildingId, tokenId)` links the Uniswap V3 NFT to the building
- Required for harvest/demolish operations (NFT tokenId needed to interact with position)

**Metadata Storage:** `abi.encode(token0, token1, fee, tickLower, tickUpper)`

#### SwapAdapter (Uniswap V3 Swap) - NEW

**Type:** Utility adapter (non-building operation)
**Protocol:** Uniswap V3 SwapRouter02

**SwapParams:**

```solidity
struct SwapParams {
    address tokenIn;
    address tokenOut;
    uint256 amountIn;
    uint256 amountOutMinimum;
    uint24 fee;              // 500 = 0.05%, 3000 = 0.3%, 10000 = 1%
    address recipient;
    uint256 deadline;
}
```

**Swap batch:** `[approve tokenIn, exactInputSingle]`

**Note:** SwapAdapter is utility-only and does not create buildings.

#### LPAdapter (Uniswap V3 LP Utility) - NEW

**Type:** Utility adapter for LP management
**Protocol:** Uniswap V3 NonfungiblePositionManager

**Functions:**
- `prepareMint(params)` - Create new LP position
- `prepareIncreaseLiquidity(token0, token1, params)` - Add to existing position
- `prepareDecreaseLiquidity(tokenId, liquidity, amount0Min, amount1Min)` - Remove liquidity
- `prepareCollect(tokenId, recipient, amount0Max, amount1Max)` - Claim fees

**Note:** Tokens must be sorted (token0 < token1 by address).

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
| NFT Reception             | Proper ERC721/ERC1155 receiver implementations             |

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
| LP NFT theft              | NFTs held in SmartWallet, only owner can execute |

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

2. User drags "Supply" from BottomBar → drops on empty tile
3. BuildingDialog opens → AavePanel shown
4. User selects asset (USDC, USDT, ETH, WBTC, LINK)
5. AavePanel shows: vault balance, reserve data (APY, cap, oracle price, LTV)
6. User enters amount → clicks "SUPPLY & BUILD"

7. SmartWallet.executeBatch():
   [WETH.deposit (ETH only)] → [approve] → [supply to Aave] → [recordBuilding]

8. Building appears on map with level based on USD value
9. Interest accrues automatically via Aave aTokens
```

### Creating an LP Position

```
1. User drags "LP" from BottomBar → drops on empty tile
2. LP creation dialog opens
3. User selects: token pair, fee tier (0.05%/0.3%/1%), price range
4. User enters token amounts → clicks "CREATE LP"

5. SmartWallet.executeBatch():
   [approve token0] → [approve token1] → [mint NFT] → [recordBuilding]
6. DefiCityCore.setLPTokenId(user, buildingId, tokenId)

7. LP Building appears on map
8. Fees accrue automatically from Uniswap V3 trading
```

### Playing the Lottery

```
1. User drags "Lottery" from BottomBar → drops on empty tile
2. LotteryDialog opens
3. User enters MPUSDC amount → clicks "BUY TICKETS"

4. SmartWallet.executeBatch():
   [approve MPUSDC] → [purchaseTickets] → [recordBuilding]

5. Lottery Building appears on map
6. User can claim winnings after jackpot runs
```

---

## Deployed Addresses

### Base Sepolia Testnet (Chain ID: 84532)

**Core Contracts:**

| Contract         | Address                                      |
| ---------------- | -------------------------------------------- |
| DefiCityCore     | `0xF0f613927953c93646550B9F990BF9894Af9A5Ef` |
| WalletFactory    | `0x7693D97D6d7e03A3E224E9124d0A547Fd58543Df` |
| EntryPoint       | `0x7D626d4be9158853D7568C9e3935F49f24522826` |
| BuildingRegistry | `0xEc580BCB26D49eb9e1403559F47dB7Ed8c5a5c8f` |

**Adapters:**

| Adapter              | Address                                      |
| -------------------- | -------------------------------------------- |
| BankAdapter          | `0xf616fc3AcDa7d33533FF17ba73745a6cF3f8b7ad` |
| SwapAdapter          | `0xf692caBc47D0E05DeDEeF8e39Ef762E7a4940f35` |

**Aave V3 Protocol:**

| Contract                     | Address                                      |
| ---------------------------- | -------------------------------------------- |
| Aave Pool                    | `0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27` |
| Aave Data Provider           | `0xBc9f5b7E248451CdD7cA54e717a2BFe1F32b566b` |
| Aave Pool Addresses Provider | `0xE4C23309117Aa30342BFaae6c95c6478e0A4Ad00` |

**Uniswap V3 Protocol:**

| Contract                      | Address                                      |
| ----------------------------- | -------------------------------------------- |
| SwapRouter02                  | `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4` |
| QuoterV2                      | `0xC5290058841028F1614F3A6F0F5816cAd0df5E27` |
| Uniswap V3 Factory            | `0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24` |
| NonfungiblePositionManager    | `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2` |

**Megapot Lottery:**

| Contract | Address                                      |
| -------- | -------------------------------------------- |
| Megapot  | `0x6f03c7BCaDAdBf5E6F5900DA3d56AdD8FbDac5De` |
| MPUSDC   | `0xA4253E7C13525287C56550b8708100f93E60509f` |

**Token Addresses:**

| Token      | Address                                      | Decimals |
| ---------- | -------------------------------------------- | -------- |
| USDC       | `0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f` | 6        |
| USDT       | `0x0a215D8ba66387DCA84B284D18c3B4ec3de6E54a` | 6        |
| ETH (WETH) | `0x4200000000000000000000000000000000000006` | 18       |
| WBTC       | `0x54114591963CF60EF3aA63bEfD6eC263D98145a4` | 8        |
| LINK       | `0x810D46F9a9027E28F9B01F75E2bdde839dA61115` | 18       |
| MPUSDC     | `0xA4253E7C13525287C56550b8708100f93E60509f` | 6        |

---

## Supported Assets

| Asset      | Decimals | Building Type | DeFi Protocol          | Status |
| ---------- | -------- | ------------- | ---------------------- | ------ |
| USDC       | 6        | Bank          | Aave V3 Supply/Borrow  | Active |
| USDT       | 6        | Bank          | Aave V3 Supply/Borrow  | Active |
| ETH (WETH) | 18       | Bank          | Aave V3 Supply/Borrow  | Active |
| WBTC       | 8        | Bank          | Aave V3 Supply/Borrow  | Active |
| LINK       | 18       | Bank          | Aave V3 Supply/Borrow  | Active |
| MPUSDC     | 6        | Lottery       | Megapot Lottery        | Active |
| Any ERC20  | varies   | LP            | Uniswap V3 LP          | Active |
| Any ERC20  | varies   | Swap          | Uniswap V3 Swap        | Active |

Assets are whitelisted via `DefiCityCore.addSupportedAsset()` by contract owner.

---

## Development Setup

### Compiler

- Solidity: `0.8.20`
- viaIR: enabled
- Optimizer: 200 runs
- Hardhat: `^3.1.5`
- OpenZeppelin: `^5.4.0`

### Project Structure

```
contract/
├── contracts/
│   ├── core/
│   │   ├── DefiCityCore.sol           # Central bookkeeping
│   │   └── BuildingRegistry.sol       # Adapter routing
│   ├── wallet/
│   │   └── SmartWallet.sol            # ERC-4337 AA wallet
│   ├── factory/
│   │   └── WalletFactory.sol          # CREATE2 wallet deployer
│   ├── adapters/
│   │   ├── BankAdapter.sol            # Aave V3 adapter
│   │   ├── ShopAdapter.sol            # Aerodrome DEX adapter
│   │   ├── LotteryAdapter.sol         # Megapot adapter
│   │   ├── UniswapLPBuildingAdapter.sol # ★ Uniswap V3 LP building adapter
│   │   ├── SwapAdapter.sol            # ★ Uniswap V3 swap utility
│   │   └── LPAdapter.sol             # ★ Uniswap V3 LP utility
│   ├── interfaces/
│   │   ├── IBuildingAdapter.sol       # Adapter interface
│   │   ├── IAccount.sol               # ERC-4337 interfaces
│   │   ├── IEntryPoint.sol            # ERC-4337 EntryPoint
│   │   ├── UserOperation.sol          # ERC-4337 UserOp struct
│   │   ├── IAavePool.sol              # Aave V3 Pool
│   │   ├── IAToken.sol                # Aave aToken
│   │   ├── IAerodromeRouter.sol       # Aerodrome Router
│   │   ├── IAerodromePair.sol         # Aerodrome Pair
│   │   ├── IAerodromeGauge.sol        # Aerodrome Gauge
│   │   ├── IMegapot.sol               # Megapot Lottery
│   │   ├── INonfungiblePositionManager.sol # ★ Uniswap V3 NFT manager
│   │   └── ISwapRouter02.sol          # ★ Uniswap V3 swap router
│   ├── mocks/
│   │   ├── MockEntryPoint.sol         # ERC-4337 EntryPoint mock
│   │   ├── MockAavePool.sol           # Aave V3 Pool mock
│   │   ├── MockAerodromeRouter.sol    # Aerodrome Router mock
│   │   ├── MockAerodromePair.sol      # Aerodrome Pair mock
│   │   ├── MockAerodromeGauge.sol     # Aerodrome Gauge mock
│   │   └── MockMegapot.sol            # Megapot lottery mock
│   └── MockERC20.sol                  # Test token
├── deployments/
│   └── baseSepolia.json               # Deployed addresses
├── ignition/
│   └── modules/
│       ├── CoreContracts.ts           # Core deployment module
│       └── IntegrationContracts.ts    # Adapter & mock deployment
├── scripts/
│   ├── deploy-base-sepolia.js         # Main deployment
│   ├── deploy.js                      # Generic deployment
│   ├── test-deployed.js               # Verify deployment
│   ├── verify-contracts.ts            # Contract verification
│   └── auto-verify-wallets.ts         # Auto-verify deployed wallets
├── hardhat.config.ts                  # Hardhat configuration
├── package.json                       # Dependencies
└── tsconfig.json                      # TypeScript config
```

### Building Types Summary

| Building Type | Adapter                       | DeFi Protocol | Yield Source           | Placement Fee |
| ------------- | ----------------------------- | ------------- | ---------------------- | ------------- |
| `townhall`    | None                          | None          | None                   | 0             |
| `bank`        | BankAdapter                   | Aave V3       | Interest accrual       | 5 bps         |
| `shop`        | ShopAdapter                   | Aerodrome     | Trading fees + AERO    | 5 bps         |
| `lottery`     | LotteryAdapter                | Megapot       | Prize winnings         | 5 bps         |
| `lp`          | UniswapLPBuildingAdapter      | Uniswap V3    | Trading fees           | 0 bps         |
| (utility)     | SwapAdapter                   | Uniswap V3    | N/A (swap only)        | N/A           |
| (utility)     | LPAdapter                     | Uniswap V3    | N/A (LP management)    | N/A           |

### Network Configuration

| Network      | Chain ID | RPC URL                              |
| ------------ | -------- | ------------------------------------ |
| Hardhat      | 31337    | Built-in                             |
| Localhost    | 31337    | `http://127.0.0.1:8545`             |
| Sepolia      | 11155111 | Via env RPC_URL                      |
| Base Sepolia | 84532    | `https://base-sepolia-rpc.publicnode.com` |
| Base Mainnet | 8453     | Via env RPC_URL                      |
