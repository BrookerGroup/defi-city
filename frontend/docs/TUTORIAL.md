# DeFi City Frontend - Tutorial

คู่มืออธิบายการทำงานของ Frontend สำหรับนักพัฒนา

## สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [โครงสร้างโปรเจค](#2-โครงสร้างโปรเจค)
3. [Authentication Flow](#3-authentication-flow)
4. [Smart Wallet System](#4-smart-wallet-system)
5. [Game Engine (PixiJS)](#5-game-engine-pixijs)
6. [State Management (Zustand)](#6-state-management-zustand)
7. [Web3 Integration (Wagmi + Viem)](#7-web3-integration-wagmi--viem)
8. [Component Guide](#8-component-guide)
9. [Hooks Reference](#9-hooks-reference)
10. [การปรับแต่งและต่อยอด](#10-การปรับแต่งและต่อยอด)

---

## 1. ภาพรวมระบบ

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Next.js   │  │   PixiJS    │  │   shadcn/ui         │ │
│  │  App Router │  │ Game Canvas │  │   Components        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Privy     │  │   Wagmi     │  │   Zustand           │ │
│  │    Auth     │  │   + Viem    │  │   State Mgmt        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    TanStack Query                            │
│                  (Data Fetching & Caching)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Sepolia Blockchain                        │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │  SimpleWalletFactory │  │    SimpleSmartWallet        │  │
│  │  (Contract Factory)  │  │    (User's Wallet)          │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → React Component → Hook → Wagmi → Blockchain
                                  ↓
                              Zustand Store
                                  ↓
                              UI Update
```

---

## 2. โครงสร้างโปรเจค

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout + Providers
│   ├── page.tsx                 # Main page (routing logic)
│   └── globals.css              # Global styles + Tailwind
│
├── components/
│   ├── game/                    # Game-related components
│   │   ├── GameCanvas.tsx       # PixiJS canvas wrapper
│   │   ├── TopBar.tsx           # Resource display bar
│   │   ├── BottomBar.tsx        # Building selection menu
│   │   ├── BuildingModal.tsx    # Build confirmation modal
│   │   ├── BuildingInfo.tsx     # Building details modal
│   │   ├── WelcomeScreen.tsx    # Login screen
│   │   └── CreateWalletScreen.tsx # Wallet creation screen
│   │
│   ├── wallet/                  # Wallet-related components
│   │   ├── ConnectButton.tsx    # Privy connect button
│   │   ├── WalletInfo.tsx       # Wallet details card
│   │   ├── DepositForm.tsx      # ETH deposit form
│   │   └── WithdrawForm.tsx     # ETH withdraw form
│   │
│   ├── providers/               # Context providers
│   │   ├── PrivyProvider.tsx    # Privy authentication
│   │   ├── WagmiProvider.tsx    # Wagmi + React Query
│   │   └── index.tsx            # Combined providers
│   │
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
│
├── hooks/                       # Custom React hooks
│   ├── useSmartWallet.ts        # Smart wallet operations
│   ├── useDeposit.ts            # Deposit ETH logic
│   ├── useWithdraw.ts           # Withdraw ETH logic
│   └── useWalletBalance.ts      # Balance fetching
│
├── lib/
│   ├── contracts/               # Contract configurations
│   │   ├── abis/               # Contract ABIs
│   │   │   ├── SimpleWalletFactory.ts
│   │   │   └── SimpleSmartWallet.ts
│   │   ├── addresses.ts        # Contract addresses
│   │   └── index.ts
│   ├── constants.ts             # App constants
│   ├── utils.ts                 # Utility functions
│   └── wagmi.ts                 # Wagmi configuration
│
├── store/                       # Zustand stores
│   ├── gameStore.ts             # Game state (buildings, camera)
│   └── walletStore.ts           # Wallet state
│
└── types/                       # TypeScript types
    ├── building.ts              # Building types & info
    ├── wallet.ts                # Wallet types
    ├── game.ts                  # Game types
    └── index.ts
```

---

## 3. Authentication Flow

### Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Welcome     │     │   Privy      │     │   Create     │
│  Screen      │────▶│   Login      │────▶│   Wallet     │
│              │     │   Modal      │     │   Screen     │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │   Game       │
                                          │   Screen     │
                                          └──────────────┘
```

### การทำงาน

**1. WelcomeScreen.tsx** - หน้าแรกเมื่อยังไม่ login

```tsx
// src/components/game/WelcomeScreen.tsx
import { usePrivy } from '@privy-io/react-auth'

export function WelcomeScreen() {
  const { login } = usePrivy()

  return (
    <Button onClick={login}>
      Connect Wallet
    </Button>
  )
}
```

**2. page.tsx** - Routing logic ตาม authentication state

```tsx
// src/app/page.tsx
export default function Home() {
  const { ready, authenticated } = usePrivy()
  const { hasWallet } = useSmartWallet(eoaAddress)

  // ยังไม่พร้อม - แสดง loading
  if (!ready) return <Loading />

  // ยังไม่ login - แสดงหน้า welcome
  if (!authenticated) return <WelcomeScreen />

  // Login แล้วแต่ยังไม่มี smart wallet
  if (!hasWallet) return <CreateWalletScreen />

  // พร้อมเล่นเกม
  return <GameScreen />
}
```

**3. PrivyProvider.tsx** - ตั้งค่า Privy

```tsx
// src/components/providers/PrivyProvider.tsx
<PrivyProviderBase
  appId={PRIVY_APP_ID}
  config={{
    appearance: { theme: 'dark' },
    loginMethods: ['email', 'wallet', 'google'],
    defaultChain: sepolia,
    supportedChains: [sepolia],
  }}
>
  {children}
</PrivyProviderBase>
```

### Privy Hooks ที่ใช้

| Hook | Description |
|------|-------------|
| `usePrivy()` | สถานะ auth หลัก |
| `ready` | Privy พร้อมใช้งานหรือยัง |
| `authenticated` | User login แล้วหรือยัง |
| `user` | ข้อมูล user (wallet address, email) |
| `login()` | เปิด login modal |
| `logout()` | Logout |

---

## 4. Smart Wallet System

### ความสัมพันธ์ EOA vs Smart Wallet

```
┌─────────────────┐          ┌─────────────────┐
│   EOA Wallet    │          │  Smart Wallet   │
│   (MetaMask)    │ ─────▶   │  (Contract)     │
│                 │  owns    │                 │
│  0xUser...      │          │  0xSmart...     │
└─────────────────┘          └─────────────────┘
        │                            │
        │ signs transactions         │ holds assets
        │                            │ interacts with DeFi
        ▼                            ▼
   ┌─────────────────────────────────────────┐
   │            Blockchain (Sepolia)          │
   └─────────────────────────────────────────┘
```

### Contract Functions

**SimpleWalletFactory** (สร้าง wallet ใหม่)

```solidity
// สร้าง wallet ใหม่
createWallet(address owner) → address

// ดึง wallet address
getWallet(address owner) → address

// เช็คว่ามี wallet หรือยัง
hasWallet(address owner) → bool
```

**SimpleSmartWallet** (จัดการ assets)

```solidity
// ดึง balance
getETHBalance() → uint256

// ถอน ETH
withdrawETH(address to, uint256 amount)
withdrawAllETH(address to)

// รับ ETH (ส่งตรงมาที่ address ได้เลย)
receive() payable
```

### useSmartWallet Hook

```tsx
// src/hooks/useSmartWallet.ts
export function useSmartWallet(ownerAddress: `0x${string}` | undefined) {
  // 1. เช็คว่ามี wallet หรือยัง
  const { data: hasWallet } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: SimpleWalletFactoryABI,
    functionName: 'hasWallet',
    args: [ownerAddress],
  })

  // 2. ดึง wallet address
  const { data: walletAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: SimpleWalletFactoryABI,
    functionName: 'getWallet',
    args: [ownerAddress],
    query: { enabled: hasWallet === true },
  })

  // 3. ดึง balance (auto-refresh ทุก 10 วินาที)
  const { data: balance } = useReadContract({
    address: walletAddress,
    abi: SimpleSmartWalletABI,
    functionName: 'getETHBalance',
    query: {
      enabled: !!walletAddress,
      refetchInterval: 10_000,
    },
  })

  // 4. สร้าง wallet ใหม่
  const { writeContract } = useWriteContract()

  const createWallet = () => {
    writeContract({
      address: FACTORY_ADDRESS,
      abi: SimpleWalletFactoryABI,
      functionName: 'createWallet',
      args: [ownerAddress],
    })
  }

  return { walletAddress, balance, hasWallet, createWallet }
}
```

### Deposit Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │───▶│ Deposit │───▶│  Sign   │───▶│ Smart   │
│  Input  │    │  Form   │    │   Tx    │    │ Wallet  │
│  0.1ETH │    │         │    │         │    │ +0.1ETH │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

```tsx
// src/hooks/useDeposit.ts
export function useDeposit(smartWalletAddress: `0x${string}` | null) {
  const { sendTransaction } = useSendTransaction()

  const deposit = (amount: string) => {
    // ส่ง ETH ตรงไปที่ Smart Wallet
    sendTransaction({
      to: smartWalletAddress,
      value: parseEther(amount),
    })
  }

  return { deposit }
}
```

### Withdraw Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │───▶│Withdraw │───▶│  Call   │───▶│   EOA   │
│  Input  │    │  Form   │    │Contract │    │ +0.1ETH │
│  0.1ETH │    │         │    │         │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

```tsx
// src/hooks/useWithdraw.ts
export function useWithdraw(smartWalletAddress: `0x${string}` | null) {
  const { writeContract } = useWriteContract()

  const withdraw = (amount: string, recipient: `0x${string}`) => {
    writeContract({
      address: smartWalletAddress,
      abi: SimpleSmartWalletABI,
      functionName: 'withdrawETH',
      args: [recipient, parseEther(amount)],
    })
  }

  return { withdraw }
}
```

---

## 5. Game Engine (PixiJS)

### Isometric Grid System

```
        Screen Coordinates              Isometric View

        (0,0)───────▶ X                     /\
          │                                /  \
          │                               /    \
          ▼                              /      \
          Y                            \/        \/
                                       /\        /\
                                      /  \      /  \
                                     /    \    /    \
                                    /      \  /      \
                                   ▼        \/        ▼
```

### Coordinate Conversion

```tsx
// src/components/game/GameCanvas.tsx

// Grid settings
const GRID_SIZE = 20   // 20x20 tiles
const TILE_SIZE = 64   // 64px per tile

// Cartesian → Isometric
const cartToIso = (x: number, y: number) => ({
  x: (x - y) * (TILE_SIZE / 2),
  y: (x + y) * (TILE_SIZE / 4),
})

// Isometric → Cartesian
const isoToCart = (isoX: number, isoY: number) => ({
  x: Math.floor((isoX / (TILE_SIZE / 2) + isoY / (TILE_SIZE / 4)) / 2),
  y: Math.floor((isoY / (TILE_SIZE / 4) - isoX / (TILE_SIZE / 2)) / 2),
})
```

### PixiJS Application Setup

```tsx
// src/components/game/GameCanvas.tsx
useEffect(() => {
  // 1. สร้าง PixiJS Application
  const app = new PIXI.Application()
  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1a1a2e,
    antialias: true,
  })

  // 2. เพิ่ม canvas ลงใน DOM
  canvasRef.current.appendChild(app.canvas)

  // 3. สร้าง containers
  const mainContainer = new PIXI.Container()
  const gridContainer = new PIXI.Container()      // วาด grid
  const buildingsContainer = new PIXI.Container() // วาง buildings

  // 4. จัดตำแหน่งกลางจอ
  mainContainer.x = app.screen.width / 2
  mainContainer.y = app.screen.height / 3

  // 5. วาด isometric grid
  drawGrid(gridContainer)

  // Cleanup
  return () => app.destroy(true, true)
}, [])
```

### Drawing Isometric Tiles

```tsx
// วาด tile รูป diamond
const drawTile = (graphics: PIXI.Graphics, x: number, y: number, color: number) => {
  const halfWidth = TILE_SIZE / 2
  const halfHeight = TILE_SIZE / 4

  graphics
    .poly([
      { x: x, y: y - halfHeight },           // top
      { x: x + halfWidth, y: y },             // right
      { x: x, y: y + halfHeight },            // bottom
      { x: x - halfWidth, y: y },             // left
    ])
    .fill({ color, alpha: 0.5 })
    .stroke({ color: 0x3a3a5e, width: 1 })
}

// วาดทั้ง grid
const drawGrid = (container: PIXI.Container) => {
  const graphics = new PIXI.Graphics()

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const iso = cartToIso(x, y)
      drawTile(graphics, iso.x, iso.y, 0x2a2a4e)
    }
  }

  container.addChild(graphics)
}
```

### Building Placement

```tsx
// Mouse hover - แสดง preview
const handleMouseMove = (e: PIXI.FederatedPointerEvent) => {
  // แปลง screen position → grid position
  const localPos = gridContainer.toLocal(e.global)
  const cart = isoToCart(localPos.x, localPos.y)

  // เช็คว่าอยู่ใน grid หรือไม่
  if (cart.x >= 0 && cart.x < GRID_SIZE && cart.y >= 0 && cart.y < GRID_SIZE) {
    // วาด hover effect
    const iso = cartToIso(cart.x, cart.y)
    const isOccupied = isPositionOccupied(cart.x, cart.y)
    const color = isOccupied ? 0xff0000 : 0x00ff00  // แดง = ไม่ได้, เขียว = ได้

    drawHoverTile(iso.x, iso.y, color)
  }
}

// Click - วาง building
const handleClick = (e: PIXI.FederatedPointerEvent) => {
  const localPos = gridContainer.toLocal(e.global)
  const cart = isoToCart(localPos.x, localPos.y)

  if (!isPositionOccupied(cart.x, cart.y)) {
    // เปิด modal ยืนยัน
    setPendingPosition({ x: cart.x, y: cart.y })
    setBuildModalOpen(true)
  }
}
```

### Building Sprites

```tsx
// สร้าง sprite สำหรับ building
const createBuildingSprite = (building: Building) => {
  const info = BUILDING_INFO[building.type]
  const container = new PIXI.Container()

  // Base (กล่องสี่เหลี่ยม)
  const base = new PIXI.Graphics()
  base.roundRect(-25, -40, 50, 50, 5)
  base.fill({ color: info.color })

  // Icon (emoji)
  const text = new PIXI.Text({
    text: info.icon,  // 🏛️, 🌾, ⛏️
    style: { fontSize: 28 },
  })
  text.anchor.set(0.5)

  container.addChild(base)
  container.addChild(text)

  return container
}
```

### Zoom & Pan

```tsx
// Zoom ด้วย mouse wheel
useEffect(() => {
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(zoom + delta)  // min 0.5, max 2
  }

  window.addEventListener('wheel', handleWheel, { passive: false })
  return () => window.removeEventListener('wheel', handleWheel)
}, [zoom])

// Apply zoom
useEffect(() => {
  mainContainer.scale.set(zoom)
}, [zoom])
```

---

## 6. State Management (Zustand)

### Game Store

```tsx
// src/store/gameStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GameState {
  // State
  buildings: Building[]
  selectedBuildingType: BuildingType | null
  isPlacingBuilding: boolean
  cameraPosition: { x: number; y: number }
  zoom: number

  // Actions
  addBuilding: (building: Building) => void
  removeBuilding: (id: string) => void
  selectBuildingType: (type: BuildingType | null) => void
  isPositionOccupied: (x: number, y: number) => boolean
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state - Town Hall อยู่ตรงกลาง
      buildings: [{
        id: 'town-hall-1',
        type: 'town-hall',
        position: { x: 10, y: 10 },
        createdAt: Date.now(),
      }],
      selectedBuildingType: null,
      isPlacingBuilding: false,
      cameraPosition: { x: 0, y: 0 },
      zoom: 1,

      // Actions
      addBuilding: (building) =>
        set((state) => ({
          buildings: [...state.buildings, building],
          selectedBuildingType: null,
          isPlacingBuilding: false,
        })),

      removeBuilding: (id) =>
        set((state) => ({
          buildings: state.buildings.filter((b) => b.id !== id),
        })),

      selectBuildingType: (type) =>
        set({
          selectedBuildingType: type,
          isPlacingBuilding: type !== null,
        }),

      isPositionOccupied: (x, y) => {
        return get().buildings.some(
          (b) => b.position.x === x && b.position.y === y
        )
      },
    }),
    {
      name: 'defi-city-game',  // localStorage key
      partialize: (state) => ({
        buildings: state.buildings,  // persist เฉพาะ buildings
      }),
    }
  )
)
```

### การใช้งานใน Component

```tsx
// BottomBar.tsx - เลือก building type
function BottomBar() {
  const { selectedBuildingType, selectBuildingType } = useGameStore()

  return (
    <Button onClick={() => selectBuildingType('yield-farm')}>
      🌾 Yield Farm
    </Button>
  )
}

