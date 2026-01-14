## 📋 สารบัญ

1. [โปรเจคนี้คืออะไร](#1-โปรเจคนี้คืออะไร)
2. [แนวคิดและเป้าหมาย](#2-แนวคิดและเป้าหมาย)
3. [คำศัพท์และความหมาย](#3-คำศัพท์และความหมาย)
4. [ส่วนประกอบของระบบ](#4-ส่วนประกอบของระบบ)
5. [การทำงานของระบบ](#5-การทำงานของระบบ)
6. [โครงสร้างโปรเจค](#6-โครงสร้างโปรเจค)
7. [การติดตั้งและเริ่มต้นใช้งาน](#7-การติดตั้งและเริ่มต้นใช้งาน)
8. [ตัวอย่างการใช้งานแบบละเอียด](#8-ตัวอย่างการใช้งานแบบละเอียด)
9. [การทดสอบ](#9-การทดสอบ)
10. [คำถามที่พบบ่อย](#10-คำถามที่พบบ่อย)

---

## 1. โปรเจคนี้คืออะไร?

**DeFi City** คือโปรเจคที่รวมเกม City Builder กับระบบการเงินแบบ DeFi (Decentralized Finance) เข้าด้วยกัน

### สิ่งที่โปรเจคนี้ทำ:

- ให้ผู้เล่นสร้าง "Smart Wallet" (กระเป๋าเงินอัจฉริยะ) ของตัวเอง
- ฝากเงิน (ETH, USDC) เข้าสู่ Smart Wallet
- ใช้เงินในกระเป๋าสร้างอาคารต่างๆ ในเกม (เช่น Yield Farm ที่สร้างดอกเบี้ย)
- ถอนเงินกลับไปยังกระเป๋าตังค์หลัก (MetaMask) ได้ทุกเมื่อ

### ความพิเศษ:

- เงินในเกมเป็นเงินจริงบน Blockchain
- ผู้เล่นสามารถเอาเงินออกไปใช้จริงได้
- เล่นเกมไปด้วย ลงทุน DeFi ไปด้วย

---

## 2. แนวคิดและเป้าหมาย

### ปัญหาที่ต้องการแก้:

1. **DeFi ยากเกินไปสำหรับคนทั่วไป** - มีคำศัพท์เยอะ UI ซับซ้อน
2. **การลงทุนน่าเบื่อ** - ดูแค่ตัวเลขไปมา ไม่มีอะไรให้ทำ

### โซลูชัน:

- **เปลี่ยน DeFi ให้เป็นเกม** - แทนที่จะกด "Deposit" ให้กลายเป็นการ "สร้างอาคาร"
- **ทำให้สนุก** - ได้เล่นเกม + ได้ดอกเบี้ยจริงๆ

### ตัวอย่าง:

```
แบบเดิม (DeFi):
"Deposit 100 USDC to Aave Pool, APY 5.2%"
😴 น่าเบื่อ ไม่รู้ว่ากำลังทำอะไร

แบบใหม่ (DeFi City):
"Build Yield Farm - Cost: 100 USDC, Returns: 5.2% per year"
🏗️ สร้างฟาร์มใหญ่ ดูการเติบโต มีภาพให้เห็น สนุกกว่า!
```

---

## 3. คำศัพท์และความหมาย

ก่อนเริ่มต้น มาทำความเข้าใจคำศัพท์สำคัญกันก่อน:

### Blockchain & Crypto

- **Blockchain** = ฐานข้อมูลแบบกระจายอำนาจ เหมือนสมุดบัญชีที่ทุกคนเห็นเหมือนกัน
- **Smart Contract** = โปรแกรมที่รันบน Blockchain ทำงานอัตโนมัติ ไม่มีใครแก้ไขได้
- **ETH** = เหรียญ Ethereum (ใช้จ่ายค่า Gas ในการทำธุรกรรม)
- **USDC** = Stablecoin (เหรียญที่มีมูลค่า 1 USDC = 1 USD เสมอ)

### Wallet (กระเป๋าเงิน)

- **EOA (Externally Owned Account)** = กระเป๋าตังค์ปกติ เช่น MetaMask

  - ควบคุมด้วย Private Key (รหัสลับ)
  - คุณต้องจ่ายค่า Gas เองทุกครั้ง

- **Smart Wallet (Smart Contract Wallet)** = กระเป๋าตังค์อัจฉริยะ
  - เป็น Smart Contract บน Blockchain
  - มีโค้ดควบคุมการทำงาน
  - สามารถตั้งกฎได้ (เช่น ถอนได้วันละไม่เกิน X บาท)

### DeFi Protocols

- **Aave** = แพลตฟอร์มให้ยืม-ฝากเงิน (ฝากแล้วได้ดอกเบี้ย)
- **Uniswap** = ตลาดแลกเปลี่ยนเหรียญ (คุณสามารถเป็นผู้ให้สภาพคล่องได้รับค่าธรรมเนียม)
- **LP (Liquidity Provider)** = ผู้ให้สภาพคล่อง (ฝากคู่เหรียญเข้า Pool)
- **Yield Farm** = การฝากเงินเพื่อรับดอกเบี้ย

### Gas

- **Gas** = ค่าธรรมเนียมในการทำธุรกรรมบน Blockchain
- เหมือนค่าไฟฟ้าที่ต้องจ่ายเพื่อให้ Smart Contract ทำงาน
- ยิ่งทำอะไรซับซ้อน ยิ่งเสีย Gas เยอะ

---

## 4. ส่วนประกอบของระบบ

โปรเจค DeFi City ประกอบด้วย Smart Contract หลัก 2 ตัว:

### 4.1 SimpleSmartWallet.sol (กระเป๋าเงินอัจฉริยะ)

**หน้าที่:** เก็บเงินของผู้เล่นแต่ละคน

**ความสามารถ:**

```solidity
✅ ฝากเงิน ETH (รับ ETH เข้ากระเป๋า)
✅ ฝากเงิน ERC20 (รับ USDC, USDT, เหรียญอื่นๆ)
✅ ถอนเงิน ETH กลับไป
✅ ถอนเงิน ERC20 กลับไป
✅ ดูยอดเงินคงเหลือ
✅ โอนความเป็นเจ้าของกระเป๋า
```

**กลไกความปลอดภัย:**

- มี `owner` (เจ้าของ) เพียงคนเดียว
- **เฉพาะเจ้าของ** ถอนเงินได้
- ตรวจสอบ address ที่เป็น zero address (ป้องกันส่งเงินหาย)
- ใช้ Custom Errors (ประหยัด Gas)

**ตัวอย่างโค้ดสำคัญ:**

```solidity
// เจ้าของ wallet
address public owner;

// ฝาก ETH (รับเงินเข้ามา)
receive() external payable {
    emit Deposited(address(0), msg.value, msg.sender);
}

// ถอน ETH (ส่งเงินออกไป)
function withdrawETH(address payable to, uint256 amount) public onlyOwner {
    if (to == address(0)) revert InvalidAddress();
    if (address(this).balance < amount) revert InsufficientBalance();

    (bool success,) = to.call{value: amount}("");
    if (!success) revert TransferFailed();

    emit Withdrawn(address(0), amount, to);
}
```

### 4.2 SimpleWalletFactory.sol (โรงงานสร้าง Wallet)

**หน้าที่:** สร้าง Smart Wallet ให้กับผู้เล่นแต่ละคน

**ความสามารถ:**

```solidity
✅ สร้าง wallet ใหม่ให้ผู้เล่น
✅ เช็คว่าผู้เล่นคนนี้มี wallet แล้วหรือยัง
✅ ดึง address ของ wallet จาก address เจ้าของ
✅ นับจำนวน wallet ทั้งหมดที่สร้าง
```

**กลไกทำงาน:**

- เก็บ mapping ระหว่าง `owner address` → `wallet address`
- ผู้เล่น 1 คน มีได้ **1 wallet เท่านั้น**
- ถ้าสร้างซ้ำจะ revert (ห้ามสร้างซ้ำ)

**ตัวอย่างโค้ดสำคัญ:**

```solidity
// เก็บข้อมูลว่าใครมี wallet อะไร
mapping(address => address) public wallets;

// สร้าง wallet ใหม่
function createWallet(address owner) external returns (address wallet) {
    // ห้ามสร้างซ้ำ
    if (wallets[owner] != address(0)) revert WalletAlreadyExists();

    // Deploy wallet contract ใหม่
    SimpleSmartWallet newWallet = new SimpleSmartWallet(owner);
    wallet = address(newWallet);

    // บันทึกลง mapping
    wallets[owner] = wallet;
    totalWallets++;

    emit WalletCreated(owner, wallet, totalWallets);
}

// ดึง wallet address จาก owner
function getWallet(address owner) external view returns (address) {
    return wallets[owner];
}
```

---

## 5. การทำงานของระบบ

มาดูขั้นตอนการทำงานทั้งหมดตั้งแต่ต้นจนจบ:

### 5.1 Flow การใช้งาน (User Journey)

```
1. ผู้เล่นเชื่อมต่อ MetaMask
   │
   ↓
2. ระบบสร้าง Smart Wallet ให้ผู้เล่น (ผ่าน Factory)
   │
   ↓
3. ผู้เล่นฝากเงิน (ETH/USDC) จาก MetaMask → Smart Wallet
   │
   ↓
4. เล่นเกม: สร้างอาคาร (ใช้เงินใน Smart Wallet)
   │   ├── สร้าง Yield Farm (ฝากเงินไป Aave รับดอกเบี้ย)
   │   ├── สร้าง LP Mine (ฝากคู่เหรียญไป Uniswap รับค่าธรรมเนียม)
   │   └── อื่นๆ...
   │
   ↓
5. เก็บเกี่ยวผลตอบแทน (Harvest)
   │
   ↓
6. ถอนเงินกลับ Smart Wallet → MetaMask
```

### 5.2 ตัวอย่างสถานการณ์จริง

**สมมติ:** คุณชื่อ Alice มีเงิน 1000 USDC ใน MetaMask

#### ขั้นตอนที่ 1: เชื่อมต่อ Wallet

```javascript
// คลิกปุ่ม "Connect Wallet" บนหน้าเว็บ
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const aliceAddress = await signer.getAddress();

console.log("Alice address:", aliceAddress);
// Output: 0xAlice...
```

#### ขั้นตอนที่ 2: สร้าง Smart Wallet

```javascript
// ระบบเรียก Factory Contract
const factory = new ethers.Contract(FACTORY_ADDRESS, ABI, signer);
const tx = await factory.createWallet(aliceAddress);
await tx.wait();

const aliceWallet = await factory.getWallet(aliceAddress);
console.log("Alice's Smart Wallet:", aliceWallet);
// Output: 0xWallet123...
```

**ตอนนี้ Alice มี:**

- ✅ MetaMask wallet: `0xAlice...` (มีเงิน 1000 USDC)
- ✅ Smart Wallet: `0xWallet123...` (ยังไม่มีเงิน)

#### ขั้นตอนที่ 3: ฝากเงินเข้า Smart Wallet

```javascript
// Alice โอน 500 USDC จาก MetaMask → Smart Wallet
const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
const wallet = new ethers.Contract(aliceWallet, WALLET_ABI, signer);

// 3.1 Approve Smart Wallet ให้ใช้ USDC ได้
await usdc.approve(aliceWallet, ethers.parseUnits("500", 6));

// 3.2 Deposit เข้า Smart Wallet
await wallet.depositToken(USDC_ADDRESS, ethers.parseUnits("500", 6));
```

**ตอนนี้ Alice มี:**

- MetaMask: 500 USDC (เหลือ)
- Smart Wallet: 500 USDC ✅

#### ขั้นตอนที่ 4: สร้างอาคาร (เล่นเกม)

**Alice สร้าง Yield Farm ที่ฝาก 500 USDC ไป Aave:**

```javascript
// 4.1 Approve Aave ให้ใช้ USDC ใน Smart Wallet
const aavePool = new ethers.Contract(AAVE_POOL_ADDRESS, AAVE_ABI, provider);

const approveCalldata = new ethers.Interface([
  "function approve(address spender, uint256 amount)",
]).encodeFunctionData("approve", [
  AAVE_POOL_ADDRESS,
  ethers.parseUnits("500", 6),
]);

// Smart Wallet เรียกฟังก์ชัน approve บน USDC contract
await wallet.execute(USDC_ADDRESS, 0, approveCalldata);

// 4.2 Supply USDC ไป Aave
const supplyCalldata = aavePool.interface.encodeFunctionData("supply", [
  USDC_ADDRESS,
  ethers.parseUnits("500", 6),
  aliceWallet, // aUSDC จะไปที่ Smart Wallet
  0,
]);

await wallet.execute(AAVE_POOL_ADDRESS, 0, supplyCalldata);

console.log("✅ Yield Farm สร้างเสร็จแล้ว!");
```

**ตอนนี้:**

- Smart Wallet มี: 500 aUSDC (ตั๋วฝากเงิน Aave)
- aUSDC จะเพิ่มมูลค่าเรื่อยๆ (ได้ดอกเบี้ย 5.2% ต่อปี)

#### ขั้นตอนที่ 5: เก็บเกี่ยว (Harvest)

**1 ปีต่อมา aUSDC เพิ่มเป็น 526 USDC (ได้ดอกเบี้ย 26 USDC):**

```javascript
// Withdraw จาก Aave
const withdrawCalldata = aavePool.interface.encodeFunctionData("withdraw", [
  USDC_ADDRESS,
  ethers.parseUnits("526", 6), // ถอนทั้งหมด
  aliceWallet,
]);

await wallet.execute(AAVE_POOL_ADDRESS, 0, withdrawCalldata);

console.log("✅ เก็บเกี่ยวแล้ว! ได้ 526 USDC");
```

#### ขั้นตอนที่ 6: ถอนเงินกลับ MetaMask

```javascript
// ถอน 526 USDC จาก Smart Wallet → MetaMask
await wallet.withdrawToken(
  USDC_ADDRESS,
  aliceAddress, // ส่งกลับไปที่ MetaMask ของ Alice
  ethers.parseUnits("526", 6)
);

console.log("✅ ถอนเงินเรียบร้อย!");
```

**สรุปผลลัพธ์:**

- เริ่มต้น: 1000 USDC
- ฝากเข้าเกม: 500 USDC
- ผลตอบแทน: +26 USDC (5.2% ต่อปี)
- **ถอนกลับได้: 526 USDC** ✅
- **กำไร: 26 USDC** 🎉

---

## 6. โครงสร้างโปรเจค

```
defi-city/
│
├── contracts/                    # Smart Contracts (โค้ดหลัก)
│   ├── SimpleSmartWallet.sol     # Wallet Contract
│   ├── SimpleWalletFactory.sol   # Factory Contract
│   ├── MockERC20.sol             # Token ปลอมสำหรับทดสอบ
│   └── interfaces/               # ERC-4337 interfaces
│       ├── IAccount.sol
│       ├── IEntryPoint.sol
│       └── UserOperation.sol
│
├── scripts/                      # สคริปต์สำหรับ Deploy
│   └── deploy.js                 # Deploy contract ขึ้น blockchain
│
├── test/                         # Test files
│   └── SimpleWallet.test.js      # ทดสอบการทำงานของ contract
│
├── docs/                         # เอกสาร
│   ├── USAGE_EXAMPLES.md         # ตัวอย่างการใช้งาน
│   ├── AA_ARCHITECTURE.md        # สถาปัตยกรรม Account Abstraction
│   ├── SECURITY.md               # ความปลอดภัย
│   ├── DEPLOYMENT.md             # วิธี Deploy
│   └── THAI_TUTORIAL.md          # คู่มือภาษาไทย (ไฟล์นี้)
│
├── hardhat.config.js             # ตั้งค่า Hardhat (เครื่องมือ Dev)
├── package.json                  # Dependencies
├── README.md                     # README หลัก
└── QUICKSTART.md                 # คู่มือเริ่มต้นอย่างรวดเร็ว
```

### ไฟล์สำคัญ:

**1. hardhat.config.js** - ตั้งค่าเครือข่าย

```javascript
module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    base: {
      url: BASE_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
};
```

**2. package.json** - Dependencies

```json
{
  "dependencies": {
    "@openzeppelin/contracts": "^5.4.0", // Library มาตรฐาน
    "dotenv": "^16.3.1" // จัดการ environment variables
  },
  "devDependencies": {
    "hardhat": "^2.19.0", // Framework สำหรับพัฒนา
    "@nomicfoundation/hardhat-toolbox": "^4.0.0"
  }
}
```

---

## 7. การติดตั้งและเริ่มต้นใช้งาน

### 7.1 ความต้องการของระบบ (Requirements)

**ซอฟต์แวร์ที่ต้องมี:**

- Node.js (v16 หรือสูงกว่า)
- npm หรือ yarn
- Git
- MetaMask (สำหรับทดสอบ)

**ความรู้พื้นฐาน:**

- JavaScript พื้นฐาน
- เข้าใจ Blockchain เบื้องต้น (แนะนำ แต่ไม่บังคับ)

### 7.2 ติดตั้งโปรเจค

#### ขั้นตอนที่ 1: Clone โปรเจค

```bash
# Clone repository (ถ้ามี)
git clone <repository-url>
cd defi-city

# หรือถ้าอยู่ในโฟลเดอร์แล้ว
cd /Users/da-m3/Desktop/defi-city
```

#### ขั้นตอนที่ 2: ติดตั้ง Dependencies

```bash
# ติดตั้ง packages ทั้งหมด
npm install

# หรือใช้ yarn
yarn install
```

**จะติดตั้งอะไรบ้าง:**

- Hardhat (เครื่องมือพัฒนา Smart Contract)
- OpenZeppelin Contracts (Library มาตรฐาน)
- Ethers.js (ใช้เชื่อมต่อกับ Blockchain)

#### ขั้นตอนที่ 3: Compile Contracts

```bash
# Compile Smart Contracts
npx hardhat compile
```

**Output:**

```
Compiling 3 files with 0.8.20
Compilation finished successfully
✅ Artifacts saved to: artifacts/
```

**ไฟล์ที่ได้:**

- `artifacts/contracts/SimpleSmartWallet.sol/SimpleSmartWallet.json` (ABI + Bytecode)
- `artifacts/contracts/SimpleWalletFactory.sol/SimpleWalletFactory.json`

### 7.3 รันการทดสอบ

```bash
# รัน test ทั้งหมด
npx hardhat test
```

**ผลลัพธ์ที่ควรได้:**

```
  SimpleWallet System
    Factory
      ✔ Should deploy factory successfully (250ms)
      ✔ Should create wallet for user (180ms)
      ✔ Should revert if creating wallet for same user twice (90ms)
      ✔ Should get or create wallet (200ms)
    Wallet - Deposit & Withdraw ETH
      ✔ Should have correct owner
      ✔ Should deposit ETH to wallet (80ms)
      ✔ Should withdraw ETH from wallet (120ms)
      ✔ Should withdraw all ETH from wallet (110ms)
      ✔ Should revert if non-owner tries to withdraw (70ms)
      ✔ Should revert if insufficient balance (60ms)
    Wallet - Deposit & Withdraw ERC20
      ✔ Should deposit tokens to wallet (150ms)
      ✔ Should withdraw tokens from wallet (140ms)
      ✔ Should withdraw all tokens from wallet (130ms)
      ✔ Should revert if non-owner tries to withdraw tokens (80ms)
    Ownership
      ✔ Should transfer ownership (100ms)

  15 passing (2s)
```

### 7.4 Deploy บน Local Network

**Terminal 1: เริ่ม Local Blockchain**

```bash
npx hardhat node
```

**Output:**

```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...
```

**Terminal 2: Deploy Contracts**

```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Output:**

```
🚀 Deploying contracts...

📝 Deploying SimpleWalletFactory...
✅ Factory deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

✅ Deployment complete!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Deployment Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Factory Address:
0x5FbDB2315678afecb367f032d93F642f64180aa3

Network: localhost

Save these addresses!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**บันทึก address นี้ไว้!** จะใช้ในขั้นตอนถัดไป

---

## 8. ตัวอย่างการใช้งานแบบละเอียด

### 8.1 เชื่อมต่อกับ Contract ที่ Deploy แล้ว

```javascript
const { ethers } = require("ethers");

// 1. เชื่อมต่อกับ Local Network
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// 2. ใช้ account จาก Hardhat node
const privateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const signer = new ethers.Wallet(privateKey, provider);

console.log("Connected as:", await signer.getAddress());
// Output: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### 8.2 เชื่อมต่อกับ Factory Contract

```javascript
// Factory address (จากขั้นตอน Deploy)
const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ABI (อ่านจาก artifacts)
const factoryArtifact = require("./artifacts/contracts/SimpleWalletFactory.sol/SimpleWalletFactory.json");
const FACTORY_ABI = factoryArtifact.abi;

// สร้าง Contract instance
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

console.log("Factory contract loaded!");
```

### 8.3 สร้าง Smart Wallet

```javascript
async function createSmartWallet(ownerAddress) {
  console.log("Creating wallet for:", ownerAddress);

  // 1. เช็คว่ามี wallet แล้วหรือยัง
  let walletAddress = await factory.getWallet(ownerAddress);

  if (walletAddress === ethers.ZeroAddress) {
    console.log("Wallet not found. Creating new one...");

    // 2. สร้าง wallet ใหม่
    const tx = await factory.createWallet(ownerAddress);
    console.log("Transaction sent:", tx.hash);

    // 3. รอให้ transaction สำเร็จ
    const receipt = await tx.wait();
    console.log("Transaction confirmed!");
    console.log("Gas used:", receipt.gasUsed.toString());

    // 4. ดึง wallet address
    walletAddress = await factory.getWallet(ownerAddress);
  } else {
    console.log("Wallet already exists!");
  }

  console.log("Wallet address:", walletAddress);
  return walletAddress;
}

// ใช้งาน
const myAddress = await signer.getAddress();
const myWallet = await createSmartWallet(myAddress);
```

**Output:**

```
Creating wallet for: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Wallet not found. Creating new one...
Transaction sent: 0x1234567890abcdef...
Transaction confirmed!
Gas used: 354821
Wallet address: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### 8.4 ฝาก ETH เข้า Smart Wallet

```javascript
async function depositETH(walletAddress, amountInEther) {
  console.log(`Depositing ${amountInEther} ETH to wallet...`);

  // ส่ง ETH ไปที่ wallet
  const tx = await signer.sendTransaction({
    to: walletAddress,
    value: ethers.parseEther(amountInEther),
  });

  await tx.wait();
  console.log("✅ Deposit successful!");

  // เช็คยอดเงิน
  const balance = await provider.getBalance(walletAddress);
  console.log("New balance:", ethers.formatEther(balance), "ETH");
}

// ใช้งาน
await depositETH(myWallet, "1.0"); // ฝาก 1 ETH
```

**Output:**

```
Depositing 1.0 ETH to wallet...
✅ Deposit successful!
New balance: 1.0 ETH
```

### 8.5 ถอน ETH จาก Smart Wallet

```javascript
async function withdrawETH(walletAddress, recipientAddress, amountInEther) {
  console.log(`Withdrawing ${amountInEther} ETH...`);

  // โหลด Wallet contract
  const walletArtifact = require("./artifacts/contracts/SimpleSmartWallet.sol/SimpleSmartWallet.json");
  const wallet = new ethers.Contract(walletAddress, walletArtifact.abi, signer);

  // ถอนเงิน
  const tx = await wallet.withdrawETH(
    recipientAddress,
    ethers.parseEther(amountInEther)
  );

  await tx.wait();
  console.log("✅ Withdrawal successful!");

  // เช็คยอดเงินที่เหลือ
  const balance = await wallet.getETHBalance();
  console.log("Remaining balance:", ethers.formatEther(balance), "ETH");
}

// ใช้งาน
const recipient = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Account #1
await withdrawETH(myWallet, recipient, "0.5"); // ถอน 0.5 ETH
```

**Output:**

```
Withdrawing 0.5 ETH...
✅ Withdrawal successful!
Remaining balance: 0.5 ETH
```

### 8.6 ฝาก-ถอน ERC20 Token (USDC)

#### 8.6.1 Deploy Mock USDC Token

```javascript
async function deployMockUSDC() {
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6); // 6 decimals
  await usdc.waitForDeployment();

  const usdcAddress = await usdc.getAddress();
  console.log("Mock USDC deployed to:", usdcAddress);

  // Mint 10,000 USDC ให้ตัวเอง
  await usdc.mint(await signer.getAddress(), ethers.parseUnits("10000", 6));
  console.log("Minted 10,000 USDC");

  return usdc;
}

const usdc = await deployMockUSDC();
```

#### 8.6.2 ฝาก USDC เข้า Smart Wallet

```javascript
async function depositUSDC(walletAddress, usdc, amount) {
  console.log(`Depositing ${amount} USDC...`);

  const walletArtifact = require("./artifacts/contracts/SimpleSmartWallet.sol/SimpleSmartWallet.json");
  const wallet = new ethers.Contract(walletAddress, walletArtifact.abi, signer);

  // 1. Approve wallet ให้ใช้ USDC ได้
  const approveTx = await usdc.approve(
    walletAddress,
    ethers.parseUnits(amount, 6)
  );
  await approveTx.wait();
  console.log("✅ Approved");

  // 2. Deposit USDC
  const depositTx = await wallet.depositToken(
    await usdc.getAddress(),
    ethers.parseUnits(amount, 6)
  );
  await depositTx.wait();
  console.log("✅ Deposited");

  // 3. เช็คยอด
  const balance = await wallet.getTokenBalance(await usdc.getAddress());
  console.log("USDC balance:", ethers.formatUnits(balance, 6), "USDC");
}

await depositUSDC(myWallet, usdc, "1000"); // ฝาก 1000 USDC
```

**Output:**

```
Depositing 1000 USDC...
✅ Approved
✅ Deposited
USDC balance: 1000.0 USDC
```

#### 8.6.3 ถอน USDC จาก Smart Wallet

```javascript
async function withdrawUSDC(walletAddress, usdc, recipientAddress, amount) {
  console.log(`Withdrawing ${amount} USDC...`);

  const walletArtifact = require("./artifacts/contracts/SimpleSmartWallet.sol/SimpleSmartWallet.json");
  const wallet = new ethers.Contract(walletAddress, walletArtifact.abi, signer);

  // ถอน USDC
  const tx = await wallet.withdrawToken(
    await usdc.getAddress(),
    recipientAddress,
    ethers.parseUnits(amount, 6)
  );
  await tx.wait();
  console.log("✅ Withdrawn");

  // เช็คยอดที่เหลือ
  const balance = await wallet.getTokenBalance(await usdc.getAddress());
  console.log("Remaining USDC:", ethers.formatUnits(balance, 6), "USDC");
}

await withdrawUSDC(myWallet, usdc, recipient, "500"); // ถอน 500 USDC
```

### 8.7 โปรแกรมตัวอย่างสมบูรณ์

บันทึกเป็นไฟล์ `examples/complete-flow.js`:

```javascript
const { ethers } = require("ethers");

async function main() {
  console.log("=== DeFi City Complete Example ===\n");

  // 1. Setup
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    provider
  );

  const userAddress = await signer.getAddress();
  console.log("👤 User:", userAddress);

  // 2. Load Factory
  const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const factoryArtifact = require("../artifacts/contracts/SimpleWalletFactory.sol/SimpleWalletFactory.json");
  const factory = new ethers.Contract(
    FACTORY_ADDRESS,
    factoryArtifact.abi,
    signer
  );

  // 3. Create Wallet
  console.log("\n📦 Creating Smart Wallet...");
  const createTx = await factory.createWallet(userAddress);
  await createTx.wait();

  const walletAddress = await factory.getWallet(userAddress);
  console.log("✅ Wallet created:", walletAddress);

  // 4. Deposit ETH
  console.log("\n💰 Depositing 2 ETH...");
  const depositTx = await signer.sendTransaction({
    to: walletAddress,
    value: ethers.parseEther("2.0"),
  });
  await depositTx.wait();
  console.log("✅ Deposited 2 ETH");

  // 5. Check balance
  const walletArtifact = require("../artifacts/contracts/SimpleSmartWallet.sol/SimpleSmartWallet.json");
  const wallet = new ethers.Contract(walletAddress, walletArtifact.abi, signer);

  const balance = await wallet.getETHBalance();
  console.log("💵 Wallet balance:", ethers.formatEther(balance), "ETH");

  // 6. Withdraw
  console.log("\n📤 Withdrawing 1 ETH...");
  const withdrawTx = await wallet.withdrawETH(
    userAddress,
    ethers.parseEther("1.0")
  );
  await withdrawTx.wait();
  console.log("✅ Withdrawn 1 ETH");

  // 7. Final balance
  const finalBalance = await wallet.getETHBalance();
  console.log("💵 Final balance:", ethers.formatEther(finalBalance), "ETH");

  console.log("\n✅ Complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**รันโปรแกรม:**

```bash
node examples/complete-flow.js
```

---

## 9. การทดสอบ

### 9.1 โครงสร้างไฟล์ Test

ดูที่ `test/SimpleWallet.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleWallet System", function () {
  let factory;
  let owner, user1, user2;

  // Setup ก่อนแต่ละ test
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Factory
    const Factory = await ethers.getContractFactory("SimpleWalletFactory");
    factory = await Factory.deploy();
  });

  describe("Factory", function () {
    it("Should create wallet for user", async function () {
      // สร้าง wallet
      await factory.createWallet(user1.address);

      // ตรวจสอบว่าได้ wallet address
      const walletAddress = await factory.getWallet(user1.address);
      expect(walletAddress).to.not.equal(ethers.ZeroAddress);

      // ตรวจสอบว่า wallet มี owner ถูกต้อง
      const wallet = await ethers.getContractAt(
        "SimpleSmartWallet",
        walletAddress
      );
      expect(await wallet.owner()).to.equal(user1.address);
    });

    it("Should revert if creating wallet twice", async function () {
      await factory.createWallet(user1.address);

      // พยายามสร้างซ้ำ → ควร revert
      await expect(
        factory.createWallet(user1.address)
      ).to.be.revertedWithCustomError(factory, "WalletAlreadyExists");
    });
  });

  describe("Wallet - ETH", function () {
    let wallet;

    beforeEach(async function () {
      await factory.createWallet(user1.address);
      const walletAddress = await factory.getWallet(user1.address);
      wallet = await ethers.getContractAt("SimpleSmartWallet", walletAddress);
    });

    it("Should deposit ETH", async function () {
      // ฝาก 1 ETH
      await user1.sendTransaction({
        to: await wallet.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      // ตรวจสอบยอด
      expect(await wallet.getETHBalance()).to.equal(ethers.parseEther("1.0"));
    });

    it("Should withdraw ETH", async function () {
      // ฝาก
      await user1.sendTransaction({
        to: await wallet.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      // ถอน
      await wallet
        .connect(user1)
        .withdrawETH(user1.address, ethers.parseEther("0.5"));

      // ตรวจสอบยอดที่เหลือ
      expect(await wallet.getETHBalance()).to.equal(ethers.parseEther("0.5"));
    });

    it("Should revert if non-owner tries to withdraw", async function () {
      await user1.sendTransaction({
        to: await wallet.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      // user2 พยายามถอนเงินของ user1 → ควร revert
      await expect(
        wallet
          .connect(user2)
          .withdrawETH(user2.address, ethers.parseEther("0.5"))
      ).to.be.revertedWithCustomError(wallet, "OnlyOwner");
    });
  });
});
```

### 9.2 รัน Test แบบละเอียด

```bash
# รัน test ทั้งหมด พร้อมแสดง gas usage
npx hardhat test --verbose

# รัน test เฉพาะไฟล์
npx hardhat test test/SimpleWallet.test.js

# รัน test แบบ watch mode (รันใหม่ทุกครั้งที่มีการแก้ไข)
npx hardhat test --watch
```

---

## 10. คำถามที่พบบ่อย (FAQ)

### Q1: Smart Wallet ต่างจาก MetaMask อย่างไร?

**A:**
| Feature | MetaMask (EOA) | Smart Wallet |
|---------|----------------|--------------|
| ควบคุมโดย | Private Key | Smart Contract Code |
| ตั้งกฎได้ | ❌ | ✅ (เช่น จำกัดการถอน) |
| Gasless TX | ❌ | ✅ (ใช้ ERC-4337) |
| ซับซ้อน | ง่าย | ซับซ้อนกว่า |
| ค่าใช้จ่าย | ต่ำ | สูงกว่า (ต้อง deploy contract) |

### Q2: ทำไมต้องใช้ Factory? สร้าง Wallet ด้วยตัวเองไม่ได้เหรอ?

**A:** ได้! แต่ Factory ช่วยให้:

- **จัดการง่าย**: มี mapping ระหว่าง owner → wallet
- **ค้นหาง่าย**: เรียก `getWallet(owner)` ได้ทันที
- **ป้องกันซ้ำ**: 1 คนมีได้ 1 wallet
- **นับสถิติ**: รู้ว่ามีผู้ใช้กี่คน

### Q3: ถ้า Private Key หาย Smart Wallet จะหายด้วยไหม?

**A:** ใช่! Smart Wallet ปัจจุบันยังควบคุมโดย owner address (EOA)

- ถ้า Private Key ของ EOA หาย → เข้าถึง Smart Wallet ไม่ได้
- **โซลูชัน:** ใช้ Social Recovery (Phase 4 ใน Roadmap)

### Q4: Gas คิดยังไง? แพงไหม?

**A:** ค่า Gas แบ่งเป็น:

- **Deploy Factory**: ~800,000 gas (ครั้งเดียว)
- **Create Wallet**: ~350,000 gas (~$0.007 บน Base L2)
- **Deposit/Withdraw**: ~25,000-30,000 gas

**เทียบกับ EOA:**

- EOA transfer: ~21,000 gas
- Smart Wallet แพงกว่า แต่ได้ฟีเจอร์เยอะกว่า

### Q5: ปลอดภัยไหม? ถ้าโดนแฮกล่ะ?

**A:** ความปลอดภัย:

- ✅ Owner-only access (เฉพาะเจ้าของถอนได้)
- ✅ Address validation (ป้องกันส่งเงินหาย)
- ✅ Custom errors (ประหยัด gas)
- ⚠️ **ยังไม่ผ่าน audit** (อยู่ระหว่าง MVP)

**ข้อควรระวัง:**

- อย่าใช้กับเงินจำนวนมากในระบบ production
- ควร audit โค้ดก่อน deploy จริง
- ระวัง reentrancy attack (ใน Phase 2)

### Q6: เชื่อมต่อกับ DeFi protocols (Aave, Uniswap) ได้ไหม?

**A:** ได้! (Phase 2 ใน Roadmap)

- ตอนนี้ยังไม่มี `execute()` function
- จะเพิ่มในอนาคต เพื่อให้เรียกฟังก์ชันใดก็ได้

**ตัวอย่างใน Phase 2:**

```solidity
function execute(address target, uint256 value, bytes calldata data)
    external onlyOwner
{
    (bool success, ) = target.call{value: value}(data);
    require(success, "Execution failed");
}
```

### Q7: ทำ Batch operations (หลาย transaction ในครั้งเดียว) ได้ไหม?

**A:** ยังไม่ได้ (จะเพิ่มใน Phase 2)

```solidity
function executeBatch(
    address[] calldata targets,
    uint256[] calldata values,
    bytes[] calldata calldatas
) external onlyOwner {
    for (uint i = 0; i < targets.length; i++) {
        // Execute each call
    }
}
```

### Q8: สามารถโอนความเป็นเจ้าของ Wallet ให้คนอื่นได้ไหม?

**A:** ได้! ใช้ฟังก์ชัน `transferOwnership()`

```javascript
await wallet.transferOwnership(newOwnerAddress);
```

**คำเตือน:** การโอนแล้วไม่สามารถกู้คืนได้!

### Q9: Deploy บน Mainnet ต้องเตรียมอะไรบ้าง?

**A:**

1. **ETH สำหรับ Gas** - ประมาณ 0.05-0.1 ETH
2. **RPC URL** - Infura หรือ Alchemy
3. **Private Key** - ตั้งใน `.env` (อย่า commit!)
4. **Verify Contract** - ใช้ Etherscan API

```bash
# Deploy บน Sepolia Testnet
npx hardhat run scripts/deploy.js --network sepolia

# Verify contract
npx hardhat verify --network sepolia DEPLOYED_ADDRESS
```

### Q10: มี Frontend ตัวอย่างไหม?

**A:** ยังไม่มี แต่สามารถใช้ React Hook ตัวอย่างนี้:

```jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";

function useSmartWallet() {
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    async function init() {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const eoa = await signer.getAddress();

      const factory = new ethers.Contract(FACTORY, ABI, signer);
      let walletAddr = await factory.getWallet(eoa);

      if (walletAddr === ethers.ZeroAddress) {
        const tx = await factory.createWallet(eoa);
        await tx.wait();
        walletAddr = await factory.getWallet(eoa);
      }

      setWallet(walletAddr);
    }

    init();
  }, []);

  return wallet;
}

export default function App() {
  const wallet = useSmartWallet();

  return (
    <div>
      <h1>DeFi City</h1>
      <p>Wallet: {wallet}</p>
    </div>
  );
}
```

---

## 🎯 สรุป

### ✅ สิ่งที่เรียนรู้:

1. **Smart Wallet คืออะไร** - กระเป๋าเงินที่ควบคุมด้วยโค้ด
2. **Factory Pattern** - สร้าง wallet แบบมีระเบียบ
3. **DeFi Integration** - เชื่อมต่อกับ Aave, Uniswap
4. **Security Best Practices** - Owner-only, validation, custom errors

### 🚀 ขั้นตอนถัดไป:

1. ✅ **ทดลองรัน**: Deploy บน localhost ทดสอบฟังก์ชัน
2. ✅ **แก้ไข**: เพิ่มฟีเจอร์ตามต้องการ
3. ✅ **Deploy Testnet**: ทดสอบบน Sepolia
4. 🔄 **Phase 2**: เพิ่ม DeFi integrations
5. 🔄 **Phase 3**: ERC-4337 Account Abstraction
6. 🔄 **Production**: Audit + Deploy mainnet

### 📚 เอกสารเพิ่มเติม:

- [QUICKSTART.md](../QUICKSTART.md) - เริ่มต้นอย่างรวดเร็ว
- [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) - ตัวอย่างการใช้งานขั้นสูง
- [AA_ARCHITECTURE.md](./AA_ARCHITECTURE.md) - สถาปัตยกรรม ERC-4337
- [SECURITY.md](./SECURITY.md) - ความปลอดภัย

---

**สร้างด้วย ❤️ สำหรับ DeFi City**

_ทำให้ DeFi เข้าถึงได้ผ่านการเล่นเกม_ 🎮

---

## 💬 ติดต่อ & สนับสนุน

- 📖 Documentation: [docs/](.)
- 🐛 Issues: GitHub Issues
- 💬 Community: Discord

**Happy Building!** 🏗️
