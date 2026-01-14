# DefiCity - Business Requirements Document

**Project:** DefiCity - DeFi City Builder Game
**Version:** 1.0
**Date:** 2026-01-14
**Status:** Development Phase
**Document Owner:** Product Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Objectives](#business-objectives)
3. [Target Users](#target-users)
4. [Product Overview](#product-overview)
5. [Functional Requirements](#functional-requirements)
6. [Building Types & Investment Strategies](#building-types--investment-strategies)
7. [Fee Structure & Revenue Model](#fee-structure--revenue-model)
8. [Account Abstraction & User Experience](#account-abstraction--user-experience)
9. [Security & Safety Requirements](#security--safety-requirements)
10. [Technical Architecture](#technical-architecture)
11. [User Journey](#user-journey)
12. [Success Metrics](#success-metrics)
13. [Risk Management](#risk-management)
14. [Constraints & Assumptions](#constraints--assumptions)
15. [Future Roadmap](#future-roadmap)

---

## 1. Executive Summary

### What is DefiCity?

DefiCity is a **gamified DeFi portfolio management platform** that transforms complex DeFi investments into an intuitive city-building game. Users visualize their DeFi positions as buildings in a virtual city, making yield farming accessible and engaging for mainstream users.

### Core Concept

```
City = Investment Portfolio
Building = DeFi Position
Rent/Income = Yield from Protocols
```

### Value Proposition

- **For Users:** Make DeFi investing simple, visual, and fun while earning real yield from multiple assets (USDC, USDT, ETH, BTC)
- **For Protocol:** Attract mainstream users to DeFi through gamification and entertainment (including lottery)
- **For DeFi Ecosystem:** Drive liquidity to battle-tested protocols (Aave, Aerodrome) across multiple asset types

### Key Differentiators

1. **Gamified DeFi** - First city builder with real DeFi integrations plus entertainment (lottery)
2. **Multi-Asset Support** - Deposit and invest with USDC, USDT, ETH, or BTC
3. **Gasless Gameplay** - Users play without paying transaction fees
4. **Simple Onboarding** - Email/social login via smart wallets (no crypto experience needed)
5. **Flexible Strategies** - Supply-only, borrow, LP, or play lottery - choose your risk
6. **No Unlock Requirements** - All buildings available from day one
7. **Transparent Fees** - Only 0.05% on building creation, zero fees on harvesting/withdrawing

---

## 2. Business Objectives

### Primary Objectives

**2.1 User Acquisition**
- Acquire 10,000+ active users in first 6 months
- Target mainstream users (non-crypto natives)
- Convert traditional gamers to DeFi users

**2.2 Total Value Locked (TVL)**
- Achieve $5M TVL in first 3 months
- Reach $50M TVL within 12 months
- Average deposit per user: $500-2,000

**2.3 User Engagement**
- Daily active users (DAU): 30% of total users
- Average session time: 10+ minutes
- Return rate: 60% users return within 7 days

**2.4 Revenue Generation**
- Protocol fees: 0.05% of all deposits
- Target: $25,000+ monthly fees at $50M TVL
- Sustainable treasury for development and operations

### Secondary Objectives

**2.5 Ecosystem Growth**
- Drive liquidity to Base chain DeFi protocols
- Create educational content for DeFi beginners
- Build community of DeFi enthusiasts

**2.6 Platform Stability**
- 99.9% uptime
- Zero security incidents
- Fast support response time (<24h)

---

## 3. Target Users

### Primary User Segments

**3.1 Crypto Curious (40% of target market)**
- **Profile:** Heard about crypto, never invested
- **Age:** 25-40
- **Tech Savvy:** Moderate
- **Risk Tolerance:** Low to Medium
- **Motivation:** FOMO, curiosity about crypto returns
- **Pain Points:** Don't know where to start, fear of losing money

**3.2 Casual Gamers (30% of target market)**
- **Profile:** Play mobile/web games regularly
- **Age:** 20-35
- **Tech Savvy:** Moderate
- **Risk Tolerance:** Medium
- **Motivation:** Entertainment + earning potential
- **Pain Points:** Most crypto games are complex or scammy

**3.3 DeFi Beginners (20% of target market)**
- **Profile:** Owns crypto, tried 1-2 DeFi protocols
- **Age:** 25-45
- **Tech Savvy:** High
- **Risk Tolerance:** Medium to High
- **Motivation:** Simplify DeFi portfolio management
- **Pain Points:** Managing multiple protocols is tedious

**3.4 Yield Farmers (10% of target market)**
- **Profile:** Active DeFi users
- **Age:** 25-50
- **Tech Savvy:** Very High
- **Risk Tolerance:** High
- **Motivation:** Optimize yields, discover new protocols
- **Pain Points:** Need better portfolio visualization

### User Personas

**Persona 1: "Sarah the Curious"**
- 28-year-old marketing professional
- Has heard about crypto from friends
- Wants passive income but intimidated by complexity
- Prefers mobile apps, loves Stardew Valley
- **Goal:** Start investing with $500, understand the basics
- **DefiCity Fit:** Email login, simple UI, low minimum deposits

**Persona 2: "Mike the Gamer"**
- 24-year-old software developer
- Plays mobile games daily
- Owns some ETH but never used DeFi
- **Goal:** Earn while playing, understand DeFi
- **DefiCity Fit:** Gasless transactions, game-like progression

**Persona 3: "Lisa the Investor"**
- 35-year-old finance professional
- Active in DeFi (Aave, Uniswap user)
- Manages $50k portfolio across 5+ protocols
- **Goal:** Simplified dashboard, better UX
- **DefiCity Fit:** Multi-protocol integration, portfolio view

---

## 4. Product Overview

### Core Gameplay Loop

1. **Create Smart Wallet** - One-time setup with email/social login (optional: Place Town Hall)
2. **Deposit Funds** - Add any asset (USDC, USDT, ETH, BTC) to wallet
3. **Build City** - Place buildings that invest in DeFi protocols (any building, no unlock requirements)
4. **Earn Yield** - Buildings generate real yield from protocols
5. **Harvest** - Collect earnings anytime
6. **Expand** - Add more buildings or upgrade existing ones
7. **Withdraw** - Remove funds in any asset anytime (demolish buildings)

### Game Mechanics

**City as Portfolio**
- Each user has a unique city (portfolio)
- City value = total assets across all buildings
- City level = unlocks new building types

**Buildings as Investments**
- Each building represents a DeFi position
- Building type determines which protocol it uses
- Building generates visual "income" based on real yield
- Users can upgrade buildings for better rates

**Progression System**
- No unlock requirements - Build any building from the start
- Town Hall (optional) - Creates your smart wallet with visual representation
- Bank - Supply assets as collateral, borrow other assets (Aave)
- Shop - Provide liquidity to earn trading fees (Aerodrome)
- Government Lottery Office - Purchase lottery tickets, wait for draw
- Future: More building types from different protocols

### Visual Design

**Map View**
- Isometric grid-based city
- Buildings have unique designs per type
- Visual indicators for yield accumulation
- Animations for building placement, harvesting

**Building Info Panel**
- Current value (principal + unrealized yield)
- Pending rewards ready to harvest
- APY (Annual Percentage Yield)
- Time since creation
- Protocol information

**Dashboard**
- Total portfolio value
- Total earned to date
- Breakdown by building type
- Performance chart (optional)

---

## 5. Functional Requirements

### FR-001: User Onboarding

**FR-001.1 Account Creation**
- **Description:** User creates account without needing prior crypto knowledge
- **Method:** Email, Google, Apple, or Passkey authentication
- **Process:**
  1. User enters email or selects social login
  2. System creates ERC-4337 smart wallet automatically
  3. User receives wallet address
  4. System creates session key for gasless transactions
- **Acceptance Criteria:**
  - Account created within 30 seconds
  - No crypto wallet extension required
  - User receives confirmation email
  - Smart wallet deployed on first deposit

**FR-001.2 First-Time User Experience**
- **Description:** Guide new users through first building placement
- **Features:**
  - Welcome tutorial (optional, skippable)
  - Recommended starting strategy (Yield Farm)
  - Pre-filled deposit amounts ($100, $500, $1000)
- **Acceptance Criteria:**
  - Tutorial completable in <2 minutes
  - Clear explanation of each building type
  - Risk warnings displayed

### FR-002: Fund Management

**FR-002.1 Deposit Funds**
- **Description:** User adds assets to their smart wallet
- **Supported Assets:**
  - USDC (USD Coin)
  - USDT (Tether)
  - ETH (Ethereum)
  - BTC (Wrapped Bitcoin - WBTC)
  - Future: More assets based on demand
- **Methods:**
  - Transfer from external wallet (MetaMask, Coinbase Wallet, etc.)
  - Buy with credit card (via Ramp/MoonPay) - Future
  - Bridge from other chains - Future
- **Requirements:**
  - Minimum deposit: $10 USD equivalent
  - User pays gas for deposit transaction
  - Real-time balance update for all assets
  - Multi-asset portfolio display
- **Acceptance Criteria:**
  - Deposit reflects in wallet within 1 block (~2 seconds)
  - Transaction receipt displayed with asset type
  - Balance shown for each asset separately
  - Total portfolio value in USD displayed

**FR-002.2 Withdraw Funds**
- **Description:** User withdraws any asset from smart wallet to external wallet
- **Supported Assets:** All deposited assets (USDC, USDT, ETH, BTC)
- **Requirements:**
  - Must demolish buildings first (or withdraw available balance)
  - User pays gas for withdrawal
  - Minimum withdrawal: $1 USD equivalent
  - Can withdraw in different asset than deposited (auto-swap available)
- **Acceptance Criteria:**
  - Funds sent to specified address in requested asset
  - Transaction completes within 1 minute
  - Clear fee disclosure before confirmation
  - Asset balance updated correctly
  - Multi-asset withdrawal support (withdraw multiple assets at once)

### FR-003: Building Management

**FR-003.1 Place Building**
- **Description:** User creates a new building (invests in DeFi protocol)
- **Requirements:**
  - Select building type from available types
  - Specify investment amount (≥ minimum for type)
  - Fee: 0.05% of deposit amount
  - Transaction is gasless (sponsored by paymaster)
- **Process:**
  1. User selects empty tile on map
  2. User selects building type
  3. System shows:
     - Minimum deposit amount
     - Building creation fee (0.05%)
     - Net amount going to protocol
     - Expected APY
  4. User confirms
  5. System creates UserOperation (gasless)
  6. Bundler submits to blockchain
  7. Building appears on map
- **Acceptance Criteria:**
  - Building created within 10 seconds
  - Correct fee deducted
  - Building visible on map
  - User receives confirmation notification
  - Zero gas paid by user

**FR-003.2 Deposit to Existing Building**
- **Description:** User adds more funds to an existing building
- **Requirements:**
  - Building must be active
  - No minimum for additional deposits
  - No fee on additional deposits
  - Transaction is gasless
- **Acceptance Criteria:**
  - Building value updates correctly
  - Shares recalculated properly
  - Transaction confirmed within 10 seconds

**FR-003.3 Harvest Yield**
- **Description:** User collects accumulated yield from a building
- **Requirements:**
  - Building must have pending rewards > 0
  - No fee on harvesting
  - Transaction is gasless
  - Yield transferred to smart wallet (not external wallet)
- **Process:**
  1. User clicks building with pending yield
  2. System shows pending rewards amount
  3. User clicks "Harvest"
  4. System claims yield from protocol
  5. USDC transferred to user's smart wallet
- **Acceptance Criteria:**
  - Correct yield amount received (100% of net yield)
  - Transaction completes within 10 seconds
  - Balance updated in wallet
  - Zero gas paid by user

**FR-003.4 Demolish Building**
- **Description:** User removes a building and withdraws all funds
- **Requirements:**
  - User owns the building
  - Building type allows demolition (Town Hall cannot be demolished)
  - No fee on demolition
  - Transaction is gasless
- **Process:**
  1. User clicks building
  2. User selects "Demolish"
  3. System shows:
     - Total value (principal + unrealized yield)
     - Amount to receive
  4. User confirms
  5. System withdraws from protocol
  6. USDC sent to smart wallet
  7. Building removed from map
- **Acceptance Criteria:**
  - Full value returned to wallet
  - Building removed from map
  - Transaction completes within 15 seconds
  - Zero gas paid by user

**FR-003.5 Upgrade Building (Future)**
- **Description:** User upgrades building to increase APY
- **Requirements:**
  - Additional deposit required
  - Upgrade cost based on building level
  - APY boost: Level 2 (+0.5%), Level 3 (+1.0%)
- **Acceptance Criteria:**
  - Building level increases
  - APY updated correctly
  - Visual change on map

### FR-004: Information Display

**FR-004.1 Portfolio Dashboard**
- **Description:** User sees complete portfolio overview
- **Information Displayed:**
  - Total Portfolio Value (in USDC and USD)
  - Available Balance in Wallet
  - Total Invested across all buildings
  - Total Earned (lifetime)
  - Total Pending Rewards
  - Number of Buildings
  - Average APY
- **Refresh Rate:** Real-time (every block)

**FR-004.2 Building Details**
- **Description:** User clicks building to see details
- **Information Displayed:**
  - Building type and name
  - Protocol used (Aave, Aerodrome, etc.)
  - Deposited amount (original investment)
  - Current value (principal + unrealized yield)
  - Pending rewards (ready to harvest)
  - APY (current rate)
  - Risk level (Low, Medium, High)
  - Created date
  - Last harvest date
- **Actions Available:**
  - Deposit More
  - Harvest
  - Demolish (if allowed)
  - Upgrade (future)

**FR-004.3 Transaction History**
- **Description:** User views all past transactions
- **Information Displayed:**
  - Transaction type (Deposit, Place, Harvest, Demolish, Withdraw)
  - Amount
  - Date and time
  - Building involved (if applicable)
  - Transaction hash (link to block explorer)
- **Filtering:**
  - By type
  - By date range
  - By building

**FR-004.4 Performance Analytics (Future)**
- **Description:** User tracks portfolio performance over time
- **Metrics:**
  - Value over time chart
  - Earnings per day/week/month
  - Best performing building
  - APY history
  - Comparison to holding USDC

### FR-005: Account Abstraction Features

**FR-005.1 Gasless Gameplay**
- **Description:** In-game actions don't require users to pay gas
- **Covered Actions:**
  - Place Building
  - Deposit to Building
  - Harvest Yield
  - Demolish Building
- **Limitations:**
  - User still pays gas for: Wallet creation (one-time), Initial deposit, Final withdrawal
  - Paymaster has daily limits per user
- **Acceptance Criteria:**
  - User never prompted for gas approval during gameplay
  - All gameplay transactions complete successfully
  - Clear messaging when gas sponsorship is unavailable

**FR-005.2 Session Keys**
- **Description:** Temporary keys for seamless gameplay without repeated approvals
- **Features:**
  - Created automatically on first gameplay action
  - Valid for 24 hours
  - Spending limit: 1,000 USDC per key
  - Restricted to DefiCityCore contract only
  - Auto-refresh before expiry (if user active)
  - User can revoke manually anytime
- **Security:**
  - Keys stored in browser localStorage (encrypted)
  - Keys deleted on logout
  - User notified when key created/expired/revoked
- **Acceptance Criteria:**
  - User never approves individual gameplay transactions
  - Session key auto-created seamlessly
  - User can see active session keys in settings
  - Revoke function works immediately

**FR-005.3 Smart Wallet Recovery**
- **Description:** User can recover wallet if they lose access
- **Method:** Social recovery via guardians
- **Process:**
  1. User sets up 2-3 guardians (trusted contacts)
  2. If wallet lost, user contacts guardians
  3. Guardian initiates recovery
  4. After 48-hour timelock, ownership transferred
  5. User regains access with new passkey
- **Acceptance Criteria:**
  - Guardian setup takes <5 minutes
  - Recovery process clearly documented
  - Funds remain safe during recovery

### FR-006: Building Types

**FR-006.1 Town Hall (Optional)**
- **Type:** Smart Wallet Creation Building (no DeFi strategy)
- **Requirements:**
  - Optional - not required to start playing
  - Only 1 per user
  - No deposit required (free)
  - Cannot be demolished (represents your wallet)
- **Purpose:**
  - Visual representation of your smart wallet on the map
  - Creates your ERC-4337 smart wallet
  - Act as city center/identity
- **Benefits:**
  - Visual placeholder for your wallet address
  - Optional aesthetic element
  - May provide future bonuses (community governance, etc.)
- **Acceptance Criteria:**
  - Can be placed for free
  - Creates smart wallet if not already created
  - Displays wallet address
  - Cannot be removed (wallet is permanent)
- **Note:** Users can skip Town Hall entirely and start with other buildings directly

**FR-006.2 Bank (Supply & Borrow)**
- **Type:** Lending and borrowing platform via Aave
- **Strategy:** AaveStrategy (Supply AND Borrow)
- **Supported Assets:** USDC, USDT, ETH, BTC (any supported asset)
- **Minimum Deposit:** $100 USD equivalent
- **Expected APY:** Variable (supply: ~3-5%, borrow cost: ~5-8%)
- **Risk:** Medium (liquidation risk if borrowing)
- **Maximum per User:** 10 buildings
- **How it Works:**
  - **Supply Mode:**
    - User deposits any asset (USDC, USDT, ETH, BTC)
    - Strategy supplies to Aave V3 pool
    - Receives aTokens (aUSDC, aETH, etc.)
    - Earns supply APY
    - Assets act as collateral
  - **Borrow Mode:**
    - User can borrow other assets against their collateral
    - Must maintain healthy collateralization ratio (e.g., >150%)
    - Pays borrow APY
    - Can borrow up to 75% of collateral value (depends on asset)
  - **Combined Strategy:**
    - Supply ETH, borrow USDC → Use USDC for other investments
    - Supply USDC, borrow USDT → Arbitrage opportunities
    - Multi-asset supply for diversification
- **Risk Warnings:**
  - Liquidation if collateral value drops below threshold
  - Borrow rate can increase if utilization is high
  - User must monitor health factor
- **Acceptance Criteria:**
  - Supply APY displayed correctly for each asset
  - Borrow APY displayed correctly for each asset
  - Health factor displayed (if borrowing)
  - Liquidation warnings when health factor < 1.5
  - Supports multiple assets simultaneously
  - Auto-calculations for max borrow amount

**FR-006.3 Shop (Liquidity Providing)**
- **Type:** Liquidity providing via Aerodrome
- **Strategy:** AerodromeStrategy
- **Supported Pairs:**
  - USDC/ETH
  - USDT/USDC
  - ETH/BTC
  - Future: More pairs based on demand
- **Minimum Deposit:** $500 USD equivalent
- **Expected APY:** ~8-15% (variable, from trading fees + incentives)
- **Risk:** High (impermanent loss risk)
- **Maximum per User:** 5 buildings
- **How it Works:**
  - User selects trading pair (e.g., USDC/ETH)
  - User deposits one or both assets
  - If depositing single asset, auto-converts 50% to pair asset
  - Strategy adds liquidity to Aerodrome pool
  - Receives LP position (NFT for V3 or LP tokens for V2)
  - Earns trading fees from every swap in that pool
  - Earns AERO token incentives (if pool is incentivized)
  - Position value fluctuates with price ratio between assets
- **Risk Warnings:**
  - Clear explanation of impermanent loss with examples
  - IL calculator shown before placement
  - Price divergence warning (if assets move >20%)
  - Risk disclaimer must be accepted
- **Acceptance Criteria:**
  - Multiple pair selection available
  - Single or dual asset deposit supported
  - Auto-swap works correctly (if needed)
  - LP position created successfully
  - Trading fees accumulated and displayed
  - AERO rewards tracked
  - Impermanent loss calculator shown with live data
  - Current IL displayed as percentage

**FR-006.4 Government Lottery Office (Megapot Integration)**
- **Type:** Jackpot lottery integration with Megapot
- **Strategy:** MegapotStrategy (integrates with Megapot.io)
- **Supported Assets:** USDC only (Megapot requirement)
- **Minimum Purchase:** Dynamic (fetched from Megapot contract)
- **Jackpot:** $1M+ USD (managed by Megapot)
- **Risk:** Very High (gambling, entertainment only)
- **Maximum per User:** Unlimited tickets
- **How it Works:**
  - **Ticket Purchase:**
    - User deposits USDC to building
    - System fetches current ticket price from Megapot
    - Purchases tickets on user's behalf
    - DefiCity earns referral fees for bringing users
  - **Lottery Mechanics:**
    - Managed entirely by Megapot (https://megapot.io)
    - Provably fair randomness (Chainlink VRF)
    - Regular draws (schedule managed by Megapot)
    - Multi-million dollar jackpot
    - Already audited and battle-tested
  - **Prize Distribution:**
    - Handled automatically by Megapot
    - Users can check winnings via building interface
    - Prizes claimable in USDC
    - Winners notified automatically
  - **Building Representation:**
    - Shows tickets purchased this round
    - Displays current jackpot amount (live from Megapot)
    - Shows countdown to next draw
    - Displays user's claimable winnings
    - Shows recent winners and prizes
- **Risk Warnings:**
  - **This is gambling** - For entertainment only
  - Warning: "Lottery is entertainment, not investment"
  - Display jackpot odds prominently
  - Responsible gaming message
  - Links to responsible gaming resources
- **Why Megapot Integration:**
  - $1M+ jackpot (much larger than we could offer)
  - Production-ready, audited, and secure
  - No need to build/maintain lottery infrastructure
  - DefiCity earns referral fees
  - Users benefit from established, trusted lottery
- **Acceptance Criteria:**
  - USDC ticket purchase works seamlessly
  - Real-time jackpot amount displayed
  - Countdown to draw shown accurately
  - Winnings check works correctly
  - Referral attribution to DefiCity
  - Responsible gaming warnings displayed prominently
  - Link to Megapot for full lottery details
- **Note:** This building integrates with external Megapot protocol. DefiCity acts as gateway, earning referral fees while providing users access to a massive jackpot

---

## 6. Building Types & Investment Strategies

### Building Type Summary

| Building | Strategy | Asset | Min Deposit | APY/Return | Risk | Max/User | Can Demolish |
|----------|----------|-------|-------------|------------|------|----------|--------------|
| Town Hall | None | - | $0 | 0% | None | 1 | No |
| Bank | Aave Supply/Borrow | USDC, USDT, ETH, BTC | $100 | 3-8% (variable) | Medium | 10 | Yes |
| Shop | Aerodrome LP | USDC/ETH, USDT/USDC, etc. | $500 | 8-15% | High | 5 | Yes |
| Gov. Lottery | Megapot Integration | USDC only | Dynamic | $1M+ Jackpot | Very High | Unlimited | Yes* |

*Note: Demolishing withdraws un-spent USDC; active tickets remain on Megapot

### Strategy Details

**Aave Strategy (Bank Building)**
- **Protocol:** Aave V3 on Base
- **Mechanisms:**
  - **Supply:** Deposit assets to earn interest
  - **Borrow:** Take loans against deposited collateral
- **Supported Assets:** USDC, USDT, ETH, WBTC (and more)
- **Yield Sources:**
  - Supply APY: Interest from borrowers
  - Borrow Cost: Interest paid on loans
  - Net yield: Supply APY - Borrow APY (if borrowing)
- **Tokens:** aTokens (aUSDC, aETH, etc.) - ERC-20
- **Compound:** Auto-compounds every block
- **Withdrawal:** Instant (if not used as collateral)
- **Collateralization:**
  - Each asset has Loan-to-Value (LTV) ratio
  - E.g., ETH: 80% LTV → Can borrow up to 80% of ETH value
  - Must maintain health factor > 1.0 to avoid liquidation
  - Recommended: Keep health factor > 1.5
- **Risks:**
  - Smart contract risk (Aave)
  - Asset depeg risk (for stablecoins)
  - Liquidation risk (if borrowing and collateral value drops)
  - Protocol insolvency (very low, over-collateralized)
- **Why Popular:**
  - Battle-tested protocol ($10B+ TVL)
  - Audited multiple times
  - Multi-asset support
  - Flexible (supply only or supply + borrow)
  - Instant liquidity (if not used as collateral)

**Aerodrome Strategy (Shop Building)**
- **Protocol:** Aerodrome (Velodrome fork) on Base
- **Mechanism:** Provide liquidity to trading pairs
- **Supported Pairs:**
  - Stablecoin pairs: USDC/USDT (low IL risk)
  - Volatile pairs: USDC/ETH, ETH/BTC (higher IL risk)
  - Correlated assets: Minimize IL
- **Yield Sources:**
  - Trading fees: Earned from every swap (0.05% - 1% depending on pool)
  - AERO incentives: Weekly token rewards from protocol
  - Bribes: Additional incentives from external projects
- **Token:** LP tokens (V2 pools) or LP NFT (V3 concentrated liquidity)
- **Compound:** Rewards claimed and auto-compounded (optional)
- **Withdrawal:** Instant (no lock period)
- **Risks:**
  - Impermanent loss (if asset prices diverge)
  - Smart contract risk (Aerodrome)
  - Low liquidity risk (if pool is small)
  - AERO token volatility
- **Why Higher APY:**
  - Trading fees from high-volume pairs
  - AERO token incentives (often 10-30% APY)
  - Concentrated liquidity amplifies fees (V3)
  - Multiple revenue streams
- **Impermanent Loss Examples:**
  - **Low IL (Stablecoin pair):**
    - USDC/USDT: Minimal IL (<0.1%)
    - Safe for risk-averse users
  - **High IL (Volatile pair):**
    - Deposit: $500 USDC + $500 ETH = $1,000
    - If ETH doubles: LP value = ~$1,414 vs $1,500 if held
    - IL = ~5.7% (often offset by fees)
    - If ETH 3x: IL = ~13.4%

**Lottery Strategy (Government Lottery Office)**
- **Protocol:** Custom on-chain lottery (DefiCity)
- **Mechanism:** Ticket-based lottery with provably fair draws
- **Randomness:** Chainlink VRF (Verifiable Random Function)
- **Ticket Pricing:** $10-100 per ticket (flexible)
- **Draw Frequency:** Daily or weekly (configurable)
- **Prize Pool:** 70% of ticket sales
- **Prize Distribution:**
  - Jackpot (match all): 50% of pool
  - 2nd Prize (5/6): 20% of pool
  - 3rd Prize (4/6): 15% of pool
  - 4th Prize (3/6): 15% of pool
- **Jackpot Rollover:** If no winner, jackpot adds to next draw
- **Expected Value:** ~70% (negative EV)
- **Risks:**
  - Very high risk (gambling)
  - Expected value < 100% (house edge 30%)
  - Can lose entire ticket cost
  - Addictive potential
- **Why Include:**
  - Entertainment value
  - Gamification element
  - Additional revenue stream (30% to treasury)
  - Community engagement (big jackpots create buzz)
- **Responsible Gaming:**
  - Clear odds displayed (e.g., 1 in 13.9M for jackpot)
  - "This is entertainment, not investment" warning
  - Optional spending limits
  - Self-exclusion features (future)

### Building Synergies (Future Feature)

**Adjacency Bonuses**
- Town Hall + Any Building (adjacent) → +0.5% APY boost
- Bank + Bank (cluster) → +0.2% APY boost
- Shop + Shop (cluster) → +0.5% APY boost
- Bank + Shop (adjacent) → +0.3% combined boost
- Lottery Office → No synergies (entertainment only)

**City Level Benefits**
- No unlock requirements - all buildings available from start
- Level 1 (1 building) → Basic gameplay
- Level 3 (5 buildings) → 10% fee discount
- Level 5 (10 buildings) → Exclusive building skins/designs
- Level 10 (20 buildings) → VIP perks (early access to new buildings)

---

## 7. Fee Structure & Revenue Model

### Fee Model: Simple & Transparent

DefiCity uses a **building creation fee only** model for maximum user-friendliness.

**What We Charge:**
- ✅ Building Creation: 0.05% of deposit amount

**What We DON'T Charge:**
- ❌ Deposit to existing building: FREE
- ❌ Harvest yield: FREE (users get 100% of yield)
- ❌ Demolish building: FREE
- ❌ Withdraw from wallet: FREE
- ❌ Performance fees: NONE
- ❌ Withdrawal fees: NONE

### Fee Examples

**Example 1: Simple Deposit**
```
User creates Yield Farm with 1,000 USDC:
├─ Deposit Amount:      1,000 USDC
├─ Building Fee (0.05%):  0.5 USDC → Treasury
├─ Net to Aave:         999.5 USDC → Earning yield
└─ Expected yield:       ~52 USDC/year (100% goes to user)

After 1 year:
├─ Principal: 999.5 USDC
├─ Yield earned: 52 USDC
├─ User harvests: 52 USDC (100% received, no fees)
├─ User demolishes: 999.5 USDC (100% received, no fees)
└─ Total received: 1,051.5 USDC
```

**Example 2: Multiple Buildings**
```
User builds 3 Yield Farms:
├─ Building 1: 1,000 USDC → Fee: 0.5 USDC
├─ Building 2: 2,000 USDC → Fee: 1.0 USDC
├─ Building 3: 500 USDC → Fee: 0.25 USDC
└─ Total fees paid: 1.75 USDC (0.05% of 3,500 USDC)

All future actions (harvest, demolish) are FREE
```

### Revenue Projections

**Conservative Scenario (6 months)**
- Users: 5,000
- Average deposit per user: $1,000
- Total deposits: $5M
- Fee (0.05%): $2,500
- Monthly recurring (assume 20% new deposits): ~$1,000/month

**Moderate Scenario (12 months)**
- Users: 20,000
- Average deposit per user: $2,000
- Total deposits: $40M
- Fee (0.05%): $20,000
- Monthly recurring: ~$5,000/month

**Optimistic Scenario (24 months)**
- Users: 100,000
- Average deposit per user: $1,500
- Total deposits: $150M
- Fee (0.05%): $75,000
- Monthly recurring: ~$20,000/month

### Why This Model?

**User Benefits:**
1. **Predictable Costs** - Know exactly what you pay upfront
2. **Encourage Activity** - Harvest as often as you want, no penalties
3. **Full Yield** - Keep 100% of your earnings
4. **No Lock-in** - Withdraw anytime without fees

**Protocol Benefits:**
1. **Volume-Based** - More users = more revenue
2. **Sustainable** - Doesn't depend on token inflation
3. **Competitive** - Lower fees than traditional platforms
4. **Simple** - Easy to communicate to users

**Comparison to Competitors:**
```
Traditional DeFi Platforms:
├─ Deposit fee: 0-0.5% ✅ Similar
├─ Performance fee: 10-20% ❌ We charge 0%
├─ Withdrawal fee: 0.5-2% ❌ We charge 0%
└─ Management fee: 2% annually ❌ We charge 0%

DefiCity is 10-20% cheaper than alternatives!
```

### Fee Configuration

**Maximum Fee Caps (Security)**
- Building fee: Max 5% (current: 0.05%)
- Can only be updated by protocol owner (DAO in future)
- All fee changes announced 48 hours in advance

**Fee Distribution**
- 100% of fees go to Treasury
- Treasury funds:
  - Development & operations (60%)
  - Marketing & user acquisition (25%)
  - Paymaster gas sponsorship (10%)
  - Bug bounties & audits (5%)

---

## 8. Account Abstraction & User Experience

### Why Account Abstraction?

**Problem with Traditional DeFi:**
- Users need MetaMask/wallet extension
- Users need ETH for gas on every transaction
- Users need to approve every action
- Complex UX scares away mainstream users

**DefiCity Solution:**
- Email/social login (no wallet needed)
- Gasless gameplay (protocol pays gas)
- Session keys (no repeated approvals)
- Feel like a normal app, not blockchain

### Transaction Type System

DefiCity uses **TWO** distinct transaction types for optimal UX and security:

#### Regular Transactions (User Pays Gas)
**Used for:** Wallet & fund management operations

**Why user pays:**
- High-security operations requiring explicit user approval
- Ensures user intent for financial operations
- No dependency on paymaster infrastructure

**Operations:**
1. Create Smart Wallet (~$2.50 one-time)
2. Deposit USDC to Wallet (~$0.30)
3. Withdraw USDC from Wallet (~$0.30)
4. Create Session Key (~$0.50 one-time)

**Total Setup Cost:** ~$3.30 (one-time only)

#### UserOperations (Gasless - Sponsored by Paymaster)
**Used for:** In-game actions

**Why sponsored:**
- Better UX (no gas friction during gameplay)
- Encourages user activity
- Attracts more users

**Operations:**
1. Place Building (FREE)
2. Deposit to existing Building (FREE)
3. Harvest Yield (FREE)
4. Demolish Building (FREE)

**User Savings:** ~65% reduction vs traditional approach

### Session Key System

**What are Session Keys?**
- Temporary keys that allow gasless transactions
- Created once per 24 hours
- No need to approve every single action
- Think of it like "staying logged in"

**Security Features:**
- **Time-bound:** Expire after 24 hours automatically
- **Spending Limit:** Max 1,000 USDC per key
- **Contract Restriction:** Can only call DefiCityCore
- **Function Restriction:** Can only call approved functions (place, harvest, demolish)
- **Revocable:** User can revoke anytime
- **Monitored:** System tracks spending, auto-revokes if suspicious

**User Experience:**
1. First gameplay action → System creates session key (user approves once)
2. Next 24 hours → All actions are instant, no approvals needed
3. After 24 hours → System auto-refreshes key (if user still active)
4. On logout → Session key deleted

**Example Flow:**
```
Day 1, 9:00 AM - User places first building
├─ System: "Allow DefiCity to act on your behalf for 24 hours?"
├─ User: Approves (one-time)
└─ Session key created

Day 1, 9:05 AM - User places second building
├─ No approval needed
└─ Transaction submitted instantly

Day 1, 10:00 AM - User harvests yield
├─ No approval needed
└─ Transaction submitted instantly

Day 2, 9:00 AM - Session key expired
├─ System auto-refreshes (user just confirms once)
└─ Another 24 hours of gasless gameplay

User logs out
├─ Session key revoked immediately
└─ Next login will require new key
```

### Paymaster System

**What is a Paymaster?**
- Smart contract that sponsors gas fees for users
- DefiCity's paymaster covers gameplay transaction costs
- Users play for free, protocol absorbs gas costs

**Gas Sponsorship Limits (Prevent Abuse):**
```
Per User Limits:
├─ Daily gas allowance: 500 USDC worth of gas (~1,000 transactions)
├─ Per transaction: 0.5 USDC max
└─ Lifetime free transactions: Unlimited

Global Limits:
├─ Daily protocol-wide: 10,000 USDC gas budget
├─ Per transaction: 0.5 USDC max
└─ Emergency pause: If budget exhausted
```

**Fallback Mechanism:**
- If paymaster exhausted → User can choose to pay gas themselves
- Clear notification shown to user
- User can continue playing (not blocked)

**Paymaster Funding:**
- Initial funding: $50,000 in ETH
- Auto-refill: When balance < $10,000
- Monitoring: 24/7 alerts if low
- Source: Protocol treasury (from fees)

### Smart Wallet Features

**Standard Features:**
- ERC-4337 compliant
- Passkey authentication (WebAuthn)
- Session key management
- Guardian recovery
- Upgrade path (UUPS proxy)

**Security Features:**
- Multi-signature support (future)
- Spending limits (via session keys)
- Transaction whitelisting
- Time-delayed withdrawals (optional)
- Fraud monitoring

**User Benefits:**
- No seed phrase to remember
- Recover wallet with email/guardians
- Works on any device
- Native mobile support

### Gas Cost Expectations

**Setup Costs (One-Time, User Pays):**
```
Create Smart Wallet:    $2.50  ✅ One-time cost
Deposit USDC:           $0.30  ✅ Per deposit from external wallet
Create Session Key:     $0.50  ✅ One-time per 24 hours

Total Setup:           ~$3.30  ✅ Unlock unlimited gameplay
```

**Gameplay Costs (Sponsored, FREE):**
```
Place Building:        $0.00  ✨ Paymaster sponsors
Deposit More:          $0.00  ✨ Paymaster sponsors
Harvest Yield:         $0.00  ✨ Paymaster sponsors (unlimited)
Demolish:              $0.00  ✨ Paymaster sponsors

Total Gameplay:        $0.00  ✨ Completely FREE
```

**Withdrawal Costs (User Pays):**
```
Withdraw to EOA:       $0.30  ✅ Final withdrawal
```

**Savings Comparison:**
```
Without Account Abstraction (Traditional):
├─ Wallet setup: $0 (use existing)
├─ Every deposit: $0.30
├─ Every placement: $0.80
├─ Every harvest: $0.50
├─ Every demolish: $0.80
└─ Total for 10 actions: ~$10.20

With DefiCity Account Abstraction:
├─ Wallet setup: $3.30 (one-time)
├─ Unlimited gameplay: $0.00
└─ Total for 10 actions: $3.30

Savings: ~65% cheaper!
```

---

## 9. Security & Safety Requirements

### Smart Contract Security

**SEC-001: Audit Requirements**
- Full security audit by reputable firm before mainnet
- Minimum 2 auditors (CertiK, OpenZeppelin, Trail of Bits, etc.)
- All critical/high findings resolved
- Audit report published publicly
- Re-audit after any major changes

**SEC-002: Bug Bounty Program**
- Launch bug bounty on Immunefi
- Rewards: $1,000 (low) to $100,000 (critical)
- Scope: All core contracts
- Publicly announced on launch day

**SEC-003: Emergency Mechanisms**
- Pause function on Core contract (owner only)
- Emergency withdraw function (when paused)
- Timelock on admin actions (48 hours)
- Multi-sig wallet as owner (3/5 threshold)

**SEC-004: Upgrade Controls**
- Core contract is immutable (state never changes)
- Module swaps require multi-sig + timelock
- Strategy upgrades announced 7 days in advance
- Users notified of all changes

### User Fund Safety

**SEC-005: Fund Custody**
- User funds stored in individual smart wallets (non-custodial)
- Protocol cannot access user funds directly
- Withdrawals only to user's wallet or approved addresses
- No admin keys that can steal funds

**SEC-006: Protocol Integration Risks**
- Only integrate with audited, battle-tested protocols
- Aave V3: $10B+ TVL, multiple audits, 3+ years live
- Aerodrome: Velodrome fork, audited, Base-native
- Emergency withdraw bypasses strategy if protocol fails

**SEC-007: Oracle & Price Feed Security**
- Use Chainlink oracles for price feeds (Base)
- Fallback to Uniswap TWAP if oracle fails
- Sanity checks on price movements (>10% = reject)
- No reliance on centralized APIs

### Session Key Security

**SEC-008: Session Key Restrictions**
- Time limit: 24 hours maximum
- Spending limit: 1,000 USDC per key
- Contract whitelist: Only DefiCityCore
- Function whitelist: Only approved gameplay functions
- Revocable: User can revoke anytime
- Auto-revoke: On suspicious activity (>10 transactions/minute)

**SEC-009: Session Key Storage**
- Encrypted in browser localStorage
- Never sent to backend servers
- Deleted on logout
- New key required after expiry

### Paymaster Security

**SEC-010: Gas Sponsorship Limits**
- Per-user daily limit: 500 USDC worth of gas
- Global daily limit: 10,000 USDC worth of gas
- Per-transaction limit: 0.5 USDC worth of gas
- Rate limiting: Max 10 transactions/minute per user
- Signature verification: All UserOps must be signed by valid session key

**SEC-011: Paymaster Monitoring**
- Real-time alerts if balance < $10,000
- Auto-pause if exhausted
- Daily reports on gas spending
- Fraud detection (unusual patterns)

### Smart Wallet Security

**SEC-012: Wallet Recovery**
- Guardian-based recovery (2/3 threshold)
- 48-hour timelock on recovery
- Recovery can be cancelled by owner
- Guardians cannot steal funds, only change ownership

**SEC-013: Wallet Upgrade**
- UUPS upgradeable pattern
- Upgrade controlled by owner only
- Timelock on upgrades (7 days)
- Opt-in: Users can stay on old version

### Frontend Security

**SEC-014: Connection Security**
- All connections HTTPS only
- CSP headers to prevent XSS
- No inline scripts
- Subresource integrity for CDN files

**SEC-015: Input Validation**
- All user inputs sanitized
- Amount limits enforced on frontend and contract
- Address validation (checksum)
- Transaction preview before signing

### Operational Security

**SEC-016: Access Control**
- Multi-sig wallet (3/5) as protocol owner
- Separate wallets for different roles:
  - Owner: Admin operations
  - Treasury: Fee collection
  - Paymaster: Gas sponsorship
  - Emergency: Pause function only
- Regular key rotation

**SEC-017: Monitoring & Alerts**
- 24/7 monitoring of all contracts
- Alerts for:
  - Unusual transaction volumes
  - Failed transactions spike
  - Price oracle deviation
  - Paymaster balance low
  - Contract paused
- Incident response plan documented

### Compliance & Legal

**SEC-018: Terms of Service**
- Clear ToS before account creation
- Risk disclaimers for each building type
- Prohibited jurisdictions enforced (if any)
- Privacy policy (GDPR compliant)

**SEC-019: KYC/AML (Future)**
- No KYC required at launch (permissionless)
- If required by regulation:
  - KYC for deposits > $10,000
  - AML monitoring for suspicious activity
  - Partnership with compliant provider

---

## 10. Technical Architecture

### High-Level System Design

**Layer 1: Frontend (Next.js 14)**
- React-based UI
- Wagmi + Viem for Web3 interactions
- Account Abstraction SDK integration
- Real-time updates via WebSocket
- Responsive design (mobile-first)

**Layer 2: Account Abstraction**
- ERC-4337 EntryPoint (standard)
- DefiCity Smart Wallet (ERC-4337 compliant)
- DefiCity Paymaster (gas sponsorship)
- Bundler service (StackUp or custom)

**Layer 3: Smart Contracts (Solidity 0.8.24)**
- DefiCityCore (immutable state storage)
- StrategyRegistry (swappable module)
- BuildingManager (swappable module)
- FeeManager (swappable module)
- EmergencyManager (swappable module)

**Layer 4: DeFi Strategies**
- AaveStrategy (USDC lending)
- AerodromeStrategy (LP providing)
- Future: LidoStrategy, CompoundStrategy, etc.

**Layer 5: External Protocols (Base Chain)**
- Aave V3
- Aerodrome
- Chainlink Oracles
- USDC (Circle)

### Architecture Philosophy: Modular (No Proxy)

**Why No Proxy Pattern?**

Traditional DeFi uses UUPS or Transparent Proxy for upgradeability:
- ❌ High gas overhead (delegatecall)
- ❌ Storage collision risks
- ❌ Complex to audit
- ❌ Admin can change any logic (trust issue)

**DefiCity Approach: Modular Architecture**
- ✅ Lower gas costs (~60k saved per transaction)
- ✅ Immutable core (user state never changes)
- ✅ Swappable modules (logic can be upgraded)
- ✅ Clear separation (state vs logic)
- ✅ Easier to audit
- ✅ More trustless (state immutable)

**What's Upgradeable:**
- Strategy routing (via StrategyRegistry)
- Building operation logic (via BuildingManager)
- Fee calculation (via FeeManager)
- Emergency procedures (via EmergencyManager)
- Individual strategies (new versions can be deployed)

**What's Immutable:**
- Core contract (state storage)
- User data (cities, buildings, balances)

**How Upgrades Work:**
1. Deploy new module (e.g., BuildingManagerV2)
2. Multi-sig + timelock approves
3. Core contract updated to point to new module
4. New logic applies to all future transactions
5. Old state remains intact

### Blockchain: Base (Ethereum L2)

**Why Base?**
- Low gas fees (~$0.01 per transaction)
- Fast confirmations (~2 seconds)
- Ethereum security (optimistic rollup)
- Growing DeFi ecosystem (Aave, Aerodrome, etc.)
- Coinbase-backed (legitimacy)
- Onramp support (buy crypto with fiat)

**Base Chain Specifications:**
- Chain ID: 8453 (mainnet), 84532 (testnet)
- Block time: ~2 seconds
- Gas token: ETH
- RPC: https://mainnet.base.org

**Deployment Plan:**
1. Base Sepolia (testnet) - Testing phase (4 weeks)
2. Base Mainnet - Public launch (after audit)

### Smart Contract Design

**Contract 1: DefiCityCore**
- Role: State storage and coordination
- Responsibilities:
  - Store user cities and buildings
  - Store building type configurations
  - Handle USDC transfers
  - Coordinate module calls
  - Emergency pause
- Upgrade: Immutable (cannot be changed)
- Gas: ~220k per building placement

**Contract 2: StrategyRegistry**
- Role: Map building types to DeFi strategies
- Responsibilities:
  - Register new strategies
  - Activate strategies for building types
  - Track version history
  - Deprecate old strategies
- Upgrade: Swappable (new registry can be deployed)

**Contract 3: BuildingManager**
- Role: Handle building operation logic
- Responsibilities:
  - Validate building placements
  - Calculate and collect fees
  - Deposit to strategies
  - Handle harvest/demolish
- Upgrade: Swappable

**Contract 4: FeeManager**
- Role: Calculate and collect fees
- Responsibilities:
  - Calculate building creation fee (0.05%)
  - Transfer fees to treasury
  - Update fee configuration (owner only, max 5%)
- Upgrade: Swappable

**Contract 5: EmergencyManager**
- Role: Handle emergency situations
- Responsibilities:
  - Emergency withdraw when paused
  - Bypass normal checks in emergency
  - Force withdraw from strategies
- Upgrade: Swappable

**Contract 6: AaveStrategy**
- Role: Interact with Aave V3 protocol
- Responsibilities:
  - Deposit USDC to Aave
  - Withdraw USDC from Aave
  - Harvest interest
  - Track user shares
- Upgrade: Can deploy new version, register in StrategyRegistry

**Contract 7: AerodromeStrategy**
- Role: Interact with Aerodrome protocol
- Responsibilities:
  - Swap USDC to USDC/ETH 50/50
  - Add liquidity to pool
  - Remove liquidity
  - Claim rewards
  - Track user shares
- Upgrade: Can deploy new version, register in StrategyRegistry

### Data Flow Examples

**Example 1: User Places Building**
```
1. User (Frontend)
   - Clicks tile, selects "Yield Farm", enters 1,000 USDC
   - Frontend creates UserOperation (gasless)

2. Bundler
   - Receives UserOperation
   - Submits to EntryPoint contract

3. EntryPoint (ERC-4337)
   - Validates UserOperation signature
   - Calls Paymaster to sponsor gas

4. Paymaster
   - Checks user gas limit (not exceeded)
   - Checks global gas limit (not exceeded)
   - Approves gas sponsorship

5. EntryPoint
   - Executes: Smart Wallet → DefiCityCore.placeBuilding()

6. DefiCityCore
   - Transfers USDC from Smart Wallet to Core
   - Calls BuildingManager.placeBuilding()

7. BuildingManager
   - Validates building type and amount
   - Calculates fee (0.05% = 0.5 USDC)
   - Gets strategy from StrategyRegistry
   - Calls FeeManager.collectFee(0.5 USDC)
   - Calls AaveStrategy.deposit(999.5 USDC)

8. AaveStrategy
   - Approves USDC to Aave Pool
   - Calls Aave Pool.supply(999.5 USDC)
   - Receives aUSDC tokens
   - Returns shares to BuildingManager

9. BuildingManager
   - Returns shares to DefiCityCore

10. DefiCityCore
    - Stores building data:
      {
        buildingType: 1,
        depositedAmount: 1000 USDC,
        shares: X,
        createdAt: block.timestamp,
        isActive: true
      }
    - Emits BuildingPlaced event

11. Frontend
    - Listens for event
    - Updates UI (shows building on map)
    - Displays success message
```

**Example 2: User Harvests Yield**
```
1. User clicks "Harvest" on building with pending rewards

2. Frontend
   - Creates UserOperation for harvest()

3. Gasless transaction flow (via bundler/paymaster)

4. DefiCityCore.harvest(buildingId)
   - Delegates to BuildingManager.harvest()

5. BuildingManager
   - Gets strategy from registry
   - Calls AaveStrategy.harvest(user)

6. AaveStrategy
   - Calculates yield:
     currentValue = aUSDC.balanceOf(this)
     deposited = userDeposits[user]
     yield = currentValue - deposited
   - Updates userDeposits[user] (mark as harvested)
   - Returns yield amount

7. BuildingManager
   - Returns yield to DefiCityCore

8. DefiCityCore
   - Transfers USDC to user's Smart Wallet
   - Updates user's totalEarned
   - Emits Harvest event

9. Frontend
   - Updates wallet balance
   - Shows "Harvested X USDC" notification
```

---

## 11. User Journey

### New User Journey

**Step 1: Discovery (Pre-App)**
- User hears about DefiCity from:
  - Social media (Twitter, Discord, Reddit)
  - Crypto news sites
  - Friend referral
  - Base chain ecosystem promotion
- User clicks link, lands on website
- **Time:** 30 seconds

**Step 2: Learn (Landing Page)**
- User sees:
  - Hero section: "Build Your DeFi City"
  - Value prop: "Earn real yield through gameplay"
  - Features: Gasless, Simple, Secure
  - Building types with APY
  - How it works (4 steps)
- User clicks "Start Building"
- **Time:** 1-2 minutes

**Step 3: Account Creation**
- User prompted for login method:
  - Email
  - Google
  - Apple
  - Passkey (advanced users)
- User selects Google
- Google OAuth flow
- System creates smart wallet automatically
- User sees: "Wallet created! Address: 0x..."
- **Time:** 30 seconds

**Step 4: Initial Deposit**
- User sees dashboard with $0 balance
- Prompted: "Deposit assets to start building"
- User options:
  - Transfer from external wallet (MetaMask, Coinbase Wallet)
  - Buy with card (via Ramp/MoonPay) - Future
- User selects "Transfer from Coinbase Wallet"
- User chooses asset: USDC, USDT, ETH, or BTC
- User selects USDC (for simplicity)
- User approves transaction ($0.30 gas)
- 500 USDC deposited
- Balance shows: $500 USDC
- Note: Multi-asset balance supported (can deposit multiple assets)
- **Time:** 1-2 minutes

**Step 5: Tutorial (Optional)**
- System offers tutorial: "New to DefiCity? Take 2-minute tour"
- User accepts
- Tutorial shows:
  - How to place buildings (any building, no requirements)
  - Different building types (Bank, Shop, Lottery, Town Hall)
  - Multi-asset support (can use USDC, USDT, ETH, BTC)
  - How to harvest (for Bank and Shop)
  - How to claim prizes (for Lottery)
  - How to withdraw
- User can skip anytime
- **Time:** 2 minutes (optional)

**Step 6: First Building**
- User clicks empty tile
- System shows all available buildings (no unlock requirements):
  - Town Hall (Free, creates wallet visual)
  - Bank (Supply/Borrow, Medium risk, $100 min)
  - Shop (LP, High risk, $500 min)
  - Lottery (Entertainment, Very High risk, $10 min)
- System recommends: "Start with Bank for steady returns"
- User selects "Bank"
- Modal shows:
  - Type: Supply & Borrow (Aave)
  - Supported assets: USDC, USDT, ETH, BTC
  - Minimum: $100
  - Supply APY: ~4% (for USDC)
  - Risk: Medium
  - Fee: 0.05%
  - Recommended: $200-500
- User selects USDC (already has it)
- User enters: 200 USDC
- User chooses: "Supply only" (no borrowing for now)
- System shows:
  - Building fee: $0.10
  - Net to Aave: $199.90
  - Expected yearly: ~$8.00
- User confirms
- System creates session key (one-time approval)
- Building placed (gasless, ~10 seconds)
- Building appears on map with animation
- **Time:** 1-2 minutes

**Step 7: First Yield**
- User waits 1 day
- Returns to app
- Building shows: "Pending Rewards: $0.03"
- User clicks building
- User clicks "Harvest"
- System harvests (gasless, ~5 seconds)
- Wallet balance increases: $500 → $500.03
- User sees success message: "Harvested $0.03!"
- **Time:** 30 seconds

**Step 8: Expansion**
- User explores other building types
- User places Town Hall (free) - Visual representation of wallet
- User deposits 100 USDT to try different asset
- User places Bank with USDT (supply mode)
- User feels adventurous, deposits 500 USDC
- User places Shop (USDC/ETH LP) for higher returns
- User buys 2 lottery tickets ($20) for fun
- User now has:
  - 1 Town Hall (wallet representation)
  - 2 Banks: 200 USDC + 100 USDT (~4% APY)
  - 1 Shop: 500 USDC (~12% APY with fees)
  - 2 Lottery tickets (waiting for draw)
  - Total invested: ~$820 (excluding lottery)
  - Expected yearly: ~$64 (excluding lottery)
- **Time:** 5-10 minutes

**Total Onboarding Time:** 10-15 minutes from discovery to multiple buildings

### Returning User Journey

**Daily User (Power User)**
- Day 1: Login (instant, session key valid)
- Day 1: Check buildings (pending rewards visible)
- Day 1: Harvest all (gasless, batch or individual)
- Day 1: Check news/updates
- Day 1: Logout
- **Time:** 2-3 minutes per day

**Weekly User (Casual)**
- Week 1: Login
- Week 1: See week's accumulated yield
- Week 1: Harvest (~$1-5)
- Week 1: Maybe add new building or deposit more
- Week 1: Logout
- **Time:** 5 minutes per week

**Monthly User (Passive Investor)**
- Month 1: Login
- Month 1: See month's yield (~$5-20)
- Month 1: Harvest all
- Month 1: Review performance
- Month 1: Decide: Reinvest or withdraw
- **Time:** 10 minutes per month

### Withdrawal Journey

**Full Withdrawal (User Wants to Cash Out)**
- User logs in
- User clicks "Demolish" on each building
  - System shows: "You'll receive: $XXX (principal + yield)"
  - User confirms
  - Funds transferred to smart wallet (gasless)
- User repeats for all buildings
- User has all funds in smart wallet
- User clicks "Withdraw"
  - Selects amount
  - Enters destination address (external wallet)
  - Pays gas (~$0.30)
- USDC sent to external wallet
- User can cash out on CEX
- **Time:** 5-10 minutes

---

## 12. Success Metrics

### User Metrics

**UM-001: User Acquisition**
- Target: 10,000 users in 6 months
- KPI: 500+ new signups per week (avg)
- Measure: User registration count
- Target Sources:
  - Organic: 40%
  - Social media: 30%
  - Referrals: 20%
  - Partnerships: 10%

**UM-002: User Activation**
- Target: 70% of signups place at least 1 building
- KPI: Activation rate
- Measure: (Users with buildings / Total signups) * 100
- Timeframe: Within 7 days of signup

**UM-003: User Retention**
- Target: 60% return within 7 days
- KPI: 7-day retention rate
- Measure: (Users active Day 7 / Users active Day 1) * 100
- Breakdown:
  - Day 1: 100% (baseline)
  - Day 3: 70%
  - Day 7: 60%
  - Day 30: 40%

**UM-004: Daily Active Users (DAU)**
- Target: 30% of total users
- KPI: DAU
- Measure: Unique users who login per day
- Timeframe: Rolling 30-day average

**UM-005: User Engagement**
- Target: 10+ minutes avg session time
- KPI: Session duration
- Measure: Time from login to logout
- Target Actions per Session:
  - View buildings: 5+
  - Harvest: 1-3
  - Place building: 0.5 (every other session)

### Business Metrics

**BM-001: Total Value Locked (TVL)**
- Target: $5M in 3 months, $50M in 12 months
- KPI: Total USDC locked in all strategies
- Measure: Sum of all building values
- Breakdown:
  - Month 1: $1M
  - Month 3: $5M
  - Month 6: $15M
  - Month 12: $50M

**BM-002: Average Deposit per User**
- Target: $1,000 per user
- KPI: TVL / Total Users
- Measure: Total deposits / Active users
- Benchmarks:
  - New users: $200-500
  - Active users: $1,000-2,000
  - Power users: $5,000+

**BM-003: Revenue (Fees)**
- Target: $25,000 in 6 months
- KPI: Total fees collected
- Measure: FeeManager.totalFeesCollected
- Breakdown (cumulative):
  - Month 1: $500
  - Month 3: $2,500
  - Month 6: $10,000
  - Month 12: $50,000

**BM-004: User Lifetime Value (LTV)**
- Target: $50 per user
- KPI: Total fees per user
- Measure: Total fees / Total users
- Calculation:
  - Avg deposit: $1,000
  - Fee: 0.05% = $0.50 per building
  - Avg buildings: 3-5
  - Avg fee per user: $1.50-2.50
  - Assuming 20x rebuilds over lifetime: $30-50

### Product Metrics

**PM-001: Buildings Created**
- Target: 35,000 buildings in 6 months
- KPI: Total buildings placed
- Measure: BuildingPlaced events
- Breakdown by type:
  - Town Hall: 5,000 (0.5 per user - optional)
  - Bank: 20,000 (2 per user avg)
  - Shop: 3,000 (0.3 per user avg)
  - Lottery: 12,000 tickets (1.2 per user avg - entertainment)

**PM-002: Harvest Frequency**
- Target: 1 harvest per user per 3 days
- KPI: Harvests per user per month
- Measure: Harvest events / Active users
- Benchmarks:
  - Daily users: 1-2 harvests/day
  - Weekly users: 1 harvest/week
  - Monthly users: 1 harvest/month

**PM-003: Strategy Distribution**
- Target: 60% Bank (Aave), 25% Shop (Aerodrome), 15% Lottery
- KPI: TVL by strategy (excluding lottery tickets)
- Measure: (Strategy TVL / Total TVL) * 100
- Reasoning:
  - Bank is versatile (supply + borrow), attracts most users
  - Shop for experienced users seeking higher yields
  - Lottery for entertainment (generates revenue but not TVL)

**PM-004: Average APY Earned**
- Target: 6.5% blended APY
- KPI: Weighted avg APY across all buildings (excluding lottery)
- Measure: (Bank APY * Bank TVL + Shop APY * Shop TVL) / Total TVL
- Components:
  - Bank: ~4% APY (supply only) or variable (with borrowing) - 60% of TVL
  - Shop: ~12% APY (LP + AERO rewards) - 25% of TVL
  - Lottery: -30% EV (entertainment only) - 15% of spending
  - Blended: ~6.5% APY (DeFi only)

### Technical Metrics

**TM-001: Transaction Success Rate**
- Target: 99%+
- KPI: Successful transactions / Total transactions
- Measure: Monitor all UserOperations
- Failure categories:
  - User error (insufficient funds): Not counted
  - Contract revert: Investigate
  - Paymaster rejection: Investigate

**TM-002: Average Transaction Time**
- Target: <10 seconds (building placement)
- KPI: Time from submission to confirmation
- Measure: Timestamp delta
- Breakdown:
  - UserOp creation: <1s
  - Bundler submission: <2s
  - On-chain confirmation: <5s
  - Frontend update: <2s

**TM-003: Paymaster Efficiency**
- Target: Sponsor 95%+ of gameplay transactions
- KPI: Sponsored transactions / Total gameplay transactions
- Measure: Paymaster gas spent
- Budget: $10,000/month for 50,000 transactions

**TM-004: Smart Contract Gas Costs**
- Target: <250k gas per building placement
- KPI: Average gas used per operation
- Measure: Transaction gas used
- Benchmarks:
  - Place building: ~220k
  - Deposit: ~160k
  - Harvest: ~110k
  - Demolish: ~190k

### Financial Metrics

**FM-001: Customer Acquisition Cost (CAC)**
- Target: <$50 per user
- KPI: Marketing spend / New users
- Measure: Total marketing budget / Signups
- Breakdown:
  - Organic: $0
  - Social ads: $20-30/user
  - Partnerships: $10-20/user
  - Referrals: $5-10/user

**FM-002: Return on Investment (ROI)**
- Target: 3x within 12 months
- KPI: Revenue / Total costs
- Measure: (Fees + Token value) / (Dev + Marketing + Ops)
- Components:
  - Revenue: Fees + future token appreciation
  - Costs: Development + Marketing + Operations + Gas

**FM-003: Burn Rate**
- Target: <$50,000/month
- KPI: Monthly expenses
- Measure: Salaries + Infra + Gas + Marketing
- Breakdown:
  - Salaries: $30,000/month (5 people)
  - Infrastructure: $2,000/month
  - Paymaster gas: $5,000/month
  - Marketing: $10,000/month
  - Other: $3,000/month

**FM-004: Runway**
- Target: 18+ months
- KPI: Treasury / Burn rate
- Measure: Months until $0 (at current burn)
- Assumptions:
  - Initial treasury: $500,000
  - Monthly burn: $50,000
  - Monthly revenue: $2,000 (avg)
  - Runway: ~10 months initially, extends with revenue

---

## 13. Risk Management

### Technical Risks

**RISK-001: Smart Contract Vulnerability**
- **Severity:** CRITICAL
- **Probability:** Low (with proper audit)
- **Impact:** Loss of user funds, protocol shutdown
- **Mitigation:**
  - Multiple security audits before mainnet
  - Bug bounty program
  - Gradual rollout (testnet → limited mainnet → full launch)
  - Emergency pause function
  - Insurance fund (future)
- **Contingency:**
  - Pause protocol immediately
  - Emergency withdraw for users
  - Reimburse affected users from insurance/treasury

**RISK-002: DeFi Protocol Failure (Aave, Aerodrome)**
- **Severity:** HIGH
- **Probability:** Low (for Aave), Medium (for Aerodrome)
- **Impact:** Loss of funds in affected strategy
- **Mitigation:**
  - Only integrate battle-tested protocols
  - Diversify across multiple protocols
  - Emergency withdraw function
  - Monitor protocol health 24/7
- **Contingency:**
  - Pause affected strategy
  - Notify users immediately
  - Facilitate emergency withdrawals
  - Compensate if protocol has insurance (Aave does)

**RISK-003: Oracle Manipulation**
- **Severity:** MEDIUM
- **Probability:** Low (using Chainlink)
- **Impact:** Incorrect pricing, potential exploits
- **Mitigation:**
  - Use Chainlink (most secure oracles)
  - Implement price sanity checks (>10% change = reject)
  - Fallback to TWAP if oracle fails
- **Contingency:**
  - Pause protocol if oracle fails
  - Manual intervention by team

**RISK-004: Paymaster Exhaustion**
- **Severity:** MEDIUM
- **Probability:** Medium
- **Impact:** Users must pay gas (bad UX)
- **Mitigation:**
  - Fund paymaster with $50k ETH initially
  - Auto-refill when balance < $10k
  - Per-user gas limits (prevent abuse)
  - Global gas limit (prevent drain)
- **Contingency:**
  - Users can switch to paying gas themselves
  - Refill paymaster ASAP
  - Notify users of temporary issue

**RISK-005: High Gas Costs on Base**
- **Severity:** LOW
- **Probability:** Medium (if Base congested)
- **Impact:** Higher paymaster costs, worse UX
- **Mitigation:**
  - Base typically has low gas (<$0.01)
  - Optimize contract gas usage
  - Batch transactions when possible
- **Contingency:**
  - Increase paymaster budget
  - Pause new signups temporarily if unsustainable

### Business Risks

**RISK-006: Low User Adoption**
- **Severity:** HIGH
- **Probability:** Medium
- **Impact:** Low TVL, low revenue, project failure
- **Mitigation:**
  - Extensive marketing pre-launch
  - Incentivize early adopters (referral rewards)
  - Partner with Base ecosystem projects
  - Community building (Discord, Twitter)
  - Regular content creation (tutorials, updates)
- **Contingency:**
  - Pivot marketing strategy
  - Add token incentives (launch token)
  - Offer deposit bonuses

**RISK-007: Negative User Feedback**
- **Severity:** MEDIUM
- **Probability:** Medium
- **Impact:** Churn, bad reputation
- **Mitigation:**
  - Extensive user testing before launch
  - Clear onboarding and tutorials
  - Responsive support team (<24h response)
  - Regular user surveys
  - Implement top feature requests
- **Contingency:**
  - Address issues immediately
  - Public roadmap for improvements
  - Transparent communication

**RISK-008: Competitor Launches Similar Product**
- **Severity:** MEDIUM
- **Probability:** High (crypto moves fast)
- **Impact:** Market share loss
- **Mitigation:**
  - Be first to market on Base
  - Build strong community early
  - Focus on superior UX
  - Continuous innovation
- **Contingency:**
  - Differentiate with unique features
  - Lower fees temporarily
  - Exclusive partnerships

**RISK-009: DeFi Yield Rates Drop**
- **Severity:** MEDIUM
- **Probability:** Medium (market-dependent)
- **Impact:** Less attractive to users
- **Mitigation:**
  - Diversify strategy options
  - Integrate higher-yield protocols (with acceptable risk)
  - Add token incentives on top of DeFi yield
- **Contingency:**
  - Launch protocol token with rewards
  - Subsidize yields from treasury (short-term)

### Regulatory Risks

**RISK-010: Regulatory Crackdown on DeFi**
- **Severity:** HIGH
- **Probability:** Low (for now)
- **Impact:** Forced shutdown, legal issues
- **Mitigation:**
  - Decentralized architecture (no central control)
  - Non-custodial (users control funds)
  - No securities (no protocol token at launch)
  - Legal entity in friendly jurisdiction
  - Consult with crypto lawyers
- **Contingency:**
  - Implement KYC if required
  - Geo-fence prohibited jurisdictions
  - Transition to DAO governance

**RISK-011: USDC Depeg or Ban**
- **Severity:** HIGH
- **Probability:** Very Low
- **Impact:** Loss of value, panic withdrawals
- **Mitigation:**
  - USDC is most trusted stablecoin (Circle, regulated)
  - Aave has safety mechanisms
  - Monitor USDC health
- **Contingency:**
  - Enable emergency withdrawals
  - Support alternative stablecoins (USDT, DAI)
  - Pause protocol until resolved

### Operational Risks

**RISK-012: Team Departure**
- **Severity:** MEDIUM
- **Probability:** Medium
- **Impact:** Development slowdown
- **Mitigation:**
  - Fair equity/compensation
  - Vesting schedules
  - Knowledge documentation
  - Hiring pipeline ready
- **Contingency:**
  - Cross-train team members
  - Hire replacements quickly
  - Community contributors

**RISK-013: Insufficient Funding**
- **Severity:** HIGH
- **Probability:** Low (initial funding secured)
- **Impact:** Project shutdown
- **Mitigation:**
  - Conservative burn rate (<$50k/month)
  - Revenue from fees
  - Fundraising from VCs (planned)
  - Treasury diversification
- **Contingency:**
  - Reduce team size
  - Cut marketing budget
  - Seek emergency funding
  - Launch token (if desperate)

---

## 14. Constraints & Assumptions

### Technical Constraints

**TC-001: Base Chain Limitations**
- Block time: ~2 seconds (cannot be faster)
- Gas costs: Subject to Base network congestion
- Smart contract size: 24KB limit per contract
- EVM compatibility: Must work with Solidity limitations

**TC-002: DeFi Protocol Dependencies**
- Aave APY: Variable (currently ~5%, can change)
- Aerodrome APY: Highly variable (depends on trading volume)
- Protocol availability: 99.9% uptime assumed
- Integration: Must follow protocol interfaces

**TC-003: Account Abstraction Limitations**
- Bundler dependency: Third-party service (StackUp, etc.)
- Paymaster funding: Requires continuous funding
- User experience: 2-10 second delay for transactions
- Session key security: 24-hour expiry, limits functionality

**TC-004: Frontend Constraints**
- Browser support: Modern browsers only (Chrome, Brave, Firefox)
- Mobile: Responsive design, not native app (initially)
- Web3 wallet: Optional (not required for social login users)
- Offline: Not supported (requires blockchain connection)

### Business Constraints

**BC-001: Budget Constraints**
- Initial funding: $500,000 (assumed)
- Monthly burn: <$50,000
- Runway: 10 months (without revenue)
- Must reach profitability or raise more funds

**BC-002: Team Constraints**
- Team size: 5 people (2 FS, 2 QA, 1 UI)
- Development timeline: 16 weeks to launch
- Support capacity: Limited initially (self-service focus)
- No 24/7 team (monitoring only)

**BC-003: Marketing Constraints**
- Marketing budget: $10,000/month
- No celebrity endorsements (too expensive)
- Organic growth focus (community-driven)
- Limited PR budget

**BC-004: Legal Constraints**
- No KYC at launch (permissionless)
- Terms of Service required
- Risk disclaimers required
- Cannot market as "investment" or "guarantee returns"

### Assumptions

**AS-001: Market Assumptions**
- DeFi interest continues (not a bear market crash)
- Base chain grows (more users, more liquidity)
- Stablecoins remain stable (USDC doesn't depeg)
- Gas fees on Base remain low (<$0.01)

**AS-002: User Assumptions**
- Users have ~$500-1,000 to invest
- Users understand basic concept of yield
- Users can use a web browser (no app required)
- Users have email or Google account

**AS-003: Technical Assumptions**
- Aave and Aerodrome continue operating
- ERC-4337 infrastructure matures (bundlers, paymasters)
- Base RPC is reliable (99.9% uptime)
- Smart contracts have no critical bugs (after audit)

**AS-004: Revenue Assumptions**
- 0.05% fee is acceptable to users
- Users will rebuild/rotate buildings (not just set-and-forget)
- Average user creates 3-5 buildings
- 20% of users are active monthly (create new buildings)

---

## 15. Future Roadmap

### Phase 1: Launch (Months 1-3)

**Milestone 1.1: Testnet Launch (Month 1)**
- Deploy to Base Sepolia
- Internal testing by team
- Bug bounty program soft launch
- Community alpha testers (50-100 users)

**Milestone 1.2: Audit & Fixes (Month 2)**
- Security audit by 2 firms
- Fix all critical/high findings
- Re-audit if major changes
- Publish audit reports

**Milestone 1.3: Mainnet Launch (Month 3)**
- Deploy to Base Mainnet
- Public launch announcement
- Marketing campaign begins
- Target: 1,000 users, $1M TVL in first month

### Phase 2: Growth (Months 4-9)

**Milestone 2.1: New Building Types (Month 4-5)**
- Integrate Lido (ETH staking)
- Integrate Compound (alternative lending)
- Add more building types (Stake Camp, Treasury, etc.)
- Target: 5,000 users, $10M TVL

**Milestone 2.2: Social Features (Month 6-7)**
- Leaderboards (top cities by value)
- Friend system (visit friends' cities)
- Referral program (earn bonuses)
- Guild/Alliance system (group bonuses)
- Target: 10,000 users, $30M TVL

**Milestone 2.3: Advanced Features (Month 8-9)**
- Building upgrades (increase APY)
- Building synergies (adjacency bonuses)
- Quests/Achievements (gamification)
- NFT buildings (unique designs, limited edition)
- Target: 20,000 users, $50M TVL

### Phase 3: Expansion (Months 10-18)

**Milestone 3.1: Multi-Chain (Month 10-12)**
- Expand to Arbitrum
- Expand to Optimism
- Cross-chain bridge support
- Target: 50,000 users, $150M TVL

**Milestone 3.2: Mobile App (Month 13-15)**
- Native iOS app
- Native Android app
- Push notifications (yield ready, new features)
- Biometric authentication
- Target: 100,000 users, $300M TVL

**Milestone 3.3: DAO Launch (Month 16-18)**
- Launch protocol token (CITY)
- Governance system (vote on parameters)
- Token staking (boosted rewards)
- Community treasury
- Target: 200,000 users, $500M TVL

### Phase 4: Maturity (Months 19-24)

**Milestone 4.1: Marketplace (Month 19-21)**
- Buy/sell buildings (secondary market)
- NFT integration (buildings as NFTs)
- Building rental (lend buildings, share yield)
- Target: 300,000 users, $1B TVL

**Milestone 4.2: Advanced Strategies (Month 22-24)**
- Delta-neutral strategies (no IL)
- Leverage strategies (amplify yield)
- Auto-rebalancing (optimize yields)
- Custom strategies (users create own)
- Target: 500,000 users, $2B TVL

**Milestone 4.3: Institutional Support (Month 22-24)**
- API for third-party integrations
- White-label solution for partners
- Institutional vaults (higher minimums, custom strategies)
- Target: 1,000,000 users, $5B TVL

### Future Considerations (Beyond 24 Months)

- **Virtual Reality:** VR city builder experience
- **Metaverse:** Integrate with other metaverse projects
- **Real-World Assets:** Tokenized real estate, bonds, etc.
- **Cross-Protocol Aggregation:** Route to best yields automatically
- **Derivatives:** Options, futures on building yields
- **Social Impact:** Donate yield to charities, DAOs

---

## 16. Success Criteria

### Launch Success (Month 3)

**Primary Criteria:**
- ✅ 1,000+ active users
- ✅ $1M+ TVL
- ✅ Zero critical security incidents
- ✅ 99%+ transaction success rate
- ✅ 70%+ user activation rate (placed at least 1 building)

**Secondary Criteria:**
- ✅ Positive user feedback (4+ stars avg)
- ✅ Media coverage (3+ major crypto news sites)
- ✅ Community engagement (500+ Discord members)
- ✅ Low support ticket volume (<10/day)

### Growth Success (Month 12)

**Primary Criteria:**
- ✅ 20,000+ active users
- ✅ $50M+ TVL
- ✅ $50,000+ cumulative fees
- ✅ 60%+ 7-day retention rate
- ✅ 30%+ DAU/MAU ratio

**Secondary Criteria:**
- ✅ Profitable (revenue > costs) or fundraise secured
- ✅ 3+ integrated DeFi protocols
- ✅ Strong community (5,000+ Discord, 10,000+ Twitter)
- ✅ Partnerships with Base ecosystem projects

### Long-Term Success (Month 24)

**Primary Criteria:**
- ✅ 100,000+ active users
- ✅ $500M+ TVL
- ✅ $500,000+ cumulative fees
- ✅ DAO launched (decentralized governance)
- ✅ Multi-chain support (3+ chains)

**Secondary Criteria:**
- ✅ Top 10 DeFi platform by users on Base
- ✅ Industry recognition (awards, conference talks)
- ✅ Sustainable without external funding
- ✅ Mobile app launched

---

## Appendix A: Glossary

**Account Abstraction (ERC-4337):** A standard that allows users to have smart contract wallets instead of EOAs (Externally Owned Accounts), enabling features like gasless transactions and social recovery.

**Aave:** A decentralized lending protocol where users can lend and borrow crypto assets. DefiCity uses Aave for stablecoin lending strategies.

**Aerodrome:** A decentralized exchange (DEX) on Base, forked from Velodrome. DefiCity uses Aerodrome for liquidity providing strategies.

**APY (Annual Percentage Yield):** The yearly return on investment, including compound interest. Example: 5.2% APY means $100 becomes $105.20 after 1 year.

**Base:** An Ethereum Layer 2 (L2) blockchain developed by Coinbase. Low fees, fast transactions, EVM-compatible.

**Building:** In DefiCity, a building represents a DeFi position/investment. Each building type uses a different DeFi strategy.

**Bundler:** A service that collects UserOperations and submits them to the blockchain in batches (part of ERC-4337).

**Core Contract:** DefiCityCore, the main smart contract that stores user data and coordinates other modules.

**Demolish:** Destroying a building in DefiCity, which withdraws funds from the DeFi protocol back to the user's wallet.

**EntryPoint:** The ERC-4337 contract that validates and executes UserOperations.

**Gasless Transaction:** A transaction where the user doesn't pay gas fees. In DefiCity, gameplay actions are gasless (paymaster sponsors).

**Harvest:** Claiming accumulated yield from a building (DeFi position).

**Impermanent Loss (IL):** Loss experienced by liquidity providers when token prices change compared to holding tokens. Only affects LP strategies, not lending.

**LP (Liquidity Provider):** Someone who deposits tokens into a liquidity pool (like Aerodrome) to earn trading fees and rewards.

**Paymaster:** A smart contract that sponsors gas fees for users (part of ERC-4337).

**Session Key:** A temporary key that allows users to perform actions without repeated approvals. Expires after 24 hours in DefiCity.

**Smart Wallet:** An ERC-4337 compatible wallet (smart contract) that holds user funds. More flexible than EOAs.

**Strategy:** A smart contract that implements a specific DeFi integration (e.g., AaveStrategy, AerodromeStrategy).

**TVL (Total Value Locked):** The total amount of assets locked in a protocol. Key metric for DeFi platforms.

**USDC:** USD Coin, a stablecoin pegged to the US dollar (1 USDC = $1). Main asset used in DefiCity.

**UserOperation:** A transaction structure in ERC-4337 that can be sponsored by a paymaster (gasless for user).

**Yield:** Returns/profit earned from DeFi investments. In DefiCity, buildings generate yield from underlying protocols.

---

## Appendix B: Reference Links

**External Protocols:**
- Aave V3: https://aave.com
- Aerodrome: https://aerodrome.finance
- Base Chain: https://base.org
- Chainlink: https://chain.link

**Technical Standards:**
- ERC-4337 (Account Abstraction): https://eips.ethereum.org/EIPS/eip-4337
- ERC-20 (Token Standard): https://eips.ethereum.org/EIPS/eip-20
- Solidity Docs: https://docs.soliditylang.org

**Development Tools:**
- Foundry: https://getfoundry.sh
- Next.js: https://nextjs.org
- Wagmi: https://wagmi.sh
- Viem: https://viem.sh

**Community & Support:**
- DefiCity Website: [TBD]
- Discord: [TBD]
- Twitter: [TBD]
- GitHub: [TBD]
- Documentation: [TBD]

---

**Document Version:** 1.0
**Last Updated:** 2026-01-14
**Author:** DefiCity Product Team
**Reviewed By:** Development Team, Legal Counsel
**Status:** Approved for Development

---

**END OF DOCUMENT**
