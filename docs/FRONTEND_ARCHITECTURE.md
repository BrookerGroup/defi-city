# Frontend Architecture - คู่มืออธิบายโครงสร้าง Frontend ทั้งหมด

**Version: 3.0** - รองรับ PixiJS Game Engine + Aave + Uniswap V3 + Megapot Lottery + LP

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
│       └── page.tsx             #    หน้า Game Dashboard (URL: /app)
│
├── components/                   # ← ชิ้นส่วน UI ที่แยกออกมา reuse ได้
│   ├── ErrorBoundary.tsx        #    จับ error ไม่ให้เว็บ crash
│   ├── providers/               #    Provider components
│   │   ├── index.tsx            #    รวม providers (ErrorBoundary + Toaster)
│   │   ├── PrivyProvider.tsx    #    ตั้งค่า Privy (login wallet)
│   │   └── WagmiProvider.tsx    #    ตั้งค่า Wagmi + React Query
│   │
│   ├── game/                    #    ★ Game Engine + UI (PixiJS)
│   │   ├── GameCanvas.tsx       #    PixiJS Application wrapper (WebGL canvas)
│   │   ├── GameWorld.ts         #    Game state & world logic
│   │   ├── IsometricGrid.ts    #    Grid/tile management (13x13)
│   │   ├── TileInteraction.ts  #    Click/selection interaction handling
│   │   ├── BuildingRenderer.ts #    Render buildings on isometric grid
│   │   ├── Animations.ts       #    Animation utilities
│   │   ├── useGameState.ts     #    Game state hook (camera, selection, drag)
│   │   └── ui/                  #    Game UI panels (overlay on canvas)
│   │       ├── GameHUD.tsx      #    Top HUD (wallet balance, buttons)
│   │       ├── BottomBar.tsx    #    Bottom bar (building count, drag-to-build)
│   │       ├── BuildPanel.tsx   #    Manage existing building (harvest, upgrade)
│   │       ├── BuildingDialog.tsx #  New supply/borrow building creation
│   │       ├── VaultPanel.tsx   #    Deposit/withdraw + swap tokens
│   │       ├── LotteryDialog.tsx #   Megapot lottery ticket + LP management
│   │       ├── TownHallModal.tsx #   Initial town hall creation (first time)
│   │       ├── TownHallInfoPanel.tsx # View town hall stats
│   │       └── TransactionHistoryPanel.tsx # Transaction history viewer
│   │
│   ├── aave/                    #    Aave Protocol UI
│   │   ├── AavePanel.tsx        #    หน้าจอจัดการเงินใน Aave (Supply/Borrow/Withdraw/Repay)
│   │   └── index.ts
│   ├── lp/                      #    ★ Uniswap V3 LP UI
│   │   ├── LPPanel.tsx          #    LP position display
│   │   ├── LPBuildingPanel.tsx  #    LP building management
│   │   └── index.ts
│   ├── swap/                    #    ★ Uniswap V3 Swap UI
│   │   ├── SwapPanel.tsx        #    Token swap interface
│   │   └── index.ts
│   ├── lottery/                 #    ★ Megapot Lottery UI
│   │   ├── LotteryPanel.tsx     #    Lottery ticket buying
│   │   ├── LotteryLPPanel.tsx   #    Megapot LP management
│   │   └── index.ts
│   │
│   ├── ui/                      #    UI Components ทั่วไป
│   │   └── ErrorPopup.tsx       #    Popup แสดง error
│   │
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
├── config/                       # ← Contract + Aave Configuration
│   ├── aave.ts                  #    ราคา asset, ข้อมูล Aave market
│   └── contracts.ts             #    Contract addresses, ABIs, chain config
│
├── hooks/                        # ← Custom Hooks (logic blockchain) - 27 hooks
│   ├── index.ts                 #    Export รวม
│   │
│   │  ── Smart Account / Wallet ──
│   ├── useSmartWallet.ts        #    ดึง Smart Wallet address
│   ├── useCreateSmartAccount.ts #    สร้าง Town Hall (deploy wallet)
│   │
│   │  ── Vault (Deposit/Withdraw) ──
│   ├── useVaultDeposit.ts       #    ฝากเงินจาก EOA เข้า Smart Wallet
│   ├── useVaultWithdraw.ts      #    ถอนเงินจาก Smart Wallet กลับ EOA
│   │
│   │  ── Aave Protocol ──
│   ├── useAaveSupply.ts         #    Supply tokens เข้า Aave + สร้าง bank building
│   ├── useAaveWithdraw.ts       #    Withdraw tokens จาก Aave + demolish building
│   ├── useAaveBorrow.ts         #    Borrow tokens จาก Aave + สร้าง borrow building
│   ├── useAaveRepay.ts          #    Repay borrowed tokens + demolish borrow building
│   ├── useAavePosition.ts       #    ดึง Position ใน Aave (Supply/Borrow/Health Factor)
│   ├── useAaveMarketData.ts     #    ดึง Market Data (APY) จาก Aave on-chain
│   ├── useAaveReserveData.ts    #    ดึง Reserve Data เต็มรูปแบบ
│   ├── useAaveHarvest.ts        #    ★ Harvest yields จาก Aave
│   │
│   │  ── City Buildings ──
│   ├── useCityBuildings.ts      #    ดึงข้อมูลตึกทั้งหมดจาก on-chain
│   ├── useMoveBuilding.ts       #    ย้ายตึกบนแผนที่
│   │
│   │  ── Uniswap V3 ──
│   ├── useUniswapSwap.ts        #    ★ Swap tokens ผ่าน Uniswap V3
│   ├── useUniswapLP.ts          #    ★ ดึงข้อมูล LP positions
│   ├── useUniswapLPBuild.ts     #    ★ สร้าง LP position ใหม่
│   │
│   │  ── Megapot Lottery ──
│   ├── useLotteryData.ts        #    ★ ดึง global lottery data (pot, round)
│   ├── useLotteryPosition.ts    #    ★ ดึง user lottery position
│   ├── useLotteryBuyTickets.ts  #    ★ ซื้อ lottery tickets
│   ├── useLotteryClaimWinnings.ts #  ★ ถอนเงินรางวัล lottery
│   ├── useLotteryRunJackpot.ts  #    ★ Run jackpot (testnet only)
│   ├── useLotteryHistory.ts     #    ★ ดึงประวัติ lottery draws
│   │
│   │  ── Megapot LP ──
│   ├── useMegapotLPPosition.ts  #    ★ ดึง LP position ใน Megapot
│   ├── useMegapotLPDeposit.ts   #    ★ ฝากเงินเข้า Megapot LP pool
│   ├── useMegapotLPWithdraw.ts  #    ★ ถอนเงินจาก Megapot LP pool
│   │
│   │  ── Utility ──
│   └── useTransactionHistory.ts #    ดึงประวัติ transactions จาก BaseScan API
│
└── lib/                          # ← Utility และ Config
    ├── constants.ts             #    ค่าคงที่ (chain, RPC, GRID_SIZE, Megapot)
    ├── utils.ts                 #    utility function (cn)
    ├── wagmi.ts                 #    ตั้งค่า Wagmi config
    ├── isometric.ts             #    ★ คำนวณ isometric projection
    ├── mapLayout.ts             #    ★ Grid layout generation
    └── contracts/               #    Contract addresses + ABIs (legacy)
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
Route /app  →  Game Dashboard (ต้อง login ด้วย wallet)
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
2. แล้ว render page.tsx (Game Dashboard)
```

---

## 4. Layout และ Provider - ระบบห่อหุ้ม

Layout คือ "กรอบ" ที่ห่อหุ้ม page ข้างใน มันทำงานแบบ **ซ้อนกัน** (nested)

### ลำดับการห่อหุ้ม

```
┌─── Root Layout (src/app/layout.tsx) ──────────────────────┐
│  - ตั้งค่า <html>, <body>                                  │
│  - โหลด font: Geist Sans, Geist Mono, Press Start 2P      │
│  - ห่อด้วย <Providers> (ErrorBoundary + Toaster)           │
│  - ใช้ dark mode (className="dark")                        │
│                                                             │
│  ┌─── App Layout (src/app/app/layout.tsx) ──────────┐      │
│  │  - ห่อด้วย <PrivyProvider> → ระบบ login wallet    │      │
│  │  - ห่อด้วย <WagmiProvider> → ระบบอ่าน/เขียน chain │      │
│  │                                                    │      │
│  │  ┌─── App Page (src/app/app/page.tsx) ────┐       │      │
│  │  │  Game Dashboard + PixiJS Canvas         │       │      │
│  │  │  + UI Panels (HUD, Bottom Bar, etc.)   │       │      │
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
    <QueryClientProvider> ← ทำให้ลูกทุกตัวใช้ React Query ได้
      <App Page />        ← ใช้ได้ทั้ง Privy, Wagmi, React Query
    </QueryClientProvider>
  </WagmiProvider>
