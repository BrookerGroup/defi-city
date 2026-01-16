# DefiCity Subgraph - Implementation Summary

Complete subgraph implementation for indexing DefiCity smart contracts on Base.

## 📋 Overview

The DefiCity subgraph indexes all smart contract events and makes blockchain data queryable via GraphQL. This enables the frontend to efficiently query user cities, buildings, transactions, and protocol statistics without directly reading from the blockchain.

## ✅ Implementation Status

**Status**: ✅ **COMPLETE - Ready for Deployment**

### What's Implemented

- ✅ **GraphQL Schema** - 20+ entity types for complete data model
- ✅ **Subgraph Configuration** - YAML config for all 7 main contracts
- ✅ **Event Mappings** - TypeScript handlers for all contract events
- ✅ **Utility Functions** - Helpers for common operations
- ✅ **Documentation** - Complete deployment and query guides
- ✅ **Examples** - 30+ query examples for frontend integration

---

## 📁 File Structure

```
subgraph/
├── schema.graphql                 # GraphQL schema (20+ entities)
├── subgraph.yaml                  # Subgraph configuration
├── package.json                   # Dependencies
├── .gitignore                     # Git ignore rules
│
├── abis/
│   └── ERC20.json                # Standard ERC20 ABI
│
├── src/
│   ├── mappings/                 # Event handlers
│   │   ├── core.ts              # DefiCityCore events
│   │   ├── building.ts          # Building operations
│   │   ├── strategy.ts          # Strategy management
│   │   ├── fee.ts               # Fee collection
│   │   ├── wallet.ts            # Smart wallet creation
│   │   ├── paymaster.ts         # Gasless transactions
│   │   ├── lottery.ts           # Lottery tickets
│   │   └── strategy-template.ts # Dynamic strategy tracking
│   │
│   └── utils/                    # Utility functions
│       ├── helpers.ts            # Common helpers
│       ├── user.ts               # User operations
│       ├── asset.ts              # Asset operations
│       ├── protocol.ts           # Protocol stats
│       └── stats.ts              # Daily/hourly stats
│
└── docs/
    ├── README.md                 # Overview & setup
    ├── DEPLOYMENT_GUIDE.md       # Deployment instructions
    ├── QUERIES.md                # Query examples (30+)
    └── SUBGRAPH_SUMMARY.md       # This file
```

---

## 🗂️ Schema Entities

### Core Entities (20+)

#### User & City
- **User** - User account and city overview
- **UserBalance** - User balance per asset
- **SmartWallet** - ERC-4337 smart wallet
- **SessionKey** - Session key management
- **GaslessTransaction** - Gasless transaction records

#### Buildings
- **Building** - Individual building instance
- **BuildingType** - Building type configuration (4 types)
- **LotteryTicket** - Lottery ticket purchases

#### Transactions
- **Deposit** - Deposit transactions
- **Withdrawal** - Withdrawal transactions
- **Harvest** - Harvest rewards
- **BuildingPlaced** - Building placement events
- **BuildingDemolished** - Building demolition events

#### Strategy & DeFi
- **Asset** - Supported assets (USDC, USDT, ETH, WBTC)
- **Strategy** - DeFi strategy instances
- **APYSnapshot** - APY historical tracking

#### Protocol & Analytics
- **ProtocolStats** - Global protocol statistics
- **AssetProtocolStats** - Per-asset statistics
- **DailyStats** - Daily aggregated data
- **HourlyStats** - Hourly aggregated data

---

## 📡 Indexed Contracts

### Main Contracts (7)

1. **DefiCityCore** - Central state management
   - `Deposited` - User deposits
   - `Withdrawn` - User withdrawals
   - `AssetAdded` / `AssetRemoved` - Asset management
   - `Paused` / `Unpaused` - Emergency controls

2. **BuildingManager** - Building operations
   - `BuildingPlaced` - New building placement
   - `DepositedToBuilding` - Additional deposits
   - `Harvested` - Reward harvesting
   - `BuildingDemolished` - Building removal

3. **StrategyRegistry** - Strategy management
   - `StrategyRegistered` - New strategy registration
   - `StrategyActivated` - Strategy activation
   - `StrategyDeprecated` - Strategy deprecation

4. **FeeManager** - Fee collection
   - `FeeCollected` - Fee collection events
   - `FeeUpdated` - Fee percentage updates

5. **WalletFactory** - Smart wallet creation
   - `WalletCreated` - New wallet deployments

6. **DefiCityPaymaster** - Gasless transactions
   - `UserOperationSponsored` - Gas sponsorship events

7. **MegapotStrategy** - Lottery integration
   - `TicketsPurchased` - Lottery ticket purchases

---

## 🔧 Event Handlers

### Mapping Files (8)

#### core.ts
- `handleDeposited()` - Process deposits, update balances
- `handleWithdrawn()` - Process withdrawals, update balances
- `handleAssetAdded()` - Track new assets
- `handleAssetRemoved()` - Track removed assets
- `handlePaused()` / `handleUnpaused()` - Track pause state

