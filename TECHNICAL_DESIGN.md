# DefiCity - Technical Design Document (v1.0 - DEPRECATED)

**Project:** DefiCity - DeFi City Builder Game
**Version:** 1.0 (DEPRECATED - See v2.0)
**Date:** 2026-01-14
**Status:** Superseded by v2.0 Self-Custodial Architecture
**Author:** Technical Team

---

## ⚠️ IMPORTANT NOTICE: ARCHITECTURE CHANGE

**This document describes the OLD v1.0 custodial architecture which has been superseded.**

**For the NEW v2.0 self-custodial architecture, see:**
- **[ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md)** - Complete v2.0 architecture documentation
- **[USER_STORIES.md](./USER_STORIES.md)** - Updated user stories for v2.0

### Key Differences Between v1.0 and v2.0

| Aspect | v1.0 (This Document) | v2.0 (New) |
|--------|---------------------|------------|
| **Asset Custody** | DefiCityCore holds user tokens | User's SmartWallet holds tokens |
| **Trust Model** | Users must trust game contracts | Users own SmartWallet (self-custodial) |
| **Strategy Contracts** | Required (Aave/Aerodrome/Megapot) | Removed (direct protocol interaction) |
| **Deposits** | User → Core contract | User → User's SmartWallet |
| **DeFi Interactions** | Core → Strategy → Protocol | SmartWallet → Protocol (direct) |
| **Withdrawals** | Core transfers to user | SmartWallet transfers to user |
| **Game Role** | Holds and manages funds | Bookkeeping only (accounting) |

### Migration Path

The v2.0 architecture maintains the same user-facing functionality but with completely different backend implementation:
- Same frontend UI and UX
- Same building types and game mechanics
- Different smart contract architecture
- Significantly improved security and trust model

