# DefiCity - Use Cases & User Stories

**Project:** DefiCity - DeFi City Builder Game
**Version:** 2.0
**Date:** 2026-01-14
**Status:** Development Phase

---

## Table of Contents

1. [Overview](#overview)
2. [User Personas](#user-personas)
3. [Core Use Cases](#core-use-cases)
4. [User Stories by Feature](#user-stories-by-feature)
5. [Detailed User Flows](#detailed-user-flows)
6. [Edge Cases & Error Scenarios](#edge-cases--error-scenarios)

---

## 1. Overview

This document describes the use cases and user stories for DefiCity, a gamified DeFi portfolio management platform where users build virtual cities that represent their DeFi investment portfolios.

### Key Concepts
- **City** = Investment Portfolio
- **Building** = DeFi Position
- **Yield** = Real returns from DeFi protocols
- **Multi-Asset Support** = USDC, USDT, ETH, BTC
- **Gasless Gameplay** = Free transactions for gameplay actions

---

## 2. User Personas

### Persona 1: Sarah - The Crypto Curious
**Background:**
- 28-year-old marketing professional
- Heard about crypto from friends, never invested
- Wants passive income but intimidated by complexity
- Plays mobile games (Stardew Valley, Animal Crossing)

**Goals:**
- Understand how DeFi works
- Start investing with $500
- Earn passive income
- Simple, visual interface

**Pain Points:**
- Doesn't know where to start with crypto
- Fear of losing money
- Complex DeFi interfaces are confusing
- Doesn't understand gas fees

**DefiCity Fit:**
- Email login (no wallet needed initially)
- Visual city-building interface
- Gasless gameplay
- Low minimums ($100 for Bank)
- Clear risk warnings

### Persona 2: Mike - The Gamer
**Background:**
- 24-year-old software developer
- Plays mobile games daily
- Owns some ETH but never used DeFi
- Understands blockchain concepts

**Goals:**
- Earn while playing
- Learn about DeFi strategies
- Try different protocols
- Entertainment + profit

**Pain Points:**
- Most crypto games are scammy
- Complex DeFi UX
- High gas fees on Ethereum
- Time-consuming to manage positions

**DefiCity Fit:**
- Game-like progression (no unlock requirements)
- Multiple building types (Bank, Shop, Lottery)
- Gasless transactions
- Visual portfolio management
- Fun + real yield

### Persona 3: Lisa - The DeFi Investor
**Background:**
- 35-year-old finance professional
- Active in DeFi (Aave, Uniswap user)
- Manages $50k portfolio across 5+ protocols
- Understands risks and strategies

**Goals:**
- Simplify DeFi portfolio management
- Better visualization
- Try different strategies (supply, borrow, LP)
- Optimize yields

**Pain Points:**
- Managing multiple protocols is tedious
- No good portfolio dashboard
- High gas fees for small operations
- Hard to track performance

**DefiCity Fit:**
- Multi-protocol integration (Aave, Aerodrome)
- Unified dashboard
- Gasless gameplay
- Multiple strategies (supply, borrow, LP)
- Portfolio analytics

---

## 3. Core Use Cases

### UC-001: Account Creation & Onboarding
**Actor:** New User (Sarah, Mike, Lisa)
**Goal:** Create account and deposit funds to start playing

**Preconditions:**
- User has email or social account
- User has access to crypto (external wallet or card)

**Main Flow:**
1. User visits DefiCity website
2. User clicks "Start Building"
3. User selects login method (Email, Google, Apple)
4. System creates ERC-4337 smart wallet
5. User deposits funds (USDC, USDT, ETH, or BTC)
6. User completes optional tutorial
7. User places first building

**Postconditions:**
- Smart wallet created
- Funds deposited
- Session key created
- User ready to play

**Alternative Flows:**
- User skips tutorial
- User deposits multiple assets
- User connects existing wallet

---

### UC-002: Place Building (Investment)
**Actor:** User with deposited funds
**Goal:** Create a building to invest in DeFi protocol

**Preconditions:**
- User has funds in smart wallet
- User has session key (or will create one)

**Main Flow:**
1. User clicks empty tile on city map
2. System shows available building types:
   - Town Hall (Free, Smart Wallet visual)
   - Bank ($100 min, Supply/Borrow)
   - Shop ($500 min, LP Providing)
   - Lottery ($10 min, Entertainment)
3. User selects building type (e.g., Bank)
4. User selects asset to invest (USDC, USDT, ETH, BTC)
5. User enters investment amount
6. User selects strategy mode (for Bank: Supply only or Supply + Borrow)
7. System shows:
   - Building creation fee (0.05%)
   - Net amount to protocol
   - Expected APY/Return
   - Risk level
8. User confirms
9. System creates session key (if first time)
10. System executes gasless transaction
11. Building appears on map

**Postconditions:**
- Building created and visible
- Funds deposited to DeFi protocol
- Building generates yield
- 0.05% fee collected

**Alternative Flows:**
- User doesn't have enough funds → Show error
- User cancels transaction
- Paymaster exhausted → User can pay gas
- User creates multiple buildings in succession

**Variations by Building Type:**

**Bank (Supply Mode):**
- User deposits asset (USDC, USDT, ETH, BTC)
- Strategy supplies to Aave V3
- Earns supply APY (~3-5%)
- Assets act as collateral

**Bank (Borrow Mode):**
- User must have existing supply as collateral
- User borrows different asset against collateral
- Must maintain health factor > 1.0
- Pays borrow APY (~5-8%)
- System warns about liquidation risk

**Shop (LP Providing):**
- User selects trading pair (USDC/ETH, USDT/USDC, ETH/BTC)
- User deposits one or both assets
- If single asset, auto-converts 50% to pair
- Strategy adds liquidity to Aerodrome
- Earns trading fees + AERO rewards (~8-15% APY)
- System shows impermanent loss calculator
- Requires risk disclaimer acceptance

**Government Lottery Office (Megapot Integration):**
- User selects USDC to pay (Megapot requirement)
- User selects number of tickets
- Ticket price fetched dynamically from Megapot
- Funds sent to Megapot contract on user's behalf
- Shows current $1M+ jackpot (from Megapot)
- DefiCity earns referral fees
- Requires responsible gaming warning acceptance

---

### UC-003: Harvest Yield
**Actor:** User with active building
**Goal:** Collect accumulated yield from building

**Preconditions:**
- User has active building
- Building has pending rewards > 0
- Session key valid

**Main Flow:**
1. User views city map
2. Building shows "Pending Rewards: X USDC"
3. User clicks building
4. Building panel shows:
   - Current value
   - Pending rewards
   - APY
   - Protocol info
5. User clicks "Harvest"
6. System executes gasless transaction
7. Yield transferred to smart wallet
8. Building panel updates (rewards → 0)
9. Success notification shown

**Postconditions:**
- Yield claimed and in wallet
- Building continues generating yield
- No fees charged

**Alternative Flows:**
- No pending rewards → Button disabled
- Session key expired → User approves new key
- Transaction fails → User retries

**Note:** Lottery building cannot be "harvested" - prizes are claimed via Megapot after draw

---

### UC-004: Deposit to Existing Building
**Actor:** User with active building
**Goal:** Add more funds to existing building

**Preconditions:**
- User has active building
- User has funds in wallet

**Main Flow:**
1. User clicks building
2. User clicks "Deposit More"
3. User selects asset (must match building asset)
4. User enters amount
5. System shows:
   - No fee for additional deposits
   - New total investment
   - Updated APY (if changed)
6. User confirms
7. System executes gasless transaction
8. Building value increases

**Postconditions:**
- Additional funds deposited
- Building shares recalculated
- No fee charged

**Alternative Flows:**
- User deposits different asset → Show error (must match)
- User doesn't have enough → Show error

**Special Cases:**
- **Bank:** Can increase supply to borrow more
- **Shop:** Increases LP position size
- **Lottery:** Cannot deposit more - must buy new tickets via Megapot

---

### UC-005: Demolish Building
**Actor:** User with active building
**Goal:** Remove building and withdraw all funds

**Preconditions:**
- User owns building
- Building can be demolished (Town Hall cannot)

**Main Flow:**
1. User clicks building
2. User clicks "Demolish"
3. System shows:
   - Total value (principal + unrealized yield)
   - Amount to receive (in original asset)
   - Warning: "Building will be removed"
4. User confirms
5. System executes gasless transaction:
   - Withdraws from protocol
   - Claims any pending rewards
   - Transfers funds to wallet
   - Removes building from map
6. Success notification shown

**Postconditions:**
- Building removed
- All funds returned to wallet (no fees)
- Map tile becomes empty

**Alternative Flows:**
- User cancels demolition
- **Bank with active borrow:** Must repay loan first → Show error
- **Shop with IL:** User warned about impermanent loss
- **Town Hall:** Cannot demolish → Button disabled

**Special Cases:**
- **Bank (Borrow Mode):** User must repay borrowed amount first
- **Shop:** User receives both assets (not necessarily 50/50 due to IL)
- **Lottery:** Cannot demolish - un-spent USDC returned; active tickets remain on Megapot

---

### UC-006: Withdraw Funds from Wallet
**Actor:** User with funds in smart wallet
**Goal:** Withdraw funds to external wallet

**Preconditions:**
- User has funds in smart wallet (not in buildings)
- User has external wallet address

**Main Flow:**
1. User clicks "Withdraw" in dashboard
2. User selects asset to withdraw (USDC, USDT, ETH, BTC)
3. User enters amount
4. User enters destination address
5. System shows:
   - Amount to receive
   - Gas fee (~$0.30 - user pays)
   - Warning: "External transaction requires gas"
6. User confirms
7. User approves transaction (pays gas)
8. Funds sent to destination address
9. Transaction confirmed

**Postconditions:**
- Funds sent to external wallet
- User paid gas fee
- Wallet balance updated

**Alternative Flows:**
- User withdraws all funds (closes account essentially)
- User withdraws to different asset (auto-swap available - future)
- Insufficient gas → Show error
- Invalid address → Show error

---

### UC-007: Bank - Supply & Borrow
**Actor:** User with Bank building
**Goal:** Use Bank building for supplying and borrowing assets

#### UC-007a: Supply Assets (Earn Interest)
**Main Flow:**
1. User places Bank building
2. User selects "Supply Mode"
3. User deposits asset (USDC, USDT, ETH, BTC)
4. Strategy supplies to Aave V3
5. User receives aTokens
6. User earns supply APY
7. User can harvest interest anytime

**Postconditions:**
- Assets supplied as collateral
- User earns interest
- Can borrow against collateral

#### UC-007b: Borrow Assets (Get Loan)
**Preconditions:**
- User has supply building with collateral

**Main Flow:**
1. User clicks Bank building
2. User clicks "Borrow"
3. System shows:
   - Available collateral
   - Max borrow amount (based on LTV)
   - Current health factor
4. User selects asset to borrow (different from collateral)
5. User enters borrow amount
6. System shows:
   - New health factor (must be > 1.0)
   - Borrow APY
   - Liquidation warning if health factor < 1.5
7. User confirms
8. Borrowed funds transferred to wallet
9. User pays borrow interest (accrues)

**Postconditions:**
- User has borrowed funds
- Health factor tracked
- User pays borrow APY

**Risk Management:**
- System monitors health factor
- Warns when health factor < 1.5
- If health factor < 1.0 → Liquidation risk
- User can repay loan anytime to improve health factor

#### UC-007c: Repay Loan
**Main Flow:**
1. User clicks Bank building with active borrow
2. User clicks "Repay"
3. System shows:
   - Borrowed amount
   - Accrued interest
   - Total to repay
4. User enters repayment amount
5. User confirms
6. Funds transferred from wallet
7. Health factor improves
8. If fully repaid → Can withdraw collateral

---

### UC-008: Shop - Liquidity Providing
**Actor:** User with Shop building
**Goal:** Provide liquidity to earn trading fees

**Main Flow:**
1. User places Shop building
2. User selects trading pair (e.g., USDC/ETH)
3. User deposits asset(s):
   - **Option A:** Deposit both assets (USDC + ETH)
   - **Option B:** Deposit single asset (auto-converts 50%)
4. System shows impermanent loss calculator:
   - Current value
   - Value if ETH +50%, +100%, +200%
   - Value if ETH -50%, -75%
   - IL percentage for each scenario
5. User accepts risk disclaimer
6. User confirms
7. Strategy adds liquidity to Aerodrome pool
8. User receives LP position (NFT or tokens)
9. User earns:
   - Trading fees (0.05% - 1% per swap)
   - AERO token rewards
10. User can harvest rewards anytime

**Postconditions:**
- LP position created
- User earns fees from every swap in pool
- User earns AERO rewards
- Position value fluctuates with price ratio

**Risk Management:**
- IL calculator shown before placement
- System updates IL in real-time
- Warns if price divergence > 20%
- User understands risk before investing

**Impermanent Loss Examples:**
*Shown in building info panel*

**USDC/ETH Pool - Low IL Scenario:**
- Deposited: 500 USDC + 500 USDC worth of ETH (0.25 ETH @ $2,000)
- ETH price: $2,000 → $2,200 (+10%)
- LP value: ~$1,024 vs $1,025 if held
- IL: ~0.1% (negligible)
- Fees earned: ~$15 (offsets IL)
- Net gain: +$14

**USDC/ETH Pool - High IL Scenario:**
- Deposited: 500 USDC + 500 USDC worth of ETH (0.25 ETH @ $2,000)
- ETH price: $2,000 → $4,000 (+100%)
- LP value: ~$1,414 vs $1,500 if held
- IL: ~5.7% ($86 loss)
- Fees earned: ~$60 (partially offsets)
- Net gain: -$26 (but still earned fees)

**USDT/USDC Pool - Minimal IL:**
- Both stablecoins (~$1 each)
- Price stays ~1:1
- IL: < 0.1% (almost zero)
- Fees: ~$8/year per $1,000
- Net gain: +$8 (pure fee income)

---

### UC-009: Government Lottery Office (Megapot Integration)
**Actor:** User seeking entertainment
**Goal:** Purchase Megapot lottery tickets and potentially win $1M+ jackpot

#### UC-009a: Buy Megapot Lottery Tickets
**Main Flow:**
1. User places Government Lottery Office building (or buys tickets)
2. User clicks "Buy Tickets"
3. System fetches live data from Megapot contract:
   - Current jackpot: $1M+ USD (real-time from Megapot)
   - Next draw: Time remaining (from Megapot)
   - Ticket price: Dynamic (fetched via getTicketPrice())
   - Odds: As defined by Megapot
4. System shows:
   - Megapot details
   - Responsible gaming warning
   - DefiCity earns referral fee disclosure
5. User selects USDC amount (Megapot requires USDC)
6. System calculates: Number of tickets = USDC amount / ticket price
7. System shows:
   - Total cost in USDC
   - Number of tickets to be purchased
   - Warning: "This is entertainment, not investment"
   - Note: "Tickets purchased on Megapot.io on your behalf"
8. User accepts disclaimer
9. User confirms
10. System executes:
    - Transfers USDC from user's wallet
    - Calls Megapot.purchaseTickets(referrer=DefiCity, value=amount, recipient=user)
    - DefiCity earns referral fee from Megapot
11. Tickets are owned by user on Megapot contract
12. Building shows ticket count and jackpot info

**Postconditions:**
- Tickets purchased on Megapot
- User is participant in Megapot lottery
- DefiCity earned referral fee
- User awaits Megapot draw

**Responsible Gaming:**
- Clear warning: "Lottery is entertainment, not investment"
- Jackpot size shown (inspires dream, but realistic odds disclosed)
- Optional spending limits (frontend feature)
- Link to Megapot.io for full details

#### UC-009b: Lottery Draw (Managed by Megapot)
**Automated Process (Megapot + Chainlink VRF):**
1. Draw time reached (Megapot schedule)
2. Megapot contract triggers Chainlink VRF
3. VRF generates provably fair random numbers
4. Megapot determines winners
5. Prizes distributed by Megapot protocol
6. DefiCity building updates to show:
   - Last draw results (via getLastJackpotResults())
   - User's winnings (via winningsClaimable(user))
   - Next draw countdown

**Note:** All lottery mechanics are handled by Megapot. DefiCity simply displays the information.

#### UC-009c: Check Winnings & Claim Prize
**Main Flow:**
1. Draw completed by Megapot
2. DefiCity building fetches user's winnings:
   - Calls Megapot.winningsClaimable(user)
3. If winnings > 0:
   - Building highlights "You Won!"
   - Shows claimable amount
4. User clicks "Check Winnings on Megapot"
5. System shows:
   - Claimable winnings (in USDC)
   - Link to Megapot.io to claim
   - Note: "Claims are processed on Megapot.io"
6. User visits Megapot.io to claim (external to DefiCity)
7. Prize transferred by Megapot contract

**Postconditions:**
- User aware of winnings
- User directed to Megapot for claiming
- DefiCity building shows updated status

**Alternative Flows:**
- No winning tickets → Building shows "No wins this draw"
- User buys more tickets for next draw
- User checks past results via Megapot.io

**Why External Claiming:**
- Megapot handles all prize distribution
- Security: Users claim directly from audited Megapot contract
- DefiCity focuses on UI/visualization

---

### UC-010: Town Hall - Smart Wallet Representation
**Actor:** User wanting wallet visualization
**Goal:** Place Town Hall to visualize smart wallet on map

**Main Flow:**
1. User clicks empty tile
2. User selects "Town Hall"
3. System shows:
   - Type: Smart Wallet Creation
   - Cost: FREE
   - Purpose: Visual representation of wallet
   - Limit: 1 per user
   - Cannot be demolished
4. User confirms
5. System creates Town Hall (if wallet not deployed, deploys it)
6. Town Hall appears on map
7. Shows wallet address

**Postconditions:**
- Town Hall placed (free)
- Smart wallet deployed (if first transaction)
- Wallet address visible
- Cannot be removed

**Use Cases:**
- **Optional:** User can skip Town Hall and place other buildings directly
- **Visual Identity:** Acts as city center/identity
- **Future:** May provide governance benefits or bonuses

---

### UC-011: Multi-Asset Portfolio Management
**Actor:** User with multiple assets
**Goal:** Manage portfolio with different assets

**Main Flow:**
1. User deposits multiple assets:
   - 500 USDC
   - 1000 USDT
   - 0.5 ETH
   - 0.02 BTC (WBTC)
2. Dashboard shows:
   - Total portfolio value in USD
   - Balance per asset
   - Breakdown by asset type
3. User places buildings with different assets:
   - Bank #1: 200 USDC (supply)
   - Bank #2: 500 USDT (supply)
   - Bank #3: 0.3 ETH (supply + borrow USDC)
   - Shop: 300 USDC + 0.15 ETH (LP)
   - Lottery: 0.01 BTC (2 tickets)
4. User monitors portfolio:
   - Total invested: ~$4,000
   - Available balance: ~$1,000
   - Assets across 5 buildings
   - Multiple strategies
5. User harvests from all buildings:
   - Bank #1: +2 USDC (supply APY)
   - Bank #2: +5 USDT (supply APY)
   - Bank #3: +3 USDC (net: supply - borrow)
   - Shop: +8 USDC (fees) + 10 AERO (rewards)
   - Lottery: Check winnings on Megapot (external)

**Benefits:**
- Diversification across assets
- Different risk profiles per asset
- Flexibility in strategy selection
- Unified portfolio view

---

### UC-012: Session Key Management
**Actor:** User playing game
**Goal:** Seamless gameplay without repeated approvals

#### UC-012a: Create Session Key (First Time)
**Main Flow:**
1. User attempts first gameplay action (place building)
2. System detects no session key
3. System prompts: "Allow DefiCity to act on your behalf for 24 hours?"
4. System shows session key parameters:
   - Valid for: 24 hours
   - Spending limit: 1,000 USDC
   - Restricted to: DefiCityCore contract
   - Functions: placeBuilding, harvest, demolish
5. User approves (one-time)
6. Session key created and stored (encrypted)
7. Action proceeds instantly

**Postconditions:**
- Session key active for 24 hours
- All gameplay actions gasless and instant
- No repeated approvals needed

#### UC-012b: Use Session Key (Subsequent Actions)
**Main Flow:**
1. User clicks action (harvest, place building, etc.)
2. System uses session key (no approval needed)
3. Action executes instantly
4. User continues playing seamlessly

**User Experience:**
- No gas prompts
- No approval popups
- Instant transactions
- Feels like Web2 app

#### UC-012c: Session Key Expiry & Renewal
**Main Flow:**
1. 24 hours pass, session key expires
2. User attempts action
3. System prompts: "Session expired, renew for another 24 hours?"
4. User approves (simple confirmation)
5. New key created
6. Action proceeds

**Alternative Flow:**
- User inactive → Key expires silently
- Next login → New key created

#### UC-012d: Revoke Session Key
**Main Flow:**
1. User goes to Settings
2. User sees "Active Session Keys"
3. User clicks "Revoke"
4. Key deleted immediately
5. Next action will require new key

**Use Cases:**
- User logs out → Key auto-revoked
- User suspects compromise → Manual revoke
- User changes device → New key needed

---

### UC-013: Emergency & Error Scenarios

#### UC-013a: Paymaster Exhausted
**Scenario:** Paymaster runs out of gas funds

**Flow:**
1. User attempts gameplay action
2. Paymaster checks balance → Insufficient
3. System shows: "Gasless transactions temporarily unavailable"
4. System offers:
   - **Option A:** Wait (paymaster will be refilled)
   - **Option B:** Pay gas yourself (~$0.01)
5. User selects option
6. If Option B: Transaction proceeds with user paying gas

**Mitigation:**
- Paymaster auto-refills when balance < $10k
- 24/7 monitoring
- Users can always proceed by paying gas

#### UC-013b: Protocol Paused (Emergency)
**Scenario:** DefiCity detects security issue

**Flow:**
1. Admin pauses Core contract
2. All gameplay actions blocked
3. Users see: "Protocol temporarily paused for maintenance"
4. Users can still:
   - View portfolio
   - See transaction history
   - Emergency withdraw (if enabled)
5. Admin fixes issue
6. Admin unpauses
7. Normal operations resume

**User Impact:**
- Cannot place/harvest/demolish during pause
- Funds remain safe
- Can emergency withdraw if needed

#### UC-013c: External Protocol Failure (Aave, Aerodrome)
**Scenario:** Integrated protocol has issues

**Flow:**
1. System monitors protocol health
2. Detects issue (e.g., Aave pool paused)
3. System pauses affected strategy
4. Users with affected buildings notified
5. System enables emergency withdraw
6. Users can:
   - Withdraw from affected building (bypass normal checks)
   - Funds returned to wallet
7. Once protocol recovered:
   - Strategy re-enabled
   - Users notified

**Example:**
- Aerodrome pool paused → Shop buildings affected
- Users notified: "USDC/ETH pool temporarily unavailable"
- Users can emergency demolish → Funds returned
- No new Shop buildings until pool restored

#### UC-013d: Insufficient Funds
**Scenario:** User attempts action without enough funds

**Flow:**
1. User tries to place building
2. System checks balance → Insufficient
3. System shows: "Insufficient USDC balance"
4. System shows:
   - Required: 100 USDC
   - Available: 50 USDC
   - Shortfall: 50 USDC
5. User options:
   - Deposit more funds
   - Select different building (lower minimum)
   - Cancel

#### UC-013e: Health Factor Too Low (Bank Borrow)
**Scenario:** User's collateral value drops, health factor < 1.0

**Flow:**
1. System monitors health factor continuously
2. Health factor drops below 1.5 → Warning shown
3. Health factor drops below 1.0 → Liquidation risk
4. User notified: "Your Bank is at risk of liquidation"
5. User options:
   - **Option A:** Repay some borrowed amount
   - **Option B:** Deposit more collateral
   - **Option C:** Do nothing (risk liquidation)
6. If health factor stays < 1.0:
   - Aave liquidates position (protocol behavior)
   - User loses part of collateral
   - Building shows "Partially liquidated"

**Prevention:**
- System warns at health factor < 1.5
- Recommends actions to improve health factor
- Shows real-time health factor

---

### UC-014: Advanced User Flows

#### UC-014a: Mike's Gaming Session
**Scenario:** Mike plays for 30 minutes, performs multiple actions

**Flow:**
1. **Login** (10s)
   - Mike opens DefiCity
   - Auto-login (session key valid)
2. **Check Portfolio** (30s)
   - Views 5 buildings
   - Total value: $2,500
   - Pending rewards: $12 USDC
3. **Harvest All** (1 min)
   - Clicks "Harvest All" button
   - 5 gasless transactions submitted
   - All rewards claimed: $12 USDC
4. **Review Performance** (2 min)
   - Checks building APYs
   - Bank: 4.2% APY ✓
   - Shop: 11.5% APY (good fees) ✓
   - Lottery: Lost $10 last draw ✗
5. **Place New Building** (3 min)
   - Deposits $500 more USDC
   - Places new Shop (USDT/USDC pair for low IL)
   - Gasless transaction
   - Building appears
6. **Buy Lottery Tickets** (2 min)
   - Buys 2 tickets with ETH ($20)
   - Picks lucky numbers
   - Tickets shown in building
7. **Check Leaderboard** (1 min)
   - Views top cities (future feature)
   - Mike's rank: #234
8. **Logout** (5s)
   - Mike closes app
   - Session key remains valid for next login

**Total Time:** 10 minutes
**Actions:** 8 (2 gasless harvests, 1 gasless placement, 1 lottery purchase)
**Gas Paid:** $0.30 (only for deposit)
**Value Added:** +$12 harvested, +$500 invested

#### UC-014b: Lisa's Rebalancing Strategy
**Scenario:** Lisa rebalances portfolio based on market conditions

**Flow:**
1. **Market Analysis** (external)
   - Lisa sees ETH price rising
   - Expects continued uptrend
   - Wants more ETH exposure
2. **Login to DefiCity**
   - Views portfolio: $50k across 12 buildings
3. **Harvest All** (1 min)
   - Collects $45 in yield
4. **Demolish Stablecoin LP** (2 min)
   - Demolishes USDT/USDC Shop (low yield lately)
   - Receives $5,000 USDC back
5. **Increase ETH Position** (3 min)
   - Deposits $5,000 to external wallet
   - Swaps $5,000 USDC → ETH (external DEX)
   - Deposits ETH to DefiCity
6. **Create New Strategy** (5 min)
   - Places Bank with ETH (supply mode)
   - Deposits 2.5 ETH as collateral
   - Borrows $3,000 USDC (60% LTV)
   - Uses borrowed USDC to place another building
   - Health factor: 2.0 (safe)
7. **Monitor Health Factor**
   - Sets price alerts for ETH
   - Will repay if ETH drops >20%

**Result:**
- Increased ETH exposure
- Using leverage (supply + borrow)
- Maintains safe health factor
- Optimized for expected market movement

#### UC-014c: Sarah's First Week
**Scenario:** Sarah's journey from signup to established portfolio

**Day 1: Onboarding**
- Signs up with Google
- Deposits $500 USDC
- Places first Bank (200 USDC)
- Completes tutorial
- Places Town Hall (free)
- Buys 1 lottery ticket ($10) for fun

**Day 3: First Harvest**
- Returns to app
- Sees pending rewards: $0.50
- Harvests (gasless)
- Feels excited about earning

**Day 5: Expansion**
- Comfortable with interface
- Deposits $500 more USDC
- Places second Bank (300 USDC)
- Places Shop (USDT/USDC - low IL risk)
- Now has 4 buildings

**Day 7: Check Progress**
- Total invested: $1,010
- Total earned: $2.50 (so far)
- Yearly projection: ~$65
- Sarah is satisfied
- Shares with friends

**Week 2: Referral**
- Sarah refers 3 friends
- Earns referral bonus (future)
- Friends also sign up
- Community grows

---

## 4. User Stories by Feature

### Feature: Account Creation
```
As a new user
I want to create an account with email/social login
So that I can start investing without crypto knowledge

Acceptance Criteria:
- Account created within 30 seconds
- No wallet extension required
- Smart wallet deployed automatically
- Session key created on first action
```

### Feature: Multi-Asset Deposits
```
As a user
I want to deposit multiple asset types (USDC, USDT, ETH, BTC)
So that I can diversify my portfolio

Acceptance Criteria:
- Support USDC, USDT, ETH, WBTC
- Each asset shows separate balance
- Total value in USD displayed
- Can deposit from external wallet
```

### Feature: Building Placement (No Unlock Requirements)
```
As a user
I want to place any building type from day one
So that I have maximum flexibility

Acceptance Criteria:
- All building types available immediately
- No level requirements
- Only minimum deposit enforced
- Clear info shown for each type
```

### Feature: Bank - Supply & Borrow
```
As an advanced user
I want to supply assets and borrow against them
So that I can use leverage and capital efficiency

Acceptance Criteria:
- Can supply any supported asset
- Can borrow different asset against collateral
- Health factor displayed in real-time
- Liquidation warnings when health < 1.5
- Can repay loan anytime
```

### Feature: Shop - Liquidity Providing
```
As a yield farmer
I want to provide liquidity to trading pairs
So that I can earn higher yields from trading fees

Acceptance Criteria:
- Support multiple pairs (USDC/ETH, USDT/USDC, etc.)
- IL calculator shown before placement
- Real-time IL tracking
- Trading fees accumulated
- AERO rewards tracked
```

### Feature: Government Lottery Office (Megapot Integration)
```
As a user seeking entertainment
I want to play Megapot's $1M+ lottery
So that I can have fun and potentially win big prizes

Acceptance Criteria:
- Can buy tickets with USDC (Megapot requirement)
- Ticket price fetched dynamically from Megapot
- Purchases made on user's behalf to Megapot contract
- Shows $1M+ jackpot size in real-time
- Provably fair randomness (Megapot uses Chainlink VRF)
- Responsible gaming warnings shown
- Winnings checkable via Megapot contract
- DefiCity earns referral fees
```

### Feature: Gasless Gameplay
```
As a user
I want to play without paying gas fees
So that I can focus on strategy without friction

Acceptance Criteria:
- Place building: FREE (paymaster sponsors)
- Harvest yield: FREE
- Demolish building: FREE
- Session key auto-created
- Only pay gas for: deposit, withdraw, wallet creation
```

### Feature: Session Keys
```
As a user
I want to play without approving every transaction
So that I have a seamless experience

Acceptance Criteria:
- Session key created once per 24 hours
- No approvals needed for gameplay
- Auto-refresh if user still active
- Revocable anytime
- Encrypted storage
```

### Feature: Portfolio Dashboard
```
As a user
I want to see my complete portfolio at a glance
So that I can track performance easily

Acceptance Criteria:
- Total portfolio value (USD)
- Balance per asset
- Total invested across buildings
- Total earned (lifetime)
- Pending rewards
- Number of buildings
- Average APY
```

### Feature: Emergency Withdraw
```
As a user
I want to withdraw funds even if protocol is paused
So that my funds remain accessible

Acceptance Criteria:
- Available when Core is paused
- Bypasses normal checks
- Withdraws from strategy directly
- Funds to wallet
- No fees charged
```

---

## 5. Detailed User Flows

### Flow 1: Complete Onboarding (Sarah's Journey)
```
[Start] → Website landing page
   ↓
[Click "Start Building"]
   ↓
[Select login method] → Google OAuth
   ↓
[Account created] → Smart wallet deployed
   ↓
[Deposit prompt] → "Add funds to start"
   ↓
[Select asset] → USDC (default)
   ↓
[Connect Coinbase Wallet] → Approve transfer
   ↓
[500 USDC deposited] → Balance: $500
   ↓
[Tutorial offer] → Accept (2 min tour)
   ↓
[Tutorial complete] → Now ready to build
   ↓
[Click empty tile] → Building selector appears
   ↓
[Select "Bank"] → Info modal shown
   ↓
[Select USDC] → Choose supply mode
   ↓
[Enter 200 USDC] → Shows fee: $0.10
   ↓
[Confirm] → Session key prompt
   ↓
[Approve session key] → One-time approval
   ↓
[Transaction submitted] → Gasless, ~10 seconds
   ↓
[Building appears] → Animation plays
   ↓
[Success notification] → "Bank created!"
   ↓
[Dashboard updates] → Shows new building
   ↓
[End] → Sarah has first building earning yield
```

### Flow 2: Advanced Strategy (Lisa's Leverage)
```
[Start] → Lisa logs in (existing user)
   ↓
[Portfolio] → Has $50k across 12 buildings
   ↓
[Market analysis] → ETH bullish, wants more exposure
   ↓
[Plan] → Use Bank to supply ETH, borrow USDC
   ↓
[Deposit ETH] → Adds 2.5 ETH to wallet ($5,000)
   ↓
[Place Bank] → Selects "Supply + Borrow" mode
   ↓
[Supply] → Deposits 2.5 ETH as collateral
   ↓
[Borrow] → Borrows $3,000 USDC (60% LTV)
   ↓
[Health factor] → Shows 2.0 (very safe)
   ↓
[Warning accepted] → Understands liquidation risk
   ↓
[Confirm] → Gasless transaction
   ↓
[Building created] → Shows:
   - Supply: 2.5 ETH earning ~3% APY
   - Borrow: $3,000 USDC paying ~5% APY
   - Net cost: ~2% APY ($40/year)
   - Health factor: 2.0
   ↓
[Use borrowed USDC] → Places Shop with $3,000
   ↓
[Shop strategy] → USDC/ETH LP earning ~12% APY
   ↓
[Net result] →
   - ETH exposure: 2.5 ETH
   - Additional earnings: ~$360/year from Shop
   - Cost: ~$40/year (borrow interest)
   - Net gain: ~$320/year (~6.4% APY on $5k)
   - Leveraged position with acceptable risk
   ↓
[End] → Lisa has leveraged strategy earning extra yield
```

### Flow 3: Megapot Lottery Experience (Mike's Entertainment)
```
[Start] → Mike's city with 5 buildings
   ↓
[Sees "New: Government Lottery Office! $1M+ Jackpot via Megapot"]
   ↓
[Curious] → Clicks to learn more
   ↓
[Info modal] →
   - Powered by: Megapot.io
   - Current jackpot: $1,200,000 (live from Megapot)
   - Next draw: 2 days 5 hours
   - Ticket price: $5 USDC (dynamic)
   - Note: "DefiCity purchases tickets on your behalf"
   ↓
[Thinks] → "Worth $20 for a shot at $1M!"
   ↓
[Place building] → Selects Government Lottery Office
   ↓
[Buy tickets] →
   - Enters: 20 USDC
   - System calculates: 20 / 5 = 4 tickets
   - Shows: "You'll get 4 tickets on Megapot"
   ↓
[Warnings shown] →
   - "This is entertainment, not investment"
   - "Jackpot managed by Megapot.io (audited)"
   - "DefiCity earns referral fee"
   ↓
[Mike accepts] → "Let's go!"
   ↓
[Confirm] → Gasless transaction
   ↓
[System executes] →
   - Transfers 20 USDC from Mike's wallet
   - Calls Megapot.purchaseTickets(referrer=DefiCity, 20 USDC, Mike)
   - DefiCity earns ~$1 referral fee
   ↓
[Tickets purchased] → Building shows:
   - 4 tickets purchased on Megapot
   - Current jackpot: $1.2M
   - Next draw: 2 days 5 hours
   - View on Megapot.io →
   ↓
[Next 2 days] → Mike checks building daily
   ↓
[Draw occurs] → Megapot executes draw (Chainlink VRF)
   ↓
[DefiCity building updates] →
   - Fetches: Megapot.winningsClaimable(Mike)
   - Result: 0 USDC (no win this time)
   ↓
[Building shows] →
   - "No wins this draw"
   - Last jackpot: Won by 0x7a3b... ($1.2M)
   - Next jackpot: $50,000 (reset)
   - Buy more tickets? →
   ↓
[Mike's reaction] → "Didn't win, but fun to dream!"
   ↓
[Mike buys again] →
   - Next jackpot growing: Now $80,000
   - Buys 10 more tickets ($50 USDC)
   - "Maybe next time!"
   ↓
[End] → Mike had fun, supports Megapot ecosystem, tries again
```

**Alternative Outcome (If Mike Won):**
```
[Draw occurs] → Megapot executes draw
   ↓
[DefiCity building updates] →
   - Fetches: Megapot.winningsClaimable(Mike)
   - Result: $15,000 USDC (prize tier win!)
   ↓
[Notification] → "You won $15,000 on Megapot! 🎉"
   ↓
[Building shows] →
   - Claimable: $15,000 USDC
   - "Claim on Megapot.io" (external link)
   ↓
[Mike visits Megapot.io] →
   - Connects wallet
   - Claims $15,000 USDC
   - Funds sent to wallet by Megapot contract
   ↓
[Mike's reaction] → "Wow! That's incredible!"
   ↓
[Mike shares] → Posts on Twitter, friends excited
   ↓
[Mike reinvests] → Uses winnings to place 3 more Banks in DefiCity
   ↓
[End] → Mike won big, reinvested, loves DefiCity + Megapot
```

---

## 6. Edge Cases & Error Scenarios

### Edge Case 1: Multi-Asset Complexity
**Scenario:** User has 10 buildings across 4 different assets

**Considerations:**
- Dashboard shows total value (USD)
- Each building shows asset-specific value
- Harvest returns yield in original asset
- Demolish returns funds in original asset
- User can withdraw each asset separately

**Example:**
- Bank #1: 200 USDC → Harvest: +2 USDC
- Bank #2: 500 USDT → Harvest: +5 USDT
- Bank #3: 0.3 ETH → Harvest: +0.003 ETH
- Shop #1: USDC/ETH → Harvest: +1 USDC + 0.001 ETH
- User wallet shows: 2 USDC, 5 USDT, 0.304 ETH

### Edge Case 2: Paymaster Exhaustion During Transaction
**Scenario:** User starts transaction, paymaster runs out mid-execution

**Flow:**
1. User clicks "Place Building"
2. Frontend checks paymaster → Available
3. Transaction submitted
4. During execution, paymaster exhausted
5. Bundler rejects UserOperation
6. Frontend detects failure
7. System prompts: "Gasless failed, retry with gas?"
8. User can:
   - Pay gas ($0.01) and retry
   - Wait for paymaster refill
   - Cancel

### Edge Case 3: Session Key Expires Mid-Session
**Scenario:** User playing, 24 hours pass, key expires

**Flow:**
1. User active for 24+ hours (rare)
2. User attempts action
3. Transaction fails (invalid signature)
4. System detects expired key
5. System prompts: "Session expired, renew?"
6. User approves new key (10 seconds)
7. Previous action retried automatically
8. User continues playing

### Edge Case 4: Liquidation During Session
**Scenario:** User has Bank with borrow, ETH price drops, liquidated

**Flow:**
1. User has Bank: 1 ETH supplied, $1,500 USDC borrowed
2. ETH price: $2,000 → $1,800 (drops 10%)
3. Health factor: 1.4 → 1.2 (warning shown)
4. User ignores warning
5. ETH price: $1,800 → $1,600 (drops more)
6. Health factor: 1.2 → 0.95 (liquidation triggered)
7. Aave liquidates: Sells 0.2 ETH, repays part of loan
8. User position now: 0.8 ETH supplied, $1,200 USDC borrowed
9. Building shows: "Partially liquidated"
10. User notified: "Your Bank was liquidated, repay loan to avoid more losses"

### Edge Case 5: Impermanent Loss Exceeds Fees
**Scenario:** User has Shop, ETH price 3x, IL > fees earned

**Flow:**
1. User places Shop: 500 USDC + 500 USDC worth of ETH (0.25 ETH @ $2,000)
2. Total: $1,000 invested
3. ETH price: $2,000 → $6,000 (3x increase)
4. If held: $500 USDC + $1,500 ETH = $2,000
5. LP value: ~$1,732 (due to IL)
6. IL: ~$268 (13.4%)
7. Fees earned: ~$120 (over 6 months)
8. Net result: $1,732 + $120 - $1,000 = $852 gain
9. But holding would've been: $2,000 - $1,000 = $1,000 gain
10. User "lost" $148 vs holding (IL - fees)

**Building shows:**
- Current value: $1,852 ($1,732 LP + $120 fees)
- If held: $2,000
- IL: -$268
- Fees earned: +$120
- Net IL: -$148

**User decision:**
- Continue farming (fees offset some IL)
- Demolish and hold assets separately
- Rebalance to stablecoin pair (lower IL)

### Edge Case 6: Megapot Jackpot Growth & Reset
**Scenario:** Megapot jackpot grows over multiple draws, then wins

**Flow:**
1. **Week 1:** Megapot jackpot: $1.2M (no DefiCity users win)
2. **Week 2:** Megapot jackpot: $1.5M (growing, no DefiCity users win)
3. **Week 3:** Megapot jackpot: $1.8M (growing, no DefiCity users win)
4. **Week 4:** Megapot jackpot: $2.1M → Someone wins on Megapot!
5. **DefiCity building updates:**
   - Shows last winner (external address)
   - Shows prize amount: $2.1M
   - Next jackpot: Reset to base ($50k)
6. **Community excitement:** DefiCity users see massive win, buy more tickets
7. **Next draws:** Jackpot grows again from $50k base

**DefiCity User Experience:**
- Building always shows current Megapot jackpot (live data)
- Users notified of major wins (even if not theirs)
- Encourages participation when jackpot is high
- Clear that jackpot is managed by Megapot (not DefiCity)

---

## 7. Success Metrics by Use Case

### Metric: User Activation Rate
**Definition:** % of signups who place at least 1 building within 7 days
**Target:** 70%
**Measured by:** (Users with ≥1 building) / (Total signups) × 100

**Use Case Impact:**
- UC-001 (Onboarding) → Directly affects
- UC-002 (Place Building) → Directly affects
- Tutorial quality → Indirectly affects

### Metric: Average Buildings per User
**Definition:** Mean number of buildings per active user
**Target:** 3.5 buildings
**Measured by:** (Total buildings) / (Total users)

**Use Case Impact:**
- UC-002 (Place Building) → Increases metric
- UC-004 (Deposit to Existing) → Neutral (doesn't add buildings)
- UC-005 (Demolish) → Decreases metric

**Distribution Target:**
- 20% of users: 1 building (beginners)
- 50% of users: 2-4 buildings (average)
- 25% of users: 5-10 buildings (active)
- 5% of users: 10+ buildings (power users)

### Metric: Harvest Frequency
**Definition:** How often users harvest yield
**Target:** 1 harvest per user per 3 days
**Measured by:** (Total harvest events) / (Active users) / (Days)

**Use Case Impact:**
- UC-003 (Harvest) → Directly drives
- Gasless transactions → Enables high frequency
- Pending rewards display → Encourages harvests

### Metric: Building Type Distribution
**Definition:** % of TVL in each building type
**Target:**
- Bank: 60%
- Shop: 25%
- Lottery: 10% (of spending, not TVL)
- Town Hall: 0% (free)

**Use Case Impact:**
- UC-007 (Bank) → 60% target
- UC-008 (Shop) → 25% target
- UC-009 (Lottery) → 10% target (entertainment)

### Metric: User Lifetime Value (LTV)
**Definition:** Total fees per user over lifetime
**Target:** $50 per user
**Calculated:** Avg deposits × Buildings × Fee rate × Rebuild frequency

**Example:**
- Avg deposit: $1,000
- Avg buildings: 3.5
- Fee: 0.05%
- Total fees per cycle: $1.75
- Rebuilds per year: 6
- Annual fees: $10.50
- Lifetime (5 years): $52.50

---

**END OF DOCUMENT**
