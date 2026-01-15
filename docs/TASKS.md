# DefiCity - Implementation Task List

**Project:** DefiCity Implementation
**Based on:** REQUIREMENT.md v1.0
**Team:** 2 Full Stack Developers, 2 QA Engineers, 1 UX/UI Designer
**Timeline:** 16 weeks (4 phases)
**Start Date:** 2026-01-14

---

## Table of Contents

1. [Phase 1: Foundation (Weeks 1-4)](#phase-1-foundation-weeks-1-4)
2. [Phase 2: DeFi Strategies (Weeks 5-8)](#phase-2-defi-strategies-weeks-5-8)
3. [Phase 3: Advanced Features (Weeks 9-12)](#phase-3-advanced-features-weeks-9-12)
4. [Phase 4: Testing & Launch (Weeks 13-16)](#phase-4-testing--launch-weeks-13-16)
5. [Priority Legend](#priority-legend)
6. [Dependencies](#dependencies)

---

## Phase 1: Foundation (Weeks 1-4)

**Goal:** Setup core architecture, basic contracts, and frontend foundation

### Smart Contract Tasks

#### SC-001: Setup Foundry Project & Base Configuration
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 2 days
- **Dependencies:** None
- **Description:**
  - Initialize Foundry project
  - Configure foundry.toml for Base chain
  - Setup remappings for OpenZeppelin, Chainlink
  - Configure test environment
  - Setup deployment scripts
  - Add Base Sepolia RPC and contract addresses
- **Acceptance Criteria:**
  - [ ] Foundry project compiles successfully
  - [ ] Can deploy to Base Sepolia testnet
  - [ ] Test framework works (forge test)
  - [ ] Deployment scripts functional
  - [ ] All external dependencies imported correctly

#### SC-002: Implement Core Contracts (Immutable State)
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 5 days
- **Dependencies:** SC-001
- **Description:**
  - Implement DefiCityCore.sol (state storage)
    - UserCity struct with multi-asset balances
    - Building struct (buildingType, depositedAmount, shares, createdAt, isActive, assetType)
    - BuildingTypeConfig struct
    - Events (BuildingPlaced, Deposit, Harvest, Demolish)
    - Pausable functionality
    - ReentrancyGuard
  - Implement module coordination functions
  - Add multi-asset support (USDC, USDT, ETH, WBTC)
  - No business logic (delegate to managers)
- **Acceptance Criteria:**
  - [ ] DefiCityCore compiles without errors
  - [ ] State structs support multi-asset tracking
  - [ ] Can store user cities and buildings
  - [ ] Module coordination works (delegates to managers)
  - [ ] Pause/unpause functionality works
  - [ ] Events emit correctly
  - [ ] Unit tests pass (80%+ coverage)

#### SC-003: Implement StrategyRegistry
- **Status:** 🔵 TODO
- **Assignee:** FS2
- **Priority:** P0 (Critical)
- **Estimated:** 3 days
- **Dependencies:** SC-001
- **Description:**
  - Implement StrategyRegistry.sol
    - Map buildingType → strategy address
    - Strategy version history tracking
    - registerStrategy() function
    - setStrategy() function
    - getStrategy() view function
    - deprecateStrategy() function
  - Support for 4 building types (0=TownHall, 1=Bank, 2=Shop, 3=Lottery)
- **Acceptance Criteria:**
  - [ ] StrategyRegistry compiles without errors
  - [ ] Can register strategies
  - [ ] Can activate strategies for building types
  - [ ] Version history tracks changes
  - [ ] Can deprecate old strategies
  - [ ] Unit tests pass (80%+ coverage)

#### SC-004: Implement BuildingManager
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 5 days
- **Dependencies:** SC-002, SC-003
- **Description:**
  - Implement BuildingManager.sol
    - placeBuilding() - create building, call strategy, collect fee
    - deposit() - add funds to existing building
    - harvest() - claim rewards
    - demolish() - withdraw all and remove building
    - Support multi-asset operations
    - Validate building configs (no unlock requirements)
  - Coordinate between Core, Registry, FeeManager, Strategies
- **Acceptance Criteria:**
  - [ ] BuildingManager compiles without errors
  - [ ] placeBuilding() works for all building types
  - [ ] deposit() adds funds correctly
  - [ ] harvest() claims rewards correctly
  - [ ] demolish() withdraws and removes building
  - [ ] Multi-asset support works (USDC, USDT, ETH, WBTC)
  - [ ] No unlock requirements enforced
  - [ ] Unit tests pass (80%+ coverage)

#### SC-005: Implement FeeManager
- **Status:** 🔵 TODO
- **Assignee:** FS2
- **Priority:** P0 (Critical)
- **Estimated:** 2 days
- **Dependencies:** SC-001
- **Description:**
  - Implement FeeManager.sol
    - Building creation fee: 0.05% (5 BPS)
    - calculateBuildingFee() function
    - collectFee() function (transfer to treasury)
    - setBuildingFee() (owner only, max 5%)
    - setTreasury() (owner only)
    - Support multi-asset fee collection
  - Events (FeeCollected, FeeUpdated, TreasuryUpdated)
- **Acceptance Criteria:**
  - [ ] FeeManager compiles without errors
  - [ ] Calculates 0.05% fee correctly
  - [ ] Fees collected to treasury
  - [ ] Owner can update fee (max 5%)
  - [ ] Multi-asset fee support
  - [ ] Unit tests pass (80%+ coverage)

#### SC-006: Implement EmergencyManager
- **Status:** 🔵 TODO
- **Assignee:** FS2
- **Priority:** P1 (High)
- **Estimated:** 2 days
- **Dependencies:** SC-002, SC-003
- **Description:**
  - Implement EmergencyManager.sol
    - emergencyWithdraw() - force withdraw when paused
    - Only callable by Core
    - Only works when Core.paused() == true
    - Calls strategy.emergencyWithdraw()
    - Deactivates building
- **Acceptance Criteria:**
  - [ ] EmergencyManager compiles without errors
  - [ ] emergencyWithdraw() only works when paused
  - [ ] Only Core can call it
  - [ ] Successfully withdraws from strategies
  - [ ] Unit tests pass (80%+ coverage)

#### SC-007: Implement Dummy Strategies (Placeholders)
- **Status:** 🔵 TODO
- **Assignee:** FS1, FS2
- **Priority:** P1 (High)
- **Estimated:** 3 days
- **Dependencies:** SC-003
- **Description:**
  - Create IStrategy interface
  - Implement DummyStrategy.sol for testing
    - deposit() - mock deposit, return shares
    - withdraw() - mock withdraw, return amount
    - harvest() - mock harvest, return 0
    - balanceOf() - return mocked value
    - pendingRewards() - return 0
    - getAPY() - return 500 (5%)
  - No real DeFi integration yet
- **Acceptance Criteria:**
  - [ ] IStrategy interface complete
  - [ ] DummyStrategy compiles
  - [ ] All interface functions implemented
  - [ ] Returns reasonable mock values
  - [ ] Can be registered in StrategyRegistry
  - [ ] Unit tests pass

#### SC-008: Integration Tests - Core System
- **Status:** 🔵 TODO
- **Assignee:** FS1, FS2
- **Priority:** P0 (Critical)
- **Estimated:** 3 days
- **Dependencies:** SC-002, SC-003, SC-004, SC-005, SC-006, SC-007
- **Description:**
  - Write integration tests for core system
    - Deploy all contracts
    - Register dummy strategies
    - Test complete flow: place → deposit → harvest → demolish
    - Test multi-asset operations
    - Test fee collection
    - Test pause/emergency withdraw
    - Test module updates
- **Acceptance Criteria:**
  - [ ] End-to-end flow works for all 4 building types
  - [ ] Multi-asset support verified
  - [ ] Fee collection works correctly
  - [ ] Emergency mechanisms work
  - [ ] Module swapping works
  - [ ] Integration tests pass (100%)

#### SC-009: Deploy to Base Sepolia Testnet
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 2 days
- **Dependencies:** SC-008
- **Description:**
  - Deploy all core contracts to Base Sepolia
  - Verify contracts on BaseScan
  - Register dummy strategies
  - Configure building types (4 types)
  - Fund treasury and paymaster
  - Test on testnet
- **Acceptance Criteria:**
  - [ ] All contracts deployed and verified
  - [ ] Building types configured (TownHall, Bank, Shop, Lottery placeholders)
  - [ ] Dummy strategies work on testnet
  - [ ] Can place/harvest/demolish buildings
  - [ ] Testnet addresses documented

### Frontend Tasks

#### FE-001: Setup Next.js 14 Project
- **Status:** ✅ COMPLETED
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 2 days
- **Dependencies:** None
- **Description:**
  - Initialize Next.js 14 with TypeScript
  - Setup Tailwind CSS
  - Configure ESLint and Prettier
  - Setup folder structure (components, pages, hooks, utils)
  - Add shadcn/ui components
  - Configure environment variables
- **Acceptance Criteria:**
  - [x] Next.js project runs successfully
  - [x] Tailwind CSS works
  - [x] TypeScript configured
  - [x] shadcn/ui installed
  - [x] Basic routing works
  - [x] Dev server runs without errors

#### FE-002: Setup Web3 Integration (Wagmi + Viem)
- **Status:** ✅ COMPLETED
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 3 days
- **Dependencies:** FE-001, SC-009
- **Description:**
  - Install wagmi, viem, @rainbow-me/rainbowkit
  - Configure Web3 providers for Base Sepolia
  - Setup wallet connection (MetaMask, Coinbase Wallet, WalletConnect)
  - Create contract hooks (useDefiCityCore, useStrategyRegistry, etc.)
  - Setup contract ABIs
  - Create multi-asset token hooks (USDC, USDT, ETH, WBTC)
- **Acceptance Criteria:**
  - [x] Can connect wallet
  - [x] Can switch to Base Sepolia
  - [x] Contract hooks work
  - [x] Can read contract data
  - [x] Can send transactions
  - [x] Multi-asset token support

#### FE-003: Create Basic Layout & Navigation
- **Status:** ✅ COMPLETED
- **Assignee:** FS2
- **Priority:** P1 (High)
- **Estimated:** 2 days
- **Dependencies:** FE-001
- **Description:**
  - Create header with wallet connection button
  - Create navigation menu (Dashboard, Map, Buildings, Settings)
  - Create footer
  - Setup responsive layout
  - Add wallet address display
  - Add network indicator
- **Acceptance Criteria:**
  - [x] Header displays correctly
  - [x] Navigation works
  - [x] Wallet connection button functional
  - [x] Responsive on mobile/tablet/desktop
  - [x] Network indicator shows Base Sepolia

#### FE-004: Create Multi-Asset Wallet Dashboard
- **Status:** 🔵 TODO
- **Assignee:** FS2
- **Priority:** P0 (Critical)
- **Estimated:** 4 days
- **Dependencies:** FE-002
- **Description:**
  - Display multi-asset balances (USDC, USDT, ETH, WBTC)
  - Show total portfolio value in USD
  - Display available balance per asset
  - Display invested amount per asset
  - Display total earned (all-time)
  - Create deposit modal (select asset, enter amount)
  - Create withdraw modal (select asset, enter amount)
  - Show transaction history
- **Acceptance Criteria:**
  - [ ] Shows balances for all 4 assets
  - [ ] Total portfolio value calculated correctly
  - [ ] Deposit modal works for all assets
  - [ ] Withdraw modal works for all assets
  - [ ] Transaction history displays
  - [ ] Real-time balance updates

#### FE-005: Create City Map View (Basic Grid)
- **Status:** 🔵 TODO
- **Assignee:** FS2
- **Priority:** P1 (High)
- **Estimated:** 5 days
- **Dependencies:** FE-001
- **Description:**
  - Create isometric grid for city map
  - Render empty tiles
  - Handle tile click events
  - Display buildings on tiles
  - Basic building sprites (placeholder rectangles with labels)
  - Zoom and pan functionality
  - Responsive grid size
- **Acceptance Criteria:**
  - [ ] Grid displays correctly
  - [ ] Can click on tiles
  - [ ] Buildings display on tiles
  - [ ] Zoom/pan works
  - [ ] Responsive on different screen sizes
  - [ ] Performance: 60fps on desktop

#### FE-006: Create Building Placement Flow (All 4 Types)
- **Status:** 🔵 TODO
- **Assignee:** FS1, FS2
- **Priority:** P0 (Critical)
- **Estimated:** 5 days
- **Dependencies:** FE-004, FE-005, SC-009
- **Description:**
  - Click empty tile → Show building selection modal
  - Display all 4 building types:
    - Town Hall (Free, optional)
    - Bank (Supply/Borrow, $100 min)
    - Shop (LP, $500 min)
    - Lottery (Entertainment, $10 min)
  - No unlock requirements - all available from start
  - Show building details (name, strategy, min deposit, APY, risk)
  - Asset selection dropdown (USDC, USDT, ETH, WBTC)
  - Amount input with validation
  - Fee display (0.05%)
  - Confirm button → Send transaction
  - Loading state during transaction
  - Success/error notifications
- **Acceptance Criteria:**
  - [ ] Building selection shows all 4 types
  - [ ] No unlock requirements enforced
  - [ ] Asset selection works for all supported assets
  - [ ] Amount validation works
  - [ ] Fee calculated correctly
  - [ ] Transaction sent successfully
  - [ ] Building appears on map after confirmation
  - [ ] Works for all 4 building types

### UX/UI Tasks

#### UI-001: Design System & Component Library
- **Status:** 🔵 TODO
- **Assignee:** UI
- **Priority:** P0 (Critical)
- **Estimated:** 5 days
- **Dependencies:** None
- **Description:**
  - Define color palette (gamified, not generic purple)
  - Define typography (distinctive fonts, not Inter/Roboto)
  - Create button styles (primary, secondary, danger)
  - Create card components
  - Create modal components
  - Create form input components
  - Create notification/toast components
  - Design building sprites (4 types: Town Hall, Bank, Shop, Lottery)
  - Create asset icons (USDC, USDT, ETH, BTC)
  - Document in Figma
- **Acceptance Criteria:**
  - [ ] Design system documented in Figma
  - [ ] All component variants designed
  - [ ] Building sprites designed (4 types)
  - [ ] Asset icons designed
  - [ ] Color palette distinctive and cohesive
  - [ ] Typography selection unique
  - [ ] Responsive designs (mobile/tablet/desktop)

#### UI-002: Design City Map & Building Placement UX
- **Status:** 🔵 TODO
- **Assignee:** UI
- **Priority:** P0 (Critical)
- **Estimated:** 4 days
- **Dependencies:** UI-001
- **Description:**
  - Design isometric city map layout
  - Design building placement flow (all 4 types, no unlocks)
  - Design building selection modal
  - Design multi-asset selection interface
  - Design building info panel
  - Design harvest/demolish actions
  - Create animations (building placement, harvest effects)
  - Design empty state
- **Acceptance Criteria:**
  - [ ] Map layout visually appealing
  - [ ] Building placement UX intuitive
  - [ ] All 4 building types visually distinct
  - [ ] Asset selection clear
  - [ ] Building info panel comprehensive
  - [ ] Animations enhance UX
  - [ ] Designs responsive

#### UI-003: Design Multi-Asset Dashboard
- **Status:** 🔵 TODO
- **Assignee:** UI
- **Priority:** P1 (High)
- **Estimated:** 3 days
- **Dependencies:** UI-001
- **Description:**
  - Design portfolio overview (total value, per asset)
  - Design asset balance cards (USDC, USDT, ETH, WBTC)
  - Design deposit/withdraw modals (multi-asset)
  - Design transaction history
  - Design charts (optional for Phase 1)
- **Acceptance Criteria:**
  - [ ] Dashboard layout clear and informative
  - [ ] Multi-asset balances easy to understand
  - [ ] Deposit/withdraw flows intuitive
  - [ ] Transaction history readable
  - [ ] Visual hierarchy good

### QA Tasks

#### QA-001: Create Test Plan & Test Cases
- **Status:** 🔵 TODO
- **Assignee:** QA1
- **Priority:** P0 (Critical)
- **Estimated:** 3 days
- **Dependencies:** SC-009, FE-006
- **Description:**
  - Document test strategy
  - Create test cases for:
    - Smart contract interactions (all 4 building types)
    - Multi-asset operations (deposit, withdraw, place, harvest, demolish)
    - Fee calculations
    - Emergency scenarios
    - Frontend flows
  - Define test environments (local, testnet)
  - Setup test data
- **Acceptance Criteria:**
  - [ ] Test plan documented
  - [ ] Test cases cover all building types
  - [ ] Multi-asset scenarios included
  - [ ] Edge cases identified
  - [ ] Test environments defined

#### QA-002: Setup Automated Testing Framework
- **Status:** 🔵 TODO
- **Assignee:** QA2
- **Priority:** P1 (High)
- **Estimated:** 3 days
- **Dependencies:** FE-001
- **Description:**
  - Setup Playwright for E2E tests
  - Setup Jest for unit tests
  - Configure test runner in CI/CD
  - Create test helpers and fixtures
  - Setup test wallet with testnet funds
- **Acceptance Criteria:**
  - [ ] Playwright configured
  - [ ] Jest configured
  - [ ] CI/CD runs tests
  - [ ] Test helpers available
  - [ ] Can run tests locally and in CI

#### QA-003: Manual Testing - Core Flows (Phase 1)
- **Status:** 🔵 TODO
- **Assignee:** QA1, QA2
- **Priority:** P0 (Critical)
- **Estimated:** 3 days
- **Dependencies:** SC-009, FE-006
- **Description:**
  - Test wallet connection
  - Test multi-asset deposit (USDC, USDT, ETH, WBTC)
  - Test building placement (all 4 types, no unlock requirements)
  - Test multi-asset withdraw
  - Test fee collection
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Test on multiple devices (Desktop, Tablet, Mobile)
- **Acceptance Criteria:**
  - [ ] All flows work on Base Sepolia testnet
  - [ ] Multi-asset support verified
  - [ ] All 4 building types placeable
  - [ ] No unlock requirements enforced
  - [ ] Cross-browser compatible
  - [ ] Cross-device compatible
  - [ ] Bug reports filed for issues

---

## Phase 2: DeFi Strategies (Weeks 5-8)

**Goal:** Implement real DeFi integrations (Aave, Aerodrome) with multi-asset support

### Smart Contract Tasks

#### SC-010: Implement Aave Strategy (Bank - Supply & Borrow)
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 7 days
- **Dependencies:** SC-007
- **Description:**
  - Implement AaveStrategy.sol
    - Support multi-asset (USDC, USDT, ETH, WBTC)
    - **Supply Mode:**
      - deposit() - supply asset to Aave, receive aTokens
      - withdraw() - withdraw asset from Aave
      - harvest() - calculate and return yield
    - **Borrow Mode:**
      - borrow() - borrow asset against collateral
      - repay() - repay borrowed asset
      - getHealthFactor() - calculate health factor
      - isLiquidatable() - check liquidation risk
    - balanceOf() - return asset value (supply - borrow)
    - pendingRewards() - calculate unrealized yield
    - getAPY() - fetch current supply/borrow APY from Aave
    - emergencyWithdraw() - force withdraw
  - Integrate with Aave V3 on Base
  - Handle collateralization logic
  - Liquidation warnings
- **Acceptance Criteria:**
  - [ ] Supply mode works for all 4 assets
  - [ ] Borrow mode works for all 4 assets
  - [ ] Health factor calculated correctly
  - [ ] APY fetched correctly from Aave
  - [ ] Handles liquidation scenarios
  - [ ] Emergency withdraw works
  - [ ] Unit tests pass (90%+ coverage)
  - [ ] Integration tests with Aave V3 pass

#### SC-011: Implement Aerodrome Strategy (Shop - LP)
- **Status:** 🔵 TODO
- **Assignee:** FS2
- **Priority:** P0 (Critical)
- **Estimated:** 7 days
- **Dependencies:** SC-007
- **Description:**
  - Implement AerodromeStrategy.sol
    - Support multiple pairs:
      - USDC/ETH
      - USDT/USDC
      - ETH/WBTC
    - deposit() - add liquidity, receive LP tokens/NFT
    - withdraw() - remove liquidity
    - harvest() - claim AERO rewards and fees
    - Auto-swap if single asset deposited (50/50 split)
    - balanceOf() - return LP position value
    - pendingRewards() - calculate pending AERO + fees
    - getAPY() - calculate APY from fees + AERO rewards
    - calculateIL() - impermanent loss calculator
    - emergencyWithdraw() - force withdraw
  - Integrate with Aerodrome on Base
  - Handle V2 and V3 pools
- **Acceptance Criteria:**
  - [ ] Works for all supported pairs
  - [ ] Auto-swap works (single → dual asset)
  - [ ] LP position created correctly
  - [ ] AERO rewards claimable
  - [ ] APY calculated correctly
  - [ ] IL calculator works
  - [ ] Emergency withdraw works
  - [ ] Unit tests pass (90%+ coverage)
  - [ ] Integration tests with Aerodrome pass

#### SC-012: Implement Town Hall Strategy (Wallet Placeholder)
- **Status:** 🔵 TODO
- **Assignee:** FS2
- **Priority:** P1 (High)
- **Estimated:** 1 day
- **Dependencies:** SC-007
- **Description:**
  - Implement TownHallStrategy.sol
    - No DeFi integration
    - Just returns 0 for all functions
    - Represents wallet creation/visualization
    - Free to create (no deposit)
- **Acceptance Criteria:**
  - [ ] Strategy compiles
  - [ ] Returns 0 for all yield functions
  - [ ] Can be registered in registry
  - [ ] Free to place (no deposit required)

#### SC-013: Update Core & Manager for Real Strategies
- **Status:** 🔵 TODO
- **Assignee:** FS1, FS2
- **Priority:** P0 (Critical)
- **Estimated:** 3 days
- **Dependencies:** SC-010, SC-011, SC-012
- **Description:**
  - Update BuildingManager to handle:
    - Multi-asset deposits
    - Asset-specific strategy calls
    - Borrow mode for Bank
    - Pair selection for Shop
  - Update DefiCityCore to track:
    - Asset type per building
    - Borrow amounts (for Bank)
    - Pair type (for Shop)
  - Test integration with real strategies
- **Acceptance Criteria:**
  - [ ] BuildingManager works with real strategies
  - [ ] Core tracks asset-specific data
  - [ ] Borrow mode functional for Bank
  - [ ] Pair selection functional for Shop
  - [ ] Integration tests pass

#### SC-014: Integration Tests - DeFi Strategies
- **Status:** 🔵 TODO
- **Assignee:** FS1, FS2
- **Priority:** P0 (Critical)
- **Estimated:** 4 days
- **Dependencies:** SC-013
- **Description:**
  - Test complete flows with real strategies:
    - **Town Hall:** Place for free
    - **Bank Supply:** Deposit USDC → Aave → Harvest → Withdraw
    - **Bank Borrow:** Supply ETH → Borrow USDC → Repay → Withdraw
    - **Shop:** Deposit USDC → LP USDC/ETH → Harvest AERO → Withdraw
  - Test multi-asset scenarios
  - Test edge cases (liquidation, IL, etc.)
  - Test on Base Sepolia fork
- **Acceptance Criteria:**
  - [ ] All building types work end-to-end
  - [ ] Multi-asset flows verified
  - [ ] Borrow mode works without liquidation
  - [ ] LP positions earn fees
  - [ ] Edge cases handled
  - [ ] Integration tests pass (100%)

#### SC-015: Deploy Real Strategies to Base Sepolia
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 2 days
- **Dependencies:** SC-014
- **Description:**
  - Deploy AaveStrategy, AerodromeStrategy, TownHallStrategy
  - Register in StrategyRegistry
  - Activate for building types:
    - Type 0: TownHallStrategy
    - Type 1: AaveStrategy
    - Type 2: AerodromeStrategy
    - Type 3: LotteryStrategy (placeholder for now)
  - Verify contracts on BaseScan
  - Test on testnet
- **Acceptance Criteria:**
  - [ ] All strategies deployed and verified
  - [ ] Registered in StrategyRegistry
  - [ ] Activated for building types
  - [ ] Work on testnet
  - [ ] Testnet addresses documented

### Frontend Tasks

#### FE-007: Update Building Placement for Real Strategies
- **Status:** 🔵 TODO
- **Assignee:** FS1, FS2
- **Priority:** P0 (Critical)
- **Estimated:** 5 days
- **Dependencies:** FE-006, SC-015
- **Description:**
  - **Town Hall:**
    - Show as free option
    - No deposit required
    - Creates wallet visualization
  - **Bank (Aave):**
    - Asset selection (USDC, USDT, ETH, WBTC)
    - Mode selection: Supply only OR Supply + Borrow
    - If borrowing:
      - Show collateral asset
      - Show borrow asset
      - Show max borrow amount
      - Show health factor
      - Show liquidation warning
    - Display supply APY and borrow APY
  - **Shop (Aerodrome):**
    - Pair selection (USDC/ETH, USDT/USDC, ETH/WBTC)
    - Asset deposit (single or dual)
    - Auto-swap option
    - Display trading fee APY + AERO rewards APY
    - IL calculator before placement
  - **Lottery (Placeholder):**
    - Show "Coming Soon" message
- **Acceptance Criteria:**
  - [ ] Town Hall placement works (free)
  - [ ] Bank supply mode works
  - [ ] Bank borrow mode works with health factor
  - [ ] Shop LP works for all pairs
  - [ ] IL calculator functional
  - [ ] Lottery shows placeholder
  - [ ] All transactions succeed on testnet

#### FE-008: Create Building Info Panel (Enhanced)
- **Status:** 🔵 TODO
- **Assignee:** FS2
- **Priority:** P1 (High)
- **Estimated:** 4 days
- **Dependencies:** FE-007
- **Description:**
  - Click building → Show detailed info panel
  - **Town Hall:**
    - Wallet address
    - Total portfolio value
    - No actions
  - **Bank:**
    - Asset type (USDC, USDT, ETH, WBTC)
    - Mode (Supply only or Supply + Borrow)
    - Supplied amount
    - Borrowed amount (if any)
    - Health factor (if borrowing)
    - Supply APY
    - Borrow APY (if borrowing)
    - Net yield
    - Pending rewards
    - Actions: Deposit More, Harvest, Repay (if borrowing), Demolish
  - **Shop:**
    - Pair type (USDC/ETH, etc.)
    - LP position value
    - Asset breakdown (how much of each asset)
    - Trading fees earned
    - AERO rewards earned
    - Current IL percentage
    - APY breakdown
    - Pending rewards
    - Actions: Deposit More, Harvest, Demolish
  - **Lottery:**
    - Show "Coming Soon"
- **Acceptance Criteria:**
  - [ ] Info panel shows all relevant data
  - [ ] Data updates in real-time
  - [ ] Actions work correctly
  - [ ] Health factor displays for Bank (if borrowing)
  - [ ] IL percentage displays for Shop
  - [ ] Design matches Figma

#### FE-009: Create Harvest Flow
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 3 days
- **Dependencies:** FE-008, SC-015
- **Description:**
  - Click "Harvest" button in building info panel
  - Show harvest confirmation modal:
    - Pending rewards amount
    - Asset type
    - Estimated gas (should be $0 - gasless)
  - Send harvest transaction
  - Show loading state
  - Update balance after success
  - Show success notification with amount
- **Acceptance Criteria:**
  - [ ] Harvest button clickable when rewards > 0
  - [ ] Confirmation modal shows correct amount
  - [ ] Transaction gasless (paymaster sponsors)
  - [ ] Balance updates after harvest
  - [ ] Works for Bank and Shop
  - [ ] Success notification displays

#### FE-010: Create Demolish Flow
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 3 days
- **Dependencies:** FE-008, SC-015
- **Description:**
  - Click "Demolish" button in building info panel
  - Show demolish confirmation modal:
    - Total value (principal + unrealized yield)
    - Asset type
    - Warnings:
      - For Bank borrowing: Must repay first
      - For Shop: Current IL percentage shown
    - Estimated gas (should be $0 - gasless)
  - Send demolish transaction
  - Building removed from map
  - Balance updated
  - Show success notification
- **Acceptance Criteria:**
  - [ ] Demolish confirmation shows total value
  - [ ] Cannot demolish Bank with outstanding borrow
  - [ ] IL warning shown for Shop
  - [ ] Transaction gasless
  - [ ] Building removed from map
  - [ ] Balance updated correctly
  - [ ] Town Hall cannot be demolished

### UX/UI Tasks

#### UI-004: Design Building Types with Real Data
- **Status:** 🔵 TODO
- **Assignee:** UI
- **Priority:** P0 (Critical)
- **Estimated:** 4 days
- **Dependencies:** UI-001, UI-002
- **Description:**
  - Refine building sprites with more detail:
    - Town Hall: Castle/headquarters style
    - Bank: Modern building with Aave branding
    - Shop: Market/store with Aerodrome branding
    - Lottery: Government building (for Phase 3)
  - Design building info panel layouts (enhanced)
  - Design Bank-specific UI:
    - Supply/Borrow mode toggle
    - Health factor indicator (color-coded)
    - Liquidation warning styles
  - Design Shop-specific UI:
    - Pair selection
    - IL calculator
    - Asset breakdown chart
  - Design harvest/demolish confirmation modals
- **Acceptance Criteria:**
  - [ ] Building sprites detailed and distinct
  - [ ] Info panel layouts comprehensive
  - [ ] Bank UI shows health factor clearly
  - [ ] Shop UI shows IL prominently
  - [ ] Modals designed
  - [ ] All assets identifiable (icons)

#### UI-005: Design Multi-Asset Portfolio Analytics
- **Status:** 🔵 TODO
- **Assignee:** UI
- **Priority:** P2 (Nice to have)
- **Estimated:** 3 days
- **Dependencies:** UI-003
- **Description:**
  - Design asset breakdown chart (pie/bar)
  - Design performance over time chart
  - Design yield earned per building chart
  - Design building type distribution
  - Design responsive layouts
- **Acceptance Criteria:**
  - [ ] Charts visually appealing
  - [ ] Data visualization clear
  - [ ] Responsive layouts
  - [ ] Optional for Phase 2 (can defer to Phase 3)

### QA Tasks

#### QA-004: Test DeFi Strategy Integrations
- **Status:** 🔵 TODO
- **Assignee:** QA1, QA2
- **Priority:** P0 (Critical)
- **Estimated:** 5 days
- **Dependencies:** FE-010, SC-015
- **Description:**
  - **Test Town Hall:**
    - Can place for free
    - Shows wallet address
    - Cannot demolish
  - **Test Bank (Supply mode):**
    - Deposit USDC → Supply to Aave → Check aUSDC balance
    - Wait for yield → Harvest → Check USDC received
    - Demolish → Check full withdrawal
    - Repeat for USDT, ETH, WBTC
  - **Test Bank (Borrow mode):**
    - Supply ETH as collateral
    - Borrow USDC (below safe threshold)
    - Check health factor
    - Repay USDC
    - Withdraw ETH collateral
  - **Test Shop:**
    - Deposit USDC → LP USDC/ETH → Check LP position
    - Wait for fees → Harvest → Check AERO + fees
    - Check IL percentage
    - Demolish → Check assets returned
    - Repeat for other pairs
  - Test edge cases:
    - Try to borrow above limit → Should fail
    - Monitor health factor during price changes
    - Check IL calculation accuracy
  - Test on Base Sepolia testnet
- **Acceptance Criteria:**
  - [ ] All Town Hall functions work
  - [ ] Bank supply mode works for all assets
  - [ ] Bank borrow mode works safely
  - [ ] Health factor accurate
  - [ ] Shop LP works for all pairs
  - [ ] IL calculator accurate
  - [ ] Harvest and demolish work correctly
  - [ ] Edge cases handled
  - [ ] All bugs filed and resolved

#### QA-005: Performance & Load Testing
- **Status:** 🔵 TODO
- **Assignee:** QA2
- **Priority:** P1 (High)
- **Estimated:** 2 days
- **Dependencies:** FE-010
- **Description:**
  - Test app performance:
    - Page load time (<3s)
    - Map rendering (60fps)
    - Transaction response time
  - Test with many buildings (10+ on map)
  - Test on slow networks
  - Test memory usage
  - Profile and optimize bottlenecks
- **Acceptance Criteria:**
  - [ ] Page loads < 3 seconds
  - [ ] Map maintains 60fps
  - [ ] No memory leaks
  - [ ] Works on slow connections
  - [ ] Performance report documented

---

## Phase 3: Advanced Features (Weeks 9-12)

**Goal:** Implement Account Abstraction, Lottery, and gasless gameplay

### Smart Contract Tasks

#### SC-016: Implement Megapot Integration Strategy (Gov. Lottery Office)
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P1 (High)
- **Estimated:** 2 days
- **Dependencies:** SC-007
- **Description:**
  - Implement MegapotStrategy.sol (integrates with Megapot.io)
    - Support USDC only (Megapot requirement)
    - buyTicket() - purchase tickets on Megapot on user's behalf
      - Fetch ticket price: Megapot.getTicketPrice()
      - Calculate tickets: amount / ticketPrice
      - Call Megapot.purchaseTickets(referrer=DefiCity, value, recipient=user)
      - DefiCity earns referral fees from Megapot
    - View functions:
      - getJackpot() - fetch from Megapot.getJackpotAmount()
      - getUserWinnings() - fetch from Megapot.winningsClaimable(user)
      - getTimeRemaining() - fetch from Megapot.getTimeRemaining()
      - getLastWinner() - fetch from Megapot.getLastJackpotResults()
    - Create IMegapotJackpot interface
      - purchaseTickets(), winningsClaimable(), getTicketPrice()
      - getJackpotAmount(), getTimeRemaining(), getUsersInfo()
      - getLastJackpotResults()
  - Megapot contract: 0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95 (Base Mainnet)
  - USDC token: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  - Events: TicketsPurchased (DefiCity side only)
- **Acceptance Criteria:**
  - [ ] Can purchase tickets via Megapot successfully
  - [ ] Ticket price fetched dynamically from Megapot
  - [ ] Referral fees work (DefiCity earns fees)
  - [ ] Jackpot amount fetches correctly
  - [ ] User winnings fetch correctly
  - [ ] Unit tests pass (90%+ coverage)
  - [ ] Integration tests with Megapot contract pass

#### SC-017: Deploy DefiCity Smart Wallet (ERC-4337)
- **Status:** 🔵 TODO
- **Assignee:** FS2
- **Priority:** P0 (Critical)
- **Estimated:** 5 days
- **Dependencies:** None (external library)
- **Description:**
  - Use existing ERC-4337 wallet library (ZeroDev, Biconomy, or Alchemy)
  - Or fork SimpleAccount.sol and customize:
    - Add session key management
    - Add spending limits per session key (1000 USDC/day)
    - Add time limits per session key (24h)
    - Add contract whitelist (DefiCityCore only)
    - Add function whitelist (place, deposit, harvest, demolish)
  - Implement WalletFactory for deployment
  - Support passkey authentication (WebAuthn)
  - Support guardian recovery
- **Acceptance Criteria:**
  - [ ] Wallet deployable via factory
  - [ ] Session key management works
  - [ ] Spending limits enforced
  - [ ] Time limits enforced
  - [ ] Contract/function whitelisting works
  - [ ] Passkey auth supported
  - [ ] Guardian recovery works
  - [ ] Compatible with ERC-4337 EntryPoint

#### SC-018: Deploy DefiCity Paymaster
- **Status:** 🔵 TODO
- **Assignee:** FS2
- **Priority:** P0 (Critical)
- **Estimated:** 4 days
- **Dependencies:** SC-017
- **Description:**
  - Use existing Paymaster library or implement custom:
    - validatePaymasterUserOp() - validate session key signature
    - Enforce per-user gas limits (500 USDC/day)
    - Enforce global gas limits (10,000 USDC/day)
    - Enforce per-tx gas limit (0.5 USDC max)
    - Track gas spending per user
    - Owner can deposit ETH to fund gas
    - Auto-pause if balance too low
  - Events: GasSponsored, LimitExceeded, Refunded
  - Deploy to Base Sepolia
  - Fund with testnet ETH
- **Acceptance Criteria:**
  - [ ] Validates session keys correctly
  - [ ] Enforces per-user limits
  - [ ] Enforces global limits
  - [ ] Tracks spending accurately
  - [ ] Can be funded by owner
  - [ ] Auto-pauses if low balance
  - [ ] Unit tests pass (90%+ coverage)

#### SC-019: Update Core for AA Support
- **Status:** 🔵 TODO
- **Assignee:** FS1, FS2
- **Priority:** P0 (Critical)
- **Estimated:** 3 days
- **Dependencies:** SC-017, SC-018
- **Description:**
  - Update DefiCityCore to accept calls from:
    - Smart Wallets (via EntryPoint)
    - EOA (direct calls for deposit/withdraw)
  - Identify msg.sender properly (may be EntryPoint)
  - Use tx.origin for wallet identification (in AA context)
  - Ensure fee collection works with gasless txs
- **Acceptance Criteria:**
  - [ ] Works with Smart Wallet calls
  - [ ] Works with EOA calls
  - [ ] Identifies user correctly
  - [ ] Fee collection works in both modes
  - [ ] Integration tests pass

#### SC-020: Integration Tests - AA System
- **Status:** 🔵 TODO
- **Assignee:** FS1, FS2
- **Priority:** P0 (Critical)
- **Estimated:** 4 days
- **Dependencies:** SC-019
- **Description:**
  - Test complete AA flow:
    - Create Smart Wallet
    - Create session key
    - Place building (gasless via UserOp)
    - Harvest (gasless)
    - Demolish (gasless)
    - Buy lottery ticket (gasless)
  - Test session key security:
    - Expires after 24h
    - Spending limit enforced
    - Contract whitelist enforced
    - Can be revoked
  - Test paymaster limits:
    - Per-user limit works
    - Global limit works
  - Test on Base Sepolia testnet with real EntryPoint
- **Acceptance Criteria:**
  - [ ] Gasless gameplay works end-to-end
  - [ ] Session keys expire correctly
  - [ ] Spending limits work
  - [ ] Paymaster limits enforced
  - [ ] Can revoke session keys
  - [ ] All tests pass on testnet

#### SC-021: Deploy Complete System to Base Sepolia
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 2 days
- **Dependencies:** SC-016, SC-020
- **Description:**
  - Deploy all contracts:
    - Core, Registry, Managers
    - All 4 strategies (TownHall, Aave, Aerodrome, Lottery)
    - Smart Wallet Factory
    - Paymaster
  - Register strategies
  - Configure building types
  - Fund Paymaster with 5 ETH
  - Verify all contracts
  - Document all addresses
- **Acceptance Criteria:**
  - [ ] All contracts deployed and verified
  - [ ] Strategies registered and activated
  - [ ] Building types configured (0-3)
  - [ ] Paymaster funded
  - [ ] System functional on testnet
  - [ ] Addresses documented

### Frontend Tasks

#### FE-011: Integrate Account Abstraction SDK
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 5 days
- **Dependencies:** SC-021
- **Description:**
  - Install AA SDK (ZeroDev, Biconomy, Alchemy, or Permissionless.js)
  - Configure for Base Sepolia
  - Setup EntryPoint, Bundler, Paymaster connections
  - Create smart wallet on user signup
  - Implement transaction router:
    - Regular Tx: Wallet creation, deposit, withdraw
    - UserOp: Place, harvest, demolish, buy lottery ticket
  - Implement session key management:
    - Create session key (one-time approval)
    - Store in localStorage (encrypted)
    - Auto-refresh before expiry
    - Revoke on logout
- **Acceptance Criteria:**
  - [ ] AA SDK integrated
  - [ ] Smart wallet created for users
  - [ ] Transaction router works correctly
  - [ ] Session keys created and stored
  - [ ] Auto-refresh works
  - [ ] Logout revokes keys

#### FE-012: Implement Gasless Transactions
- **Status:** 🔵 TODO
- **Assignee:** FS1, FS2
- **Priority:** P0 (Critical)
- **Estimated:** 4 days
- **Dependencies:** FE-011
- **Description:**
  - Update all gameplay transactions to use UserOps:
    - Place building
    - Deposit to building
    - Harvest
    - Demolish
    - Buy lottery ticket
  - Show "Gasless" indicator in UI
  - Handle UserOp signing with session key
  - Show loading state during bundler submission
  - Handle errors (paymaster exhausted, session key expired, etc.)
  - Fallback to regular tx if paymaster unavailable
- **Acceptance Criteria:**
  - [ ] All gameplay actions are gasless
  - [ ] Gasless indicator displayed
  - [ ] Session key signs UserOps
  - [ ] Loading states work
  - [ ] Errors handled gracefully
  - [ ] Fallback to regular tx works

#### FE-013: Create Megapot Lottery Building UI
- **Status:** 🔵 TODO
- **Assignee:** FS2
- **Priority:** P1 (High)
- **Estimated:** 3 days
- **Dependencies:** FE-012, SC-016
- **Description:**
  - **Placement:**
    - USDC input field (Megapot requirement - USDC only)
    - Fetch dynamic ticket price from Megapot.getTicketPrice()
    - Auto-calculate ticket count: amount / ticketPrice
    - Show: "Tickets will be purchased on Megapot.io on your behalf"
    - Disclosure: "DefiCity earns referral fee"
    - Responsible gaming warning
    - Confirm purchase (gasless)
  - **Info Panel:**
    - $1M+ jackpot display (fetched from Megapot.getJackpotAmount())
    - User's ticket count (fetched from Megapot.getUsersInfo())
    - Next draw countdown (from Megapot.getTimeRemaining())
    - Last winner info (from Megapot.getLastJackpotResults())
    - "View on Megapot.io" link
    - Megapot branding (powered-by badge)
    - Responsible gaming warnings
  - **Check Winnings:**
    - Fetch Megapot.winningsClaimable(user)
    - If winnings > 0: Display "You Won!" with amount
    - "Claim on Megapot.io" button (external link)
    - Note: "Claims are processed on Megapot.io"
  - **Megapot Integration:**
    - Display Megapot branding tastefully
    - Link to Megapot.io for full details
    - Clear disclosure of external integration
- **Acceptance Criteria:**
  - [ ] Can buy tickets with USDC via Megapot
  - [ ] Ticket price updates dynamically from Megapot
  - [ ] Ticket count calculated correctly
  - [ ] Jackpot amount shows real-time from Megapot
  - [ ] Countdown to draw accurate
  - [ ] Winnings check works
  - [ ] Link to Megapot.io functions
  - [ ] Megapot branding displayed
  - [ ] Responsible gaming warnings displayed

#### FE-014: Update Dashboard for AA
- **Status:** 🔵 TODO
- **Assignee:** FS2
- **Priority:** P1 (High)
- **Estimated:** 3 days
- **Dependencies:** FE-011
- **Description:**
  - Show smart wallet address
  - Show session key status (active, expired, none)
  - Add "Create Session Key" button
  - Add "Revoke Session Key" button
  - Show gasless transaction count
  - Show remaining daily gas allowance
  - Update deposit/withdraw to use regular txs (user pays gas)
- **Acceptance Criteria:**
  - [ ] Smart wallet address displayed
  - [ ] Session key status visible
  - [ ] Can create/revoke session keys
  - [ ] Gasless stats displayed
  - [ ] Deposit/withdraw use regular txs

#### FE-015: Create Onboarding Flow
- **Status:** 🔵 TODO
- **Assignee:** FS1, FS2
- **Priority:** P1 (High)
- **Estimated:** 4 days
- **Dependencies:** FE-014
- **Description:**
  - **Step 1:** Welcome screen
  - **Step 2:** Email/social login (create passkey)
  - **Step 3:** Smart wallet created automatically
  - **Step 4:** Deposit funds (select asset, amount)
  - **Step 5:** Optional tutorial (2 min walkthrough)
  - **Step 6:** Ready to build!
  - Skip option for returning users
  - Clear messaging about gasless gameplay
- **Acceptance Criteria:**
  - [ ] Onboarding flow intuitive
  - [ ] Smart wallet created seamlessly
  - [ ] Tutorial helpful
  - [ ] Can skip for returning users
  - [ ] Gasless benefits communicated

### UX/UI Tasks

#### UI-006: Design Megapot Lottery Building & UI
- **Status:** 🔵 TODO
- **Assignee:** UI
- **Priority:** P1 (High)
- **Estimated:** 2 days
- **Dependencies:** UI-004
- **Description:**
  - Design lottery building sprite (government-style with Megapot branding)
  - Design ticket purchase modal:
    - USDC input field
    - Dynamic ticket price display (from Megapot)
    - Auto-calculated ticket count
    - Note: "Powered by Megapot.io"
    - Responsible gaming warning
    - Referral fee disclosure
  - Design lottery info panel:
    - $1M+ jackpot display (prominent, live from Megapot)
    - User's ticket count
    - Countdown timer to next draw
    - Last winner info (address + prize amount)
    - "View on Megapot.io" link
  - Design check winnings flow:
    - Claimable amount display
    - "Claim on Megapot.io" button
  - Design Megapot branding integration (powered-by badge)
- **Acceptance Criteria:**
  - [ ] Lottery building sprite distinctive
  - [ ] Megapot branding integrated tastefully
  - [ ] Ticket purchase UX clear (USDC-only)
  - [ ] Jackpot prominently displayed
  - [ ] Responsible gaming warnings prominent

#### UI-007: Design Account Abstraction UI
- **Status:** 🔵 TODO
- **Assignee:** UI
- **Priority:** P1 (High)
- **Estimated:** 3 days
- **Dependencies:** UI-003
- **Description:**
  - Design smart wallet display (address, copy button)
  - Design session key indicator (active/expired)
  - Design "Gasless" badge for transactions
  - Design session key creation flow
  - Design session key management panel
  - Design gasless stats (transactions, gas saved)
  - Design fallback UI (when paymaster exhausted)
- **Acceptance Criteria:**
  - [ ] Smart wallet UI clear
  - [ ] Session key status visible
  - [ ] Gasless indicators intuitive
  - [ ] Stats display engaging
  - [ ] Fallback messaging clear

#### UI-008: Design Onboarding Flow
- **Status:** 🔵 TODO
- **Assignee:** UI
- **Priority:** P1 (High)
- **Estimated:** 3 days
- **Dependencies:** UI-001
- **Description:**
  - Design welcome screen (hero, value props)
  - Design login screen (email/social options)
  - Design wallet creation screen
  - Design deposit screen (first deposit)
  - Design tutorial screens (4-5 steps)
  - Design progress indicator
  - Design skip/back buttons
- **Acceptance Criteria:**
  - [ ] Onboarding flow visually appealing
  - [ ] Steps clear and concise
  - [ ] Progress visible
  - [ ] Can skip tutorial
  - [ ] Mobile-friendly

### QA Tasks

#### QA-006: Test Account Abstraction Features
- **Status:** 🔵 TODO
- **Assignee:** QA1, QA2
- **Priority:** P0 (Critical)
- **Estimated:** 5 days
- **Dependencies:** FE-015, SC-021
- **Description:**
  - **Test Smart Wallet Creation:**
    - Email signup creates wallet
    - Wallet address displayed
    - Can receive assets
  - **Test Session Keys:**
    - Create session key (one-time approval)
    - Gameplay is gasless
    - Expires after 24 hours
    - Spending limit enforced (try to exceed 1000 USDC)
    - Can be revoked
    - Auto-refresh before expiry
  - **Test Gasless Transactions:**
    - Place building (gasless)
    - Harvest (gasless)
    - Demolish (gasless)
    - Buy lottery ticket (gasless)
    - Verify no gas prompts
  - **Test Paymaster Limits:**
    - Try to exceed per-user limit
    - Try to exceed global limit (harder to test)
    - Test fallback to regular tx
  - **Test Regular Transactions:**
    - Deposit (user pays gas)
    - Withdraw (user pays gas)
    - Wallet creation (user pays gas - one-time)
  - Test on Base Sepolia testnet
- **Acceptance Criteria:**
  - [ ] Smart wallet creation works
  - [ ] Session keys work as expected
  - [ ] Gasless transactions succeed
  - [ ] Limits enforced correctly
  - [ ] Fallback works
  - [ ] Regular txs work
  - [ ] All bugs filed and resolved

#### QA-007: Test Megapot Integration Functionality
- **Status:** 🔵 TODO
- **Assignee:** QA1
- **Priority:** P1 (High)
- **Estimated:** 2 days
- **Dependencies:** FE-013, SC-016
- **Description:**
  - **Test Megapot Ticket Purchase:**
    - Buy tickets with USDC (only supported asset)
    - Verify ticket price fetched dynamically from Megapot
    - Verify ticket count calculated correctly
    - Verify Megapot.purchaseTickets() called with correct params
    - Verify DefiCity earns referral fee
  - **Test Data Fetching:**
    - Jackpot amount updates from Megapot contract
    - Time remaining updates from Megapot
    - User's ticket count fetches correctly
    - Last winner info displays correctly
  - **Test Winnings Check:**
    - Fetch winningsClaimable(user) from Megapot
    - Display claimable amount correctly
    - Link to Megapot.io works
  - **Test Edge Cases:**
    - Buy ticket with insufficient USDC → Error
    - Buy ticket with non-USDC asset → Error
    - Megapot contract paused → Handle gracefully
  - **Test UI/UX:**
    - Responsible gaming warnings shown
    - Megapot branding displayed
    - Referral fee disclosure visible
  - **Integration Testing:**
    - End-to-end flow: Buy ticket → Wait for draw → Check winnings
    - Verify integration with real Megapot contract on Base
- **Acceptance Criteria:**
  - [ ] Ticket purchase works for all assets
  - [ ] Draw execution fair (VRF verified)
  - [ ] Prize distribution correct
  - [ ] Prize claims work
  - [ ] Edge cases handled
  - [ ] Warnings displayed
  - [ ] All bugs filed and resolved

#### QA-008: E2E Automated Tests
- **Status:** 🔵 TODO
- **Assignee:** QA2
- **Priority:** P1 (High)
- **Estimated:** 5 days
- **Dependencies:** QA-006, QA-007
- **Description:**
  - Write Playwright E2E tests:
    - User onboarding flow
    - Deposit multi-asset
    - Place all 4 building types
    - Harvest from Bank and Shop
    - Buy lottery ticket
    - Demolish buildings
    - Withdraw funds
  - Run on CI/CD
  - Generate test reports
- **Acceptance Criteria:**
  - [ ] E2E tests cover major flows
  - [ ] Tests run on CI/CD
  - [ ] All tests pass
  - [ ] Test reports generated

---

## Phase 4: Testing & Launch (Weeks 13-16)

**Goal:** Comprehensive testing, security prep, and testnet/mainnet launch

### Smart Contract Tasks

#### SC-022: Security Audit Preparation
- **Status:** 🔵 TODO
- **Assignee:** FS1, FS2
- **Priority:** P0 (Critical)
- **Estimated:** 5 days
- **Dependencies:** SC-021
- **Description:**
  - Code cleanup and documentation
  - Write comprehensive NatSpec comments
  - Add inline comments for complex logic
  - Create audit documentation:
    - Architecture overview
    - Contract interaction diagrams
    - Known issues/limitations
    - Deployment addresses
  - Run static analysis tools:
    - Slither
    - Mythril
    - Aderyn
  - Fix any findings
  - Prepare audit scope
- **Acceptance Criteria:**
  - [ ] All contracts well-documented
  - [ ] Audit docs complete
  - [ ] Static analysis clean
  - [ ] Ready for external audit
  - [ ] Audit scope defined

#### SC-023: Gas Optimization
- **Status:** 🔵 TODO
- **Assignee:** FS2
- **Priority:** P1 (High)
- **Estimated:** 3 days
- **Dependencies:** SC-022
- **Description:**
  - Profile gas usage for all functions
  - Optimize:
    - Storage layout (pack variables)
    - Loop optimizations
    - Reduce SLOAD/SSTORE
    - Use immutable/constant where possible
    - Batch operations
  - Target gas costs:
    - Place building: <250k gas
    - Harvest: <120k gas
    - Demolish: <200k gas
  - Document gas usage
- **Acceptance Criteria:**
  - [ ] Gas costs meet targets
  - [ ] No functionality broken
  - [ ] Gas report generated
  - [ ] Optimizations documented

#### SC-024: Deploy to Base Mainnet (Prep)
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 3 days
- **Dependencies:** SC-022, SC-023
- **Description:**
  - Prepare mainnet deployment scripts
  - Setup multi-sig wallet (3/5 threshold)
  - Transfer contract ownership to multi-sig
  - Fund paymaster with mainnet ETH ($50k worth)
  - Prepare mainnet addresses (Aave, Aerodrome, Chainlink VRF)
  - Dry-run deployment on fork
  - Create deployment checklist
- **Acceptance Criteria:**
  - [ ] Deployment scripts ready
  - [ ] Multi-sig configured
  - [ ] Paymaster funded
  - [ ] Mainnet addresses verified
  - [ ] Dry-run successful
  - [ ] Checklist complete

### Frontend Tasks

#### FE-016: Polish & Animations
- **Status:** 🔵 TODO
- **Assignee:** FS2, UI
- **Priority:** P1 (High)
- **Estimated:** 5 days
- **Dependencies:** FE-015
- **Description:**
  - Add animations:
    - Building placement (fade in + bounce)
    - Harvest effects (coins falling)
    - Demolish effects (explosion/fade out)
    - Lottery win celebration (confetti!)
  - Add transitions between screens
  - Add loading skeletons
  - Add empty states
  - Polish micro-interactions
  - Optimize performance
- **Acceptance Criteria:**
  - [ ] Animations smooth (60fps)
  - [ ] Transitions enhance UX
  - [ ] Loading states professional
  - [ ] Empty states helpful
  - [ ] Performance not degraded

#### FE-017: Error Handling & Edge Cases
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 3 days
- **Dependencies:** FE-016
- **Description:**
  - Implement comprehensive error handling:
    - Transaction reverts (show reason)
    - Network errors (retry logic)
    - Wallet disconnection (reconnect prompt)
    - Insufficient balance (clear message)
    - Session key expired (auto-refresh or prompt)
    - Paymaster exhausted (fallback to regular tx)
  - Handle edge cases:
    - No buildings yet (empty state)
    - No assets (prompt to deposit)
    - Building limit reached (message)
    - Liquidation warning (Bank)
    - High IL warning (Shop)
  - User-friendly error messages
  - Error logging to Sentry
- **Acceptance Criteria:**
  - [ ] All errors handled gracefully
  - [ ] Error messages user-friendly
  - [ ] Edge cases covered
  - [ ] Errors logged
  - [ ] Users not stuck

#### FE-018: Add Help & Documentation
- **Status:** 🔵 TODO
- **Assignee:** FS2, UI
- **Priority:** P2 (Nice to have)
- **Estimated:** 3 days
- **Dependencies:** FE-017
- **Description:**
  - Add help tooltips (info icons with explanations)
  - Create FAQ section
  - Write building guides:
    - What is a Bank? (supply/borrow)
    - What is a Shop? (LP + IL)
    - What is Lottery? (entertainment)
  - Add glossary (APY, IL, Health Factor, etc.)
  - Link to external docs (Aave, Aerodrome)
  - Create video tutorial (optional)
- **Acceptance Criteria:**
  - [ ] Tooltips helpful
  - [ ] FAQ comprehensive
  - [ ] Guides clear
  - [ ] Glossary complete
  - [ ] External links work

#### FE-019: Production Optimization
- **Status:** 🔵 TODO
- **Assignee:** FS1, FS2
- **Priority:** P0 (Critical)
- **Estimated:** 3 days
- **Dependencies:** FE-018
- **Description:**
  - Optimize bundle size:
    - Code splitting
    - Lazy loading
    - Tree shaking
    - Remove unused deps
  - Optimize images (compress, WebP format)
  - Setup CDN for static assets
  - Enable caching
  - Add service worker (PWA)
  - Setup monitoring (Vercel Analytics, Sentry)
  - Configure SEO (meta tags, sitemap, robots.txt)
  - Test on slow networks (throttling)
- **Acceptance Criteria:**
  - [ ] Bundle size <500KB (initial load)
  - [ ] Images optimized
  - [ ] CDN configured
  - [ ] PWA works
  - [ ] Monitoring setup
  - [ ] SEO configured
  - [ ] Works on slow networks

#### FE-020: Deploy Frontend to Production
- **Status:** 🔵 TODO
- **Assignee:** FS1
- **Priority:** P0 (Critical)
- **Estimated:** 2 days
- **Dependencies:** FE-019, SC-024
- **Description:**
  - Deploy to Vercel/Netlify
  - Configure custom domain
  - Setup environment variables (mainnet RPC, contract addresses)
  - Enable analytics
  - Setup error tracking (Sentry)
  - Configure CORS
  - Test production deployment
  - Create rollback plan
- **Acceptance Criteria:**
  - [ ] Deployed to production
  - [ ] Custom domain works
  - [ ] Environment variables correct
  - [ ] Analytics tracking
  - [ ] Errors tracked
  - [ ] CORS configured
  - [ ] Production tested

### QA Tasks

#### QA-009: Comprehensive Testing - All Flows
- **Status:** 🔵 TODO
- **Assignee:** QA1, QA2
- **Priority:** P0 (Critical)
- **Estimated:** 7 days
- **Dependencies:** FE-019
- **Description:**
  - Test complete user journeys:
    - New user: Signup → Deposit → Build → Harvest → Withdraw
    - Returning user: Login → Check buildings → Harvest → Expand
    - Power user: Multiple buildings, multiple assets, borrow mode, lottery
  - Test all building types thoroughly
  - Test all assets (USDC, USDT, ETH, WBTC)
  - Test edge cases and error scenarios
  - Test on all browsers (Chrome, Firefox, Safari, Edge)
  - Test on all devices (Desktop, Tablet, Mobile - iOS, Android)
  - Test performance under load
  - Regression testing (ensure old features still work)
- **Acceptance Criteria:**
  - [ ] All user journeys work
  - [ ] All building types functional
  - [ ] All assets supported
  - [ ] Edge cases handled
  - [ ] Cross-browser compatible
  - [ ] Cross-device compatible
  - [ ] Performance acceptable
  - [ ] No regressions
  - [ ] Bug backlog empty

#### QA-010: Security Testing
- **Status:** 🔵 TODO
- **Assignee:** QA1
- **Priority:** P0 (Critical)
- **Estimated:** 4 days
- **Dependencies:** SC-022
- **Description:**
  - Test smart contract security:
    - Try to steal funds
    - Try to manipulate fees
    - Try to bypass session key limits
    - Try to exploit liquidation
    - Try to manipulate lottery
  - Test frontend security:
    - XSS attempts
    - CSRF attempts
    - localStorage manipulation
    - Session hijacking
  - Test AA security:
    - Session key theft
    - Paymaster drain attempts
  - Document findings
  - Work with dev team to fix
- **Acceptance Criteria:**
  - [ ] No critical vulnerabilities found
  - [ ] All findings documented
  - [ ] All high/critical issues fixed
  - [ ] Medium/low issues tracked

#### QA-011: User Acceptance Testing (UAT)
- **Status:** 🔵 TODO
- **Assignee:** QA2
- **Priority:** P1 (High)
- **Estimated:** 3 days
- **Dependencies:** QA-009
- **Description:**
  - Recruit 10-20 beta testers
  - Create UAT scenarios
  - Guide testers through flows
  - Collect feedback:
    - Usability issues
    - Confusing UI
    - Bugs encountered
    - Feature requests
  - Analyze feedback
  - Prioritize improvements
  - Implement critical fixes
- **Acceptance Criteria:**
  - [ ] Beta testers recruited
  - [ ] UAT scenarios executed
  - [ ] Feedback collected and analyzed
  - [ ] Critical issues fixed
  - [ ] Nice-to-haves tracked for future

#### QA-012: Testnet Launch Testing
- **Status:** 🔵 TODO
- **Assignee:** QA1, QA2
- **Priority:** P0 (Critical)
- **Estimated:** 5 days
- **Dependencies:** SC-021, FE-020
- **Description:**
  - Public testnet launch (Base Sepolia)
  - Announce on social media (Discord, Twitter)
  - Invite community to test
  - Monitor:
    - Transaction success rate
    - Error frequency
    - Gas sponsorship usage
    - User feedback
  - Track metrics:
    - Signups
    - Buildings placed
    - Assets deposited
    - Lottery tickets sold
  - Fix issues as they arise
  - Prepare for mainnet
- **Acceptance Criteria:**
  - [ ] Testnet stable
  - [ ] Community testing successful
  - [ ] Metrics tracked
  - [ ] Issues resolved
  - [ ] Ready for mainnet

#### QA-013: Mainnet Launch Testing
- **Status:** 🔵 TODO
- **Assignee:** QA1, QA2
- **Priority:** P0 (Critical)
- **Estimated:** 3 days
- **Dependencies:** SC-024, FE-020, QA-012
- **Description:**
  - Soft launch (limited users)
  - Test all flows on mainnet
  - Monitor for issues
  - Gradual rollout
  - Full launch when stable
  - Monitor 24/7 for first week
  - Have emergency response plan ready
- **Acceptance Criteria:**
  - [ ] Soft launch successful
  - [ ] No critical issues on mainnet
  - [ ] Gradual rollout smooth
  - [ ] Full launch successful
  - [ ] Monitoring active
  - [ ] Emergency plan ready

---

## Priority Legend

- **P0 (Critical):** Must have for launch. Blocks other work.
- **P1 (High):** Important for good UX. Should be included.
- **P2 (Nice to have):** Enhances experience but not critical. Can defer.

---

## Dependencies

### Sprint-by-Sprint Breakdown

**Sprint 1 (Week 1-2):**
- SC-001 → SC-002, SC-003 → SC-004, SC-005
- FE-001 → FE-002, FE-003
- UI-001 → UI-002, UI-003

**Sprint 2 (Week 3-4):**
- SC-004, SC-005, SC-006, SC-007 → SC-008 → SC-009
- FE-002, FE-003 → FE-004, FE-005 → FE-006
- UI-002 → FE-005
- QA-001, QA-002 → QA-003

**Sprint 3 (Week 5-6):**
- SC-009 → SC-010, SC-011, SC-012 → SC-013
- FE-006 → FE-007

**Sprint 4 (Week 7-8):**
- SC-013 → SC-014 → SC-015
- FE-007 → FE-008, FE-009, FE-010
- UI-004, UI-005
- QA-004, QA-005

**Sprint 5 (Week 9-10):**
- SC-015 → SC-016, SC-017, SC-018 → SC-019
- FE-010 → FE-011

**Sprint 6 (Week 11-12):**
- SC-019 → SC-020 → SC-021
- FE-011 → FE-012, FE-013, FE-014, FE-015
- UI-006, UI-007, UI-008
- QA-006, QA-007, QA-008

**Sprint 7 (Week 13-14):**
- SC-021 → SC-022, SC-023 → SC-024
- FE-015 → FE-016, FE-017, FE-018
- QA-009, QA-010

**Sprint 8 (Week 15-16):**
- SC-024 (Deploy mainnet)
- FE-018 → FE-019 → FE-020 (Deploy frontend)
- QA-011, QA-012 → QA-013 (Launch!)

---

## Summary

**Total Tasks:** 79 tasks
- Smart Contract: 24 tasks
- Frontend: 20 tasks
- UX/UI: 8 tasks
- QA: 13 tasks
- Integration/Deployment: 14 tasks

**Timeline:** 16 weeks (4 months)

**Team Allocation:**
- FS1: Smart contracts (primary), Frontend (secondary)
- FS2: Smart contracts (secondary), Frontend (primary)
- QA1: Manual testing, Security testing, UAT
- QA2: Automation, Performance testing, E2E
- UI: Design system, All UX/UI tasks

**Critical Path:**
1. Core contracts → DeFi strategies → AA + Lottery → Testing → Launch
2. Frontend foundation → DeFi integration → AA integration → Polish → Deploy

---

**Next Steps:**
1. Review this task list with the team
2. Assign specific tasks to team members
3. Setup project management tool (Jira, Linear, GitHub Projects)
4. Start Sprint 1!

**Last Updated:** 2026-01-14
