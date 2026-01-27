# DeFi City - Demo Frontend

A simplified Next.js 16 frontend for interacting with DeFi City smart contracts on Base Sepolia.

## Features

- ✅ **Wallet Authentication**: Privy integration for social + crypto wallet login
- ✅ **10x10 2D Grid**: Simple click-to-place interface
- ✅ **Town Hall Creation**: Initialize your city and smart wallet
- ✅ **Portfolio Dashboard**: View building count and grid usage
- ✅ **Real-time Updates**: Contract events and transaction tracking
- ✅ **shadcn/ui Components**: Modern, accessible UI components

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Wallet**: Privy for authentication
- **Blockchain**: Wagmi v2 + Viem for contract interactions
- **Network**: Base Sepolia testnet

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Privy App ID:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

Get your Privy App ID from [Privy Dashboard](https://dashboard.privy.io/)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
demo_frontend/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main game page
│   ├── providers.tsx       # Privy + Wagmi providers
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── wallet/             # WalletConnect component
│   ├── grid/               # Grid and GridCell
│   ├── modals/             # PlaceBuildingModal
│   └── portfolio/          # PortfolioPanel
├── hooks/
│   └── useDefiCity.ts      # Contract interaction hooks
├── lib/
│   ├── contracts/          # Contract ABIs and addresses
│   ├── wagmi.ts           # Wagmi configuration
│   └── utils.ts           # Utility functions
└── types/
    └── index.ts           # TypeScript types
```

## Contract Addresses (Base Sepolia)

- **DefiCityCore**: `0xaDc51D79177BA89E1b3c99994F95E5A825194e59`
- **WalletFactory**: `0xD7e5Ef23F53c98a01b63e99A91e1547229579c7A`
- **Chain ID**: `84532`

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and authenticate with Privy
2. **Create Town Hall**: Click any empty grid cell to place your Town Hall
3. **Confirm Transaction**: Approve the transaction in your wallet
4. **View Portfolio**: See your buildings and stats in the dashboard

## Future Enhancements

- Add Bank building (Aave integration)
- Add Shop building (Aerodrome LP)
- Add Lottery building (Megapot)
- Implement harvest and demolish functions
- Add building tooltips with details
- Improve mobile responsiveness

## License

MIT
