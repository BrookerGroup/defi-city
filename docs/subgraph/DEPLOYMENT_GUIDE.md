# DefiCity Subgraph Deployment Guide

Complete guide for deploying the DefiCity subgraph to The Graph network.

## Prerequisites

### Required Software

1. **Node.js** v16 or higher
   ```bash
   node --version  # Should be v16+
   ```

2. **Graph CLI**
   ```bash
   npm install -g @graphprotocol/graph-cli
   graph --version
   ```

3. **Contract Deployment Info**
   - All contract addresses on Base
   - Deployment block numbers
   - Contract ABIs (from Foundry build)

## Step 1: Update Configuration

### 1.1 Update Contract Addresses

Edit `subgraph.yaml` and update all contract addresses:

```yaml
dataSources:
  - kind: ethereum/contract
    name: DefiCityCore
    network: base
    source:
      address: "0xYourDefiCityCoreAddress"  # ← UPDATE THIS
      abi: DefiCityCore
      startBlock: 12345678                  # ← UPDATE THIS
```

Update addresses for all contracts:
- DefiCityCore
- BuildingManager
- StrategyRegistry
- FeeManager
- WalletFactory
- DefiCityPaymaster
- MegapotStrategy

### 1.2 Verify ABI Paths

Ensure all ABI file paths in `subgraph.yaml` are correct:

```yaml
abis:
  - name: DefiCityCore
    file: ../contract_v2/out/DefiCityCore.sol/DefiCityCore.json
```

If contracts are in different location, update paths accordingly.

## Step 2: Install Dependencies

```bash
cd subgraph
npm install
```

## Step 3: Generate Code

Generate TypeScript types from GraphQL schema and ABIs:

```bash
npm run codegen
```

This creates:
- `generated/schema.ts` - Types from GraphQL schema
- `generated/<DataSource>/` - Contract bindings

**Expected output:**
```
✔ Apply migrations
✔ Load subgraph from subgraph.yaml
  Load contract ABI from ../contract_v2/out/DefiCityCore.sol/DefiCityCore.json
  ...
✔ Generate types for contract ABIs
✔ Generate types for data source templates
✔ Load data source template ABIs
✔ Generate types for data source template ABIs
✔ Generate types for contract ABIs
✔ Write types to generated/schema.ts
```

## Step 4: Build Subgraph

Build the AssemblyScript code:

```bash
npm run build
```

**Expected output:**
```
✔ Compile subgraph
  Compile data source: DefiCityCore => build/DefiCityCore/DefiCityCore.wasm
  Compile data source: BuildingManager => build/BuildingManager/BuildingManager.wasm
  ...
✔ Write compiled subgraph to build/
```

## Step 5: Deploy to The Graph

### Option A: Deploy to The Graph Studio (Recommended)

#### 5.1 Create Subgraph

