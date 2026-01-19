# DefiCity Subgraph Query Examples

Common GraphQL queries for DefiCity frontend integration.

## Table of Contents

- [User Queries](#user-queries)
- [Building Queries](#building-queries)
- [Transaction Queries](#transaction-queries)
- [Protocol Stats](#protocol-stats)
- [Analytics Queries](#analytics-queries)
- [Account Abstraction](#account-abstraction)
- [Pagination](#pagination)

---

## User Queries

### Get User City Overview

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
    updatedAt

    balances {
      asset {
        id
        symbol
        name
        decimals
      }
      balance
    }
  }
}
```

**Variables:**
```json
{
  "userAddress": "0x1234567890abcdef1234567890abcdef12345678"
}
```

### Get User Buildings

```graphql
query GetUserBuildings($userAddress: ID!, $onlyActive: Boolean = true) {
  user(id: $userAddress) {
    buildings(
      where: { isActive: $onlyActive }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      buildingId
      buildingType {
        name
        currentAPY
      }
      asset {
        symbol
      }
      depositedAmount
      shares
      isActive
      createdAt
      totalHarvested
      harvestCount
    }
  }
}
```

### Get User Balance for Specific Asset

```graphql
query GetUserAssetBalance($userAddress: ID!, $assetAddress: ID!) {
  userBalance(id: "${userAddress}-${assetAddress}") {
    balance
    asset {
      symbol
      decimals
      priceUSD
    }
    updatedAt
  }
}
```

---

## Building Queries

### Get All Active Buildings

```graphql
query GetActiveBuildings($first: Int = 100, $skip: Int = 0) {
  buildings(
    where: { isActive: true }
    first: $first
    skip: $skip
    orderBy: createdAt
    orderDirection: desc
  ) {
    id
    owner {
      id
    }
    buildingType {
      name
    }
    asset {
      symbol
    }
    depositedAmount
    totalHarvested
    createdAt
  }
}
```

### Get Buildings by Type

```graphql
query GetBuildingsByType($buildingTypeId: ID!, $first: Int = 50) {
  buildingType(id: $buildingTypeId) {
    name
    minDeposit
    currentAPY
    totalBuildings
    activeBuildings
    totalDeposited
  }

  buildings(
    where: {
      buildingType: $buildingTypeId
      isActive: true
    }
    first: $first
    orderBy: depositedAmount
    orderDirection: desc
  ) {
    id
    owner {
      id
    }
    depositedAmount
    totalHarvested
    createdAt
  }
}
```

**Variables:**
```json
{
  "buildingTypeId": "0"
}
```
- "0" = Town Hall
- "1" = Bank (Aave)
- "2" = Shop (Aerodrome)
- "3" = Lottery (Megapot)

### Get Single Building Details

```graphql
query GetBuildingDetails($buildingId: ID!) {
  building(id: $buildingId) {
    id
    buildingId
    owner {
      id
    }
    buildingType {
      name
      minDeposit
      currentAPY
    }
    asset {
      symbol
      name
      decimals
    }
    depositedAmount
    shares
    isActive
    createdAt
    demolishedAt
    totalHarvested
    harvestCount

    deposits {
      amount
      timestamp
      hash
    }

    harvests {
      rewards
      timestamp
      hash
    }
  }
}
```

---

## Transaction Queries

### Get User Transaction History

```graphql
query GetUserTransactions($userAddress: ID!, $first: Int = 20) {
  # Deposits
  deposits(
    where: { user: $userAddress }
    first: $first
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    amount
    asset {
      symbol
    }
    building {
      buildingType {
        name
      }
    }
    fee
    timestamp
    hash
  }

  # Withdrawals
  withdrawals(
    where: { user: $userAddress }
    first: $first
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    amount
    asset {
      symbol
    }
    building {
      buildingType {
        name
      }
    }
    timestamp
    hash
  }

  # Harvests
  harvests(
    where: { user: $userAddress }
    first: $first
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    rewards
    asset {
      symbol
    }
    building {
      buildingType {
        name
      }
    }
    timestamp
    hash
  }
}
```

### Get Recent Deposits

```graphql
query GetRecentDeposits($first: Int = 10) {
  deposits(
    first: $first
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    user {
      id
    }
    amount
    asset {
      symbol
    }
    fee
    timestamp
    hash
  }
}
```

### Get Building Placement Events

```graphql
query GetBuildingPlacements($first: Int = 20) {
  buildingPlaceds(
    first: $first
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    user {
      id
    }
    building {
      id
      buildingId
    }
    buildingType {
      name
    }
    asset {
      symbol
    }
    initialDeposit
    fee
    timestamp
    hash
  }
}
```

---

## Protocol Stats

### Get Overall Protocol Statistics

```graphql
query GetProtocolStats {
  protocolStats(id: "1") {
    totalUsers
    activeUsers
    totalBuildings
    activeBuildings
    totalDeposited
    totalWithdrawn
    totalHarvested
    currentTVL
    totalFeesCollected
    updatedAt
  }
}
```

### Get Stats by Asset

```graphql
query GetAssetStats {
  assetProtocolStats {
    asset {
      symbol
      name
    }
    totalDeposited
    totalWithdrawn
    currentTVL
  }
}
```

### Get All Building Types Stats

```graphql
query GetBuildingTypesStats {
  buildingTypes {
    id
    name
    minDeposit
    totalBuildings
    activeBuildings
    totalDeposited
    currentAPY
    strategy
  }
}
```

---

## Analytics Queries

### Get Daily Stats (Last 30 Days)

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
    buildingsDemolished
    depositVolume
    withdrawVolume
    harvestVolume
    tvl
    feesCollected
    timestamp
  }
}
```

**Variables (last 30 days):**
```json
{
  "fromDate": 19723,
  "toDate": 19753
}
```
Calculate: `Math.floor(Date.now() / 1000 / 86400)`

### Get Hourly Stats (Last 24 Hours)

```graphql
query GetHourlyStats($fromHour: Int!, $toHour: Int!) {
  hourlyStats(
    where: { hour_gte: $fromHour, hour_lte: $toHour }
    orderBy: hour
    orderDirection: asc
  ) {
    hour
    activeUsers
    depositVolume
    withdrawVolume
    tvl
    timestamp
  }
}
```

### Get Strategy Performance

```graphql
query GetStrategyPerformance {
  strategies {
    id
    buildingType {
      name
    }
    version
    totalDeposited
    totalWithdrawn
    totalHarvested
    currentTVL
    currentAPY
    isActive

    apyHistory(first: 30, orderBy: timestamp, orderDirection: desc) {
      apy
      timestamp
    }
  }
}
```

---

## Account Abstraction

### Get Smart Wallet Info

```graphql
query GetSmartWallet($walletAddress: ID!) {
  smartWallet(id: $walletAddress) {
    id
    owner {
      id
    }
    createdAt
    gaslessTransactions
    gasSaved

    sessionKeys(where: { isActive: true }) {
      sessionKeyAddress
      isActive
      expiresAt
      dailyLimit
      spentToday
      createdAt
    }
  }
}
```

### Get Gasless Transactions

```graphql
query GetGaslessTransactions($userAddress: ID!, $first: Int = 20) {
  gaslessTransactions(
    where: { user: $userAddress }
    first: $first
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    wallet {
      id
    }
    operation
    gasCost
    gasCostUSD
    timestamp
  }
}
```

### Get Total Gas Saved by User

```graphql
query GetUserGasSavings($userAddress: ID!) {
  user(id: $userAddress) {
    id
  }

  smartWallets(where: { owner: $userAddress }) {
    gasSaved
    gaslessTransactions
  }
}
```

---

## Lottery Queries

### Get User Lottery Tickets

```graphql
query GetUserLotteryTickets($userAddress: ID!, $first: Int = 50) {
  lotteryTickets(
    where: { user: $userAddress }
    first: $first
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    building {
      buildingId
    }
    ticketCount
    amount
    timestamp
    hash
  }
}
```

### Get Recent Lottery Activity

```graphql
query GetRecentLotteryActivity($first: Int = 20) {
  lotteryTickets(
    first: $first
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    user {
      id
    }
    ticketCount
    amount
    timestamp
  }
}
```

---

## Pagination

### Cursor-based Pagination Example

```graphql
query GetBuildingsWithPagination($first: Int = 10, $lastId: ID = "") {
  buildings(
    first: $first
    where: {
      isActive: true
      id_gt: $lastId
    }
    orderBy: id
    orderDirection: asc
  ) {
    id
    buildingId
    owner {
      id
    }
    depositedAmount
  }
}
```

**Usage:**
```typescript
// First page
const result1 = await query({ first: 10, lastId: "" });

// Next page (use last ID from previous result)
const lastId = result1.buildings[result1.buildings.length - 1].id;
const result2 = await query({ first: 10, lastId });
```

### Get Total Count

```graphql
query GetCounts {
  protocolStats(id: "1") {
    totalUsers
    totalBuildings
  }
}
```

---

## Complex Queries

### Leaderboard: Top Earners

```graphql
query GetTopEarners($first: Int = 10) {
  users(
    first: $first
    orderBy: totalEarned
    orderDirection: desc
    where: { totalEarned_gt: "0" }
  ) {
    id
    totalEarned
    totalDeposited
    activeBuildings

    buildings(where: { isActive: true }) {
      buildingType {
        name
      }
      depositedAmount
    }
  }
}
```

### Leaderboard: Largest Cities

```graphql
query GetLargestCities($first: Int = 10) {
  users(
    first: $first
    orderBy: totalBuildings
    orderDirection: desc
  ) {
    id
    totalBuildings
    activeBuildings
    totalDeposited
    cityCreatedAt
  }
}
```

### Get All Data for User Dashboard

```graphql
query GetUserDashboard($userAddress: ID!) {
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
        priceUSD
      }
      balance
    }

    buildings(where: { isActive: true }) {
      buildingId
      buildingType {
        name
        currentAPY
      }
      asset {
        symbol
      }
      depositedAmount
      totalHarvested
    }
  }

  protocolStats(id: "1") {
    currentTVL
    totalUsers
  }

  smartWallets(where: { owner: $userAddress }) {
    gasSaved
    gaslessTransactions
  }
}
```

---

## Subscription Queries (WebSocket)

### Subscribe to New Buildings

```graphql
subscription OnNewBuilding {
  buildingPlaced {
    id
    user {
      id
    }
    building {
      buildingType {
        name
      }
    }
    initialDeposit
    timestamp
  }
}
```

### Subscribe to Protocol Stats Changes

```graphql
subscription OnProtocolStatsUpdate {
  protocolStats(id: "1") {
    currentTVL
    totalUsers
    activeBuildings
  }
}
```

---

## TypeScript Integration Examples

### Apollo Client Setup

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://api.studio.thegraph.com/query/<ID>/deficity/<VERSION>',
  cache: new InMemoryCache(),
});

// Query
const GET_USER = gql`
  query GetUser($userAddress: ID!) {
    user(id: $userAddress) {
      totalBuildings
      totalDeposited
    }
  }
`;

const { data } = await client.query({
  query: GET_USER,
  variables: { userAddress: '0x...' },
});
```

### React Hook Example

```typescript
import { useQuery } from '@apollo/client';

function UserCity({ address }: { address: string }) {
  const { loading, error, data } = useQuery(GET_USER_CITY, {
    variables: { userAddress: address.toLowerCase() },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>My City</h2>
      <p>Buildings: {data.user.totalBuildings}</p>
      <p>TVL: ${data.user.totalDeposited}</p>
    </div>
  );
}
```

---

## Query Optimization Tips

1. **Request Only Needed Fields**: Don't query unnecessary data
2. **Use Pagination**: Limit results with `first` and `skip`
3. **Filter Early**: Use `where` clauses to reduce data
4. **Cache Results**: Enable Apollo Client caching
5. **Batch Queries**: Combine related queries when possible
6. **Use Derived Fields**: Leverage `@derivedFrom` for relations

---

**Last Updated**: 2026-01-15
