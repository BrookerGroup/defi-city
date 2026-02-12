# Pendle Fixed Yield Staking Building Plan

## Overview

Building type: **"staking"** -- User ฝาก USDC → ซื้อ PT (Principal Token) ผ่าน Pendle
Lock จนถึง maturity date → ได้ **fixed yield การันตี** เช่น 8% APY
เหมาะเป็น building ที่มี lock period จริง + yield ที่แน่นอน

## ทำไมต้อง Pendle?

- **Fixed yield** -- user รู้ล่วงหน้าว่าจะได้เท่าไหร่ (เช่น ซื้อ PT ราคา 0.95 → maturity ได้ 1.0 USDC = 5% yield)
- **มี lock จริง** -- ต้องรอถึง maturity date (3-12 เดือน) เข้ากับ game mechanic
- **ขายก่อนได้** -- ผ่าน Pendle AMM แต่อาจได้น้อยกว่า
- **ต่างจาก Morpho Vault** -- Morpho = flexible earn, Pendle = locked fixed yield

## Pendle หลักการทำงาน

```
USDC → [Pendle Router] → ซื้อ PT-USDC ในราคาต่ำกว่า face value
                              |
                          PT-USDC (ถือไว้)
                              |
              ┌───────────────┴───────────────┐
              |                               |
      ถึง Maturity                    ก่อน Maturity
      Redeem PT → ได้ USDC เต็ม      ขายผ่าน AMM → อาจได้น้อยกว่า
      (fixed yield ตามที่คำนวณ)       (market price)
```

**ตัวอย่าง:**
- User ฝาก 1000 USDC → ได้ PT-USDC ~1052 PT (implied yield 5.2%)
- รอ maturity 6 เดือน → redeem 1052 PT = 1052 USDC
- กำไร = 52 USDC (5.2% fixed)

## Contract Addresses (Base Mainnet)

| Contract | Address |
|---|---|
| **Pendle Router V4** | `0x888888888889758F76e7103c6CbF23ABbF58F946` |
| **Router Static** | `0xB4205a645c7e920BD8504181B1D7f2c5C955C3e7` |

> Market addresses เปลี่ยนตาม maturity date -- ต้อง query จาก Pendle API
> `GET https://api-v2.pendle.finance/core/v1/markets/all?chainId=8453`

> **Testnet:** ไม่มี official deployment → ต้องสร้าง Mock

## Architecture

```
User → SmartWallet → StakingAdapter (preparePlace/Harvest/Demolish)
                          |
                    Pendle Router V4
                    ├── swapExactTokenForPt (buy PT)
                    ├── swapExactPtForToken (sell PT before maturity)
                    └── redeemPyToToken (redeem PT at maturity)
```

## Key Interfaces (from @pendle/core-v2)

### Router -- ซื้อ PT
```solidity
function swapExactTokenForPt(
    address receiver,
    address market,
    uint256 minPtOut,
    ApproxParams calldata guessPtOut,
    TokenInput calldata input,
    LimitOrderData calldata limit
) external payable returns (uint256 netPtOut, uint256 netSyFee, uint256 netSyInterm);
```

### Router -- ขาย PT ก่อน maturity
```solidity
function swapExactPtForToken(
    address receiver,
    address market,
    uint256 exactPtIn,
    TokenOutput calldata output,
    LimitOrderData calldata limit
) external returns (uint256 netTokenOut, uint256 netSyFee, uint256 netSyInterm);
```

### Router -- Redeem PT หลัง maturity
```solidity
function redeemPyToToken(
    address receiver,
    address YT,
    uint256 netPyIn,
    TokenOutput calldata output
) external returns (uint256 netTokenOut, uint256 netSyInterm);
```

### Market -- อ่านข้อมูล
```solidity
function readTokens() external view returns (
    IStandardizedYield _SY,
    IPPrincipalToken _PT,
    IPYieldToken _YT
);
function expiry() external view returns (uint256);
function isExpired() external view returns (bool);
```

