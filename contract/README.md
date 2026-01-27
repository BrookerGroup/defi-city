# DeFi City Contracts

Smart contracts for DeFi City - a blockchain-based city-building game with DeFi integrations.

## Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test
```

## Deployment

This project uses [Hardhat Ignition](https://hardhat.org/docs/guides/deployment) for declarative, reproducible deployments.

### Deploy to Local Network

```bash
# Deploy core contracts (BuildingRegistry, DefiCityCore, WalletFactory)
npm run deploy:core:local

# Deploy integration contracts (mocks + adapters)
npm run deploy:integration:local
```

### Deploy to Base Sepolia

1. Configure your treasury address in `ignition/parameters/baseSepolia.json`:
```json
{
  "CoreContracts": {
    "entryPoint": "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    "treasury": "YOUR_TREASURY_ADDRESS_HERE"
  }
}
```

2. Set environment variables in `.env`:
```env
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key_here
```

3. Deploy:
```bash
npm run deploy:core:baseSepolia
npm run deploy:integration:baseSepolia
```

## Architecture

### Core Contracts
- **BuildingRegistry**: Manages building type registrations and adapters
- **DefiCityCore**: Main game logic contract with role-based access control
  - Uses OpenZeppelin AccessControl for granular permissions
  - Roles: PAUSER, ASSET_MANAGER, MODULE_MANAGER, EMERGENCY
- **WalletFactory**: Creates ERC-4337 SmartWallets with access control
  - Only DefiCityCore can create wallets (DEPLOYER_ROLE)
  - Prevents unauthorized wallet creation
- **SmartWallet**: Account abstraction wallet for each player

### Building Adapters
- **BankAdapter**: Aave lending integration (supply/borrow)
- **LotteryAdapter**: Megapot lottery integration (buy tickets/claim prizes)
- **ShopAdapter**: Aerodrome DEX integration (provide liquidity/claim fees)

### Deployment Modules
- `ignition/modules/CoreContracts.ts` - Core game contracts
- `ignition/modules/IntegrationContracts.ts` - Mock protocols and adapters

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npx hardhat test test/DefiCityCore.test.js
npx hardhat test test/BankAdapter.e2e.test.js
npx hardhat test test/LotteryAdapter.e2e.test.js
npx hardhat test test/ShopAdapter.e2e.test.js
```

## Tech Stack

- **Hardhat 3**: Ethereum development environment
- **TypeScript**: Configuration and deployment modules
- **Solidity 0.8.20**: Smart contract language
- **OpenZeppelin**: Security-audited contract library
  - AccessControl: Role-based permissions
  - Ownable: Ownership management
  - Pausable: Emergency pause functionality
  - ReentrancyGuard: Reentrancy protection
- **ERC-4337**: Account abstraction standard

## Security

### Access Control
Both `DefiCityCore` and `WalletFactory` implement OpenZeppelin's `AccessControl` for role-based permissions:

**DefiCityCore Roles:**
- `PAUSER_ROLE`: Can pause/unpause the contract
- `ASSET_MANAGER_ROLE`: Can add/remove supported tokens
- `MODULE_MANAGER_ROLE`: Can update module addresses
- `EMERGENCY_ROLE`: Reserved for emergency operations
- `owner`: Critical operations (setWalletFactory, setTreasury)

**WalletFactory Roles:**
- `DEPLOYER_ROLE`: Can create wallets (granted to DefiCityCore only)
- `ADMIN_ROLE`: Administrative operations

See [docs/ACCESS_CONTROL.md](docs/ACCESS_CONTROL.md) for complete documentation.

### Best Practices
- All user funds held in individual SmartWallets (non-custodial)
- DefiCityCore never holds user tokens
- ReentrancyGuard on all state-changing functions
- Pausable for emergency situations
- Role separation for operational security

## Project Structure

```
contract/
├── contracts/          # Solidity contracts
│   ├── core/          # Core game logic
│   ├── adapters/      # DeFi protocol adapters
│   ├── wallet/        # ERC-4337 wallet implementation
│   ├── mocks/         # Test mocks for DeFi protocols
│   └── interfaces/    # Contract interfaces
├── ignition/          # Hardhat Ignition deployment
│   ├── modules/       # Deployment modules (TypeScript)
│   └── parameters/    # Network-specific parameters
├── test/              # Test files
│   ├── integration/   # Integration tests
│   └── *.test.js      # E2E tests
├── hardhat.config.ts  # Hardhat configuration
└── package.json       # Dependencies and scripts
```

## Development

### Compile Contracts
```bash
npm run compile
```

### Clean Build Artifacts
```bash
npm run clean
```

### Run Local Node
```bash
npm run node
```

## License

MIT
