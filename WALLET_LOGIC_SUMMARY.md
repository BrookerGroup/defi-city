# สรุปการแก้ไข Logic การ Connect Wallet และ Deploy Smart Account

## วัตถุประสงค์
แก้ไข Logic ให้เป็นไปตามลำดับดังนี้:
1. **Connect Wallet (EOA)** - เชื่อมต่อ External Owned Account ผ่าน Privy
2. **Deploy Smart Account (AA)** - Deploy Smart Wallet ผ่าน createTownHall
   - 2.1 ถ้าเคย Deploy แล้วไม่ต้อง Deploy ซ้ำ
3. **Get Address และ Data ของ AA** - แสดงและเก็บ Smart Wallet Address
4. **Hardcode แสดง Icon Town Hall** - แสดง Town Hall Icon อยู่ตรงกลาง Map ตั้งแต่เริ่มต้น

## ไฟล์ที่แก้ไข

### 1. `/src/app/app/page.tsx`
**การเปลี่ยนแปลง:**
- ปรับปรุง Logic การ auto-deploy Smart Account ให้ชัดเจนขึ้น
- เพิ่ม console.log เพื่อติดตามแต่ละ Step
- แสดง Smart Wallet Address และ Building ID หลัง Deploy สำเร็จ

**Flow:**
```
Step 1: Connect Wallet (EOA) → authenticated && eoaAddress
Step 2: Check if Smart Account exists → walletLoading
Step 2.1: If exists, skip deployment → smartWallet !== null
Step 2.2: If not exists, deploy at center (6, 6) → createTownHall()
Step 3: Get Address and Data → result.walletAddress, result.buildingId
```

### 2. `/src/store/gameStore.ts`
**การเปลี่ยนแปลง:**
- แก้ไข `merge` function ใน persist middleware
- เพิ่ม Logic ตรวจสอบว่ามี Town Hall หรือไม่
- ถ้าไม่มี Town Hall ให้เพิ่ม Town Hall ที่ตำแหน่ง (6, 6) อัตโนมัติ
- ลบ GRID_SIZE จาก import เพราะมีการประกาศใน local scope แล้ว

**Step 4: Hardcode Town Hall Icon**
```typescript
// Town Hall จะแสดงที่ตรงกลาง Map (6, 6) เสมอ
const hasTownHall = validBuildings.some(b => b.type === 'townhall')
if (!hasTownHall) {
  // เพิ่ม Town Hall ที่ตรงกลาง
  buildings.unshift({
    id: 'townhall-center',
    type: 'townhall',
    position: { x: 6, y: 6 },
    createdAt: Date.now(),
  })
}
```

### 3. `/src/components/wallet/WalletInfo.tsx`
**การเปลี่ยนแปลง:**
- เปลี่ยนจากใช้ `useSmartWallet` เก่า (Sepolia) เป็นใช้จาก `useContracts` (Base Sepolia)
- แสดง Smart Wallet Address ที่ได้จาก contract
- เปลี่ยน Badge จาก "Sepolia" เป็น "Base Sepolia"
- เปลี่ยน Etherscan link เป็น Basescan
- ลบปุ่ม "Create Smart Wallet" เพราะจะ Deploy อัตโนมัติแล้ว
- ลบฟังก์ชัน `formatBalance` และ import `formatEther` ที่ไม่ได้ใช้

**Step 3: แสดง Smart Wallet Address**
```typescript
const { smartWallet, loading: isLoading } = useSmartWallet(eoaAddress)

// แสดง address พร้อม link ไป Basescan
{smartWallet && (
  <code>{smartWallet}</code>
  <Button onClick={() => window.open(`https://sepolia.basescan.org/address/${smartWallet}`)}>
    View on Basescan
  </Button>
)}
```

## การทำงานของ Logic ใหม่

### Flow Chart:
```
1. User เปิดเว็บ → Privy Login → Connect EOA Wallet
   ↓
2. ตรวจสอบว่ามี Smart Account หรือไม่
   ├─ มีแล้ว → ข้าม Step 2.2, ไปแสดง Address (Step 3)
   └─ ยังไม่มี → Deploy Smart Account ที่ตำแหน่ง (6, 6)
      ↓
3. แสดง Smart Wallet Address ใน WalletInfo component
   ↓
4. แสดง Town Hall Icon ที่ตรงกลาง Map (6, 6) ตั้งแต่เริ่มต้น
```

### Console Logs ที่จะเห็น:
```
[AppPage] Waiting for wallet connection (EOA)...
[AppPage] Checking if Smart Account exists...
[AppPage] Step 2: Deploying Smart Account for new user
[AppPage] Step 3: Smart Account deployed successfully!
[AppPage] Smart Wallet Address: 0x...
[AppPage] Building ID: 1
```

## การทดสอบ

### Test Case 1: User ใหม่ (ยังไม่มี Smart Account)
1. Connect Wallet → ควรเห็น "Waiting for wallet connection"
2. รอ Deploy → ควรเห็น "Deploying Smart Account..."
3. Deploy สำเร็จ → ควรเห็น Smart Wallet Address ใน Sidebar
4. เปิด Map → ควรเห็น Town Hall Icon ที่ตรงกลาง (6, 6)

### Test Case 2: User เก่า (มี Smart Account แล้ว)
1. Connect Wallet → ควรเห็น "Smart Account already exists"
2. ข้าม Deploy → ไม่มีการ Deploy ซ้ำ
3. แสดง Address → ควรเห็น Smart Wallet Address ที่มีอยู่แล้ว
4. เปิด Map → ควรเห็น Town Hall Icon ที่ตรงกลาง (6, 6)

## Network
- **Chain:** Base Sepolia (Chain ID: 84532)
- **Explorer:** https://sepolia.basescan.org
- **Contracts:** ดูที่ `/src/config/contracts.ts`

## หมายเหตุ
- Town Hall Icon จะแสดงที่ตรงกลาง Map (6, 6) เสมอ แม้ว่าจะยังไม่ได้ Deploy Smart Account
- Smart Account จะถูก Deploy อัตโนมัติเมื่อ User login ครั้งแรก
- Smart Wallet Address จะถูกแสดงใน Sidebar (WalletInfo component)
- ไม่มีปุ่ม "Create Smart Wallet" แล้ว เพราะจะ Deploy อัตโนมัติ