</PrivyProvider>
```

### ไฟล์: `src/components/providers/PrivyProvider.tsx`

ตั้งค่า Privy สำหรับ wallet login:
- **Chain**: Base Sepolia (testnet)
- **Login**: wallet only (ไม่มี email, social login)
- **Embedded Wallet**: ปิด (ใช้ wallet ของ user เช่น MetaMask)
- **Theme**: Dark mode, amber accent (#F59E0B)
- **ต้องการ**: `NEXT_PUBLIC_PRIVY_APP_ID` ใน `.env`

### ไฟล์: `src/components/providers/WagmiProvider.tsx`

ตั้งค่า Wagmi + React Query สำหรับอ่าน/เขียน blockchain:
- **Chain**: Base Sepolia
- **Connectors**: MetaMask (injected), WalletConnect
- **Transport**: HTTP RPC
- **React Query**: สำหรับ cache ข้อมูล blockchain

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

หน้า Game Dashboard หลัก **ต้อง login** ด้วย wallet

**หน้านี้มีหลายสถานะ (state) ที่แสดงผลต่างกัน:**

```
สถานะ 1: กำลังโหลด Privy
         → แสดง "LOADING..." (pixel bounce animation)

สถานะ 2: ยังไม่ login
         → แสดงปุ่ม "CONNECT WALLET" ให้กด login

