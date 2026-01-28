# Frontend Architecture - คู่มืออธิบายโครงสร้าง Frontend ทั้งหมด

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
│   │   ├── AavePanel.tsx        #    หน้าจอจัดการเงินใน Aave (Supply/Withdraw)
│   │   └── index.ts             #    Export รวม
│   ├── game/                    #    Game Components
│   │   └── CityGrid.tsx         #    แผนที่เมือง 13x13 พร้อม drag-to-move
│   ├── ui/                      #    UI Components ทั่วไป
│   │   └── ErrorPopup.tsx       #    Popup แสดง error
│   └── landing/                 #    Components สำหรับ Landing Page
│       ├── LandingPage.tsx      #    หน้า Landing หลัก
│       ├── FeatureCard.tsx      #    การ์ด feature
│       ├── IsometricBuilding.tsx #   ตึก 3D isometric
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
│   ├── useAaveSupply.ts         #    Supply tokens เข้า Aave
│   ├── useAaveWithdraw.ts       #    Withdraw tokens จาก Aave
│   ├── useAavePosition.ts       #    ดึง Position ใน Aave (Supply/Borrow/Health Factor)
│   ├── useAaveMarketData.ts     #    ดึง Market Data (APY) จาก Aave on-chain
│   ├── useAaveReserveData.ts    #    ดึง Reserve Data เต็มรูปแบบ (Cap, LTV, Oracle)
│   ├── useCityBuildings.ts      #    ดึงข้อมูลตึกทั้งหมดจาก on-chain
│   ├── useMoveBuilding.ts       #    ย้ายตึกบนแผนที่
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
           │   ├── Bank Buildings (คลิกเพื่อ Supply/Withdraw)
           │   └── Drag-to-Move (ลาก building เพื่อย้ายตำแหน่ง)
           ├── Build Modal (popup เมื่อคลิก tile)
           │   └── AavePanel (Supply/Withdraw จาก Aave)
           ├── Vault Management (Tabbed Interface)
           │   ├── DEPOSIT Tab (ฝากจาก EOA เข้า Vault)
           │   │   └── รองรับ: ETH, USDC, USDT, WBTC, LINK
           │   └── WITHDRAW Tab (ถอนจาก Vault กลับ EOA)
           │       └── รองรับ: ETH, USDC, USDT, WBTC, LINK
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
│   └── Building tiles (ตึกแต่ละช่อง)
├── Build Modal (popup)
│   └── AavePanel (Supply/Withdraw)
│       └── ErrorPopup (แสดง error)
├── Vault Management (Deposit/Withdraw)
└── Stats (Level, Coins, Land)
```

### CityGrid (`src/components/game/CityGrid.tsx`)

แผนที่เมืองขนาด **13x13 grid** ที่แสดงตึกทั้งหมดของ user:
- **Town Hall** อยู่กลาง grid (ย้ายไม่ได้)
- **Bank Buildings** แสดงตาม asset ที่ supply (USDC, ETH, USDT, WBTC, LINK)
- **Drag-to-Move** ลาก building เพื่อย้ายตำแหน่งบน grid
- **Click Tile** คลิกช่องว่างหรือตึกที่มีอยู่เพื่อเปิด Build Modal
- **Building Levels** (1-5) ขึ้นอยู่กับมูลค่า USD ที่ supply

### AavePanel (`src/components/aave/AavePanel.tsx`)

UI สำหรับจัดการเงินบน Aave Protocol:
- **Supply Tab** - ฝากเงินเข้า Aave เพื่อรับ APY
- **Asset Selection** - เลือก USDC, USDT, ETH, WBTC, LINK
- **Vault Balance Display** - แสดงยอดเงินที่มีใน vault
- **Insufficient Balance Check** - แจ้งเตือนเมื่อยอดไม่พอ
- **Reserve Data Display** - แสดง Supply Cap, APY, Price, LTV, Utilization Rate
- **Pool Full Warning** - แจ้งเตือนเมื่อ pool เต็ม
- **Position Overview** - แสดง Total Supplied, Borrowed, Health Factor
- **Withdraw Button** - ถอนเงินจาก Aave พร้อม demolish building ถ้าถอนทั้งหมด
- **Health Factor Preview** - จำลอง Health Factor ก่อนทำ transaction

### ErrorPopup (`src/components/ui/ErrorPopup.tsx`)

Popup แสดง error แบบ pixel art พร้อมปุ่มปิด

### ErrorBoundary (`src/components/ErrorBoundary.tsx`)

จับ error ไม่ให้เว็บ crash ทั้งหมด ถ้ามี component ใด error จะแสดงหน้า error แทน:
```
"Something went wrong"
[Try Again] [Reload Page]
```

### Pixel Components (Landing Page)

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
1. เรียก `DefiCityCore.createTownHall(7, 7)` (ตรงกลาง grid 13x13)
2. Contract จะ deploy Smart Wallet ใหม่สำหรับ user
3. และสร้างตึก Town Hall ที่ตำแหน่งกลาง
4. return transaction hash

```
กดปุ่ม "CREATE TOWN HALL"
    ↓
