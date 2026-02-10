# DeFi City

A city builder game that transforms DeFi into easy-to-understand game mechanics. Build your virtual city by interacting with real DeFi protocols — supply to Aave, provide liquidity on Uniswap V3, play the Megapot lottery, and more.

## Overview

DeFi City is a monorepo containing:

| Package                  | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| [contract/](./contract/) | Smart contracts — ERC-4337 Smart Wallet, Adapters, Game Core |
| [frontend/](./frontend/) | Next.js web application — PixiJS isometric game + DeFi UI    |
| [docs/](./docs/)         | Architecture documentation and user stories                  |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### 1. Clone and Install

```bash
git clone https://github.com/BrookerGroup/defi-city.git
cd defi-city

# Install contract dependencies
cd contract && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Setup Environment

```bash
# Contract
cp contract/.env.example contract/.env
# Edit contract/.env with your private key and RPC URLs

# Frontend
cp frontend/.env.local.example frontend/.env.local
# Edit frontend/.env.local with your API keys
```

### 3. Run Development

```bash
# Terminal 1: Compile contracts
cd contract && npx hardhat compile

# Terminal 2: Run frontend
cd frontend && npm run dev
```

---

## Project Structure

```
defi-city/
│
├── contract/                           # Smart Contracts (Solidity + Hardhat)
│   ├── contracts/
│   │   ├── core/                       #   Game logic (bookkeeping only, never holds funds)
│   │   │   ├── DefiCityCore.sol        #     Central game state: buildings, grid, user stats
│   │   │   └── BuildingRegistry.sol    #     Adapter router: routes operations to correct adapter
│   │   │
│   │   ├── wallet/                     #   User wallet (holds all user funds)
│   │   │   └── SmartWallet.sol         #     ERC-4337 AA wallet: execute, session keys, pause
│   │   │
│   │   ├── factory/                    #   Wallet deployment
│   │   │   └── WalletFactory.sol       #     CREATE2 deterministic wallet deployer
│   │   │
│   │   ├── adapters/                   #   DeFi protocol integrations (prepare calldata, never hold funds)
│   │   │   ├── BankAdapter.sol         #     Aave V3: supply, borrow, withdraw, repay
│   │   │   ├── ShopAdapter.sol         #     Aerodrome: LP provision, fee claiming
│   │   │   ├── LotteryAdapter.sol      #     Megapot: buy tickets, claim prizes
│   │   │   ├── UniswapLPBuildingAdapter.sol  # Uniswap V3: LP position as building
│   │   │   ├── SwapAdapter.sol         #     Uniswap V3: token swap (utility, no building)
│   │   │   └── LPAdapter.sol           #     Uniswap V3: LP management (utility)
│   │   │
│   │   ├── interfaces/                 #   External protocol interfaces
│   │   │   ├── IBuildingAdapter.sol     #     Standard adapter interface (all adapters implement this)
│   │   │   ├── IAccount.sol            #     ERC-4337 account interface
│   │   │   ├── IEntryPoint.sol         #     ERC-4337 EntryPoint interface
│   │   │   ├── UserOperation.sol       #     ERC-4337 UserOperation struct
│   │   │   ├── IAavePool.sol           #     Aave V3 Pool (supply/borrow/withdraw/repay)
│   │   │   ├── IAToken.sol             #     Aave interest-bearing token
│   │   │   ├── IAerodromeRouter.sol    #     Aerodrome DEX Router
│   │   │   ├── IAerodromePair.sol      #     Aerodrome LP pair
│   │   │   ├── IAerodromeGauge.sol     #     Aerodrome staking gauge
│   │   │   ├── IMegapot.sol            #     Megapot lottery
│   │   │   ├── INonfungiblePositionManager.sol  # Uniswap V3 NFT position manager
│   │   │   └── ISwapRouter02.sol       #     Uniswap V3 swap router
│   │   │
│   │   ├── mocks/                      #   Mock contracts for local testing
│   │   │   ├── MockEntryPoint.sol      #     Minimal ERC-4337 EntryPoint
│   │   │   ├── MockAavePool.sol        #     Simulates Aave V3 Pool
│   │   │   ├── MockMegapot.sol         #     Simulates Megapot lottery
│   │   │   ├── MockAerodromeRouter.sol #     Simulates Aerodrome DEX
│   │   │   ├── MockAerodromePair.sol   #     Simulates Aerodrome LP pair
│   │   │   └── MockAerodromeGauge.sol  #     Simulates Aerodrome staking
│   │   └── MockERC20.sol              #   Generic ERC20 token for testing
│   │
│   ├── ignition/                       #   Hardhat Ignition deployment modules
│   │   └── modules/
│   │       ├── CoreContracts.ts        #     Deploy core game infrastructure
│   │       └── IntegrationContracts.ts #     Deploy adapters + mock protocols
│   │
│   ├── scripts/                        #   Deployment & utility scripts
│   │   ├── deploy-base-sepolia.js      #     Deploy to Base Sepolia testnet
│   │   ├── deploy.js                   #     Deploy to localhost
│   │   ├── test-deployed.js            #     Verify deployed contracts
│   │   ├── verify-contracts.ts         #     Etherscan/BaseScan verification
│   │   └── auto-verify-wallets.ts      #     Batch wallet verification
│   │
│   ├── deployments/                    #   Deployment records (addresses, timestamps)
│   ├── artifacts/                      #   Compiled ABIs + bytecode
│   ├── hardhat.config.ts              #   Hardhat config (networks, compiler, plugins)
│   └── package.json                   #   Dependencies (hardhat, openzeppelin, etc.)
│
├── frontend/                           # Web Application (Next.js + PixiJS)
│   └── src/
│       ├── app/                        #   Next.js App Router (pages)
│       │   ├── layout.tsx              #     Root layout: fonts, dark mode, ErrorBoundary
│       │   ├── page.tsx                #     Landing page (URL: /)
│       │   └── app/                    #     Game route (URL: /app)
│       │       ├── layout.tsx          #       Wraps with PrivyProvider + WagmiProvider
│       │       └── page.tsx            #       Main game page (669 lines of orchestration)
│       │
│       ├── components/                 #   React components
│       │   ├── providers/              #     Context providers
│       │   │   ├── PrivyProvider.tsx    #       Wallet authentication (dark theme, amber accent)
│       │   │   ├── WagmiProvider.tsx    #       Blockchain connection + React Query
│       │   │   └── index.tsx           #       ErrorBoundary + Toaster wrapper
│       │   │
│       │   ├── game/                   #     PixiJS Game Engine
│       │   │   ├── GameCanvas.tsx      #       PixiJS Application container (full-screen WebGL)
│       │   │   ├── GameWorld.ts        #       Game state & world logic
│       │   │   ├── IsometricGrid.ts    #       13x13 grid with isometric projection
│       │   │   ├── BuildingRenderer.ts #       Render buildings (color-coded by type)
│       │   │   ├── TileInteraction.ts  #       Click/drag/selection handling on tiles
│       │   │   ├── Animations.ts       #       Building transition & effect animations
│       │   │   ├── useGameState.ts     #       React hook: camera, selection, drag state
│       │   │   └── ui/                 #       Game UI overlay panels
│       │   │       ├── GameHUD.tsx     #         Top bar: wallet/vault balance, action buttons
│       │   │       ├── BottomBar.tsx   #         Bottom: building count, drag-to-build buttons
│       │   │       ├── BuildPanel.tsx  #         Manage existing building (harvest, demolish)
│       │   │       ├── BuildingDialog.tsx  #     Create new Aave supply/borrow building
│       │   │       ├── VaultPanel.tsx  #         Deposit/withdraw tokens + Uniswap swap
│       │   │       ├── LotteryDialog.tsx  #      Buy lottery tickets + Megapot LP
│       │   │       ├── TownHallModal.tsx  #      First-time town hall creation modal
│       │   │       ├── TownHallInfoPanel.tsx  #  View town hall stats
│       │   │       └── TransactionHistoryPanel.tsx  # On-chain transaction history
│       │   │
│       │   ├── aave/                   #     Aave Protocol UI
│       │   │   └── AavePanel.tsx       #       Supply/Borrow tabs, reserve data, health factor
│       │   ├── lp/                     #     Uniswap V3 LP UI
│       │   │   ├── LPPanel.tsx         #       View LP positions
│       │   │   └── LPBuildingPanel.tsx #       Manage LP building (increase/decrease/collect)
│       │   ├── swap/                   #     Uniswap V3 Swap UI
│       │   │   └── SwapPanel.tsx       #       Token swap with quote preview
│       │   ├── lottery/                #     Megapot Lottery UI
│       │   │   ├── LotteryPanel.tsx    #       Buy tickets, view jackpot, claim winnings
│       │   │   └── LotteryLPPanel.tsx  #       Megapot LP deposit/withdraw
│       │   │
│       │   ├── landing/                #     Landing page components
│       │   │   ├── LandingPage.tsx     #       Main landing container
│       │   │   ├── IsometricBuilding.tsx  #    3D isometric building graphics
│       │   │   ├── FeatureCard.tsx     #       Feature display card
│       │   │   ├── ParticleField.tsx   #       Animated particle background
│       │   │   ├── pixel/              #       Pixel-art themed UI components
│       │   │   │   ├── PixelBackground.tsx, PixelButton.tsx, PixelCard.tsx, BuildingIcon.tsx
│       │   │   └── sections/           #       Landing page sections
│       │   │       ├── HeroSection.tsx, ConceptSection.tsx, StrategiesSection.tsx
│       │   │       ├── FeaturesSection.tsx, CTASection.tsx, FooterSection.tsx
│       │   │
│       │   ├── ui/                     #     Shared UI components
│       │   │   └── ErrorPopup.tsx      #       Pixel-art error popup
│       │   └── ErrorBoundary.tsx       #     Catches React errors gracefully
│       │
│       ├── hooks/                      #   Custom React hooks (27 hooks)
│       │   │
│       │   │  -- Smart Account --
│       │   ├── useSmartWallet.ts       #     Fetch Smart Wallet address from DefiCityCore
│       │   ├── useCreateSmartAccount.ts #    Create Town Hall + deploy Smart Wallet
│       │   │
│       │   │  -- Vault (Deposit/Withdraw) --
│       │   ├── useVaultDeposit.ts      #     Deposit tokens from EOA to Smart Wallet
│       │   ├── useVaultWithdraw.ts     #     Withdraw tokens from Smart Wallet to EOA
│       │   │
│       │   │  -- Aave Protocol --
│       │   ├── useAaveSupply.ts        #     Supply to Aave + create bank building
│       │   ├── useAaveWithdraw.ts      #     Withdraw from Aave + demolish building
│       │   ├── useAaveBorrow.ts        #     Borrow from Aave + create borrow building
│       │   ├── useAaveRepay.ts         #     Repay Aave loan + demolish borrow building
│       │   ├── useAavePosition.ts      #     Get user's Aave position (supply/borrow/HF)
│       │   ├── useAaveMarketData.ts    #     Get market APY data
│       │   ├── useAaveReserveData.ts   #     Get reserve caps, LTV, oracle price
│       │   ├── useAaveHarvest.ts       #     Harvest accrued interest
│       │   │
│       │   │  -- City Buildings --
│       │   ├── useCityBuildings.ts     #     Fetch all buildings with live DeFi data
│       │   ├── useMoveBuilding.ts      #     Move building to new grid position
│       │   │
│       │   │  -- Uniswap V3 --
│       │   ├── useUniswapSwap.ts       #     Swap tokens via Uniswap V3
│       │   ├── useUniswapLP.ts         #     Fetch existing LP positions
│       │   ├── useUniswapLPBuild.ts    #     Create new LP position + building
│       │   │
│       │   │  -- Megapot Lottery --
│       │   ├── useLotteryData.ts       #     Global lottery data (pot, round, fee)
│       │   ├── useLotteryPosition.ts   #     User's tickets + claimable winnings
│       │   ├── useLotteryBuyTickets.ts #     Purchase lottery tickets
│       │   ├── useLotteryClaimWinnings.ts  # Claim lottery winnings
│       │   ├── useLotteryRunJackpot.ts #     Run jackpot (testnet only)
│       │   ├── useLotteryHistory.ts    #     Past lottery draw history
│       │   │
│       │   │  -- Megapot LP --
│       │   ├── useMegapotLPPosition.ts #     Get LP position in Megapot pool
│       │   ├── useMegapotLPDeposit.ts  #     Deposit to Megapot LP pool
│       │   ├── useMegapotLPWithdraw.ts #     Withdraw from Megapot LP pool
│       │   │
│       │   │  -- Utility --
│       │   └── useTransactionHistory.ts #    Fetch tx history from BaseScan API
│       │
│       ├── config/                     #   Configuration
│       │   ├── contracts.ts            #     All contract addresses + ABIs (Base Sepolia)
│       │   └── aave.ts                #     Aave market data fallback prices
│       │
│       └── lib/                        #   Utilities & libraries
│           ├── constants.ts            #     Chain ID, RPC URL, grid size, Megapot config
│           ├── wagmi.ts               #     Wagmi config (chain, connectors, transport)
│           ├── utils.ts               #     Utility functions (cn for classnames)
│           ├── isometric.ts           #     Isometric projection math for PixiJS
│           ├── mapLayout.ts           #     Grid layout generation (13x13)
│           └── contracts/             #     Legacy contract ABIs
│               ├── addresses.ts       #       Contract addresses
│               └── abis/              #       ABI definitions
│                   ├── ERC20.ts, SmartWallet.ts, SimpleWalletFactory.ts
│
├── docs/                               # Documentation
│   ├── CONTRACT_ARCHITECTURE.md        #   Smart contract architecture (v3.0)
│   ├── FRONTEND_ARCHITECTURE.md        #   Frontend architecture (v3.0)
│   └── USER_STORIES.md                #   User stories and requirements
│
├── subgraph/                           # The Graph subgraph (event indexing)
├── .github/                            # GitHub Actions CI/CD
├── .gitignore
└── README.md                           # This file
```

## Features

### DeFi Protocols

- **Aave V3** - Supply assets to earn interest, borrow against collateral
- **Uniswap V3** - Swap tokens, provide concentrated liquidity
- **Megapot** - Lottery tickets with jackpot prizes, LP for the lottery pool

### Game Mechanics

- **City Builder** - 13x13 isometric grid rendered with PixiJS (WebGL)
- **Building Types** - Town Hall, Bank (Aave), LP (Uniswap), Lottery (Megapot)
- **Building Levels** - 1-5 stars based on USD value of DeFi position
- **Drag-to-Build** - Drag building type from bottom bar to place on map

### Architecture

- **Smart Wallet** - ERC-4337 Account Abstraction wallet per user
- **Self-Custodial** - User's SmartWallet holds all funds, game contracts are bookkeeping only
- **Session Keys** - Time-limited, spending-capped keys for gasless gameplay
- **Adapter Pattern** - Hot-swappable DeFi protocol adapters via BuildingRegistry

## Deployed Contracts (Base Sepolia)

### Core Contracts

| Contract         | Address                                      |
| ---------------- | -------------------------------------------- |
| DefiCityCore     | `0xF0f613927953c93646550B9F990BF9894Af9A5Ef` |
| WalletFactory    | `0x7693D97D6d7e03A3E224E9124d0A547Fd58543Df` |
| EntryPoint       | `0x7D626d4be9158853D7568C9e3935F49f24522826` |
| BuildingRegistry | `0xEc580BCB26D49eb9e1403559F47dB7Ed8c5a5c8f` |
| BankAdapter      | `0xf616fc3AcDa7d33533FF17ba73745a6cF3f8b7ad` |
| SwapAdapter      | `0xf692caBc47D0E05DeDEeF8e39Ef762E7a4940f35` |

### External Protocols

| Contract              | Address                                      |
| --------------------- | -------------------------------------------- |
| Aave Pool             | `0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27` |
| Uniswap V3 SwapRouter | `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4` |
| Uniswap V3 Factory    | `0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24` |
| NFT Position Manager  | `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2` |
| Megapot               | `0x6f03c7BCaDAdBf5E6F5900DA3d56AdD8FbDac5De` |

### Tokens

| Token      | Address                                      | Decimals |
| ---------- | -------------------------------------------- | -------- |
| USDC       | `0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f` | 6        |
| USDT       | `0x0a215D8ba66387DCA84B284D18c3B4ec3de6E54a` | 6        |
| ETH (WETH) | `0x4200000000000000000000000000000000000006` | 18       |
| WBTC       | `0x54114591963CF60EF3aA63bEfD6eC263D98145a4` | 8        |
| LINK       | `0x810D46F9a9027E28F9B01F75E2bdde839dA61115` | 18       |
| MPUSDC     | `0xA4253E7C13525287C56550b8708100f93E60509f` | 6        |

## Tech Stack

### Smart Contracts

- Solidity 0.8.20 (viaIR, 200 runs optimizer)
- Hardhat 3.x
- OpenZeppelin Contracts 5.x
- ERC-4337 (Account Abstraction)

### Frontend

- Next.js 16 (App Router, static export)
- React 19 + TypeScript 5
- PixiJS 8 (2D WebGL game engine)
- wagmi 3 + viem 2 (blockchain interaction)
- ethers 6 (ABI encoding)
- Privy (wallet authentication)
- Tailwind CSS 4 + Framer Motion
- React Query (data caching)

## Documentation

| Document                                                         | Description                      |
| ---------------------------------------------------------------- | -------------------------------- |
| [docs/CONTRACT_ARCHITECTURE.md](./docs/CONTRACT_ARCHITECTURE.md) | Smart contract architecture v3.0 |
| [docs/FRONTEND_ARCHITECTURE.md](./docs/FRONTEND_ARCHITECTURE.md) | Frontend architecture v3.0       |
| [docs/USER_STORIES.md](./docs/USER_STORIES.md)                   | User stories and requirements    |

## Development

### Contract Commands

```bash
cd contract

# Compile
npx hardhat compile

# Test
npx hardhat test

# Deploy to Base Sepolia
npx hardhat run scripts/deploy-base-sepolia.js --network baseSepolia

# Verify on BaseScan
npx hardhat run scripts/verify-contracts.ts --network baseSepolia
```

### Frontend Commands

```bash
cd frontend

# Development
npm run dev

# Build (static export)
_ฟอหผ แnpm run build

# Lint
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](./LICENSE) file for details
