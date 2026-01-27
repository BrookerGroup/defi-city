<div align="center">

# DeFi City

**A gamified DeFi portfolio management platform**

Transform complex DeFi investments into an intuitive city-building game where buildings represent real DeFi positions earning actual yield.

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=flat-square&logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![The Graph](https://img.shields.io/badge/The%20Graph-Indexing-6747ED?style=flat-square&logo=graphql)](https://thegraph.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-61%20passing-success?style=flat-square)]()
[![Base](https://img.shields.io/badge/Chain-Base-0052FF?style=flat-square)](https://base.org/)

[Features](#features) • [Architecture](#architecture) • [Getting Started](#getting-started) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## Overview

**DeFi City** transforms DeFi investing into an engaging city-building game. Users create virtual cities where each building represents a real DeFi position generating actual yield from battle-tested protocols like Aave, Aerodrome, and Megapot.

### Core Concept

```
City = Investment Portfolio
Building = DeFi Position
Income = Real Protocol Yield
```

### Key Features

- **Gamified DeFi** - Visualize complex DeFi positions as city buildings
- **Multi-Asset Support** - Invest with USDC, USDT, ETH, or BTC
- **Real Yield** - Earn actual returns from Aave lending, Aerodrome DEX, and Megapot lottery
- **Account Abstraction** - Gasless transactions via ERC-4337 smart wallets
- **Social Login** - Email/social authentication with Privy (no crypto wallet needed)
- **Non-Custodial** - Users maintain full control through individual smart wallets
- **Low Fees** - Only 0.05% on deposits, zero fees on harvests and withdrawals

### Quick Links

| Component | Description | Link |
|-----------|-------------|------|
| **Contracts** | Smart contracts, deployment, tests | [contract/](contract/) |
| **Frontend** | Next.js game interface | [frontend/](frontend/) |
| **Subgraph** | The Graph indexing and queries | [subgraph/](subgraph/) |

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Features](#features)
  - [Building Types](#building-types)
  - [Investment Strategies](#investment-strategies)
- [Architecture](#architecture)
  - [Smart Contracts](#smart-contracts)
  - [Frontend Application](#frontend-application)
  - [Blockchain Indexing](#blockchain-indexing)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Project Structure

This is a monorepo containing three main components:

```
deficity/
├── contract/                   # Smart Contracts
│   ├── contracts/             # Solidity contracts
│   ├── ignition/              # Hardhat Ignition deployment
│   ├── test/                  # E2E and integration tests
│   └── README.md              # Contract documentation
├── frontend/                   # Frontend Application
│   ├── src/
│   │   ├── app/              # Next.js app router
│   │   ├── components/       # React components
│   │   ├── lib/              # Game engine (PixiJS)
│   │   └── hooks/            # React hooks
│   └── README.md              # Frontend documentation
├── subgraph/                   # The Graph Indexing
│   ├── schema.graphql        # GraphQL schema
│   ├── subgraph.yaml         # Subgraph manifest
│   ├── src/                  # AssemblyScript mappings
│   └── README.md              # Subgraph documentation
├── docs/                       # Technical Documentation
│   ├── ARCHITECTURE.md       # System architecture
│   ├── REQUIREMENT.md        # Business requirements
│   ├── TECHNICAL_DESIGN.md   # Technical specifications
│   ├── CONTRACT_DESIGN.md    # Contract design patterns
│   └── USECASE.md            # User stories and use cases
└── README.md                  # This file
```

---

## Features

### Building Types

DeFi City offers four building types, each representing a different DeFi strategy:

| Building | DeFi Protocol | Strategy | Risk Level |
|----------|--------------|----------|------------|
| **Town Hall** | - | Player initialization | None |
| **Bank** | Aave V3 | Supply or Borrow | Low-Medium |
| **Shop** | Aerodrome | Liquidity Provision | Medium |
| **Lottery** | Megapot | Buy tickets, win prizes | High |

### Investment Strategies

#### 1. Conservative (Low Risk)
- Build Banks with supply-only mode
- Earn stable yield on USDC/USDT deposits
- No liquidation risk

#### 2. Moderate (Medium Risk)
- Mix of Banks (borrow) and Shops (LP)
- Leverage positions for higher yields
- Monitor health factors

#### 3. Aggressive (High Risk)
- Lottery tickets for jackpot potential
- High-leverage borrow positions
- Maximum yield optimization

#### 4. Diversified
- Balance across all building types
- Risk-adjusted portfolio
- Steady income with upside potential

### Game Mechanics

- **Harvest** - Claim accumulated yield from any building
- **Demolish** - Remove building and withdraw all funds
- **Upgrade** - Add more capital to existing positions
- **Grid System** - Organize buildings on unlimited grid space
- **Real-time Stats** - Track APY, earnings, and portfolio value

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│                  (Next.js + PixiJS Game Engine)                  │
└────────────────┬────────────────────────┬────────────────────────┘
                 │                        │
                 ▼                        ▼
        ┌─────────────────┐      ┌─────────────────┐
        │   Privy Auth    │      │   The Graph     │
        │  (Wallet Auth)  │      │   (Indexing)    │
        └────────┬────────┘      └────────┬────────┘
                 │                        │
                 ▼                        ▼
        ┌─────────────────────────────────────────┐
        │         Base Blockchain                  │
        │                                          │
        │  ┌──────────────┐  ┌──────────────┐    │
        │  │ DefiCityCore │  │ SmartWallet  │    │
        │  │  (Game Core) │  │ (per player) │    │
        │  └──────┬───────┘  └──────┬───────┘    │
        │         │                  │             │
        │         └──────────┬───────┘             │
        │                    ▼                     │
        │         ┌────────────────────┐          │
        │         │  Building Adapters │          │
        │         └────────┬───────────┘          │
        │                  │                       │
        │     ┌────────────┼────────────┐         │
        │     ▼            ▼            ▼         │
        │  ┌──────┐  ┌──────────┐  ┌───────┐    │
        │  │ Aave │  │Aerodrome │  │Megapot│    │
        │  └──────┘  └──────────┘  └───────┘    │
        └─────────────────────────────────────────┘
```

### Smart Contracts

Built with Hardhat 3, Solidity 0.8.20, and OpenZeppelin security libraries.

**Core Architecture:**
- **DefiCityCore** - Main game logic with role-based access control
- **WalletFactory** - CREATE2 deterministic wallet deployment
- **SmartWallet** - ERC-4337 account abstraction per player
- **Building Adapters** - Protocol-specific DeFi integrations
- **BuildingRegistry** - Building type management

**Key Features:**
- ERC-4337 account abstraction for gasless transactions
- Non-custodial architecture (user funds in SmartWallets)
- OpenZeppelin AccessControl for granular permissions
- Comprehensive test coverage (61 passing tests)
- Hardhat Ignition for declarative deployments

See [contract/README.md](contract/README.md) for detailed documentation.

### Frontend Application

Modern web application built with Next.js 16 and React 19.

**Technologies:**
- **Next.js 16** - App router with server-side rendering
- **React 19** - Latest React with concurrent features
- **PixiJS 8** - Hardware-accelerated game rendering
- **Privy** - Social login and wallet authentication
- **Wagmi + Viem** - Type-safe Ethereum interactions
- **Zustand** - Lightweight state management
- **Tailwind CSS 4** - Utility-first styling
- **TanStack Query** - Data fetching and caching

**Features:**
- Responsive game interface with zoom and pan controls
- Real-time blockchain data synchronization
- Social authentication (email, Google, Twitter)
- Multi-wallet support (MetaMask, Coinbase, WalletConnect)
- Dark mode support
- Progressive Web App (PWA) capabilities

See [frontend/README.md](frontend/README.md) for setup instructions.

### Blockchain Indexing

The Graph subgraph for efficient blockchain data querying.

**Indexed Entities:**
- Player profiles and statistics
- Building positions and history
- Transaction records
- Yield analytics
- Protocol interactions

**Query Capabilities:**
- Real-time portfolio tracking
- Historical performance analysis
- Leaderboards and rankings
- Protocol usage metrics

See [subgraph/README.md](subgraph/README.md) for deployment guide and queries.

---

## Getting Started

### Prerequisites

**Required:**
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

**Optional:**
- Docker (for local blockchain)
- Graph CLI (for subgraph development)

### Installation

Clone the repository and install dependencies for all components:

```bash
# Clone repository
git clone https://github.com/your-org/deficity.git
cd deficity

# Install contract dependencies
cd contract
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install subgraph dependencies
cd ../subgraph
npm install
```

### Development

#### 1. Start Local Blockchain

```bash
cd contract
npm run node
```

This starts a local Hardhat network on `http://localhost:8545`.

#### 2. Deploy Smart Contracts

In a new terminal:

```bash
cd contract

# Deploy core contracts
npm run deploy:core:local

# Deploy integration contracts (adapters + mocks)
npm run deploy:integration:local
```

Deployment artifacts saved to `contract/deployments/`.

#### 3. Deploy Subgraph (Optional)

```bash
cd subgraph

# Start local Graph node (requires Docker)
npm run graph:local

# Deploy subgraph
npm run deploy:local
```

#### 4. Start Frontend

```bash
cd frontend

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your contract addresses

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Running Tests

```bash
# Contract tests (61 passing)
cd contract
npm test

# Frontend tests
cd frontend
npm test

# All tests with coverage
npm run test:coverage
```

---

## Deployment

### Testnet Deployment (Base Sepolia)

#### 1. Configure Environment

```bash
# In contract/
cp .env.example .env

# Add your keys to .env:
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key
BASESCAN_API_KEY=your_basescan_key
```

#### 2. Deploy Contracts

```bash
cd contract

# Deploy core contracts
npm run deploy:core:baseSepolia

# Deploy integration contracts
npm run deploy:integration:baseSepolia
```

#### 3. Deploy Subgraph

```bash
cd subgraph

# Configure network in subgraph.yaml
# Update contract addresses from deployment

# Authenticate with The Graph
graph auth --studio <ACCESS_TOKEN>

# Deploy
npm run deploy:testnet
```

#### 4. Deploy Frontend

```bash
cd frontend

# Configure production environment
cp .env.local.example .env.production

# Build and deploy (Vercel example)
vercel --prod
```

See individual README files for detailed deployment instructions.

---

## Documentation

### Technical Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture and design patterns |
| [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md) | Detailed technical specifications |
| [CONTRACT_DESIGN.md](CONTRACT_DESIGN.md) | Smart contract architecture |
| [CONTRACT_SEQUENCE_DIAGRAMS.md](CONTRACT_SEQUENCE_DIAGRAMS.md) | Contract interaction flows |
| [REQUIREMENT.md](REQUIREMENT.md) | Business requirements and objectives |
| [USECASE.md](USECASE.md) | User stories and use cases |
| [USER_STORIES.md](USER_STORIES.md) | Detailed user stories |

### Component Documentation

- [Contract Documentation](contract/README.md) - Smart contract setup, testing, deployment
- [Frontend Documentation](frontend/README.md) - Frontend development and features
- [Subgraph Documentation](subgraph/README.md) - Indexing and queries

### External Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [The Graph Documentation](https://thegraph.com/docs)
- [Privy Documentation](https://docs.privy.io/)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Base Chain Documentation](https://docs.base.org/)

---

## Tech Stack

### Smart Contracts

| Technology | Version | Purpose |
|------------|---------|---------|
| Solidity | 0.8.20 | Smart contract language |
| Hardhat | 3.0 | Development environment |
| Hardhat Ignition | Latest | Declarative deployment |
| OpenZeppelin | 5.0+ | Security-audited contracts |
| Ethers.js | 6.0+ | Ethereum library |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16 | React framework |
| React | 19 | UI library |
| TypeScript | 5.0+ | Type safety |
| PixiJS | 8.0 | Game rendering engine |
| Privy | 3.0+ | Wallet authentication |
| Wagmi | 3.0+ | Ethereum hooks |
| Viem | 2.0+ | Ethereum utilities |
| Zustand | 5.0 | State management |
| Tailwind CSS | 4.0 | Styling framework |
| TanStack Query | 5.0+ | Data fetching |

### Indexing

| Technology | Purpose |
|------------|---------|
| The Graph | Blockchain indexing |
| GraphQL | Query language |
| AssemblyScript | Subgraph mappings |

### Blockchain

| Component | Details |
|-----------|---------|
| Network | Base (Ethereum L2) |
| Chain ID | 8453 (Mainnet), 84532 (Sepolia) |
| Account Abstraction | ERC-4337 |
| EntryPoint | v0.6.0 |

---

## Security

### Smart Contract Security

- **Access Control** - OpenZeppelin role-based permissions
- **Reentrancy Protection** - ReentrancyGuard on all state-changing functions
- **Pausable** - Emergency pause mechanism for incidents
- **Non-Custodial** - User funds in individual SmartWallets
- **Audited Libraries** - OpenZeppelin battle-tested contracts
- **Comprehensive Tests** - 61 passing tests with 100% success rate

### Frontend Security

- **Type Safety** - Full TypeScript coverage
- **Input Validation** - Zod schema validation
- **Secure Authentication** - Privy social login
- **Read-Only RPC** - Separate endpoints for read operations
- **Environment Variables** - Sensitive data in .env files

### Operational Security

- **Multi-Signature** - Critical operations require multisig
- **Role Separation** - Different keys for different operations
- **Monitoring** - Real-time alerts for unusual activity
- **Incident Response** - Documented emergency procedures

See [contract/docs/ACCESS_CONTROL.md](contract/docs/ACCESS_CONTROL.md) for detailed security documentation.

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes in the appropriate component (contract/frontend/subgraph)
4. Write tests for your changes
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards

**Smart Contracts:**
- Follow Solidity style guide
- Add NatSpec comments
- Maintain test coverage above 90%
- Use OpenZeppelin libraries when possible

**Frontend:**
- Use TypeScript for type safety
- Follow React best practices
- Write component tests
- Maintain responsive design

**Subgraph:**
- Document all entities in schema
- Write efficient mappings
- Test queries thoroughly

### Commit Message Format

```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(contract): add lottery adapter for Megapot integration
fix(frontend): resolve wallet connection issue on mobile
docs(subgraph): add query examples for portfolio tracking
```

### Pull Request Process

1. Update documentation for any changed functionality
2. Add tests demonstrating the fix or feature
3. Ensure CI/CD pipeline passes
4. Request review from maintainers
5. Address review comments
6. Squash commits before merge

---

## Roadmap

### Phase 1: MVP (Current)
- Core game mechanics (Town Hall, Bank, Shop, Lottery)
- Smart wallet integration
- Basic UI/UX
- Aave, Aerodrome, Megapot integrations

### Phase 2: Enhanced Features
- Building upgrades and levels
- Achievement system
- Leaderboards and rankings
- Social features (friend cities, visits)
- Mobile app (React Native)

### Phase 3: Advanced DeFi
- More protocol integrations
- Cross-chain support
- Advanced yield strategies
- Automated position management
- NFT building skins

### Phase 4: Platform Expansion
- User-created buildings
- Plugin marketplace
- DAO governance
- Revenue sharing for contributors

---

## Community

- **Website:** [Coming Soon]
- **Discord:** [Coming Soon]
- **Twitter:** [Coming Soon]
- **Documentation:** [docs/](docs/)
- **GitHub:** [Issues](https://github.com/your-org/deficity/issues)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Built with:
- **OpenZeppelin** - Security-audited smart contracts
- **Hardhat** - Ethereum development environment
- **Next.js** - React framework by Vercel
- **The Graph** - Blockchain indexing protocol
- **PixiJS** - 2D rendering engine
- **Privy** - Wallet authentication
- **Base** - Ethereum L2 network

Integrated protocols:
- **Aave** - Decentralized lending protocol
- **Aerodrome** - Base DEX for liquidity provision
- **Megapot** - On-chain lottery system

---

<div align="center">

**Built by the DeFi City Team**

Making DeFi accessible through gamification

[Documentation](docs/) • [Contracts](contract/) • [Frontend](frontend/) • [Subgraph](subgraph/)

</div>