1. Go to [The Graph Studio](https://thegraph.com/studio/)
2. Connect your wallet
3. Click "Create a Subgraph"
4. Enter details:
   - Name: `deficity`
   - Subtitle: `DefiCity DeFi Game`
   - Description: `Index DefiCity smart contracts on Base`
   - Image: Upload logo (optional)
5. Click "Create Subgraph"

#### 5.2 Authenticate

Copy your deploy key from Studio and authenticate:

```bash
graph auth --studio <YOUR_DEPLOY_KEY>
```

#### 5.3 Deploy

```bash
graph deploy --studio deficity
```

You'll be prompted for a version label:
```
? Version Label (e.g. v0.0.1) › v1.0.0
```

**Expected output:**
```
✔ Version Label (e.g. v0.0.1) · v1.0.0
  Skip migration: Bump mapping apiVersion from 0.0.1 to 0.0.2
  ...
✔ Apply migrations
✔ Load subgraph from subgraph.yaml
  Compile data source: DefiCityCore => build/DefiCityCore/DefiCityCore.wasm
  ...
✔ Upload subgraph to IPFS

Build completed: QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

Deployed to https://thegraph.com/studio/subgraph/deficity

Subgraph endpoints:
Queries (HTTP):     https://api.studio.thegraph.com/query/<ID>/deficity/v1.0.0
```

### Option B: Deploy to Decentralized Network

#### 5.1 Publish to Network

After testing in Studio, publish to the decentralized network:

1. In Studio, click "Publish to Network"
2. Sign the transaction with your wallet
3. Add signal (GRT) to curate your subgraph

#### 5.2 Update Deployment Script

Update `package.json`:

```json
{
  "scripts": {
    "deploy": "graph deploy --node https://api.thegraph.com/deploy/ your-github-username/deficity"
  }
}
```

Then deploy:

```bash
npm run deploy
```

### Option C: Deploy Locally (Development)

#### 5.1 Start Graph Node

```bash
# Clone Graph Node
git clone https://github.com/graphprotocol/graph-node
cd graph-node/docker

# Start services (Postgres, IPFS, Graph Node)
docker-compose up
```

#### 5.2 Create Local Subgraph

```bash
npm run create-local
```

#### 5.3 Deploy Locally

```bash
npm run deploy-local
```

Access GraphQL playground at: http://localhost:8000/subgraphs/name/deficity-subgraph

## Step 6: Verify Deployment

### 6.1 Check Indexing Status

Monitor indexing progress in Studio or via GraphQL:

```graphql
query IndexingStatus {
  indexingStatusForCurrentVersion(subgraphName: "deficity") {
    synced
    health
    fatalError {
      message
    }
    chains {
      chainHeadBlock {
        number
      }
      latestBlock {
        number
      }
    }
  }
}
```

### 6.2 Test Queries

Try a simple query:

```graphql
query TestQuery {
  protocolStats(id: "1") {
    totalUsers
    totalBuildings
    currentTVL
  }
}
```

## Step 7: Update Frontend

Update frontend to use new subgraph endpoint:

```typescript
// src/config/subgraph.ts
export const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/<ID>/deficity/v1.0.0";
```

## Troubleshooting

### Issue: ABIs not found

**Error:**
```
✖ Failed to load contract ABI from ../contract_v2/out/DefiCityCore.sol/DefiCityCore.json
```

**Solution:**
1. Build contracts first: `cd contract_v2 && forge build`
2. Verify ABI paths in `subgraph.yaml`
3. Copy ABIs to subgraph directory if needed

### Issue: Indexing failed

**Error:**
```
fatalError: "Handler not found"
```

**Solution:**
1. Check event signatures match contract exactly
2. Verify handler function names in mappings
3. Run `npm run codegen` again

### Issue: Invalid timestamp

**Error:**
```
Entity timestamp is invalid
```

**Solution:**
Ensure all timestamp fields use `BigInt`, not `i32`:
```typescript
entity.timestamp = event.block.timestamp; // Correct
entity.timestamp = event.block.timestamp.toI32(); // Wrong
```

### Issue: Network not supported

**Error:**
```
Network "base" is not supported
```

**Solution:**
Update Graph CLI:
```bash
npm install -g @graphprotocol/graph-cli@latest
```

## Deployment Checklist

- [ ] All contract addresses updated in `subgraph.yaml`
- [ ] Start blocks updated to deployment blocks
- [ ] Contract ABIs built and paths verified
- [ ] Dependencies installed (`npm install`)
- [ ] Code generated successfully (`npm run codegen`)
- [ ] Build completed without errors (`npm run build`)
- [ ] Deployed to Studio
- [ ] Indexing status is "synced"
- [ ] Test queries return expected data
- [ ] Frontend updated with new endpoint
- [ ] Documentation updated

## Updating the Subgraph

### Minor Updates (Code Changes)

```bash
# 1. Make changes to mappings/schema
# 2. Rebuild
npm run codegen
npm run build

# 3. Deploy new version
graph deploy --studio deficity
# Enter new version: v1.0.1
```

### Schema Changes

If you change `schema.graphql`:

1. Update schema
2. Run `npm run codegen`
3. Update TypeScript mappings if needed
4. Deploy as new version

**Note:** Schema changes may require reindexing from genesis block.

## Monitoring

### Studio Dashboard

Monitor in Studio dashboard:
- Queries per day
- Query response time
- Indexing status
- Error logs

### GraphQL Endpoint

Production endpoint:
```
https://api.studio.thegraph.com/query/<ID>/deficity/<VERSION>
```

### Logs

View indexing logs:
```bash
# Local deployment
docker logs graph-node

# Studio
# Check logs in Studio UI
```

## Best Practices

1. **Version Control**: Tag releases in git matching subgraph versions
2. **Testing**: Test thoroughly in Studio before publishing to network
3. **Monitoring**: Set up alerts for indexing failures
4. **Documentation**: Keep query examples updated
5. **Optimization**: Use `@derivedFrom` for reverse lookups
6. **Caching**: Add `@entity(immutable: true)` for immutable entities

## Resources

- [The Graph Studio](https://thegraph.com/studio/)
- [The Graph Docs](https://thegraph.com/docs/)
- [AssemblyScript Book](https://www.assemblyscript.org/)
- [Discord Support](https://discord.gg/graphprotocol)

## Next Steps

After successful deployment:

1. **Integrate with Frontend**: Update React app to query subgraph
2. **Add Analytics**: Build dashboards using subgraph data
3. **Monitor Performance**: Track query performance and optimize
4. **Plan Updates**: Schedule regular subgraph updates
5. **Community**: Share on The Graph Discord for feedback

---

**Deployment Status**: ⏳ Ready for deployment

**Last Updated**: 2026-01-15