#### building.ts
- `handleBuildingPlaced()` - Create building, update stats
- `handleDepositedToBuilding()` - Update building deposits
- `handleHarvested()` - Record harvest, update earnings
- `handleBuildingDemolished()` - Deactivate building, process withdrawal

#### strategy.ts
- `handleStrategyRegistered()` - Register new strategy
- `handleStrategyActivated()` - Activate strategy for building type
- `handleStrategyDeprecated()` - Deprecate old strategy

#### fee.ts
- `handleFeeCollected()` - Track fee collection
- `handleFeeUpdated()` - Track fee changes

#### wallet.ts
- `handleWalletCreated()` - Create smart wallet entity

#### paymaster.ts
- `handleUserOperationSponsored()` - Track gasless transactions

#### lottery.ts
- `handleTicketsPurchased()` - Record lottery tickets

#### strategy-template.ts
- `updateAPYSnapshot()` - Track APY changes over time

---

## 📊 Key Features

### 1. Complete User Tracking
- City creation timestamp
- Total & active buildings count
- Deposit/withdrawal/earnings totals
- Per-asset balances
- Transaction history

### 2. Building Analytics
- 4 building types tracked (Town Hall, Bank, Shop, Lottery)
- Deposit amounts and shares
- Harvest history and totals
- Active/inactive status
- Creation and demolition timestamps

### 3. Protocol Statistics
- Total users (all-time and active)
- Total buildings count
- Total Value Locked (TVL)
- Volume by asset
- Fees collected

### 4. Time-Series Data
- **Daily Stats**: User activity, building operations, volumes, TVL, fees
- **Hourly Stats**: Quick metrics for real-time dashboards
- Historical APY snapshots for strategies

### 5. Account Abstraction Tracking
- Smart wallet deployments
- Session key management
- Gasless transaction records
- Gas savings calculations

### 6. Transaction Records
All transaction types indexed:
- Deposits (to core and buildings)
- Withdrawals
- Harvests
- Building placements
- Building demolitions
- Lottery tickets

---

## 🚀 Deployment Steps

### Prerequisites
```bash
npm install -g @graphprotocol/graph-cli
```

### Quick Start
```bash
cd subgraph

# 1. Install dependencies
npm install

# 2. Update contract addresses in subgraph.yaml
# Edit all "address" and "startBlock" fields

# 3. Generate types
npm run codegen

# 4. Build
npm run build

# 5. Deploy to Studio
graph auth --studio <DEPLOY_KEY>
graph deploy --studio deficity
```

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## 📖 Query Examples

### Get User City
```graphql
query GetUserCity($userAddress: ID!) {
  user(id: $userAddress) {
    totalBuildings
    activeBuildings
    totalDeposited
    totalEarned
    balances {
      asset { symbol }
      balance
    }
    buildings(where: { isActive: true }) {
      buildingType { name }
      depositedAmount
      totalHarvested
    }
  }
}
```

### Get Protocol Stats
```graphql
query GetProtocolStats {
  protocolStats(id: "1") {
    totalUsers
    currentTVL
    totalBuildings
    totalFeesCollected
  }
}
```

### Get Daily Analytics (Last 30 Days)
```graphql
query GetDailyStats($fromDate: Int!) {
  dailyStats(where: { date_gte: $fromDate }, orderBy: date) {
    date
    depositVolume
    withdrawVolume
    tvl
    activeUsers
    buildingsPlaced
  }
}
```

See `QUERIES.md` for 30+ complete examples.

---

## 🔍 Data Access Patterns

### Frontend Use Cases

1. **User Dashboard**
   - Query: `user` entity with nested `balances` and `buildings`
   - Updates: Real-time via subscriptions

2. **Building List**
   - Query: `buildings` filtered by `isActive: true`
   - Pagination: Use `first` and `skip`

3. **Transaction History**
   - Query: Multiple transaction types (`deposits`, `withdrawals`, `harvests`)
   - Sort: By `timestamp` descending

4. **Protocol Dashboard**
   - Query: `protocolStats` singleton entity
   - Analytics: `dailyStats` for charts

5. **Leaderboards**
   - Query: `users` ordered by `totalEarned` or `totalBuildings`
   - Limit: Top 10 or 100

---

## ⚡ Performance Optimization

### Best Practices Implemented

1. **Efficient Relations**
   - Use `@derivedFrom` for reverse lookups
   - Avoid redundant entity creations

2. **Indexed Fields**
   - All `ID` fields indexed by default
   - Common filter fields optimized

3. **Decimal Precision**
   - BigDecimal for token amounts
   - Proper decimal conversion based on asset

4. **Timestamp Tracking**
   - Block timestamp for all entities
   - Block number for verification

5. **Helper Functions**
   - Reusable utilities in `src/utils/`
   - Consistent data formatting