สถานะ 3: Login แล้ว แต่ยังไม่ได้ wallet address
         → แสดง "CONNECTING WALLET..." (รอ wallet popup)

สถานะ 4: มี wallet address แล้ว แต่ยังไม่มี Smart Wallet
         → แสดง TownHallModal บังคับสร้าง Town Hall

สถานะ 5: มี Smart Wallet แล้ว
         → แสดง Game Dashboard เต็ม:

           ┌─── Full-screen PixiJS Game Canvas ──────────────────────┐
           │                                                          │
           │  ┌── GameHUD (sticky top) ────────────────────────┐     │
           │  │  WALLET balance + VAULT balance                 │     │
           │  │  (ETH, USDC, USDT, WBTC, LINK, MPUSDC)        │     │
           │  │  [Vault] [Swap] [History] [Logout] buttons     │     │
           │  └─────────────────────────────────────────────────┘     │
           │                                                          │
           │  ┌── Isometric City Map (PixiJS) ─────────────────┐     │
           │  │  Town Hall (center, immovable)                  │     │
           │  │  Bank Buildings (green - Aave Supply)           │     │
           │  │  Borrow Buildings (red - Aave Borrow)           │     │
           │  │  LP Buildings (blue - Uniswap V3 LP)            │     │
           │  │  Lottery Buildings (purple - Megapot)            │     │
           │  │  Zoom/Pan camera controls                       │     │
           │  └─────────────────────────────────────────────────┘     │
           │                                                          │
           │  ┌── BottomBar (sticky bottom) ───────────────────┐     │
           │  │  Building count | Camera controls               │     │
           │  │  Drag-to-build buttons:                         │     │
           │  │  [Supply] [Borrow] [LP] [Lottery] [Megapot LP] │     │
           │  └─────────────────────────────────────────────────┘     │
           │                                                          │
           │  ── Overlay Panels (shown on interaction) ──            │
           │  VaultPanel → Deposit/Withdraw/Swap tokens              │
           │  BuildingDialog → Supply/Borrow new building            │
           │  BuildPanel → Manage existing building (harvest)        │
           │  LotteryDialog → Buy tickets / Manage Megapot LP       │
           │  TownHallInfoPanel → City stats overview                │
           │  TransactionHistoryPanel → On-chain tx history          │
           └──────────────────────────────────────────────────────────┘
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

// 4. Hook สำหรับ Vault (รองรับ 6 tokens)
const {
  deposit, ethBalance, usdcBalance, usdtBalance, wbtcBalance, linkBalance, mpusdcBalance,
  smartWalletEthBalance, smartWalletUsdcBalance, ...
  refetchBalances
} = useVaultDeposit(address, smartWallet)
const { withdraw } = useVaultWithdraw(address, smartWallet, refetchBalances)

// 5. Hook สำหรับ City Buildings
const { buildings, allBuildings, refresh } = useCityBuildings(address, smartWallet)
const { moveBuilding } = useMoveBuilding()

// 6. Hook สำหรับ Aave
const { supply } = useAaveSupply()
const { withdraw: aaveWithdraw } = useAaveWithdraw()
const { borrow } = useAaveBorrow()
const { repay } = useAaveRepay()
const { harvest } = useAaveHarvest()
const { position } = useAavePosition(smartWallet)
const { reserveData } = useAaveReserveData()

// 7. Hook สำหรับ Uniswap V3
const { swap } = useUniswapSwap()
const { positions: lpPositions } = useUniswapLP()
const { buildLP } = useUniswapLPBuild()

// 8. Hook สำหรับ Megapot Lottery
const { lotteryData } = useLotteryData()
const { lotteryPosition } = useLotteryPosition()
const { buyTickets } = useLotteryBuyTickets()
const { claimWinnings } = useLotteryClaimWinnings()

// 9. Hook สำหรับ Megapot LP
const { megapotLPPosition } = useMegapotLPPosition()
const { depositToMegapotLP } = useMegapotLPDeposit()
const { withdrawFromMegapotLP } = useMegapotLPWithdraw()

// 10. Game State (PixiJS)
const gameState = useGameState()  // camera, selection, drag interactions
```

---

## 6. Components - ชิ้นส่วน UI

### Component คืออะไร?

Component เป็น "ชิ้นส่วน UI ที่ reuse ได้" เหมือนตัวต่อ Lego

### 6.1 Game Engine (`src/components/game/`)

ระบบ Game Engine ใช้ **PixiJS** (2D WebGL rendering) สำหรับแสดง isometric city

```
GameCanvas.tsx          ← PixiJS Application container (full-screen WebGL canvas)
    ↓ สร้าง