**Continue reading this document for historical reference only. All new development should follow [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md).**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Smart Contract Design](#3-smart-contract-design)
4. [Account Abstraction Layer](#4-account-abstraction-layer)
5. [DeFi Strategy Integrations](#5-defi-strategy-integrations)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Data Models](#7-data-models)
8. [API Specifications](#8-api-specifications)
9. [Security Design](#9-security-design)
10. [Gas Optimization](#10-gas-optimization)
11. [Testing Strategy](#11-testing-strategy)
12. [Deployment Plan](#12-deployment-plan)
13. [Monitoring & Observability](#13-monitoring--observability)

---

## 1. Executive Summary

### 1.1 Technical Overview

DefiCity is a gamified DeFi portfolio management platform built on Base (Ethereum L2). The system uses ERC-4337 Account Abstraction to provide gasless gameplay and seamless user experience.

### 1.2 Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Blockchain | Base (Optimism fork) | Low gas fees (~$0.01), fast confirmations (~2s), growing ecosystem |
| Architecture | Modular (no proxy) | Lower gas costs, clearer separation, easier audits, trustless core |
| Account Abstraction | ERC-4337 | Gasless gameplay, social login, session keys, standard-compliant |
| Smart Contract Language | Solidity 0.8.24 | Latest stable version, modern features, best tooling support |
| Frontend Framework | Next.js 14 (App Router) | React Server Components, TypeScript, best DX, Vercel deployment |
| Web3 Library | Wagmi + Viem | Type-safe, modern, lightweight, excellent DX |
| Testing Framework | Foundry | Fast, Solidity-based, excellent fuzzing, gas reports |
| Asset Support | USDC, USDT, ETH, WBTC | Multi-asset portfolio, user flexibility, major assets on Base |

### 1.3 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  Next.js 14 + TypeScript + Wagmi + Viem + TailwindCSS      │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│              Account Abstraction Layer                      │
│  Smart Wallet + Bundler + Paymaster + Session Keys         │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│              Smart Contract Layer                           │
│  Core + Modules (Building, Fee, Strategy, Emergency)       │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│              DeFi Strategy Layer                            │
│  Aave (Bank) + Aerodrome (Shop) + Megapot (Lottery)       │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│              External Protocols (Base)                      │
│  Aave V3 + Aerodrome + Megapot + Chainlink Price Feeds    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                           User Layer                             │
│  Web Browser (Chrome, Brave) + Wallet (Optional: MetaMask)      │
└──────────────────────┬───────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│                      Presentation Layer                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  City Map   │  │  Dashboard   │  │   Settings   │           │
│  │  (Canvas)   │  │  (Portfolio) │  │  (Profile)   │           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
│  Next.js 14 App Router + React Server Components                │
└──────────────────────┬───────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│                     Application Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Web3 Client  │  │  State Mgmt  │  │   API Layer  │          │
│  │ (Wagmi+Viem) │  │   (Zustand)  │  │   (tRPC)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────┬───────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│                Account Abstraction Layer                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Smart Wallet│  │   Bundler    │  │  Paymaster   │           │
│  │  (ERC-4337) │  │  (StackUp)   │  │  (Gasless)   │           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
│  ┌─────────────┐  ┌──────────────┐                              │
│  │Session Keys │  │  EntryPoint  │                              │
│  │  (24h TTL)  │  │  (Standard)  │                              │
│  └─────────────┘  └──────────────┘                              │
└──────────────────────┬───────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│                   Blockchain Layer (Base)                        │
│  ┌───────────────────────────────────────────────────┐          │
│  │              DefiCity Smart Contracts             │          │
│  │  ┌──────────────┐  ┌──────────────────────────┐  │          │
│  │  │     Core     │◄─┤  BuildingManager Module │  │          │
│  │  │ (Immutable)  │  └──────────────────────────┘  │          │
│  │  │              │  ┌──────────────────────────┐  │          │
│  │  │   - Cities   │◄─┤  StrategyRegistry Module│  │          │
│  │  │   - Buildings│  └──────────────────────────┘  │          │
│  │  │   - Balances │  ┌──────────────────────────┐  │          │
│  │  │              │◄─┤    FeeManager Module     │  │          │
│  │  └──────────────┘  └──────────────────────────┘  │          │
│  │                    ┌──────────────────────────┐  │          │
│  │                    │ EmergencyManager Module  │  │          │
│  │                    └──────────────────────────┘  │          │
│  └───────────────────────────────────────────────────┘          │
│  ┌───────────────────────────────────────────────────┐          │
│  │               Strategy Contracts                  │          │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │          │
│  │  │AaveStrategy  │  │AeroStrategy  │  │ Lottery │ │          │
│  │  │(Supply+Borrow│  │(LP Providing)│  │(VRF)    │ │          │
│  │  └──────────────┘  └──────────────┘  └─────────┘ │          │
│  └───────────────────────────────────────────────────┘          │
└──────────────────────┬───────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│                   External Protocols                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Aave V3    │  │  Aerodrome   │  │  Chainlink   │          │
│  │  (Lending)   │  │     (DEX)    │  │  (VRF+Feeds) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture Principles

#### 2.2.1 Modular Design (No Proxy Pattern)

**Traditional Approach (UUPS/Transparent Proxy):**
```
User → Proxy Contract → Implementation Contract
       (delegatecall)   (Logic + State)
```

**Problems:**
- High gas overhead (~30k per delegatecall)
- Storage collision risks
- Complex to audit
- Admin can change any logic

**DefiCity Approach (Modular):**
```
User → Core Contract (Immutable State)
       ↓ (external calls)
       ├─ BuildingManager (Swappable Logic)
       ├─ StrategyRegistry (Swappable Logic)
       ├─ FeeManager (Swappable Logic)
       └─ EmergencyManager (Swappable Logic)
```

**Benefits:**
- Lower gas (~60k saved per transaction)
- Immutable core (user state never changes)
- Swappable modules (logic upgradeable)
- Clear separation (state vs logic)
- Easier to audit
- More trustless

#### 2.2.2 Separation of Concerns

| Layer | Responsibility | Upgradeable |
|-------|---------------|-------------|
| Core | State storage, coordination | ❌ Immutable |
| Modules | Business logic | ✅ Swappable |
| Strategies | DeFi integrations | ✅ Versioned |
| Frontend | User interface | ✅ Continuous deployment |

#### 2.2.3 Multi-Asset Architecture

**Asset Support:**
- USDC: Primary stablecoin (Circle)
- USDT: Alternative stablecoin (Tether)
- ETH: Native Base token (wrapped as WETH for strategies)
- WBTC: Wrapped Bitcoin

**Design Considerations:**
- Each building stores asset type
- Strategies must support multiple assets
- Harvest returns yield in original asset
- Demolish returns funds in original asset
- Dashboard shows total value in USD

---

## 3. Smart Contract Design

### 3.1 Contract Overview

```
DefiCityCore (Immutable)
├─ Cities mapping
├─ Buildings mapping
├─ Asset balances
├─ Module references
│
Modules (Swappable)
├─ BuildingManager
│  ├─ placeBuilding()
│  ├─ depositToBuilding()
│  ├─ harvest()
│  └─ demolishBuilding()
│
├─ StrategyRegistry
│  ├─ registerStrategy()
│  ├─ activateStrategy()
│  └─ getStrategy()
│
├─ FeeManager
│  ├─ calculateFee()
│  └─ collectFee()
│
└─ EmergencyManager
   ├─ pause()
   ├─ unpause()
   └─ emergencyWithdraw()

Strategies (Versioned)
├─ AaveStrategy
│  ├─ deposit() - supply
│  ├─ borrow() - take loan
│  ├─ repay() - repay loan
│  ├─ withdraw() - withdraw supply
│  ├─ harvest() - claim interest
│  └─ getHealthFactor()
│
├─ AerodromeStrategy
│  ├─ deposit() - add liquidity
│  ├─ withdraw() - remove liquidity
│  ├─ harvest() - claim fees + rewards
│  └─ getImpermanentLoss()
│
└─ MegapotStrategy (External Integration)
   ├─ buyTicket() - purchase via Megapot
   ├─ claimPrize() - check winnings
   ├─ getJackpot() - fetch from Megapot
   └─ getUserInfo() - user stats
```

### 3.2 DefiCityCore Contract

**Purpose:** Immutable state storage and coordination

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title DefiCityCore
 * @notice Core contract for DefiCity - stores all user state (immutable)
 * @dev Uses modular architecture - delegates logic to swappable modules
 */
contract DefiCityCore is ReentrancyGuard, Pausable {
    // ============ State Variables ============

    /// @notice Protocol owner (multi-sig in production)
    address public owner;

    /// @notice Supported assets (USDC, USDT, ETH, WBTC)
    mapping(address => bool) public supportedAssets;

    /// @notice Module addresses (swappable)
    address public buildingManager;
    address public strategyRegistry;
    address public feeManager;
    address public emergencyManager;

    /// @notice Treasury address (receives fees)
    address public treasury;

    // ============ User Data Structures ============

    /// @notice City data per user
    struct City {
        address owner;
        uint256 createdAt;
        uint256 totalDeposited; // Total USD value deposited (18 decimals)
        uint256 totalEarned;    // Total USD value earned (18 decimals)
        uint16 buildingCount;
        bool hasTownHall;
    }

    /// @notice Building types
    enum BuildingType {
        NONE,           // 0 - Invalid
        TOWN_HALL,      // 1 - Smart wallet visualization (free)
        BANK,           // 2 - Aave supply/borrow
        SHOP,           // 3 - Aerodrome LP
        LOTTERY         // 4 - Chainlink VRF lottery
    }

    /// @notice Building data
    struct Building {
        uint256 id;
        address owner;
        BuildingType buildingType;
        address asset;              // USDC, USDT, ETH, WBTC
        uint256 depositedAmount;    // Amount deposited (in asset decimals)
        uint256 shares;             // Shares in strategy
        address strategy;           // Strategy contract address
        uint32 createdAt;
        bool isActive;
        bytes metadata;             // Strategy-specific data
    }

    // ============ Mappings ============

    /// @notice User address => City
    mapping(address => City) public cities;

    /// @notice Building ID => Building
    mapping(uint256 => Building) public buildings;

    /// @notice User => Building IDs
    mapping(address => uint256[]) public userBuildings;

    /// @notice User => Asset => Balance (funds not in buildings)
    mapping(address => mapping(address => uint256)) public userBalances;

    /// @notice Building counter
    uint256 public nextBuildingId = 1;

    // ============ Events ============

    event CityCreated(address indexed user, uint256 timestamp);
    event BuildingPlaced(
        uint256 indexed buildingId,
        address indexed user,
        BuildingType buildingType,
        address asset,
        uint256 amount
    );
    event BuildingUpgraded(uint256 indexed buildingId, uint256 newLevel);
    event YieldHarvested(
        uint256 indexed buildingId,
        address indexed user,
        uint256 amount,
        address asset
    );
    event BuildingDemolished(
        uint256 indexed buildingId,
        address indexed user,
        uint256 returnedAmount,
        address asset
    );
    event Deposited(address indexed user, address asset, uint256 amount);
    event Withdrawn(address indexed user, address asset, uint256 amount);
    event ModuleUpdated(string moduleName, address newAddress);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyModule() {
        require(
            msg.sender == buildingManager ||
            msg.sender == emergencyManager,
            "Not authorized module"
        );
        _;
    }

    // ============ Constructor ============

    constructor(
        address _treasury,
        address _buildingManager,
        address _strategyRegistry,
        address _feeManager,
        address _emergencyManager
    ) {
        owner = msg.sender;
        treasury = _treasury;
        buildingManager = _buildingManager;
        strategyRegistry = _strategyRegistry;
        feeManager = _feeManager;
        emergencyManager = _emergencyManager;
    }

    // ============ External Functions ============

    /**
     * @notice Deposit assets to user's wallet
     * @param asset Asset address (USDC, USDT, ETH, WBTC)
     * @param amount Amount to deposit
     */
    function deposit(address asset, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        require(supportedAssets[asset], "Asset not supported");
        require(amount > 0, "Amount must be > 0");

        // Create city if first deposit
        if (cities[msg.sender].owner == address(0)) {
            cities[msg.sender] = City({
                owner: msg.sender,
                createdAt: block.timestamp,
                totalDeposited: 0,
                totalEarned: 0,
                buildingCount: 0,
                hasTownHall: false
            });
            emit CityCreated(msg.sender, block.timestamp);
        }

        // Transfer tokens from user
        IERC20(asset).transferFrom(msg.sender, address(this), amount);

        // Update balance
        userBalances[msg.sender][asset] += amount;

        emit Deposited(msg.sender, asset, amount);
    }

    /**
     * @notice Withdraw assets from user's wallet to external address
     * @param asset Asset address
     * @param amount Amount to withdraw
     * @param to Destination address
     */
    function withdraw(address asset, uint256 amount, address to)
        external
        nonReentrant
        whenNotPaused
    {
        require(amount > 0, "Amount must be > 0");
        require(userBalances[msg.sender][asset] >= amount, "Insufficient balance");

        // Update balance
        userBalances[msg.sender][asset] -= amount;

        // Transfer tokens to user
        IERC20(asset).transfer(to, amount);

        emit Withdrawn(msg.sender, asset, amount);
    }

    /**
     * @notice Place new building (delegates to BuildingManager)
     */
    function placeBuilding(
        BuildingType buildingType,
        address asset,
        uint256 amount,
        bytes calldata strategyData
    ) external whenNotPaused returns (uint256) {
        // Delegate to BuildingManager module
        return IBuildingManager(buildingManager).placeBuilding(
            msg.sender,
            buildingType,
            asset,
            amount,
            strategyData
        );
    }

    /**
     * @notice Harvest yield from building (delegates to BuildingManager)
     */
    function harvest(uint256 buildingId) external whenNotPaused {
        IBuildingManager(buildingManager).harvest(msg.sender, buildingId);
    }

    /**
     * @notice Demolish building (delegates to BuildingManager)
     */
    function demolishBuilding(uint256 buildingId) external whenNotPaused {
        IBuildingManager(buildingManager).demolishBuilding(msg.sender, buildingId);
    }

    // ============ Module Functions ============

    /**
     * @notice Create building (called by BuildingManager)
     */
    function createBuilding(
        address user,
        BuildingType buildingType,
        address asset,
        uint256 amount,
        uint256 shares,
        address strategy,
        bytes memory metadata
    ) external onlyModule returns (uint256) {
        uint256 buildingId = nextBuildingId++;

        buildings[buildingId] = Building({
            id: buildingId,
            owner: user,
            buildingType: buildingType,
            asset: asset,
            depositedAmount: amount,
            shares: shares,
            strategy: strategy,
            createdAt: uint32(block.timestamp),
            isActive: true,
            metadata: metadata
        });

        userBuildings[user].push(buildingId);
        cities[user].buildingCount++;

        if (buildingType == BuildingType.TOWN_HALL) {
            cities[user].hasTownHall = true;
        }

        emit BuildingPlaced(buildingId, user, buildingType, asset, amount);

        return buildingId;
    }

    /**
     * @notice Update building shares (called by modules)
     */
    function updateBuildingShares(uint256 buildingId, uint256 newShares)
        external
        onlyModule
    {
        buildings[buildingId].shares = newShares;
    }

    /**
     * @notice Deactivate building (called by modules)
     */
    function deactivateBuilding(uint256 buildingId) external onlyModule {
        buildings[buildingId].isActive = false;
        cities[buildings[buildingId].owner].buildingCount--;
    }

    /**
     * @notice Transfer tokens (called by modules)
     */
    function transferFromUser(address user, address asset, uint256 amount)
        external
        onlyModule
    {
        require(userBalances[user][asset] >= amount, "Insufficient balance");
        userBalances[user][asset] -= amount;
    }

    /**
     * @notice Transfer tokens to user (called by modules)
     */
    function transferToUser(address user, address asset, uint256 amount)
        external
        onlyModule
    {
        userBalances[user][asset] += amount;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update module address (owner only)
     */
    function updateModule(string calldata moduleName, address newAddress)
        external
        onlyOwner
    {
        if (keccak256(bytes(moduleName)) == keccak256("buildingManager")) {
            buildingManager = newAddress;
        } else if (keccak256(bytes(moduleName)) == keccak256("strategyRegistry")) {
            strategyRegistry = newAddress;
        } else if (keccak256(bytes(moduleName)) == keccak256("feeManager")) {
            feeManager = newAddress;
        } else if (keccak256(bytes(moduleName)) == keccak256("emergencyManager")) {
            emergencyManager = newAddress;
        } else {
            revert("Unknown module");
        }

        emit ModuleUpdated(moduleName, newAddress);
    }

    /**
     * @notice Add supported asset (owner only)
     */
    function addSupportedAsset(address asset) external onlyOwner {
        supportedAssets[asset] = true;
    }

    /**
     * @notice Pause protocol (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause protocol (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @notice Get user's buildings
     */
    function getUserBuildings(address user)
        external
        view
        returns (uint256[] memory)
    {
        return userBuildings[user];
    }

    /**
     * @notice Get building details
     */
    function getBuilding(uint256 buildingId)
        external
        view
        returns (Building memory)
    {
        return buildings[buildingId];
    }

    /**
     * @notice Get user's city
     */
    function getCity(address user) external view returns (City memory) {
        return cities[user];
    }

    /**
     * @notice Get user's balance for specific asset
     */
    function getUserBalance(address user, address asset)
        external
        view
        returns (uint256)
    {
        return userBalances[user][asset];
    }
}

// ============ Interfaces ============

interface IBuildingManager {
    function placeBuilding(
        address user,
        DefiCityCore.BuildingType buildingType,
        address asset,
        uint256 amount,
        bytes calldata strategyData
    ) external returns (uint256);

    function harvest(address user, uint256 buildingId) external;

    function demolishBuilding(address user, uint256 buildingId) external;
}
```

### 3.3 BuildingManager Module

**Purpose:** Handle building operations (place, deposit, harvest, demolish)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title BuildingManager
 * @notice Manages building operations
 * @dev Swappable module - can be upgraded
 */
contract BuildingManager {
    // ============ State Variables ============

    DefiCityCore public immutable core;
    IStrategyRegistry public strategyRegistry;
    IFeeManager public feeManager;

    // Building type configurations
    struct BuildingConfig {
        uint256 minDeposit;     // Minimum deposit in USD (18 decimals)
        uint256 maxPerUser;     // Maximum buildings per user
        bool isActive;
        bool requiresApproval;  // For lottery (responsible gaming)
    }

    mapping(DefiCityCore.BuildingType => BuildingConfig) public buildingConfigs;

    // ============ Events ============

    event BuildingConfigured(
        DefiCityCore.BuildingType buildingType,
        uint256 minDeposit,
        uint256 maxPerUser
    );

    // ============ Constructor ============

    constructor(
        address _core,
        address _strategyRegistry,
        address _feeManager
    ) {
        core = DefiCityCore(_core);
        strategyRegistry = IStrategyRegistry(_strategyRegistry);
        feeManager = IFeeManager(_feeManager);

        // Configure building types
        buildingConfigs[DefiCityCore.BuildingType.TOWN_HALL] = BuildingConfig({
            minDeposit: 0,          // Free
            maxPerUser: 1,
            isActive: true,
            requiresApproval: false
        });

        buildingConfigs[DefiCityCore.BuildingType.BANK] = BuildingConfig({
            minDeposit: 100e18,     // $100 USD
            maxPerUser: 10,
            isActive: true,
            requiresApproval: false
        });

        buildingConfigs[DefiCityCore.BuildingType.SHOP] = BuildingConfig({
            minDeposit: 500e18,     // $500 USD
            maxPerUser: 5,
            isActive: true,
            requiresApproval: false
        });

        buildingConfigs[DefiCityCore.BuildingType.LOTTERY] = BuildingConfig({
            minDeposit: 10e18,      // $10 USD per ticket
            maxPerUser: type(uint256).max, // Unlimited tickets
            isActive: true,
            requiresApproval: true  // User must accept disclaimer
        });
    }

    // ============ External Functions ============

    /**
     * @notice Place new building
     * @param user User address
     * @param buildingType Type of building
     * @param asset Asset to invest (USDC, USDT, ETH, WBTC)
     * @param amount Amount to invest
     * @param strategyData Strategy-specific data
     */
    function placeBuilding(
        address user,
        DefiCityCore.BuildingType buildingType,
        address asset,
        uint256 amount,
        bytes calldata strategyData
    ) external returns (uint256) {
        require(msg.sender == address(core), "Only core");

        BuildingConfig memory config = buildingConfigs[buildingType];
        require(config.isActive, "Building type not active");

        // Validate minimum deposit (convert to USD)
        uint256 amountUSD = _convertToUSD(asset, amount);
        require(amountUSD >= config.minDeposit, "Below minimum deposit");

        // Validate max buildings per user
        if (config.maxPerUser != type(uint256).max) {
            uint256 userCount = _countUserBuildings(user, buildingType);
            require(userCount < config.maxPerUser, "Max buildings reached");
        }

        // Special handling for Town Hall (free)
        if (buildingType == DefiCityCore.BuildingType.TOWN_HALL) {
            return _placeTownHall(user);
        }

        // Calculate and collect fee (0.05% of deposit)
        uint256 feeAmount = feeManager.calculateFee(amount);
        uint256 netAmount = amount - feeAmount;

        // Transfer funds from user's balance
        core.transferFromUser(user, asset, amount);

        // Collect fee to treasury
        feeManager.collectFee(asset, feeAmount);

        // Get strategy for building type
        address strategy = strategyRegistry.getStrategy(buildingType, asset);
        require(strategy != address(0), "Strategy not found");

        // Deposit to strategy
        IERC20(asset).approve(strategy, netAmount);
        uint256 shares = IStrategy(strategy).deposit(user, netAmount, strategyData);

        // Create building in core
        uint256 buildingId = core.createBuilding(
            user,
            buildingType,
            asset,
            amount,
            shares,
            strategy,
            strategyData
        );

        return buildingId;
    }

    /**
     * @notice Harvest yield from building
     */
    function harvest(address user, uint256 buildingId) external {
        require(msg.sender == address(core), "Only core");

        DefiCityCore.Building memory building = core.getBuilding(buildingId);
        require(building.owner == user, "Not owner");
        require(building.isActive, "Building not active");

        // Call strategy harvest
        IStrategy strategy = IStrategy(building.strategy);
        uint256 yieldAmount = strategy.harvest(user, building.shares);

        require(yieldAmount > 0, "No yield to harvest");

        // Transfer yield to user's balance (no fee on harvest)
        core.transferToUser(user, building.asset, yieldAmount);
    }

    /**
     * @notice Demolish building and return funds
     */
    function demolishBuilding(address user, uint256 buildingId) external {
        require(msg.sender == address(core), "Only core");

        DefiCityCore.Building memory building = core.getBuilding(buildingId);
        require(building.owner == user, "Not owner");
        require(building.isActive, "Building not active");
        require(
            building.buildingType != DefiCityCore.BuildingType.TOWN_HALL,
            "Cannot demolish Town Hall"
        );

        // Withdraw from strategy
        IStrategy strategy = IStrategy(building.strategy);
        uint256 returnedAmount = strategy.withdraw(user, building.shares);

        // Deactivate building
        core.deactivateBuilding(buildingId);

        // Transfer funds to user's balance (no fee on demolish)
        core.transferToUser(user, building.asset, returnedAmount);
    }

    // ============ Internal Functions ============

    function _placeTownHall(address user) internal returns (uint256) {
        // Town Hall is free - just create the building
        return core.createBuilding(
            user,
            DefiCityCore.BuildingType.TOWN_HALL,
            address(0),  // No asset
            0,           // No amount
            0,           // No shares
            address(0),  // No strategy
            ""           // No metadata
        );
    }

    function _countUserBuildings(address user, DefiCityCore.BuildingType buildingType)
        internal
        view
        returns (uint256)
    {
        uint256[] memory userBuildings = core.getUserBuildings(user);
        uint256 count = 0;

        for (uint256 i = 0; i < userBuildings.length; i++) {
            DefiCityCore.Building memory building = core.getBuilding(userBuildings[i]);
            if (building.buildingType == buildingType && building.isActive) {
                count++;
            }
        }

        return count;
    }

    function _convertToUSD(address asset, uint256 amount)
        internal
        view
        returns (uint256)
    {
        // Use Chainlink price feed to convert to USD
        // Simplified - actual implementation would use oracle
        return amount; // Assume 1:1 for stablecoins
    }
}
```

### 3.4 Strategy Interfaces

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IStrategy
 * @notice Interface for all DeFi strategies
 */
interface IStrategy {
    /**
     * @notice Deposit assets into strategy
     * @param user User address
     * @param amount Amount to deposit
     * @param data Strategy-specific data
     * @return shares Shares minted to user
     */
    function deposit(address user, uint256 amount, bytes calldata data)
        external
        returns (uint256 shares);

    /**
     * @notice Withdraw assets from strategy
     * @param user User address
     * @param shares Shares to burn
     * @return amount Amount withdrawn
     */
    function withdraw(address user, uint256 shares)
        external
        returns (uint256 amount);

    /**
     * @notice Harvest yield from strategy
     * @param user User address
     * @param shares User's shares
     * @return yield Yield amount
     */
    function harvest(address user, uint256 shares)
        external
        returns (uint256 yield);

    /**
     * @notice Get user's balance (principal + unrealized yield)
     * @param user User address
     * @param shares User's shares
     * @return balance Total balance
     */
    function balanceOf(address user, uint256 shares)
        external
        view
        returns (uint256 balance);

    /**
     * @notice Get pending rewards (unrealized yield)
     * @param user User address
     * @param shares User's shares
     * @return pending Pending rewards
     */
    function pendingRewards(address user, uint256 shares)
        external
        view
        returns (uint256 pending);

    /**
     * @notice Get current APY
     * @return apy Current APY (18 decimals, e.g., 5.2% = 5.2e18)
     */
    function getAPY() external view returns (uint256 apy);
}

/**
 * @title IAaveStrategy
 * @notice Extended interface for Aave strategy (supply + borrow)
 */
interface IAaveStrategy is IStrategy {
    /**
     * @notice Borrow assets against collateral
     * @param user User address
     * @param asset Asset to borrow
     * @param amount Amount to borrow
     * @return success Whether borrow succeeded
     */
    function borrow(address user, address asset, uint256 amount)
        external
        returns (bool success);

    /**
     * @notice Repay borrowed assets
     * @param user User address
     * @param asset Asset to repay
     * @param amount Amount to repay
     * @return success Whether repay succeeded
     */
    function repay(address user, address asset, uint256 amount)
        external
        returns (bool success);

    /**
     * @notice Get user's health factor
     * @param user User address
     * @return healthFactor Health factor (18 decimals, < 1.0 = liquidation risk)
     */
    function getHealthFactor(address user)
        external
        view
        returns (uint256 healthFactor);

    /**
     * @notice Check if user is liquidatable
     * @param user User address
     * @return liquidatable Whether user can be liquidated
     */
    function isLiquidatable(address user) external view returns (bool liquidatable);
}

/**
 * @title IAerodromeStrategy
 * @notice Extended interface for Aerodrome LP strategy
 */
interface IAerodromeStrategy is IStrategy {
    /**
     * @notice Get impermanent loss for user's position
     * @param user User address
     * @param shares User's shares
     * @return ilPercentage IL as percentage (18 decimals, e.g., 5.7% = 5.7e18)
     */
    function getImpermanentLoss(address user, uint256 shares)
        external
        view
        returns (uint256 ilPercentage);

    /**
     * @notice Get trading pair info
     * @return token0 First token address
     * @return token1 Second token address
     * @return fee Fee tier (e.g., 3000 = 0.3%)
     */
    function getPairInfo()
        external
        view
        returns (address token0, address token1, uint24 fee);
}

/**
 * @title ILotteryStrategy
 * @notice Interface for lottery strategy (Megapot integration)
 */
interface ILotteryStrategy {
    /**
     * @notice Buy lottery tickets
     * @param user User address (recipient)
     * @param asset Asset to pay with (USDC only for Megapot)
     * @param amount Total amount to spend
     * @param data Additional data (unused for Megapot)
     * @return ticketCount Number of tickets purchased
     */
    function buyTicket(
        address user,
        address asset,
        uint256 amount,
        uint8[] calldata data
    ) external returns (uint256 ticketCount);

    /**
     * @notice Claim prize (checks Megapot for winnings)
     * @param ticketId Unused (for interface compatibility)
     * @return prizeAmount Prize amount
     */
    function claimPrize(uint256 ticketId) external returns (uint256 prizeAmount);

    /**
     * @notice Get current jackpot from Megapot
     * @return jackpot Jackpot amount in USDC
     */
    function getJackpot() external view returns (uint256 jackpot);
}
```

---

## 4. Account Abstraction Layer

### 4.1 ERC-4337 Architecture

```
User Action (Frontend)
        ↓
Create UserOperation
        ↓
Sign with Session Key
        ↓
Send to Bundler (StackUp)
        ↓
Bundler validates
        ↓
Call EntryPoint.handleOps()
        ↓
EntryPoint validates signature
        ↓
EntryPoint calls Paymaster
        ↓
Paymaster approves gas sponsorship
        ↓
EntryPoint executes:
  Smart Wallet.execute()
        ↓
Smart Wallet calls:
  DefiCityCore.placeBuilding()
        ↓
Transaction confirmed
        ↓
Frontend updates UI
```

### 4.2 Smart Wallet Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/samples/SimpleAccount.sol";

/**
 * @title DefiCitySmartWallet
 * @notice ERC-4337 compliant smart wallet for DefiCity
 * @dev Extends SimpleAccount with session key functionality
 */
contract DefiCitySmartWallet is SimpleAccount {
    // ============ Session Key Storage ============

    struct SessionKey {
        address key;
        uint48 validUntil;      // Expiry timestamp
        uint192 spendingLimit;  // Remaining spending limit
        address allowedContract; // Only DefiCityCore
        bool isActive;
    }

    mapping(address => SessionKey) public sessionKeys;

    // ============ Events ============

    event SessionKeyCreated(
        address indexed sessionKey,
        uint48 validUntil,
        uint192 spendingLimit
    );
    event SessionKeyRevoked(address indexed sessionKey);
    event SessionKeyUsed(address indexed sessionKey, uint192 amountSpent);

    // ============ Constructor ============

    constructor(IEntryPoint anEntryPoint) SimpleAccount(anEntryPoint) {}

    // ============ Session Key Functions ============

    /**
     * @notice Create session key
     * @param sessionKey Key address
     * @param validFor Validity period (seconds)
     * @param spendingLimit Max spending limit (USD)
     * @param allowedContract Contract allowed to call
     */
    function createSessionKey(
        address sessionKey,
        uint48 validFor,
        uint192 spendingLimit,
        address allowedContract
    ) external onlyOwner {
        sessionKeys[sessionKey] = SessionKey({
            key: sessionKey,
            validUntil: uint48(block.timestamp + validFor),
            spendingLimit: spendingLimit,
            allowedContract: allowedContract,
            isActive: true
        });

        emit SessionKeyCreated(
            sessionKey,
            uint48(block.timestamp + validFor),
            spendingLimit
        );
    }

    /**
     * @notice Revoke session key
     */
    function revokeSessionKey(address sessionKey) external onlyOwner {
        sessionKeys[sessionKey].isActive = false;
        emit SessionKeyRevoked(sessionKey);
    }

    /**
     * @notice Validate signature (override to support session keys)
     */
    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address recovered = hash.recover(userOp.signature);

        // Check if signature is from owner
        if (recovered == owner) {
            return 0; // Valid
        }

        // Check if signature is from active session key
        SessionKey memory sessionKey = sessionKeys[recovered];
        if (
            sessionKey.isActive &&
            block.timestamp < sessionKey.validUntil &&
            sessionKey.spendingLimit > 0
        ) {
            // Validate target is allowed contract
            address target = address(bytes20(userOp.callData[16:36]));
            if (target == sessionKey.allowedContract) {
                return 0; // Valid
            }
        }

        return 1; // Invalid
    }

    /**
     * @notice Update session key spending (called after execution)
     */
    function _updateSessionKeySpending(
        address sessionKey,
        uint192 amountSpent
    ) internal {
        SessionKey storage key = sessionKeys[sessionKey];
        if (key.spendingLimit >= amountSpent) {
            key.spendingLimit -= amountSpent;
        } else {
            key.spendingLimit = 0;
            key.isActive = false;
        }

        emit SessionKeyUsed(sessionKey, amountSpent);
    }
}
```

### 4.3 Paymaster Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@account-abstraction/contracts/core/BasePaymaster.sol";

/**
 * @title DefiCityPaymaster
 * @notice Sponsors gas for gameplay transactions
 * @dev Implements ERC-4337 Paymaster interface
 */
contract DefiCityPaymaster is BasePaymaster {
    // ============ State Variables ============

    /// @notice Per-user daily gas limit (USD value, 18 decimals)
    uint256 public constant USER_DAILY_LIMIT = 500e18; // $500

    /// @notice Global daily gas limit
    uint256 public constant GLOBAL_DAILY_LIMIT = 10_000e18; // $10,000

    /// @notice Per-transaction gas limit
    uint256 public constant PER_TX_LIMIT = 0.5e18; // $0.50

    /// @notice User => Date => Gas spent (USD)
    mapping(address => mapping(uint256 => uint256)) public userDailyGas;

    /// @notice Date => Global gas spent (USD)
    mapping(uint256 => uint256) public globalDailyGas;

    /// @notice DefiCityCore contract address (only sponsor these calls)
    address public defiCityCore;

    // ============ Events ============

    event GasSponsored(
        address indexed user,
        uint256 actualGasCost,
        uint256 actualGasPrice
    );
    event LimitReached(address indexed user, string limitType);

    // ============ Constructor ============

    constructor(
        IEntryPoint _entryPoint,
        address _defiCityCore
    ) BasePaymaster(_entryPoint) {
        defiCityCore = _defiCityCore;
    }

    // ============ Paymaster Logic ============

    /**
     * @notice Validate if paymaster will sponsor this UserOperation
     */
    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal virtual override returns (bytes memory context, uint256 validationData) {
        // Only sponsor calls to DefiCityCore
        address target = address(bytes20(userOp.callData[16:36]));
        require(target == defiCityCore, "Target not DefiCityCore");

        // Check per-transaction limit
        uint256 maxCostUSD = _convertToUSD(maxCost);
        require(maxCostUSD <= PER_TX_LIMIT, "Transaction too expensive");

        address user = userOp.getSender();
        uint256 today = block.timestamp / 1 days;

        // Check user daily limit
        uint256 userSpent = userDailyGas[user][today];
        require(userSpent + maxCostUSD <= USER_DAILY_LIMIT, "User limit reached");

        // Check global daily limit
        uint256 globalSpent = globalDailyGas[today];
        require(globalSpent + maxCostUSD <= GLOBAL_DAILY_LIMIT, "Global limit reached");

        // Encode user and date for _postOp
        context = abi.encode(user, today, maxCostUSD);
        validationData = 0; // Valid

        return (context, validationData);
    }

    /**
     * @notice Called after UserOperation execution (record actual gas used)
     */
    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) internal virtual override {
        (address user, uint256 today, uint256 maxCostUSD) = abi.decode(
            context,
            (address, uint256, uint256)
        );

        uint256 actualGasCostUSD = _convertToUSD(actualGasCost);

        // Update limits
        userDailyGas[user][today] += actualGasCostUSD;
        globalDailyGas[today] += actualGasCostUSD;

        emit GasSponsored(user, actualGasCost, tx.gasprice);
    }

    /**
     * @notice Owner can deposit ETH to fund paymaster
     */
    function deposit() external payable onlyOwner {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    /**
     * @notice Owner can withdraw ETH
     */
    function withdrawTo(address payable to, uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(to, amount);
    }

    // ============ Internal Functions ============

    function _convertToUSD(uint256 gasAmount) internal view returns (uint256) {
        // Convert ETH gas cost to USD using oracle
        // Simplified - actual implementation would use Chainlink
        return gasAmount; // Placeholder
    }
}
```

### 4.4 Session Key Flow

**Creating Session Key:**
```typescript
// Frontend (TypeScript)
async function createSessionKey() {
  // Generate ephemeral key
  const sessionKeyPair = await generateKeyPair();

  // Session parameters
  const validFor = 24 * 60 * 60; // 24 hours
  const spendingLimit = parseEther("1000"); // 1000 USDC
  const allowedContract = DEFICITY_CORE_ADDRESS;

  // Create session key (user pays gas - one time)
  const tx = await smartWallet.createSessionKey(
    sessionKeyPair.address,
    validFor,
    spendingLimit,
    allowedContract
  );

  await tx.wait();

  // Store session key in encrypted localStorage
  await storeSessionKey(sessionKeyPair.privateKey);

  return sessionKeyPair;
}
```

**Using Session Key (Gasless):**
```typescript
// Frontend (TypeScript)
async function placeBuildingGasless(buildingType, asset, amount) {
  // Load session key from storage
  const sessionKey = await loadSessionKey();

  // Create UserOperation
  const userOp = await createUserOperation({
    sender: smartWalletAddress,
    callData: encodeFunctionData({
      abi: DefiCityCoreABI,
      functionName: "placeBuilding",
      args: [buildingType, asset, amount, "0x"]
    })
  });

  // Sign with session key (not main wallet)
  const signature = await signUserOperation(userOp, sessionKey);
  userOp.signature = signature;

  // Send to bundler (gasless!)
  const bundlerClient = createBundlerClient({
    transport: http(BUNDLER_URL)
  });

  const userOpHash = await bundlerClient.sendUserOperation({
    userOperation: userOp
  });

  // Wait for confirmation
  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash
  });

  return receipt;
}
```

---

## 5. DeFi Strategy Integrations

### 5.1 Aave Strategy (Bank Building)

**Purpose:** Supply assets to earn interest, borrow against collateral

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IAToken} from "@aave/core-v3/contracts/interfaces/IAToken.sol";
import {IPoolDataProvider} from "@aave/core-v3/contracts/interfaces/IPoolDataProvider.sol";

/**
 * @title AaveStrategy
 * @notice Strategy for Aave V3 lending (supply + borrow)
 */
contract AaveStrategy is IAaveStrategy {
    // ============ State Variables ============

    IPool public immutable aavePool;
    IPoolDataProvider public immutable dataProvider;

    address public immutable asset; // USDC, USDT, ETH, or WBTC
    IAToken public immutable aToken; // aUSDC, aUSDT, aWETH, aWBTC

    // User => Shares
    mapping(address => uint256) public userShares;

    // User => Deposited amount (for yield calculation)
    mapping(address => uint256) public userDeposited;

    // User => Harvested amount (track lifetime earnings)
    mapping(address => uint256) public userHarvested;

    // User => Borrowed assets
    mapping(address => mapping(address => uint256)) public userBorrowed;

    uint256 public totalShares;

    // ============ Constructor ============

    constructor(
        address _aavePool,
        address _dataProvider,
        address _asset
    ) {
        aavePool = IPool(_aavePool);
        dataProvider = IPoolDataProvider(_dataProvider);
        asset = _asset;

        // Get aToken address
        (address aTokenAddress,,) = dataProvider.getReserveTokensAddresses(_asset);
        aToken = IAToken(aTokenAddress);
    }

    // ============ Supply Functions ============

    /**
     * @notice Deposit assets to Aave (supply)
     */
    function deposit(address user, uint256 amount, bytes calldata data)
        external
        override
        returns (uint256 shares)
    {
        require(amount > 0, "Amount must be > 0");

        // Transfer assets from Core
        IERC20(asset).transferFrom(msg.sender, address(this), amount);

        // Approve Aave pool
        IERC20(asset).approve(address(aavePool), amount);

        // Supply to Aave (receive aTokens)
        aavePool.supply(asset, amount, address(this), 0);

        // Calculate shares (proportional to total supply)
        if (totalShares == 0) {
            shares = amount; // First depositor
        } else {
            uint256 totalBalance = aToken.balanceOf(address(this));
            shares = (amount * totalShares) / totalBalance;
        }

        // Update state
        userShares[user] += shares;
        userDeposited[user] += amount;
        totalShares += shares;

        return shares;
    }

    /**
     * @notice Withdraw assets from Aave
     */
    function withdraw(address user, uint256 shares)
        external
        override
        returns (uint256 amount)
    {
        require(shares > 0, "Shares must be > 0");
        require(userShares[user] >= shares, "Insufficient shares");

        // Calculate amount (shares * balance / totalShares)
        uint256 totalBalance = aToken.balanceOf(address(this));
        amount = (shares * totalBalance) / totalShares;

        // Withdraw from Aave
        uint256 withdrawn = aavePool.withdraw(asset, amount, msg.sender);

        // Update state
        userShares[user] -= shares;
        totalShares -= shares;

        return withdrawn;
    }

    /**
     * @notice Harvest yield (claim interest earned)
     */
    function harvest(address user, uint256 shares)
        external
        override
        returns (uint256 yield)
    {
        require(shares > 0, "Shares must be > 0");

        // Calculate current value
        uint256 currentValue = balanceOf(user, shares);
        uint256 deposited = userDeposited[user];
        uint256 harvested = userHarvested[user];

        // Yield = currentValue - deposited - alreadyHarvested
        if (currentValue > deposited + harvested) {
            yield = currentValue - deposited - harvested;

            // Withdraw yield only (not principal)
            aavePool.withdraw(asset, yield, msg.sender);

            // Update harvested amount
            userHarvested[user] += yield;
        }

        return yield;
    }

    // ============ Borrow Functions ============

    /**
     * @notice Borrow assets against collateral
     * @param user User address
     * @param borrowAsset Asset to borrow (different from supply)
     * @param amount Amount to borrow
     */
    function borrow(address user, address borrowAsset, uint256 amount)
        external
        override
        returns (bool)
    {
        require(amount > 0, "Amount must be > 0");
        require(borrowAsset != asset, "Cannot borrow same asset as collateral");

        // Check if user has enough collateral
        uint256 healthFactorBefore = getHealthFactor(user);
        require(healthFactorBefore > 1.5e18, "Health factor too low");

        // Borrow from Aave (variable rate, mode 2)
        aavePool.borrow(borrowAsset, amount, 2, 0, address(this));

        // Check health factor after borrow
        uint256 healthFactorAfter = getHealthFactor(user);
        require(healthFactorAfter >= 1.0e18, "Borrow would cause liquidation");

        // Transfer borrowed assets to user
        IERC20(borrowAsset).transfer(msg.sender, amount);

        // Track borrowed amount
        userBorrowed[user][borrowAsset] += amount;

        return true;
    }

    /**
     * @notice Repay borrowed assets
     */
    function repay(address user, address borrowAsset, uint256 amount)
        external
        override
        returns (bool)
    {
        require(amount > 0, "Amount must be > 0");
        require(userBorrowed[user][borrowAsset] > 0, "No debt to repay");

        // Transfer repayment from Core
        IERC20(borrowAsset).transferFrom(msg.sender, address(this), amount);

        // Approve Aave pool
        IERC20(borrowAsset).approve(address(aavePool), amount);

        // Repay to Aave (variable rate, mode 2)
        uint256 repaid = aavePool.repay(borrowAsset, amount, 2, address(this));

        // Update borrowed amount
        if (repaid >= userBorrowed[user][borrowAsset]) {
            userBorrowed[user][borrowAsset] = 0;
        } else {
            userBorrowed[user][borrowAsset] -= repaid;
        }

        return true;
    }

    // ============ View Functions ============

    /**
     * @notice Get user's balance (principal + unrealized yield)
     */
    function balanceOf(address user, uint256 shares)
        external
        view
        override
        returns (uint256)
    {
        if (totalShares == 0) return 0;

        uint256 totalBalance = aToken.balanceOf(address(this));
        return (shares * totalBalance) / totalShares;
    }

    /**
     * @notice Get pending rewards (unrealized yield)
     */
    function pendingRewards(address user, uint256 shares)
        external
        view
        override
        returns (uint256)
    {
        uint256 currentValue = this.balanceOf(user, shares);
        uint256 deposited = userDeposited[user];
        uint256 harvested = userHarvested[user];

        if (currentValue > deposited + harvested) {
            return currentValue - deposited - harvested;
        }

        return 0;
    }

    /**
     * @notice Get current supply APY from Aave
     */
    function getAPY() external view override returns (uint256) {
        (,,,, uint256 liquidityRate,,,,,,) = dataProvider.getReserveData(asset);

        // Convert Aave rate (ray format) to percentage (18 decimals)
        // liquidityRate is in ray (27 decimals), need to convert to 18 decimals
        return liquidityRate / 1e9;
    }

    /**
     * @notice Get user's health factor
     * @dev Health factor = (collateral * liquidationThreshold) / totalDebt
     *      < 1.0 = liquidation
     *      > 1.5 = safe
     */
    function getHealthFactor(address user)
        public
        view
        override
        returns (uint256)
    {
        (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            ,
            uint256 currentLiquidationThreshold,
            ,
            uint256 healthFactor
        ) = aavePool.getUserAccountData(address(this));

        // Return health factor (18 decimals)
        return healthFactor;
    }

    /**
     * @notice Check if user is liquidatable
     */
    function isLiquidatable(address user)
        external
        view
        override
        returns (bool)
    {
        uint256 healthFactor = getHealthFactor(user);
        return healthFactor < 1.0e18;
    }
}
```

### 5.2 Aerodrome Strategy (Shop Building)

**Purpose:** Provide liquidity to earn trading fees

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IRouter} from "@aerodrome/contracts/interfaces/IRouter.sol";
import {IPair} from "@aerodrome/contracts/interfaces/IPair.sol";

/**
 * @title AerodromeStrategy
 * @notice Strategy for Aerodrome LP providing
 */
contract AerodromeStrategy is IAerodromeStrategy {
    // ============ State Variables ============

    IRouter public immutable router;
    IPair public immutable pair;

    address public immutable token0;
    address public immutable token1;
    bool public immutable stable; // Stable or volatile pool

    mapping(address => uint256) public userShares;
    mapping(address => uint256) public userDeposited;
    mapping(address => uint256) public userDepositedToken0;
    mapping(address => uint256) public userDepositedToken1;

    uint256 public totalShares;

    // ============ Constructor ============

    constructor(
        address _router,
        address _pair,
        address _token0,
        address _token1,
        bool _stable
    ) {
        router = IRouter(_router);
        pair = IPair(_pair);
        token0 = _token0;
        token1 = _token1;
        stable = _stable;
    }

    // ============ LP Functions ============

    /**
     * @notice Add liquidity to Aerodrome
     * @param user User address
     * @param amount Amount of primary asset
     * @param data Encoded: (bool isSingleAsset, uint256 minToken0, uint256 minToken1)
     */
    function deposit(address user, uint256 amount, bytes calldata data)
        external
        override
        returns (uint256 shares)
    {
        (bool isSingleAsset, uint256 minToken0, uint256 minToken1) =
            abi.decode(data, (bool, uint256, uint256));

        uint256 amount0;
        uint256 amount1;

        if (isSingleAsset) {
            // Single asset deposit - swap 50% to other token
            amount0 = amount / 2;
            amount1 = _swapTokens(token0, token1, amount0);
        } else {
            // Dual asset deposit
            amount0 = amount;
            // Assume amount1 already transferred to strategy
        }

        // Approve router
        IERC20(token0).approve(address(router), amount0);
        IERC20(token1).approve(address(router), amount1);

        // Add liquidity
        (uint256 amountA, uint256 amountB, uint256 liquidity) = router.addLiquidity(
            token0,
            token1,
            stable,
            amount0,
            amount1,
            minToken0,
            minToken1,
            address(this),
            block.timestamp + 300
        );

        // Calculate shares
        if (totalShares == 0) {
            shares = liquidity;
        } else {
            uint256 totalBalance = pair.balanceOf(address(this));
            shares = (liquidity * totalShares) / totalBalance;
        }

        // Update state
        userShares[user] += shares;
        userDeposited[user] += amount;
        userDepositedToken0[user] += amountA;
        userDepositedToken1[user] += amountB;
        totalShares += shares;

        return shares;
    }

    /**
     * @notice Remove liquidity from Aerodrome
     */
    function withdraw(address user, uint256 shares)
        external
        override
        returns (uint256 amount)
    {
        require(userShares[user] >= shares, "Insufficient shares");

        // Calculate LP tokens to remove
        uint256 totalBalance = pair.balanceOf(address(this));
        uint256 lpTokens = (shares * totalBalance) / totalShares;

        // Approve router
        pair.approve(address(router), lpTokens);

        // Remove liquidity
        (uint256 amount0, uint256 amount1) = router.removeLiquidity(
            token0,
            token1,
            stable,
            lpTokens,
            0, // minToken0
            0, // minToken1
            msg.sender,
            block.timestamp + 300
        );

        // Update state
        userShares[user] -= shares;
        totalShares -= shares;

        // Return total value (convert to primary asset)
        amount = amount0 + _getAmountOut(token1, token0, amount1);

        return amount;
    }

    /**
     * @notice Harvest trading fees and AERO rewards
     */
    function harvest(address user, uint256 shares)
        external
        override
        returns (uint256 yield)
    {
        // Claim fees from pair
        pair.claimFees();

        // Calculate user's share of fees
        uint256 fees0 = IERC20(token0).balanceOf(address(this));
        uint256 fees1 = IERC20(token1).balanceOf(address(this));

        uint256 userFees0 = (fees0 * shares) / totalShares;
        uint256 userFees1 = (fees1 * shares) / totalShares;

        // Transfer fees to user
        if (userFees0 > 0) {
            IERC20(token0).transfer(msg.sender, userFees0);
        }
        if (userFees1 > 0) {
            IERC20(token1).transfer(msg.sender, userFees1);
        }

        // Calculate total yield value
        yield = userFees0 + _getAmountOut(token1, token0, userFees1);

        return yield;
    }

    // ============ View Functions ============

    /**
     * @notice Get impermanent loss percentage
     * @dev IL = (value if held) - (current LP value) / (value if held)
     */
    function getImpermanentLoss(address user, uint256 shares)
        external
        view
        override
        returns (uint256 ilPercentage)
    {
        // Get user's deposited amounts
        uint256 deposited0 = userDepositedToken0[user];
        uint256 deposited1 = userDepositedToken1[user];

        // Calculate value if held (in token0)
        uint256 valueIfHeld = deposited0 + _getAmountOut(token1, token0, deposited1);

        // Calculate current LP value
        uint256 currentValue = this.balanceOf(user, shares);

        // Calculate IL percentage
        if (currentValue < valueIfHeld) {
            ilPercentage = ((valueIfHeld - currentValue) * 1e18) / valueIfHeld;
        } else {
            ilPercentage = 0; // No IL (unlikely unless fees > IL)
        }

        return ilPercentage;
    }

    /**
     * @notice Get current balance (LP value)
     */
    function balanceOf(address user, uint256 shares)
        external
        view
        override
        returns (uint256)
    {
        if (totalShares == 0) return 0;

        uint256 totalBalance = pair.balanceOf(address(this));
        uint256 lpTokens = (shares * totalBalance) / totalShares;

        // Get reserves
        (uint256 reserve0, uint256 reserve1,) = pair.getReserves();
        uint256 totalSupply = pair.totalSupply();

        // Calculate user's share of reserves
        uint256 amount0 = (lpTokens * reserve0) / totalSupply;
        uint256 amount1 = (lpTokens * reserve1) / totalSupply;

        // Convert to token0 value
        return amount0 + _getAmountOut(token1, token0, amount1);
    }

    /**
     * @notice Get pending rewards (fees not yet claimed)
     */
    function pendingRewards(address user, uint256 shares)
        external
        view
        override
        returns (uint256)
    {
        // Get claimable fees
        uint256 claimable0 = pair.claimable0(address(this));
        uint256 claimable1 = pair.claimable1(address(this));

        // Calculate user's share
        uint256 userClaimable0 = (claimable0 * shares) / totalShares;
        uint256 userClaimable1 = (claimable1 * shares) / totalShares;

        // Convert to token0 value
        return userClaimable0 + _getAmountOut(token1, token0, userClaimable1);
    }

    /**
     * @notice Get current APY (fees + AERO rewards)
     */
    function getAPY() external view override returns (uint256) {
        // Calculate based on 24h fees and AERO emissions
        // Simplified - actual implementation would use historical data
        return 12e18; // 12% placeholder
    }

    /**
     * @notice Get trading pair info
     */
    function getPairInfo()
        external
        view
        override
        returns (address, address, uint24)
    {
        uint24 fee = stable ? 100 : 3000; // 0.01% or 0.3%
        return (token0, token1, fee);
    }

    // ============ Internal Functions ============

    function _swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        IERC20(tokenIn).approve(address(router), amountIn);

        IRouter.Route[] memory routes = new IRouter.Route[](1);
        routes[0] = IRouter.Route({
            from: tokenIn,
            to: tokenOut,
            stable: stable
        });

        uint256[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            0, // Accept any amount
            routes,
            address(this),
            block.timestamp + 300
        );

        return amounts[amounts.length - 1];
    }

    function _getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        return router.getAmountOut(amountIn, tokenIn, tokenOut);
    }
}
```

### 5.3 Lottery Strategy (Megapot Integration)

**Purpose:** Integrate with Megapot - A $1M+ USD jackpot on Base

**Why Megapot:**
- Production-ready lottery with $1M+ jackpot
- Provably fair (Chainlink VRF)
- Already audited and battle-tested
- No need to build/maintain our own lottery
- Earn referral fees for bringing users

**Megapot Details:**
- Contract: `0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95` (Base Mainnet)
- Token: USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- Ticket Price: Dynamic (fetched via `getTicketPrice()`)
- Jackpot: $1M+ USD (grows over time)
- Draws: Regular intervals (check `getTimeRemaining()`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title MegapotStrategy
 * @notice Integration with Megapot jackpot (https://megapot.io)
 * @dev Wrapper around Megapot contract for DefiCity buildings
 */
contract MegapotStrategy is ILotteryStrategy {
    // ============ State Variables ============

    /// @notice Megapot jackpot contract on Base
    IMegapotJackpot public immutable megapot;

    /// @notice USDC token (used for ticket purchases)
    IERC20 public immutable usdc;

    /// @notice Referrer address (DefiCity earns fees)
    address public immutable referrer;

    /// @notice Track user's ticket purchases
    /// User => Total USDC spent on tickets
    mapping(address => uint256) public userTotalSpent;

    /// @notice Track user's winnings
    /// User => Total USDC won
    mapping(address => uint256) public userTotalWon;

    // ============ Events ============

    event TicketsPurchased(
        address indexed user,
        uint256 ticketCount,
        uint256 totalCost,
        uint256 timestamp
    );
    event WinningsClaimed(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );

    // ============ Constructor ============

    constructor(
        address _megapot,
        address _usdc,
        address _referrer
    ) {
        megapot = IMegapotJackpot(_megapot);
        usdc = IERC20(_usdc);
        referrer = _referrer; // DefiCity receives referral fees
    }

    // ============ Ticket Functions ============

    /**
     * @notice Buy lottery tickets (via Megapot)
     * @param user User address (recipient)
     * @param asset Asset to pay with (must be USDC)
     * @param amount Total USDC to spend on tickets
     * @param data Unused (Megapot doesn't allow number selection)
     * @return ticketCount Number of tickets purchased
     */
    function buyTicket(
        address user,
        address asset,
        uint256 amount,
        uint8[] calldata data
    ) external override returns (uint256 ticketCount) {
        require(asset == address(usdc), "Only USDC supported");
        require(amount > 0, "Amount must be > 0");

        // Get ticket price from Megapot
        uint256 ticketPrice = megapot.getTicketPrice();
        require(amount >= ticketPrice, "Insufficient for 1 ticket");

        // Calculate number of tickets
        ticketCount = amount / ticketPrice;
        uint256 totalCost = ticketCount * ticketPrice;

        // Transfer USDC from Core contract
        usdc.transferFrom(msg.sender, address(this), totalCost);

        // Approve Megapot to spend USDC
        usdc.approve(address(megapot), totalCost);

        // Purchase tickets on Megapot (recipient = user)
        // Referrer = DefiCity (we earn fees!)
        megapot.purchaseTickets(referrer, totalCost, user);

        // Track user's spending
        userTotalSpent[user] += totalCost;

        emit TicketsPurchased(user, ticketCount, totalCost, block.timestamp);

        return ticketCount;
    }

    // ============ Prize Functions ============

    /**
     * @notice Claim winnings from Megapot
     * @dev User claims directly, not via this contract
     */
    function claimPrize(uint256 ticketId)
        external
        override
        returns (uint256 prizeAmount)
    {
        // Get claimable winnings from Megapot
        prizeAmount = megapot.winningsClaimable(msg.sender);
        require(prizeAmount > 0, "No winnings to claim");

        // Note: User must claim directly from Megapot contract
        // This is just for tracking/display purposes
        userTotalWon[msg.sender] += prizeAmount;

        emit WinningsClaimed(msg.sender, prizeAmount, block.timestamp);

        return prizeAmount;
    }

    // ============ View Functions ============

    /**
     * @notice Get current jackpot amount from Megapot
     */
    function getJackpot() external view override returns (uint256) {
        return megapot.getJackpotAmount();
    }

    /**
     * @notice Get user's info from Megapot
     */
    function getUserInfo(address user)
        external
        view
        returns (
            uint256 ticketsPurchasedTotalBps,
            uint256 winningsClaimable,
            bool isActive
        )
    {
        return megapot.getUsersInfo(user);
    }

    /**
     * @notice Get ticket price from Megapot
     */
    function getTicketPrice() external view returns (uint256) {
        return megapot.getTicketPrice();
    }

    /**
     * @notice Get time remaining until next draw
     */
    function getTimeRemaining() external view returns (uint256) {
        return megapot.getTimeRemaining();
    }

    /**
     * @notice Get user's total spending on tickets
     */
    function getUserTotalSpent(address user) external view returns (uint256) {
        return userTotalSpent[user];
    }

    /**
     * @notice Get user's total winnings
     */
    function getUserTotalWon(address user) external view returns (uint256) {
        return userTotalWon[user];
    }

    /**
     * @notice Get last jackpot results from Megapot
     */
    function getLastJackpotResults()
        external
        view
        returns (
            uint256 time,
            address winner,
            uint256 winningTicket,
            uint256 winAmount,
            uint256 totalTickets
        )
    {
        return megapot.getLastJackpotResults();
    }
}

/**
 * @title IMegapotJackpot
 * @notice Interface for Megapot jackpot contract
 */
interface IMegapotJackpot {
    /**
     * @notice Purchase tickets
     * @param referrer Referrer address (earns fees)
     * @param value Total USDC to spend
     * @param recipient Ticket recipient address
     */
    function purchaseTickets(
        address referrer,
        uint256 value,
        address recipient
    ) external;

    /**
     * @notice Get claimable winnings for user
     */
    function winningsClaimable(address user) external view returns (uint256);

    /**
     * @notice Get current ticket price
     */
    function getTicketPrice() external view returns (uint256);

    /**
     * @notice Get current jackpot amount
     */
    function getJackpotAmount() external view returns (uint256);

    /**
     * @notice Get time remaining until next draw
     */
    function getTimeRemaining() external view returns (uint256);

    /**
     * @notice Get user's info
     */
    function getUsersInfo(address user)
        external
        view
        returns (
            uint256 ticketsPurchasedTotalBps,
            uint256 winningsClaimable,
            bool isActive
        );

    /**
     * @notice Get ticket count for this round
     */
    function getTicketCountForRound(address user)
        external
        view
        returns (uint256);

    /**
     * @notice Get last jackpot results
     */
    function getLastJackpotResults()
        external
        view
        returns (
            uint256 time,
            address winner,
            uint256 winningTicket,
            uint256 winAmount,
            uint256 totalTickets
        );
}
```

---

## 6. Frontend Architecture

### 6.1 Technology Stack

```
Frontend Stack:
├─ Framework: Next.js 14 (App Router)
├─ Language: TypeScript 5
├─ Styling: Tailwind CSS 3 + shadcn/ui
├─ Web3: Wagmi 2 + Viem 2
├─ State: Zustand 4
├─ API: tRPC (optional, for backend communication)
├─ Forms: React Hook Form + Zod
├─ Charts: Recharts
└─ Animations: Framer Motion
```

### 6.2 Project Structure

```
apps/web/
├─ app/
│  ├─ layout.tsx              # Root layout with providers
│  ├─ page.tsx                # Landing page
│  ├─ (game)/                 # Game routes (grouped)
│  │  ├─ city/
│  │  │  └─ page.tsx          # City map view
│  │  ├─ dashboard/
│  │  │  └─ page.tsx          # Portfolio dashboard
│  │  └─ settings/
│  │     └─ page.tsx          # User settings
│  └─ api/                    # API routes (if needed)
│
├─ components/
│  ├─ ui/                     # shadcn/ui components
│  ├─ city/
│  │  ├─ CityMap.tsx          # Isometric city map
│  │  ├─ BuildingTile.tsx     # Individual building
│  │  └─ BuildingModal.tsx    # Building info/actions
│  ├─ dashboard/
│  │  ├─ PortfolioCard.tsx    # Portfolio summary
│  │  ├─ BuildingsList.tsx    # List of buildings
│  │  └─ PerformanceChart.tsx # Performance graph
│  └─ Web3Provider.tsx        # Wagmi config
│
├─ hooks/
│  ├─ useDefiCity.ts          # Core contract interactions
│  ├─ useBuildings.ts         # Building operations
│  ├─ useBalance.ts           # Balance queries
│  └─ useSmartWallet.ts       # AA wallet interactions
│
├─ lib/
│  ├─ contracts/              # Contract ABIs and addresses
│  ├─ wagmi.ts                # Wagmi configuration
│  └─ utils.ts                # Utility functions
│
└─ types/
   └─ contracts.ts            # Contract type definitions
```

### 6.3 Key Components

#### CityMap Component
```typescript
// components/city/CityMap.tsx
'use client';

import { useState, useEffect } from 'react';
import { useBuildings } from '@/hooks/useBuildings';
import BuildingTile from './BuildingTile';
import BuildingModal from './BuildingModal';

export default function CityMap() {
  const { buildings, isLoading } = useBuildings();
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);

  // 10x10 grid
  const GRID_SIZE = 10;

  // Map building IDs to grid positions
  const buildingPositions = buildings.reduce((acc, building, index) => {
    const x = index % GRID_SIZE;
    const y = Math.floor(index / GRID_SIZE);
    acc[`${x},${y}`] = building;
    return acc;
  }, {} as Record<string, Building>);

  const handleTileClick = (x: number, y: number) => {
    const building = buildingPositions[`${x},${y}`];
    if (building) {
      setSelectedBuilding(building.id);
    } else {
      setSelectedTile({ x, y });
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-sky-400 to-sky-200">
      {/* Isometric grid */}
      <div className="grid gap-1 p-8">
        {Array.from({ length: GRID_SIZE }).map((_, y) => (
          <div key={y} className="flex gap-1">
            {Array.from({ length: GRID_SIZE }).map((_, x) => {
              const building = buildingPositions[`${x},${y}`];
              return (
                <BuildingTile
                  key={`${x},${y}`}
                  x={x}
                  y={y}
                  building={building}
                  onClick={() => handleTileClick(x, y)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Building info modal */}
      {selectedBuilding && (
        <BuildingModal
          buildingId={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
        />
      )}

      {/* Place building modal */}
      {selectedTile && (
        <PlaceBuildingModal
          position={selectedTile}
          onClose={() => setSelectedTile(null)}
        />
      )}
    </div>
  );
}
```

#### useBuildings Hook
```typescript
// hooks/useBuildings.ts
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { DEFICITY_CORE_ADDRESS, DEFICITY_CORE_ABI } from '@/lib/contracts';

export function useBuildings() {
  const { address } = useAccount();

  // Get user's building IDs
  const { data: buildingIds } = useReadContract({
    address: DEFICITY_CORE_ADDRESS,
    abi: DEFICITY_CORE_ABI,
    functionName: 'getUserBuildings',
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: 10_000, // Refresh every 10s
    },
  });

  // Get building details for each ID
  const { data: buildings, isLoading } = useReadContracts({
    contracts: buildingIds?.map((id) => ({
      address: DEFICITY_CORE_ADDRESS,
      abi: DEFICITY_CORE_ABI,
      functionName: 'getBuilding',
      args: [id],
    })) || [],
    query: {
      enabled: !!buildingIds && buildingIds.length > 0,
    },
  });

  return {
    buildings: buildings?.map(b => b.result) || [],
    isLoading,
  };
}

export function usePlaceBuilding() {
  const { writeContractAsync } = useWriteContract();

  const placeBuilding = async (
    buildingType: number,
    asset: `0x${string}`,
    amount: bigint,
    strategyData: `0x${string}`
  ) => {
    // Create UserOperation with session key (gasless)
    const hash = await writeContractAsync({
      address: DEFICITY_CORE_ADDRESS,
      abi: DEFICITY_CORE_ABI,
      functionName: 'placeBuilding',
      args: [buildingType, asset, amount, strategyData],
    });

    return hash;
  };

  return { placeBuilding };
}

export function useHarvest() {
  const { writeContractAsync } = useWriteContract();

  const harvest = async (buildingId: bigint) => {
    const hash = await writeContractAsync({
      address: DEFICITY_CORE_ADDRESS,
      abi: DEFICITY_CORE_ABI,
      functionName: 'harvest',
      args: [buildingId],
    });

    return hash;
  };

  return { harvest };
}
```

---

## 7. Data Models

### 7.1 On-Chain Data Models

**Defined in smart contracts (see Section 3)**

### 7.2 Frontend Data Models

```typescript
// types/contracts.ts

export enum BuildingType {
  NONE = 0,
  TOWN_HALL = 1,
  BANK = 2,
  SHOP = 3,
  LOTTERY = 4,
}

export interface Building {
  id: bigint;
  owner: `0x${string}`;
  buildingType: BuildingType;
  asset: `0x${string}`;
  depositedAmount: bigint;
  shares: bigint;
  strategy: `0x${string}`;
  createdAt: number;
  isActive: boolean;
  metadata: `0x${string}`;
}

export interface City {
  owner: `0x${string}`;
  createdAt: bigint;
  totalDeposited: bigint;
  totalEarned: bigint;
  buildingCount: number;
  hasTownHall: boolean;
}

export interface Asset {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  balance: bigint;
  priceUSD: number;
}

export interface BuildingInfo {
  building: Building;
  currentValue: bigint;
  pendingRewards: bigint;
  apy: number;
  strategyData: StrategyData;
}

export type StrategyData =
  | AaveStrategyData
  | AerodromeStrategyData
  | LotteryStrategyData;

export interface AaveStrategyData {
  type: 'aave';
  supplyAPY: number;
  borrowAPY?: number;
  healthFactor?: number;
  borrowed?: Array<{
    asset: `0x${string}`;
    amount: bigint;
  }>;
}

export interface AerodromeStrategyData {
  type: 'aerodrome';
  pair: [string, string];
  apy: number;
  fees24h: bigint;
  impermanentLoss: number;
}

export interface LotteryStrategyData {
  type: 'megapot';
  jackpot: bigint; // Current Megapot jackpot
  ticketPrice: bigint; // Current ticket price
  timeRemaining: number; // Seconds until next draw
  userTicketCount: number; // User's ticket count this round
  userTotalSpent: bigint; // Total USDC spent on tickets
  userWinningsClaimable: bigint; // Claimable winnings
  lastWinner?: {
    address: string;
    amount: bigint;
    timestamp: number;
  };
}
```

---

## 8. API Specifications

### 8.1 Smart Contract Functions

**See Section 3 for complete function signatures**

### 8.2 Frontend API (tRPC - Optional)

```typescript
// server/api/root.ts
export const appRouter = router({
  user: router({
    getPortfolio: publicProcedure
      .input(z.object({ address: z.string() }))
      .query(async ({ input }) => {
        // Aggregate data from blockchain
        const city = await getCity(input.address);
        const buildings = await getBuildings(input.address);
        const balances = await getBalances(input.address);

        return {
          city,
          buildings,
          balances,
          totalValueUSD: calculateTotalValue(buildings, balances),
        };
      }),

    getPriceFeeds: publicProcedure.query(async () => {
      // Fetch current prices from Chainlink or Coingecko
      return {
        USDC: 1.00,
        USDT: 1.00,
        ETH: 3000.00,
        WBTC: 60000.00,
      };
    }),
  }),

  analytics: router({
    getPerformance: publicProcedure
      .input(z.object({
        address: z.string(),
        timeframe: z.enum(['24h', '7d', '30d', 'all']),
      }))
      .query(async ({ input }) => {
        // Calculate performance metrics
        return {
          pnl: 0,
          pnlPercent: 0,
          chartData: [],
        };
      }),
  }),
});
```

---

## 9. Security Design

### 9.1 Access Control

```
Protocol Owner (Multi-Sig 3/5):
├─ Update modules
├─ Add supported assets
├─ Pause/unpause protocol
├─ Update fee configuration (max 5%)
└─ Emergency functions

Modules:
├─ BuildingManager: Can call Core.createBuilding()
├─ EmergencyManager: Can call emergency functions
└─ No other modules can modify state

Users:
├─ Own their buildings
├─ Can only modify their own data
└─ Cannot modify protocol configuration
```

### 9.2 Security Mechanisms

**SEC-001: Reentrancy Protection**
- All external functions use ReentrancyGuard
- Check-effects-interactions pattern
- No external calls before state updates

**SEC-002: Access Control**
- Owner-only functions for admin
- Module-only functions for internal calls
- User ownership checks on all user functions

**SEC-003: Input Validation**
- Minimum/maximum checks
- Asset whitelist
- Building type validation
- Slippage protection

**SEC-004: Emergency Pause**
- Owner can pause protocol
- All gameplay functions disabled when paused
- Emergency withdraw enabled when paused

**SEC-005: Immutable Core**
- Core contract cannot be upgraded
- User state永久 preserved
- Only modules can be swapped

### 9.3 Audit Checklist

**Pre-Audit:**
- [ ] All functions documented
- [ ] Unit tests: 90%+ coverage
- [ ] Integration tests: All critical flows
- [ ] Fuzz tests: All mathematical functions
- [ ] Gas optimization completed
- [ ] Slither static analysis: No critical issues
- [ ] Mythril static analysis: No high risks

**Audit Focus Areas:**
- [ ] Access control (owner, modules, users)
- [ ] Reentrancy vulnerabilities
- [ ] Integer overflow/underflow
- [ ] Oracle manipulation
- [ ] Flash loan attacks
- [ ] Griefing attacks
- [ ] DOS vectors
- [ ] Front-running risks
- [ ] Integration risks (Aave, Aerodrome)

---

## 10. Gas Optimization

### 10.1 Optimization Techniques

**OPTI-001: Storage Optimization**
- Pack struct variables efficiently
- Use uint32 for timestamps (sufficient until 2106)
- Use uint16 for counts (max 65k)
- Use mapping over array when possible

**OPTI-002: Computation Optimization**
- Cache storage reads in memory
- Avoid repeated external calls
- Use unchecked for safe arithmetic
- Minimize SLOAD operations

**OPTI-003: Gas Profiling**
```
Operation              | Gas Cost | Target
-----------------------|----------|--------
Create Smart Wallet    | ~250k    | < 300k
Deposit USDC           | ~60k     | < 80k
Place Building         | ~220k    | < 250k
Harvest Yield          | ~110k    | < 150k
Demolish Building      | ~190k    | < 220k
Session Key Creation   | ~50k     | < 70k
```

### 10.2 Gas Savings (Modular vs Proxy)

```
Traditional UUPS Proxy:
Place Building: ~280k gas
├─ Proxy delegatecall: +30k
├─ Storage access (delegatecall): +20k
├─ Implementation logic: 230k
└─ Total: 280k

DefiCity Modular:
Place Building: ~220k gas
├─ Core external call: +10k
├─ Module logic: 210k
└─ Total: 220k

Savings: ~60k gas (21% reduction)
```

---

## 11. Testing Strategy

### 11.1 Test Pyramid

```
           /\
          /E2E\          10% - End-to-end (full flows)
         /------\
        /  INT   \       30% - Integration (contract interactions)
       /----------\
      /    UNIT    \     60% - Unit tests (individual functions)
     /--------------\
```

### 11.2 Test Categories

**Unit Tests (Foundry)**
```solidity
// test/DefiCityCore.t.sol
contract DefiCityCoreTest is Test {
    DefiCityCore public core;

    function setUp() public {
        core = new DefiCityCore(...);
    }

    function testDeposit() public {
        // Test deposit function
        vm.prank(user);
        core.deposit(USDC, 1000e6);

        assertEq(core.getUserBalance(user, USDC), 1000e6);
    }

    function testPlaceBuildingRevertsIfInsufficientBalance() public {
        vm.prank(user);
        vm.expectRevert("Insufficient balance");
        core.placeBuilding(BuildingType.BANK, USDC, 100e6, "");
    }

    function testFuzz_DepositAmount(uint256 amount) public {
        vm.assume(amount > 0 && amount < type(uint128).max);

        deal(USDC, user, amount);
        vm.prank(user);
        core.deposit(USDC, amount);

        assertEq(core.getUserBalance(user, USDC), amount);
    }
}
```

**Integration Tests**
```solidity
// test/integration/AaveIntegration.t.sol
contract AaveIntegrationTest is Test {
    function testFullFlowWithAave() public {
        // 1. Deposit USDC
        user.deposit(USDC, 1000e6);

        // 2. Place Bank building
        uint256 buildingId = user.placeBuilding(
            BuildingType.BANK,
            USDC,
            500e6,
            ""
        );

        // 3. Fast forward time (simulate yield accrual)
        vm.warp(block.timestamp + 30 days);

        // 4. Harvest yield
        uint256 yieldBefore = user.getBalance(USDC);
        user.harvest(buildingId);
        uint256 yieldAfter = user.getBalance(USDC);

        // 5. Verify yield earned (~4% APY = ~1.67 USDC for 30 days)
        uint256 expectedYield = (500e6 * 4 * 30) / (365 * 100);
        assertApproxEqRel(
            yieldAfter - yieldBefore,
            expectedYield,
            0.01e18 // 1% tolerance
        );
    }
}
```

**E2E Tests (Playwright)**
```typescript
// tests/e2e/gameplay.spec.ts
test('complete user journey', async ({ page }) => {
  // 1. Connect wallet
  await page.click('[data-testid="connect-wallet"]');
  await page.click('[data-testid="metamask"]');

  // 2. Deposit funds
  await page.click('[data-testid="deposit"]');
  await page.fill('[data-testid="amount"]', '500');
  await page.click('[data-testid="confirm-deposit"]');
  await page.waitForSelector('[data-testid="deposit-success"]');

  // 3. Place building
  await page.click('[data-testid="tile-0-0"]');
  await page.click('[data-testid="bank-building"]');
  await page.fill('[data-testid="investment-amount"]', '200');
  await page.click('[data-testid="confirm-placement"]');
  await page.waitForSelector('[data-testid="building-placed"]');

  // 4. Verify building appears
  const building = await page.locator('[data-testid="building-1"]');
  await expect(building).toBeVisible();

  // 5. Check dashboard
  await page.click('[data-testid="dashboard"]');
  await expect(page.locator('[data-testid="total-invested"]')).toContainText('$200');
});
```

### 11.3 Test Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Smart Contracts | 95%+ |
| Frontend Components | 80%+ |
| Hooks | 90%+ |
| Utils | 95%+ |

---

## 12. Deployment Plan

### 12.1 Deployment Phases

**Phase 1: Testnet (Base Sepolia)**
```
Week 1-2: Internal Testing
├─ Deploy all contracts
├─ Configure modules
├─ Deploy frontend to preview
├─ Internal team testing
└─ Fix critical bugs

Week 3-4: Alpha Testing
├─ Invite 50-100 alpha testers
├─ Gather feedback
├─ Fix bugs
└─ Performance tuning

Week 5-6: Public Testnet
├─ Open to public
├─ Bug bounty launch
├─ Stress testing
└─ Final fixes
```

**Phase 2: Audit**
```
Week 7-10: Security Audit
├─ Contract freeze
├─ 2 audit firms
├─ Fix findings
└─ Re-audit if needed
```

**Phase 3: Mainnet (Base)**
```
Week 11: Soft Launch
├─ Deploy to mainnet
├─ Limit: $1M TVL cap
├─ Monitor closely
└─ 24/7 on-call

Week 12: Public Launch
├─ Remove TVL cap
├─ Marketing campaign
├─ Monitor metrics
└─ Continuous improvement
```

### 12.2 Deployment Scripts

```typescript
// scripts/deploy.ts
import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  // 1. Deploy Core
  const Core = await ethers.getContractFactory('DefiCityCore');
  const core = await Core.deploy(
    TREASURY_ADDRESS,
    ethers.constants.AddressZero, // Modules deployed later
    ethers.constants.AddressZero,
    ethers.constants.AddressZero,
    ethers.constants.AddressZero
  );
  await core.deployed();
  console.log('Core deployed to:', core.address);

  // 2. Deploy Modules
  const BuildingManager = await ethers.getContractFactory('BuildingManager');
  const buildingManager = await BuildingManager.deploy(
    core.address,
    ethers.constants.AddressZero, // StrategyRegistry
    ethers.constants.AddressZero  // FeeManager
  );
  await buildingManager.deployed();
  console.log('BuildingManager deployed to:', buildingManager.address);

  // 3. Deploy Strategies
  const AaveStrategy = await ethers.getContractFactory('AaveStrategy');
  const aaveStrategy = await AaveStrategy.deploy(
    AAVE_POOL_ADDRESS,
    AAVE_DATA_PROVIDER_ADDRESS,
    USDC_ADDRESS
  );
  await aaveStrategy.deployed();
  console.log('AaveStrategy deployed to:', aaveStrategy.address);

  // 4. Configure Core
  await core.updateModule('buildingManager', buildingManager.address);
  await core.addSupportedAsset(USDC_ADDRESS);
  await core.addSupportedAsset(USDT_ADDRESS);
  await core.addSupportedAsset(ETH_ADDRESS);
  await core.addSupportedAsset(WBTC_ADDRESS);

  // 5. Verify contracts
  console.log('Verifying contracts on Basescan...');
  await run('verify:verify', {
    address: core.address,
    constructorArguments: [TREASURY_ADDRESS, ...],
  });

  console.log('Deployment complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## 13. Monitoring & Observability

### 13.1 Metrics Dashboard

**System Metrics:**
- Total Value Locked (TVL)
- Number of users
- Number of buildings
- Transaction volume
- Gas costs

**Performance Metrics:**
- Transaction success rate
- Average transaction time
- Paymaster spending
- Frontend latency

**Business Metrics:**
- User acquisition rate
- User retention rate
- Average deposit per user
- Revenue (fees collected)

### 13.2 Monitoring Tools

**Blockchain Monitoring:**
- Tenderly: Transaction monitoring and alerting
- Dune Analytics: On-chain analytics dashboard
- Etherscan: Contract verification and explorer

**Application Monitoring:**
- Vercel Analytics: Frontend performance
- Sentry: Error tracking and logging
- PostHog: User analytics and funnels

**Alerting:**
- PagerDuty: On-call rotation
- Telegram Bot: Critical alerts
- Email: Daily reports

### 13.3 Alert Conditions

**Critical Alerts (Immediate Response):**
- Contract paused
- Paymaster balance < $5,000
- Transaction success rate < 95%
- Security event detected

**Warning Alerts (Monitor):**
- Paymaster balance < $10,000
- Transaction success rate < 99%
- High gas costs (> $0.05)
- Slow transaction times (> 30s)

---

**END OF TECHNICAL DESIGN DOCUMENT**

**Version:** 2.0
**Last Updated:** 2026-01-14
**Next Review:** Before mainnet deployment
