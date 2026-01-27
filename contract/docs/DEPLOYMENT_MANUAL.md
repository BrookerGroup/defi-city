# DeFi City - คู่มือการ Deploy Smart Contracts แบบทีละขั้นตอน
# DeFi City - Smart Contract Deployment Manual (Step by Step)

## สารบัญ / Table of Contents

1. [เตรียมสภาพแวดล้อม / Environment Setup](#1-environment-setup)
2. [การ Deploy แบบอัตโนมัติ / Automated Deployment](#2-automated-deployment)
3. [การ Deploy แบบทีละ Contract / Manual Contract-by-Contract Deployment](#3-manual-deployment)
4. [การตรวจสอบ Deployment / Verification](#4-verification)
5. [การแก้ไขปัญหา / Troubleshooting](#5-troubleshooting)

---

## 1. เตรียมสภาพแวดล้อม / Environment Setup

### 1.1 ติดตั้ง Dependencies / Install Dependencies

```bash
npm install
```

### 1.2 ตั้งค่า Environment Variables

สร้างไฟล์ `.env` จาก `.env.example`:

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env` ให้ครบถ้วน:

```env
# Private key สำหรับ deploy (ต้องมี ETH เพียงพอสำหรับ gas)
PRIVATE_KEY=your_private_key_here

# RPC URLs
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Block Explorer API Keys (สำหรับ verify contracts)
BASESCAN_API_KEY=your_basescan_api_key
```

### 1.3 Compile Contracts

```bash
npm run compile
```

---

## 2. การ Deploy แบบอัตโนมัติ / Automated Deployment

### 2.1 Deploy บน Local Network (สำหรับทดสอบ)

**ขั้นตอนที่ 1: เปิด Local Node**

```bash
# Terminal 1
npm run node
```

**ขั้นตอนที่ 2: Deploy Core Contracts**

```bash
# Terminal 2
npm run deploy:core:local
```

Contracts ที่จะถูก deploy:
- ✅ BuildingRegistry
- ✅ DefiCityCore
- ✅ WalletFactory

**ขั้นตอนที่ 3: Deploy Integration Contracts**

```bash
npm run deploy:integration:local
```

Contracts ที่จะถูก deploy:
- ✅ Mock Tokens (USDC, WETH, AERO)
- ✅ Mock DeFi Protocols (MockAavePool, MockMegapot, MockAerodromeRouter)
- ✅ Building Adapters (BankAdapter, LotteryAdapter, ShopAdapter)

### 2.2 Deploy บน Base Sepolia Testnet

**ขั้นตอนที่ 1: Deploy Core Contracts**

```bash
npm run deploy:core:baseSepolia
```

**ขั้นตอนที่ 2: Deploy Integration Contracts**

```bash
npm run deploy:integration:baseSepolia
```

---

## 3. การ Deploy แบบทีละ Contract / Manual Contract-by-Contract Deployment

หากต้องการควบคุม deployment แบบละเอียด สามารถ deploy ทีละ contract ได้ด้วย Hardhat console

### 3.1 เตรียม Hardhat Console

**บน Local Network:**

```bash
# Terminal 1: เปิด local node
npm run node

# Terminal 2: เปิด console
npx hardhat console --network localhost
```

**บน Base Sepolia:**

```bash
npx hardhat console --network baseSepolia
```

### 3.2 Deploy Core Contracts ทีละ Contract

#### Step 1: Deploy BuildingRegistry

```javascript
// ใน Hardhat console
const [deployer] = await ethers.getSigners();
console.log("Deployer address:", deployer.address);

// Deploy BuildingRegistry
const BuildingRegistry = await ethers.getContractFactory("BuildingRegistry");
const buildingRegistry = await BuildingRegistry.deploy();
await buildingRegistry.waitForDeployment();

const registryAddress = await buildingRegistry.getAddress();
console.log("✅ BuildingRegistry deployed to:", registryAddress);

// บันทึก address
const fs = require('fs');
const deployments = {
  buildingRegistry: registryAddress
};
```

#### Step 2: Deploy DefiCityCore

```javascript
// กำหนด treasury address (ใช้ deployer หรือ address อื่น)
const treasuryAddress = deployer.address;

// Deploy DefiCityCore
const DefiCityCore = await ethers.getContractFactory("DefiCityCore");
const defiCityCore = await DefiCityCore.deploy(treasuryAddress);
await defiCityCore.waitForDeployment();

const coreAddress = await defiCityCore.getAddress();
console.log("✅ DefiCityCore deployed to:", coreAddress);

// บันทึก address
deployments.defiCityCore = coreAddress;
```

#### Step 3: Deploy WalletFactory

```javascript
// EntryPoint v0.6 official address
const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

// Deploy WalletFactory
const WalletFactory = await ethers.getContractFactory("WalletFactory");
const walletFactory = await WalletFactory.deploy(
  entryPointAddress,
  coreAddress
);
await walletFactory.waitForDeployment();

const factoryAddress = await walletFactory.getAddress();
console.log("✅ WalletFactory deployed to:", factoryAddress);

// บันทึก address
deployments.walletFactory = factoryAddress;
```

#### Step 4: Setup Core Contracts

```javascript
// Set WalletFactory in DefiCityCore
const tx = await defiCityCore.setWalletFactory(factoryAddress);
await tx.wait();
console.log("✅ WalletFactory set in DefiCityCore");

// Grant roles (optional - หาก deployer ไม่ใช่คนเดียวที่จัดการ)
// const ADAPTER_MANAGER_ROLE = await buildingRegistry.ADAPTER_MANAGER_ROLE();
// await buildingRegistry.grantRole(ADAPTER_MANAGER_ROLE, managerAddress);

// บันทึก deployments
fs.writeFileSync(
  'deployments/manual-deployment.json',
  JSON.stringify(deployments, null, 2)
);
console.log("\n✅ Core Contracts deployed successfully!");
console.log("Deployment addresses saved to deployments/manual-deployment.json");
```

### 3.3 Deploy Integration Contracts ทีละ Contract

#### Step 5: Deploy Mock Tokens

```javascript
// Deploy Mock USDC
const MockERC20 = await ethers.getContractFactory("MockERC20");

const mockUSDC = await MockERC20.deploy(
  "Mock USDC",
  "USDC",
  6 // decimals
);
await mockUSDC.waitForDeployment();
const usdcAddress = await mockUSDC.getAddress();
console.log("✅ Mock USDC deployed to:", usdcAddress);

// Deploy Mock WETH
const mockWETH = await MockERC20.deploy(
  "Mock WETH",
  "WETH",
  18 // decimals
);
await mockWETH.waitForDeployment();
const wethAddress = await mockWETH.getAddress();
console.log("✅ Mock WETH deployed to:", wethAddress);

// Deploy Mock AERO
const mockAERO = await MockERC20.deploy(
  "Mock AERO",
  "AERO",
  18 // decimals
);
await mockAERO.waitForDeployment();
const aeroAddress = await mockAERO.getAddress();
console.log("✅ Mock AERO deployed to:", aeroAddress);

// บันทึก
deployments.mockUSDC = usdcAddress;
deployments.mockWETH = wethAddress;
deployments.mockAERO = aeroAddress;
```

#### Step 6: Deploy Mock DeFi Protocols

```javascript
// Deploy MockAavePool
const MockAavePool = await ethers.getContractFactory("MockAavePool");
const mockAavePool = await MockAavePool.deploy();
await mockAavePool.waitForDeployment();
const aavePoolAddress = await mockAavePool.getAddress();
console.log("✅ MockAavePool deployed to:", aavePoolAddress);

// Configure MockAavePool
const configTx = await mockAavePool.setAssetConfig(
  usdcAddress,
  8000,  // 80% LTV
  8500,  // 85% liquidation threshold
  500,   // 5% supply APY
  1000   // 10% borrow APY
);
await configTx.wait();
console.log("✅ MockAavePool configured");

// Deploy MockMegapot
const MockMegapot = await ethers.getContractFactory("MockMegapot");
const mockMegapot = await MockMegapot.deploy(usdcAddress);
await mockMegapot.waitForDeployment();
const megapotAddress = await mockMegapot.getAddress();
console.log("✅ MockMegapot deployed to:", megapotAddress);

// Deploy MockAerodromeRouter
const MockAerodromeRouter = await ethers.getContractFactory("MockAerodromeRouter");
const mockAerodromeRouter = await MockAerodromeRouter.deploy();
await mockAerodromeRouter.waitForDeployment();
const aerodromeAddress = await mockAerodromeRouter.getAddress();
console.log("✅ MockAerodromeRouter deployed to:", aerodromeAddress);

// บันทึก
deployments.mockAavePool = aavePoolAddress;
deployments.mockMegapot = megapotAddress;
deployments.mockAerodromeRouter = aerodromeAddress;
```

#### Step 7: Deploy Building Adapters

```javascript
// Deploy BankAdapter
const BankAdapter = await ethers.getContractFactory("BankAdapter");
const bankAdapter = await BankAdapter.deploy(
  coreAddress,
  registryAddress,
  aavePoolAddress
);
await bankAdapter.waitForDeployment();
const bankAdapterAddress = await bankAdapter.getAddress();
console.log("✅ BankAdapter deployed to:", bankAdapterAddress);

// Deploy LotteryAdapter
const LotteryAdapter = await ethers.getContractFactory("LotteryAdapter");
const lotteryAdapter = await LotteryAdapter.deploy(
  coreAddress,
  megapotAddress,
  usdcAddress,
  treasuryAddress
);
await lotteryAdapter.waitForDeployment();
const lotteryAdapterAddress = await lotteryAdapter.getAddress();
console.log("✅ LotteryAdapter deployed to:", lotteryAdapterAddress);

// Deploy ShopAdapter
const ShopAdapter = await ethers.getContractFactory("ShopAdapter");
const shopAdapter = await ShopAdapter.deploy(
  coreAddress,
  registryAddress,
  aerodromeAddress
);
await shopAdapter.waitForDeployment();
const shopAdapterAddress = await shopAdapter.getAddress();
console.log("✅ ShopAdapter deployed to:", shopAdapterAddress);

// บันทึก
deployments.bankAdapter = bankAdapterAddress;
deployments.lotteryAdapter = lotteryAdapterAddress;
deployments.shopAdapter = shopAdapterAddress;
```

#### Step 8: Register Adapters in BuildingRegistry

```javascript
// โหลด BuildingRegistry contract
const buildingRegistryContract = await ethers.getContractAt(
  "BuildingRegistry",
  registryAddress
);

// Register BankAdapter
let tx = await buildingRegistryContract.registerAdapter("bank", bankAdapterAddress);
await tx.wait();
console.log("✅ BankAdapter registered");

// Register LotteryAdapter
tx = await buildingRegistryContract.registerAdapter("lottery", lotteryAdapterAddress);
await tx.wait();
console.log("✅ LotteryAdapter registered");

// Register ShopAdapter
tx = await buildingRegistryContract.registerAdapter("shop", shopAdapterAddress);
await tx.wait();
console.log("✅ ShopAdapter registered");

// บันทึก final deployments
fs.writeFileSync(
  'deployments/manual-deployment.json',
  JSON.stringify(deployments, null, 2)
);

console.log("\n🎉 All contracts deployed and configured successfully!");
console.log("\nDeployed addresses:");
console.log(JSON.stringify(deployments, null, 2));
```

### 3.4 Add Supported Assets (Optional)

```javascript
// โหลด DefiCityCore contract
const coreContract = await ethers.getContractAt("DefiCityCore", coreAddress);

// Get ASSET_MANAGER_ROLE
const ASSET_MANAGER_ROLE = await coreContract.ASSET_MANAGER_ROLE();

// Add USDC as supported asset
tx = await coreContract.addSupportedAsset(usdcAddress);
await tx.wait();
console.log("✅ USDC added as supported asset");

// Add WETH as supported asset
tx = await coreContract.addSupportedAsset(wethAddress);
await tx.wait();
console.log("✅ WETH added as supported asset");
```

---

## 4. การตรวจสอบ Deployment / Verification

### 4.1 ตรวจสอบ Contract Addresses

```javascript
// ใน Hardhat console
console.log("\n📋 Deployment Summary:");
console.log("=====================");
console.log("BuildingRegistry:", await buildingRegistry.getAddress());
console.log("DefiCityCore:", await defiCityCore.getAddress());
console.log("WalletFactory:", await walletFactory.getAddress());
console.log("\nMock Tokens:");
console.log("  USDC:", await mockUSDC.getAddress());
console.log("  WETH:", await mockWETH.getAddress());
console.log("  AERO:", await mockAERO.getAddress());
console.log("\nMock Protocols:");
console.log("  AavePool:", await mockAavePool.getAddress());
console.log("  Megapot:", await mockMegapot.getAddress());
console.log("  Aerodrome:", await mockAerodromeRouter.getAddress());
console.log("\nAdapters:");
console.log("  Bank:", await bankAdapter.getAddress());
console.log("  Lottery:", await lotteryAdapter.getAddress());
console.log("  Shop:", await shopAdapter.getAddress());
```

### 4.2 ตรวจสอบ Adapter Registration

```javascript
// ตรวจสอบว่า adapters ถูก register แล้ว
const registeredBank = await buildingRegistry.getAdapter("bank");
const registeredLottery = await buildingRegistry.getAdapter("lottery");
const registeredShop = await buildingRegistry.getAdapter("shop");

console.log("\n📋 Registered Adapters:");
console.log("Bank:", registeredBank);
console.log("Lottery:", registeredLottery);
console.log("Shop:", registeredShop);

// ตรวจสอบสถานะ registration
console.log("\nRegistration Status:");
console.log("Bank:", await buildingRegistry.isBuildingTypeRegistered("bank"));
console.log("Lottery:", await buildingRegistry.isBuildingTypeRegistered("lottery"));
console.log("Shop:", await buildingRegistry.isBuildingTypeRegistered("shop"));
```

### 4.3 ตรวจสอบ Roles

```javascript
// ตรวจสอบ roles ใน BuildingRegistry
const DEFAULT_ADMIN_ROLE = await buildingRegistry.DEFAULT_ADMIN_ROLE();
const ADAPTER_MANAGER_ROLE = await buildingRegistry.ADAPTER_MANAGER_ROLE();
const PAUSER_ROLE = await buildingRegistry.PAUSER_ROLE();

console.log("\n📋 BuildingRegistry Roles:");
console.log("Admin has DEFAULT_ADMIN_ROLE:",
  await buildingRegistry.hasRole(DEFAULT_ADMIN_ROLE, deployer.address));
console.log("Admin has ADAPTER_MANAGER_ROLE:",
  await buildingRegistry.hasRole(ADAPTER_MANAGER_ROLE, deployer.address));
console.log("Admin has PAUSER_ROLE:",
  await buildingRegistry.hasRole(PAUSER_ROLE, deployer.address));

// ตรวจสอบ roles ใน DefiCityCore
console.log("\n📋 DefiCityCore Roles:");
const CORE_PAUSER_ROLE = await coreContract.PAUSER_ROLE();
const ASSET_MANAGER_ROLE = await coreContract.ASSET_MANAGER_ROLE();

console.log("Admin has PAUSER_ROLE:",
  await coreContract.hasRole(CORE_PAUSER_ROLE, deployer.address));
console.log("Admin has ASSET_MANAGER_ROLE:",
  await coreContract.hasRole(ASSET_MANAGER_ROLE, deployer.address));
```

### 4.4 Test Basic Functionality

```javascript
// ทดสอบสร้าง TownHall
const user = deployer; // หรือใช้ address อื่น

const createTx = await coreContract.createTownHall(0, 0);
const receipt = await createTx.wait();

console.log("\n✅ TownHall created successfully!");
console.log("Transaction hash:", receipt.hash);

// ดึงข้อมูล wallet ของ user
const userWallet = await coreContract.getWallet(user.address);
console.log("User SmartWallet:", userWallet);

// ตรวจสอบ building
const buildings = await coreContract.getUserBuildings(user.address);
console.log("User buildings count:", buildings.length);
console.log("First building type:", buildings[0].buildingType);
```

---

## 5. การแก้ไขปัญหา / Troubleshooting

### 5.1 ปัญหา: Gas Estimation Failed

**สาเหตุ:** Contract revert หรือ parameters ไม่ถูกต้อง

**แก้ไข:**
```javascript
// เพิ่ม gas limit manually
const tx = await contract.functionName(params, {
  gasLimit: 5000000
});
```

### 5.2 ปัญหา: Nonce Too Low

**สาเหตุ:** Transaction pending หรือ nonce conflict

**แก้ไข:**
```bash
# Reset account nonce (ใน Hardhat console)
await network.provider.send("hardhat_reset");
```

### 5.3 ปัญหา: Already Registered

**สาเหตุ:** Adapter ถูก register ไปแล้ว

**แก้ไข:**
```javascript
// ใช้ upgradeAdapter แทน registerAdapter
await buildingRegistry.upgradeAdapter("bank", newBankAdapterAddress);
```

### 5.4 ปัญหา: Access Control Error

**สาเหตุ:** Account ไม่มี role ที่จำเป็น

**แก้ไข:**
```javascript
// Grant role ให้กับ account
const ADAPTER_MANAGER_ROLE = await buildingRegistry.ADAPTER_MANAGER_ROLE();
await buildingRegistry.grantRole(ADAPTER_MANAGER_ROLE, accountAddress);
```

### 5.5 ตรวจสอบ Transaction ที่ Failed

```javascript
// ดูรายละเอียด transaction
const tx = await provider.getTransaction(txHash);
const receipt = await provider.getTransactionReceipt(txHash);

console.log("Transaction:", tx);
console.log("Receipt:", receipt);

// ลอง call แบบ static เพื่อดู error
try {
  await contract.callStatic.functionName(params);
} catch (error) {
  console.log("Error reason:", error.reason);
}
```

---

## 6. การ Verify Contracts บน Block Explorer

Contract verification ช่วยให้ผู้ใช้สามารถตรวจสอบ source code และโต้ตอบกับ contract ได้ผ่าน block explorer

**ดูคู่มือการ verify แบบละเอียด:** [CONTRACT_VERIFICATION_GUIDE.md](./CONTRACT_VERIFICATION_GUIDE.md)

### 6.1 Pre-Verification Checklist

ก่อนเริ่ม verify ตรวจสอบว่า:

- [ ] Deployment สำเร็จแล้ว (ทั้ง 12 contracts)
- [ ] มี addresses ของ contracts ทั้งหมด
- [ ] `BASESCAN_API_KEY` ตั้งค่าใน `.env` แล้ว
- [ ] Compiler version ตรงกับที่ใช้ deploy (0.8.20)

**ขอ API Key:** https://basescan.org/myapikey

---

### 6.2 Verify แบบอัตโนมัติ (แนะนำ)

#### วิธีที่ 1: Hardhat Ignition (Auto-Verify)

Hardhat Ignition จะ verify contracts อัตโนมัติหลัง deploy:

```bash
npm run deploy:core:baseSepolia
npm run deploy:integration:baseSepolia
```

Contracts จะถูก verify พร้อมกับ deployment โดยอัตโนมัติ

#### วิธีที่ 2: Verification Script

หลัง deploy เสร็จแล้ว รัน verification script:

```bash
# Verify ทั้ง 12 contracts พร้อมกัน
npm run verify:baseSepolia
```

**Output ตัวอย่าง:**
```
═══════════════════════════════════════════════════
  DefiCity Contract Verification
═══════════════════════════════════════════════════

Network: baseSepolia

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CORE CONTRACTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Verifying BuildingRegistry...
✅ BuildingRegistry verified successfully!

🔍 Verifying DefiCityCore...
✅ DefiCityCore verified successfully!

🔍 Verifying WalletFactory...
✅ WalletFactory verified successfully!

...

═══════════════════════════════════════════════════
  VERIFICATION SUMMARY
═══════════════════════════════════════════════════
Total Contracts:    12
✅ Verified:        12
❌ Failed:          0
📊 Success Rate:    100.0%
═══════════════════════════════════════════════════

🎉 All contracts verified successfully!
```

---

### 6.3 Verify แบบ Manual (ทีละ Contract)

หากต้องการ verify เฉพาะ contract หรือ automated verification ล้มเหลว

#### 6.3.1 Core Contracts (3 contracts)

**1. BuildingRegistry**

```bash
npx hardhat verify --network baseSepolia <REGISTRY_ADDRESS>
```

**Constructor args:** ไม่มี

---

**2. DefiCityCore**

```bash
npx hardhat verify --network baseSepolia <CORE_ADDRESS> \
  "<TREASURY_ADDRESS>"
```

**Constructor args:**
- `_treasury`: Treasury wallet address

**ตัวอย่าง:**
```bash
npx hardhat verify --network baseSepolia \
  0x1234567890123456789012345678901234567890 \
  "0x9876543210987654321098765432109876543210"
```

---

**3. WalletFactory**

```bash
npx hardhat verify --network baseSepolia <FACTORY_ADDRESS> \
  "<ENTRYPOINT_ADDRESS>" "<CORE_ADDRESS>"
```

**Constructor args:**
- `_entryPoint`: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789 (EntryPoint v0.6)
- `_core`: DefiCityCore address

**ตัวอย่าง:**
```bash
npx hardhat verify --network baseSepolia \
  0x2345678901234567890123456789012345678901 \
  "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" \
  "0x1234567890123456789012345678901234567890"
```

---

#### 6.3.2 Mock Tokens (3 contracts)

**4. Mock USDC**

```bash
npx hardhat verify --network baseSepolia <USDC_ADDRESS> \
  "Mock USDC" "USDC" 6
```

**Constructor args:** name, symbol, decimals

---

**5. Mock WETH**

```bash
npx hardhat verify --network baseSepolia <WETH_ADDRESS> \
  "Mock WETH" "WETH" 18
```

---

**6. Mock AERO**

```bash
npx hardhat verify --network baseSepolia <AERO_ADDRESS> \
  "Mock AERO" "AERO" 18
```

---

#### 6.3.3 Mock Protocols (3 contracts)

**7. MockAavePool**

```bash
npx hardhat verify --network baseSepolia <AAVE_POOL_ADDRESS>
```

**Constructor args:** ไม่มี

---

**8. MockMegapot**

```bash
npx hardhat verify --network baseSepolia <MEGAPOT_ADDRESS> \
  "<USDC_ADDRESS>"
```

**Constructor args:**
- `_usdcToken`: Mock USDC address

---

**9. MockAerodromeRouter**

```bash
npx hardhat verify --network baseSepolia <AERODROME_ADDRESS>
```

**Constructor args:** ไม่มี

---

#### 6.3.4 Building Adapters (3 contracts)

**10. BankAdapter**

```bash
npx hardhat verify --network baseSepolia <BANK_ADAPTER_ADDRESS> \
  "<CORE_ADDRESS>" "<REGISTRY_ADDRESS>" "<AAVE_POOL_ADDRESS>"
```

**Constructor args:**
- `_core`: DefiCityCore address
- `_registry`: BuildingRegistry address
- `_aavePool`: MockAavePool address

**ตัวอย่าง:**
```bash
npx hardhat verify --network baseSepolia \
  0x3456789012345678901234567890123456789012 \
  "0x1234567890123456789012345678901234567890" \
  "0x2345678901234567890123456789012345678901" \
  "0x4567890123456789012345678901234567890123"
```

---

**11. LotteryAdapter**

```bash
npx hardhat verify --network baseSepolia <LOTTERY_ADAPTER_ADDRESS> \
  "<CORE_ADDRESS>" "<MEGAPOT_ADDRESS>" "<USDC_ADDRESS>" "<TREASURY_ADDRESS>"
```

**Constructor args:**
- `_core`: DefiCityCore address
- `_megapot`: MockMegapot address
- `_usdcToken`: Mock USDC address
- `_treasury`: Treasury address

---

**12. ShopAdapter**

```bash
npx hardhat verify --network baseSepolia <SHOP_ADAPTER_ADDRESS> \
  "<CORE_ADDRESS>" "<REGISTRY_ADDRESS>" "<AERODROME_ADDRESS>"
```

**Constructor args:**
- `_core`: DefiCityCore address
- `_registry`: BuildingRegistry address
- `_aerodromeRouter`: MockAerodromeRouter address

---

### 6.4 ตรวจสอบว่า Verify สำเร็จ

เข้าไปดูที่ Base Sepolia Explorer:

```
https://sepolia.basescan.org/address/<CONTRACT_ADDRESS>
```

ถ้า verify สำเร็จจะเห็น:
- ✅ "Contract Source Code Verified"
- Tab "Contract" มี source code
- Tab "Read Contract" และ "Write Contract" ใช้งานได้

---

### 6.5 Troubleshooting Verification Issues

#### ❌ "Already Verified"

**ความหมาย:** Contract ถูก verify ไปแล้ว

**แก้ไข:** ไม่ต้องทำอะไร - contract verified แล้ว

---

#### ❌ "Invalid API Key"

**สาเหตุ:** `BASESCAN_API_KEY` ไม่ถูกต้อง

**แก้ไข:**
```bash
# ตรวจสอบ .env
cat .env | grep BASESCAN_API_KEY

# ขอ API key ใหม่ที่ https://basescan.org/myapikey
```

---

#### ❌ "Compiler version mismatch"

**สาเหตุ:** Compiler version ไม่ตรงกัน

**แก้ไข:**
```bash
# ตรวจสอบว่าใช้ Solidity 0.8.20
cat hardhat.config.ts | grep "solidity:"

# Re-compile
npm run clean
npm run compile
```

---

#### ❌ "Constructor arguments mismatch"

**สาเหตุ:** Constructor arguments ไม่ถูกต้อง

**แก้ไข:** สร้างไฟล์ arguments

```javascript
// arguments.js
module.exports = [
  "0x1234567890123456789012345678901234567890", // arg1
  "0x2345678901234567890123456789012345678901", // arg2
];
```

```bash
npx hardhat verify --network baseSepolia \
  --constructor-args arguments.js \
  <CONTRACT_ADDRESS>
```

---

#### ❌ "Timeout error"

**สาเหตุ:** Network ช้าหรือ API ไม่ตอบสนอง

**แก้ไข:** รอสักครู่แล้วลองใหม่

```bash
# ลองอีกครั้ง
npx hardhat verify --network baseSepolia <ADDRESS> <ARGS>
```

---

### 6.6 Constructor Arguments Reference

สรุป constructor arguments สำหรับ verify:

| Contract | Args | Example |
|----------|------|---------|
| BuildingRegistry | - | ไม่มี args |
| DefiCityCore | treasury | "0x..." |
| WalletFactory | entryPoint, core | "0x5FF...", "0x..." |
| MockUSDC | name, symbol, decimals | "Mock USDC", "USDC", 6 |
| MockWETH | name, symbol, decimals | "Mock WETH", "WETH", 18 |
| MockAERO | name, symbol, decimals | "Mock AERO", "AERO", 18 |
| MockAavePool | - | ไม่มี args |
| MockMegapot | usdcToken | "0x..." |
| MockAerodromeRouter | - | ไม่มี args |
| BankAdapter | core, registry, aavePool | "0x...", "0x...", "0x..." |
| LotteryAdapter | core, megapot, usdc, treasury | "0x...", "0x...", "0x...", "0x..." |
| ShopAdapter | core, registry, aerodrome | "0x...", "0x...", "0x..." |

---

### 6.7 Verification Checklist

หลัง verify เสร็จให้ตรวจสอบ:

**Core Contracts:**
- [ ] BuildingRegistry verified
- [ ] DefiCityCore verified
- [ ] WalletFactory verified

**Mock Tokens:**
- [ ] Mock USDC verified
- [ ] Mock WETH verified
- [ ] Mock AERO verified

**Mock Protocols:**
- [ ] MockAavePool verified
- [ ] MockMegapot verified
- [ ] MockAerodromeRouter verified

**Building Adapters:**
- [ ] BankAdapter verified
- [ ] LotteryAdapter verified
- [ ] ShopAdapter verified

**Status:**
```
✅ Verified: ___ / 12
❌ Failed: ___ / 12
📊 Success Rate: ____%
```

---

## 7. Next Steps หลัง Deploy สำเร็จ

### 7.1 บันทึก Deployment Addresses

สร้างไฟล์ `deployments/<network>-deployment.json`:

```json
{
  "network": "baseSepolia",
  "deployedAt": "2024-01-27T10:30:00Z",
  "contracts": {
    "buildingRegistry": "0x...",
    "defiCityCore": "0x...",
    "walletFactory": "0x...",
    "mockUSDC": "0x...",
    "mockWETH": "0x...",
    "mockAERO": "0x...",
    "mockAavePool": "0x...",
    "mockMegapot": "0x...",
    "mockAerodromeRouter": "0x...",
    "bankAdapter": "0x...",
    "lotteryAdapter": "0x...",
    "shopAdapter": "0x..."
  }
}
```

### 7.2 อัพเดท Frontend Config

อัพเดท contract addresses ใน frontend configuration

### 7.3 Run Integration Tests

```bash
# Run tests against deployed contracts
npm run test:integration
```

### 7.4 Setup Monitoring

- ติดตาม events จาก contracts
- ตั้งค่า alerts สำหรับ transactions
- Monitor gas usage

---

## 8. สรุปคำสั่งที่ใช้บ่อย / Quick Reference

```bash
# Compile
npm run compile

# Test
npm run test

# Deploy Core (Local)
npm run node                      # Terminal 1
npm run deploy:core:local         # Terminal 2

# Deploy Integration (Local)
npm run deploy:integration:local

# Deploy to Base Sepolia
npm run deploy:core:baseSepolia
npm run deploy:integration:baseSepolia

# Hardhat Console
npx hardhat console --network localhost
npx hardhat console --network baseSepolia

# Verify Contract
npx hardhat verify --network baseSepolia <ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## 9. Important Notes / ข้อควรระวัง

⚠️ **Security:**
- ห้าม commit file `.env` เด็ดขาด
- Private key ต้องเก็บเป็นความลับ
- ใช้ hardware wallet สำหรับ mainnet deployment

⚠️ **Gas Fees:**
- ตรวจสอบ gas price ก่อน deploy
- เตรียม ETH เพียงพอสำหรับ gas (ประมาณ 0.1-0.3 ETH บน testnet)

⚠️ **Testing:**
- Test บน local network ก่อนเสมอ
- Run integration tests หลัง deploy
- ตรวจสอบ functionality ทุกอย่างก่อน mainnet

⚠️ **Access Control:**
- ตรวจสอบว่า roles ถูกต้อง
- มี admin wallet สำรอง
- วางแผนการจัดการ roles ล่วงหน้า

---

## 10. Support & Resources

- **Documentation:** [Project README](../README.md)
- **Issues:** [GitHub Issues](https://github.com/BrookerGroup/deficity/issues)
- **Hardhat Docs:** https://hardhat.org/docs
- **OpenZeppelin Docs:** https://docs.openzeppelin.com/

---

**Last Updated:** 2024-01-27
**Version:** 1.0.0
