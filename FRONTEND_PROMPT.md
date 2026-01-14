# Prompt สำหรับสร้าง Frontend สำหรับ Smart Wallet DApp

สร้าง Frontend Web Application สำหรับ Smart Wallet System ที่ deploy บน Sepolia Testnet แล้ว

## ข้อมูล Smart Contracts

**Network**: Sepolia Testnet (Chain ID: 11155111)

**Deployed Contracts:**
- Factory Address: `0x0899fDF0Dfe72751925901e72DB41A0aDB18be47`

**Contract Structure:**

1. **SimpleWalletFactory.sol** - Factory สำหรับสร้าง wallet
   - `createWallet(address owner)` - สร้าง wallet ใหม่
   - `getWallet(address owner)` - ดึง wallet address จาก owner
   - `hasWallet(address owner)` - เช็คว่ามี wallet หรือไม่
   - `getOrCreateWallet(address owner)` - ดึงหรือสร้าง wallet

2. **SimpleSmartWallet.sol** - Smart wallet แต่ละอัน
   - `depositToken(address token, uint256 amount)` - deposit ERC20
   - `receive()` - deposit ETH
   - `withdrawETH(address to, uint256 amount)` - ถอน ETH
   - `withdrawAllETH(address to)` - ถอน ETH ทั้งหมด
   - `withdrawToken(address token, address to, uint256 amount)` - ถอน ERC20
   - `withdrawAllTokens(address token, address to)` - ถอน ERC20 ทั้งหมด
   - `getETHBalance()` - ดูยอด ETH
   - `getTokenBalance(address token)` - ดูยอด ERC20
   - `owner` - เจ้าของ wallet

## Requirements

### Tech Stack ที่แนะนำ
- **Frontend**: Next.js 14 (App Router) หรือ Vite + React
- **Web3**: ethers.js v6 หรือ viem + wagmi
- **UI Library**: TailwindCSS + shadcn/ui หรือ Chakra UI
- **Wallet Connect**: RainbowKit หรือ ConnectKit
- **State Management**: Zustand หรือ React Context

### Core Features ที่ต้องมี

1. **Wallet Connection**
   - เชื่อม MetaMask
   - แสดง EOA address และ balance
   - Switch เป็น Sepolia network อัตโนมัติถ้าอยู่ network อื่น

2. **Smart Wallet Management**
   - ตรวจสอบว่า user มี smart wallet หรือยัง
   - ปุ่ม "Create Wallet" สำหรับ user ใหม่
   - แสดง Smart Wallet address เมื่อสร้างแล้ว
   - แสดง ETH balance ใน smart wallet

3. **Deposit Section**
   - Form สำหรับ deposit ETH ไป smart wallet
   - แสดง current balance ทั้ง EOA และ Smart Wallet
   - ปุ่ม Deposit พร้อม loading state
   - แสดง transaction hash เมื่อสำเร็จ

4. **Withdraw Section**
   - Form สำหรับ withdraw ETH กลับไป EOA
   - แสดง smart wallet balance
   - Input สำหรับใส่จำนวนที่ต้องการถอน
   - ปุ่ม "Withdraw All" สำหรับถอนทั้งหมด
   - Validation: ไม่ให้ถอนมากกว่ายอดที่มี

5. **Transaction History** (Optional แต่ดีมาก)
   - ดึง events จาก contract (Deposited, Withdrawn)
   - แสดงเป็น table หรือ list
   - Link ไป Sepolia Etherscan

### UI/UX Requirements

1. **Layout**
   - Navbar: Logo, Connected Address, Network, Disconnect button
   - Main Section: แบ่งเป็น 3 cards
     - Card 1: EOA Wallet Info (address, ETH balance)
     - Card 2: Smart Wallet Info (address, ETH balance, Create button ถ้ายังไม่มี)
     - Card 3: Deposit/Withdraw Forms
   - Footer: Links to docs, GitHub, Etherscan

2. **Responsive Design**
   - ใช้งานได้บนมือถือ (mobile-first)
   - Cards stack vertically บน mobile

3. **Loading States**
   - Skeleton loader ขณะ fetch data
   - Spinner บน buttons ขณะ transaction pending
   - Toast notifications สำหรับ success/error

4. **Error Handling**
   - แสดง error message ที่อ่านเข้าใจง่าย
   - ถ้า user ไม่มี wallet → แสดงปุ่ม "Install MetaMask"
   - ถ้า network ผิด → แสดงปุ่ม "Switch to Sepolia"
   - ถ้า balance ไม่พอ → แสดง warning message

### Contract ABIs ที่ต้องใช้

สร้าง ABI files ให้ด้วยตาม contract structure ข้างต้น หรือ generate จาก compiled contracts

### Environment Variables

```env
NEXT_PUBLIC_FACTORY_ADDRESS=0x0899fDF0Dfe72751925901e72DB41A0aDB18be47
NEXT_PUBLIC_SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
```

## Deliverables

1. **Project Structure ที่ชัดเจน**
   ```
   /src
     /components
       - WalletConnect.tsx
       - SmartWalletInfo.tsx
       - DepositForm.tsx
       - WithdrawForm.tsx
     /hooks
       - useSmartWallet.ts (custom hook สำหรับ interact กับ contract)
       - useWalletConnection.ts
     /lib
       - contracts.ts (ABIs และ addresses)
       - utils.ts (helper functions)
     /app หรือ /pages
       - page.tsx / index.tsx
   ```

2. **Documentation**
   - README.md พร้อม setup instructions
   - วิธี run project (`npm install`, `npm run dev`)
   - วิธีเอา Sepolia testnet ETH จาก faucet

3. **Code Quality**
   - TypeScript types สำหรับทุกอย่าง
   - Error handling ครบถ้วน
   - Comments อธิบาย logic ที่สำคัญ
   - Clean code, easy to read

## Example Code Structure

### Custom Hook ตัวอย่าง:
```typescript
// hooks/useSmartWallet.ts
export function useSmartWallet(ownerAddress: string) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string>("0")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWallet() {
      // เรียก factory.getWallet(ownerAddress)
      // ถ้ามี wallet → fetch balance
    }
    fetchWallet()
  }, [ownerAddress])

  const createWallet = async () => {
    // เรียก factory.createWallet()
  }

  const deposit = async (amount: string) => {
    // ส่ง ETH ไป wallet
  }

  const withdraw = async (amount: string) => {
    // เรียก wallet.withdrawETH()
  }

  return { walletAddress, balance, loading, createWallet, deposit, withdraw }
}
```

## Testing Requirements

ให้แน่ใจว่า test ได้ใน Sepolia:
1. เชื่อม MetaMask
2. สร้าง Smart Wallet
3. Deposit ETH
4. เช็ค balance
5. Withdraw ETH กลับ
6. Transaction แสดงบน Etherscan

## Notes

- เน้น UX ที่ดี มากกว่า features เยอะ
- ใช้ได้จริง ทดสอบได้จริงบน Sepolia
- Code สะอาด อ่านง่าย maintain ง่าย
- Mobile responsive
- Error handling ครบ

---

เริ่มเลย! สร้าง modern, clean, และใช้งานได้จริงครับ 🚀