เรียก createTownHall(7, 7) บน chain
    ↓
Contract deploy Smart Wallet + สร้าง Town Hall
    ↓
return { walletAddress, buildingId }
```

### 7.3 `useVaultDeposit` - ฝากเงินเข้า Smart Wallet (Vault)

```
ไฟล์: src/hooks/useVaultDeposit.ts
Input: ownerAddress, smartWalletAddress
Output: { deposit, ethBalance, usdcBalance, usdtBalance, wbtcBalance, linkBalance,
          smartWalletEthBalance, smartWalletUsdcBalance, smartWalletUsdtBalance,
          smartWalletWbtcBalance, smartWalletLinkBalance, refetchBalances, ... }
```

**ทำอะไร:** ย้ายเงินจากกระเป๋าส่วนตัว (EOA) เข้าสู่ระบบเมือง (Smart Wallet/Vault)

**รองรับ 5 tokens:**
| Token | วิธีฝาก | Decimals |
|-------|---------|----------|
| ETH | `sendTransaction()` ส่ง ETH ตรง | 18 |
| USDC | `ERC20.transfer()` | 6 |
| USDT | `ERC20.transfer()` | 6 |
| WBTC | `ERC20.transfer()` | 8 |
| LINK | `ERC20.transfer()` | 18 |

**ดึง balance อัตโนมัติ:**
- ETH balance: ใช้ `publicClient.getBalance()` จาก viem
- Token balances: ใช้ `publicClient.readContract(ERC20.balanceOf)`
- ดึงทั้ง EOA balance และ Smart Wallet balance

### 7.4 `useVaultWithdraw` - ถอนเงินจาก Smart Wallet (Vault)

```
ไฟล์: src/hooks/useVaultWithdraw.ts
Input: ownerAddress, smartWalletAddress, refetchBalances
Output: { withdraw, isWithdrawing, isConfirming }
```

**ทำอะไร:** ย้ายเงินจาก Vault กลับคืนเข้ากระเป๋าส่วนตัว (EOA)

1. สำหรับ ETH: เรียก `SmartWallet.execute(owner, amount, "0x")`
2. สำหรับ ERC20: เรียก `SmartWallet.execute(token_addr, 0, encoded_transfer_data)`

Smart Wallet จะเป็นคนส่งเงินออกไปเอง โดยใช้ฟังก์ชัน `execute()` ซึ่งเซ็นลายเซ็นโดย Owner เท่านั้น

### 7.5 `useAaveSupply` - Supply tokens เข้า Aave

```
ไฟล์: src/hooks/useAaveSupply.ts
Input: ไม่มี (ใช้ wallet จาก Privy)
Output: { supply, loading, error }
```

**ทำอะไร:**
1. ตรวจสอบ balance ของ Smart Wallet ว่าพอไหม
2. เรียก BankAdapter.preparePlace() เพื่อเตรียม calldata
3. สำหรับ ETH: เพิ่ม WETH.deposit() ไว้ต้น batch (wrap ETH → WETH)
4. Execute batch transaction ผ่าน Smart Wallet:
   - ETH: `[deposit (wrap), approve, supply, recordBuilding]`
   - ERC20: `[approve, supply, recordBuilding]`
5. ถ้าเป็น upgrade (ตึกมีอยู่แล้ว): ข้าม recordBuilding call

```
Smart Wallet ─── executeBatch ───→ Aave Protocol
     │
     ├── [1] WETH.deposit()         (เฉพาะ ETH: wrap native → WETH)
     ├── [2] Token.approve(pool)    (อนุญาตให้ pool ดึง token)
     ├── [3] Pool.supply(token)     (ฝากเข้า Aave)
     └── [4] Core.recordBuilding()  (บันทึกตึกบน grid - ถ้าสร้างใหม่)
