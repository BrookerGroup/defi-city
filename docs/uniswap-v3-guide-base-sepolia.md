# คู่มือการใช้งาน Uniswap V3 บน Base Sepolia Testnet

คู่มือนี้อธิบายการใช้งาน Uniswap V3 ตั้งแต่พื้นฐาน สำหรับ developer ที่ต้องการเข้าใจและ integrate Uniswap V3 เข้ากับโปรเจค

## สารบัญ

1. [แนวคิดพื้นฐาน Uniswap V3](#1-แนวคิดพื้นฐาน-uniswap-v3)
2. [Contract Addresses บน Base Sepolia](#2-contract-addresses-บน-base-sepolia)
3. [การหา Pool Address](#3-การหา-pool-address)
4. [การคำนวณ Range LP](#4-การคำนวณ-range-lp)
5. [การ Provide LP](#5-การ-provide-lp)
6. [การ Collect Fee](#6-การ-collect-fee)
7. [การ Remove LP](#7-การ-remove-lp)
8. [การ Add More LP](#8-การ-add-more-lp)

---

## 1. แนวคิดพื้นฐาน Uniswap V3

### 1.1 Concentrated Liquidity คืออะไร?

Uniswap V3 แตกต่างจาก V2 ตรงที่ใช้ **Concentrated Liquidity** - LP สามารถเลือก **ช่วงราคา (Price Range)** ที่ต้องการให้สภาพคล่องทำงาน แทนที่จะกระจายไปทั้ง 0 ถึง infinity

```
Uniswap V2: |████████████████████████████████████| (liquidity กระจายทั้งหมด)
                     $0                    $∞

Uniswap V3: |      |██████████|                   | (liquidity เฉพาะช่วงที่เลือก)
                  $1,800    $2,200
```

**ข้อดี:**
- Capital efficiency สูงขึ้น (ใช้เงินน้อยลงแต่ได้ fee เท่าเดิม)
- ได้ fee เยอะขึ้นถ้าราคาอยู่ในช่วงที่กำหนด

**ข้อเสีย:**
- ถ้าราคาออกนอก range จะไม่ได้ fee
- Impermanent Loss สูงขึ้นในบาง scenario

### 1.2 Tick คืออะไร?

**Tick** คือหน่วยย่อยที่ใช้แทนราคาใน Uniswap V3

```
Price = 1.0001^tick
```

ตัวอย่าง:
- tick = 0 → price = 1.0001^0 = 1
- tick = 100 → price = 1.0001^100 ≈ 1.01
- tick = -100 → price = 1.0001^-100 ≈ 0.99

**Tick Spacing** คือระยะห่างขั้นต่ำระหว่าง tick ที่ใช้ได้ ขึ้นอยู่กับ fee tier:

| Fee Tier | Fee (%) | Tick Spacing |
|----------|---------|--------------|
| 100      | 0.01%   | 1            |
| 500      | 0.05%   | 10           |
| 3000     | 0.30%   | 60           |
| 10000    | 1.00%   | 200          |

### 1.3 sqrtPriceX96 คืออะไร?

Uniswap V3 เก็บราคาในรูป **sqrtPriceX96** เพื่อประหยัด gas และความแม่นยำ:

```
sqrtPriceX96 = sqrt(price) * 2^96
```

**การแปลงค่า:**

```javascript
// sqrtPriceX96 → price
price = (sqrtPriceX96 / 2^96)^2

// price → sqrtPriceX96
sqrtPriceX96 = sqrt(price) * 2^96
```

### 1.4 Token Order (token0/token1)

Uniswap V3 เรียง token ตาม address (lowercase):
- **token0** = address ที่น้อยกว่า
- **token1** = address ที่มากกว่า

```javascript
// ตัวอย่าง
WETH = 0x4200000000000000000000000000000000000006
USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e

// เรียงตาม address: USDC < WETH
token0 = USDC
token1 = WETH

// ดังนั้น price = WETH/USDC (จำนวน USDC ต่อ 1 WETH)
```

---

## 2. Contract Addresses บน Base Sepolia

### 2.1 Uniswap V3 Core Contracts

| Contract | Address | Description |
|----------|---------|-------------|
| **UniswapV3Factory** | `0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24` | สร้างและจัดการ pools |
| **NonfungiblePositionManager** | `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2` | จัดการ LP positions (NFT) |
| **SwapRouter02** | `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4` | Swap tokens |
| **QuoterV2** | `0xC5290058841028F1614F3A6F0F5816cAd0df5E27` | Quote swap amounts |
| **UniversalRouter** | `0x492E6456D9528771018DeB9E87ef7750EF184104` | Multi-protocol router |

### 2.2 Test Tokens (ตัวอย่าง)

| Token | Address | Decimals |
|-------|---------|----------|
| **WETH** | `0x4200000000000000000000000000000000000006` | 18 |
| **USDC** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | 6 |

> **หมายเหตุ:** ตรวจสอบ addresses ล่าสุดที่ [Uniswap Docs](https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments)

### 2.3 Network Config

```javascript
// Base Sepolia
const BASE_SEPOLIA = {
  chainId: 84532,
  rpcUrl: "https://sepolia.base.org",
  blockExplorer: "https://sepolia.basescan.org"
};
```

---

## 3. การหา Pool Address

Pool address คำนวณจาก token pair และ fee tier โดยใช้ CREATE2

### 3.1 Solidity

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUniswapV3Factory {
    function getPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external view returns (address pool);
}

contract PoolFinder {
    address constant FACTORY = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;

    function getPoolAddress(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external view returns (address) {
        return IUniswapV3Factory(FACTORY).getPool(tokenA, tokenB, fee);
    }
}
```

### 3.2 ethers.js

```javascript
import { ethers } from "ethers";

const FACTORY_ADDRESS = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24";
const FACTORY_ABI = [
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address)"
];

async function getPoolAddress(provider, tokenA, tokenB, fee) {
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  const poolAddress = await factory.getPool(tokenA, tokenB, fee);

  if (poolAddress === ethers.ZeroAddress) {
    throw new Error("Pool does not exist");
  }

  return poolAddress;
}

// ตัวอย่างการใช้งาน
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const WETH = "0x4200000000000000000000000000000000000006";
const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const FEE_TIER = 3000; // 0.3%

const poolAddress = await getPoolAddress(provider, WETH, USDC, FEE_TIER);
console.log("Pool Address:", poolAddress);
```

### 3.3 viem

```typescript
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

const FACTORY_ADDRESS = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24";
const FACTORY_ABI = [
  {
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "fee", type: "uint24" }
    ],
    name: "getPool",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

const client = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

async function getPoolAddress(tokenA: string, tokenB: string, fee: number) {
  const poolAddress = await client.readContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getPool",
    args: [tokenA as `0x${string}`, tokenB as `0x${string}`, fee]
  });

  return poolAddress;
}
```

### 3.4 การอ่านข้อมูล Pool

```javascript
const POOL_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function fee() external view returns (uint24)",
  "function tickSpacing() external view returns (int24)",
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function liquidity() external view returns (uint128)"
];

async function getPoolInfo(provider, poolAddress) {
  const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);

  const [token0, token1, fee, tickSpacing, slot0, liquidity] = await Promise.all([
    pool.token0(),
    pool.token1(),
    pool.fee(),
    pool.tickSpacing(),
    pool.slot0(),
    pool.liquidity()
  ]);

  return {
    token0,
    token1,
    fee,
    tickSpacing,
    sqrtPriceX96: slot0.sqrtPriceX96,
    currentTick: slot0.tick,
    liquidity
  };
}
```

---

## 4. การคำนวณ Range LP

### 4.1 แปลง Price ↔ Tick

```javascript
// Price → Tick
function priceToTick(price) {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

// Tick → Price
function tickToPrice(tick) {
  return Math.pow(1.0001, tick);
}

// ตัวอย่าง: ETH price = $2000 USDC
// (สมมติ USDC เป็น token0, WETH เป็น token1)
// price (token1/token0) = 1/2000 = 0.0005
const tick = priceToTick(0.0005); // ≈ -76012
```

### 4.2 ปรับ Tick ให้ตรงกับ Tick Spacing

```javascript
function nearestUsableTick(tick, tickSpacing) {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing;

  // ตรวจสอบ MIN/MAX tick
  const MIN_TICK = -887272;
  const MAX_TICK = 887272;

  if (rounded < MIN_TICK) return MIN_TICK + tickSpacing;
  if (rounded > MAX_TICK) return MAX_TICK - tickSpacing;

  return rounded;
}

// ตัวอย่าง: fee 0.3% → tickSpacing = 60
const tickSpacing = 60;
const lowerTick = nearestUsableTick(-76200, tickSpacing); // -76200
const upperTick = nearestUsableTick(-75600, tickSpacing); // -75600
```

### 4.3 คำนวณ Range จาก % ของราคาปัจจุบัน

```javascript
function calculateTickRange(currentTick, tickSpacing, rangePercent) {
  // คำนวณจำนวน tick ที่ต้องเลื่อน
  // 1 tick ≈ 0.01% price change
  const ticksToMove = Math.floor((rangePercent / 100) / 0.0001);

  const lowerTick = nearestUsableTick(currentTick - ticksToMove, tickSpacing);
  const upperTick = nearestUsableTick(currentTick + ticksToMove, tickSpacing);

  return { lowerTick, upperTick };
}

// ตัวอย่าง: range ±5% จากราคาปัจจุบัน
const currentTick = -76012;
const tickSpacing = 60;
const { lowerTick, upperTick } = calculateTickRange(currentTick, tickSpacing, 5);
// lowerTick ≈ -76500, upperTick ≈ -75540
```

### 4.4 แปลง Tick → sqrtPriceX96

```javascript
import { TickMath } from "@uniswap/v3-sdk";
import JSBI from "jsbi";

// ใช้ Uniswap SDK
const sqrtPriceX96 = TickMath.getSqrtRatioAtTick(-76012);
console.log(sqrtPriceX96.toString());

// หรือคำนวณเอง
function getSqrtRatioAtTick(tick) {
  const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));
  const sqrtPrice = Math.sqrt(Math.pow(1.0001, tick));
  return JSBI.BigInt(Math.floor(sqrtPrice * Number(Q96)));
}
```

### 4.5 คำนวณ Token Amounts จาก Liquidity

```javascript
import { Position, Pool, nearestUsableTick } from "@uniswap/v3-sdk";
import { Token, CurrencyAmount } from "@uniswap/sdk-core";

// สร้าง Token objects
const USDC = new Token(84532, "0x036CbD53842c5426634e7929541eC2318f3dCF7e", 6, "USDC");
const WETH = new Token(84532, "0x4200000000000000000000000000000000000006", 18, "WETH");

// สร้าง Pool object
const pool = new Pool(
  USDC,
  WETH,
  3000,                    // fee
  sqrtPriceX96.toString(), // current sqrtPrice
  liquidity.toString(),    // current liquidity
  currentTick              // current tick
);

// คำนวณจำนวน token ที่ต้องใส่
function getTokenAmountsForLiquidity(pool, tickLower, tickUpper, liquidityAmount) {
  const position = new Position({
    pool,
    liquidity: liquidityAmount,
    tickLower,
    tickUpper
  });

  return {
    amount0: position.amount0.toSignificant(6),
    amount1: position.amount1.toSignificant(6)
  };
}
```

---

## 5. การ Provide LP

### 5.1 ขั้นตอนการ Provide LP

```
1. Approve tokens → NonfungiblePositionManager
2. เรียก mint() เพื่อสร้าง position
3. รับ NFT (tokenId) เป็นหลักฐาน
```

### 5.2 Solidity

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    function mint(MintParams calldata params)
        external
        payable
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        );
}

contract LiquidityProvider {
    address constant POSITION_MANAGER = 0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2;

    function provideLiquidity(
        address token0,
        address token1,
        uint24 fee,
        int24 tickLower,
        int24 tickUpper,
        uint256 amount0Desired,
        uint256 amount1Desired
    ) external returns (uint256 tokenId, uint128 liquidity) {
        // Approve tokens
        IERC20(token0).approve(POSITION_MANAGER, amount0Desired);
        IERC20(token1).approve(POSITION_MANAGER, amount1Desired);

        // Transfer tokens from user
        IERC20(token0).transferFrom(msg.sender, address(this), amount0Desired);
        IERC20(token1).transferFrom(msg.sender, address(this), amount1Desired);

        // Mint position
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: fee,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0Desired,
            amount1Desired: amount1Desired,
            amount0Min: 0,              // ใน production ควรตั้งค่า slippage
            amount1Min: 0,
            recipient: msg.sender,      // ส่ง NFT ให้ user
            deadline: block.timestamp + 600
        });

        (tokenId, liquidity, , ) = INonfungiblePositionManager(POSITION_MANAGER).mint(params);
    }
}
```

### 5.3 ethers.js

```javascript
import { ethers } from "ethers";

const POSITION_MANAGER = "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2";

const POSITION_MANAGER_ABI = [
  "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

async function provideLiquidity(
  signer,
  token0Address,
  token1Address,
  fee,
  tickLower,
  tickUpper,
  amount0Desired,
  amount1Desired
) {
  const positionManager = new ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, signer);
  const token0 = new ethers.Contract(token0Address, ERC20_ABI, signer);
  const token1 = new ethers.Contract(token1Address, ERC20_ABI, signer);

  // Step 1: Approve tokens
  console.log("Approving token0...");
  const tx0 = await token0.approve(POSITION_MANAGER, amount0Desired);
  await tx0.wait();

  console.log("Approving token1...");
  const tx1 = await token1.approve(POSITION_MANAGER, amount1Desired);
  await tx1.wait();

  // Step 2: Mint position
  console.log("Minting position...");
  const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes

  const mintParams = {
    token0: token0Address,
    token1: token1Address,
    fee: fee,
    tickLower: tickLower,
    tickUpper: tickUpper,
    amount0Desired: amount0Desired,
    amount1Desired: amount1Desired,
    amount0Min: 0,  // ควรคำนวณ slippage protection
    amount1Min: 0,
    recipient: await signer.getAddress(),
    deadline: deadline
  };

  const tx = await positionManager.mint(mintParams);
  const receipt = await tx.wait();

  // Parse event เพื่อดึง tokenId
  const iface = new ethers.Interface([
    "event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
  ]);

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed.name === "IncreaseLiquidity") {
        return {
          tokenId: parsed.args.tokenId,
          liquidity: parsed.args.liquidity,
          amount0: parsed.args.amount0,
          amount1: parsed.args.amount1
        };
      }
    } catch (e) {
      continue;
    }
  }
}

// ตัวอย่างการใช้งาน
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const signer = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);

const result = await provideLiquidity(
  signer,
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC (token0)
  "0x4200000000000000000000000000000000000006", // WETH (token1)
  3000,                                          // 0.3% fee
  -76500,                                        // tickLower
  -75540,                                        // tickUpper
  ethers.parseUnits("100", 6),                   // 100 USDC
  ethers.parseEther("0.05")                      // 0.05 WETH
);

console.log("Position created:", result);
```

### 5.4 viem

```typescript
import { createWalletClient, http, parseUnits, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const POSITION_MANAGER = "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2";

const POSITION_MANAGER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "token0", type: "address" },
          { name: "token1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickLower", type: "int24" },
          { name: "tickUpper", type: "int24" },
          { name: "amount0Desired", type: "uint256" },
          { name: "amount1Desired", type: "uint256" },
          { name: "amount0Min", type: "uint256" },
          { name: "amount1Min", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "mint",
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "liquidity", type: "uint128" },
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" }
    ],
    stateMutability: "payable",
    type: "function"
  }
] as const;

const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

async function provideLiquidity(
  account: `0x${string}`,
  token0: `0x${string}`,
  token1: `0x${string}`,
  fee: number,
  tickLower: number,
  tickUpper: number,
  amount0Desired: bigint,
  amount1Desired: bigint
) {
  const walletClient = createWalletClient({
    account: privateKeyToAccount(account),
    chain: baseSepolia,
    transport: http()
  });

  // Approve tokens
  await walletClient.writeContract({
    address: token0,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [POSITION_MANAGER, amount0Desired]
  });

  await walletClient.writeContract({
    address: token1,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [POSITION_MANAGER, amount1Desired]
  });

  // Mint position
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

  const hash = await walletClient.writeContract({
    address: POSITION_MANAGER,
    abi: POSITION_MANAGER_ABI,
    functionName: "mint",
    args: [{
      token0,
      token1,
      fee,
      tickLower,
      tickUpper,
      amount0Desired,
      amount1Desired,
      amount0Min: 0n,
      amount1Min: 0n,
      recipient: walletClient.account.address,
      deadline
    }]
  });

  return hash;
}
```

---

## 6. การ Collect Fee

### 6.1 ขั้นตอนการ Collect Fee

```
1. เรียก collect() ด้วย tokenId
2. ระบุจำนวน fee สูงสุดที่ต้องการเก็บ (ใช้ uint128.max เพื่อเก็บทั้งหมด)
3. รับ tokens กลับ
```

### 6.2 Solidity

```solidity
interface INonfungiblePositionManager {
    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    function collect(CollectParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1);
}

contract FeeCollector {
    address constant POSITION_MANAGER = 0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2;

    function collectFees(uint256 tokenId) external returns (uint256 amount0, uint256 amount1) {
        INonfungiblePositionManager.CollectParams memory params = INonfungiblePositionManager.CollectParams({
            tokenId: tokenId,
            recipient: msg.sender,
            amount0Max: type(uint128).max,  // เก็บ fee ทั้งหมด
            amount1Max: type(uint128).max
        });

        (amount0, amount1) = INonfungiblePositionManager(POSITION_MANAGER).collect(params);
    }
}
```

### 6.3 ethers.js

```javascript
const POSITION_MANAGER_ABI = [
  "function collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external payable returns (uint256 amount0, uint256 amount1)",
  "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)"
];

async function getUnclaimedFees(provider, tokenId) {
  const positionManager = new ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, provider);
  const position = await positionManager.positions(tokenId);

  return {
    token0: position.token0,
    token1: position.token1,
    tokensOwed0: position.tokensOwed0,  // unclaimed fee token0
    tokensOwed1: position.tokensOwed1   // unclaimed fee token1
  };
}

async function collectFees(signer, tokenId) {
  const positionManager = new ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, signer);

  const collectParams = {
    tokenId: tokenId,
    recipient: await signer.getAddress(),
    amount0Max: ethers.MaxUint256,  // uint128 max
    amount1Max: ethers.MaxUint256
  };

  const tx = await positionManager.collect(collectParams);
  const receipt = await tx.wait();

  console.log("Fees collected:", receipt);
  return receipt;
}

// ตัวอย่างการใช้งาน
const tokenId = 12345; // NFT tokenId ของ position

// ดู unclaimed fees
const fees = await getUnclaimedFees(provider, tokenId);
console.log("Unclaimed fees:", fees);

// Collect fees
const result = await collectFees(signer, tokenId);
```

### 6.4 viem

```typescript
const COLLECT_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "amount0Max", type: "uint128" },
          { name: "amount1Max", type: "uint128" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "collect",
    outputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" }
    ],
    stateMutability: "payable",
    type: "function"
  }
] as const;

async function collectFees(walletClient: any, tokenId: bigint) {
  const MAX_UINT128 = 2n ** 128n - 1n;

  const hash = await walletClient.writeContract({
    address: POSITION_MANAGER,
    abi: COLLECT_ABI,
    functionName: "collect",
    args: [{
      tokenId,
      recipient: walletClient.account.address,
      amount0Max: MAX_UINT128,
      amount1Max: MAX_UINT128
    }]
  });

  return hash;
}
```

---

## 7. การ Remove LP

### 7.1 ขั้นตอนการ Remove LP

```
1. decreaseLiquidity() - ลด liquidity (แปลงเป็น tokens owed)
2. collect() - เก็บ tokens ที่ได้จาก liquidity + fees
3. (optional) burn() - ถ้า liquidity = 0 และ fees = 0
```

### 7.2 Solidity

```solidity
interface INonfungiblePositionManager {
    struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

    function decreaseLiquidity(DecreaseLiquidityParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1);

    function burn(uint256 tokenId) external payable;

    function positions(uint256 tokenId)
        external
        view
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        );
}

contract LiquidityRemover {
    address constant POSITION_MANAGER = 0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2;

    function removeLiquidity(uint256 tokenId) external returns (uint256 amount0, uint256 amount1) {
        INonfungiblePositionManager pm = INonfungiblePositionManager(POSITION_MANAGER);

        // Get current liquidity
        (,,,,,,, uint128 liquidity,,,,) = pm.positions(tokenId);

        // Step 1: Decrease liquidity (remove all)
        INonfungiblePositionManager.DecreaseLiquidityParams memory decreaseParams =
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: tokenId,
                liquidity: liquidity,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp + 600
            });

        pm.decreaseLiquidity(decreaseParams);

        // Step 2: Collect tokens + fees
        INonfungiblePositionManager.CollectParams memory collectParams =
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: msg.sender,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            });

        (amount0, amount1) = pm.collect(collectParams);

        // Step 3: Burn NFT (optional - ถ้าต้องการลบ position ทั้งหมด)
        // pm.burn(tokenId);
    }

    // Remove บางส่วน
    function removePartialLiquidity(
        uint256 tokenId,
        uint128 liquidityToRemove
    ) external returns (uint256 amount0, uint256 amount1) {
        INonfungiblePositionManager pm = INonfungiblePositionManager(POSITION_MANAGER);

        INonfungiblePositionManager.DecreaseLiquidityParams memory params =
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: tokenId,
                liquidity: liquidityToRemove,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp + 600
            });

        pm.decreaseLiquidity(params);

        // Collect
        INonfungiblePositionManager.CollectParams memory collectParams =
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: msg.sender,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            });

        (amount0, amount1) = pm.collect(collectParams);
    }
}
```

### 7.3 ethers.js

```javascript
const POSITION_MANAGER_ABI = [
  "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
  "function decreaseLiquidity((uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint256 amount0, uint256 amount1)",
  "function collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external payable returns (uint256 amount0, uint256 amount1)",
  "function burn(uint256 tokenId) external payable"
];

async function getPositionLiquidity(provider, tokenId) {
  const pm = new ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, provider);
  const position = await pm.positions(tokenId);
  return position.liquidity;
}

async function removeLiquidity(signer, tokenId, liquidityToRemove = null) {
  const pm = new ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, signer);

  // ถ้าไม่ระบุ liquidity ให้ remove ทั้งหมด
  if (liquidityToRemove === null) {
    const position = await pm.positions(tokenId);
    liquidityToRemove = position.liquidity;
  }

  const deadline = Math.floor(Date.now() / 1000) + 600;
  const recipientAddress = await signer.getAddress();

  // Step 1: Decrease liquidity
  console.log("Decreasing liquidity...");
  const decreaseTx = await pm.decreaseLiquidity({
    tokenId: tokenId,
    liquidity: liquidityToRemove,
    amount0Min: 0,
    amount1Min: 0,
    deadline: deadline
  });
  await decreaseTx.wait();

  // Step 2: Collect tokens
  console.log("Collecting tokens...");
  const collectTx = await pm.collect({
    tokenId: tokenId,
    recipient: recipientAddress,
    amount0Max: ethers.MaxUint256,
    amount1Max: ethers.MaxUint256
  });
  const receipt = await collectTx.wait();

  console.log("Liquidity removed successfully");
  return receipt;
}

// Remove ทั้งหมดและ burn NFT
async function removeAllAndBurn(signer, tokenId) {
  const pm = new ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, signer);

  // Remove all liquidity
  await removeLiquidity(signer, tokenId);

  // Burn NFT
  console.log("Burning NFT...");
  const burnTx = await pm.burn(tokenId);
  await burnTx.wait();

  console.log("Position burned");
}
```

### 7.4 viem

```typescript
const DECREASE_LIQUIDITY_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "liquidity", type: "uint128" },
          { name: "amount0Min", type: "uint256" },
          { name: "amount1Min", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "decreaseLiquidity",
    outputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" }
    ],
    stateMutability: "payable",
    type: "function"
  }
] as const;

async function removeLiquidity(
  walletClient: any,
  publicClient: any,
  tokenId: bigint,
  liquidity: bigint
) {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

  // Decrease liquidity
  const decreaseHash = await walletClient.writeContract({
    address: POSITION_MANAGER,
    abi: DECREASE_LIQUIDITY_ABI,
    functionName: "decreaseLiquidity",
    args: [{
      tokenId,
      liquidity,
      amount0Min: 0n,
      amount1Min: 0n,
      deadline
    }]
  });

  await publicClient.waitForTransactionReceipt({ hash: decreaseHash });

  // Collect tokens
  const collectHash = await collectFees(walletClient, tokenId);

  return collectHash;
}
```

---

## 8. การ Add More LP

### 8.1 ขั้นตอนการ Add More LP

มี 2 วิธี:
1. **increaseLiquidity()** - เพิ่ม liquidity ใน position เดิม (ใช้ tokenId เดิม)
2. **mint()** - สร้าง position ใหม่ (ได้ tokenId ใหม่)

### 8.2 Solidity - Increase Liquidity

```solidity
interface INonfungiblePositionManager {
    struct IncreaseLiquidityParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

    function increaseLiquidity(IncreaseLiquidityParams calldata params)
        external
        payable
        returns (
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        );
}

contract LiquidityIncreaser {
    address constant POSITION_MANAGER = 0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2;

    function addMoreLiquidity(
        uint256 tokenId,
        address token0,
        address token1,
        uint256 amount0Desired,
        uint256 amount1Desired
    ) external returns (uint128 liquidity) {
        // Approve tokens
        IERC20(token0).approve(POSITION_MANAGER, amount0Desired);
        IERC20(token1).approve(POSITION_MANAGER, amount1Desired);

        // Transfer from user
        IERC20(token0).transferFrom(msg.sender, address(this), amount0Desired);
        IERC20(token1).transferFrom(msg.sender, address(this), amount1Desired);

        INonfungiblePositionManager.IncreaseLiquidityParams memory params =
            INonfungiblePositionManager.IncreaseLiquidityParams({
                tokenId: tokenId,
                amount0Desired: amount0Desired,
                amount1Desired: amount1Desired,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp + 600
            });

        (liquidity, , ) = INonfungiblePositionManager(POSITION_MANAGER).increaseLiquidity(params);
    }
}
```

### 8.3 ethers.js - Increase Liquidity

```javascript
const POSITION_MANAGER_ABI = [
  "function increaseLiquidity((uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)"
];

async function addMoreLiquidity(signer, tokenId, amount0Desired, amount1Desired) {
  const pm = new ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, signer);

  // Get position info to find token addresses
  const position = await pm.positions(tokenId);
  const { token0, token1 } = position;

  // Approve tokens
  const token0Contract = new ethers.Contract(token0, ERC20_ABI, signer);
  const token1Contract = new ethers.Contract(token1, ERC20_ABI, signer);

  console.log("Approving tokens...");
  await (await token0Contract.approve(POSITION_MANAGER, amount0Desired)).wait();
  await (await token1Contract.approve(POSITION_MANAGER, amount1Desired)).wait();

  // Increase liquidity
  console.log("Increasing liquidity...");
  const deadline = Math.floor(Date.now() / 1000) + 600;

  const tx = await pm.increaseLiquidity({
    tokenId: tokenId,
    amount0Desired: amount0Desired,
    amount1Desired: amount1Desired,
    amount0Min: 0,
    amount1Min: 0,
    deadline: deadline
  });

  const receipt = await tx.wait();
  console.log("Liquidity increased successfully");

  return receipt;
}

// ตัวอย่างการใช้งาน
const tokenId = 12345;
const result = await addMoreLiquidity(
  signer,
  tokenId,
  ethers.parseUnits("50", 6),   // เพิ่ม 50 USDC
  ethers.parseEther("0.025")    // เพิ่ม 0.025 WETH
);
```

### 8.4 viem - Increase Liquidity

```typescript
const INCREASE_LIQUIDITY_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "amount0Desired", type: "uint256" },
          { name: "amount1Desired", type: "uint256" },
          { name: "amount0Min", type: "uint256" },
          { name: "amount1Min", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "increaseLiquidity",
    outputs: [
      { name: "liquidity", type: "uint128" },
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" }
    ],
    stateMutability: "payable",
    type: "function"
  }
] as const;

async function addMoreLiquidity(
  walletClient: any,
  tokenId: bigint,
  amount0Desired: bigint,
  amount1Desired: bigint
) {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

  const hash = await walletClient.writeContract({
    address: POSITION_MANAGER,
    abi: INCREASE_LIQUIDITY_ABI,
    functionName: "increaseLiquidity",
    args: [{
      tokenId,
      amount0Desired,
      amount1Desired,
      amount0Min: 0n,
      amount1Min: 0n,
      deadline
    }]
  });

  return hash;
}
```

---

## สรุป Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Uniswap V3 LP Workflow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Find Pool                                                   │
│     Factory.getPool(tokenA, tokenB, fee) → poolAddress          │
│                                                                 │
│  2. Get Pool Info                                               │
│     Pool.slot0() → sqrtPriceX96, currentTick                   │
│     Pool.tickSpacing() → tickSpacing                           │
│                                                                 │
│  3. Calculate Range                                             │
│     currentTick ± margin → lowerTick, upperTick                │
│     nearestUsableTick() → aligned ticks                        │
│                                                                 │
│  4. Provide LP                                                  │
│     approve() → PositionManager.mint() → tokenId (NFT)         │
│                                                                 │
│  5. Manage Position                                             │
│     ├─ Collect Fees: collect(tokenId)                          │
│     ├─ Add More: increaseLiquidity(tokenId, amounts)           │
│     └─ Remove: decreaseLiquidity() → collect() → burn()        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Resources

- [Uniswap V3 Docs](https://docs.uniswap.org/)
- [Uniswap V3 SDK](https://github.com/Uniswap/v3-sdk)
- [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)

---

*สร้างโดย: Auto-Position Project*
*อัปเดตล่าสุด: 2025*
