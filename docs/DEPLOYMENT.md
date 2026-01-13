# Deployment Guide: ERC-4337 Smart Wallet System

## Overview

This guide walks through deploying the complete ERC-4337 Smart Wallet system:
1. EntryPoint (use existing canonical deployment)
2. SmartWallet (implementation for CREATE2)
3. WalletFactory (deploys wallets)
4. Verification on block explorer
5. Setting up bundler infrastructure

---

## Prerequisites

### Tools & Dependencies

```bash
# Install dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts

# Or using yarn
yarn add -D hardhat @nomicfoundation/hardhat-toolbox
yarn add @openzeppelin/contracts
```

### Environment Setup

Create `.env` file:
```env
# Network RPC URLs
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Private keys (NEVER commit these)
DEPLOYER_PRIVATE_KEY=0x...

# Block explorer API keys for verification
ETHERSCAN_API_KEY=...
BASESCAN_API_KEY=...
ARBISCAN_API_KEY=...
```

### Hardhat Config

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000000, // Optimize for minimal deployment cost
      },
    },
  },
  networks: {
    // Testnets
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 11155111,
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 84532,
    },

    // Mainnets
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 1,
    },
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 8453,
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 42161,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,
      base: process.env.BASESCAN_API_KEY,
      baseSepolia: process.env.BASESCAN_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY,
    },
  },
};
```

---

## Step 1: EntryPoint Contract

### Use Canonical Deployment

**DO NOT deploy your own EntryPoint**. Use the official ERC-4337 EntryPoint:

**Address**: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`

**Deployed on**:
- Ethereum Mainnet ✅
- Ethereum Sepolia ✅
- Base Mainnet ✅
- Base Sepolia ✅
- Arbitrum One ✅
- Optimism ✅
- Polygon ✅
- Avalanche ✅

**Verify deployment**:
```javascript
// scripts/verify-entrypoint.js
const hre = require("hardhat");

async function main() {
  const ENTRYPOINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  const code = await hre.ethers.provider.getCode(ENTRYPOINT);

  if (code === "0x") {
    console.log("❌ EntryPoint NOT deployed on this network");
    console.log("Cannot proceed with deployment");
    process.exit(1);
  } else {
    console.log("✅ EntryPoint deployed at:", ENTRYPOINT);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Run:
```bash
npx hardhat run scripts/verify-entrypoint.js --network sepolia
```

---

## Step 2: Deploy WalletFactory

### Deployment Script

```javascript
// scripts/deploy-factory.js
const hre = require("hardhat");

