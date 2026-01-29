# Frontend Architecture - คู่มืออธิบายโครงสร้าง Frontend ทั้งหมด

**Version: 2.0** - รองรับ Aave Supply + Borrow + On-chain Buildings

## สารบัญ

- [1. Next.js คืออะไร? ทำงานยังไง?](#1-nextjs-คืออะไร-ทำงานยังไง)
- [2. โครงสร้างโฟลเดอร์ทั้งหมด](#2-โครงสร้างโฟลเดอร์ทั้งหมด)
- [3. App Router - ระบบ Route ของ Next.js](#3-app-router---ระบบ-route-ของ-nextjs)
- [4. Layout และ Provider - ระบบห่อหุ้ม](#4-layout-และ-provider---ระบบห่อหุ้ม)
- [5. หน้าเว็บแต่ละหน้า (Pages)](#5-หน้าเว็บแต่ละหน้า-pages)
- [6. Components - ชิ้นส่วน UI](#6-components---ชิ้นส่วน-ui)
- [7. Hooks - Logic ฝั่ง Blockchain](#7-hooks---logic-ฝั่ง-blockchain)
- [8. Config - ค่า Contract และ Aave](#8-config---ค่า-contract-และ-aave)
- [9. Lib - Utility และ Wagmi Config](#9-lib---utility-และ-wagmi-config)
- [10. Flow การทำงานทั้งหมด](#10-flow-การทำงานทั้งหมด)
- [11. Tech Stack ที่ใช้](#11-tech-stack-ที่ใช้)

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
│   ├── aave/                    #    Aave Management (Bank)
│   │   ├── AavePanel.tsx        #    หน้าจอจัดการเงินใน Aave (Supply/Borrow/Withdraw/Repay)
│   │   └── index.ts             #    Export รวม
│   ├── game/                    #    Game Components
│   │   └── CityGrid.tsx         #    แผนที่เมือง 13x13 พร้อม drag-to-move
│   ├── ui/                      #    UI Components ทั่วไป
│   │   └── ErrorPopup.tsx       #    Popup แสดง error
│   └── landing/                 #    Components สำหรับ Landing Page
│       ├── LandingPage.tsx      #    หน้า Landing หลัก
│       ├── FeatureCard.tsx      #    การ์ด feature
│       ├── IsometricBuilding.tsx #   ตึก 3D isometric (รองรับ townhall, bank, borrow)
│       ├── ParticleField.tsx    #    พื้นหลัง particle
│       ├── index.ts             #    Export รวม
│       ├── pixel/               #    Pixel Art UI
│       │   ├── PixelBackground.tsx  # พื้นหลัง pixel
│       │   ├── PixelButton.tsx      # ปุ่ม pixel
│       │   ├── PixelCard.tsx        # การ์ด pixel
│       │   ├── BuildingIcon.tsx     # icon ตึก
│       │   └── index.ts            # Export รวม
│       └── sections/            #    แต่ละส่วนของ Landing Page
│           ├── HeroSection.tsx      # ส่วนบนสุด + ปุ่ม Connect
│           ├── ConceptSection.tsx   # อธิบาย concept
│           ├── StrategiesSection.tsx # แสดง strategies
│           ├── FeaturesSection.tsx   # แสดง features
│           ├── CTASection.tsx       # ปุ่ม Call-to-action
│           ├── FooterSection.tsx    # Footer
│           └── index.ts            # Export รวม
│
├── config/                       # ← Contract + Aave Configuration
│   ├── aave.ts                  #    ราคา asset, ข้อมูล Aave market
│   └── contracts.ts             #    Contract addresses, ABIs, chain config
│
├── hooks/                        # ← Custom Hooks (logic blockchain)
│   ├── index.ts                 #    Export รวม
│   ├── useSmartWallet.ts        #    ดึง Smart Wallet address
│   ├── useCreateSmartAccount.ts #    สร้าง Town Hall (deploy wallet)
│   ├── useVaultDeposit.ts       #    ฝากเงินจาก EOA เข้า Smart Wallet (Vault)
│   ├── useVaultWithdraw.ts      #    ถอนเงินจาก Smart Wallet กลับ EOA
│   ├── useAaveSupply.ts         #    Supply tokens เข้า Aave + สร้าง bank building
│   ├── useAaveWithdraw.ts       #    Withdraw tokens จาก Aave + demolish building
│   ├── useAaveBorrow.ts         #    Borrow tokens จาก Aave + สร้าง borrow building
│   ├── useAaveRepay.ts          #    Repay borrowed tokens + demolish borrow building
│   ├── useAavePosition.ts       #    ดึง Position ใน Aave (Supply/Borrow/Health Factor)
│   ├── useAaveMarketData.ts     #    ดึง Market Data (APY) จาก Aave on-chain
│   ├── useAaveReserveData.ts    #    ดึง Reserve Data เต็มรูปแบบ (Cap, LTV, Oracle)
│   ├── useCityBuildings.ts      #    ดึงข้อมูลตึกทั้งหมด (supply + borrow) จาก on-chain
│   ├── useMoveBuilding.ts       #    ย้ายตึกบนแผนที่ (รองรับทั้ง on-chain และ virtual)
│   └── useContracts.ts          #    สร้าง Contract instances
│
├── lib/                          # ← Utility และ Config
│   ├── constants.ts             #    ค่าคงที่ (chain, RPC, GRID_SIZE)
│   ├── utils.ts                 #    utility function (cn)
│   ├── wagmi.ts                 #    ตั้งค่า Wagmi config
│   └── contracts/               #    Contract addresses + ABIs (legacy)
│       ├── index.ts             #    Export รวม
│       ├── addresses.ts         #    ที่อยู่ contract บน Base Sepolia
│       └── abis/                #    ABI (interface ของ contract)
│           ├── ERC20.ts         #    ABI ของ ERC20 token
│           ├── SmartWallet.ts   #    ABI ของ Smart Wallet
│           └── SimpleWalletFactory.ts  # ABI ของ WalletFactory + DefiCityCore
│
├── store/                        # ← สำรองไว้สำหรับ state management ในอนาคต
│
└── types/                        # ← สำรองไว้สำหรับ TypeScript types ในอนาคต
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
│  │  │  หน้า Dashboard + City Grid             │       │      │
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
         → แสดงปุ่ม "CONNECT WALLET" ให้กด login

สถานะ 3: Login แล้ว แต่ยังไม่ได้ wallet address
         → แสดง "CONNECTING WALLET..." (รอ wallet popup)

สถานะ 4: มี wallet address แล้ว แต่ยังไม่มี Smart Wallet
         → แสดง Modal บังคับสร้าง Town Hall (fullscreen overlay)

สถานะ 5: มี Smart Wallet แล้ว
         → แสดง Dashboard เต็ม:
           ├── Header Bar (sticky top)
           │   ├── WALLET address + balance (ETH, USDC, USDT, WBTC, LINK)
           │   └── VAULT address + balance (ETH, USDC, USDT, WBTC, LINK)
           ├── City Map (CityGrid 13x13)
           │   ├── Town Hall (กลาง grid ย้ายไม่ได้)
           │   ├── Bank Buildings (สีเขียว - Supply)
           │   ├── Borrow Buildings (สีแดง - Borrow)
           │   └── Drag-to-Move (ลาก building เพื่อย้ายตำแหน่ง)
           ├── Build Modal (popup เมื่อคลิก tile)
           │   └── AavePanel (Supply/Borrow Tabs)
           ├── Vault Management (Tabbed Interface)
           │   ├── DEPOSIT Tab (ฝากจาก EOA เข้า Vault)
           │   │   └── รองรับ: ETH, USDC, USDT, WBTC, LINK + MAX button
           │   └── WITHDRAW Tab (ถอนจาก Vault กลับ EOA)
           │       └── รองรับ: ETH, USDC, USDT, WBTC, LINK + MAX button
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
const { smartWallet, hasSmartWallet, refetch } = useSmartWallet(address)

// 4. Hook สำหรับ Vault actions (รองรับ 5 tokens)
const {
  deposit: vaultDeposit,
  ethBalance, usdcBalance, usdtBalance, wbtcBalance, linkBalance,
  smartWalletEthBalance, smartWalletUsdcBalance, smartWalletUsdtBalance,
  smartWalletWbtcBalance, smartWalletLinkBalance,
  refetchBalances
} = useVaultDeposit(address, smartWallet)
const { withdraw: vaultWithdraw } = useVaultWithdraw(address, smartWallet, refetchBalances)

// 5. Hook สำหรับ City Buildings + Movement
const { buildings, allBuildings, refresh: refreshBuildings } = useCityBuildings(address, smartWallet)
const { moveBuilding } = useMoveBuilding()

// 6. Insufficient balance checks
const hasInsufficientDepositBalance = useMemo(...)   // เช็คยอดไม่พอสำหรับ deposit
const hasInsufficientWithdrawBalance = useMemo(...)   // เช็คยอดไม่พอสำหรับ withdraw
```

---

## 6. Components - ชิ้นส่วน UI

### Component คืออะไร?

Component เป็น "ชิ้นส่วน UI ที่ reuse ได้" เหมือนตัวต่อ Lego

```
App Page (ตัวใหญ่)
├── Header Bar (แสดง wallet/vault info)
├── CityGrid (แผนที่เมือง)
│   ├── Bank Buildings (supply - สีเขียว)
│   └── Borrow Buildings (borrow - สีแดง)
├── Build Modal (popup)
│   └── AavePanel (Supply/Borrow Tabs)
│       └── ErrorPopup (แสดง error)
├── Vault Management (Deposit/Withdraw)
└── Stats (Level, Coins, Land)
```

### CityGrid (`src/components/game/CityGrid.tsx`)

แผนที่เมืองขนาด **13x13 grid** ที่แสดงตึกทั้งหมดของ user:
- **Town Hall** อยู่กลาง grid (ย้ายไม่ได้)
- **Bank Buildings** (สีเขียว) แสดงตาม asset ที่ supply
- **Borrow Buildings** (สีแดง) แสดงตาม asset ที่ borrow
- **Drag-to-Move** ลาก building เพื่อย้ายตำแหน่งบน grid
- **Click Tile** คลิกช่องว่างหรือตึกที่มีอยู่เพื่อเปิด Build Modal
- **Building Levels** (1-5) ขึ้นอยู่กับมูลค่า USD

### AavePanel (`src/components/aave/AavePanel.tsx`)

UI สำหรับจัดการเงินบน Aave Protocol:

**Tabs:**
- **SUPPLY Tab** (สีเขียว) - ฝากเงินเข้า Aave เพื่อรับ APY
- **BORROW Tab** (สีส้ม) - ยืมเงินจาก Aave โดยใช้ supply เป็น collateral

**Tab Switching Logic:**
- คลิก **Supply Building** → เริ่มที่ SUPPLY tab, disable BORROW
- คลิก **Borrow Building** → เริ่มที่ BORROW tab, disable SUPPLY
- คลิก **Empty Tile** → ทั้งสอง tab ใช้งานได้

**Features:**
- **Asset Selection** - เลือก USDC, USDT, ETH, WBTC, LINK
- **Asset Locking** - ถ้ามี building แล้ว จะ lock ที่ asset นั้น (ไม่ให้สร้างซ้ำที่อื่น)
- **Vault Balance Display** - แสดงยอดเงินที่มีใน vault
- **Insufficient Balance Check** - แจ้งเตือนเมื่อยอดไม่พอ
- **Reserve Data Display** - แสดง Supply/Borrow Cap, APY, Price, LTV, Utilization
- **Pool Full Warning** - แจ้งเตือนเมื่อ pool เต็ม
- **Position Overview** - แสดง Total Supplied, Borrowed, Health Factor
- **Withdraw Button** - ถอนเงินจาก Aave
- **Repay Button** - ชำระเงินยืม
- **Health Factor Preview** - จำลอง Health Factor ก่อนทำ transaction
- **MAX Button** - สำหรับ borrow/repay สูงสุด

### IsometricBuilding (`src/components/landing/IsometricBuilding.tsx`)

ตึก 3D isometric รองรับ 4 ประเภท:

| Type | สี | Icon | ความหมาย |
|------|-----|------|----------|
| `townhall` | เหลือง/ทอง | ธง | Town Hall ศูนย์กลาง |
| `bank` | เขียว | $ | Supply Building |
| `borrow` | แดง | % | Borrow Building |
| `shop` | ฟ้า | ถุง | Shop (อนาคต) |
| `lottery` | ม่วง | ดาว | Lottery (อนาคต) |

### ErrorPopup (`src/components/ui/ErrorPopup.tsx`)

Popup แสดง error แบบ pixel art พร้อมปุ่มปิด

### ErrorBoundary (`src/components/ErrorBoundary.tsx`)

จับ error ไม่ให้เว็บ crash ทั้งหมด ถ้ามี component ใด error จะแสดงหน้า error แทน:
```
"Something went wrong"
[Try Again] [Reload Page]
```

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

### 7.2 `useCreateSmartAccount` - สร้าง Town Hall

```
ไฟล์: src/hooks/useCreateSmartAccount.ts
Input: ไม่มี (ใช้ address จาก Wagmi โดยอัตโนมัติ)
Output: { createSmartAccount, isPending, hash }
```

**ทำอะไร:**
1. เรียก `DefiCityCore.createTownHall(7, 7)` (ตรงกลาง grid 13x13)
2. Contract จะ deploy Smart Wallet ใหม่สำหรับ user
3. และสร้างตึก Town Hall ที่ตำแหน่งกลาง
4. return transaction hash

### 7.3 `useVaultDeposit` - ฝากเงินเข้า Smart Wallet (Vault)

```
ไฟล์: src/hooks/useVaultDeposit.ts
Input: ownerAddress, smartWalletAddress
Output: { deposit, balances..., refetchBalances, ... }
```

**รองรับ 5 tokens:**
| Token | วิธีฝาก | Decimals |
|-------|---------|----------|
| ETH | `sendTransaction()` ส่ง ETH ตรง | 18 |
| USDC | `ERC20.transfer()` | 6 |
| USDT | `ERC20.transfer()` | 6 |
| WBTC | `ERC20.transfer()` | 8 |
| LINK | `ERC20.transfer()` | 18 |

### 7.4 `useVaultWithdraw` - ถอนเงินจาก Smart Wallet (Vault)

```
ไฟล์: src/hooks/useVaultWithdraw.ts
Input: ownerAddress, smartWalletAddress, refetchBalances
Output: { withdraw, isWithdrawing, isConfirming }
```

### 7.5 `useAaveSupply` - Supply tokens เข้า Aave

```
ไฟล์: src/hooks/useAaveSupply.ts
Input: ไม่มี (ใช้ wallet จาก Privy)
Output: { supply, loading, error }
```

**ทำอะไร:**
1. ตรวจสอบ balance ของ Smart Wallet
2. เรียก BankAdapter.preparePlace() เพื่อเตรียม calldata
3. สำหรับ ETH: เพิ่ม WETH.deposit() (wrap ETH → WETH)
4. Execute batch transaction:
   - ETH: `[deposit, approve, supply, recordBuilding]`
   - ERC20: `[approve, supply, recordBuilding]`
5. ถ้าเป็น upgrade: ข้าม recordBuilding

**Auto-find position:** ถ้าไม่ระบุ x, y จะหาตำแหน่งว่างรอบ Town Hall

### 7.6 `useAaveWithdraw` - ถอน tokens จาก Aave

```
ไฟล์: src/hooks/useAaveWithdraw.ts
Output: { withdraw, loading, error }
```

**ทำอะไร:**
1. เรียก BankAdapter เพื่อเตรียม withdraw calldata
2. Execute batch: `Pool.withdraw(token, amount, smartWallet)`
3. ถ้าถอนทั้งหมด → demolish buildings ที่เกี่ยวข้อง
4. สำหรับ ETH: unwrap WETH → ETH

### 7.7 `useAaveBorrow` - Borrow tokens จาก Aave (NEW)

```
ไฟล์: src/hooks/useAaveBorrow.ts
Output: { borrow, loading, error }
```

**ทำอะไร:**
1. เรียก Aave Pool.borrow() ผ่าน Smart Wallet
2. บันทึก borrow building บน chain ด้วย `recordBuildingPlacement`
3. Building type = 'borrow'

**Parameters:**
```typescript
borrow(
  userAddress: string,
  smartWalletAddress: string,
  asset: string,           // USDC, USDT, ETH, WBTC, LINK
  amount: number,
  x?: number,              // coordinate (auto-find if not provided)
  y?: number,
  isUpgrade?: boolean      // ถ้า true จะไม่สร้าง building ใหม่
)
```

**Batch Transaction:**
```
Smart Wallet executeBatch:
├── [1] Pool.borrow(asset, amount, rateMode, referral, onBehalfOf)
└── [2] Core.recordBuildingPlacement(owner, 'borrow', asset, amount, x, y) -- ถ้าสร้างใหม่
```

### 7.8 `useAaveRepay` - Repay borrowed tokens (NEW)

```
ไฟล์: src/hooks/useAaveRepay.ts
Output: { repay, loading, error }
```

**ทำอะไร:**
1. Approve token ให้ Aave Pool
2. เรียก Pool.repay() ผ่าน Smart Wallet
3. ถ้า repayAll → เรียก `recordDemolition` เพื่อลบ borrow building

**Parameters:**
```typescript
repay(
  userAddress: string,
  smartWalletAddress: string,
  asset: string,
  amount: number,
  repayAll: boolean,        // ใช้ MaxUint256 ถ้า true
  building?: Building       // ถ้ามี จะ demolish ตอน repayAll
)
```

**Batch Transaction:**
```
Smart Wallet executeBatch:
├── [1] Token.approve(pool, amount)
├── [2] Pool.repay(asset, amount, rateMode, onBehalfOf)
└── [3] Core.recordDemolition(owner, buildingId, 0) -- ถ้า repayAll + มี building
```

### 7.9 `useAavePosition` - ดึง Position ใน Aave

```
ไฟล์: src/hooks/useAavePosition.ts
Input: smartWalletAddress
Output: { position, loading, error, refresh }
```

**ข้อมูลที่ได้:**
- **supplies** - รายการ asset ที่ supply พร้อม amount, USD value, APY
- **borrows** - รายการ asset ที่ borrow
- **totalSuppliedUSD** - มูลค่ารวม supply
- **totalBorrowedUSD** - มูลค่ารวม borrow
- **availableBorrowsUSD** - วงเงิน borrow ที่เหลือ
- **healthFactor** - Health Factor (ถ้า < 1 จะถูก liquidate)

### 7.10 `useAaveMarketData` - ดึง Market Data จาก Aave

```
ไฟล์: src/hooks/useAaveMarketData.ts
Output: { marketData, loading, error, refresh }
```

### 7.11 `useAaveReserveData` - ดึง Reserve Data เต็มรูปแบบ

```
ไฟล์: src/hooks/useAaveReserveData.ts
Output: { reserveData, loading, error, getOraclePrice, isPoolFull, refresh }
```

**ข้อมูลที่ได้:**
| ข้อมูล | คำอธิบาย |
|--------|----------|
| `totalSupplied` / `supplyCap` | Supply แล้ว / cap สูงสุด |
| `totalBorrowed` / `borrowCap` | Borrow แล้ว / cap สูงสุด |
| `supplyAPY` / `borrowAPY` | อัตราดอกเบี้ย |
| `ltv` | Loan-to-Value ratio |
| `liquidationThreshold` | เกณฑ์ liquidation |
| `oraclePrice` | ราคาจาก Aave Oracle (USD) |
| `utilizationRate` | อัตราการใช้งาน pool |
| `borrowingEnabled` | Borrow เปิดใช้งานไหม |
| `availableLiquidity` | Liquidity ที่เหลือสำหรับ borrow |

### 7.12 `useCityBuildings` - ดึงข้อมูลตึกจาก On-chain (UPDATED)

```
ไฟล์: src/hooks/useCityBuildings.ts
Input: userAddress, smartWalletAddress
Output: { buildings, allBuildings, loading, error, refresh }
```

**ทำอะไร:**
1. ดึง buildings จาก `DefiCityCore.getUserBuildings()`
2. ดึง Aave positions (Supply + Borrow) เพื่ออัปเดต live amount
3. ดึง APY จาก reserve data (Supply APY สำหรับ bank, Borrow APY สำหรับ borrow)
4. Map contract buildings เป็น UI structure
5. **แยก Supply vs Borrow buildings** ตาม `buildingType`
6. Deduplication: แสดงเฉพาะตึกล่าสุดต่อ (asset + type) combo
7. กรอง active buildings ที่มี amount > 0

**Building Interface:**
```typescript
interface Building {
  id: number
  owner: string
  smartWallet: string
  type: string          // 'townhall' | 'bank' | 'borrow'
  asset: string         // 'USDC' | 'USDT' | 'ETH' | 'WBTC' | 'LINK'
  amount: number
  amountUSD: number
  level: number         // 1-5 based on USD value
  apy: number           // Supply APY หรือ Borrow APY ตาม type
  placedAt: number
  x: number
  y: number
  active: boolean
  isBorrow?: boolean    // true ถ้าเป็น borrow building
}
```

**Building Levels:**
| Level | มูลค่า USD |
|-------|-----------|
| 1 | < $100 |
| 2 | $100 - $499 |
| 3 | $500 - $999 |
| 4 | $1,000 - $1,999 |
| 5 | >= $2,000 |

### 7.13 `useMoveBuilding` - ย้ายตึกบนแผนที่ (UPDATED)

```
ไฟล์: src/hooks/useMoveBuilding.ts
Output: { moveBuilding, loading, error }
```

**ทำอะไร:**
1. **ตรวจสอบ virtual vs on-chain building**
   - ID >= 100000 = virtual (legacy borrow ที่ยังไม่ได้บันทึกบน chain)
   - ID < 100000 = on-chain building
2. **สำหรับ on-chain building:**
   - เรียก `recordDemolition(buildingId)` เพื่อลบตึกเดิม
   - เรียก `recordBuildingPlacement(x, y)` เพื่อสร้างตึกใหม่ที่ตำแหน่งใหม่
3. **สำหรับ virtual building:**
   - ข้าม demolition (ไม่มีบน chain)
   - สร้าง building ใหม่ที่ตำแหน่งใหม่ → กลายเป็น on-chain building

**Batch Transaction:**
```
Smart Wallet executeBatch:
├── [1] Core.recordDemolition(owner, buildingId, 0) -- ถ้า on-chain
└── [2] Core.recordBuildingPlacement(owner, type, asset, 0, newX, newY)
```

---

## 8. Config - ค่า Contract และ Aave

### 8.1 `config/contracts.ts` - Contract Addresses + ABIs

**Contract Addresses (Base Sepolia):**

| Contract | Address | หน้าที่ |
|----------|---------|---------|
| `WALLET_FACTORY` | `0x764f...` | สร้าง Smart Wallet |
| `DEFICITY_CORE` | `0x641a...` | Contract หลักจัดการเมือง |
| `ENTRY_POINT` | `0x5864...` | ERC-4337 EntryPoint |
| `BUILDING_REGISTRY` | `0x4c85...` | ทะเบียนตึก |
| `BANK_ADAPTER` | `0x1630...` | Adapter สำหรับ Aave |
| `AAVE_POOL` | `0x8bAB...` | Aave V3 Pool |
| `AAVE_DATA_PROVIDER` | `0xBc9f...` | Aave Data Provider |

**Token Addresses (Base Sepolia):**

| Token | Address | Decimals |
|-------|---------|----------|
| USDC | `0xba50...` | 6 |
| USDT | `0x0a21...` | 6 |
| ETH (WETH) | `0x4200...` | 18 |
| WBTC | `0x5411...` | 8 |
| LINK | `0x810D...` | 18 |

**ABIs ที่ export:**

| ABI | ฟังก์ชันหลัก |
|-----|-------------|
| `DEFICITY_CORE` | createTownHall, getUserBuildings, recordBuildingPlacement, recordDemolition |
| `SMART_WALLET` | execute, executeBatch |
| `AAVE_POOL` | supply, withdraw, borrow, repay, getUserAccountData |
| `AAVE_DATA_PROVIDER` | getUserReserveData, getReserveData, getReserveCaps |

### 8.2 `config/aave.ts` - Aave Market Config

**Fallback asset prices:**
```typescript
ASSET_PRICES = {
  USDC: 1, USDT: 1, ETH: 3000,
  WBTC: 90000, LINK: 15, cbETH: 3100
}
```

---

## 9. Lib - Utility และ Wagmi Config

### 9.1 `constants.ts` - ค่าคงที่

```typescript
CHAIN_ID = 84532                    // Base Sepolia testnet
RPC_URL = 'https://base-sepolia-rpc.publicnode.com'
PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID
WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
GRID_SIZE = 13                      // ขนาดแผนที่เมือง 13x13
```

### 9.2 `wagmi.ts` - Wagmi Config

ตั้งค่า Wagmi ให้รู้จัก:
- **Chain ไหน**: Base Sepolia
- **เชื่อมต่อ wallet ยังไง**: MetaMask + WalletConnect
- **ส่ง request ไปที่ไหน**: RPC URL

---

## 10. Flow การทำงานทั้งหมด

### Flow 1: User เข้าเว็บครั้งแรก

```
1. User เปิด https://deficity.com/
         ↓
2. Next.js render Landing Page
         ↓
3. User กดปุ่ม "CONNECT" → Redirect ไป /app
```

### Flow 2: Login ด้วย Wallet

```
1. เข้า /app → PrivyProvider + WagmiProvider ถูกโหลด
         ↓
2. User กด "CONNECT WALLET" → เลือก MetaMask
         ↓
3. ได้ address → ดึง Smart Wallet
         ↓
4. ถ้ายังไม่มี → แสดง Modal สร้าง Town Hall
```

### Flow 3: สร้าง Town Hall

```
1. กดปุ่ม "CREATE TOWN HALL"
         ↓
2. DefiCityCore.createTownHall(7, 7)
         ↓
3. Deploy Smart Wallet + สร้าง Town Hall
         ↓
4. แสดง Dashboard + City Map
```

### Flow 4: Supply เข้า Aave (สร้าง Bank Building)

```
1. คลิก tile บน City Map → Build Modal เปิด
         ↓
2. เลือก SUPPLY tab → เลือก asset + ใส่จำนวน
         ↓
3. กดปุ่ม "SUPPLY & BUILD"
         ↓
4. Smart Wallet executeBatch:
   [wrap (ถ้า ETH)] → [approve] → [supply] → [recordBuilding]
         ↓
5. Bank Building (สีเขียว) ปรากฏบน City Map
```

### Flow 5: Borrow จาก Aave (สร้าง Borrow Building)

```
1. คลิก tile บน City Map → Build Modal เปิด
         ↓
2. เลือก BORROW tab → เลือก asset + ใส่จำนวน
   → ต้องมี Supply เป็น collateral ก่อน
   → แสดง Health Factor preview
         ↓
3. กดปุ่ม "BORROW"
         ↓
4. Smart Wallet executeBatch:
   [borrow] → [recordBuildingPlacement]
         ↓
5. Borrow Building (สีแดง) ปรากฏบน City Map
```

### Flow 6: Withdraw จาก Aave

```
1. คลิก Bank Building → SUPPLY tab เปิด
         ↓
2. กดปุ่ม "WITHDRAW" ข้างๆ position
         ↓
3. ถ้าถอนทั้งหมด → demolish building
         ↓
4. เงินกลับมาที่ Smart Wallet (Vault)
```

### Flow 7: Repay เงินยืม

```
1. คลิก Borrow Building → BORROW tab เปิด
         ↓
2. กดปุ่ม "REPAY" ข้างๆ position
         ↓
3. Smart Wallet executeBatch:
   [approve] → [repay] → [recordDemolition (ถ้า repay all)]
         ↓
4. Borrow Building หายไป (ถ้า repay all)
```

### Flow 8: ย้ายตึกบน City Map

```
1. ลากตึกจากตำแหน่งเดิม
         ↓
2. ปล่อยที่ตำแหน่งใหม่
         ↓
3. ถ้า on-chain building (ID < 100000):
   [recordDemolition] → [recordBuildingPlacement]

   ถ้า virtual building (ID >= 100000):
   [recordBuildingPlacement] เท่านั้น
         ↓
4. ตึกแสดงที่ตำแหน่งใหม่
```

---

## 11. Tech Stack ที่ใช้

### Blockchain Stack

```
Privy (@privy-io/react-auth)
  └── จัดการ login/logout ด้วย wallet

Wagmi (wagmi)
  └── React hooks สำหรับอ่าน/เขียน contract

Viem (viem)
  └── library พื้นฐานสำหรับ Ethereum

Ethers.js (ethers)
  └── ใช้ใน hooks สำหรับ Aave integration

React Query (@tanstack/react-query)
  └── cache ข้อมูลจาก blockchain
```

### UI Stack

```
Next.js 16.1.1 (next)
  └── Framework หลัก (routing, SSR, build)

React 19.2.3 (react)
  └── UI library

Tailwind CSS 4 (tailwindcss)
  └── CSS framework

Framer Motion (framer-motion)
  └── Animation library
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
| **Deposit** | `useVaultDeposit.ts` | ฝากเงิน EOA → Vault |
| **Withdraw** | `useVaultWithdraw.ts` | ถอนเงิน Vault → EOA |
| **Aave Supply** | `useAaveSupply.ts` | Supply เข้า Aave + สร้าง bank building |
| **Aave Withdraw** | `useAaveWithdraw.ts` | ถอนจาก Aave + demolish |
| **Aave Borrow** | `useAaveBorrow.ts` | Borrow จาก Aave + สร้าง borrow building |
| **Aave Repay** | `useAaveRepay.ts` | Repay + demolish borrow building |
| **Aave Position** | `useAavePosition.ts` | ดึง position (supply/borrow/HF) |
| **Aave Reserve** | `useAaveReserveData.ts` | ดึง reserve data ครบ |
| **Buildings** | `useCityBuildings.ts` | ดึงตึก (supply + borrow) จาก on-chain |
| **Move** | `useMoveBuilding.ts` | ย้ายตึกบน grid |
| **City Map** | `CityGrid.tsx` | แผนที่เมือง 13x13 + drag-to-move |
| **Aave UI** | `AavePanel.tsx` | UI Supply/Borrow Tabs |
| **Config** | `config/contracts.ts`, `config/aave.ts` | Contract addresses, ABIs |
