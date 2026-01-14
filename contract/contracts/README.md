# ERC-4337 Smart Wallet System

## Overview

Production-grade Account Abstraction (ERC-4337) Smart Wallet implementation for DeFi City.

This system enables:
- **Smart Wallets**: Contract-based accounts instead of traditional EOAs
- **Account Abstraction**: Gasless transactions, batch operations, advanced features
- **DeFi Integration**: Direct interaction with Aave, Uniswap, and other protocols
- **Security**: Battle-tested patterns, comprehensive validation, reentrancy protection
- **Extensibility**: Foundation for multisig, social recovery, spending limits

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERC-4337 SYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User (EOA) ──► signs UserOperation                            │
│                      │                                          │
│                      ▼                                          │
│                 Bundler (off-chain)                             │
│                      │                                          │
│                      ▼                                          │
│              EntryPoint (singleton)                             │
│                      │                                          │
│                      ├──► validateUserOp()                      │
│                      │                                          │
│                      ▼                                          │
│               Smart Wallet                                      │
│                      │                                          │
│                      ├──► Aave V3                               │
│                      ├──► Uniswap V3                            │
│                      └──► Other DeFi                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Contracts

### Core Contracts

#### `SmartWallet.sol`
- **Purpose**: User's smart contract wallet
- **Features**:
  - ERC-4337 compliant (`validateUserOp`)
  - Single owner authentication
  - Execute and batch execute
  - Gas deposit management
  - Asset reception (ETH, ERC20, ERC721, ERC1155)
  - Reentrancy protection
- **Location**: `contracts/wallet/SmartWallet.sol`

#### `WalletFactory.sol`
- **Purpose**: Deploys wallets using CREATE2
- **Features**:
  - Deterministic addresses (counterfactual wallets)
  - Prevents duplicate deployments
  - Registry of deployed wallets
  - Batch deployment support
- **Location**: `contracts/factory/WalletFactory.sol`

### Interfaces

#### `IEntryPoint.sol`
- **Purpose**: Interface for ERC-4337 EntryPoint
- **Address**: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` (canonical)
- **Location**: `contracts/interfaces/IEntryPoint.sol`

#### `IAccount.sol`
- **Purpose**: Core interface for AA wallets
- **Key Function**: `validateUserOp()`
- **Location**: `contracts/interfaces/IAccount.sol`

#### `UserOperation.sol`
- **Purpose**: UserOperation struct and helpers
- **Location**: `contracts/interfaces/UserOperation.sol`

---

## Quick Start

### 1. Installation

```bash
# Install dependencies
npm install @openzeppelin/contracts

# Or with yarn
yarn add @openzeppelin/contracts
```

### 2. Compilation

```bash
npx hardhat compile
```

### 3. Deployment

```bash
# Deploy to testnet
npx hardhat run scripts/deploy-factory.js --network sepolia

# Deploy to mainnet
npx hardhat run scripts/deploy-factory.js --network base
```

### 4. Usage

```javascript
// Create wallet for user
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
const tx = await factory.createWallet(ownerAddress, 0);
await tx.wait();

// Get wallet address
const walletAddress = await factory.getWalletByOwner(ownerAddress);

// Interact with wallet
const wallet = new ethers.Contract(walletAddress, WALLET_ABI, signer);
await wallet.execute(target, value, calldata);
```

---

## Features

### ✅ ERC-4337 Compliance

- Full implementation of `IAccount` interface
- Signature validation using ECDSA
- Nonce management via EntryPoint
- Gas payment from deposit
- Support for Paymasters (optional)

### ✅ Security

- ✅ EntryPoint authorization checks
- ✅ Reentrancy protection (OpenZeppelin)
- ✅ Signature validation (ECDSA library)
- ✅ Safe external calls
- ✅ Owner-based access control
- ✅ Emergency functions

### ✅ Gas Management

- Separate gas deposit in EntryPoint
- Auto-payment from wallet balance
- Deposit monitoring and top-up
- Gas estimation helpers

### ✅ DeFi Integration

Examples for:
- Aave V3 (lending)
- Uniswap V3 (LP)
- Lido (staking)
- Generic execute for any protocol

### ✅ Batch Operations

Execute multiple transactions atomically:
```solidity
executeBatch(
    [aavePool, uniswapRouter, lidoContract],
    [0, 0, ethAmount],
    [depositCalldata, swapCalldata, stakeCalldata]
)
```

### ✅ Asset Support

- ETH (via `receive()`)
- ERC20 tokens
- ERC721 NFTs
- ERC1155 tokens

---

## Contract Addresses

### EntryPoint (Canonical - DO NOT CHANGE)
```
Ethereum Mainnet:  0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
Ethereum Sepolia:  0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
Base Mainnet:      0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
Base Sepolia:      0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
Arbitrum One:      0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
Optimism:          0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
Polygon:           0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
```

### Deployed Contracts (Your Deployments)
```
WalletFactory:
  - Sepolia:       TBD (deploy via scripts/deploy-factory.js)
  - Base Mainnet:  TBD
  - Arbitrum:      TBD