```

**Auto-find position:** ถ้าไม่ระบุ x, y จะหาตำแหน่งว่างรอบ Town Hall โดยอัตโนมัติ

### 7.6 `useAaveWithdraw` - ถอน tokens จาก Aave

```
ไฟล์: src/hooks/useAaveWithdraw.ts
Input: ไม่มี (ใช้ wallet จาก Privy)
Output: { withdraw, loading, error }
```

**ทำอะไร:**
1. เรียก BankAdapter เพื่อเตรียม withdraw calldata
2. Execute batch ผ่าน Smart Wallet:
   - `Pool.withdraw(token, amount, smartWallet)`
3. ถ้าถอนทั้งหมด → demolish buildings ที่เกี่ยวข้อง
4. สำหรับ ETH: unwrap WETH → ETH หลังถอน

### 7.7 `useAavePosition` - ดึง Position ใน Aave

```
ไฟล์: src/hooks/useAavePosition.ts
Input: smartWalletAddress
Output: { position, loading, error, refresh }
```

**ทำอะไร:**
- ดึงข้อมูล position จาก Aave Pool และ Data Provider
- **supplies** - รายการ asset ที่ supply พร้อม amount, USD value, APY
- **borrows** - รายการ asset ที่ borrow
- **totalSuppliedUSD** - มูลค่ารวม supply
- **totalBorrowedUSD** - มูลค่ารวม borrow
- **healthFactor** - Health Factor (ถ้า < 1 จะถูก liquidate)

**Health Factor คืออะไร:**
```
Health Factor = (Total Collateral × Liquidation Threshold) / Total Borrowed