GameWorld.ts            ← จัดการ game state, world logic ทั้งหมด
    ↓ ใช้
IsometricGrid.ts        ← ระบบ grid 13x13 + isometric projection (2D → 3D illusion)
BuildingRenderer.ts     ← วาด buildings บน grid (แต่ละ type สีต่างกัน)
TileInteraction.ts      ← จัดการ click/tap/selection บน tile
Animations.ts           ← Animation effects (building transitions, effects)
useGameState.ts         ← React hook เก็บ state ของ camera, selection, drag
```

**PixiJS ทำอะไร?**
- Render กราฟิก 2D แบบ real-time ด้วย WebGL
- รองรับ zoom/pan camera ได้ smooth
- วาด isometric grid + buildings ได้ performant กว่า HTML/CSS
- จัดการ interaction (click, drag) บน canvas

### 6.2 Game UI Panels (`src/components/game/ui/`)

UI panels ที่แสดง overlay บน PixiJS canvas:

| Component | หน้าที่ |
|-----------|---------|
| `GameHUD.tsx` | Top bar แสดง wallet/vault balance, ปุ่ม toggle panels |
| `BottomBar.tsx` | Bottom bar แสดง building count, camera controls, drag-to-build buttons |
| `BuildPanel.tsx` | จัดการ building ที่มีอยู่ (harvest, upgrade, demolish) |
| `BuildingDialog.tsx` | สร้าง building ใหม่ (Supply/Borrow จาก Aave) |
| `VaultPanel.tsx` | ฝาก/ถอนเงิน + swap tokens ผ่าน Uniswap V3 |
| `LotteryDialog.tsx` | ซื้อ lottery tickets + จัดการ Megapot LP |
| `TownHallModal.tsx` | Modal สร้าง Town Hall ครั้งแรก (fullscreen overlay) |
| `TownHallInfoPanel.tsx` | แสดง stats ของ Town Hall (total buildings, etc.) |
| `TransactionHistoryPanel.tsx` | แสดงประวัติ transactions จาก BaseScan |

### 6.3 Feature Components

#### AavePanel (`src/components/aave/AavePanel.tsx`)

UI สำหรับจัดการเงินบน Aave Protocol:

**Tabs:**
- **SUPPLY Tab** (สีเขียว) - ฝากเงินเข้า Aave เพื่อรับ APY
- **BORROW Tab** (สีส้ม) - ยืมเงินจาก Aave โดยใช้ supply เป็น collateral

**Features:**
- **Asset Selection** - เลือก USDC, USDT, ETH, WBTC, LINK
- **Vault Balance Display** - แสดงยอดเงินที่มีใน vault
- **Reserve Data Display** - แสดง Supply/Borrow Cap, APY, Price, LTV, Utilization
- **Health Factor Preview** - จำลอง Health Factor ก่อนทำ transaction
- **Withdraw/Repay Buttons** - ถอนเงินหรือชำระเงินยืม

#### LP Components (`src/components/lp/`)

| Component | หน้าที่ |
|-----------|---------|
| `LPPanel.tsx` | แสดงรายการ LP positions ที่มีอยู่ |
| `LPBuildingPanel.tsx` | จัดการ LP building (increase/decrease liquidity, collect fees) |

#### SwapPanel (`src/components/swap/SwapPanel.tsx`)

Token swap interface ผ่าน Uniswap V3:
- เลือก token คู่ (tokenIn / tokenOut)
- ใส่จำนวน → ดู quote
- กด swap → execute ผ่าน Smart Wallet

#### Lottery Components (`src/components/lottery/`)

| Component | หน้าที่ |
|-----------|---------|
| `LotteryPanel.tsx` | ซื้อ lottery tickets, ดูสถานะ jackpot, ถอนเงินรางวัล |
| `LotteryLPPanel.tsx` | ฝาก/ถอน Megapot LP, ดู LP position + risk percentage |

### 6.4 Landing Page Components (`src/components/landing/`)

- `LandingPage.tsx` - Container หลัก
- **Sections**: Hero, Concept, Strategies, Features, CTA, Footer
- **Pixel Art**: PixelBackground, PixelButton, PixelCard, BuildingIcon

### 6.5 Utility Components

- `ErrorBoundary.tsx` - จับ error ไม่ให้เว็บ crash ทั้งหมด
- `ErrorPopup.tsx` - Popup แสดง error แบบ pixel art

---

## 7. Hooks - Logic ฝั่ง Blockchain

### Hook คืออะไร?

Hook เป็นฟังก์ชันพิเศษของ React ที่ชื่อขึ้นต้นด้วย `use` ใช้สำหรับ:
- เก็บ state (`useState`)
- ทำงานตอน component โหลด (`useEffect`)
- แยก logic ออกจาก UI ให้สะอาด

### สรุป Hooks ทั้งหมด (27 hooks)

#### Smart Account / Wallet

| Hook | Input | Output | หน้าที่ |
|------|-------|--------|---------|
| `useSmartWallet` | ownerAddress | `{ smartWallet, hasSmartWallet, refetch }` | ดึง Smart Wallet address จาก DefiCityCore |
| `useCreateSmartAccount` | - | `{ createSmartAccount, isPending, hash }` | สร้าง Town Hall + deploy Smart Wallet |

#### Vault (Deposit/Withdraw)

| Hook | Input | Output | หน้าที่ |
|------|-------|--------|---------|
| `useVaultDeposit` | owner, smartWallet | `{ deposit, balances, refetchBalances }` | ฝากเงิน EOA → Smart Wallet (ETH, USDC, USDT, WBTC, LINK, MPUSDC) |
| `useVaultWithdraw` | owner, smartWallet, refetchFn | `{ withdraw, isWithdrawing }` | ถอนเงิน Smart Wallet → EOA |

**รองรับ 6 tokens:**

| Token | วิธีฝาก | Decimals |
|-------|---------|----------|
| ETH | `sendTransaction()` ส่ง ETH ตรง | 18 |
| USDC | `ERC20.transfer()` | 6 |
| USDT | `ERC20.transfer()` | 6 |
| WBTC | `ERC20.transfer()` | 8 |
| LINK | `ERC20.transfer()` | 18 |
| MPUSDC | `ERC20.transfer()` | 6 |

#### Aave Protocol

| Hook | หน้าที่ | Batch Transaction |
|------|---------|-------------------|
| `useAaveSupply` | Supply เข้า Aave + สร้าง bank building | `[wrap?] → [approve] → [supply] → [recordBuilding]` |
| `useAaveWithdraw` | ถอนจาก Aave + demolish | `[withdraw] → [unwrap?] → [recordDemolition]` |
| `useAaveBorrow` | Borrow จาก Aave + สร้าง borrow building | `[borrow] → [recordBuildingPlacement]` |
| `useAaveRepay` | Repay + demolish borrow building | `[approve] → [repay] → [recordDemolition?]` |
| `useAaveHarvest` | Harvest yields จาก Aave | ดึง interest ที่สะสมมา |
| `useAavePosition` | ดึง position (supply/borrow/HF) | Read-only |
| `useAaveMarketData` | ดึง Market Data (APY) | Read-only |
| `useAaveReserveData` | ดึง Reserve Data (Cap, LTV, Oracle) | Read-only |

#### City Buildings

| Hook | หน้าที่ | รายละเอียด |
|------|---------|------------|
| `useCityBuildings` | ดึงตึกทั้งหมดจาก on-chain | Supply + Borrow + LP + Lottery buildings |
| `useMoveBuilding` | ย้ายตึกบน grid | `[recordDemolition] → [recordBuildingPlacement]` |

**Building Types:**

| Type | สี | DeFi Protocol | ตัวอย่าง |
|------|-----|---------------|---------|
| `townhall` | ทอง | - | ศูนย์กลางเมือง |
| `bank` | เขียว | Aave Supply | Supply USDC, ETH, etc. |
| `borrow` | แดง | Aave Borrow | Borrow USDC, ETH, etc. |
| `lp` | ฟ้า | Uniswap V3 | LP USDC/ETH, etc. |
| `lottery` | ม่วง | Megapot | Lottery tickets |

**Building Levels (ตาม USD value):**

| Level | มูลค่า USD |
|-------|-----------|
| 1 | < $100 |
| 2 | $100 - $499 |
| 3 | $500 - $999 |
| 4 | $1,000 - $1,999 |
| 5 | >= $2,000 |

#### Uniswap V3

| Hook | หน้าที่ | รายละเอียด |
|------|---------|------------|
| `useUniswapSwap` | Swap tokens | exactInputSingle ผ่าน SwapRouter02 |
| `useUniswapLP` | ดึง LP positions | อ่าน NFT positions จาก NonfungiblePositionManager |
| `useUniswapLPBuild` | สร้าง LP position ใหม่ | Mint NFT + สร้าง lp building on-chain |

#### Megapot Lottery

| Hook | หน้าที่ | รายละเอียด |
|------|---------|------------|
| `useLotteryData` | Global lottery data | Pot size, round, fee, ticket price |
| `useLotteryPosition` | User lottery position | Tickets purchased, winnings claimable |
| `useLotteryBuyTickets` | ซื้อ lottery tickets | Approve MPUSDC → purchaseTickets |
| `useLotteryClaimWinnings` | ถอนเงินรางวัล | withdrawWinnings() |
| `useLotteryRunJackpot` | Run jackpot (testnet) | runJackpot() - only on testnet |
| `useLotteryHistory` | ประวัติ draws | Event logs จาก JackpotRun |

#### Megapot LP

| Hook | หน้าที่ | รายละเอียด |
|------|---------|------------|
| `useMegapotLPPosition` | ดู LP position | principal, stake, riskPercentage, active |
| `useMegapotLPDeposit` | ฝากเข้า Megapot LP | Approve MPUSDC → lpDeposit(riskPercentage, amount) |
| `useMegapotLPWithdraw` | ถอนจาก Megapot LP | withdrawAllLp() |

#### Utility

| Hook | หน้าที่ |
|------|---------|
| `useTransactionHistory` | ดึงประวัติ transactions จาก BaseScan API |

---

## 8. Config - ค่า Contract และ Aave

### 8.1 `config/contracts.ts` - Contract Addresses + ABIs

**Core Contracts (Base Sepolia):**

| Contract | Address | หน้าที่ |
|----------|---------|---------|
| `DEFICITY_CORE` | `0xF0f613927953c93646550B9F990BF9894Af9A5Ef` | Contract หลักจัดการเมือง |
| `WALLET_FACTORY` | `0x7693D97D6d7e03A3E224E9124d0A547Fd58543Df` | สร้าง Smart Wallet |
| `ENTRY_POINT` | `0x7D626d4be9158853D7568C9e3935F49f24522826` | ERC-4337 EntryPoint |
| `BUILDING_REGISTRY` | `0xEc580BCB26D49eb9e1403559F47dB7Ed8c5a5c8f` | ทะเบียนตึก + adapter routing |
| `BANK_ADAPTER` | `0xf616fc3AcDa7d33533FF17ba73745a6cF3f8b7ad` | Adapter สำหรับ Aave |
| `SWAP_ADAPTER` | `0xf692caBc47D0E05DeDEeF8e39Ef762E7a4940f35` | Adapter สำหรับ Uniswap Swap |

**Aave V3 Protocol:**

| Contract | Address |
|----------|---------|
| `AAVE_POOL` | `0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27` |
| `AAVE_DATA_PROVIDER` | `0xBc9f5b7E248451CdD7cA54e717a2BFe1F32b566b` |
| `AAVE_POOL_ADDRESSES_PROVIDER` | `0xE4C23309117Aa30342BFaae6c95c6478e0A4Ad00` |

**Uniswap V3 Protocol:**

| Contract | Address |
|----------|---------|
| `SWAP_ROUTER_02` | `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4` |
| `QUOTER_V2` | `0xC5290058841028F1614F3A6F0F5816cAd0df5E27` |
| `UNISWAP_V3_FACTORY` | `0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24` |
| `NONFUNGIBLE_POSITION_MANAGER` | `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2` |

**Megapot Lottery:**

| Contract | Address |
|----------|---------|
| `MEGAPOT` | `0x6f03c7BCaDAdBf5E6F5900DA3d56AdD8FbDac5De` |
| `MPUSDC` | `0xA4253E7C13525287C56550b8708100f93E60509f` |

**Token Addresses (Base Sepolia):**

| Token | Address | Decimals |
|-------|---------|----------|
| USDC | `0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f` | 6 |
| USDT | `0x0a215D8ba66387DCA84B284D18c3B4ec3de6E54a` | 6 |
| ETH (WETH) | `0x4200000000000000000000000000000000000006` | 18 |
| WBTC | `0x54114591963CF60EF3aA63bEfD6eC263D98145a4` | 8 |
| LINK | `0x810D46F9a9027E28F9B01F75E2bdde839dA61115` | 18 |
| MPUSDC | `0xA4253E7C13525287C56550b8708100f93E60509f` | 6 |

**ABIs ที่ export:**

| ABI | ฟังก์ชันหลัก |
|-----|-------------|
| `DEFICITY_CORE` | createTownHall, getUserBuildings, recordBuildingPlacement, recordDemolition, setLPTokenId |
| `SMART_WALLET` | execute, executeBatch, createSessionKey, executeFromGame |
| `AAVE_POOL` | supply, withdraw, borrow, repay, getUserAccountData |
| `AAVE_DATA_PROVIDER` | getUserReserveData, getReserveData, getReserveCaps |
| `AAVE_ORACLE` | getAssetPrice, getAssetsPrices |
| `BUILDING_REGISTRY` | preparePlace, prepareHarvest, prepareDemolish |
| `LP_BUILDING_ADAPTER` | preparePlace, prepareHarvest, prepareDemolish, prepareIncreaseLiquidity, prepareDecreaseLiquidity |
| `SWAP_ADAPTER` | prepareSwap |
| `SWAP_ROUTER_02` | exactInputSingle |
| `QUOTER_V2` | quoteExactInputSingle |
| `UNISWAP_V3_FACTORY` | getPool, createPool |
| `UNISWAP_V3_POOL` | slot0, liquidity, token0, token1 |
| `NONFUNGIBLE_POSITION_MANAGER` | mint, positions, balanceOf |
| `MEGAPOT` | purchaseTickets, withdrawWinnings, runJackpot, lpDeposit, withdrawAllLp, usersInfo, lpsInfo |
| `ERC20` | balanceOf, approve, transfer, decimals |

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
MEGAPOT_REFERRER = '0x0000...0000'  // Megapot referrer address
MPUSDC_DECIMALS = 6                 // MPUSDC token decimals
```

