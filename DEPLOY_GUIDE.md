# 🚀 Deploy to Testnet Guide

## ขั้นตอนที่ 1: เตรียม Private Key และ RPC

### Option A: ใช้ Public RPC (ง่ายที่สุด)

สร้างไฟล์ `.env`:

```bash
# Copy template
cp .env.example .env

# แก้ไขด้วย text editor
# ใส่แค่ PRIVATE_KEY (ได้จาก MetaMask)
```

เนื้อหาในไฟล์ `.env`:
```env
# Private key จาก MetaMask (Export private key)
PRIVATE_KEY=0x...your_private_key_here

# RPC URLs - ใช้ public RPC ก่อนก็ได้
SEPOLIA_RPC_URL=https://rpc.sepolia.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Block Explorer API Keys (optional - สำหรับ verify)
ETHERSCAN_API_KEY=
BASESCAN_API_KEY=
```

### Option B: ใช้ Alchemy/Infura (แนะนำสำหรับ production)

1. ไปที่ [Alchemy](https://www.alchemy.com/) หรือ [Infura](https://www.infura.io/)
2. สร้าง API key
3. ใส่ใน `.env`:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

---

## ขั้นตอนที่ 2: เติม ETH ใน Testnet

### Sepolia Testnet
1. ไปที่ [Alchemy Faucet](https://sepoliafaucet.com/)
2. หรือ [Infura Faucet](https://www.infura.io/faucet/sepolia)
3. ใส่ address ของคุณ
4. รอ ETH เข้า (~0.5 ETH)

### Base Sepolia
1. ไปที่ [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
2. ต้องมี Coinbase account
3. หรือ bridge จาก Sepolia → Base Sepolia

---

## ขั้นตอนที่ 3: Deploy!

### Deploy Simple Wallet System

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

หรือ

```bash
# Deploy to Base Sepolia (ค่า gas ต่ำกว่า)
npx hardhat run scripts/deploy.js --network baseSepolia
```

### Expected Output:

```
🚀 Deploying DeFi City Contracts...

📝 Deploying with account: 0x...
💰 Account balance: 0.5 ETH

⏳ Deploying SimpleWalletFactory...
✅ SimpleWalletFactory deployed to: 0xABCD...

📄 Deployment info saved to: deployments/sepolia.json

🧪 Testing wallet creation...
✅ Test wallet created at: 0x1234...
⛽ Gas used: 350000

============================================================
✅ DEPLOYMENT COMPLETE!
============================================================

Contract Addresses:
  Factory: 0xABCD...
  Test Wallet: 0x1234...

Network: sepolia
Chain ID: 11155111

Next Steps:
  1. Verify contracts on block explorer (if mainnet/testnet)
  2. Update frontend with factory address
  3. Test deposit and withdraw functions
============================================================
```

---

## ขั้นตอนที่ 4: Verify Contracts (Optional)

### ต้องมี Etherscan API Key ก่อน

1. ไปที่ [Etherscan](https://etherscan.io/apis) (Sepolia)
2. หรือ [Basescan](https://basescan.org/apis) (Base)
3. สร้าง API key ฟรี
4. ใส่ใน `.env`:

```env
ETHERSCAN_API_KEY=your_key_here
BASESCAN_API_KEY=your_key_here
```

### Verify Factory Contract

```bash
npx hardhat verify --network sepolia 0xFACTORY_ADDRESS
```

### Verify Wallet Contract

```bash
npx hardhat verify --network sepolia 0xWALLET_ADDRESS 0xOWNER_ADDRESS
```

---

## ขั้นตอนที่ 5: Test Deployment

### ใช้ Hardhat Console

```bash
npx hardhat console --network sepolia
```

```javascript
// Get factory
const factory = await ethers.getContractAt(
  "SimpleWalletFactory",
  "0xFACTORY_ADDRESS"
);

// Check total wallets
const total = await factory.totalWallets();
console.log("Total wallets:", total.toString());

// Get your wallet
const [signer] = await ethers.getSigners();
const myWallet = await factory.getWallet(signer.address);
console.log("My wallet:", myWallet);

// Get wallet contract
if (myWallet !== ethers.ZeroAddress) {
  const wallet = await ethers.getContractAt("SimpleSmartWallet", myWallet);

  // Check ETH balance
  const ethBal = await wallet.getETHBalance();
  console.log("ETH Balance:", ethers.formatEther(ethBal));
}
```

---

## ขั้นตอนที่ 6: Update Frontend

บันทึก contract addresses:

```javascript
// frontend/config.js
export const CONTRACTS = {
  sepolia: {
    chainId: 11155111,
    factory: "0xFACTORY_ADDRESS_HERE",
    rpcUrl: "https://rpc.sepolia.org"
  },
  baseSepolia: {
    chainId: 84532,
    factory: "0xFACTORY_ADDRESS_HERE",
    rpcUrl: "https://sepolia.base.org"
  }
};
```

---

## 🔍 Troubleshooting

### ❌ Error: "insufficient funds"
**Solution**: ต้องมี ETH ใน testnet ก่อน (ใช้ faucet)

### ❌ Error: "nonce too low"
**Solution**:
```bash
npx hardhat clean
rm -rf cache artifacts
npx hardhat compile
```

### ❌ Error: "network not found"
**Solution**: ตรวจสอบ `hardhat.config.js` ว่ามี network definition

### ❌ Verify failed: "already verified"
**Solution**: Contract verified แล้ว - ไม่ต้องทำอะไร

### ❌ Can't connect to RPC
**Solution**:
1. ลอง public RPC อื่น
2. หรือใช้ Alchemy/Infura

---

## 📊 Gas Costs Reference

| Network | Deploy Factory | Create Wallet | Total Cost |
|---------|----------------|---------------|------------|
| Sepolia | ~800k gas | ~350k gas | ~$0 (testnet) |
| Base Sepolia | ~800k gas | ~350k gas | ~$0 (testnet) |
| Base Mainnet | ~800k gas | ~350k gas | ~$0.02 |

---

## ✅ Checklist

- [ ] มี private key ใน `.env`
- [ ] มี ETH ใน testnet
- [ ] Compile ผ่าน (`npx hardhat compile`)
- [ ] Deploy สำเร็จ
- [ ] บันทึก contract address
- [ ] Test ผ่าน (สร้าง wallet ได้)
- [ ] (Optional) Verify contracts
- [ ] Update frontend config

---

**พร้อมแล้ว!** ตอนนี้คุณมี Smart Wallet System ที่ deploy บน testnet แล้ว 🎉
