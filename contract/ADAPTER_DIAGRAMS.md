# Architecture Diagrams

## Current Architecture (Monolithic)

```mermaid
graph TD
    Frontend[Frontend] -->|preparePlace| BM[BuildingManager<br/>477+ lines]
    BM -->|Bank logic| Bank[prepareBankSupply<br/>prepareBankBorrow<br/>prepareHarvest<br/>prepareDemolish]
    BM -->|Future Shop logic| Shop[prepareShopSwap<br/>...]
    BM -->|Future Lottery logic| Lottery[prepareLotteryPlay<br/>...]
    BM -->|Future Farm logic| Farm[prepareFarmLP<br/>...]

    Bank -->|calls| Core[DefiCityCore]
    Shop -->|calls| Core
    Lottery -->|calls| Core
    Farm -->|calls| Core

    style BM fill:#ff6b6b
    style Bank fill:#ffd93d
    style Shop fill:#ffd93d
    style Lottery fill:#ffd93d
    style Farm fill:#ffd93d
```

**Problem:** Everything in one big contract!

---

## Proposed Architecture (Adapter Pattern)

```mermaid
graph TD
    Frontend[Frontend] -->|preparePlace<br/>'bank', params| Registry[BuildingRegistry<br/>270 lines]

    Registry -->|routes to| BankAdapter[BankAdapter<br/>350 lines<br/>Aave Logic]
    Registry -->|routes to| ShopAdapter[ShopAdapter<br/>180 lines<br/>Uniswap Logic]
    Registry -->|routes to| LotteryAdapter[LotteryAdapter<br/>200 lines<br/>Megapot Logic]
    Registry -->|routes to| FarmAdapter[FarmAdapter<br/>220 lines<br/>Aerodrome Logic]

    BankAdapter -->|calls| Core[DefiCityCore]
    ShopAdapter -->|calls| Core
    LotteryAdapter -->|calls| Core
    FarmAdapter -->|calls| Core

    BankAdapter -.implements.-> Interface[IBuildingAdapter]
    ShopAdapter -.implements.-> Interface
    LotteryAdapter -.implements.-> Interface
    FarmAdapter -.implements.-> Interface

    style Registry fill:#4ecdc4
    style BankAdapter fill:#95e1d3
    style ShopAdapter fill:#95e1d3
    style LotteryAdapter fill:#95e1d3
    style FarmAdapter fill:#95e1d3
    style Interface fill:#f38181
```

**Solution:** Clean separation, easy to maintain!

---

## Sequence Diagram: Place Bank Building

### Old Way (Monolithic)

```mermaid
sequenceDiagram
    participant F as Frontend
    participant BM as BuildingManager
    participant Core as DefiCityCore

    F->>BM: prepareBankSupply(params)
    BM->>BM: Generate calldata for:<br/>1. Approve Aave<br/>2. Supply to Aave<br/>3. Record in Core
    BM-->>F: Return [targets, values, datas]

    Note over BM: All building logic<br/>in one contract
```

### New Way (Adapter Pattern)

```mermaid
sequenceDiagram
    participant F as Frontend
    participant R as BuildingRegistry
    participant BA as BankAdapter
    participant Core as DefiCityCore

    F->>R: preparePlace("bank", params)
    R->>R: Load adapter address<br/>for "bank"
    R->>BA: preparePlace(params)
    BA->>BA: Generate calldata for:<br/>1. Approve Aave<br/>2. Supply to Aave<br/>3. Record in Core
    BA-->>R: Return [targets, values, datas]
    R-->>F: Return [targets, values, datas]

    Note over R,BA: Routing adds ~4k gas<br/>(negligible overhead)
```

---

## Adding New Building Type

### Old Way: Edit BuildingManager ❌

```mermaid
graph LR
    A[Want to add<br/>Shop building] --> B[Edit<br/>BuildingManager.sol]
    B --> C[Add 150+ lines<br/>of code]
    C --> D[Risk breaking<br/>Bank logic]
    D --> E[Redeploy<br/>everything]
    E --> F[Update all<br/>references]

    style B fill:#ff6b6b
    style D fill:#ff6b6b
    style E fill:#ff6b6b
```