### Key Structs
```solidity
struct TokenInput {
    address tokenIn;        // USDC
    uint256 netTokenIn;     // amount
    address tokenMintSy;    // USDC (same)
    address pendleSwap;     // address(0) -- no aggregator
    SwapData swapData;      // empty
}

struct TokenOutput {
    address tokenOut;       // USDC
    uint256 minTokenOut;    // slippage protection
    address tokenRedeemSy;  // USDC
    address pendleSwap;     // address(0)
    SwapData swapData;      // empty
}

struct ApproxParams {
    uint256 guessMin;       // 0
    uint256 guessMax;       // type(uint256).max
    uint256 guessOffchain;  // 0
    uint256 maxIteration;   // 256
    uint256 eps;            // 1e14 (0.01%)
}
```

## Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `contracts/interfaces/IPendleRouter.sol` | Simplified Pendle Router interface |
| 2 | `contracts/mocks/MockPendleRouter.sol` | Mock Router + Market + PT สำหรับ test |
| 3 | `contracts/adapters/StakingAdapter.sol` | IBuildingAdapter for "staking" |

## Files to Modify

| File | Change |
|------|--------|
| `ignition/modules/IntegrationContracts.ts` | Deploy mocks + StakingAdapter + register |

## IPendleRouter.sol (Simplified)

ใช้เฉพาะ function ที่ต้องการ:

```solidity
interface IPendleRouter {
    // Buy PT with token
    function swapExactTokenForPt(
        address receiver, address market, uint256 minPtOut,
        ApproxParams calldata guessPtOut,
        TokenInput calldata input,
        LimitOrderData calldata limit
    ) external payable returns (uint256 netPtOut, uint256 netSyFee, uint256 netSyInterm);

    // Sell PT for token (before maturity)
    function swapExactPtForToken(
        address receiver, address market, uint256 exactPtIn,
        TokenOutput calldata output,
        LimitOrderData calldata limit
    ) external returns (uint256 netTokenOut, uint256 netSyFee, uint256 netSyInterm);

    // Redeem PT at maturity
    function redeemPyToToken(
        address receiver, address YT, uint256 netPyIn,
        TokenOutput calldata output
    ) external returns (uint256 netTokenOut, uint256 netSyInterm);
}

interface IPendleMarket {
    function readTokens() external view returns (address SY, address PT, address YT);
    function expiry() external view returns (uint256);
    function isExpired() external view returns (bool);
}
```

## MockPendleRouter.sol

จำลอง Pendle Router สำหรับ test:

```solidity
contract MockPendleRouter {
    // Simplified: USDC in → mint mock PT → hold USDC
    // swapExactTokenForPt: pull USDC, mint PT ให้ receiver (1 USDC = 1.05 PT สมมติ)
    // swapExactPtForToken: burn PT, return USDC (ตาม rate)
    // redeemPyToToken: burn PT 1:1 → return USDC (at maturity)

    // Config
    uint256 public impliedRate = 1050000; // 1.05x (5% yield) in 6 decimals
    uint256 public maturityTimestamp;
    MockPT public pt;

    function setImpliedRate(uint256 rate) external;
    function setMaturity(uint256 timestamp) external;
}

contract MockPT is ERC20 {
    // Simple ERC20 representing PT token
    address public router;
    function mint(address to, uint256 amount) external; // only router
    function burn(address from, uint256 amount) external; // only router
}
```

## StakingAdapter.sol

**Constructor:** `(address _core, address _pendleRouter, address _asset, address _treasury)`

**Structs:**
```solidity
struct PlaceParams {
    uint256 amount;
    address market;      // Pendle market address
    uint256 minPtOut;    // slippage protection
    uint256 x;
    uint256 y;
}

struct HarvestParams {
    // Pendle PT ไม่มี harvest ระหว่างทาง
    // yield ได้ตอน redeem ที่ maturity เท่านั้น
}

struct DemolishParams {
    uint256 ptAmount;
    address market;
    bool isMatured;       // true = redeem at maturity, false = sell via AMM
    uint256 minTokenOut;  // slippage protection
}
```