### 9.2 `wagmi.ts` - Wagmi Config

ตั้งค่า Wagmi ให้รู้จัก:
- **Chain ไหน**: Base Sepolia
- **เชื่อมต่อ wallet ยังไง**: MetaMask + WalletConnect
- **ส่ง request ไปที่ไหน**: RPC URL

### 9.3 `isometric.ts` - Isometric Projection

คำนวณ isometric projection สำหรับแปลง grid coordinates (x, y) เป็น screen position สำหรับ PixiJS rendering

### 9.4 `mapLayout.ts` - Grid Layout

สร้าง grid layout 13x13 สำหรับ game world

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
4. ถ้ายังไม่มี → แสดง TownHallModal สร้าง Town Hall
```

### Flow 3: สร้าง Town Hall

```
1. กดปุ่ม "CREATE TOWN HALL"
         ↓
2. DefiCityCore.createTownHall(7, 7)
         ↓
3. Deploy Smart Wallet + สร้าง Town Hall ที่กลาง grid
         ↓
4. แสดง Game Dashboard + PixiJS City Map
```

### Flow 4: Supply เข้า Aave (สร้าง Bank Building)

```
1. ลาก "Supply" จาก BottomBar → วางบน tile ที่ต้องการ
         ↓
2. BuildingDialog เปิด → เลือก asset + ใส่จำนวน
         ↓
