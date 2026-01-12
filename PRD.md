# DeFi City Builder - Product Requirements Document

## Overview

**DeFi City** เป็นเกม City Builder ที่ทำให้การบริหารเงินบน DeFi เป็นเรื่องง่ายและสนุก โดยแปลง DeFi concepts ให้เป็น game mechanics ที่เข้าใจง่าย

### Core Concept

| Game Concept | DeFi Reality |
|--------------|--------------|
| เมือง (City) | Portfolio ของผู้ใช้ |
| อาคาร (Buildings) | DeFi Strategies |
| ทรัพยากร (Resources) | Real Crypto Assets |
| เล่นเกม | บริหารเงินบน DeFi |

---

## Target Users

- **Web3 Beginners**: ผู้ที่สนใจ DeFi แต่ไม่รู้จะเริ่มต้นยังไง
- **Passive Investors**: ต้องการ yield โดยไม่ต้องเรียนรู้ DeFi protocols ที่ซับซ้อน
- **Gamers**: ชอบเกม City Builder และต้องการ earn real crypto

---

## Core Features

### 1. Smart Wallet System

#### 1.1 Wallet Creation
- ใช้ **Account Abstraction (ERC-4337)** สร้าง Smart Wallet
- Social Login (Google, Apple, Email) - ไม่ต้องจำ seed phrase
- Gasless transactions (Paymaster sponsored)

#### 1.2 Deposit Flow
```
User → Deposit USDC/ETH → Smart Wallet → Game Portfolio
```

#### 1.3 Withdrawal Flow
```
Game Portfolio → Smart Wallet → User's EOA/CEX
```

---

### 2. Building Types (DeFi Strategies)

#### 2.1 Yield Farm (Aave Integration)
| Attribute | Value |
|-----------|-------|
| Strategy | USDC → Aave Lending |
| Expected APY | 3-8% |
| Risk Level | Low |
| Min Deposit | 10 USDC |

**Smart Contract Flow:**
```solidity
// Deposit
USDC.approve(aavePool, amount);
aavePool.supply(USDC, amount, smartWallet, 0);

// Withdraw
aavePool.withdraw(USDC, amount, smartWallet);
```

#### 2.2 Staking Camp (Lido/Rocket Pool)
| Attribute | Value |
|-----------|-------|
| Strategy | ETH → stETH/rETH |
| Expected APY | 3-5% |
| Risk Level | Low-Medium |
| Min Deposit | 0.01 ETH |

#### 2.3 LP Mine (Uniswap Integration)
| Attribute | Value |
|-----------|-------|
| Strategy | ETH-USDC LP on Uniswap V3 |
| Expected APY | 5-20% (variable) |
| Risk Level | Medium-High |
| Min Deposit | 50 USDC equivalent |

**Smart Contract Flow:**
```solidity
// Add Liquidity
uniswapRouter.addLiquidity(
    tokenA, tokenB,
    amountA, amountB,
    minA, minB,
    smartWallet,
    deadline
);

// Remove Liquidity
uniswapRouter.removeLiquidity(...);
```

#### 2.4 Castle (Governance Vault)
| Attribute | Value |
|-----------|-------|
| Strategy | veToken Locking (e.g., veCRV, veBAL) |
| Boost | +25% yields on other buildings |
| Lock Period | 90 days |
| Min Deposit | 1000 USDC equivalent |

#### 2.5 Shop (DEX Aggregator)
| Attribute | Value |
|-----------|-------|
| Strategy | Swap fees rebate |
| Expected APY | Variable (based on volume) |
| Risk Level | Low |

---

### 3. Resource System

#### 3.1 In-Game Resources
| Resource | Real Asset | Usage |
|----------|------------|-------|
| Gold Coins | USDC/USDT | Build, upgrade |
| Ethereum | ETH | Premium buildings |
| LP Tokens | Uniswap LP | Special structures |

#### 3.2 Resource Generation
- Buildings generate resources based on **real DeFi yields**
- UI shows both game value and real USD value
- Auto-compound option available

---

### 4. Game Mechanics

#### 4.1 City Progression
```
Level 1: Town Hall + 3 Yield Farms
Level 2: Unlock Staking Camp
Level 3: Unlock LP Mine
Level 4: Unlock Castle
Level 5: Unlock Advanced Strategies
```

#### 4.2 Risk Management
- **Walls**: Insurance protocols (Nexus Mutual)
- **Guard Towers**: Stop-loss automation
- **Moat**: Diversification bonus

#### 4.3 Social Features
- Visit friends' cities
- Guild system (shared vaults)
- Leaderboards (by TVL, APY, city level)

---

## Technical Architecture

### 5.1 Smart Contract Stack

```
┌─────────────────────────────────────────────┐
│              DeFiCity Protocol              │
├─────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐           │
│  │ Smart Wallet│  │   Vault     │           │
│  │  (ERC-4337) │  │  Manager    │           │
│  └──────┬──────┘  └──────┬──────┘           │
│         │                │                  │
│  ┌──────▼────────────────▼──────┐           │
│  │      Strategy Router          │           │
│  └──────────────┬───────────────┘           │
│                 │                           │
│  ┌──────────────▼───────────────┐           │
│  │       Strategy Adapters       │           │
│  │  ┌─────┐ ┌─────┐ ┌─────────┐ │           │
│  │  │Aave │ │Lido │ │Uniswap  │ │           │
│  │  └─────┘ └─────┘ └─────────┘ │           │
│  └──────────────────────────────┘           │
└─────────────────────────────────────────────┘
```