ถ้า HF < 1 → จะถูก liquidate (ถูกยึด collateral)
ถ้า HF > 1 → ปลอดภัย
```

**คำนวณ APY จาก on-chain:**
```
APY = ((1 + rate/RAY/SECONDS_PER_YEAR) ^ SECONDS_PER_YEAR - 1) × 100
```

### 7.8 `useAaveMarketData` - ดึง Market Data จาก Aave

```
ไฟล์: src/hooks/useAaveMarketData.ts
Input: ไม่มี (ใช้ wallet จาก Privy)
Output: { marketData, loading, error, refresh }
```

**ทำอะไร:**
- ดึง Supply APY และ Borrow APY ของแต่ละ asset
- คำนวณ APY แบบ compound interest จาก liquidityRate และ variableBorrowRate
- รองรับ: USDC, USDT, ETH

### 7.9 `useAaveReserveData` - ดึง Reserve Data เต็มรูปแบบ

```
ไฟล์: src/hooks/useAaveReserveData.ts
Input: ไม่มี (ใช้ wallet จาก Privy)
Output: { reserveData, loading, error, getOraclePrice, isPoolFull, refresh }
```

**ทำอะไร:** ดึงข้อมูล reserve ครบถ้วนจาก Aave V3 on-chain

| ข้อมูล | คำอธิบาย |
|--------|----------|
| `totalSupplied` / `supplyCap` | จำนวนที่ supply แล้ว / cap สูงสุด |
| `supplyAPY` / `borrowAPY` | อัตราดอกเบี้ย (compound interest) |
| `ltv` | Loan-to-Value ratio |
| `liquidationThreshold` | เกณฑ์ liquidation |
| `oraclePrice` | ราคาจาก Aave Oracle (USD) |
| `utilizationRate` | อัตราการใช้งาน pool |
| `isPoolFull` | pool เต็มหรือไม่ (>99.9% ของ cap) |
| `canBeCollateral` | ใช้เป็น collateral ได้ไหม |

- **Auto-refresh** ทุก 30 วินาที
- รองรับ: USDC, USDT, ETH, WBTC, LINK

### 7.10 `useCityBuildings` - ดึงข้อมูลตึกจาก On-chain

```
ไฟล์: src/hooks/useCityBuildings.ts
Input: userAddress, smartWalletAddress
Output: { buildings, allBuildings, loading, error, refresh }
```

**ทำอะไร:**
1. ดึง buildings จาก `DefiCityCore.getUserBuildings()`
2. ดึง Aave positions เพื่ออัปเดตจำนวนเงินจริง (live amount)
3. ดึง APY จาก reserve data
4. Map contract buildings เป็น UI structure พร้อม level (1-5)
5. Deduplication: แสดงเฉพาะตึกล่าสุด (highest ID) ต่อ asset
6. กรอง active buildings ที่มี amount > 0

**Building Levels:**
| Level | มูลค่า USD |
|-------|-----------|
| 1 | < $100 |
| 2 | $100 - $499 |
| 3 | $500 - $999 |
| 4 | $1,000 - $1,999 |
| 5 | >= $2,000 |

### 7.11 `useMoveBuilding` - ย้ายตึกบนแผนที่

```
ไฟล์: src/hooks/useMoveBuilding.ts
Input: ไม่มี
Output: { moveBuilding, loading }
```

**ทำอะไร:**
1. เรียก `DefiCityCore.moveBuilding(buildingId, newX, newY)` ผ่าน Smart Wallet
2. อัปเดตตำแหน่งตึกบน on-chain grid

### 7.12 `useContracts` - สร้าง Contract Instances

```
ไฟล์: src/hooks/useContracts.ts
Input: ไม่มี (ใช้ wallet จาก Privy)
Output: { getContracts }
```

**ทำอะไร:** สร้าง ethers.js contract instances สำหรับ BankAdapter, BuildingRegistry, DefiCityCore, etc.

---

## 8. Config - ค่า Contract และ Aave

### 8.1 `config/contracts.ts` - Contract Addresses + ABIs

รวม **ที่อยู่ contract** และ **ABI** ทั้งหมดไว้ในไฟล์เดียว

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
| `AAVE_POOL_ADDRESSES_PROVIDER` | `0xE4C2...` | Aave Addresses Provider |

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
| `WALLET_FACTORY` | createWallet, createOrGetWallet |
| `DEFICITY_CORE` | createTownHall, getUserBuildings, moveBuilding |
| `SMART_WALLET` | execute, executeBatch |
| `BUILDING_REGISTRY` | preparePlace |
| `BANK_ADAPTER` | preparePlace |
| `ERC20` | balanceOf, approve, transfer |
| `AAVE_POOL` | supply, withdraw, borrow, repay, getUserAccountData |
| `AAVE_DATA_PROVIDER` | getUserReserveData, getReserveData, getReserveCaps, getReserveConfigurationData |
| `AAVE_ORACLE` | getAssetPrice, BASE_CURRENCY_UNIT |
| `AAVE_POOL_ADDRESSES_PROVIDER` | getPriceOracle, getPool |

### 8.2 `config/aave.ts` - Aave Market Config

**Fallback asset prices (ใช้เมื่อ Oracle ไม่พร้อม):**
```typescript
ASSET_PRICES = {
  USDC: 1, USDT: 1, ETH: 3000,
  WBTC: 90000, LINK: 15, cbETH: 3100
}
```

**Aave Market Data:** ข้อมูล fallback สำหรับ APY, LTV, Liquidation Threshold ของแต่ละ asset

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
- **เชื่อมต่อ wallet ยังไง**: MetaMask (injected) + WalletConnect
- **ส่ง request ไปที่ไหน**: RPC URL

### 9.3 `contracts/` - Legacy Contract Config

ที่อยู่ contract และ ABI แบบเดิม (ใช้ร่วมกับ `config/contracts.ts`):
- `addresses.ts` - ที่อยู่แบบ typed (`0x${string}`)
- `abis/ERC20.ts` - ABI ของ ERC20
- `abis/SmartWallet.ts` - ABI ของ Smart Wallet
- `abis/SimpleWalletFactory.ts` - ABI ของ WalletFactory + DefiCityCore

### 9.4 `utils.ts` - Utility

มีฟังก์ชัน `cn()` สำหรับรวม CSS class:
```typescript
cn('text-red', isActive && 'font-bold', className)
// → "text-red font-bold custom-class"
```

---

## 10. Flow การทำงานทั้งหมด

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
3. Privy ready, ยังไม่ authenticated → แสดงปุ่ม "CONNECT WALLET"
              ↓
4. User กด "CONNECT WALLET" → Privy เปิด popup ให้เลือก wallet
              ↓
5. User เลือก MetaMask → MetaMask popup ขึ้น → กด approve
              ↓
6. authenticated = true, ได้ address
              ↓
7. ดึงข้อมูล Smart Wallet → ถ้ายังไม่มี แสดง Modal สร้าง Town Hall
```

### Flow 3: สร้าง Town Hall (ครั้งแรก)