3. กดปุ่ม "SUPPLY & BUILD"
         ↓
4. Smart Wallet executeBatch:
   [wrap (ถ้า ETH)] → [approve] → [supply] → [recordBuilding]
         ↓
5. Bank Building (สีเขียว) ปรากฏบน isometric map
```

### Flow 5: Borrow จาก Aave (สร้าง Borrow Building)

```
1. ลาก "Borrow" จาก BottomBar → วางบน tile
         ↓
2. BuildingDialog เปิด → เลือก asset + ใส่จำนวน
   → ต้องมี Supply เป็น collateral ก่อน
   → แสดง Health Factor preview
         ↓
3. กดปุ่ม "BORROW"
         ↓
4. Smart Wallet executeBatch:
   [borrow] → [recordBuildingPlacement]
         ↓
5. Borrow Building (สีแดง) ปรากฏบน map
```

### Flow 6: Swap Tokens ผ่าน Uniswap V3

```
1. กดปุ่ม "Swap" ที่ GameHUD หรือ VaultPanel
         ↓
2. SwapPanel เปิด → เลือก tokenIn/tokenOut + ใส่จำนวน
         ↓
3. ดู quote จาก QuoterV2
         ↓
4. กด "SWAP" → Smart Wallet executeBatch:
   [approve tokenIn] → [exactInputSingle]
         ↓