---

## 📈 Metrics Tracked

### User Metrics
- City creation date
- Total deposits/withdrawals/earnings
- Building count (total and active)
- Per-asset balances

### Building Metrics
- Deposited amounts and shares
- Harvest count and totals
- Creation and demolition times
- Active status

### Protocol Metrics
- Total/active users
- Total/active buildings
- TVL by asset
- Total fees collected
- Daily/hourly volumes

### Strategy Metrics
- Total deposits/withdrawals/harvests
- Current TVL
- Current APY
- Historical APY snapshots

### AA Metrics
- Gasless transaction count
- Gas saved (in USD)
- Session key usage

---

## 🔐 Data Integrity

### Validation
- All token amounts converted via decimals
- User addresses normalized (lowercase)
- Null checks for optional relations
- Safe arithmetic operations

### Error Handling
- Graceful handling of missing entities
- Try/catch for contract calls
- Reverted transaction handling

---

## 🛠️ Maintenance

### Updating the Subgraph

1. **Schema Changes**
   ```bash
   # Edit schema.graphql
   npm run codegen
   npm run build
   graph deploy --studio deficity --version v1.1.0
   ```

2. **Adding New Events**
   ```bash
   # 1. Add event to subgraph.yaml
   # 2. Implement handler in mappings/
   # 3. Update schema if needed
   npm run codegen && npm run build && npm run deploy
   ```

3. **Contract Upgrades**
   ```bash
   # Update contract address in subgraph.yaml
   # Update startBlock to upgrade block
   npm run build && npm run deploy --version v1.2.0
   ```

---

## 📊 Query Limits

### The Graph Studio Limits
- **Free Tier**: 100,000 queries/month
- **Paid Tier**: Unlimited queries
- **Rate Limit**: 1000 requests/minute
- **Query Timeout**: 60 seconds
- **Max Complexity**: 1,000,000

### Optimization Tips
- Use pagination (`first`, `skip`)
- Request only needed fields
- Enable client-side caching
- Batch related queries
- Use subscriptions for real-time data

---

## 🔗 Endpoints

### After Deployment

**Studio (Testing)**:
```
https://api.studio.thegraph.com/query/<ID>/deficity/<VERSION>
```

**Decentralized Network (Production)**:
```
https://gateway.thegraph.com/api/<API_KEY>/subgraphs/id/<SUBGRAPH_ID>
```

**GraphQL Playground**:
```
https://thegraph.com/studio/subgraph/deficity
```

---

## 📚 Documentation

### Available Guides
- **README.md** - Setup and overview
- **DEPLOYMENT_GUIDE.md** - Complete deployment walkthrough
- **QUERIES.md** - 30+ query examples with variables
- **SUBGRAPH_SUMMARY.md** - This file

### External Resources
- [The Graph Docs](https://thegraph.com/docs/)
- [AssemblyScript API](https://thegraph.com/docs/en/developing/assemblyscript-api/)
- [GraphQL Queries](https://graphql.org/learn/queries/)

---

## 🎯 Next Steps

### Before Deployment
- [ ] Deploy all smart contracts to Base
- [ ] Update contract addresses in `subgraph.yaml`
- [ ] Update start blocks to deployment blocks
- [ ] Test on local Graph Node (optional)

### Deployment
- [ ] Run `npm run codegen`
- [ ] Run `npm run build`
- [ ] Deploy to The Graph Studio
- [ ] Verify indexing completes
- [ ] Test queries in playground

### Frontend Integration
- [ ] Install `@apollo/client`
- [ ] Configure Apollo Client with endpoint
- [ ] Implement query hooks
- [ ] Add real-time subscriptions
- [ ] Build analytics dashboards

---

## 🐛 Troubleshooting

### Common Issues

**Build fails**: Check ABI paths in `subgraph.yaml`
**Indexing stuck**: Verify contract addresses and start blocks
**Query errors**: Check entity relationships and field names
**Performance slow**: Add pagination and caching

See `DEPLOYMENT_GUIDE.md` for detailed troubleshooting.

---

## ✅ Completion Checklist

- [x] GraphQL schema designed
- [x] Subgraph configuration created
- [x] Event handlers implemented (8 files)
- [x] Utility functions created (5 files)
- [x] Documentation written (4 files)
- [x] Query examples provided (30+)
- [x] Package.json configured
- [x] .gitignore added
- [ ] Contract addresses updated (after deployment)
- [ ] Subgraph deployed to Studio
- [ ] Indexing verified
- [ ] Frontend integrated

---

## 📞 Support

- **The Graph Discord**: https://discord.gg/graphprotocol
- **Documentation**: https://thegraph.com/docs/
- **Studio**: https://thegraph.com/studio/

---

**Implementation Status**: ✅ **COMPLETE**

**Ready for Deployment**: ⏳ Pending contract deployment

**Last Updated**: 2026-01-15
