# DefiCity - User Stories

**Project:** DefiCity Implementation
**Version:** 1.0
**Last Updated:** 2026-01-14
**Based on:** REQUIREMENT.md, USECASE.md, TECHNICAL_DESIGN.md

---

## Table of Contents

1. [Epic 1: User Onboarding & Account Management](#epic-1-user-onboarding--account-management)
2. [Epic 2: Multi-Asset Portfolio Management](#epic-2-multi-asset-portfolio-management)
3. [Epic 3: Town Hall Building (Smart Wallet)](#epic-3-town-hall-building-smart-wallet)
4. [Epic 4: Bank Building (Aave Integration)](#epic-4-bank-building-aave-integration)
5. [Epic 5: Shop Building (Aerodrome LP)](#epic-5-shop-building-aerodrome-lp)
6. [Epic 6: Government Lottery Office (Megapot Integration)](#epic-6-government-lottery-office-megapot-integration)
7. [Epic 7: Account Abstraction & Gasless Gameplay](#epic-7-account-abstraction--gasless-gameplay)
8. [Epic 8: City Map & Visualization](#epic-8-city-map--visualization)
9. [Epic 9: Analytics & Insights](#epic-9-analytics--insights)
10. [Story Mapping & Prioritization](#story-mapping--prioritization)

---

## Epic 1: User Onboarding & Account Management

### US-001: New User Signup with Smart Wallet Creation

**As a** new DeFi user
**I want** to sign up with my email or social account and automatically get a smart wallet created
**So that** I can start using DefiCity without needing to manage private keys or understand crypto wallets

**Acceptance Criteria:**
- [ ] User can sign up with email (passwordless login)
- [ ] User can sign up with social accounts (Google, Twitter, Discord)
- [ ] Smart wallet (ERC-4337) is created automatically on signup
- [ ] Wallet creation uses passkey authentication (WebAuthn)
- [ ] User sees their wallet address after creation
- [ ] Wallet address is copyable
- [ ] No manual private key management required
- [ ] Signup flow takes less than 2 minutes

**Priority:** P0 (Critical)
**Estimated:** 5 story points
**Dependencies:** None

---

### US-002: Returning User Login

**As a** returning DefiCity user
**I want** to login quickly with my email or social account
**So that** I can access my city and buildings without re-entering credentials

**Acceptance Criteria:**
- [ ] User can login with email (passwordless)
- [ ] User can login with social accounts
- [ ] Login uses passkey authentication (biometrics/PIN)
- [ ] Previous session is restored (city state, buildings)
- [ ] Smart wallet reconnects automatically
- [ ] Login takes less than 10 seconds
- [ ] "Remember me" option available

**Priority:** P0 (Critical)
**Estimated:** 3 story points
**Dependencies:** US-001

---

### US-003: Guardian Recovery Setup

**As a** DefiCity user
**I want** to set up guardian accounts for wallet recovery
**So that** I can recover my account if I lose access to my primary authentication method

**Acceptance Criteria:**
- [ ] User can add 1-3 guardian addresses
- [ ] Guardians can be email addresses or wallet addresses
- [ ] Recovery requires 2 of 3 guardians to approve
- [ ] User receives confirmation when guardians are set
- [ ] Guardians receive notification of their role
- [ ] Recovery process is clearly documented
- [ ] User can update guardians later

**Priority:** P1 (High)
**Estimated:** 5 story points
**Dependencies:** US-001

---

### US-004: Onboarding Tutorial

**As a** first-time DefiCity user
**I want** to see a quick interactive tutorial
**So that** I understand how to build my DeFi portfolio and use the platform

**Acceptance Criteria:**
- [ ] Tutorial shows 4-5 key steps (deposit, place building, harvest, withdraw)
- [ ] Interactive tutorial highlights UI elements
- [ ] User can skip tutorial
- [ ] User can replay tutorial later from settings
- [ ] Tutorial takes less than 2 minutes
- [ ] Clear call-to-action after tutorial completion
- [ ] Mobile-friendly tutorial

**Priority:** P1 (High)
**Estimated:** 3 story points
**Dependencies:** US-001

---

## Epic 2: Multi-Asset Portfolio Management

### US-005: Deposit Multi-Asset Funds

**As a** DefiCity user
**I want** to deposit USDC, USDT, ETH, or WBTC into my smart wallet
**So that** I can use these assets to build DeFi positions in my city

**Acceptance Criteria:**
- [ ] User can select asset type (USDC, USDT, ETH, WBTC)
- [ ] User can enter deposit amount
- [ ] UI shows current balance for selected asset
- [ ] UI shows minimum deposit (if any)
- [ ] User confirms transaction in wallet
- [ ] Transaction shows loading state
- [ ] Balance updates after successful deposit
- [ ] Success notification displays with transaction hash
- [ ] User pays gas fee for deposit (not gasless)

**Priority:** P0 (Critical)
**Estimated:** 5 story points
**Dependencies:** US-001

---

### US-006: View Multi-Asset Portfolio

**As a** DefiCity user
**I want** to see my portfolio breakdown by asset
**So that** I understand how my funds are distributed across different cryptocurrencies

**Acceptance Criteria:**
- [ ] Dashboard shows balances for all 4 assets (USDC, USDT, ETH, WBTC)
- [ ] Shows total portfolio value in USD
- [ ] Shows available balance (not invested) per asset
- [ ] Shows invested amount per asset (in buildings)
- [ ] Shows total earned (all-time) per asset
- [ ] Shows percentage distribution (pie chart or bar chart)
- [ ] Real-time price updates
- [ ] Balances update after deposits/withdrawals

**Priority:** P0 (Critical)
**Estimated:** 5 story points
**Dependencies:** US-005

---

### US-007: Withdraw Multi-Asset Funds

**As a** DefiCity user
**I want** to withdraw my available balance to my external wallet
**So that** I can move funds off the platform when needed

**Acceptance Criteria:**
- [ ] User can select asset type to withdraw
- [ ] User can enter withdrawal amount
- [ ] UI shows available balance (not invested)
- [ ] UI prevents withdrawal of invested funds
- [ ] User confirms transaction in wallet
- [ ] Transaction shows loading state
- [ ] Balance updates after successful withdrawal
- [ ] Success notification displays
- [ ] User pays gas fee for withdrawal (not gasless)
- [ ] Cannot withdraw more than available balance

**Priority:** P0 (Critical)
**Estimated:** 3 story points
**Dependencies:** US-006

---

### US-008: View Transaction History

**As a** DefiCity user
**I want** to see a history of all my transactions
**So that** I can track deposits, withdrawals, placements, harvests, and demolitions

**Acceptance Criteria:**
- [ ] Transaction history shows all transactions
- [ ] Shows transaction type (deposit, withdraw, place, harvest, demolish)
- [ ] Shows asset type
- [ ] Shows amount
- [ ] Shows timestamp
- [ ] Shows transaction hash (clickable → BaseScan)
- [ ] Shows transaction status (success, pending, failed)
- [ ] Filterable by transaction type
- [ ] Filterable by asset type
- [ ] Paginated for performance

**Priority:** P1 (High)
**Estimated:** 3 story points
**Dependencies:** US-005

---

## Epic 3: Town Hall Building (Smart Wallet)

### US-009: Place Town Hall Building

**As a** new DefiCity user
**I want** to place a Town Hall building for free
**So that** I have a visual representation of my smart wallet in my city

**Acceptance Criteria:**
- [ ] User can click empty tile to place building
- [ ] Town Hall appears in building selection menu
- [ ] Town Hall is labeled as "Free" (no deposit required)
- [ ] No asset selection needed
- [ ] No amount input needed
- [ ] Transaction is gasless (via session key)
- [ ] Building appears on map after placement
- [ ] Town Hall cannot be demolished

**Priority:** P1 (High)
**Estimated:** 3 story points
**Dependencies:** US-001

---

### US-010: View Town Hall Info

**As a** DefiCity user
**I want** to click my Town Hall and see my wallet information
**So that** I can view my smart wallet address and total portfolio value

**Acceptance Criteria:**
- [ ] Click Town Hall → Info panel opens
- [ ] Shows smart wallet address
- [ ] Shows copy button for address
- [ ] Shows total portfolio value (all assets)
- [ ] Shows "This is your smart wallet" description
- [ ] No actions available (cannot harvest/demolish)
- [ ] Visual representation distinctive (castle/HQ style)

**Priority:** P2 (Nice to have)
**Estimated:** 2 story points
**Dependencies:** US-009

---

## Epic 4: Bank Building (Aave Integration)

### US-011: Place Bank Building (Supply Mode)

**As a** DefiCity user
**I want** to place a Bank building and supply assets to Aave
**So that** I can earn interest on my crypto holdings

**Acceptance Criteria:**
- [ ] User can select Bank from building menu
- [ ] User can select asset (USDC, USDT, ETH, WBTC)
- [ ] User can select "Supply Only" mode
- [ ] User enters deposit amount (minimum $100)
- [ ] UI shows current Aave supply APY
- [ ] UI shows 0.05% building placement fee
- [ ] User confirms transaction (gasless)
- [ ] Building appears on map
- [ ] Assets supplied to Aave V3
- [ ] User receives aTokens (tracked internally)

**Priority:** P0 (Critical)
**Estimated:** 8 story points
**Dependencies:** US-005

---

### US-012: Place Bank Building (Supply + Borrow Mode)

**As an** advanced DefiCity user
**I want** to place a Bank building, supply collateral, and borrow assets
**So that** I can leverage my positions for greater capital efficiency

**Acceptance Criteria:**
- [ ] User can select "Supply + Borrow" mode
- [ ] User selects collateral asset (e.g., ETH)
- [ ] User enters collateral amount
- [ ] User selects borrow asset (e.g., USDC)
- [ ] UI calculates max borrow amount based on collateral
- [ ] User enters borrow amount (below max)
- [ ] UI shows health factor (must be > 1.5)
- [ ] UI shows liquidation warning if health factor < 1.5
- [ ] UI shows supply APY and borrow APY
- [ ] UI shows net APY (supply APY - borrow APY)
- [ ] User confirms transaction (gasless)
- [ ] Building appears on map
- [ ] Collateral supplied to Aave
- [ ] Assets borrowed from Aave

**Priority:** P1 (High)
**Estimated:** 13 story points
**Dependencies:** US-011

---

### US-013: View Bank Building Info (Supply Mode)

**As a** DefiCity user with a Bank building
**I want** to view my Bank building details
**So that** I can see my supplied amount, earned interest, and APY

**Acceptance Criteria:**
- [ ] Click Bank → Info panel opens
- [ ] Shows asset type (USDC, USDT, ETH, WBTC)
- [ ] Shows "Supply Only" mode indicator
- [ ] Shows supplied amount
- [ ] Shows current value (with accrued interest)
- [ ] Shows supply APY
- [ ] Shows pending rewards
- [ ] Shows total earned since placement
- [ ] Actions: Deposit More, Harvest, Demolish

**Priority:** P0 (Critical)
**Estimated:** 5 story points
**Dependencies:** US-011

---

### US-014: View Bank Building Info (Borrow Mode)

**As a** DefiCity user with a Bank building in borrow mode
**I want** to view my collateral, borrowed amount, and health factor
**So that** I can monitor my position and avoid liquidation

**Acceptance Criteria:**
- [ ] Click Bank → Info panel opens
- [ ] Shows collateral asset and amount
- [ ] Shows borrowed asset and amount
- [ ] Shows health factor (color-coded: green >2, yellow 1.5-2, red <1.5)
- [ ] Shows liquidation threshold
- [ ] Shows supply APY and borrow APY
- [ ] Shows net APY
- [ ] Shows pending supply rewards
- [ ] Shows total interest paid on borrow
- [ ] Warning displayed if health factor < 1.5
- [ ] Actions: Deposit More (collateral), Repay, Harvest, Demolish (only if fully repaid)

**Priority:** P1 (High)
**Estimated:** 8 story points
**Dependencies:** US-012

---

### US-015: Harvest Bank Rewards

**As a** DefiCity user with a Bank building
**I want** to harvest my earned interest
**So that** I can realize my gains and add to my available balance

**Acceptance Criteria:**
- [ ] Click "Harvest" button in Bank info panel
- [ ] Shows pending rewards amount
- [ ] Shows confirmation modal
- [ ] Transaction is gasless
- [ ] Interest withdrawn from Aave (aToken → token)
- [ ] Available balance increases
- [ ] Building remains active
- [ ] Success notification displays
- [ ] Balance updates in real-time

**Priority:** P0 (Critical)
**Estimated:** 3 story points
**Dependencies:** US-013

---

### US-016: Repay Bank Loan

**As a** DefiCity user with a Bank building in borrow mode
**I want** to repay my borrowed amount
**So that** I can improve my health factor or close my position

**Acceptance Criteria:**
- [ ] Click "Repay" button in Bank info panel
- [ ] User enters repay amount (or clicks "Max")
- [ ] UI shows remaining debt after repayment
- [ ] UI shows new health factor after repayment
- [ ] Transaction is gasless
- [ ] Borrowed amount repaid to Aave
- [ ] Health factor updated
- [ ] Can demolish building after full repayment
- [ ] Success notification displays

**Priority:** P1 (High)
**Estimated:** 5 story points
**Dependencies:** US-014

---

### US-017: Demolish Bank Building

**As a** DefiCity user
**I want** to demolish my Bank building
**So that** I can withdraw all my funds and reclaim the tile

**Acceptance Criteria:**
- [ ] Click "Demolish" button in Bank info panel
- [ ] Shows confirmation modal with total value (principal + interest)
- [ ] If borrowing: Must repay fully first (or shows error)
- [ ] Shows warning about losing building
- [ ] Transaction is gasless
- [ ] All assets withdrawn from Aave
- [ ] Building removed from map
- [ ] Available balance increases
- [ ] Success notification displays
- [ ] Tile becomes available for new building

**Priority:** P0 (Critical)
**Estimated:** 5 story points
**Dependencies:** US-015

---

## Epic 5: Shop Building (Aerodrome LP)

### US-018: Place Shop Building (Provide Liquidity)

**As a** DefiCity user
**I want** to place a Shop building and provide liquidity to Aerodrome
**So that** I can earn trading fees and AERO rewards

**Acceptance Criteria:**
- [ ] User can select Shop from building menu
- [ ] User can select liquidity pair (USDC/ETH, USDT/USDC, ETH/WBTC)
- [ ] User can deposit single asset (auto-swap to 50/50)
- [ ] User can deposit dual assets (manual amounts)
- [ ] User enters deposit amount (minimum $500)
- [ ] UI shows trading fee APY
- [ ] UI shows AERO rewards APY
- [ ] UI shows total APY
- [ ] UI shows estimated impermanent loss (IL)
- [ ] UI shows 0.05% building placement fee
- [ ] User confirms transaction (gasless)
- [ ] Building appears on map
- [ ] Liquidity added to Aerodrome pool
- [ ] User receives LP tokens/NFT (tracked internally)

**Priority:** P0 (Critical)
**Estimated:** 13 story points
**Dependencies:** US-005

---

### US-019: View Shop Building Info

**As a** DefiCity user with a Shop building
**I want** to view my LP position details
**So that** I can monitor my liquidity, fees earned, and impermanent loss

**Acceptance Criteria:**
- [ ] Click Shop → Info panel opens
- [ ] Shows liquidity pair (e.g., USDC/ETH)
- [ ] Shows LP position value
- [ ] Shows asset breakdown (how much of each token)
- [ ] Shows trading fees earned
- [ ] Shows AERO rewards earned
- [ ] Shows current APY (fees + AERO rewards)
- [ ] Shows current IL percentage
- [ ] Shows total value change since placement
- [ ] IL indicator color-coded (green <2%, yellow 2-5%, red >5%)
- [ ] Actions: Deposit More, Harvest, Demolish

**Priority:** P0 (Critical)
**Estimated:** 8 story points
**Dependencies:** US-018

---

### US-020: Harvest Shop Rewards (Fees + AERO)

**As a** DefiCity user with a Shop building
**I want** to harvest my trading fees and AERO rewards
**So that** I can realize my gains without removing liquidity

**Acceptance Criteria:**
- [ ] Click "Harvest" button in Shop info panel
- [ ] Shows pending trading fees (in LP tokens)
- [ ] Shows pending AERO rewards
- [ ] Shows total value in USD
- [ ] Transaction is gasless
- [ ] Fees and AERO claimed from Aerodrome
- [ ] Available balance increases
- [ ] LP position remains active
- [ ] Success notification displays
- [ ] Balance updates in real-time

**Priority:** P0 (Critical)
**Estimated:** 5 story points
**Dependencies:** US-019

---

### US-021: Demolish Shop Building

**As a** DefiCity user
**I want** to demolish my Shop building
**So that** I can remove liquidity and withdraw my assets

**Acceptance Criteria:**
- [ ] Click "Demolish" button in Shop info panel
- [ ] Shows confirmation modal with:
  - Total LP value
  - Asset breakdown (how much of each token returned)
  - Current IL percentage
  - Warning about IL if > 2%
- [ ] Transaction is gasless
- [ ] Liquidity removed from Aerodrome
- [ ] Both assets returned to available balance
- [ ] Building removed from map
- [ ] Success notification displays
- [ ] Tile becomes available

**Priority:** P0 (Critical)
**Estimated:** 5 story points
**Dependencies:** US-020

---

## Epic 6: Government Lottery Office (Megapot Integration)

### US-022: Place Government Lottery Office

**As a** DefiCity user
**I want** to place a Government Lottery Office building
**So that** I can purchase lottery tickets through Megapot integration

**Acceptance Criteria:**
- [ ] User can select Gov. Lottery Office from building menu
- [ ] Only supports USDC deposits (Megapot requirement)
- [ ] User enters USDC amount (minimum $10)
- [ ] UI fetches live ticket price from Megapot contract
- [ ] UI calculates: tickets = amount / ticketPrice
- [ ] UI shows: "Tickets will be purchased on Megapot.io on your behalf"
- [ ] UI shows current jackpot ($1M+) from Megapot
- [ ] UI shows responsible gaming warning
- [ ] UI shows: "DefiCity earns referral fee"
- [ ] User confirms transaction (gasless)
- [ ] Building appears on map
- [ ] Megapot.purchaseTickets() called with referrer=DefiCity
- [ ] User owns tickets on Megapot contract

**Priority:** P1 (High)
**Estimated:** 8 story points
**Dependencies:** US-005

---

### US-023: View Government Lottery Office Info

**As a** DefiCity user with a Lottery building
**I want** to view the current jackpot and my ticket information
**So that** I can check jackpot size and see if I won

**Acceptance Criteria:**
- [ ] Click Lottery building → Info panel opens
- [ ] Shows $1M+ jackpot amount (live from Megapot.getJackpotAmount())
- [ ] Shows user's total ticket count (from Megapot.getUsersInfo())
- [ ] Shows total USDC spent on tickets
- [ ] Shows countdown to next draw (from Megapot.getTimeRemaining())
- [ ] Shows last winner info (from Megapot.getLastJackpotResults())
- [ ] Shows "Powered by Megapot.io" badge
- [ ] Shows "View on Megapot.io" link
- [ ] Shows responsible gaming warnings
- [ ] Actions: Buy More Tickets, Check Winnings, View on Megapot.io

**Priority:** P1 (High)
**Estimated:** 5 story points
**Dependencies:** US-022

---

### US-024: Buy More Lottery Tickets

**As a** DefiCity user with a Lottery building
**I want** to buy additional lottery tickets
**So that** I can increase my chances of winning the jackpot

**Acceptance Criteria:**
- [ ] Click "Buy More Tickets" button
- [ ] User enters additional USDC amount
- [ ] UI fetches current ticket price from Megapot
- [ ] UI calculates additional ticket count
- [ ] UI shows total tickets after purchase
- [ ] Transaction is gasless
- [ ] Megapot.purchaseTickets() called
- [ ] Ticket count updates in info panel
- [ ] Success notification displays

**Priority:** P1 (High)
**Estimated:** 3 story points
**Dependencies:** US-023

---

### US-025: Check Lottery Winnings

**As a** DefiCity user with lottery tickets
**I want** to check if I have any claimable winnings
**So that** I know if I won a prize

**Acceptance Criteria:**
- [ ] Click "Check Winnings" button in Lottery info panel
- [ ] Fetches Megapot.winningsClaimable(user)
- [ ] If winnings = 0: Shows "No winnings yet"
- [ ] If winnings > 0: Shows "You Won! $X.XX"
- [ ] Shows celebratory animation if won
- [ ] Shows "Claim on Megapot.io" button (external link)
- [ ] Note displayed: "Claims are processed on Megapot.io"
- [ ] Link opens Megapot.io claim page
- [ ] Responsible gaming reminder displayed

**Priority:** P1 (High)
**Estimated:** 3 story points
**Dependencies:** US-023

---

### US-026: Demolish Lottery Building

**As a** DefiCity user
**I want** to demolish my Lottery building
**So that** I can reclaim the tile (note: no funds returned, tickets remain on Megapot)

**Acceptance Criteria:**
- [ ] Click "Demolish" button in Lottery info panel
- [ ] Shows confirmation modal:
  - "Tickets remain on Megapot.io"
  - "You can still claim winnings on Megapot.io"
  - "No funds will be returned to your wallet"
- [ ] Transaction is gasless
- [ ] Building removed from map
- [ ] Tile becomes available
- [ ] User's tickets remain on Megapot contract (not affected)
- [ ] Success notification displays

**Priority:** P2 (Nice to have)
**Estimated:** 2 story points
**Dependencies:** US-023

---

## Epic 7: Account Abstraction & Gasless Gameplay

### US-027: Create Session Key for Gasless Gameplay

**As a** DefiCity user
**I want** to create a session key
**So that** I can play the game without approving every transaction

**Acceptance Criteria:**
- [ ] User clicks "Enable Gasless Gameplay" button
- [ ] Shows explanation modal:
  - "Session key allows gasless transactions"
  - "Valid for 24 hours"
  - "Limited to 1000 USDC/day"
  - "Only works with DefiCity contracts"
- [ ] User approves session key creation (one-time approval)
- [ ] Session key generated and stored (encrypted in localStorage)
- [ ] UI shows "Gasless Enabled" indicator
- [ ] UI shows expiry time (24h countdown)
- [ ] All gameplay actions now gasless (place, harvest, demolish, buy lottery)

**Priority:** P0 (Critical)
**Estimated:** 8 story points
**Dependencies:** US-001

---

### US-028: View Session Key Status

**As a** DefiCity user
**I want** to see my session key status
**So that** I know if my gameplay is gasless and when it expires

**Acceptance Criteria:**
- [ ] Dashboard shows session key status
- [ ] Shows "Active" with green indicator when valid
- [ ] Shows "Expired" with red indicator when expired
- [ ] Shows time remaining (countdown)
- [ ] Shows daily spending limit (1000 USDC)
- [ ] Shows amount spent today
- [ ] Shows remaining daily allowance
- [ ] Shows "Refresh" button when < 1 hour remaining

**Priority:** P1 (High)
**Estimated:** 3 story points
**Dependencies:** US-027

---

### US-029: Auto-Refresh Session Key

**As a** DefiCity user with an expiring session key
**I want** the system to automatically refresh my session key
**So that** my gameplay remains gasless without manual intervention

**Acceptance Criteria:**
- [ ] System checks session key expiry every 10 minutes
- [ ] When < 1 hour remaining: Shows prompt "Refresh session key?"
- [ ] User clicks "Yes" → New session key created automatically
- [ ] New 24-hour validity period starts
- [ ] Seamless transition (no gameplay interruption)
- [ ] Success notification: "Gasless gameplay extended"

**Priority:** P1 (High)
**Estimated:** 5 story points
**Dependencies:** US-028

---

### US-030: Revoke Session Key

**As a** DefiCity user
**I want** to revoke my session key manually
**So that** I can secure my account if needed (e.g., on public computer)

**Acceptance Criteria:**
- [ ] Dashboard shows "Revoke Session Key" button
- [ ] Shows confirmation modal: "This will disable gasless gameplay"
- [ ] User confirms revocation
- [ ] Session key removed from localStorage
- [ ] Session key revoked on smart wallet contract
- [ ] UI shows "Gasless Disabled"
- [ ] All future transactions require wallet approval
- [ ] Success notification displays

**Priority:** P1 (High)
**Estimated:** 3 story points
**Dependencies:** US-028

---

### US-031: View Gasless Stats

**As a** DefiCity user
**I want** to see how much gas I've saved with gasless gameplay
**So that** I understand the value of Account Abstraction

**Acceptance Criteria:**
- [ ] Dashboard shows "Gas Saved" section
- [ ] Shows total gasless transactions count
- [ ] Shows total gas saved in USD
- [ ] Shows average gas per transaction
- [ ] Shows daily gas spending (via paymaster)
- [ ] Shows remaining daily gas allowance
- [ ] Comparison: "You saved $X vs. regular transactions"

**Priority:** P2 (Nice to have)
**Estimated:** 3 story points
**Dependencies:** US-027

---

### US-032: Fallback to Regular Transactions

**As a** DefiCity user
**I want** the system to fallback to regular wallet transactions if the paymaster is exhausted
**So that** I can continue using the platform even if gasless gameplay is unavailable

**Acceptance Criteria:**
- [ ] System detects if paymaster has insufficient balance
- [ ] Shows warning modal: "Gasless gameplay temporarily unavailable"
- [ ] Offers option: "Continue with regular transaction (you pay gas)"
- [ ] User can choose to proceed or cancel
- [ ] If proceeding: Transaction uses regular wallet approval
- [ ] UI clearly indicates "You will pay gas for this transaction"
- [ ] Success notification: "Transaction completed (regular)"

**Priority:** P1 (High)
**Estimated:** 5 story points
**Dependencies:** US-027

---

## Epic 8: City Map & Visualization

### US-033: View City Map

**As a** DefiCity user
**I want** to see my city map in an isometric view
**So that** I can visualize my DeFi portfolio as buildings

**Acceptance Criteria:**
- [ ] Map displays in isometric grid layout
- [ ] Shows empty tiles (available for building)
- [ ] Shows placed buildings (visually distinct by type)
- [ ] Each building has unique sprite:
  - Town Hall: Castle/headquarters style
  - Bank: Modern building with Aave branding
  - Shop: Market/store with Aerodrome branding
  - Lottery: Government building with Megapot branding
- [ ] Map is responsive (mobile/tablet/desktop)
- [ ] Smooth animations (60fps)

**Priority:** P0 (Critical)
**Estimated:** 8 story points
**Dependencies:** US-001

---

### US-034: Zoom and Pan City Map

**As a** DefiCity user with multiple buildings
**I want** to zoom and pan my city map
**So that** I can navigate and view buildings easily

**Acceptance Criteria:**
- [ ] User can zoom in/out (mouse wheel or pinch gesture)
- [ ] User can pan (click-drag or swipe)
- [ ] Zoom range: 50% to 200%
- [ ] Panning stays within map bounds
- [ ] Smooth zoom/pan animations
- [ ] Reset button to default view
- [ ] Zoom level persisted across sessions

**Priority:** P1 (High)
**Estimated:** 5 story points
**Dependencies:** US-033

---

### US-035: Hover Building Preview

**As a** DefiCity user
**I want** to see a quick preview when hovering over a building
**So that** I can quickly understand building status without clicking

**Acceptance Criteria:**
- [ ] Hover over building → Tooltip appears
- [ ] Shows building type
- [ ] Shows asset type
- [ ] Shows current value
- [ ] Shows pending rewards (if any)
- [ ] Shows status indicator (active, liquidation warning, etc.)
- [ ] Tooltip positioned to not cover building
- [ ] Tooltip disappears on mouse leave

**Priority:** P2 (Nice to have)
**Estimated:** 3 story points
**Dependencies:** US-033

---

### US-036: Empty State (No Buildings)

**As a** new DefiCity user with no buildings
**I want** to see a helpful empty state
**So that** I understand what to do next

**Acceptance Criteria:**
- [ ] Shows empty map with "Start building your DeFi city!"
- [ ] Shows call-to-action: "Click any tile to place your first building"
- [ ] Shows illustration/animation
- [ ] Highlights available tiles
- [ ] Optional: Shows example city
- [ ] Disappears after first building placed

**Priority:** P2 (Nice to have)
**Estimated:** 2 story points
**Dependencies:** US-033

---

## Epic 9: Analytics & Insights

### US-037: View Total Portfolio Value Over Time

**As a** DefiCity user
**I want** to see my total portfolio value over time
**So that** I can track my DeFi portfolio performance

**Acceptance Criteria:**
- [ ] Dashboard shows portfolio value chart
- [ ] Chart displays value over time (daily data points)
- [ ] Shows time range selector (7D, 30D, 90D, 1Y, All)
- [ ] Shows total portfolio value (all assets + buildings)
- [ ] Shows percentage change
- [ ] Shows absolute change in USD
- [ ] Color-coded (green for gains, red for losses)
- [ ] Interactive chart (hover to see value at specific time)

**Priority:** P2 (Nice to have)
**Estimated:** 8 story points
**Dependencies:** US-006

---

### US-038: View Asset Distribution Breakdown

**As a** DefiCity user
**I want** to see how my portfolio is distributed across different assets
**So that** I can understand my asset allocation

**Acceptance Criteria:**
- [ ] Dashboard shows asset distribution pie chart
- [ ] Shows percentage for each asset (USDC, USDT, ETH, WBTC)
- [ ] Shows USD value for each asset
- [ ] Interactive chart (hover to see details)
- [ ] Color-coded by asset
- [ ] Shows legend
- [ ] Includes both available + invested amounts

**Priority:** P2 (Nice to have)
**Estimated:** 5 story points
**Dependencies:** US-006

---

### US-039: View Yield Earned by Building Type

**As a** DefiCity user
**I want** to see how much yield I've earned from each building type
**So that** I can optimize my strategy

**Acceptance Criteria:**
- [ ] Dashboard shows yield breakdown by building type
- [ ] Shows total earned from Bank buildings
- [ ] Shows total earned from Shop buildings
- [ ] Shows total spent on Lottery (if any)
- [ ] Shows percentage contribution to total yield
- [ ] Shows average APY by building type
- [ ] Bar chart or table format
- [ ] Filterable by time period (7D, 30D, All)

**Priority:** P2 (Nice to have)
**Estimated:** 5 story points
**Dependencies:** US-015, US-020

---

### US-040: View Building Performance Comparison

**As a** DefiCity user with multiple buildings
**I want** to compare performance across my buildings
**So that** I can identify my best and worst performers

**Acceptance Criteria:**
- [ ] Dashboard shows building performance table
- [ ] Lists all buildings with:
  - Building type
  - Asset type
  - Initial investment
  - Current value
  - Total earned
  - ROI percentage
  - APY
- [ ] Sortable by any column
- [ ] Filterable by building type
- [ ] Highlight best performer (green)
- [ ] Highlight worst performer (red)

**Priority:** P2 (Nice to have)
**Estimated:** 8 story points
**Dependencies:** US-015, US-020

---

## Story Mapping & Prioritization

### MVP (Minimum Viable Product) Stories - Phase 1 & 2

**Must Have (P0):**
1. US-001: New User Signup
2. US-002: Returning User Login
3. US-005: Deposit Multi-Asset Funds
4. US-006: View Multi-Asset Portfolio
5. US-007: Withdraw Multi-Asset Funds
6. US-011: Place Bank Building (Supply Mode)
7. US-013: View Bank Building Info (Supply Mode)
8. US-015: Harvest Bank Rewards
9. US-017: Demolish Bank Building
10. US-018: Place Shop Building
11. US-019: View Shop Building Info
12. US-020: Harvest Shop Rewards
13. US-021: Demolish Shop Building
14. US-027: Create Session Key
15. US-033: View City Map

**Total MVP Points: ~100 story points**

---

### Post-MVP Stories - Phase 3

**Should Have (P1):**
1. US-003: Guardian Recovery Setup
2. US-004: Onboarding Tutorial
3. US-008: View Transaction History
4. US-009: Place Town Hall Building
5. US-012: Place Bank Building (Borrow Mode)
6. US-014: View Bank Building Info (Borrow Mode)
7. US-016: Repay Bank Loan
8. US-022: Place Government Lottery Office
9. US-023: View Lottery Info
10. US-024: Buy More Lottery Tickets
11. US-025: Check Lottery Winnings
12. US-028: View Session Key Status
13. US-029: Auto-Refresh Session Key
14. US-030: Revoke Session Key
15. US-032: Fallback to Regular Transactions
16. US-034: Zoom and Pan City Map

**Total Phase 3 Points: ~80 story points**

---

### Future Enhancements - Phase 4+

**Nice to Have (P2):**
1. US-010: View Town Hall Info
2. US-026: Demolish Lottery Building
3. US-031: View Gasless Stats
4. US-035: Hover Building Preview
5. US-036: Empty State (No Buildings)
6. US-037: View Total Portfolio Value Over Time
7. US-038: View Asset Distribution Breakdown
8. US-039: View Yield Earned by Building Type
9. US-040: View Building Performance Comparison

**Total Future Points: ~45 story points**

---

## Story Dependencies Map

```
US-001 (Signup)
  ├─> US-002 (Login)
  ├─> US-003 (Guardian Recovery)
  ├─> US-004 (Onboarding Tutorial)
  ├─> US-005 (Deposit)
  │     ├─> US-006 (View Portfolio)
  │     │     ├─> US-007 (Withdraw)
  │     │     ├─> US-008 (Transaction History)
  │     │     ├─> US-037 (Portfolio Over Time)
  │     │     └─> US-038 (Asset Distribution)
  │     ├─> US-011 (Bank Supply)
  │     │     ├─> US-012 (Bank Borrow)
  │     │     │     ├─> US-014 (Bank Borrow Info)
  │     │     │     └─> US-016 (Repay Loan)
  │     │     ├─> US-013 (Bank Supply Info)
  │     │     ├─> US-015 (Harvest Bank)
  │     │     │     └─> US-039 (Yield Breakdown)
  │     │     └─> US-017 (Demolish Bank)
  │     ├─> US-018 (Shop LP)
  │     │     ├─> US-019 (Shop Info)
  │     │     ├─> US-020 (Harvest Shop)
  │     │     │     └─> US-039 (Yield Breakdown)
  │     │     └─> US-021 (Demolish Shop)
  │     └─> US-022 (Lottery Place)
  │           ├─> US-023 (Lottery Info)
  │           ├─> US-024 (Buy More Tickets)
  │           ├─> US-025 (Check Winnings)
  │           └─> US-026 (Demolish Lottery)
  ├─> US-009 (Town Hall Place)
  │     └─> US-010 (Town Hall Info)
  ├─> US-027 (Session Key)
  │     ├─> US-028 (Session Key Status)
  │     ├─> US-029 (Auto-Refresh Key)
  │     ├─> US-030 (Revoke Key)
  │     ├─> US-031 (Gasless Stats)
  │     └─> US-032 (Fallback)
  └─> US-033 (City Map)
        ├─> US-034 (Zoom/Pan)
        ├─> US-035 (Hover Preview)
        └─> US-036 (Empty State)

US-015 + US-020
  └─> US-040 (Building Performance Comparison)
```

---

## Estimation Guidelines

- **1 point:** Very simple, < 1 day (e.g., UI change, simple view)
- **2 points:** Simple, 1 day (e.g., basic CRUD, simple form)
- **3 points:** Moderate, 1-2 days (e.g., feature with validation)
- **5 points:** Complex, 2-3 days (e.g., multi-step flow, integration)
- **8 points:** Very complex, 3-5 days (e.g., complex integration, multiple contracts)
- **13 points:** Epic-level, 5-8 days (e.g., new building type with full flow)

---

## Definition of Done

For a user story to be considered "Done":

1. **Development:**
   - [ ] All acceptance criteria met
   - [ ] Code reviewed and approved
   - [ ] Unit tests written and passing (>80% coverage)
   - [ ] Integration tests passing

2. **Testing:**
   - [ ] Manually tested on testnet
   - [ ] Cross-browser tested (Chrome, Firefox, Safari)
   - [ ] Mobile-responsive tested
   - [ ] No critical or high-priority bugs

3. **Documentation:**
   - [ ] Code commented (complex logic)
   - [ ] API endpoints documented
   - [ ] User-facing changes documented

4. **Deployment:**
   - [ ] Deployed to testnet
   - [ ] Smoke tests passing
   - [ ] Ready for mainnet deployment

---

## Notes

- **Multi-Asset Support:** All building types except Lottery support USDC, USDT, ETH, WBTC
- **Lottery USDC-Only:** Megapot integration only accepts USDC deposits
- **Gasless Gameplay:** All gameplay actions (place, harvest, demolish, buy lottery) are gasless via session keys
- **Regular Transactions:** Deposits and withdrawals are NOT gasless (user pays gas)
- **No Unlock Requirements:** All 4 building types available from start (no progression system)
- **Building Fee:** 0.05% fee on building placement (collected by DefiCity)
- **Megapot Referral:** DefiCity earns referral fees when users buy lottery tickets

---

**Total User Stories:** 40
**Total Story Points:** ~225 points
**Estimated Timeline:** 16 weeks (4 months) with 2 full-stack developers

---

**End of User Stories Document**