### preparePlace → 3 calls:
1. `USDC.approve(pendleRouter, amount)`
2. `router.swapExactTokenForPt(smartWallet, market, minPtOut, approxParams, tokenInput, limitData)`
3. `core.recordBuildingPlacement(user, "staking", USDC, amount, x, y, metadata)`
   - metadata: `abi.encode("pendle_pt", market, minPtOut)`

### prepareHarvest → ไม่มี harvest ระหว่างทาง
- PT ไม่มี yield ให้ claim ระหว่าง lock
- Yield ได้ตอน redeem ที่ maturity
- อาจ return empty arrays หรือ revert "No harvest for staking"

### prepareDemolish → 2 calls (สอง path):

**Path A: Matured (isMatured=true)** -- redeem PT ที่ maturity
1. `PT.approve(router, ptAmount)` + `router.redeemPyToToken(smartWallet, YT, ptAmount, output)`
2. `core.recordDemolition(user, buildingId, amount)`

**Path B: Early exit (isMatured=false)** -- ขาย PT ผ่าน AMM
1. `PT.approve(router, ptAmount)` + `router.swapExactPtForToken(smartWallet, market, ptAmount, output, limit)`
2. `core.recordDemolition(user, buildingId, amount)`

## IntegrationContracts.ts Changes

```typescript
const mockPT = m.contract("MockPT", ["Mock PT-USDC", "PT-USDC"]);
const mockPendleRouter = m.contract("MockPendleRouter", [mockUSDC, mockPT]);

const stakingAdapter = m.contract("StakingAdapter", [
  defiCityCore, mockPendleRouter, mockUSDC, treasuryAddress
]);

m.call(buildingRegistry, "registerAdapter", [
  "staking", stakingAdapter
], { id: "RegisterStakingAdapter" });
```

## Data Flow

```
Place:  SmartWallet → [USDC.approve, Router.swapExactTokenForPt, Core.record]
        Router → swap USDC for PT via Pendle AMM → PT goes to SmartWallet

Demolish (at maturity):
  SmartWallet → [PT.approve + Router.redeemPyToToken, Core.recordDemolition]
  Router → burn PT → return USDC at 1:1 → SmartWallet gets USDC + yield

Demolish (before maturity / early exit):
  SmartWallet → [PT.approve + Router.swapExactPtForToken, Core.recordDemolition]
  Router → sell PT via AMM → SmartWallet gets USDC (อาจน้อยกว่า face value)
```

## Game Mechanic Ideas

| Mechanic | Implementation |
|---|---|
| Lock period | Maturity date จาก Pendle market (3-12 เดือน) |
| Building level | ยิ่ง lock นาน (maturity ไกล) = level สูง = yield เยอะ |
| Fixed yield | แสดง implied APY ตอน place building |
| Early exit penalty | ขายผ่าน AMM ได้น้อยกว่า (market rate, ไม่ใช่ penalty จาก contract) |
| Maturity event | เมื่อถึง maturity → UI แจ้ง "Building พร้อม harvest!" |

## Mainnet vs Testnet

| | Testnet | Mainnet |
|---|---|---|
| Router | MockPendleRouter | `0x888888888889758F76e7103c6CbF23ABbF58F946` |
| Market | MockPendleMarket | Query from Pendle API |
| PT | MockPT | From market.readTokens() |

## Verification

1. `npx hardhat compile`
2. deposit USDC → ได้ PT
3. ก่อน maturity: sell PT → ได้ USDC (ตาม market rate)
4. หลัง maturity: redeem PT → ได้ USDC 1:1 + yield
5. adapter.prepareDemolish(isMatured=true) → redeem path
6. adapter.prepareDemolish(isMatured=false) → AMM sell path

## Dependencies

```bash
npm install @pendle/core-v2
```

หรือสร้าง simplified interface เอง (แนะนำ เพราะ @pendle/core-v2 อาจ bloat)
