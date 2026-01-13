# 🏗️ DeFi City - Smart Wallet System

เกม City Builder ที่แปลง DeFi เป็น game mechanics ง่ายๆ

---

## ✨ Features

### Smart Wallet (SimpleSmartWallet.sol)
- ✅ **Owner-based** - แต่ละคนมี wallet ของตัวเอง
- ✅ **Deposit ETH** - รับ ETH ได้
- ✅ **Deposit ERC20** - รับ USDC, USDT, etc.
- ✅ **Withdraw ETH** - ถอน ETH กลับไปยัง EOA
- ✅ **Withdraw ERC20** - ถอน tokens กลับไป
- ✅ **View Balances** - เช็คยอดใน wallet

### Factory (SimpleWalletFactory.sol)
- ✅ **Create Wallet** - สร้าง wallet ให้ user
- ✅ **Get Wallet** - ดึง wallet address จาก owner
- ✅ **Registry** - เก็บ mapping ของ wallets ทั้งหมด

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Compile contracts
npx hardhat compile

# 3. Run tests
npx hardhat test

# 4. Deploy to local network
npx hardhat node                                  # Terminal 1
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2
```

📖 **Full guide**: [QUICKSTART.md](./QUICKSTART.md)

---

## 📦 Project Structure

```
defi-city/
├── contracts/
│   ├── SimpleSmartWallet.sol       # Core wallet contract
│   ├── SimpleWalletFactory.sol     # Factory for deploying wallets
│   └── MockERC20.sol               # Test token
│
├── scripts/
│   └── deploy.js                   # Deployment script
│
├── test/
│   └── SimpleWallet.test.js        # Comprehensive tests
│
├── docs/                           # Full documentation
│   ├── AA_ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── DEPLOYMENT.md
│   └── USAGE_EXAMPLES.md
│
├── hardhat.config.js
├── package.json
├── QUICKSTART.md                   # Quick start guide
└── README.md                       # This file
```

---

## 💡 Core Concept

```
┌────────────────────────────────────────────────┐
│                   User Flow                    │
└────────────────────────────────────────────────┘

1. Connect Wallet (MetaMask)
         │
         ▼
2. Create Smart Wallet
         │
         ▼
3. Deposit USDC/ETH
         │
         ▼
4. Play Game (Build Yield Farms, etc.)
         │
         ▼
5. Withdraw Profits
```

---

## 🔧 Usage

### Create Wallet

```javascript
const factory = new ethers.Contract(FACTORY_ADDRESS, ABI, signer);

// Create wallet for user
await factory.createWallet(userAddress);

// Get wallet address
const walletAddress = await factory.getWallet(userAddress);
```

### Deposit

```javascript
const wallet = new ethers.Contract(walletAddress, ABI, signer);

// Deposit ETH
await signer.sendTransaction({
  to: walletAddress,
  value: ethers.parseEther("1.0")
});

// Deposit USDC
await usdc.approve(walletAddress, amount);
await wallet.depositToken(USDC_ADDRESS, amount);
```

### Withdraw

```javascript
// Withdraw ETH
await wallet.withdrawETH(recipientAddress, ethers.parseEther("0.5"));

// Withdraw USDC
await wallet.withdrawToken(USDC_ADDRESS, recipientAddress, amount);
```

---

## 🧪 Testing

```bash
npx hardhat test
```

**Test Coverage:**
- ✅ Factory deployment & wallet creation
- ✅ ETH deposits & withdrawals
- ✅ ERC20 deposits & withdrawals
- ✅ Owner permissions
- ✅ Error cases

**15 tests passing** ✅

---

## 🌐 Networks

### Localhost (Development)
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### Sepolia (Testnet)
```bash
# Get testnet ETH from faucet
npx hardhat run scripts/deploy.js --network sepolia
```

### Base (Mainnet)
```bash
npx hardhat run scripts/deploy.js --network base
```

---

## 📊 Gas Costs

| Operation | Gas Used | Cost (Base L2) |
|-----------|----------|----------------|
| Deploy Factory | ~800,000 | ~$0.02 |
| Create Wallet | ~350,000 | ~$0.007 |
| Deposit ETH | ~25,000 | ~$0.0005 |
| Withdraw ETH | ~30,000 | ~$0.0006 |

*Costs at gas = 0.001 gwei (Base L2), ETH = $2000*

---

## 🔐 Security

- ✅ Owner-only access control
- ✅ Input validation (zero address checks)
- ✅ Safe ERC20 transfers
- ✅ Custom errors (gas efficient)
- ✅ Events for all operations

**Status**: MVP - Not audited yet

---

## 🗺️ Roadmap

### ✅ Phase 1: Simple Wallet (Current)
- [x] Basic wallet with deposit/withdraw
- [x] Factory deployment
- [x] Complete tests
- [x] Local deployment

### 🔄 Phase 2: DeFi Integration
- [ ] Aave integration (Yield Farms)
- [ ] Uniswap V3 integration (LP Mines)
- [ ] Execute function for arbitrary calls

### 📋 Phase 3: Account Abstraction
- [ ] ERC-4337 compliance
- [ ] Gasless transactions
- [ ] Session keys

### 🎯 Phase 4: Advanced Features
- [ ] Multi-sig support
- [ ] Social recovery
- [ ] Spending limits

---

## 📚 Documentation

- 📖 [Quick Start Guide](./QUICKSTART.md) - Start here!
- 📖 [Full Architecture](./docs/AA_ARCHITECTURE.md) - Deep dive
- 📖 [Security Guide](./docs/SECURITY.md) - Security best practices
- 📖 [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- 📖 [Usage Examples](./docs/USAGE_EXAMPLES.md) - More examples

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Write tests
4. Submit a pull request

---

## 📄 License

MIT License - See [LICENSE](./LICENSE)

---

## 🆘 Support

- 📖 Documentation: `docs/`
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 Discord: [Join our Discord]()

---

**Built with ❤️ for DeFi City**

*Making DeFi accessible through gamification* 🎮