```
1. ไม่มี Smart Wallet → แสดง Modal บังคับ (fullscreen overlay)
              ↓
2. User กดปุ่ม "CREATE TOWN HALL"
              ↓
3. เรียก DefiCityCore.createTownHall(7, 7) (กลาง grid 13x13)
              ↓
4. MetaMask popup → user confirm transaction
              ↓
5. Transaction ส่งไป Base Sepolia → contract deploy Smart Wallet
              ↓
6. refetch ข้อมูล Smart Wallet
              ↓
7. แสดง Dashboard เต็ม + City Map พร้อม Town Hall ตรงกลาง
```

### Flow 4: ฝากเงินเข้า Vault (Deposit)

```
1. User เลือก token (ETH, USDC, USDT, WBTC, LINK)
              ↓
2. User ใส่จำนวน
   → ถ้ายอดไม่พอ → แสดง "INSUFFICIENT [TOKEN] BALANCE" (ปุ่ม disabled)
              ↓
3. User กดปุ่ม "DEPOSIT TO VAULT"
              ↓
4. ถ้า ETH → ส่ง ETH ตรงจาก MetaMask ไป Smart Wallet
   ถ้า ERC20 → เรียก Token.transfer() ไป Smart Wallet
              ↓
5. MetaMask popup → user confirm
              ↓
6. Transaction ส่งไป chain → รอ confirm
              ↓
7. รอ 2 วินาที → refetch balance ใหม่
```

### Flow 5: ถอนเงินจาก Vault (Withdraw)

```
1. User เลือก token + ใส่จำนวน
   → ถ้ายอดไม่พอ → แสดง "INSUFFICIENT [TOKEN] IN VAULT" (ปุ่ม disabled)
              ↓
2. กดปุ่ม "WITHDRAW TO WALLET"
              ↓
3. เรียก SmartWallet.execute() ให้ Smart Wallet ส่งเงินกลับ EOA
              ↓
4. MetaMask popup → user confirm
              ↓
5. Smart Wallet ส่งเงินไปที่ EOA address
              ↓
6. refetch balance ใหม่
```

### Flow 6: Supply เข้า Aave (สร้าง/อัปเกรด Bank Building)

```
1. User คลิก tile บน City Map
              ↓
2. Build Modal เปิดขึ้น → แสดง AavePanel
              ↓
3. User เลือก asset + ใส่จำนวน
   → แสดง Reserve Data (APY, Supply Cap, Oracle Price, LTV)
   → ถ้า pool เต็ม → แสดง "SUPPLY CAP REACHED" (ปุ่ม disabled)
   → ถ้ายอดไม่พอ → แสดง "INSUFFICIENT [TOKEN] IN VAULT"
              ↓
4. กดปุ่ม "SUPPLY & BUILD" (สร้างใหม่) หรือ "SUPPLY MORE" (อัปเกรด)
              ↓
5. Smart Wallet execute batch:
   [wrap ETH (ถ้า ETH)] → [approve] → [supply to Aave] → [record building (ถ้าสร้างใหม่)]
              ↓
6. Transaction confirm → refetch buildings + balances
              ↓
7. Building ปรากฏบน City Map (หรือ level เพิ่มขึ้น)
```

### Flow 7: Withdraw จาก Aave (ถอน + ทำลายตึก)

```
1. User คลิกตึกที่มีอยู่ → Build Modal เปิด
              ↓
2. เห็น position ปัจจุบัน → กดปุ่ม "WITHDRAW" ข้างๆ asset
              ↓
3. ถ้าถอนทั้งหมด (>99%) → demolish buildings ที่เกี่ยวข้อง
   ถ้าถอนบางส่วน → ไม่ demolish (แค่ลด amount)
              ↓
4. Smart Wallet execute: Aave Pool.withdraw()
              ↓
5. เงินกลับมาที่ Smart Wallet (Vault)
              ↓
6. refetch buildings + positions → ตึกหายจาก map (ถ้า demolish)
```

### Flow 8: ย้ายตึกบน City Map

```
1. User ลากตึก (drag) จากตำแหน่งเดิม
              ↓
2. ปล่อยที่ตำแหน่งใหม่ (drop) บน tile ว่าง
              ↓
3. เรียก DefiCityCore.moveBuilding(buildingId, newX, newY) ผ่าน Smart Wallet
              ↓
4. MetaMask popup → confirm
              ↓
5. refetch buildings → ตึกแสดงที่ตำแหน่งใหม่
```

---

## 11. Tech Stack ที่ใช้

### Blockchain Stack