// GameCanvas.tsx - เพิ่ม building
function GameCanvas() {
  const { addBuilding, isPositionOccupied } = useGameStore()

  const handlePlace = (x: number, y: number) => {
    if (!isPositionOccupied(x, y)) {
      addBuilding({
        id: `building-${Date.now()}`,
        type: selectedBuildingType,
        position: { x, y },
        createdAt: Date.now(),
      })
    }
  }
}
```

### Persist Middleware

```tsx
// ข้อมูล buildings จะถูกเก็บใน localStorage
// เมื่อ refresh หน้า buildings จะยังอยู่

persist(
  (set, get) => ({ ... }),
  {
    name: 'defi-city-game',  // key ใน localStorage
    partialize: (state) => ({
      buildings: state.buildings,  // เก็บเฉพาะ field นี้
    }),
  }
)
```

---

## 7. Web3 Integration (Wagmi + Viem)

### Wagmi Configuration

```tsx
// src/lib/wagmi.ts
import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(RPC_URL),
  },
  ssr: true,  // สำหรับ Next.js
})
```

### Provider Setup

```tsx
// src/components/providers/WagmiProvider.tsx
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function WagmiProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProviderBase config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProviderBase>
  )
}
```

### Wagmi Hooks ที่ใช้

| Hook | Description | Example |
|------|-------------|---------|
| `useReadContract` | อ่านข้อมูลจาก contract | `getETHBalance()` |
| `useWriteContract` | เขียนข้อมูลลง contract | `createWallet()` |
| `useSendTransaction` | ส่ง ETH | Deposit to wallet |
| `useWaitForTransactionReceipt` | รอ tx confirm | Show loading |
| `useBalance` | ดึง ETH balance ของ address | EOA balance |

### Contract Interaction Examples

**อ่านข้อมูล (Read)**

```tsx
import { useReadContract } from 'wagmi'