5. Token ใหม่ปรากฏใน Smart Wallet balance
```

### Flow 7: สร้าง Uniswap V3 LP Position

```
1. ลาก "LP" จาก BottomBar → วางบน tile
         ↓
2. LP creation dialog → เลือก token pair + fee tier + price range
         ↓
3. กด "CREATE LP"
         ↓
4. Smart Wallet executeBatch:
   [approve token0] → [approve token1] → [mint NFT] → [recordBuilding] → [setLPTokenId]
         ↓
5. LP Building (สีฟ้า) ปรากฏบน map
```

### Flow 8: ซื้อ Lottery Tickets

```
1. ลาก "Lottery" จาก BottomBar → วางบน tile
         ↓
2. LotteryDialog เปิด → ใส่จำนวน MPUSDC
         ↓
3. กด "BUY TICKETS"
         ↓
4. Smart Wallet executeBatch:
   [approve MPUSDC] → [purchaseTickets]
         ↓
5. Lottery Building (สีม่วง) ปรากฏบน map
```

### Flow 9: ฝาก Megapot LP

```
1. LotteryDialog → เลือก tab "LP"
         ↓
2. ใส่จำนวน MPUSDC + risk percentage
         ↓
3. กด "DEPOSIT LP"
         ↓
4. Smart Wallet executeBatch:
   [approve MPUSDC] → [lpDeposit(riskPercentage, amount)]
```

### Flow 10: Withdraw / Harvest / Demolish

```
คลิก building บน map → BuildPanel เปิด
         ↓
├── [HARVEST]  → ดึง yields/interest กลับมา
├── [WITHDRAW] → ถอนเงินจาก DeFi protocol
└── [DEMOLISH] → ลบ building + ถอนเงินทั้งหมด

ทุก action ทำผ่าน Smart Wallet executeBatch
```

### Flow 11: ย้ายตึกบน City Map

```
1. ลากตึกจากตำแหน่งเดิม
         ↓