```
Privy (@privy-io/react-auth v3.10.2)
  └── จัดการ login/logout ด้วย wallet
      └── ให้ authenticated, login(), logout()

Wagmi (wagmi v3.3.2)
  └── อ่าน/เขียน smart contract จาก React
      └── useWriteContract, useSendTransaction, ...

Viem (viem v2.44.2)
  └── library พื้นฐานสำหรับ Ethereum
      └── createPublicClient, parseEther, formatUnits, ...

Ethers.js (ethers - peer dependency)
  └── ใช้ใน hooks สำหรับ Aave integration
      └── Contract, BrowserProvider, AbiCoder, ...

React Query (@tanstack/react-query v5.90.16)
  └── cache ข้อมูลจาก blockchain
      └── ไม่ต้อง fetch ซ้ำๆ ถ้าข้อมูลยังใหม่อยู่
```

### UI Stack

```
Next.js 16.1.1 (next)
  └── Framework หลัก (routing, SSR, build)

React 19.2.3 (react)
  └── UI library (components, hooks, state)

Tailwind CSS 4 (tailwindcss)
  └── CSS framework (class-based styling)
      └── เช่น "text-amber-400 text-sm bg-slate-900"

Framer Motion 12.26.2 (framer-motion)
  └── Animation library
      └── เช่น scroll animation, hover effects

Lucide React + React Icons
  └── Icon libraries
```

### ความสัมพันธ์ระหว่าง Privy, Wagmi, Viem, Ethers

```
              User กดปุ่ม
                  │
                  ▼
┌─────────────────────────────┐
│         Privy                │  ← จัดการ login + ให้ wallet provider
│   "user ใช้ wallet ไหน?"    │
│   "authenticated หรือยัง?"  │
└──────────┬──────────────────┘
           │ ได้ wallet address + provider
           ▼
┌─────────────────────────────┐     ┌──────────────────────────┐
│         Wagmi                │     │       Ethers.js          │
│   useSendTransaction()      │     │  new Contract(addr, abi) │
│   useWriteContract()        │     │  signer.sendTransaction  │
│   React hooks สำหรับ chain   │     │  ใช้ใน Aave hooks       │
└──────────┬──────────────────┘     └──────────┬───────────────┘
           │ ใช้ viem ข้างใน                    │
           ▼                                    │
┌─────────────────────────────┐                │
│         Viem                 │  ←─────────────┘
│   createPublicClient()       │
│   parseEther(), formatUnits()│
│   encodeFunctionData()       │
│   ส่ง request ไปหา RPC node │
└──────────┬──────────────────┘
           │ HTTP request
           ▼
┌─────────────────────────────┐
│    Base Sepolia (blockchain) │
│    Smart Contracts:          │
│    ├── DefiCityCore          │
│    ├── SmartWallet           │
│    ├── BankAdapter           │
│    ├── BuildingRegistry      │
│    ├── Aave Pool             │
│    └── ERC20 Tokens          │
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
| **Deposit** | `useVaultDeposit.ts` | ฝากเงิน EOA → Vault (5 tokens) |
| **Withdraw** | `useVaultWithdraw.ts` | ถอนเงิน Vault → EOA (5 tokens) |
| **Aave Supply** | `useAaveSupply.ts` | Supply เข้า Aave + สร้างตึก |
| **Aave Withdraw** | `useAaveWithdraw.ts` | ถอนจาก Aave + demolish ตึก |
| **Aave Position** | `useAavePosition.ts` | ดึง position (supply/borrow/HF) |
| **Aave Market** | `useAaveMarketData.ts` | ดึง APY จาก on-chain |
| **Aave Reserve** | `useAaveReserveData.ts` | ดึง reserve data ครบ (cap, oracle, LTV) |
| **Buildings** | `useCityBuildings.ts` | ดึงตึกจาก on-chain + live amounts |
| **Move** | `useMoveBuilding.ts` | ย้ายตึกบน grid |
| **City Map** | `CityGrid.tsx` | แผนที่เมือง 13x13 + drag-to-move |
| **Aave UI** | `AavePanel.tsx` | UI Supply/Withdraw + reserve info |
| **Config** | `config/contracts.ts`, `config/aave.ts` | Contract addresses, ABIs, Aave config |
| **Legacy Config** | `lib/contracts/` | Contract addresses + ABIs (เดิม) |
| **UI** | `components/landing/*` | หน้า Landing |
| **Style** | `globals.css` | Tailwind + theme |