async function main() {
  const ENTRYPOINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  console.log("Deploying WalletFactory...");
  console.log("EntryPoint:", ENTRYPOINT);

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy WalletFactory
  const WalletFactory = await hre.ethers.getContractFactory("WalletFactory");
  const factory = await WalletFactory.deploy(ENTRYPOINT);

  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ WalletFactory deployed to:", factoryAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    entryPoint: ENTRYPOINT,
    factory: factoryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const fs = require("fs");
  fs.writeFileSync(
    `deployments/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n⏳ Waiting 30s before verification...");
  await new Promise((resolve) => setTimeout(resolve, 30000));

  // Verify on block explorer
  try {
    console.log("\n📝 Verifying contract...");
    await hre.run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [ENTRYPOINT],
    });
    console.log("✅ Contract verified");
  } catch (error) {
    console.log("❌ Verification failed:", error.message);
  }

  // Create a test wallet to verify everything works
  console.log("\n🧪 Testing wallet creation...");
  const testOwner = deployer.address;
  const tx = await factory.createWallet(testOwner, 0);
  await tx.wait();

  const walletAddress = await factory.getWalletByOwner(testOwner);
  console.log("✅ Test wallet created at:", walletAddress);

  console.log("\n✅ Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Set up bundler infrastructure");
  console.log("3. Fund test wallet with ETH for gas");
  console.log("4. Test UserOperation submission");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Deploy to Testnet

```bash
# Create deployments directory
mkdir -p deployments

# Deploy to Sepolia
npx hardhat run scripts/deploy-factory.js --network sepolia

# Or Base Sepolia
npx hardhat run scripts/deploy-factory.js --network baseSepolia
```

---

## Step 3: Manual Verification (if auto-verify fails)

### Verify WalletFactory

```bash
npx hardhat verify --network sepolia \
  0xYOUR_FACTORY_ADDRESS \
  0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
```

### Verify SmartWallet (if already deployed)

```bash
npx hardhat verify --network sepolia \
  0xYOUR_WALLET_ADDRESS \
  0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789 \
  0xOWNER_ADDRESS
```

---

## Step 4: Test Deployment

### Test Script

```javascript
// scripts/test-deployment.js
const hre = require("hardhat");

async function main() {
  const deploymentInfo = require(`../deployments/${hre.network.name}.json`);

  console.log("Testing deployment on:", hre.network.name);
  console.log("Factory:", deploymentInfo.factory);

  const [signer] = await hre.ethers.getSigners();

  // Connect to factory
  const factory = await hre.ethers.getContractAt(
    "WalletFactory",
    deploymentInfo.factory
  );

  // Test 1: Get EntryPoint
  console.log("\n1️⃣ Testing getEntryPoint()...");
  const entryPoint = await factory.getEntryPoint();
  console.log("EntryPoint:", entryPoint);
  console.log(entryPoint === deploymentInfo.entryPoint ? "✅ PASS" : "❌ FAIL");

  // Test 2: Compute wallet address
  console.log("\n2️⃣ Testing getAddress()...");
  const owner = signer.address;
  const walletAddress = await factory.getAddress(owner, 0);
  console.log("Computed wallet address:", walletAddress);
  console.log(walletAddress !== hre.ethers.ZeroAddress ? "✅ PASS" : "❌ FAIL");

  // Test 3: Check if wallet deployed
  console.log("\n3️⃣ Testing isWalletDeployed()...");
  const isDeployed = await factory.isWalletDeployed(owner, 0);
  console.log("Is deployed:", isDeployed);

  // Test 4: Create wallet (if not deployed)
  if (!isDeployed) {
    console.log("\n4️⃣ Testing createWallet()...");
    const tx = await factory.createWallet(owner, 0);
    console.log("Transaction:", tx.hash);

    const receipt = await tx.wait();
    console.log("Gas used:", receipt.gasUsed.toString());

    const newWalletAddress = await factory.getWalletByOwner(owner);
    console.log("Wallet created at:", newWalletAddress);
    console.log(newWalletAddress === walletAddress ? "✅ PASS" : "❌ FAIL");
  } else {
    console.log("Wallet already deployed");
  }

  // Test 5: Verify wallet functions
  console.log("\n5️⃣ Testing wallet functions...");
  const wallet = await hre.ethers.getContractAt(
    "SmartWallet",
    walletAddress
  );

  const walletOwner = await wallet.owner();
  console.log("Wallet owner:", walletOwner);
  console.log(walletOwner === owner ? "✅ PASS" : "❌ FAIL");

  const walletEntryPoint = await wallet.getEntryPoint();
  console.log("Wallet EntryPoint:", walletEntryPoint);
  console.log(walletEntryPoint === entryPoint ? "✅ PASS" : "❌ FAIL");

  const nonce = await wallet.getNonce(0);
  console.log("Wallet nonce:", nonce.toString());

  const deposit = await wallet.getDeposit();
  console.log("Wallet deposit:", hre.ethers.formatEther(deposit), "ETH");

  console.log("\n✅ All tests passed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Run:
```bash
npx hardhat run scripts/test-deployment.js --network sepolia
```

---

## Step 5: Set Up Bundler

### Option 1: Use Third-Party Bundler

**Recommended for production**:

#### Alchemy Account Kit
```javascript
import { AlchemyProvider } from "@alchemy/aa-core";

const provider = new AlchemyProvider({
  apiKey: "YOUR_ALCHEMY_API_KEY",
  chain: sepolia,
  entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
});
```

#### Biconomy
```javascript
import { Bundler } from "@biconomy/bundler";

const bundler = new Bundler({
  bundlerUrl: "https://bundler.biconomy.io/api/v2/84532/...",
  chainId: 84532,
  entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
});
```

#### Stackup
```javascript
const bundlerRPC = "https://api.stackup.sh/v1/node/YOUR_API_KEY";

const result = await fetch(bundlerRPC, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_sendUserOperation",
    params: [userOp, entryPoint],
  }),
});
```

### Option 2: Run Your Own Bundler

**For development/testing**:

```bash
# Clone Infinitism bundler
git clone https://github.com/eth-infinitism/bundler.git
cd bundler

# Install dependencies
yarn install

# Configure
cp .env.example .env
# Edit .env with your RPC URL and private key

# Run bundler
yarn run bundler --network sepolia
```

---

## Step 6: Frontend Integration

### Install SDK

```bash
npm install ethers@6 @alchemy/aa-core
# or
yarn add ethers@6 @alchemy/aa-core
```

### Create Wallet & Send UserOp

```javascript
// frontend/wallet-integration.js
import { ethers } from "ethers";

// Contract addresses (from deployment)
const ENTRYPOINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const FACTORY = "0xYOUR_FACTORY_ADDRESS";

// Connect to provider
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// Connect to factory
const factory = new ethers.Contract(FACTORY, FACTORY_ABI, signer);

// Step 1: Get or create wallet
async function getWallet(owner) {
  let walletAddress = await factory.getWalletByOwner(owner);

  if (walletAddress === ethers.ZeroAddress) {
    console.log("Creating new wallet...");
    const tx = await factory.createWallet(owner, 0);
    await tx.wait();
    walletAddress = await factory.getWalletByOwner(owner);
  }

  console.log("Wallet address:", walletAddress);
  return walletAddress;
}

// Step 2: Fund wallet for gas
async function fundWalletGas(walletAddress, amount) {
  const entryPoint = new ethers.Contract(ENTRYPOINT, ENTRYPOINT_ABI, signer);

  const tx = await entryPoint.depositTo(walletAddress, {
    value: ethers.parseEther(amount),
  });

  await tx.wait();
  console.log("Deposited", amount, "ETH for gas");
}

// Step 3: Create UserOperation
async function createUserOp(walletAddress, targetCall) {
  const entryPoint = new ethers.Contract(ENTRYPOINT, ENTRYPOINT_ABI, provider);
  const wallet = new ethers.Contract(walletAddress, WALLET_ABI, provider);

  // Get nonce
  const nonce = await entryPoint.getNonce(walletAddress, 0);

  // Encode call
  const callData = wallet.interface.encodeFunctionData("execute", [
    targetCall.to,
    targetCall.value,
    targetCall.data,
  ]);

  // Build UserOp
  const userOp = {
    sender: walletAddress,
    nonce: nonce.toString(),
    initCode: "0x",
    callData: callData,
    callGasLimit: "200000",
    verificationGasLimit: "150000",
    preVerificationGas: "50000",
    maxFeePerGas: (await provider.getFeeData()).maxFeePerGas.toString(),
    maxPriorityFeePerGas: (await provider.getFeeData()).maxPriorityFeePerGas.toString(),
    paymasterAndData: "0x",
    signature: "0x",
  };

  // Sign UserOp
  const userOpHash = await entryPoint.getUserOpHash(userOp);
  const signature = await signer.signMessage(ethers.getBytes(userOpHash));
  userOp.signature = signature;

  return userOp;
}

// Step 4: Submit to bundler
async function submitUserOp(userOp) {
  const bundlerRPC = "https://bundler.example.com/rpc";

  const response = await fetch(bundlerRPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendUserOperation",
      params: [userOp, ENTRYPOINT],
    }),
  });

  const result = await response.json();
  console.log("UserOp hash:", result.result);

  return result.result;
}

// Example: Deposit to Aave
async function depositToAave(owner, amount) {
  // 1. Get wallet
  const walletAddress = await getWallet(owner);

  // 2. Fund gas
  await fundWalletGas(walletAddress, "0.1");

  // 3. Prepare Aave deposit call
  const aavePool = "0xAAVE_POOL_ADDRESS";
  const usdc = "0xUSDC_ADDRESS";

  const depositCalldata = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256", "address", "uint16"],
    [usdc, ethers.parseUnits(amount, 6), walletAddress, 0]
  );

  const targetCall = {
    to: aavePool,
    value: 0,
    data: depositCalldata,
  };

  // 4. Create UserOp
  const userOp = await createUserOp(walletAddress, targetCall);

  // 5. Submit
  const userOpHash = await submitUserOp(userOp);

  console.log("Transaction submitted:", userOpHash);
}
```

---

## Step 7: Mainnet Deployment Checklist

Before deploying to mainnet:

### Pre-Deployment
- [ ] Complete testnet testing (Sepolia/Base Sepolia)
- [ ] Security audit completed
- [ ] Bug bounty program set up
- [ ] Gas optimization reviewed
- [ ] Documentation finalized
- [ ] Deployment scripts tested
- [ ] Rollback plan prepared

### Deployment
- [ ] Deploy WalletFactory to mainnet
- [ ] Verify contract on block explorer
- [ ] Test wallet creation
- [ ] Test UserOp submission
- [ ] Set up monitoring/alerts

### Post-Deployment
- [ ] Monitor gas costs
- [ ] Monitor bundler performance
- [ ] Set up incident response
- [ ] Announce to community
- [ ] Update documentation with mainnet addresses

---

## Step 8: Monitoring & Maintenance

### Monitor Wallet Activity

```javascript
// scripts/monitor.js
async function monitorFactory() {
  const factory = await ethers.getContractAt("WalletFactory", FACTORY_ADDRESS);

  // Listen to WalletCreated events
  factory.on("WalletCreated", (wallet, owner, salt, number) => {
    console.log("New wallet created:");
    console.log("  Address:", wallet);
    console.log("  Owner:", owner);
    console.log("  Total wallets:", number.toString());

    // Send to monitoring service (Datadog, Grafana, etc.)
  });

  console.log("Monitoring factory...");
}
```

### Track Gas Usage

```javascript
// Monitor average gas costs
async function trackGasCosts() {
  const entryPoint = await ethers.getContractAt("IEntryPoint", ENTRYPOINT);

  entryPoint.on("UserOperationEvent", (userOpHash, sender, paymaster, nonce, success, actualGasCost, actualGasUsed) => {
    console.log("UserOp executed:");
    console.log("  Gas cost:", ethers.formatEther(actualGasCost), "ETH");
    console.log("  Gas used:", actualGasUsed.toString());
    console.log("  Success:", success);
  });
}
```

---

## Deployment Addresses

### Testnet (Sepolia)
```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "entryPoint": "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  "factory": "0x...",
  "deployer": "0x..."
}
```

### Mainnet (Base)
```json
{
  "network": "base",
  "chainId": 8453,
  "entryPoint": "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  "factory": "0x...",
  "deployer": "0x..."
}
```

---

## Troubleshooting

### Issue: EntryPoint not found on network

**Solution**: Verify network supports ERC-4337. Check [deployed-addresses.txt](https://github.com/eth-infinitism/account-abstraction/blob/develop/deployed-addresses.txt)

### Issue: Factory deployment fails with "out of gas"

**Solution**: Increase gas limit in hardhat config:
```javascript
networks: {
  sepolia: {
    gas: 8000000,
    gasPrice: 50000000000,
  }
}
```

### Issue: Verification fails

**Solution**:
1. Wait 30s after deployment
2. Ensure constructor args are correct
3. Check Solidity version matches
4. Use `--force` flag if needed

### Issue: Wallet creation reverts

**Solution**:
1. Check EntryPoint address is correct
2. Verify deployer has ETH for gas
3. Check if wallet already exists at address

---

## Next Steps

After successful deployment:

1. **Frontend Integration**: Implement UserOp construction in your DeFi City frontend
2. **Bundler Setup**: Choose bundler provider or run your own
3. **Paymaster**: Implement gasless transactions (optional)
4. **Monitoring**: Set up analytics and alerting
5. **Documentation**: Update user-facing docs with addresses
6. **Testing**: Comprehensive E2E testing with real users

---

*For support, refer to [ERC-4337 Discord](https://discord.gg/erc4337) or [Ethereum Magicians](https://ethereum-magicians.org/)*
