# DefiCity Subgraph

The Graph indexing protocol for DefiCity smart contracts on Base.

## Overview

This subgraph indexes all DefiCity smart contract events and makes them queryable via GraphQL. It tracks:

- **Users & Cities**: User accounts, balances, buildings, and activity
- **Buildings**: Building placements, deposits, harvests, and demolitions
- **Transactions**: All user transactions (deposits, withdrawals, harvests, etc.)
- **Strategies**: Strategy registration, activation, and performance
- **Protocol Stats**: Global statistics, TVL, fees collected
- **Daily/Hourly Stats**: Time-series analytics
- **Account Abstraction**: Smart wallets, session keys, gasless transactions
- **Lottery**: Megapot ticket purchases

## Setup

### Prerequisites

- Node.js v16+
- Graph CLI

### Installation

```bash
# Install dependencies
npm install

# Install Graph CLI globally (if not already installed)
npm install -g @graphprotocol/graph-cli
```

## Development

### 1. Update Contract Addresses

Before deploying, update the contract addresses in `subgraph.yaml`:

```yaml
dataSources:
  - kind: ethereum/contract
    name: DefiCityCore
    source:
      address: "0xYourDeployedAddress"  # Update this
      startBlock: 12345678              # Update to deployment block
```

### 2. Generate Types

Generate AssemblyScript types from GraphQL schema and ABIs:

```bash
npm run codegen
```

### 3. Build

Build the subgraph:

```bash
npm run build
```

## Deployment

### Deploy to The Graph Studio

1. Create a subgraph on [The Graph Studio](https://thegraph.com/studio/)
2. Authenticate:
   ```bash
   graph auth --studio <DEPLOY_KEY>
   ```
3. Deploy:
   ```bash
   npm run deploy
   ```

### Deploy Locally

1. Start local Graph Node:
   ```bash
   # In graph-node directory
   docker-compose up
   ```

2. Create local subgraph:
   ```bash
   npm run create-local
   ```

3. Deploy locally:
   ```bash
   npm run deploy-local
   ```

## GraphQL Queries

### Example Queries

#### Get User City

```graphql
query GetUserCity($userAddress: ID!) {
  user(id: $userAddress) {
    id
    cityCreatedAt
    totalBuildings
    activeBuildings
    totalDeposited
    totalWithdrawn
    totalEarned
    balances {
      asset {
        symbol
      }
      balance
    }
    buildings(where: { isActive: true }) {
      buildingId
      buildingType {
        name
      }
      depositedAmount
      totalHarvested
    }
  }
}
```

#### Get Protocol Stats

```graphql
query GetProtocolStats {
  protocolStats(id: "1") {
    totalUsers
    activeUsers
    totalBuildings
    activeBuildings
    totalDeposited
    totalWithdrawn
    currentTVL
    totalFeesCollected
  }
}
```

#### Get User Transactions

```graphql
query GetUserTransactions($userAddress: ID!) {
  deposits(where: { user: $userAddress }, orderBy: timestamp, orderDirection: desc) {
    amount
    asset {
      symbol
    }
    timestamp
  }
  withdrawals(where: { user: $userAddress }, orderBy: timestamp, orderDirection: desc) {
    amount
    asset {
      symbol
    }
    timestamp
  }
  harvests(where: { user: $userAddress }, orderBy: timestamp, orderDirection: desc) {
    rewards
    building {
      buildingType {
        name
      }
    }
    timestamp
  }
}
```

#### Get Buildings by Type

```graphql
query GetBuildingsByType($buildingTypeId: ID!) {
  buildingType(id: $buildingTypeId) {
    name
    totalBuildings
    activeBuildings
    totalDeposited
    currentAPY
    minDeposit
  }
  buildings(where: { buildingType: $buildingTypeId, isActive: true }, first: 100) {
    owner {
      id
    }
    depositedAmount
    totalHarvested
    createdAt
  }
}
```

#### Get Daily Stats

```graphql
query GetDailyStats($fromDate: Int!, $toDate: Int!) {
  dailyStats(
    where: { date_gte: $fromDate, date_lte: $toDate }
    orderBy: date
    orderDirection: asc
  ) {
    date
    activeUsers
    newUsers
    buildingsPlaced
    depositVolume
    withdrawVolume
    harvestVolume
    tvl
    feesCollected
  }
}
```

#### Get Smart Wallet Info

```graphql
query GetSmartWallet($walletAddress: ID!) {
  smartWallet(id: $walletAddress) {
    owner {
      id
    }
    createdAt
    gaslessTransactions
    gasSaved
    sessionKeys(where: { isActive: true }) {
      sessionKeyAddress
      expiresAt
      dailyLimit
      spentToday
    }
  }
}
```

## Schema

See `schema.graphql` for complete schema definition.

### Main Entities

- **User**: User account and city
- **Building**: Individual building instance
- **BuildingType**: Building type configuration (Town Hall, Bank, Shop, Lottery)
- **Asset**: Supported assets (USDC, USDT, ETH, WBTC)
- **Transaction**: Interface for all transaction types
  - Deposit
  - Withdrawal
  - Harvest
  - BuildingPlaced
  - BuildingDemolished
- **Strategy**: Strategy configuration and stats
- **ProtocolStats**: Global protocol statistics
- **DailyStats/HourlyStats**: Time-series data
- **SmartWallet**: Account abstraction wallet
- **GaslessTransaction**: Gasless transaction records
- **LotteryTicket**: Lottery ticket purchases

## Testing

Run subgraph tests:

```bash
npm run test
```

## Contract ABIs

ABIs are sourced from:
- `../contract_v2/out/` - Foundry build outputs
- `./abis/ERC20.json` - Standard ERC20 ABI

## Network

- **Network**: Base
- **Chain ID**: 8453
- **RPC**: https://mainnet.base.org

## Resources

- [The Graph Documentation](https://thegraph.com/docs/)
- [AssemblyScript API](https://thegraph.com/docs/en/developing/assemblyscript-api/)
- [Schema Reference](https://thegraph.com/docs/en/developing/creating-a-subgraph/#the-graphql-schema)

## License

MIT
