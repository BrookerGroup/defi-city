# 🔍 Contract Verification Guide - คู่มือการ Verify Contracts

## สารบัญ

1. [การ Verify แบบอัตโนมัติ](#1-automated-verification)
2. [การ Verify แบบ Manual](#2-manual-verification)
3. [Verify แต่ละ Contract](#3-contract-by-contract-verification)
4. [การแก้ไขปัญหา](#4-troubleshooting)
5. [Verification Script](#5-verification-script)

---

## 1. Automated Verification

### 1.1 Hardhat Ignition (แนะนำ)

Hardhat Ignition จะ verify contracts อัตโนมัติหลัง deploy:

```bash
# Deploy และ verify พร้อมกัน
npm run deploy:core:baseSepolia
npm run deploy:integration:baseSepolia
```

### 1.2 ตรวจสอบว่า Verify สำเร็จหรือไม่

ไปที่ Base Sepolia Explorer: https://sepolia.basescan.org/address/<CONTRACT_ADDRESS>

ถ้า verify สำเร็จจะเห็น:
- ✅ "Contract Source Code Verified"
- Tab "Contract" จะมี source code
- Tab "Read Contract" และ "Write Contract" ใช้งานได้

---

## 2. Manual Verification

### 2.1 Setup API Key

ตรวจสอบ `.env`:
```env
BASESCAN_API_KEY=your_basescan_api_key_here
```

ขอ API key ได้ที่: https://basescan.org/myapikey

### 2.2 คำสั่ง Verify พื้นฐาน

```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

### 2.3 Verify พร้อม Constructor Arguments

```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> \
  "<ARG1>" "<ARG2>" "<ARG3>"
```

---

## 3. Contract-by-Contract Verification

### 3.1 Core Contracts

#### BuildingRegistry

```bash
npx hardhat verify --network baseSepolia <REGISTRY_ADDRESS>
```

**Constructor args:** ไม่มี

**Example:**
```bash
npx hardhat verify --network baseSepolia \
  0x1234567890123456789012345678901234567890
```

#### DefiCityCore

```bash
npx hardhat verify --network baseSepolia <CORE_ADDRESS> \
  "<TREASURY_ADDRESS>"
```

**Constructor args:**
- `_treasury`: Treasury wallet address

**Example:**
```bash
npx hardhat verify --network baseSepolia \
  0x2345678901234567890123456789012345678901 \
  "0x9876543210987654321098765432109876543210"
```

#### WalletFactory

```bash
npx hardhat verify --network baseSepolia <FACTORY_ADDRESS> \
  "<ENTRYPOINT_ADDRESS>" "<CORE_ADDRESS>"
```

**Constructor args:**
- `_entryPoint`: EntryPoint v0.6 address (0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
- `_core`: DefiCityCore address

**Example:**
```bash
npx hardhat verify --network baseSepolia \
  0x3456789012345678901234567890123456789012 \
  "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" \
  "0x2345678901234567890123456789012345678901"
```

### 3.2 Mock Tokens

#### Mock USDC

```bash
npx hardhat verify --network baseSepolia <USDC_ADDRESS> \
  "Mock USDC" "USDC" 6
```

**Constructor args:**
- `name`: "Mock USDC"
- `symbol`: "USDC"
- `decimals`: 6

#### Mock WETH

```bash
npx hardhat verify --network baseSepolia <WETH_ADDRESS> \
  "Mock WETH" "WETH" 18
```

**Constructor args:**
- `name`: "Mock WETH"
- `symbol`: "WETH"
- `decimals`: 18

#### Mock AERO

```bash
npx hardhat verify --network baseSepolia <AERO_ADDRESS> \
  "Mock AERO" "AERO" 18
```

**Constructor args:**
- `name`: "Mock AERO"
- `symbol`: "AERO"
- `decimals`: 18

### 3.3 Mock Protocols

#### MockAavePool

```bash
npx hardhat verify --network baseSepolia <AAVE_POOL_ADDRESS>
```

**Constructor args:** ไม่มี

#### MockMegapot

```bash
npx hardhat verify --network baseSepolia <MEGAPOT_ADDRESS> \
  "<USDC_ADDRESS>"
```

**Constructor args:**
- `_usdcToken`: Mock USDC address

**Example:**
```bash
npx hardhat verify --network baseSepolia \
  0x4567890123456789012345678901234567890123 \
  "0x5678901234567890123456789012345678901234"
```

#### MockAerodromeRouter

```bash
npx hardhat verify --network baseSepolia <AERODROME_ADDRESS>
```

**Constructor args:** ไม่มี

### 3.4 Building Adapters

#### BankAdapter

```bash
npx hardhat verify --network baseSepolia <BANK_ADAPTER_ADDRESS> \
  "<CORE_ADDRESS>" "<REGISTRY_ADDRESS>" "<AAVE_POOL_ADDRESS>"
```

**Constructor args:**
- `_core`: DefiCityCore address
- `_registry`: BuildingRegistry address
- `_aavePool`: MockAavePool address

**Example:**
```bash
npx hardhat verify --network baseSepolia \
  0x6789012345678901234567890123456789012345 \
  "0x2345678901234567890123456789012345678901" \
  "0x1234567890123456789012345678901234567890" \
  "0x4567890123456789012345678901234567890123"
```

#### LotteryAdapter

```bash
npx hardhat verify --network baseSepolia <LOTTERY_ADAPTER_ADDRESS> \
  "<CORE_ADDRESS>" "<MEGAPOT_ADDRESS>" "<USDC_ADDRESS>" "<TREASURY_ADDRESS>"
```

**Constructor args:**
- `_core`: DefiCityCore address
- `_megapot`: MockMegapot address
- `_usdcToken`: Mock USDC address
- `_treasury`: Treasury address

**Example:**
```bash
npx hardhat verify --network baseSepolia \
  0x7890123456789012345678901234567890123456 \
  "0x2345678901234567890123456789012345678901" \
  "0x4567890123456789012345678901234567890123" \
  "0x5678901234567890123456789012345678901234" \
  "0x9876543210987654321098765432109876543210"
```

#### ShopAdapter

```bash
npx hardhat verify --network baseSepolia <SHOP_ADAPTER_ADDRESS> \
  "<CORE_ADDRESS>" "<REGISTRY_ADDRESS>" "<AERODROME_ADDRESS>"
```

**Constructor args:**
- `_core`: DefiCityCore address
- `_registry`: BuildingRegistry address
- `_aerodromeRouter`: MockAerodromeRouter address

**Example:**
```bash
npx hardhat verify --network baseSepolia \
  0x8901234567890123456789012345678901234567 \
  "0x2345678901234567890123456789012345678901" \
  "0x1234567890123456789012345678901234567890" \
  "0x3456789012345678901234567890123456789012"
```

---

## 4. Troubleshooting

### 4.1 ❌ "Already Verified"

**สาเหตุ:** Contract ถูก verify ไปแล้ว

**แก้ไข:**
```bash
# ไม่ต้องทำอะไร contract verified แล้ว
# ตรวจสอบที่ basescan.org
```

### 4.2 ❌ "Invalid API Key"

**สาเหตุ:** BASESCAN_API_KEY ไม่ถูกต้องหรือไม่ได้ตั้งค่า

**แก้ไข:**
```bash
# ตรวจสอบ .env
cat .env | grep BASESCAN_API_KEY

# ขอ API key ใหม่ที่ https://basescan.org/myapikey
```

### 4.3 ❌ "Contract source code already verified"

**สาเหตุ:** Bytecode เหมือนกับ contract ที่ verify ไปแล้ว

**แก้ไข:**
```bash
# ถ้า contract เหมือนกันจริง ไม่ต้อง verify ซ้ำ
# ถ้าต้องการ verify ใหม่ ต้อง deploy contract ใหม่
```

### 4.4 ❌ "Compiler version mismatch"

**สาเหตุ:** Hardhat compiler version ไม่ตรงกับที่ใช้ deploy

**แก้ไข:**
```bash
# ตรวจสอบ hardhat.config.ts
cat hardhat.config.ts | grep "solidity:"

# ต้องเป็น "0.8.20" ตรงกับ contracts
```

### 4.5 ❌ "Constructor arguments mismatch"

**สาเหตุ:** Constructor arguments ไม่ถูกต้อง

**แก้ไข:**
```bash
# วิธีที่ 1: ใช้ arguments file
echo "module.exports = ['0x...', '0x...'];" > arguments.js
npx hardhat verify --network baseSepolia \
  --constructor-args arguments.js \
  <CONTRACT_ADDRESS>

# วิธีที่ 2: ตรวจสอบ deployment transaction
# ดูที่ basescan.org -> Input Data
```

### 4.6 ❌ "Compilation error"

**สาเหตุ:** Hardhat ไม่สามารถ compile contract ได้

**แก้ไข:**
```bash
# Clean และ compile ใหม่
npm run clean
npm run compile

# ลอง verify อีกครั้ง
npx hardhat verify --network baseSepolia <ADDRESS> <ARGS>
```

### 4.7 ❌ "Timeout error"

**สาเหตุ:** Network ช้าหรือ Basescan API ไม่ตอบสนอง

**แก้ไข:**
```bash
# รอสักครู่แล้วลองใหม่
# หรือเพิ่ม retry
npx hardhat verify --network baseSepolia <ADDRESS> <ARGS>
```

---

## 5. Verification Script

### 5.1 สร้าง Verification Script

สร้างไฟล์ `scripts/verify-contracts.ts`:

```typescript
import hre from "hardhat";
import * as fs from "fs";

async function main() {
  // โหลด deployment addresses
  const deploymentPath = "./deployments/baseSepolia-deployment.json";
  if (!fs.existsSync(deploymentPath)) {
    console.error("Deployment file not found!");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  console.log("🔍 Starting contract verification...\n");

  // EntryPoint address
  const entryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  // 1. BuildingRegistry
  console.log("1. Verifying BuildingRegistry...");
  try {
    await hre.run("verify:verify", {
      address: deployment.buildingRegistry,
      constructorArguments: [],
    });
    console.log("✅ BuildingRegistry verified\n");
  } catch (error: any) {
    console.log("⚠️  BuildingRegistry:", error.message, "\n");
  }

  // 2. DefiCityCore
  console.log("2. Verifying DefiCityCore...");
  try {
    await hre.run("verify:verify", {
      address: deployment.defiCityCore,
      constructorArguments: [deployment.treasury],
    });
    console.log("✅ DefiCityCore verified\n");
  } catch (error: any) {
    console.log("⚠️  DefiCityCore:", error.message, "\n");
  }

  // 3. WalletFactory
  console.log("3. Verifying WalletFactory...");
  try {
    await hre.run("verify:verify", {
      address: deployment.walletFactory,
      constructorArguments: [entryPoint, deployment.defiCityCore],
    });
    console.log("✅ WalletFactory verified\n");
  } catch (error: any) {
    console.log("⚠️  WalletFactory:", error.message, "\n");
  }

  // 4. Mock USDC
  console.log("4. Verifying Mock USDC...");
  try {
    await hre.run("verify:verify", {
      address: deployment.mockUSDC,
      constructorArguments: ["Mock USDC", "USDC", 6],
    });
    console.log("✅ Mock USDC verified\n");
  } catch (error: any) {
    console.log("⚠️  Mock USDC:", error.message, "\n");
  }

  // 5. Mock WETH
  console.log("5. Verifying Mock WETH...");
  try {
    await hre.run("verify:verify", {
      address: deployment.mockWETH,
      constructorArguments: ["Mock WETH", "WETH", 18],
    });
    console.log("✅ Mock WETH verified\n");
  } catch (error: any) {
    console.log("⚠️  Mock WETH:", error.message, "\n");
  }

  // 6. Mock AERO
  console.log("6. Verifying Mock AERO...");
  try {
    await hre.run("verify:verify", {
      address: deployment.mockAERO,
      constructorArguments: ["Mock AERO", "AERO", 18],
    });
    console.log("✅ Mock AERO verified\n");
  } catch (error: any) {
    console.log("⚠️  Mock AERO:", error.message, "\n");
  }

  // 7. MockAavePool
  console.log("7. Verifying MockAavePool...");
  try {
    await hre.run("verify:verify", {
      address: deployment.mockAavePool,
      constructorArguments: [],
    });
    console.log("✅ MockAavePool verified\n");
  } catch (error: any) {
    console.log("⚠️  MockAavePool:", error.message, "\n");
  }

  // 8. MockMegapot
  console.log("8. Verifying MockMegapot...");
  try {
    await hre.run("verify:verify", {
      address: deployment.mockMegapot,
      constructorArguments: [deployment.mockUSDC],
    });
    console.log("✅ MockMegapot verified\n");
  } catch (error: any) {
    console.log("⚠️  MockMegapot:", error.message, "\n");
  }

  // 9. MockAerodromeRouter
  console.log("9. Verifying MockAerodromeRouter...");
  try {
    await hre.run("verify:verify", {
      address: deployment.mockAerodromeRouter,
      constructorArguments: [],
    });
    console.log("✅ MockAerodromeRouter verified\n");
  } catch (error: any) {
    console.log("⚠️  MockAerodromeRouter:", error.message, "\n");
  }

  // 10. BankAdapter
  console.log("10. Verifying BankAdapter...");
  try {
    await hre.run("verify:verify", {
      address: deployment.bankAdapter,
      constructorArguments: [
        deployment.defiCityCore,
        deployment.buildingRegistry,
        deployment.mockAavePool,
      ],
    });
    console.log("✅ BankAdapter verified\n");
  } catch (error: any) {
    console.log("⚠️  BankAdapter:", error.message, "\n");
  }

  // 11. LotteryAdapter
  console.log("11. Verifying LotteryAdapter...");
  try {
    await hre.run("verify:verify", {
      address: deployment.lotteryAdapter,
      constructorArguments: [
        deployment.defiCityCore,
        deployment.mockMegapot,
        deployment.mockUSDC,
        deployment.treasury,
      ],
    });
    console.log("✅ LotteryAdapter verified\n");
  } catch (error: any) {
    console.log("⚠️  LotteryAdapter:", error.message, "\n");
  }

  // 12. ShopAdapter
  console.log("12. Verifying ShopAdapter...");
  try {
    await hre.run("verify:verify", {
      address: deployment.shopAdapter,
      constructorArguments: [
        deployment.defiCityCore,
        deployment.buildingRegistry,
        deployment.mockAerodromeRouter,
      ],
    });
    console.log("✅ ShopAdapter verified\n");
  } catch (error: any) {
    console.log("⚠️  ShopAdapter:", error.message, "\n");
  }

  console.log("🎉 Verification process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 5.2 เพิ่ม Script ใน package.json

```json
{
  "scripts": {
    "verify:baseSepolia": "hardhat run scripts/verify-contracts.ts --network baseSepolia"
  }
}
```

### 5.3 รัน Verification Script

```bash
npm run verify:baseSepolia
```

---

## 6. Verification Checklist

### Pre-Verification
- [ ] Deployment สำเร็จแล้ว
- [ ] มี addresses ของ contracts ทั้งหมด
- [ ] BASESCAN_API_KEY ตั้งค่าแล้ว
- [ ] Compiler version ตรงกับที่ใช้ deploy (0.8.20)

### Core Contracts
- [ ] BuildingRegistry verified
- [ ] DefiCityCore verified
- [ ] WalletFactory verified

### Mock Tokens
- [ ] Mock USDC verified
- [ ] Mock WETH verified
- [ ] Mock AERO verified

### Mock Protocols
- [ ] MockAavePool verified
- [ ] MockMegapot verified
- [ ] MockAerodromeRouter verified

### Building Adapters
- [ ] BankAdapter verified
- [ ] LotteryAdapter verified
- [ ] ShopAdapter verified

### Verification Status
```
Total Contracts: 12
Verified: ___ / 12
Failed: ___ / 12
Already Verified: ___ / 12
```

---

## 7. Quick Reference

### Constructor Arguments Summary

| Contract | Args Count | Arguments |
|----------|-----------|-----------|
| BuildingRegistry | 0 | - |
| DefiCityCore | 1 | treasury |
| WalletFactory | 2 | entryPoint, core |
| MockUSDC | 3 | "Mock USDC", "USDC", 6 |
| MockWETH | 3 | "Mock WETH", "WETH", 18 |
| MockAERO | 3 | "Mock AERO", "AERO", 18 |
| MockAavePool | 0 | - |
| MockMegapot | 1 | usdcAddress |
| MockAerodromeRouter | 0 | - |
| BankAdapter | 3 | core, registry, aavePool |
| LotteryAdapter | 4 | core, megapot, usdc, treasury |
| ShopAdapter | 3 | core, registry, aerodrome |

### Network Info
```
Network: Base Sepolia
Chain ID: 84532
Explorer: https://sepolia.basescan.org
API Endpoint: https://api-sepolia.basescan.org/api
```

### Useful Links
- API Key: https://basescan.org/myapikey
- Verify UI: https://sepolia.basescan.org/verifyContract
- Hardhat Verify: https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify

---

**Last Updated:** 2024-01-27
**Version:** 1.0.0
