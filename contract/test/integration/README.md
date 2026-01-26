# Integration Tests - Base Sepolia

This directory contains integration tests that deploy and test the complete DefiCity system on Base Sepolia testnet with real on-chain transactions.

## Overview

Integration tests deploy mock protocols (MockAavePool, MockMegapot, MockAerodromeRouter) and adapters to Base Sepolia testnet, then execute real transactions to verify the complete system works end-to-end.

**Key Differences from E2E Tests:**
- Execute on real testnet (not local Hardhat network)
- Use deployed contracts (not fixtures)
- Require real testnet ETH and tokens
- Tests are idempotent (can run multiple times)
- Include balance checks and network error handling

## Prerequisites

### 1. Base Sepolia ETH
You need at least **0.1 ETH** on Base Sepolia to cover gas costs for deployment and tests.

**Get Testnet ETH:**
- [Base Sepolia Faucet](https://faucet.quicknode.com/base/sepolia)
- [Superchain Faucet](https://app.optimism.io/faucet)
- [Alchemy Faucet](https://sepoliafaucet.com/)

### 2. RPC URL
You need a Base Sepolia RPC endpoint. Free options:
- [Alchemy](https://www.alchemy.com/) - 300M compute units/month free
- [Infura](https://infura.io/) - 100k requests/day free
- Public RPC: `https://sepolia.base.org` (rate limited)

### 3. Private Key
You need a private key with testnet ETH. **NEVER use a private key with real mainnet funds!**

## Setup Instructions

### Step 1: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add:
   ```bash
   # Your testnet private key (DO NOT use mainnet key!)
   PRIVATE_KEY=your_private_key_here

   # Base Sepolia RPC URL (get from Alchemy or Infura)
   BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY

   # Optional: Basescan API key for contract verification
   BASESCAN_API_KEY=your_basescan_api_key
   ```

### Step 2: Get Testnet ETH

1. Visit a faucet (links above)
2. Enter your wallet address
3. Wait for testnet ETH to arrive
4. Verify balance:
   ```bash
   # Check balance on Base Sepolia block explorer
   https://sepolia.basescan.org/address/YOUR_ADDRESS
   ```

### Step 3: Deploy Core Contracts (if not already deployed)

The integration tests require core contracts (DefiCityCore, WalletFactory) to be deployed first.

Check if already deployed:
```bash
ls deployments/baseSepolia.json
```

If not deployed:
```bash
npm run deploy:base-sepolia
```

This deploys:
- MockEntryPoint
- DefiCityCore
- WalletFactory

### Step 4: Deploy Integration Contracts

Deploy mock protocols and adapters:
```bash
npm run deploy:integration
```

This deploys:
- **Mock Tokens**: USDC (6 decimals), WETH (18 decimals), AERO (18 decimals)
- **Mock Protocols**: MockAavePool, MockMegapot, MockAerodromeRouter
- **Adapters**: BankAdapter, LotteryAdapter, ShopAdapter

The script also:
- Funds mock protocols with liquidity (500k USDC to Aave, 100k USDC to Megapot)
- Configures asset parameters (LTV, liquidation threshold, interest rates)
- Saves deployment info to `deployments/baseSepolia-integration.json`

**Note:** The deployment script has idempotency checks. If contracts are already deployed, it will skip redeployment unless you use `--force`:
```bash
npm run deploy:integration -- --force
```

### Step 5: Run Integration Tests

Run all integration tests:
```bash
npm run test:integration
```

Or run specific adapter tests:
```bash
# Bank adapter only
npm run test:integration:bank

# Lottery adapter only
npm run test:integration:lottery

# Shop adapter only
npm run test:integration:shop
```

## Test Structure

### BankAdapter Integration Tests
Tests the complete lifecycle of bank buildings (supply/borrow):
- ✅ Deployment verification
- ✅ Supply USDC to Aave
- ✅ Borrow with collateral
- ✅ Harvest accrued interest
- ✅ Demolish and withdraw

### LotteryAdapter Integration Tests
Tests lottery ticket purchase and prize claiming:
- ✅ Deployment verification
- ✅ Buy lottery tickets
- ✅ Set winners and claim prizes
- ✅ Demolish (tickets remain in Megapot)
- ✅ Referral system verification

### ShopAdapter Integration Tests
Tests liquidity provision and fee claiming:
- ✅ Deployment verification
- ✅ Add liquidity to USDC/WETH pool
- ✅ Claim trading fees
- ✅ Remove liquidity and demolish

## Test Features

### Automatic Balance Checks
Tests automatically check for:
- Minimum ETH balance (0.01 ETH)
- Minimum token balances (100 USDC, 0.05 WETH)
- Tests are skipped if insufficient balance

### Idempotent Tests
Tests can be run multiple times:
- Checks for existing SmartWallet before creating
- Uses unique building coordinates
- Can demolish buildings after tests

### Network Error Handling
Tests handle common network issues:
- RPC timeouts (60s timeout per transaction)
- Transaction reversion with clear error messages
- Gas estimation failures
- Contract not deployed errors

### Gas Logging
Each test logs:
- Transaction hash
- Gas used
- Block number
- Total ETH spent

## Deployment Artifacts

After deployment, contract addresses are saved in:
```
deployments/
├── baseSepolia.json              # Core contracts
└── baseSepolia-integration.json  # Mock protocols + adapters
```

**Core Deployment (baseSepolia.json):**
```json
{
  "network": "baseSepolia",
  "chainId": "84532",
  "contracts": {
    "entryPoint": "0x...",
    "core": "0x...",
    "factory": "0x...",
    "treasury": "0x..."
  }
}
```

**Integration Deployment (baseSepolia-integration.json):**
```json
{
  "network": "baseSepolia",
  "chainId": "84532",
  "deployer": "0x...",
  "tokens": {
    "usdc": "0x...",
    "weth": "0x...",
    "aero": "0x..."
  },
  "mocks": {
    "aavePool": "0x...",
    "megapot": "0x...",
    "aerodromeRouter": "0x..."
  },
  "adapters": {
    "bank": "0x...",
    "lottery": "0x...",
    "shop": "0x..."
  }
}
```

## Troubleshooting

### Issue: "Insufficient ETH balance"
**Solution:** Get more testnet ETH from faucets (see Prerequisites)

### Issue: "Core deployment file not found"
**Solution:** Deploy core contracts first: `npm run deploy:base-sepolia`

### Issue: "Integration deployment file not found"
**Solution:** Deploy integration contracts: `npm run deploy:integration`

### Issue: "RPC timeout" or "Transaction timeout"
**Causes:**
- Slow RPC endpoint
- Network congestion
- Gas price too low

**Solutions:**
- Use Alchemy or Infura RPC (not public RPC)
- Increase timeout in test (already set to 60s)
- Check transaction on block explorer: https://sepolia.basescan.org/

### Issue: "Transaction reverted"
**Debug:**
1. Check transaction on block explorer
2. Look for revert reason in logs
3. Verify contract is deployed at expected address
4. Check token balances and approvals

### Issue: "Insufficient token balance"
**Solution:**
- Mock tokens are deployed with deployer receiving initial supply
- If you ran out, redeploy integration contracts with `--force`

### Issue: "Tests skipped - contracts not deployed"
**Solution:**
1. Check deployment files exist in `deployments/`
2. Verify contracts on block explorer
3. Redeploy if needed

## Cost Estimates

**Deployment Costs (one-time):**
- Core contracts: ~0.05 ETH
- Integration contracts: ~0.03 ETH
- **Total**: ~0.08 ETH

**Test Execution Costs:**
- Bank adapter tests: ~0.005 ETH
- Lottery adapter tests: ~0.004 ETH
- Shop adapter tests: ~0.006 ETH
- **Total per run**: ~0.015 ETH

**Recommendation:** Start with 0.1 ETH to have enough for deployment + multiple test runs.

## Block Explorer Links

- **Base Sepolia Block Explorer**: https://sepolia.basescan.org/
- **View your transactions**: https://sepolia.basescan.org/address/YOUR_ADDRESS
- **View contract**: https://sepolia.basescan.org/address/CONTRACT_ADDRESS

## Verify Contracts (Optional)

After deployment, you can verify contracts on Basescan:

```bash
# The deployment script prints verification commands
# Example:
npx hardhat verify --network baseSepolia 0xYourContractAddress "Constructor" "Arguments"
```

## Helper Utilities

### Network Helpers (`helpers/networkHelpers.js`)
- `verifyNetwork()` - Check connected to Base Sepolia
- `checkBalance()` - Verify ETH balance
- `checkTokenBalance()` - Verify token balance
- `waitForTx()` - Wait for transaction with timeout
- `isContractDeployed()` - Check if contract exists

### Deployment Loader (`helpers/deploymentLoader.js`)
- `loadCoreDeployment()` - Load core contract addresses
- `loadIntegrationDeployment()` - Load integration addresses
- `getAllAddresses()` - Get all contract addresses
- `attachContracts()` - Attach to deployed contracts
- `verifyAllDeployed()` - Verify all contracts exist

## Next Steps

After successful integration tests:
1. Verify contracts on Basescan (optional)
2. Test with real Aave/Aerodrome on Base mainnet (when ready)
3. Deploy to Base mainnet with real protocols
4. Update frontend to use Base mainnet contracts

## Support

For issues:
1. Check [Hardhat documentation](https://hardhat.org/docs)
2. Check [Base documentation](https://docs.base.org/)
3. Open an issue in the repository

## License

MIT