const { data: balance } = useReadContract({
  address: walletAddress,
  abi: SimpleSmartWalletABI,
  functionName: 'getETHBalance',
  query: {
    refetchInterval: 10_000,  // refresh ทุก 10 วินาที
  },
})
```

**เขียนข้อมูล (Write)**

```tsx
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

const { writeContract, data: hash, isPending } = useWriteContract()
const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

// เรียกใช้
writeContract({
  address: FACTORY_ADDRESS,
  abi: SimpleWalletFactoryABI,
  functionName: 'createWallet',
  args: [ownerAddress],
})
```

**ส่ง ETH**

```tsx
import { useSendTransaction } from 'wagmi'
import { parseEther } from 'viem'

const { sendTransaction } = useSendTransaction()

sendTransaction({
  to: smartWalletAddress,
  value: parseEther('0.1'),  // 0.1 ETH
})
```

### Viem Utilities

```tsx
import { formatEther, parseEther } from 'viem'

// Wei → ETH (for display)
formatEther(1000000000000000000n)  // "1"

// ETH → Wei (for transactions)
parseEther('0.1')  // 100000000000000000n
```

---

## 8. Component Guide

### Game Components

#### GameCanvas.tsx
- **หน้าที่**: Render isometric game view ด้วย PixiJS
- **State**: `buildings`, `selectedBuildingType`, `zoom`
- **Events**: Mouse move (hover), Click (place), Wheel (zoom)

#### TopBar.tsx
- **หน้าที่**: แสดง resources และ wallet info
- **แสดง**: USDC balance, ETH balance, Points, Network badge

#### BottomBar.tsx
- **หน้าที่**: Menu สำหรับเลือก building
- **Buildings**: Yield Farm, Staking Camp, LP Mine, Shop, Castle

#### BuildingModal.tsx
- **หน้าที่**: ยืนยันการสร้าง building
- **แสดง**: Building info, APY, Min deposit, Amount input

### Wallet Components

#### ConnectButton.tsx
- **หน้าที่**: ปุ่ม connect/disconnect wallet
- **States**: Loading, Connected, Disconnected

#### WalletInfo.tsx
- **หน้าที่**: แสดงข้อมูล EOA และ Smart Wallet
- **แสดง**: Addresses, Balances, Copy/Etherscan links

#### DepositForm.tsx
- **หน้าที่**: Form สำหรับ deposit ETH
- **Validation**: Amount > 0, Balance sufficient

#### WithdrawForm.tsx
- **หน้าที่**: Form สำหรับ withdraw ETH
- **Validation**: Amount > 0, Smart wallet balance sufficient

---

## 9. Hooks Reference

### useSmartWallet

```tsx
const {
  walletAddress,    // Smart wallet address
  balance,          // Smart wallet ETH balance (bigint)
  hasWallet,        // มี wallet หรือยัง (boolean)
  isLoading,        // กำลังโหลดข้อมูล
  isCreating,       // กำลังสร้าง wallet
  createWallet,     // function สร้าง wallet ใหม่
  refetchBalance,   // function refresh balance
} = useSmartWallet(ownerAddress)
```

### useDeposit

```tsx
const {
  deposit,       // function deposit(amount: string)
  isPending,     // รอ user confirm ใน wallet
  isConfirming,  // tx กำลัง confirm
  isSuccess,     // deposit สำเร็จ
  hash,          // transaction hash
  error,         // error ถ้ามี
  reset,         // reset state
} = useDeposit(smartWalletAddress)
```

### useWithdraw

```tsx
const {
  withdraw,      // function withdraw(amount: string, recipient: address)
  withdrawAll,   // function withdrawAll(recipient: address)
  isPending,
  isConfirming,
  isSuccess,
  hash,
  error,
  reset,
} = useWithdraw(smartWalletAddress)
```

### useWalletBalance

```tsx
const {
  balance,    // Raw balance (bigint)
  formatted,  // Formatted balance (string)
  symbol,     // "ETH"
  isLoading,
  refetch,
} = useWalletBalance(address)
```

---

## 10. การปรับแต่งและต่อยอด

### เพิ่ม Building Type ใหม่

1. **เพิ่มใน types/building.ts**

```tsx
export type BuildingType =
  | 'town-hall'
  | 'yield-farm'
  | 'new-building'  // เพิ่มใหม่

