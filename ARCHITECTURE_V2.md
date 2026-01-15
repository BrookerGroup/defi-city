# DefiCity Architecture v2.0: Self-Custodial Design

**Document Version:** 2.0
**Last Updated:** 2026-01-15
**Status:** Design Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Principles](#core-principles)
3. [Architecture Comparison](#architecture-comparison)
4. [Component Overview](#component-overview)
5. [Asset Flow](#asset-flow)
6. [Session Key Mechanism](#session-key-mechanism)
7. [Smart Contract Redesign](#smart-contract-redesign)
8. [Security & Trust Model](#security--trust-model)
9. [User Experience Flow](#user-experience-flow)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

DefiCity v2.0 adopts a **self-custodial architecture** where users maintain full control and ownership of their assets at all times. This represents a fundamental shift from the previous custodial model.

### Key Changes

**OLD (v1.0) - Custodial:**
- DefiCityCore holds user tokens
- Users deposit tokens TO game contracts
- Game contracts execute DeFi interactions
- Users must trust game contracts with funds

**NEW (v2.0) - Self-Custodial:**
- User's SmartWallet holds all tokens
- DefiCityCore only tracks game state (bookkeeping)
- SmartWallet executes DeFi interactions via session keys
- Users retain full custody and control

### Benefits

1. **True Asset Ownership** - Users own their SmartWallet and all assets within
2. **Reduced Trust Requirements** - Game cannot access funds without explicit authorization
3. **Direct Access** - Users can interact with SmartWallet directly, bypassing game UI
4. **Transparent Security** - Clear separation between accounting and custody
5. **Account Abstraction** - Leverages ERC-4337 for gasless, streamlined UX

---

## Core Principles

### 1. Separation of Custody and Accounting

**Custody Layer (SmartWallet):**
- Holds all user tokens (idle + invested)
- Executes DeFi protocol interactions
- Owned and controlled by user
- Can be accessed independently of game

**Accounting Layer (DefiCityCore):**
- Tracks game state and buildings
- Records user actions for UI/analytics
- Maintains leaderboards and statistics
- NEVER holds tokens

### 2. User Authorization Model

```
User → SmartWallet → Session Key → Game Actions → DeFi Protocols
         (owns)      (authorizes)    (executes)
```

- User owns SmartWallet via EOA
- User creates session key with limited scope
- Session key allows game to execute approved actions
- Session key cannot withdraw to external addresses
- Session key has time and value limits

### 3. Trustless Operation

Users should be able to:
- View SmartWallet balance on-chain without game UI
- Withdraw from SmartWallet directly (emergency)
- Revoke session keys at any time
- Verify all transactions on block explorer

---

## Architecture Comparison

### v1.0 (Custodial) Architecture

```
┌─────────────┐
│   User EOA  │
└──────┬──────┘
       │ deposit()
       ↓
┌─────────────────┐
│  DefiCityCore   │ ← HOLDS TOKENS
│  (Token Vault)  │
└────────┬────────┘
         │ placeBuilding()
         ↓
┌─────────────────┐
│ Strategy (Aave) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Aave Protocol  │
└─────────────────┘
```

**Problem:** Users must trust DefiCityCore with token custody

---

### v2.0 (Self-Custodial) Architecture

```
┌─────────────┐
│   User EOA  │
└──────┬──────┘
       │ owns
       ↓
┌─────────────────┐
│  SmartWallet    │ ← HOLDS ALL TOKENS
│  (ERC-4337 AA)  │
└────┬────────┬───┘
     │        │
     │        │ executeFromGame() via session key
     │        ↓
     │  ┌─────────────────┐
     │  │  DefiCityCore   │ ← BOOKKEEPING ONLY
     │  │  (Game State)   │
     │  └─────────────────┘
     │
     │ direct interaction
     ↓
┌─────────────────┐
│  DeFi Protocols │
│  (Aave/Aero)    │
└─────────────────┘
```

**Benefit:** Users own SmartWallet, game only tracks state

---

## Component Overview

### 1. User's SmartWallet (DefiCitySmartWallet)

**Type:** ERC-4337 Account Abstraction Smart Contract Wallet

**Responsibilities:**
- Hold all user tokens (ERC20, native ETH)
- Execute DeFi protocol interactions (supply, withdraw, LP, etc.)
- Manage session key permissions
- Process UserOperations via Paymaster for gasless transactions

**Key Functions:**
```solidity
// Execute game action via session key
function executeFromGame(
    address target,      // DeFi protocol (Aave, Aerodrome, etc.)
    bytes calldata data  // Encoded function call
) external onlySessionKey returns (bytes memory)

// User-only functions
function createSessionKey(address key, uint256 validUntil, uint256 dailyLimit) external onlyOwner
function revokeSessionKey(address key) external onlyOwner
function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner

// View functions
function getBalance(address token) external view returns (uint256)
function getSessionKeyInfo(address key) external view returns (SessionKeyInfo)
```

**Ownership:**
- Owner: User's EOA (MetaMask wallet)
- Session Key: Temporary authorized address (managed by game)
- No one else has access

---

### 2. DefiCityCore (Accounting Layer)

**Type:** Core Game Contract

**NEW Responsibilities:**
- Track user buildings and game state
- Validate game rules (building placement, demolition)
- Record transactions for analytics
- Emit events for subgraph indexing
- Maintain leaderboards

**REMOVED Responsibilities:**
- ❌ Hold user tokens
- ❌ Execute token transfers
- ❌ Manage token balances

**Key Functions:**
```solidity
// Register user's SmartWallet
function registerWallet(address smartWallet) external

// Bookkeeping functions (no tokens involved)
function recordBuildingPlacement(
    uint256 buildingType,
    address asset,
    uint256 amount,
    uint256 coordinateX,
    uint256 coordinateY
) external onlyUserWallet

function recordHarvest(
    uint256 buildingId,
    uint256 yieldAmount
) external onlyUserWallet

function recordDemolition(uint256 buildingId) external onlyUserWallet

// View functions
function getUserBuildings(address user) external view returns (Building[] memory)
function getBuildingInfo(uint256 buildingId) external view returns (Building memory)
```

**Important:** All `record*` functions are called BY the user's SmartWallet, not by the user directly. This ensures consistency.

---

### 3. BuildingManager (Game Logic)

**Type:** Module Contract

**Responsibilities:**
- Validate building placement rules
- Calculate fees
- Prepare UserOperation for SmartWallet execution
- Coordinate between SmartWallet and DeFi protocols

**Example Flow:**
```solidity
// User clicks "Place Bank Building"
// Frontend calls BuildingManager

function prepareAaveBuildingPlacement(
    address userSmartWallet,
    address asset,
    uint256 amount
) external view returns (
    address target,     // Aave Pool address
    bytes memory data   // Encoded supply() call
) {
    // Validate placement
    require(amount >= MIN_BUILDING_AMOUNT, "Below minimum");

    // Prepare Aave supply call
    target = AAVE_POOL;
    data = abi.encodeWithSelector(
        IPool.supply.selector,
        asset,
        amount,
        userSmartWallet,  // onBehalfOf = user's SmartWallet
        0                 // referralCode
    );

    return (target, data);
}
```

**SmartWallet then executes:**
```solidity
smartWallet.executeFromGame(target, data);
```

---

### 4. Strategy Contracts (DEPRECATED in v2.0)

In v2.0, strategy contracts are **no longer needed** because:
- SmartWallet interacts DIRECTLY with DeFi protocols
- No intermediary strategy layer
- Simpler architecture, fewer contracts

**OLD (v1.0):**
```
Core → AaveStrategy → Aave Protocol
```

**NEW (v2.0):**
```
SmartWallet → Aave Protocol (direct)
Core (just tracks state)
```

---

## Asset Flow

### Deposit Flow

```
1. User has USDC in MetaMask (EOA)
2. User clicks "Deposit 100 USDC"
3. Frontend prompts: "Transfer 100 USDC to your SmartWallet"
4. User approves USDC.transfer(smartWallet, 100 USDC)
5. Transaction executed (user pays gas)
6. USDC now in user's SmartWallet
7. DefiCityCore.recordDeposit() called for bookkeeping
8. UI updates to show balance
```

**Key Point:** Tokens go TO user's SmartWallet, NOT to game contracts

---

### Place Building Flow (Bank - Aave Supply)

```
1. User has 100 USDC in SmartWallet
2. User clicks "Place Bank" → Supply 100 USDC to Aave
3. Frontend calls BuildingManager.prepareAaveBuildingPlacement()
   → Returns (target: AAVE_POOL, data: supply() calldata)
4. Frontend creates UserOperation with session key
5. Paymaster sponsors gas
6. SmartWallet executes:
   - USDC.approve(AAVE_POOL, 100 USDC)
   - AAVE_POOL.supply(USDC, 100 USDC, smartWallet, 0)
7. SmartWallet receives aUSDC (interest-bearing token)
8. SmartWallet calls DefiCityCore.recordBuildingPlacement()
9. Building appears on map
```

**Key Point:** SmartWallet executes, receives aTokens, and records action

---

### Harvest Flow

```
1. User has Bank building with accrued interest
2. User clicks "Harvest"
3. Frontend prepares harvest UserOperation
4. SmartWallet executes:
   - Calculate earned interest: aUSDC balance - principal
   - AAVE_POOL.withdraw(USDC, interestAmount, smartWallet)
   - DefiCityCore.recordHarvest(buildingId, interestAmount)
5. Harvested USDC remains in SmartWallet
6. Building remains active
7. UI updates balance
```

**Key Point:** Harvested rewards stay in SmartWallet, not transferred elsewhere

---

### Withdraw Flow

```
1. User has 50 USDC idle in SmartWallet
2. User clicks "Withdraw 50 USDC to MetaMask"
3. Frontend prepares withdraw transaction (NOT gasless)
4. User approves in MetaMask
5. SmartWallet executes:
   - USDC.transfer(userEOA, 50 USDC)
   - DefiCityCore.recordWithdrawal(USDC, 50 USDC)
6. USDC now in user's EOA (MetaMask)
7. User pays gas
```

**Key Point:** User can withdraw anytime, pays gas for withdrawal

---

### Emergency Direct Withdrawal

```
1. User wants to bypass game entirely
2. User opens Etherscan/BaseScan
3. User calls SmartWallet.emergencyWithdraw() directly:
   - smartWallet.emergencyWithdraw(USDC, userEOA, amount)
4. Only owner (user's EOA) can call this
5. Tokens transferred to EOA
6. Game state becomes inconsistent, but user has funds
```

**Key Point:** Users ALWAYS have escape hatch, not dependent on game

---

## Session Key Mechanism

### Purpose

Session keys allow users to authorize the game to execute actions on their SmartWallet without requiring approval for every single transaction. This enables gasless gameplay while maintaining security.

### How It Works

```solidity
struct SessionKeyInfo {
    address key;              // Session key address
    uint256 validUntil;       // Expiry timestamp
    uint256 dailyLimit;       // Max value per day (in USD)
    uint256 spentToday;       // Amount spent today
    uint256 lastResetTime;    // Last daily reset
    bool revoked;             // Can be revoked by user
}
```

### Session Key Lifecycle

**1. Creation:**
```solidity
// User clicks "Enable Gasless Gameplay"
smartWallet.createSessionKey(
    sessionKeyAddress,  // Generated by frontend
    block.timestamp + 24 hours,
    1000 * 1e18  // 1000 USDC daily limit
)
```

**2. Usage:**
```solidity
// Frontend prepares UserOperation
UserOperation memory userOp = UserOperation({
    sender: smartWallet,
    callData: abi.encodeWithSelector(
        SmartWallet.executeFromGame.selector,
        aavePool,
        supplyCalldata
    ),
    signature: signedBySessionKey  // Session key signs
});

// Paymaster sponsors gas
paymaster.sponsorUserOperation(userOp);

// Bundler submits to EntryPoint
entryPoint.handleOps([userOp], beneficiary);
```

**3. Validation:**
```solidity
function _validateSessionKey() internal view {
    require(!sessionKeys[msg.sender].revoked, "Revoked");
    require(block.timestamp < sessionKeys[msg.sender].validUntil, "Expired");
    require(sessionKeys[msg.sender].spentToday < sessionKeys[msg.sender].dailyLimit, "Limit exceeded");
}
```

**4. Revocation:**
```solidity
// User can revoke anytime
smartWallet.revokeSessionKey(sessionKeyAddress);
```

### Security Constraints

1. **Time Limit:** 24 hours max validity
2. **Value Limit:** 1000 USDC equivalent per day
3. **Target Whitelist:** Can only call approved contracts (Aave, Aerodrome, Megapot, DefiCityCore)
4. **No Withdrawals:** Cannot transfer tokens to external addresses
5. **User Revocable:** Owner can revoke immediately

---

## Smart Contract Redesign

### Contracts That Need Changes

#### 1. DefiCityCore.sol

**REMOVE:**
```solidity
// OLD - Custodial
mapping(address => mapping(address => uint256)) public userBalances;

function deposit(address asset, uint256 amount) external {
    IERC20(asset).transferFrom(msg.sender, address(this), amount);
    userBalances[msg.sender][asset] += amount;
}
```

**ADD:**
```solidity
// NEW - Self-Custodial
mapping(address => address) public userSmartWallets;  // EOA → SmartWallet

function registerWallet(address smartWallet) external {
    require(userSmartWallets[msg.sender] == address(0), "Already registered");
    require(ISmartWallet(smartWallet).owner() == msg.sender, "Not owner");
    userSmartWallets[msg.sender] = smartWallet;
}

// All record* functions now called BY SmartWallet
modifier onlyUserWallet() {
    require(userSmartWallets[ISmartWallet(msg.sender).owner()] == msg.sender, "Not user wallet");
    _;
}

function recordBuildingPlacement(...) external onlyUserWallet {
    // Just update game state, no token transfers
}
```

---

#### 2. BuildingManager.sol

**REMOVE:**
```solidity
// OLD - Direct execution
function placeBuilding(...) external {
    core.transferFrom(user, strategy, amount);  // ❌ Core holds tokens
    strategy.deposit(user, amount);
}
```

**ADD:**
```solidity
// NEW - Prepare UserOperation for SmartWallet
function prepareBuildingPlacement(
    address userSmartWallet,
    uint256 buildingType,
    address asset,
    uint256 amount,
    uint256 x,
    uint256 y
) external view returns (
    address[] memory targets,
    bytes[] memory datas
) {
    // Validate rules
    _validatePlacement(buildingType, x, y);

    // Return execution plan for SmartWallet
    if (buildingType == BANK) {
        return _prepareAaveSupply(userSmartWallet, asset, amount);
    } else if (buildingType == SHOP) {
        return _prepareAerodromeLP(userSmartWallet, asset, amount);
    }
    // ... etc
}
```

---

#### 3. DefiCitySmartWallet.sol (NEW/ENHANCED)

**ADD:**
```solidity
contract DefiCitySmartWallet is BaseAccount {
    address public owner;
    mapping(address => SessionKeyInfo) public sessionKeys;

    // ERC-4337 integration
    IEntryPoint public immutable entryPoint;

    constructor(IEntryPoint _entryPoint, address _owner) {
        entryPoint = _entryPoint;
        owner = _owner;
    }

    // Execute game action via session key
    function executeFromGame(
        address target,
        bytes calldata data
    ) external returns (bytes memory) {
        require(_isValidSessionKey(msg.sender), "Invalid session key");
        require(_isWhitelistedTarget(target), "Target not allowed");

        // Execute on DeFi protocol
        (bool success, bytes memory result) = target.call(data);
        require(success, "Execution failed");

        // Update session key usage
        _trackSessionKeyUsage(msg.sender, _estimateValue(target, data));

        // Record in Core for bookkeeping
        _recordInCore();

        return result;
    }

    // Batch execution for complex actions
    function executeFromGameBatch(
        address[] calldata targets,
        bytes[] calldata datas
    ) external returns (bytes[] memory) {
        require(_isValidSessionKey(msg.sender), "Invalid session key");
        bytes[] memory results = new bytes[](targets.length);

        for (uint256 i = 0; i < targets.length; i++) {
            results[i] = _execute(targets[i], datas[i]);
        }

        return results;
    }

    // Emergency functions (owner only)
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }

    // Session key management
    function createSessionKey(
        address key,
        uint256 validUntil,
        uint256 dailyLimit
    ) external onlyOwner {
        sessionKeys[key] = SessionKeyInfo({
            key: key,
            validUntil: validUntil,
            dailyLimit: dailyLimit,
            spentToday: 0,
            lastResetTime: block.timestamp,
            revoked: false
        });
    }

    function revokeSessionKey(address key) external onlyOwner {
        sessionKeys[key].revoked = true;
    }

    // View functions
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
```

---

#### 4. Strategy Contracts (DEPRECATED)

**Remove entirely:**
- AaveStrategy.sol
- AerodromeStrategy.sol
- MegapotStrategy.sol
- TownHallStrategy.sol

**Reason:** SmartWallet interacts directly with protocols, no intermediary needed

---

## Security & Trust Model

### v1.0 Trust Requirements (Custodial)

Users must trust:
1. ✅ DefiCityCore contract security
2. ✅ Strategy contract security
3. ✅ Owner won't upgrade contracts maliciously
4. ✅ Emergency pause mechanisms work correctly
5. ✅ No bugs in token transfer logic

**Total Trust Surface:** HIGH

---

### v2.0 Trust Requirements (Self-Custodial)

Users must trust:
1. ✅ Their own SmartWallet contract (they own it)
2. ✅ Session key is properly scoped
3. ⚠️ DefiCityCore bookkeeping is accurate (but doesn't affect funds)

**Total Trust Surface:** LOW

**Users DON'T need to trust:**
- ❌ Game won't steal funds (can't access SmartWallet without session key)
- ❌ Core contract holds funds correctly (doesn't hold any)
- ❌ Emergency pause won't lock funds (funds in SmartWallet, not Core)

---

### Attack Vector Analysis

**v1.0 Attack Vectors:**
1. ⚠️ Malicious Core upgrade drains all user funds
2. ⚠️ Bug in strategy allows unauthorized withdrawals
3. ⚠️ Reentrancy in Core contract
4. ⚠️ Admin key compromise = total loss

**v2.0 Attack Vectors:**
1. ✅ Session key compromise = limited loss (daily limit, time limit)
2. ✅ Bookkeeping bug = UI issues, funds safe
3. ✅ Core contract bug = can't affect SmartWallet funds
4. ✅ User retains emergency withdrawal capability

**Result:** Significantly reduced risk profile

---

## User Experience Flow

### First-Time User Onboarding

```
1. User visits DefiCity
2. Click "Sign Up with Email"
3. Enter email, verify with code
4. SmartWallet deployed (gasless via Paymaster)
5. User shown: "Your SmartWallet: 0xABC...DEF"
6. Tutorial: "This wallet holds all your assets"
7. Click "Enable Gasless Gameplay"
8. Approve session key creation (one-time)
9. Ready to play!
```

**Difference from v1.0:** User explicitly owns SmartWallet from the start

---

### Placing First Building

```
1. User has 0 balance
2. UI shows: "Transfer USDC to your SmartWallet to get started"
3. User clicks "Deposit"
4. MetaMask prompts: USDC.transfer(smartWallet, 100 USDC)
5. User approves (pays gas)
6. USDC in SmartWallet, UI updates
7. User clicks empty tile → "Place Bank"
8. Select USDC, enter 100 USDC
9. UI shows: "Your SmartWallet will supply to Aave"
10. Click "Confirm" (gasless via session key)
11. SmartWallet supplies to Aave
12. Building appears on map
13. aUSDC in SmartWallet, accruing interest
```

**Key UX Messages:**
- "Your SmartWallet is supplying to Aave"
- "You own the aUSDC in your SmartWallet"
- "DefiCity just tracks your buildings"

---

## Implementation Roadmap

### Phase 1: Core Contract Redesign (Week 1-2)

- [ ] Remove token custody from DefiCityCore
- [ ] Implement bookkeeping-only functions
- [ ] Add userSmartWallets mapping
- [ ] Create onlyUserWallet modifier
- [ ] Update all events for bookkeeping

### Phase 2: SmartWallet Development (Week 2-3)

- [ ] Implement executeFromGame() function
- [ ] Add session key management
- [ ] Implement target whitelist
- [ ] Add daily spending limits
- [ ] Create emergencyWithdraw() function
- [ ] Integrate ERC-4337 EntryPoint

### Phase 3: BuildingManager Refactor (Week 3-4)

- [ ] Convert placeBuilding() to prepareBuildingPlacement()
- [ ] Remove strategy contract calls
- [ ] Generate UserOperation calldata
- [ ] Add target preparation helpers
- [ ] Update validation logic

### Phase 4: Remove Strategy Contracts (Week 4)

- [ ] Verify SmartWallet can call Aave directly
- [ ] Verify SmartWallet can call Aerodrome directly
- [ ] Remove AaveStrategy.sol
- [ ] Remove AerodromeStrategy.sol
- [ ] Update all imports

### Phase 5: Frontend Integration (Week 5-6)

- [ ] Update deposit flow to SmartWallet
- [ ] Implement UserOperation builder
- [ ] Add session key UI
- [ ] Update balance displays (read from SmartWallet)
- [ ] Add SmartWallet link to BaseScan
- [ ] Implement emergency withdrawal UI

### Phase 6: Testing & Audit (Week 7-8)

- [ ] Unit tests for SmartWallet
- [ ] Integration tests for full flows
- [ ] Session key attack vector testing
- [ ] Emergency withdrawal testing
- [ ] Testnet deployment
- [ ] Security audit

---

## Conclusion

The v2.0 self-custodial architecture represents a significant improvement in security, trust minimization, and user control. By leveraging ERC-4337 Account Abstraction and session keys, we maintain the seamless gasless UX while giving users true ownership of their assets.

**Key Takeaway:** Users own their SmartWallet. DefiCity just helps them use it for DeFi strategies in a gamified way.

---

**Document Status:** Ready for Review
**Next Steps:** Begin Phase 1 implementation after approval
