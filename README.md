# DeFi City

A city builder game that transforms DeFi into easy-to-understand game mechanics.

## Overview

DeFi City is a monorepo containing:

| Package | Description |
|---------|-------------|
| [contract/](./contract/) | Smart contracts (ERC-4337 Smart Wallet) |
| [frontend/](./frontend/) | Next.js web application |
| [docs/](./docs/) | Documentation and guides |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### 1. Clone and Install

```bash
git clone https://github.com/your-username/defi-city.git
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

## Project Structure

```
defi-city/
├── contract/                 # Smart contracts
│   ├── contracts/
│   │   ├── SimpleSmartWallet.sol    # Basic wallet (MVP)
│   │   ├── SimpleWalletFactory.sol  # Factory for basic wallet
│   │   ├── wallet/SmartWallet.sol   # ERC-4337 wallet
│   │   └── factory/WalletFactory.sol # CREATE2 factory
│   ├── scripts/              # Deployment scripts
│   └── test/                 # Contract tests
│
├── frontend/                 # Web application
│   └── src/
│       ├── app/              # Next.js pages
│       ├── components/       # React components
│       ├── hooks/            # Custom hooks
│       └── lib/              # Utilities & configs
│
└── docs/                     # Documentation
    ├── PRD.md               # Product requirements
    └── ERC4337_GUIDE.md     # ERC-4337 tutorial (Thai)
```

## Features

- **Smart Wallet**: Personal contract wallet for each player
- **Deposit/Withdraw**: ETH and ERC20 tokens support
- **DeFi Integration**: Connect with Aave, Uniswap, and more
- **Account Abstraction**: ERC-4337 compliant for gasless transactions

## Documentation

| Document | Description |
|----------|-------------|
| [docs/PRD.md](./docs/PRD.md) | Product requirements and game design |
| [docs/ERC4337_GUIDE.md](./docs/ERC4337_GUIDE.md) | ERC-4337 tutorial (Thai) |
| [docs/AUDIT_REPORT.md](./docs/AUDIT_REPORT.md) | Security audit report |
| [contract/README.md](./contract/README.md) | Smart contract documentation |
| [contract/contracts/README.md](./contract/contracts/README.md) | Technical contract docs |
| [frontend/README.md](./frontend/README.md) | Frontend setup guide |

## Deployed Contracts

### Sepolia Testnet

| Contract | Address |
|----------|---------|
| SimpleWalletFactory | `0x0899fDF0Dfe72751925901e72DB41A0aDB18be47` |

## Tech Stack

### Smart Contracts
- Solidity ^0.8.20
- Hardhat
- OpenZeppelin Contracts
- ERC-4337 (Account Abstraction)

### Frontend
- Next.js 14 (App Router)
- TypeScript
- wagmi v2 + viem v2
- Privy (Authentication)
- TailwindCSS + shadcn/ui

## Development

### Contract Commands

```bash
cd contract

# Compile
npx hardhat compile

# Test
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

### Frontend Commands

```bash
cd frontend

# Development
npm run dev

# Build
npm run build

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
