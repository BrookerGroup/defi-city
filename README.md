# 🎮 DeFi City - Smart Wallet System

เกม City Builder ที่แปลง DeFi เป็น game mechanics ที่เข้าใจง่าย

**สิ่งที่ DeFi City ทำ:**
- สร้าง Smart Wallet ส่วนตัวให้ผู้เล่น
- ฝาก/ถอน ETH และ ERC20 tokens ได้
- เชื่อมต่อกับ DeFi protocols จริง (Aave, Uniswap)
- เล่นเกมไปด้วย ลงทุน DeFi ไปด้วย

---

## 📚 เริ่มต้นใช้งาน

### Quick Start

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. Compile contracts
npx hardhat compile

# 3. Run tests
npx hardhat test

# 4. Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

### 📖 คู่มือฉบับเต็ม

อ่านคู่มือภาษาไทยฉบับสมบูรณ์: **[TUTORIAL.md](./TUTORIAL.md)**

คู่มือครอบคลุม:
- ✅ อธิบายแนวคิดและเป้าหมายของโปรเจค
- ✅ คำศัพท์และความหมาย
- ✅ โครงสร้าง Smart Contracts
- ✅ วิธีการติดตั้งและใช้งาน
- ✅ ตัวอย่างโค้ดแบบละเอียด
- ✅ การทดสอบ
- ✅ FAQ

---

## ✨ Features

**Smart Wallet (SimpleSmartWallet.sol)**
- ✅ Owner-based access control
- ✅ Deposit/Withdraw ETH
- ✅ Deposit/Withdraw ERC20 tokens
- ✅ View balances
- ✅ Transfer ownership

**Factory (SimpleWalletFactory.sol)**
- ✅ Create wallets for users
- ✅ Registry system
- ✅ Prevent duplicate wallets

---

## 📦 Project Structure

```
defi-city/
├── contracts/
│   ├── SimpleSmartWallet.sol       # Core wallet contract
│   ├── SimpleWalletFactory.sol     # Factory for deploying wallets
│   ├── interfaces/                 # Contract interfaces
│   ├── factory/                    # Factory contracts
│   └── wallet/                     # Wallet contracts
│
├── scripts/
│   ├── deploy.js                   # Deployment script
│   └── test-deployed.js            # Test deployed contracts
│
├── test/
│   └── SimpleWallet.test.js        # Comprehensive tests (15 tests)
│
├── deployments/
│   └── sepolia.json                # Sepolia deployment addresses
│
├── hardhat.config.js
├── package.json
├── TUTORIAL.md                     # คู่มือภาษาไทยฉบับสมบูรณ์
├── FRONTEND_PROMPT.md              # Frontend development guide
├── PRD.md                          # Product Requirements Document
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

## 🌐 Deployed Contracts

### Sepolia Testnet
- **Factory**: `0x0899fDF0Dfe72751925901e72DB41A0aDB18be47`
- **Deployer**: `0x0007E5829637D89C5488af6833fA70581a1887d2`
- **Block**: 10033388
- [View on Etherscan](https://sepolia.etherscan.io/address/0x0899fDF0Dfe72751925901e72DB41A0aDB18be47)

### Deploy เอง

**Localhost (Development)**
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

**Sepolia (Testnet)**
```bash
# รับ testnet ETH จาก faucet ก่อน
npx hardhat run scripts/deploy.js --network sepolia
```

**Base (Mainnet)**
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

- 📖 **[TUTORIAL.md](./TUTORIAL.md)** - คู่มือภาษาไทยฉบับสมบูรณ์ (แนะนำ!)
  - อธิบายทุกอย่างตั้งแต่เริ่มต้น
  - คำศัพท์และความหมาย
  - โครงสร้าง Smart Contracts
  - ตัวอย่างการใช้งานแบบละเอียด
  - การทดสอบและ FAQ

- 📖 **[FRONTEND_PROMPT.md](./FRONTEND_PROMPT.md)** - Frontend Development Guide
  - Tech stack (Next.js 14, PixiJS, wagmi)
  - Project structure
  - Code examples
  - UI/UX design

- 📖 **[PRD.md](./PRD.md)** - Product Requirements Document
  - Product vision
  - Game mechanics
  - DeFi integration roadmap

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

- 📖 คู่มือ: [TUTORIAL.md](./TUTORIAL.md)
- 🌐 Frontend Guide: [FRONTEND_PROMPT.md](./FRONTEND_PROMPT.md)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 Discord: Coming soon

---

**Built with ❤️ for DeFi City**

*Making DeFi accessible through gamification* 🎮