```

---

## Documentation

### 📚 Comprehensive Guides

1. **[AA_ARCHITECTURE.md](../docs/AA_ARCHITECTURE.md)**
   - Complete ERC-4337 architecture
   - Component roles and responsibilities
   - Transaction lifecycle
   - Design patterns
   - Future improvements

2. **[SECURITY.md](../docs/SECURITY.md)**
   - Critical security requirements
   - Common attack vectors
   - Protection mechanisms
   - Testing strategies
   - Audit checklist

3. **[DEPLOYMENT.md](../docs/DEPLOYMENT.md)**
   - Step-by-step deployment guide
   - Network configuration
   - Verification process
   - Bundler setup
   - Monitoring

4. **[USAGE_EXAMPLES.md](../docs/USAGE_EXAMPLES.md)**
   - Wallet creation
   - Deposit & withdraw
   - Aave integration
   - Uniswap V3 LP
   - Batch operations
   - Frontend integration

---

## Testing

### Run Tests

```bash
npx hardhat test
```

### Test Coverage

```bash
npx hardhat coverage
```

### Critical Test Cases

- ✅ Signature validation (valid/invalid)
- ✅ EntryPoint authorization
- ✅ Reentrancy protection
- ✅ Gas payment
- ✅ Nonce management
- ✅ Batch execution
- ✅ Factory deployment
- ✅ CREATE2 address matching

---

## Security

### Audits
- [ ] Internal review completed
- [ ] External audit by [Firm Name]
- [ ] Bug bounty program launched

### Known Issues
- None currently

### Security Contacts
- Email: security@example.com
- Discord: [Your Discord]
- Bug Bounty: [Immunefi/HackerOne link]

### Critical Security Rules

1. ✅ **ALWAYS** require `msg.sender == entryPoint` in `validateUserOp`
2. ✅ **ALWAYS** use OpenZeppelin ECDSA for signatures
3. ✅ **ALWAYS** use `nonReentrant` on execute functions
4. ✅ **ALWAYS** check success on external calls
5. ✅ **ALWAYS** audit before mainnet

---

## Gas Costs

Estimated gas costs (Base network):

| Operation | Gas Used | Cost (gwei=0.001) |
|-----------|----------|-------------------|
| Deploy Factory | ~2,500,000 | $0.05 |
| Create Wallet | ~350,000 | $0.007 |
| Execute (simple) | ~80,000 | $0.002 |
| Execute Batch (3) | ~200,000 | $0.004 |
| Deposit to Aave | ~180,000 | $0.004 |
| Add LP to Uniswap | ~250,000 | $0.005 |

*Costs at ETH = $2000, gas = 0.001 gwei (Base L2)*

---

## Roadmap

### ✅ Phase 1: Core (Current)
- [x] SmartWallet implementation
- [x] WalletFactory with CREATE2
- [x] ERC-4337 compliance
- [x] Security features
- [x] Documentation

### 🔄 Phase 2: Extensions (Next)
- [ ] Paymaster implementation (gasless tx)
- [ ] Session keys
- [ ] Spending limits
- [ ] ERC-1271 signature validation

### 📋 Phase 3: Advanced (Future)
- [ ] Multi-signature wallets
- [ ] Social recovery
- [ ] Upgradeability (modular plugins)
- [ ] Cross-chain support (LayerZero)

---

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

---

## License

MIT License - see [LICENSE](../LICENSE) file

---

## Resources

### ERC-4337 Resources
- [EIP-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Infinitism GitHub](https://github.com/eth-infinitism/account-abstraction)
- [ERC-4337 Discord](https://discord.gg/erc4337)

### Bundler Providers
- [Alchemy Account Kit](https://www.alchemy.com/account-kit)
- [Biconomy](https://www.biconomy.io/)
- [Stackup](https://www.stackup.sh/)
- [Pimlico](https://www.pimlico.io/)

### Developer Tools
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Hardhat](https://hardhat.org/)
- [Ethers.js v6](https://docs.ethers.org/v6/)

---

## Support

- Documentation: [docs/](../docs/)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Discord: [Join our Discord](https://discord.gg/your-server)
- Email: support@example.com

---

## Acknowledgments

Built with:
- [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) by Vitalik Buterin, Yoav Weiss, et al.
- [OpenZeppelin Contracts](https://openzeppelin.com/contracts/)
- [Infinitism Account Abstraction](https://github.com/eth-infinitism/account-abstraction)

Special thanks to the ERC-4337 community for their continued work on Account Abstraction.

---

**Built for DeFi City** 🏗️🌾⛏️

*Making DeFi accessible through gamification and Account Abstraction*