### 5.2 Key Contracts

#### SmartWallet.sol
```solidity
contract SmartWallet is ERC4337Account {
    address public owner;

    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyOwner returns (bytes memory);

    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external onlyOwner;
}
```

#### VaultManager.sol
```solidity
contract VaultManager {
    mapping(address => mapping(bytes32 => uint256)) public positions;

    function deposit(
        bytes32 strategyId,
        address token,
        uint256 amount
    ) external;

    function withdraw(
        bytes32 strategyId,
        uint256 shares
    ) external;

    function harvest(bytes32 strategyId) external;
}
```

#### AaveStrategy.sol
```solidity
contract AaveStrategy is IStrategy {
    IPool public aavePool;

    function deposit(address token, uint256 amount) external override {
        IERC20(token).approve(address(aavePool), amount);
        aavePool.supply(token, amount, address(this), 0);
    }

    function withdraw(address token, uint256 amount) external override {
        aavePool.withdraw(token, amount, msg.sender);
    }

    function getAPY() external view override returns (uint256) {
        // Get current supply APY from Aave
    }
}
```

#### UniswapStrategy.sol
```solidity
contract UniswapStrategy is IStrategy {
    INonfungiblePositionManager public positionManager;

    function deposit(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1,
        int24 tickLower,
        int24 tickUpper
    ) external returns (uint256 tokenId);

    function withdraw(uint256 tokenId) external;

    function collectFees(uint256 tokenId) external;
}
```

### 5.3 Frontend Stack

```
┌────────────────────────────────────────┐
│           DeFi City Frontend           │
├────────────────────────────────────────┤
│  Next.js 14 (App Router)               │
│  ├── PixiJS (Game Rendering)           │
│  ├── wagmi + viem (Web3)               │
│  ├── Privy/Dynamic (Smart Wallet)      │
│  └── TanStack Query (Data Fetching)    │
└────────────────────────────────────────┘
```

---

## Integrations

### 6.1 Aave V3 (Primary Lending)
- **Networks**: Ethereum, Arbitrum, Base
- **Assets**: USDC, USDT, DAI, ETH, WBTC
- **Features**: Supply, Borrow, Flash Loans

### 6.2 Uniswap V3 (Primary DEX)
- **Networks**: Ethereum, Arbitrum, Base, Polygon
- **Features**:
  - Concentrated Liquidity Positions
  - Auto-rebalancing ranges
  - Fee tier optimization (0.05%, 0.3%, 1%)

### 6.3 Future Integrations
- **Lido**: ETH Liquid Staking
- **Curve**: Stablecoin pools
- **Compound**: Additional lending
- **GMX**: Perpetual trading strategies
- **Yearn**: Vault strategies

---

## Security

### 7.1 Smart Contract Security
- [ ] Multiple audits (Certik, Trail of Bits)
- [ ] Formal verification for core contracts
- [ ] Time-locked upgrades (48h delay)
- [ ] Emergency pause functionality
- [ ] Rate limiting on withdrawals

### 7.2 User Security
- [ ] 2FA for large withdrawals
- [ ] Spending limits
- [ ] Whitelist addresses
- [ ] Session keys with expiration

---

## Roadmap

### Phase 1: MVP (Q1 2025)
- [ ] Smart Wallet creation
- [ ] Basic city UI (isometric view)
- [ ] Aave integration (USDC lending)
- [ ] Single building type (Yield Farm)
- [ ] Testnet deployment (Base Sepolia)

### Phase 2: Core Game (Q2 2025)
- [ ] Uniswap LP integration
- [ ] Multiple building types
- [ ] City progression system
- [ ] Mainnet deployment (Base)

### Phase 3: Social (Q3 2025)
- [ ] Friend system
- [ ] City visiting
- [ ] Guild/DAO features
- [ ] Leaderboards

### Phase 4: Advanced (Q4 2025)
- [ ] Cross-chain cities
- [ ] Advanced strategies
- [ ] Mobile app
- [ ] SDK for third-party strategies

---

## Metrics & KPIs

| Metric | Target (6 months) |
|--------|-------------------|
| Total Users | 10,000 |
| TVL | $5M |
| Daily Active Users | 2,000 |
| Average Portfolio Size | $500 |
| User Retention (30d) | 40% |

---

## Revenue Model

1. **Performance Fee**: 10% of profits generated
2. **Premium Features**: Advanced buildings, analytics
3. **NFT Buildings**: Limited edition structures
4. **Protocol Partnerships**: Referral fees from integrated protocols

---

## Team Requirements

- Smart Contract Engineers (2)
- Frontend/Game Developers (2)
- Product Designer (1)
- Security Engineer (1)
- Community Manager (1)

---

## Appendix

### A. Glossary
- **TVL**: Total Value Locked
- **APY**: Annual Percentage Yield
- **LP**: Liquidity Provider
- **Smart Wallet**: ERC-4337 Account Abstraction wallet

### B. References
- [Aave V3 Documentation](https://docs.aave.com/)
- [Uniswap V3 Documentation](https://docs.uniswap.org/)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Privy Documentation](https://docs.privy.io/)

---

*Last Updated: January 2025*
*Version: 1.0*
