# DeFi City - Frontend

A city builder game where buildings are connected to real DeFi protocols. Build your city, earn real crypto!

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Game Engine**: PixiJS v8
- **Web3**: wagmi v2 + viem v2
- **Authentication**: Privy
- **State Management**: Zustand
- **Data Fetching**: TanStack Query v5
- **UI**: TailwindCSS + shadcn/ui

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your credentials:

```env
# Network
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Contracts (already deployed)
NEXT_PUBLIC_FACTORY_ADDRESS=0x0899fDF0Dfe72751925901e72DB41A0aDB18be47

# Privy - Get from https://dashboard.privy.io
NEXT_PUBLIC_PRIVY_APP_ID=cmkdst1i60247js0ch5borb9u

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-id
```

### 3. Get Privy App ID

1. Go to [dashboard.privy.io](https://dashboard.privy.io)
2. Create a new app
3. Copy the App ID
4. Paste it in `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Getting Sepolia ETH

To test on Sepolia testnet, you'll need some test ETH:

- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [Chainlink Faucet](https://faucets.chain.link/sepolia)

## Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── game/              # Game components (Canvas, TopBar, BottomBar)
│   ├── wallet/            # Wallet components (Connect, Deposit, Withdraw)
│   ├── providers/         # Privy & Wagmi providers
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/
│   └── contracts/         # Contract ABIs and addresses
├── store/                 # Zustand stores
└── types/                 # TypeScript types
```

## Features

- **Wallet Connection**: Connect via MetaMask, Email, or Google (Privy)
- **Smart Wallet**: Create and manage a smart wallet for DeFi operations
- **Isometric City**: PixiJS-powered isometric game view
- **Building System**: Place buildings that represent DeFi protocols
- **Deposit/Withdraw**: Send ETH to/from your smart wallet

## Building Types

| Building     | DeFi Protocol  | Description        |
| ------------ | -------------- | ------------------ |
| Town Hall    | Smart Wallet   | Portfolio Overview |
| Yield Farm   | Aave V3        | USDC Lending       |
| Staking Camp | Lido           | ETH Staking        |
| LP Mine      | Uniswap V3     | Liquidity Pool     |
| Castle       | Governance     | veToken Locking    |
| Shop         | DEX Aggregator | Token Swaps        |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Network

This app runs on **Sepolia Testnet** (Chain ID: 11155111)

## Smart Contracts

**Factory Address**: `0x0899fDF0Dfe72751925901e72DB41A0aDB18be47`

### SimpleWalletFactory Functions

- `createWallet(address owner)` - Create a new smart wallet
- `getWallet(address owner)` - Get wallet address for owner
- `hasWallet(address owner)` - Check if owner has a wallet

### SimpleSmartWallet Functions

- `getETHBalance()` - Get wallet ETH balance
- `withdrawETH(address to, uint256 amount)` - Withdraw ETH
- `withdrawAllETH(address to)` - Withdraw all ETH