### New Way: Deploy Adapter ✅

```mermaid
graph LR
    A[Want to add<br/>Shop building] --> B[Create<br/>ShopAdapter.sol]
    B --> C[Deploy<br/>ShopAdapter]
    C --> D[Register in<br/>Registry]
    D --> E[Done!]

    style B fill:#95e1d3
    style C fill:#95e1d3
    style D fill:#95e1d3
    style E fill:#4ecdc4
```

---

## Upgrade Flow

### Old Way: Risky ❌

```mermaid
graph TD
    A[Bug found in<br/>Bank logic] --> B[Fix BuildingManager]
    B --> C[Redeploy entire<br/>BuildingManager]
    C --> D[Shop, Lottery, Farm<br/>also affected]
    D --> E[High risk of<br/>new bugs]

    style C fill:#ff6b6b
    style D fill:#ff6b6b
    style E fill:#ff6b6b
```

### New Way: Safe ✅

```mermaid
graph TD
    A[Bug found in<br/>Bank logic] --> B[Fix BankAdapter]
    B --> C[Deploy BankAdapterV2]
    C --> D[upgradeAdapter<br/>'bank', newAddress]
    D --> E[Shop, Lottery, Farm<br/>unchanged]
    E --> F[Zero risk to<br/>other buildings]

    style C fill:#95e1d3
    style D fill:#95e1d3
    style E fill:#4ecdc4
    style F fill:#4ecdc4
```

---

## File Structure Comparison

### Before (Monolithic)

```
contracts/
├── core/
│   ├── DefiCityCore.sol
│   └── BuildingManager.sol (477 lines → 1200+ lines)
│       ├── Bank logic
│       ├── Shop logic
│       ├── Lottery logic
│       └── Farm logic
```

### After (Adapter Pattern)

```
contracts/
├── interfaces/
│   └── IBuildingAdapter.sol (standard interface)
├── core/
│   ├── DefiCityCore.sol
│   ├── BuildingManager.sol (deprecated)
│   └── BuildingRegistry.sol (270 lines)
└── adapters/
    ├── BankAdapter.sol (350 lines)
    ├── ShopAdapter.sol (180 lines)
    ├── LotteryAdapter.sol (200 lines)
    └── FarmAdapter.sol (220 lines)
```

---

## Gas Cost Breakdown

```mermaid
graph LR
    subgraph "Old (Direct)"
        A1[Frontend] -->|50k gas<br/>view call| B1[BuildingManager]
        B1 -->|returns calldata| A1
    end

    subgraph "New (Via Registry)"
        A2[Frontend] -->|~54k gas<br/>view call| B2[BuildingRegistry]
        B2 -->|+2k gas<br/>SLOAD adapter| C2[Load adapter<br/>address]
        C2 -->|+2k gas<br/>external call| D2[BankAdapter]
        D2 -->|returns calldata| B2
        B2 -->|returns calldata| A2
    end

    style A1 fill:#ffd93d
    style B1 fill:#ffd93d
    style A2 fill:#95e1d3
    style B2 fill:#95e1d3
    style D2 fill:#95e1d3
```

**Gas Overhead: ~4,000 gas (~8%) on view calls**
**Impact on actual execution: ~0.4% (negligible)**

---

## Summary

| Aspect | Monolithic | Adapter Pattern |
|--------|------------|-----------------|
| **Complexity** | 🟢 Simple (1 contract) | 🟡 Medium (multiple contracts) |
| **Maintainability** | 🔴 Hard (1200+ lines) | 🟢 Easy (small, focused) |
| **Scalability** | 🔴 Limited | 🟢 Unlimited |
| **Adding Buildings** | 🔴 Edit core contract | 🟢 Deploy + register |
| **Upgrading** | 🔴 Redeploy everything | 🟢 Upgrade independently |
| **Testing** | 🟡 Test all together | 🟢 Test independently |
| **Gas Cost** | 🟢 Lowest | 🟡 +0.4% overhead |
| **Risk** | 🔴 High (coupled) | 🟢 Low (isolated) |

**Recommendation: Use Adapter Pattern for 3+ building types with different logic** ✅
