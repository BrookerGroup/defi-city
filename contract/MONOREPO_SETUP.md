# 🏗️ DeFi City Monorepo Setup Guide

คู่มือสำหรับรวม Smart Contracts และ Frontend ไว้ใน Monorepo เดียวกัน

---

## 📋 Table of Contents

1. [โครงสร้าง Monorepo ที่แนะนำ](#1-โครงสร้าง-monorepo-ที่แนะนำ)
2. [ขั้นตอนการ Setup](#2-ขั้นตอนการ-setup)
3. [Configuration Files](#3-configuration-files)
4. [Scripts และ Commands](#4-scripts-และ-commands)
5. [การใช้งาน](#5-การใช้งาน)
6. [การ Deploy](#6-การ-deploy)
7. [Best Practices](#7-best-practices)

---

## 1. โครงสร้าง Monorepo ที่แนะนำ

### Option 1: แบบง่าย (แนะนำสำหรับเริ่มต้น)

```
defi-city/
├── contracts/                  # Smart Contracts (ไม่เปลี่ยน)
│   ├── SimpleSmartWallet.sol
│   ├── SimpleWalletFactory.sol
│   └── ...
│
├── frontend/                   # 🆕 Frontend code
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
│
├── scripts/                    # Deployment scripts
│   ├── deploy.js
│   └── test-deployed.js
│
├── test/                       # Contract tests
│   └── SimpleWallet.test.js
│
├── deployments/                # Deployment records
│   └── sepolia.json
│
├── shared/                     # 🆕 Shared code
│   ├── abis/                   # Contract ABIs
│   ├── addresses.ts            # Contract addresses
│   └── types.ts                # Shared types
│
├── package.json                # Root package.json (workspace)
├── hardhat.config.js
├── README.md
├── TUTORIAL.md
└── .gitignore
```

**ข้อดี:**
- ✅ เรียบง่าย ไม่ซับซ้อน
- ✅ Setup ง่าย
- ✅ เหมาะกับโปรเจคเล็ก-กลาง

**ข้อเสีย:**
- ❌ ยาก scale เมื่อโปรเจคใหญ่ขึ้น

---

### Option 2: Monorepo แบบมาตรฐาน (แนะนำสำหรับโปรเจคใหญ่)

```
defi-city/
├── apps/
│   └── web/                    # Frontend app
│       ├── app/
│       ├── components/
│       ├── public/
│       ├── package.json
│       └── next.config.js
│
├── packages/
│   ├── contracts/              # Smart contracts package
│   │   ├── contracts/
│   │   │   ├── SimpleSmartWallet.sol
│   │   │   └── SimpleWalletFactory.sol
│   │   ├── scripts/
│   │   ├── test/
│   │   ├── hardhat.config.js
│   │   └── package.json
│   │
│   ├── shared/                 # Shared utilities
│   │   ├── src/
│   │   │   ├── abis/
│   │   │   ├── addresses.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/                     # Shared UI components (optional)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                       # Documentation
│   ├── TUTORIAL.md
│   ├── ERC4337_GUIDE.md
│   └── FRONTEND_PROMPT.md
│
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # pnpm workspace config
├── turbo.json                  # Turborepo config (optional)
└── README.md
```

**ข้อดี:**
- ✅ Scalable
- ✅ ชัดเจน แยก concerns ดี
- ✅ แชร์ code ง่าย
- ✅ Build และ cache ได้ดีกว่า

**ข้อเสีย:**
- ❌ Setup ซับซ้อนกว่า
- ❌ ต้องใช้เครื่องมือเพิ่ม

---

## 2. ขั้นตอนการ Setup

### Step 1: เลือกโครงสร้าง

ผมแนะนำให้เริ่มด้วย **Option 1 (แบบง่าย)** ก่อน แล้วค่อย migrate เป็น Option 2 ภายหลัง

### Step 2: Setup Workspace

#### 2.1 ใช้ npm workspaces

```bash
# 1. อยู่ที่ root ของ defi-city
cd /path/to/defi-city

# 2. สร้างโฟลเดอร์ frontend
mkdir frontend
mkdir shared

# 3. แก้ไข root package.json
```

**root package.json:**
```json
{
  "name": "defi-city",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "shared"
  ],
  "scripts": {
    "dev": "npm run dev --workspace=frontend",
    "build": "npm run build --workspace=frontend",
    "contracts:compile": "npx hardhat compile",
    "contracts:test": "npx hardhat test",
    "contracts:deploy": "npx hardhat run scripts/deploy.js",
    "postinstall": "npm run contracts:compile"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "hardhat": "^2.19.4"
  }
}
```

#### 2.2 Setup Frontend

```bash
# ใน frontend/
cd frontend

# สร้าง Next.js app
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# ติดตั้ง dependencies
npm install wagmi viem @tanstack/react-query
npm install @privy-io/react-auth
npm install zustand
npm install pixi.js
```

**frontend/package.json:**
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "wagmi": "^2.5.0",
    "viem": "^2.7.0",
    "@tanstack/react-query": "^5.20.0",
    "@privy-io/react-auth": "^1.0.0",
    "zustand": "^4.5.0",
    "pixi.js": "^8.0.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.0"
  }
}
```

#### 2.3 Setup Shared Package

```bash
cd shared
npm init -y
```

**shared/package.json:**
```json
{
  "name": "shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

**shared/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3: สร้าง Shared Code

#### 3.1 Export ABIs

```bash
# Script สำหรับ copy ABIs
```

**scripts/export-abis.js:**
```javascript
const fs = require('fs')
const path = require('path')

const artifactsPath = path.join(__dirname, '../artifacts/contracts')
const outputPath = path.join(__dirname, '../shared/src/abis')

// สร้างโฟลเดอร์ถ้ายังไม่มี
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true })
}

// Export SimpleWalletFactory ABI
const factoryArtifact = require('../artifacts/contracts/SimpleWalletFactory.sol/SimpleWalletFactory.json')
fs.writeFileSync(
  path.join(outputPath, 'SimpleWalletFactory.ts'),
  `export const SimpleWalletFactoryABI = ${JSON.stringify(factoryArtifact.abi, null, 2)} as const`
)

// Export SimpleSmartWallet ABI
const walletArtifact = require('../artifacts/contracts/SimpleSmartWallet.sol/SimpleSmartWallet.json')
fs.writeFileSync(
  path.join(outputPath, 'SimpleSmartWallet.ts'),
  `export const SimpleSmartWalletABI = ${JSON.stringify(walletArtifact.abi, null, 2)} as const`
)

console.log('✅ ABIs exported to shared/src/abis/')
```

เพิ่ม script ใน root package.json:
```json
{
  "scripts": {
    "export-abis": "node scripts/export-abis.js",
    "postinstall": "npm run contracts:compile && npm run export-abis"
  }
}
```

#### 3.2 Contract Addresses

**shared/src/addresses.ts:**
```typescript
export const contracts = {
  sepolia: {
    factory: '0x0899fDF0Dfe72751925901e72DB41A0aDB18be47' as `0x${string}`,
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as `0x${string}`,
  },
  // เพิ่ม networks อื่นๆ
} as const

export type Network = keyof typeof contracts

export function getContractAddress(
  network: Network,
  contract: 'factory' | 'entryPoint'
): `0x${string}` {
  return contracts[network][contract]
}
```

#### 3.3 Shared Types

**shared/src/types.ts:**
```typescript
export interface Building {
  id: string
  type: 'town-hall' | 'yield-farm' | 'lp-mine' | 'staking-camp'
  position: { x: number; y: number }
  deposited?: string
  apy?: number
}

export interface GameState {
  buildings: Building[]
  resources: {
    usdc: string
    eth: string
    points: number
  }
}

export interface WalletInfo {
  address: `0x${string}`
  balance: bigint
  isDeployed: boolean
}
```

#### 3.4 Index file

**shared/src/index.ts:**
```typescript
export * from './abis/SimpleWalletFactory'
export * from './abis/SimpleSmartWallet'
export * from './addresses'
export * from './types'
```

### Step 4: ใช้ Shared Code ใน Frontend

**frontend/lib/contracts.ts:**
```typescript
import {
  SimpleWalletFactoryABI,
  SimpleSmartWalletABI,
  getContractAddress,
} from 'shared'

export { SimpleWalletFactoryABI, SimpleSmartWalletABI }

export const FACTORY_ADDRESS = getContractAddress('sepolia', 'factory')
export const ENTRYPOINT_ADDRESS = getContractAddress('sepolia', 'entryPoint')
```

---

## 3. Configuration Files

### 3.1 .gitignore (Root)

```gitignore
# Dependencies
node_modules/
frontend/node_modules/
shared/node_modules/

# Build outputs
frontend/.next/
frontend/out/
shared/dist/

# Contract artifacts
artifacts/
cache/
typechain-types/

# Environment variables
.env
.env.local
frontend/.env.local

# OS
.DS_Store
*.swp

# IDE
.vscode/
.idea/
```

### 3.2 tsconfig.json (Root - optional)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "shared": ["./shared/src"],
      "shared/*": ["./shared/src/*"]
    }
  }
}
```

### 3.3 .env.example (Root)

```env
# Blockchain
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key_here

# Frontend (copy to frontend/.env.local)
NEXT_PUBLIC_FACTORY_ADDRESS=0x0899fDF0Dfe72751925901e72DB41A0aDB18be47
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

---

## 4. Scripts และ Commands

### 4.1 Development

```bash
# Install dependencies ทั้งหมด
npm install

# Run frontend dev server
npm run dev

# หรือ
npm run dev --workspace=frontend

# Compile contracts
npm run contracts:compile

# Run contract tests
npm run contracts:test

# Deploy contracts
npm run contracts:deploy -- --network sepolia
```

### 4.2 Root package.json Scripts (Complete)

```json
{
  "scripts": {
    "dev": "npm run dev --workspace=frontend",
    "build": "npm run build --workspace=frontend",
    "start": "npm run start --workspace=frontend",
    "lint": "npm run lint --workspace=frontend",

    "contracts:compile": "npx hardhat compile",
    "contracts:test": "npx hardhat test",
    "contracts:deploy": "npx hardhat run scripts/deploy.js",
    "contracts:deploy:sepolia": "npx hardhat run scripts/deploy.js --network sepolia",

    "export-abis": "node scripts/export-abis.js",
    "postinstall": "npm run contracts:compile && npm run export-abis",

    "shared:build": "npm run build --workspace=shared",
    "shared:watch": "npm run watch --workspace=shared",

    "clean": "rm -rf artifacts cache typechain-types frontend/.next shared/dist"
  }
}
```

### 4.3 Makefile (Optional - สำหรับคนชอบใช้ make)

**Makefile:**
```makefile
.PHONY: install dev build test deploy clean

# Install all dependencies
install:
	npm install

# Run frontend dev server
dev:
	npm run dev

# Build everything
build:
	npm run contracts:compile
	npm run export-abis
	npm run build --workspace=frontend

# Test contracts
test:
	npm run contracts:test

# Deploy to Sepolia
deploy:
	npm run contracts:deploy:sepolia

# Clean build artifacts
clean:
	npm run clean

# Setup new developer environment
setup:
	npm install
	cp .env.example .env
	cp frontend/.env.example frontend/.env.local
	@echo "✅ Setup complete! Edit .env files with your keys"
```

---

## 5. การใช้งาน

### 5.1 สำหรับ Developer ใหม่

```bash
# 1. Clone repo
git clone <your-repo-url>
cd defi-city

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
cp frontend/.env.example frontend/.env.local
# แก้ไข .env files

# 4. Run dev server
npm run dev

# Frontend จะรันที่ http://localhost:3000
```

### 5.2 การ Develop Contracts

```bash
# 1. แก้ไข contracts
vim contracts/SimpleSmartWallet.sol

# 2. Compile
npm run contracts:compile

# 3. Test
npm run contracts:test

# 4. Export ABIs (auto run after compile)
npm run export-abis

# 5. Frontend จะเห็น changes ทันที
```

### 5.3 การ Develop Frontend

```bash
# 1. Run dev server
npm run dev

# 2. แก้ไข code ใน frontend/
vim frontend/app/page.tsx

# 3. Hot reload จะทำงานอัตโนมัติ
```

---

## 6. การ Deploy

### 6.1 Deploy Contracts

```bash
# Deploy to Sepolia
npm run contracts:deploy:sepolia

# Update addresses ใน shared/src/addresses.ts
vim shared/src/addresses.ts
```

### 6.2 Deploy Frontend

#### Vercel (แนะนำ)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel
```

**vercel.json:**
```json
{
  "buildCommand": "cd .. && npm run build",
  "installCommand": "cd .. && npm install",
  "framework": "nextjs"
}
```

#### Docker (Optional)

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

RUN npm install

COPY . .
RUN npm run contracts:compile
RUN npm run export-abis
RUN npm run build --workspace=frontend

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/package.json ./frontend/

WORKDIR /app/frontend
RUN npm install --production

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 7. Best Practices

### 7.1 Version Control

```bash
# Contract changes = bump version
# Update shared/package.json version

# Commit message format
git commit -m "feat(contracts): add session key support"
git commit -m "feat(frontend): add building placement UI"
git commit -m "fix(shared): export missing types"
```

### 7.2 CI/CD

**GitHub Actions (.github/workflows/ci.yml):**
```yaml
name: CI

on: [push, pull_request]

jobs:
  contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run contracts:compile
      - run: npm run contracts:test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run build --workspace=frontend
```

### 7.3 Documentation

อัพเดท README.md ให้ชัดเจน:

```markdown
# DeFi City Monorepo

## 📦 Structure

- `/contracts` - Smart contracts (Hardhat)
- `/frontend` - Next.js app
- `/shared` - Shared code (ABIs, types, addresses)
- `/scripts` - Deployment scripts

## 🚀 Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## 📚 Documentation

- [Tutorial](./TUTORIAL.md)
- [ERC-4337 Guide](./ERC4337_GUIDE.md)
- [Frontend Guide](./FRONTEND_PROMPT.md)
```

---

## 🎯 Summary

### ทำตามขั้นตอนนี้:

1. ✅ สร้างโฟลเดอร์ `frontend/` และ `shared/`
2. ✅ แก้ไข root `package.json` เพิ่ม workspaces
3. ✅ Setup Next.js ใน `frontend/`
4. ✅ สร้าง `shared/` package สำหรับแชร์ ABIs และ types
5. ✅ สร้าง script `export-abis.js`
6. ✅ อัพเดท `.gitignore`
7. ✅ Run `npm install` ที่ root
8. ✅ Run `npm run dev` เพื่อเริ่มต้น

### ผลลัพธ์:

```bash
defi-city/
├── contracts/        # Smart contracts
├── frontend/         # Next.js app
├── shared/           # Shared code
├── scripts/          # Scripts
├── package.json      # Root workspace
└── README.md
```

**ข้อดี:**
- ✅ Code ทั้งหมดอยู่ที่เดียว
- ✅ แชร์ ABIs และ types ง่าย
- ✅ Deploy แยกได้
- ✅ Git history ครบ
- ✅ Easy to maintain

---

ต้องการให้ผมช่วย setup เลยไหมครับ? 🚀