export const BUILDING_INFO: Record<BuildingType, BuildingInfo> = {
  // ...existing
  'new-building': {
    type: 'new-building',
    name: 'New Building',
    icon: '🏠',
    protocol: 'Some Protocol',
    description: 'Description here',
    apy: '10%',
    color: 0x123456,
  },
}
```

2. **เพิ่มใน BottomBar.tsx**

```tsx
const AVAILABLE_BUILDINGS: BuildingType[] = [
  'yield-farm',
  'new-building',  // เพิ่มใหม่
  // ...
]
```

### เพิ่ม Contract Integration

1. **เพิ่ม ABI ใน lib/contracts/abis/**

```tsx
// lib/contracts/abis/NewProtocol.ts
export const NewProtocolABI = [
  {
    inputs: [...],
    name: 'deposit',
    outputs: [...],
    stateMutability: 'payable',
    type: 'function',
  },
] as const
```

2. **สร้าง Hook ใหม่**

```tsx
// hooks/useNewProtocol.ts
export function useNewProtocol() {
  const { writeContract } = useWriteContract()

  const deposit = (amount: string) => {
    writeContract({
      address: NEW_PROTOCOL_ADDRESS,
      abi: NewProtocolABI,
      functionName: 'deposit',
      value: parseEther(amount),
    })
  }

  return { deposit }
}
```

### เพิ่ม Animation ใน PixiJS

```tsx
// ใน GameCanvas.tsx
app.ticker.add((ticker) => {
  // Animate buildings
  buildingsContainer.children.forEach((sprite, i) => {
    sprite.y += Math.sin(ticker.lastTime / 500 + i) * 0.3
  })
})
```

### เพิ่ม Sound Effects

```tsx
// ใช้ Howler.js
import { Howl } from 'howler'

const placeSound = new Howl({
  src: ['/sounds/place.mp3'],
})

const handlePlace = () => {
  placeSound.play()
  addBuilding(...)
}
```

---

## Tips & Best Practices

1. **Type Safety**: ใช้ TypeScript อย่างเคร่งครัด ทุก contract interaction ควรมี type
2. **Error Handling**: ใช้ toast notifications แจ้ง error ทุกครั้ง
3. **Loading States**: แสดง loading spinner ระหว่างรอ transaction
4. **Caching**: ใช้ TanStack Query cache เพื่อลด API calls
5. **Persistence**: ใช้ Zustand persist สำหรับ game state

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [PixiJS Documentation](https://pixijs.com/guides)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [Privy Documentation](https://docs.privy.io)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

---

*สร้างโดย Claude - DeFi City Frontend Tutorial*
