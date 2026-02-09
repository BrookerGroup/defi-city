# Megapot Liquidity Provider Feature Plan

## Overview

เพิ่ม feature ให้ผู้ใช้สามารถ provide liquidity ให้กับ Megapot Lottery เพื่อรับ yield จากค่าธรรมเนียมการซื้อ ticket (20-30% fee share)

### References

- [How to provide liquidity](https://docs.megapot.io/overview/how-to-provide-liquidity)
- [Contract Overview](https://docs.megapot.io/developers/developer-reference/contract-overview)
- [Smart Contract Deep Dive](https://docs.megapot.io/deep-dive/smart-contract)

---

## Task Checklist

### Phase 1: Smart Contract Integration

- [x] Add LP functions to MEGAPOT ABI in `contracts.ts`
- [x] Create `useMegapotLPPosition.ts` hook
- [x] Create `useMegapotLPDeposit.ts` hook
- [x] Create `useMegapotLPWithdraw.ts` hook (includes adjustRisk)

### Phase 2: UI Components

- [x] Create `LotteryLPPanel.tsx` component
- [x] Export hooks in `hooks/index.ts`
- [x] Export component in `components/lottery/index.ts`

### Phase 3: Integration

- [x] Add LotteryLPPanel to game page (LotteryDialog with tabs)
- [x] Build passes successfully
- [ ] Manual test: deposit flow with testnet contract
- [ ] Manual test: withdraw flow
- [ ] Manual test: adjust risk flow

### Phase 4: Polish

- [ ] Add loading states
- [ ] Add error handling edge cases
- [ ] Add transaction history for LP actions
- [ ] Mobile responsive testing

---

## Smart Contract Information

### Contract Address (Base Mainnet)

```
0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95
```

### LP Functions

#### Write Functions

| Function                 | Signature                                                  | Description                                                    |
| ------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------- |
| `lpDeposit`              | `lpDeposit(uint256 riskPercentage, uint256 value) -> bool` | Deposit USDC as liquidity with specified risk %                |
| `lpAdjustRiskPercentage` | `lpAdjustRiskPercentage(uint256 riskPercentage) -> bool`   | Adjust risk exposure (0-100%), set to 0 to initiate withdrawal |
| `withdrawAllLp`          | `withdrawAllLp() -> bool`                                  | Withdraw all LP position after risk is set to 0                |

#### Read Functions

| Function            | Signature                                               | Returns                                    |
| ------------------- | ------------------------------------------------------- | ------------------------------------------ |
| `lpsInfo`           | `lpsInfo(address) -> (uint256, uint256, uint256, bool)` | (principal, stake, riskPercentage, active) |
| `lpPoolTotal`       | `lpPoolTotal() -> uint256`                              | Total LP tokens in pool                    |
| `lpPoolCap`         | `lpPoolCap() -> uint256`                                | Maximum LP cap                             |
| `activeLpAddresses` | `activeLpAddresses(uint256) -> address`                 | Get LP address by index                    |

### Key Parameters

- **Minimum Deposit**: 250 USDC
- **Value Notation**: Szabo (1,000,000 = 1 USDC)
- **Risk Percentage**: 1-100% (determines how much principal guarantees jackpot)
- **Fee Share**: 20-30% of ticket sales
- **Target APY**: ~107% on USDC

---

## Completed Implementation

### Files Created

| File                                                 | Description                       |
| ---------------------------------------------------- | --------------------------------- |
| `frontend/src/config/contracts.ts`                   | Added LP functions to MEGAPOT ABI |
| `frontend/src/hooks/useMegapotLPPosition.ts`         | Read LP position & pool stats     |
| `frontend/src/hooks/useMegapotLPDeposit.ts`          | Deposit liquidity with approval   |
| `frontend/src/hooks/useMegapotLPWithdraw.ts`         | Withdraw + adjust risk            |
| `frontend/src/components/lottery/LotteryLPPanel.tsx` | Main LP UI component              |

### UI Preview

```
┌─────────────────────────────────────────┐
│  LP PROVIDER                    [ACTIVE]│
├─────────────────────────────────────────┤
│  [POSITION] [DEPOSIT] [WITHDRAW]        │
├─────────────────────────────────────────┤
│  YOUR POSITION                          │
│  ┌──────────────┐ ┌──────────────┐     │
│  │ PRINCIPAL    │ │ AT RISK      │     │
│  │ $1,000.00    │ │ $500.00      │     │
│  └──────────────┘ └──────────────┘     │
│  ┌──────────────┐ ┌──────────────┐     │
│  │ RISK %       │ │ YOUR SHARE   │     │
│  │ 50%          │ │ 2.00%        │     │
│  └──────────────┘ └──────────────┘     │
├─────────────────────────────────────────┤
│  POOL STATS                             │
│  Total Pool: $50,000 | Cap: $100,000   │
│  [=============>        ] 50%           │
├─────────────────────────────────────────┤
│  EARN 20-30% OF TICKET FEES             │
│  ~107% TARGET APY                       │
└─────────────────────────────────────────┘
```

### Usage

```tsx
import { LotteryLPPanel } from "@/components/lottery";

<LotteryLPPanel smartWallet={smartWalletAddress} hasSmartWallet={true} />;
```

---

## Technical Considerations

### 1. Smart Wallet vs EOA

- Decide: LP จาก Smart Wallet หรือ EOA?
- ถ้าจาก Smart Wallet: ต้อง transfer USDC ไป Smart Wallet ก่อน
- ถ้าจาก EOA: ง่ายกว่า แต่ไม่ integrate กับ game flow

### 2. Testnet Contract

- ปัจจุบันใช้ Base Sepolia: `0x6f03c7BCaDAdBf5E6F5900DA3d56AdD8FbDac5De`
- ต้องตรวจสอบว่า testnet contract มี LP functions หรือไม่
- ถ้าไม่มี อาจต้อง deploy testnet version ที่รองรับ LP

### 3. USDC Approval

- Mainnet USDC: ต้อง approve ก่อน deposit
- ใช้ infinite approval หรือ exact amount?

### 4. Timing Constraints

- Deposit/withdrawal ทำได้ทุกเมื่อ แต่ process หลัง jackpot
- ต้องแสดง status ชัดเจนว่า pending หรือ processed

---

## Remaining Tasks

### Integration

- [ ] Add `LotteryLPPanel` to appropriate page (e.g., alongside `LotteryPanel`)
- [ ] Verify testnet contract supports LP functions
- [ ] End-to-end testing

### Open Questions

1. **Testnet LP functions**
   - ต้องตรวจสอบว่า Base Sepolia contract (`0x6f03c7BCaDAdBf5E6F5900DA3d56AdD8FbDac5De`) รองรับ LP functions หรือไม่
   - ถ้าไม่รองรับ อาจต้อง mock หรือใช้ mainnet contract สำหรับ testing

2. **UI Placement**
   - แสดงเป็น panel แยกข้าง LotteryPanel?
   - หรือเป็น tab ใน LotteryPanel?

3. **Minimum Deposit**
   - 250 USDC อาจสูงไปสำหรับ testnet
   - พิจารณาลด minimum สำหรับ testnet environment