2. ปล่อยที่ตำแหน่งใหม่
         ↓
3. Smart Wallet executeBatch:
   [recordDemolition] → [recordBuildingPlacement ที่ตำแหน่งใหม่]
         ↓
4. ตึกแสดงที่ตำแหน่งใหม่บน isometric map
```

---

## 11. Tech Stack ที่ใช้

### Blockchain Stack

```
Privy (@privy-io/react-auth ^3.10.2)
  └── จัดการ login/logout ด้วย wallet (dark theme, amber accent)

Wagmi (wagmi ^3.3.2)
  └── React hooks สำหรับอ่าน/เขียน contract

Viem (viem ^2.44.2)
  └── library พื้นฐานสำหรับ Ethereum (public client, encoding)

Ethers.js (ethers ^6.16.0)
  └── ใช้ใน hooks สำหรับ ABI encoding/contract interaction

React Query (@tanstack/react-query ^5.90.16)
  └── cache ข้อมูลจาก blockchain + auto-refetch
```

### Game Engine

```
PixiJS (pixi.js ^8.15.0)
  └── 2D WebGL rendering engine สำหรับ isometric city
  └── Full-screen canvas with zoom/pan
  └── Building rendering + animation
```

### UI Stack

```
Next.js 16.1.1 (next)
  └── Framework หลัก (App Router, static export)
  └── Output: 'export' (static site, basePath: '/defi-city' in prod)

React 19.2.3 (react)
  └── UI library

Tailwind CSS 4 (tailwindcss)
  └── CSS framework

Framer Motion (framer-motion ^12.26.2)
  └── Animation library

Lucide React (lucide-react ^0.562.0)
  └── Icon library

React Icons (react-icons ^5.5.0)
  └── Icon library

React Hot Toast (react-hot-toast ^2.6.0)
  └── Toast notifications

tw-animate-css (^1.4.0)
  └── Animation utilities for Tailwind
```

### Development

```
TypeScript 5 - Type safety
ESLint 9 + eslint-config-next - Code linting
```

---

## สรุป

| หมวด | ไฟล์สำคัญ | หน้าที่ |
|------|-----------|---------|
| **Routing** | `app/page.tsx`, `app/app/page.tsx` | กำหนด URL แต่ละหน้า |
| **Layout** | `app/layout.tsx`, `app/app/layout.tsx` | ห่อหุ้ม + ให้ Provider |
| **Auth** | `PrivyProvider.tsx` | Login ด้วย wallet |
| **Blockchain** | `WagmiProvider.tsx`, `wagmi.ts` | เชื่อม chain |
| **Game Engine** | `GameCanvas.tsx`, `GameWorld.ts`, `IsometricGrid.ts` | PixiJS rendering |
| **Game UI** | `GameHUD.tsx`, `BottomBar.tsx`, `BuildPanel.tsx` | UI panels overlay |
| **Smart Wallet** | `useSmartWallet.ts` | ดึง Smart Wallet address |
| **Deploy** | `useCreateSmartAccount.ts` | สร้าง Town Hall |
| **Deposit** | `useVaultDeposit.ts` | ฝากเงิน EOA → Vault |
| **Withdraw** | `useVaultWithdraw.ts` | ถอนเงิน Vault → EOA |
| **Aave Supply** | `useAaveSupply.ts` | Supply เข้า Aave + สร้าง bank building |
| **Aave Withdraw** | `useAaveWithdraw.ts` | ถอนจาก Aave + demolish |
| **Aave Borrow** | `useAaveBorrow.ts` | Borrow จาก Aave + สร้าง borrow building |
| **Aave Repay** | `useAaveRepay.ts` | Repay + demolish borrow building |
| **Aave Harvest** | `useAaveHarvest.ts` | Harvest yields |
| **Aave Position** | `useAavePosition.ts` | ดึง position (supply/borrow/HF) |
| **Aave Reserve** | `useAaveReserveData.ts` | ดึง reserve data ครบ |
| **Uniswap Swap** | `useUniswapSwap.ts` | Swap tokens ผ่าน Uniswap V3 |
| **Uniswap LP** | `useUniswapLP.ts`, `useUniswapLPBuild.ts` | สร้าง/ดู LP positions |
| **Lottery** | `useLotteryBuyTickets.ts`, `useLotteryClaimWinnings.ts` | ซื้อ tickets / ถอนรางวัล |
| **Megapot LP** | `useMegapotLPDeposit.ts`, `useMegapotLPWithdraw.ts` | ฝาก/ถอน Megapot LP |
| **Buildings** | `useCityBuildings.ts` | ดึงตึกทั้งหมดจาก on-chain |
| **Move** | `useMoveBuilding.ts` | ย้ายตึกบน grid |
| **Tx History** | `useTransactionHistory.ts` | ดึงประวัติ transactions |
| **Config** | `config/contracts.ts`, `config/aave.ts` | Contract addresses, ABIs |
