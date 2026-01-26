# Frontend Architecture - คู่มืออธิบายโครงสร้าง Frontend ทั้งหมด

## สารบัญ

- [1. Next.js คืออะไร? ทำงานยังไง?](#1-nextjs-คืออะไร-ทำงานยังไง)
- [2. โครงสร้างโฟลเดอร์ทั้งหมด](#2-โครงสร้างโฟลเดอร์ทั้งหมด)
- [3. App Router - ระบบ Route ของ Next.js](#3-app-router---ระบบ-route-ของ-nextjs)
- [4. Layout และ Provider - ระบบห่อหุ้ม](#4-layout-และ-provider---ระบบห่อหุ้ม)
- [5. หน้าเว็บแต่ละหน้า (Pages)](#5-หน้าเว็บแต่ละหน้า-pages)
- [6. Components - ชิ้นส่วน UI](#6-components---ชิ้นส่วน-ui)
- [7. Hooks - Logic ฝั่ง Blockchain](#7-hooks---logic-ฝั่ง-blockchain)
- [8. Lib - Config และ Utility](#8-lib---config-และ-utility)
- [9. Flow การทำงานทั้งหมด](#9-flow-การทำงานทั้งหมด)
- [10. Tech Stack ที่ใช้](#10-tech-stack-ที่ใช้)

---

## 1. Next.js คืออะไร? ทำงานยังไง?

Next.js เป็น **React Framework** ที่เพิ่มความสามารถให้ React เช่น ระบบ Routing, Server-Side Rendering (SSR), และ API Routes

### แนวคิดหลักของ Next.js App Router

```
โฟลเดอร์ = Route (URL)
ไฟล์พิเศษ = หน้าที่ของแต่ละ route
```

**ไฟล์พิเศษที่ Next.js รู้จัก:**

| ไฟล์ | หน้าที่ |
|------|---------|
| `page.tsx` | เนื้อหาของหน้านั้น (สิ่งที่ user เห็น) |
| `layout.tsx` | กรอบที่ห่อหุ้มหน้า (ใช้ร่วมกันหลายหน้า) |
| `loading.tsx` | หน้า loading ขณะรอข้อมูล |
| `error.tsx` | หน้าแสดง error |
| `globals.css` | CSS ที่ใช้ทั้งเว็บ |

### ตัวอย่างวิธีที่ Next.js สร้าง Route

```
src/app/page.tsx          →  URL: /          (หน้าแรก)
src/app/app/page.tsx      →  URL: /app       (หน้า app หลัก)
src/app/about/page.tsx    →  URL: /about     (ถ้ามี)
```

**สำคัญ:** แค่สร้างโฟลเดอร์ + ไฟล์ `page.tsx` ก็ได้ route ใหม่เลย ไม่ต้อง config อะไร

### `'use client'` vs Server Component

- **Server Component** (default) - render บน server ก่อนส่งมาที่ browser
- **Client Component** (`'use client'`) - render บน browser, ใช้ `useState`, `useEffect`, event handler ได้

โปรเจคนี้ส่วนใหญ่เป็น Client Component เพราะต้องใช้ wallet connection ซึ่งทำงานบน browser เท่านั้น

---

## 2. โครงสร้างโฟลเดอร์ทั้งหมด

```
frontend/src/
│
├── app/                          # ← ระบบ Route (Next.js App Router)
│   ├── layout.tsx               #    Root Layout - ห่อหุ้มทุกหน้า
│   ├── page.tsx                 #    หน้า Landing (URL: /)
│   ├── globals.css              #    CSS ทั้งเว็บ
│   └── app/                     #    Route ย่อย /app
│       ├── layout.tsx           #    Layout เฉพาะ /app (มี Privy + Wagmi)
│       └── page.tsx             #    หน้า Dashboard (URL: /app)
│
├── components/                   # ← ชิ้นส่วน UI ที่แยกออกมา reuse ได้
│   ├── ErrorBoundary.tsx        #    จับ error ไม่ให้เว็บ crash
│   ├── providers/               #    Provider components
│   │   ├── index.tsx            #    รวม providers ทั้งหมด
│   │   ├── PrivyProvider.tsx    #    ตั้งค่า Privy (login wallet)
│   │   └── WagmiProvider.tsx    #    ตั้งค่า Wagmi (อ่าน/เขียน contract)
│   └── landing/                 #    Components สำหรับ Landing Page
│       ├── LandingPage.tsx      #    หน้า Landing หลัก
│       ├── FeatureCard.tsx      #    การ์ด feature
│       ├── IsometricBuilding.tsx #   ตึก 3D isometric
│       ├── ParticleField.tsx    #    พื้นหลัง particle
│       ├── pixel/               #    Pixel Art UI
│       │   ├── PixelBackground.tsx  # พื้นหลัง pixel
│       │   ├── PixelButton.tsx      # ปุ่ม pixel
│       │   ├── PixelCard.tsx        # การ์ด pixel
│       │   └── BuildingIcon.tsx     # icon ตึก
│       └── sections/            #    แต่ละส่วนของ Landing Page
│           ├── HeroSection.tsx      # ส่วนบนสุด + ปุ่ม Connect
│           ├── ConceptSection.tsx   # อธิบาย concept
│           ├── StrategiesSection.tsx # แสดง strategies
│           ├── FeaturesSection.tsx   # แสดง features
│           ├── CTASection.tsx       # ปุ่ม Call-to-action
│           └── FooterSection.tsx    # Footer
│
├── hooks/                        # ← Custom Hooks (logic blockchain)
│   ├── index.ts                 #    Export รวม
│   ├── useSmartWallet.ts        #    ดึง Smart Wallet address
│   ├── useCreateSmartAccount.ts #    สร้าง Town Hall (deploy wallet)
│   ├── useWithdrawToSmartWallet.ts   # ฝากเงินเข้า Smart Wallet
│   └── useWithdrawFromSmartWallet.ts # ถอนเงินจาก Smart Wallet
│
└── lib/                          # ← Config, Utility, Contract
    ├── constants.ts             #    ค่าคงที่ (chain, RPC, env)
    ├── utils.ts                 #    utility function (cn)
    ├── wagmi.ts                 #    ตั้งค่า Wagmi config
    └── contracts/               #    Contract addresses + ABIs
        ├── index.ts             #    Export รวม
        ├── addresses.ts         #    ที่อยู่ contract บน Base Sepolia
        └── abis/                #    ABI (interface ของ contract)
            ├── ERC20.ts         #    ABI ของ ERC20 token
            ├── SmartWallet.ts   #    ABI ของ Smart Wallet
            └── SimpleWalletFactory.ts  # ABI ของ WalletFactory + DefiCityCore
```

---

## 3. App Router - ระบบ Route ของ Next.js

### โปรเจคนี้มี 2 Route

```
Route /     →  Landing Page (หน้าแรก ไม่ต้อง login)
Route /app  →  Dashboard (ต้อง login ด้วย wallet)
```

### วิธีที่ Route ทำงาน

```
User พิมพ์ URL: https://deficity.com/
                       ↓
Next.js ดูโฟลเดอร์: src/app/
                       ↓
เจอ page.tsx → render หน้า Landing Page
```

```
User กดปุ่ม → เข้า URL: https://deficity.com/app
                       ↓
Next.js ดูโฟลเดอร์: src/app/app/
                       ↓
1. เอา layout.tsx มาห่อก่อน (ใส่ Privy + Wagmi)
2. แล้ว render page.tsx (Dashboard)
```

---

## 4. Layout และ Provider - ระบบห่อหุ้ม

Layout คือ "กรอบ" ที่ห่อหุ้ม page ข้างใน มันทำงานแบบ **ซ้อนกัน** (nested)

### ลำดับการห่อหุ้ม

```
┌─── Root Layout (src/app/layout.tsx) ──────────────────────┐
│  - ตั้งค่า <html>, <body>                                  │
│  - โหลด font: Geist Sans, Geist Mono, Press Start 2P      │
│  - ห่อด้วย <Providers> (ErrorBoundary)                     │
│  - ใช้ dark mode (className="dark")                        │
│                                                             │
│  ┌─── App Layout (src/app/app/layout.tsx) ──────────┐      │
│  │  - ห่อด้วย <PrivyProvider> → ระบบ login wallet    │      │
│  │  - ห่อด้วย <WagmiProvider> → ระบบอ่าน/เขียน chain │      │
│  │                                                    │      │
│  │  ┌─── App Page (src/app/app/page.tsx) ────┐       │      │
│  │  │  หน้า Dashboard                         │       │      │
│  │  │  (ใช้ Privy + Wagmi ได้)               │       │      │
│  │  └────────────────────────────────────────┘       │      │
│  └────────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─── Landing Page (src/app/page.tsx) ───────────────┐      │
│  │  หน้า Landing                                      │      │
│  │  (ไม่มี Privy/Wagmi เพราะไม่ต้อง login)          │      │
│  └────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

### Provider คืออะไร?

Provider เป็น pattern ของ React ที่ **ส่งข้อมูลลงไปให้ component ลูกทุกตัว** โดยไม่ต้อง pass props ทีละชั้น

```
<PrivyProvider>           ← ทำให้ลูกทุกตัวเรียก usePrivy() ได้
  <WagmiProvider>         ← ทำให้ลูกทุกตัวเรียก useWriteContract() ได้
    <App Page />          ← ใช้ได้ทั้ง Privy และ Wagmi
  </WagmiProvider>
</PrivyProvider>
```

### ไฟล์: `src/components/providers/PrivyProvider.tsx`

ตั้งค่า Privy สำหรับ wallet login:
- **Chain**: Base Sepolia (testnet)
- **Login**: wallet only (ไม่มี email, social login)
- **Embedded Wallet**: ปิด (ใช้ wallet ของ user เช่น MetaMask)
- **ต้องการ**: `NEXT_PUBLIC_PRIVY_APP_ID` ใน `.env`

### ไฟล์: `src/components/providers/WagmiProvider.tsx`

ตั้งค่า Wagmi สำหรับอ่าน/เขียน blockchain:
- **Chain**: Base Sepolia
- **Connectors**: MetaMask (injected), WalletConnect
- **Transport**: HTTP RPC
- **React Query**: สำหรับ cache ข้อมูล

---

## 5. หน้าเว็บแต่ละหน้า (Pages)

### 5.1 Landing Page (`src/app/page.tsx` → URL: `/`)

หน้าแรกที่ user เห็นเมื่อเข้าเว็บ **ไม่ต้อง login**

**โครงสร้าง:**
```tsx
// src/app/page.tsx
import { LandingPage } from '@/components/landing'

export default function Home() {
  return <LandingPage />     // ← แค่เรียก component LandingPage
}
```

LandingPage ประกอบด้วย sections เรียงต่อกัน:
```
1. HeroSection       → ชื่อเกม "DEFI CITY" + ปุ่ม Connect + ตึก floating
2. ConceptSection    → อธิบาย concept ของเกม
3. StrategiesSection → แสดง DeFi strategies ที่มี
4. FeaturesSection   → แสดง features (การ์ด 3D)
5. CTASection        → ปุ่ม Call-to-action
6. FooterSection     → Footer
```

### 5.2 App Page (`src/app/app/page.tsx` → URL: `/app`)

หน้า Dashboard หลัก **ต้อง login** ด้วย wallet

**หน้านี้มีหลายสถานะ (state) ที่แสดงผลต่างกัน:**

```
สถานะ 1: กำลังโหลด Privy
         → แสดง "LOADING..." (pixel bounce animation)

สถานะ 2: ยังไม่ login
         → แสดงปุ่ม "CONNECT" ให้กด login

สถานะ 3: Login แล้ว แต่ยังไม่ได้ wallet address
         → แสดง "CONNECTING..." (รอ wallet popup)

สถานะ 4: มี wallet address แล้ว
         → แสดง Dashboard เต็ม:
           ├── Welcome Box (แสดง EOA address)
           ├── Town Hall Box (สร้าง/ดู Smart Account)
           ├── Deposit Box (ฝากเงินเข้า Smart Wallet)
           ├── Withdraw Box (ถอนเงินจาก Smart Wallet)
           └── Stats Preview (Level, Coins, Land)
```

**Logic หลักในหน้านี้:**

```tsx
// 1. ดึงข้อมูล auth จาก Privy
const { ready, authenticated, login, logout } = usePrivy()
const { wallets } = useWallets()

// 2. หา wallet address (เอาเฉพาะ external wallet ไม่ใช่ Privy embedded)
const wallet = wallets.find(w => w.walletClientType !== 'privy')
const address = wallet?.address

// 3. ดึงข้อมูล Smart Wallet
const { smartWallet, hasSmartWallet } = useSmartWallet(address)

// 4. Hook สำหรับ deposit/withdraw
const { withdraw, ethBalance, usdcBalance } = useWithdrawToSmartWallet(address, smartWallet)
const { withdrawFromVault } = useWithdrawFromSmartWallet(address, smartWallet)
```

---

## 6. Components - ชิ้นส่วน UI

### Component คืออะไร?

Component เป็น "ชิ้นส่วน UI ที่ reuse ได้" เหมือนตัวต่อ Lego

```
LandingPage (ตัวใหญ่)
├── HeroSection (ส่วน)
│   ├── PixelBackground (พื้นหลัง)
│   ├── BuildingIcon (icon ตึก)
│   └── PixelButton (ปุ่ม)
├── FeaturesSection (ส่วน)
│   ├── FeatureCard (การ์ด)
│   └── FeatureCard (การ์ด)  ← ใช้ซ้ำได้!
└── FooterSection (ส่วน)
```

### ErrorBoundary (`src/components/ErrorBoundary.tsx`)

จับ error ไม่ให้เว็บ crash ทั้งหมด ถ้ามี component ใด error จะแสดงหน้า error แทน:
```
"Something went wrong"
[Try Again] [Reload Page]
```

### Pixel Components

โปรเจคนี้ใช้ธีม **Pixel Art** (เกม 8-bit) โดยมี component พิเศษ:

| Component | หน้าที่ |
|-----------|---------|
| `PixelBackground` | พื้นหลังดาว + grid + scanline |
| `PixelButton` | ปุ่มสไตล์ pixel พร้อมเงา |
| `PixelCard` | กรอบการ์ดสไตล์ pixel |
| `BuildingIcon` | icon ตึก 4 แบบ (Town Hall, Bank, Shop, Lottery) |

---

## 7. Hooks - Logic ฝั่ง Blockchain

### Hook คืออะไร?

Hook เป็นฟังก์ชันพิเศษของ React ที่ชื่อขึ้นต้นด้วย `use` ใช้สำหรับ:
- เก็บ state (`useState`)
- ทำงานตอน component โหลด (`useEffect`)
- แยก logic ออกจาก UI ให้สะอาด

### 7.1 `useSmartWallet` - ดึง Smart Wallet Address

```
ไฟล์: src/hooks/useSmartWallet.ts
Input: ownerAddress (EOA address ของ user)
Output: { smartWallet, loading, hasSmartWallet, refetch }
```

**ทำอะไร:**
1. ส่ง ownerAddress ไปถาม DefiCityCore contract
2. เรียกฟังก์ชัน `getWallet(ownerAddress)` บน chain
3. ถ้าได้ address กลับมา (ไม่ใช่ 0x000...0) → มี Smart Wallet แล้ว
4. ถ้าได้ 0x000...0 → ยังไม่มี Smart Wallet

```
User's EOA Address ──→ DefiCityCore.getWallet() ──→ Smart Wallet Address
    (MetaMask)              (on-chain)                  (ERC-4337)
```

### 7.2 `useCreateSmartAccount` - สร้าง Town Hall

```
ไฟล์: src/hooks/useCreateSmartAccount.ts
Input: ไม่มี (ใช้ address จาก Wagmi โดยอัตโนมัติ)
Output: { createSmartAccount, isPending, hash }
```

**ทำอะไร:**
1. เรียก `DefiCityCore.createTownHall(6, 6)` (ตรงกลาง grid 12x12)
2. Contract จะ deploy Smart Wallet ใหม่สำหรับ user
3. และสร้างตึก Town Hall ที่ตำแหน่ง (6,6)
4. return transaction hash

```
กดปุ่ม "CREATE TOWN HALL"
    ↓
เรียก createTownHall(6, 6) บน chain
    ↓
Contract deploy Smart Wallet + สร้าง Town Hall
    ↓
return { walletAddress, buildingId }
```

### 7.3 `useWithdrawToSmartWallet` - ฝากเงินเข้า Smart Wallet

```
ไฟล์: src/hooks/useWithdrawToSmartWallet.ts
Input: ownerAddress, smartWalletAddress
Output: { withdraw, ethBalance, usdcBalance, smartWalletEthBalance, ... }
```

**ชื่อ "withdraw" แต่จริงๆ คือ "deposit"** (ย้ายเงินจาก EOA → Smart Wallet)

**ทำอะไร:**

สำหรับ ETH:
```
EOA Wallet (MetaMask)  ──── ETH ────→  Smart Wallet
                    eth_sendTransaction
```

สำหรับ USDC:
```
EOA Wallet (MetaMask)  ──── USDC ───→  Smart Wallet
                    ERC20.transfer()
```

**ดึง balance ด้วย:**
- ETH balance: ใช้ `getBalance()` จาก viem
- USDC balance: ใช้ `ERC20.balanceOf()` (6 decimals สำหรับ USDC)

### 7.4 `useWithdrawFromSmartWallet` - ถอนเงินจาก Smart Wallet

```
ไฟล์: src/hooks/useWithdrawFromSmartWallet.ts
Input: ownerAddress, smartWalletAddress, refetchBalances
Output: { withdrawFromVault, isWithdrawing, isConfirming }
```

**ทำอะไร:**

สำหรับ ETH:
```
Smart Wallet ──── ETH ────→ EOA Wallet (MetaMask)
          SmartWallet.execute(owner, amount, "0x")
```

สำหรับ USDC:
```
Smart Wallet ──── USDC ───→ EOA Wallet (MetaMask)
          SmartWallet.execute(USDC_addr, 0, encoded_transfer_data)
```

Smart Wallet ใช้ฟังก์ชัน `execute()` เพื่อสั่งให้ตัวเองส่งเงินออกไป
ฟังก์ชันนี้มีเฉพาะ owner เท่านั้นที่เรียกได้ (เพราะ Smart Wallet เป็น ERC-4337)

---

## 8. Lib - Config และ Utility

### 8.1 `constants.ts` - ค่าคงที่

```typescript
CHAIN_ID = 84532                    // Base Sepolia testnet
RPC_URL = 'https://base-sepolia-rpc.publicnode.com'
PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID
```

### 8.2 `wagmi.ts` - Wagmi Config

ตั้งค่า Wagmi ให้รู้จัก:
- **Chain ไหน**: Base Sepolia
- **เชื่อมต่อ wallet ยังไง**: MetaMask (injected) + WalletConnect
- **ส่ง request ไปที่ไหน**: RPC URL

### 8.3 `contracts/addresses.ts` - ที่อยู่ Contract

```typescript
ENTRY_POINT_ADDRESS = '0x4290...'   // ERC-4337 EntryPoint
CORE_ADDRESS = '0xaDc5...'          // DefiCityCore (contract หลัก)
FACTORY_ADDRESS = '0xD7e5...'       // WalletFactory (สร้าง wallet)
USDC_ADDRESS = '0x036C...'          // USDC token บน Base Sepolia
```

### 8.4 `contracts/abis/` - ABI ของ Contract

ABI (Application Binary Interface) คือ "คู่มือ" ที่บอกว่า contract มีฟังก์ชันอะไรบ้าง

```
ERC20.ts              → balanceOf, transfer, approve, allowance
SmartWallet.ts        → execute, executeBatch, owner, getNonce
SimpleWalletFactory.ts → createTownHall, getWallet, hasWallet, ...
```

**ถ้าจะเรียก contract ต้องมี 3 อย่าง:**
1. **Address** - contract อยู่ที่ไหนบน chain
2. **ABI** - contract มีฟังก์ชันอะไร
3. **Client** - เชื่อมต่อ chain ผ่านอะไร (Wagmi/Viem)

### 8.5 `utils.ts` - Utility

มีฟังก์ชันเดียวคือ `cn()` สำหรับรวม CSS class:
```typescript
cn('text-red', isActive && 'font-bold', className)
// → "text-red font-bold custom-class"
```

---

## 9. Flow การทำงานทั้งหมด

### Flow 1: User เข้าเว็บครั้งแรก

```
1. User เปิด https://deficity.com/
         ↓
2. Next.js render:
   Root Layout (โหลด font, dark mode)
     └── Landing Page (HeroSection, Features, ...)
         ↓
3. User เห็นหน้า Landing สวยงาม
         ↓
4. User กดปุ่ม "CONNECT" หรือ "START PLAYING"
         ↓
5. Redirect ไป /app
```

### Flow 2: Login ด้วย Wallet

```
1. เข้า /app → Next.js render:
   Root Layout
     └── App Layout (PrivyProvider + WagmiProvider)
         └── App Page
              ↓
2. Privy ยังไม่ ready → แสดง "LOADING..."
              ↓
3. Privy ready, ยังไม่ authenticated → แสดงปุ่ม "CONNECT"
              ↓
4. User กด "CONNECT" → Privy เปิด popup ให้เลือก wallet
              ↓
5. User เลือก MetaMask → MetaMask popup ขึ้น → กด approve
              ↓
6. authenticated = true, ได้ address
              ↓
7. แสดง Dashboard
```

### Flow 3: สร้าง Town Hall (ครั้งแรก)

```
1. Dashboard โหลด → useSmartWallet ดึงข้อมูลจาก chain
              ↓
2. ไม่มี Smart Wallet → แสดงปุ่ม "CREATE TOWN HALL"
              ↓
3. User กดปุ่ม → handleCreateTownHall()
              ↓
4. เรียก DefiCityCore.createTownHall(6, 6)
              ↓
5. MetaMask popup → user confirm transaction
              ↓
6. Transaction ส่งไป Base Sepolia → contract deploy Smart Wallet
              ↓
7. รอ 3 วินาที → refetch ข้อมูล Smart Wallet
              ↓
8. แสดง Smart Wallet Address + ปุ่ม Deposit/Withdraw
```

### Flow 4: ฝากเงิน (Deposit)

```
1. User เลือก token (ETH หรือ USDC)
              ↓
2. User ใส่จำนวน (หรือกด MAX)
              ↓
3. User กดปุ่ม "DEPOSIT TO VAULT"
              ↓
4. ถ้า ETH → ส่ง ETH ตรงจาก MetaMask ไป Smart Wallet
   ถ้า USDC → เรียก USDC.transfer() ไป Smart Wallet
              ↓
5. MetaMask popup → user confirm
              ↓
6. Transaction ส่งไป chain → รอ confirm
              ↓
7. แสดง "DEPOSIT SUCCESSFUL!"
              ↓
8. รอ 5 วินาที → refetch balance ใหม่
```

### Flow 5: ถอนเงิน (Withdraw)

```
1. User เลือก token + ใส่จำนวน
              ↓
2. กดปุ่ม "WITHDRAW TO WALLET"
              ↓
3. เรียก SmartWallet.execute() ให้ Smart Wallet ส่งเงินกลับ EOA
              ↓
4. MetaMask popup → user confirm
              ↓
5. Smart Wallet ส่งเงินไปที่ EOA address
              ↓
6. แสดง "WITHDRAW SUCCESSFUL!"
```

---

## 10. Tech Stack ที่ใช้

### Blockchain Stack

```
Privy (@privy-io/react-auth)
  └── จัดการ login/logout ด้วย wallet
      └── ให้ authenticated, login(), logout()

Wagmi (wagmi)
  └── อ่าน/เขียน smart contract จาก React
      └── useWriteContract, useReadContract, ...

Viem (viem)
  └── library พื้นฐานสำหรับ Ethereum
      └── createPublicClient, parseEther, formatUnits, ...

React Query (@tanstack/react-query)
  └── cache ข้อมูลจาก blockchain
      └── ไม่ต้อง fetch ซ้ำๆ ถ้าข้อมูลยังใหม่อยู่
```

### UI Stack

```
Next.js 16 (next)
  └── Framework หลัก (routing, SSR, build)

React 19 (react)
  └── UI library (components, hooks, state)

Tailwind CSS 4 (tailwindcss)
  └── CSS framework (class-based styling)
      └── เช่น "text-amber-400 text-sm bg-slate-900"

Framer Motion (framer-motion)
  └── Animation library
      └── เช่น scroll animation, hover effects

Lucide React + React Icons
  └── Icon libraries
```

### ความสัมพันธ์ระหว่าง Privy, Wagmi, Viem

```
              User กดปุ่ม
                  │
                  ▼
┌─────────────────────────────┐
│         Privy                │  ← จัดการ login
│   "user ใช้ wallet ไหน?"    │
│   "authenticated หรือยัง?"  │
└──────────┬──────────────────┘
           │ ได้ wallet address
           ▼
┌─────────────────────────────┐
│         Wagmi                │  ← เชื่อม React กับ blockchain
│   useWriteContract()         │
│   useReadContract()          │
│   React hooks สำหรับ chain   │
└──────────┬──────────────────┘
           │ ใช้ viem ข้างใน
           ▼
┌─────────────────────────────┐
│         Viem                 │  ← low-level blockchain library
│   createPublicClient()       │
│   parseEther(), formatUnits()│
│   encodeFunctionData()       │
│   ส่ง request ไปหา RPC node │
└──────────┬──────────────────┘
           │ HTTP request
           ▼
┌─────────────────────────────┐
│    Base Sepolia (blockchain) │
│    Smart Contracts           │
│    DefiCityCore, SmartWallet │
└─────────────────────────────┘
```

---

## สรุป

| หมวด | ไฟล์สำคัญ | หน้าที่ |
|------|-----------|---------|
| **Routing** | `app/page.tsx`, `app/app/page.tsx` | กำหนด URL แต่ละหน้า |
| **Layout** | `app/layout.tsx`, `app/app/layout.tsx` | ห่อหุ้ม + ให้ Provider |
| **Auth** | `PrivyProvider.tsx` | Login ด้วย wallet |
| **Blockchain** | `WagmiProvider.tsx`, `wagmi.ts` | เชื่อม chain |
| **Smart Wallet** | `useSmartWallet.ts` | ดึง Smart Wallet address |
| **Deploy** | `useCreateSmartAccount.ts` | สร้าง Town Hall |
| **Deposit** | `useWithdrawToSmartWallet.ts` | ฝากเงิน EOA → Smart Wallet |
| **Withdraw** | `useWithdrawFromSmartWallet.ts` | ถอนเงิน Smart Wallet → EOA |
| **Contract** | `addresses.ts`, `abis/*.ts` | ที่อยู่ + interface ของ contract |
| **UI** | `components/landing/*` | หน้า Landing |
| **Style** | `globals.css` | Tailwind + theme |
