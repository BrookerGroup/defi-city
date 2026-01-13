# Usage Examples: ERC-4337 Smart Wallet

This guide demonstrates how to use the Smart Wallet system for various DeFi operations in your DeFi City game.

---

## Table of Contents

1. [Wallet Creation](#1-wallet-creation)
2. [Deposit & Withdraw (Basic)](#2-deposit--withdraw-basic)
3. [Aave Integration (Yield Farm)](#3-aave-integration-yield-farm)
4. [Uniswap V3 LP (LP Mine)](#4-uniswap-v3-lp-lp-mine)
5. [Batch Operations](#5-batch-operations)
6. [Gas Management](#6-gas-management)
7. [Frontend Integration](#7-frontend-integration)
8. [Error Handling](#8-error-handling)

---

## 1. Wallet Creation

### 1.1 Create Wallet for New User

```javascript
import { ethers } from "ethers";

// Contract addresses
const FACTORY_ADDRESS = "0x..."; // Your deployed factory
const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

// Connect to factory
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

/**
 * Create a Smart Wallet for a user
 * @param {string} ownerAddress - EOA address of the wallet owner
 * @returns {string} - Smart Wallet address
 */
async function createWalletForUser(ownerAddress) {
  console.log("Creating wallet for:", ownerAddress);

  // Check if wallet already exists
  let walletAddress = await factory.getWalletByOwner(ownerAddress);

  if (walletAddress === ethers.ZeroAddress) {
    // Wallet doesn't exist, create it
    console.log("Deploying new wallet...");

    const tx = await factory.createWallet(ownerAddress, 0);
    const receipt = await tx.wait();

    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("Transaction:", receipt.hash);

    // Get the deployed wallet address
    walletAddress = await factory.getWalletByOwner(ownerAddress);
  } else {
    console.log("Wallet already exists");
  }

  console.log("Wallet address:", walletAddress);
  return walletAddress;
}

// Example usage
async function onUserSignup() {
  const userEOA = await signer.getAddress(); // User's MetaMask address
  const smartWallet = await createWalletForUser(userEOA);

  // Save to localStorage or database
  localStorage.setItem("smartWallet", smartWallet);

  return smartWallet;
}
```

### 1.2 Counterfactual Wallet (Know Address Before Deployment)

```javascript
/**
 * Get wallet address without deploying
 * User can receive funds at this address before wallet exists
 */
async function getCounterfactualAddress(ownerAddress) {
  const walletAddress = await factory.getAddress(ownerAddress, 0);
  console.log("Counterfactual address:", walletAddress);

  // User can now receive funds at this address
  // Wallet will be deployed on first UserOp
  return walletAddress;
}

// Check if already deployed
async function isWalletDeployed(ownerAddress) {
  const walletAddress = await factory.getAddress(ownerAddress, 0);
  const code = await provider.getCode(walletAddress);
  return code !== "0x";
}
```

---

## 2. Deposit & Withdraw (Basic)

### 2.1 Deposit ETH/USDC to Smart Wallet

```javascript
/**
 * User deposits ETH/USDC to their Smart Wallet
 * This is the wallet's balance (not gas deposit)
 */
async function depositToWallet(walletAddress, token, amount) {
  if (token === "ETH") {
    // Send ETH directly
    const tx = await signer.sendTransaction({
      to: walletAddress,
      value: ethers.parseEther(amount),
    });

    await tx.wait();
    console.log("Deposited", amount, "ETH to wallet");
  } else {
    // Send ERC20 (e.g., USDC)
    const tokenContract = new ethers.Contract(token, ERC20_ABI, signer);

    const tx = await tokenContract.transfer(
      walletAddress,
      ethers.parseUnits(amount, 6) // USDC has 6 decimals
    );

    await tx.wait();
    console.log("Deposited", amount, "USDC to wallet");
  }
}

// Example: User deposits from MetaMask to Smart Wallet
async function onUserDeposit() {
  const smartWallet = localStorage.getItem("smartWallet");

  // Transfer 100 USDC from user's MetaMask to Smart Wallet
  await depositToWallet(
    smartWallet,
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC mainnet
    "100"
  );
}
```

### 2.2 Withdraw from Smart Wallet to EOA

```javascript
/**
 * Withdraw funds from Smart Wallet back to user's EOA
 * This requires a UserOperation (or direct owner call)
 */
async function withdrawFromWallet(walletAddress, token, amount, recipient) {
  const wallet = new ethers.Contract(walletAddress, WALLET_ABI, signer);

  if (token === "ETH") {
    // Withdraw ETH
    const calldata = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256"],
      [recipient, ethers.parseEther(amount)]
    );

    // Execute withdraw via wallet
    const tx = await wallet.execute(
      recipient,
      ethers.parseEther(amount),
      "0x"
    );

    await tx.wait();
    console.log("Withdrawn", amount, "ETH");
  } else {
    // Withdraw ERC20
    const tokenContract = new ethers.Contract(token, ERC20_ABI, provider);

    const transferCalldata = tokenContract.interface.encodeFunctionData(
      "transfer",
      [recipient, ethers.parseUnits(amount, 6)]
    );

    const tx = await wallet.execute(token, 0, transferCalldata);
    await tx.wait();
    console.log("Withdrawn", amount, "USDC");
  }
}
```

---

## 3. Aave Integration (Yield Farm)

### 3.1 Build Yield Farm (Deposit to Aave)

```javascript
/**
 * Deposit USDC to Aave via Smart Wallet
 * This represents "Building a Yield Farm" in the game
 */
async function buildYieldFarm(walletAddress, usdcAmount) {
  const AAVE_POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"; // Aave V3 Pool (Mainnet)
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  const wallet = new ethers.Contract(walletAddress, WALLET_ABI, signer);
  const aavePool = new ethers.Contract(AAVE_POOL, AAVE_POOL_ABI, provider);

  console.log("Building Yield Farm...");
  console.log("Amount:", usdcAmount, "USDC");

  // Step 1: Approve Aave to spend USDC
  const approveCalldata = new ethers.Interface([
    "function approve(address spender, uint256 amount) returns (bool)",
  ]).encodeFunctionData("approve", [
    AAVE_POOL,
    ethers.parseUnits(usdcAmount, 6),
  ]);

  const approveTx = await wallet.execute(USDC, 0, approveCalldata);
  await approveTx.wait();
  console.log("✅ Approved Aave");

  // Step 2: Supply to Aave
  const supplyCalldata = aavePool.interface.encodeFunctionData("supply", [
    USDC,
    ethers.parseUnits(usdcAmount, 6),
    walletAddress, // aUSDC goes to wallet
    0, // referral code
  ]);

  const supplyTx = await wallet.execute(AAVE_POOL, 0, supplyCalldata);
  await supplyTx.wait();
  console.log("✅ Supplied to Aave");

  // Step 3: Check aUSDC balance
  const aUSDC = "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c"; // aUSDC address
  const aUsdcContract = new ethers.Contract(aUSDC, ERC20_ABI, provider);
  const balance = await aUsdcContract.balanceOf(walletAddress);

  console.log("aUSDC balance:", ethers.formatUnits(balance, 6));

  return {
    aUSDC: ethers.formatUnits(balance, 6),
    timestamp: Date.now(),
  };
}

// Game integration
async function onBuildYieldFarm(position, amount) {
  const smartWallet = localStorage.getItem("smartWallet");

  // Build farm
  const farmData = await buildYieldFarm(smartWallet, amount);

  // Update game state
  game.buildings.push({
    type: "yield_farm",
    position: position,
    aUSDC: farmData.aUSDC,
    apy: 5.2, // Fetch from Aave API
    createdAt: farmData.timestamp,
  });

  // Render building on map
  renderBuilding("yield_farm", position);
}
```

### 3.2 Harvest Yield (Withdraw from Aave)

```javascript
/**
 * Withdraw from Aave (collect yield)
 * This represents "Harvesting" in the game
 */
async function harvestYieldFarm(walletAddress, usdcAmount) {
  const AAVE_POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  const wallet = new ethers.Contract(walletAddress, WALLET_ABI, signer);
  const aavePool = new ethers.Contract(AAVE_POOL, AAVE_POOL_ABI, provider);

  console.log("Harvesting Yield Farm...");

  // Withdraw from Aave
  const withdrawCalldata = aavePool.interface.encodeFunctionData("withdraw", [
    USDC,
    ethers.parseUnits(usdcAmount, 6),
    walletAddress, // USDC goes back to wallet
  ]);

  const tx = await wallet.execute(AAVE_POOL, 0, withdrawCalldata);
  await tx.wait();

  console.log("✅ Harvested", usdcAmount, "USDC");

  // Calculate yield earned
  const principal = getPrincipal(); // From game state
  const yield = parseFloat(usdcAmount) - principal;

  console.log("Yield earned:", yield, "USDC");

  return { principal, yield, total: usdcAmount };
}
```

---

## 4. Uniswap V3 LP (LP Mine)

### 4.1 Add Liquidity (Build LP Mine)

```javascript
/**
 * Add liquidity to Uniswap V3
 * This represents "Building an LP Mine" in the game
 */
async function buildLPMine(walletAddress, ethAmount, usdcAmount) {
  const UNISWAP_POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  const wallet = new ethers.Contract(walletAddress, WALLET_ABI, signer);
  const positionManager = new ethers.Contract(
    UNISWAP_POSITION_MANAGER,
    POSITION_MANAGER_ABI,
    provider
  );

  console.log("Building LP Mine...");

  // Step 1: Wrap ETH to WETH
  const wethContract = new ethers.Contract(WETH, WETH_ABI, provider);
  const wrapCalldata = wethContract.interface.encodeFunctionData("deposit");

  const wrapTx = await wallet.execute(
    WETH,
    ethers.parseEther(ethAmount),
    wrapCalldata
  );
  await wrapTx.wait();
  console.log("✅ Wrapped ETH to WETH");

  // Step 2: Approve tokens
  const approveWethCalldata = new ethers.Interface([
    "function approve(address spender, uint256 amount) returns (bool)",
  ]).encodeFunctionData("approve", [
    UNISWAP_POSITION_MANAGER,
    ethers.parseEther(ethAmount),
  ]);

  const approveUsdcCalldata = new ethers.Interface([
    "function approve(address spender, uint256 amount) returns (bool)",
  ]).encodeFunctionData("approve", [
    UNISWAP_POSITION_MANAGER,
    ethers.parseUnits(usdcAmount, 6),
  ]);

  await wallet.execute(WETH, 0, approveWethCalldata);
  await wallet.execute(USDC, 0, approveUsdcCalldata);
  console.log("✅ Approved tokens");

  // Step 3: Mint LP position
  const mintParams = {
    token0: USDC,
    token1: WETH,
    fee: 3000, // 0.3% fee tier
    tickLower: -887220, // Full range (adjust for your strategy)
    tickUpper: 887220,
    amount0Desired: ethers.parseUnits(usdcAmount, 6),
    amount1Desired: ethers.parseEther(ethAmount),
    amount0Min: 0, // Add slippage protection in production
    amount1Min: 0,
    recipient: walletAddress,
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };

  const mintCalldata = positionManager.interface.encodeFunctionData("mint", [
    mintParams,
  ]);

  const mintTx = await wallet.execute(
    UNISWAP_POSITION_MANAGER,
    0,
    mintCalldata
  );
  const receipt = await mintTx.wait();

  // Extract tokenId from events
  const mintEvent = receipt.logs.find(
    (log) => log.topics[0] === positionManager.interface.getEvent("IncreaseLiquidity").topicHash
  );

  const tokenId = ethers.AbiCoder.defaultAbiCoder().decode(
    ["uint256"],
    mintEvent.topics[1]
  )[0];

  console.log("✅ LP Position created, NFT tokenId:", tokenId.toString());

  return {
    tokenId: tokenId.toString(),
    ethAmount,
    usdcAmount,
  };
}

// Game integration
async function onBuildLPMine(position, ethAmount, usdcAmount) {
  const smartWallet = localStorage.getItem("smartWallet");

  const lpData = await buildLPMine(smartWallet, ethAmount, usdcAmount);

  game.buildings.push({
    type: "lp_mine",
    position: position,
    tokenId: lpData.tokenId,
    liquidity: { eth: ethAmount, usdc: usdcAmount },
    createdAt: Date.now(),
  });

  renderBuilding("lp_mine", position);
}
```

### 4.2 Collect Fees (Harvest LP Fees)

```javascript
/**
 * Collect trading fees from Uniswap LP position
 */
async function collectLPFees(walletAddress, tokenId) {
  const UNISWAP_POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

  const wallet = new ethers.Contract(walletAddress, WALLET_ABI, signer);
  const positionManager = new ethers.Contract(
    UNISWAP_POSITION_MANAGER,
    POSITION_MANAGER_ABI,
    provider
  );

  console.log("Collecting LP fees for tokenId:", tokenId);

  const collectParams = {
    tokenId: tokenId,
    recipient: walletAddress,
    amount0Max: ethers.MaxUint128,
    amount1Max: ethers.MaxUint128,
  };

  const collectCalldata = positionManager.interface.encodeFunctionData(
    "collect",
    [collectParams]
  );

  const tx = await wallet.execute(UNISWAP_POSITION_MANAGER, 0, collectCalldata);
  const receipt = await tx.wait();

  console.log("✅ Fees collected");

  // Parse collected amounts from events
  // ... (parse receipt logs)

  return { usdc: "10.5", eth: "0.005" };
}
```

---

## 5. Batch Operations

### 5.1 Build Multiple Farms at Once

```javascript
/**
 * Batch operations - build multiple yield farms in one transaction
 */
async function buildMultipleFarms(walletAddress, farms) {
  const wallet = new ethers.Contract(walletAddress, WALLET_ABI, signer);

  console.log("Building", farms.length, "farms in batch...");

  const targets = [];
  const values = [];
  const calldatas = [];

  for (const farm of farms) {
    // Approve
    targets.push(farm.token);
    values.push(0);
    calldatas.push(
      new ethers.Interface([
        "function approve(address spender, uint256 amount)",
      ]).encodeFunctionData("approve", [farm.protocol, farm.amount])
    );

    // Supply
    targets.push(farm.protocol);
    values.push(0);
    calldatas.push(farm.supplyCalldata);
  }

  // Execute batch
  const tx = await wallet.executeBatch(targets, values, calldatas);
  await tx.wait();

  console.log("✅ All farms built");
}

// Example
async function onBuildMultipleFarms() {
  const farms = [
    {
      token: USDC,
      protocol: AAVE_POOL,
      amount: ethers.parseUnits("100", 6),
      supplyCalldata: "0x...",
    },
    {
      token: USDC,
      protocol: AAVE_POOL,
      amount: ethers.parseUnits("50", 6),
      supplyCalldata: "0x...",
    },
  ];

  await buildMultipleFarms(smartWallet, farms);
}
```

---

## 6. Gas Management

### 6.1 Check and Top Up Gas Deposit

```javascript
/**
 * Monitor and manage gas deposit in EntryPoint
 */
async function checkGasDeposit(walletAddress) {
  const wallet = new ethers.Contract(walletAddress, WALLET_ABI, provider);

  const deposit = await wallet.getDeposit();
  const depositETH = ethers.formatEther(deposit);

  console.log("Gas deposit:", depositETH, "ETH");

  // Estimate transactions remaining
  const avgGasCost = ethers.parseEther("0.005"); // ~$10 at $2000/ETH
  const txRemaining = deposit / avgGasCost;

  console.log("Estimated transactions remaining:", Math.floor(Number(txRemaining)));

  return {
    deposit: depositETH,
    txRemaining: Math.floor(Number(txRemaining)),
    needsTopUp: deposit < ethers.parseEther("0.01"),
  };
}

/**
 * Top up gas deposit
 */
async function topUpGas(walletAddress, amount) {
  const wallet = new ethers.Contract(walletAddress, WALLET_ABI, signer);

  const tx = await wallet.addDeposit({
    value: ethers.parseEther(amount),
  });

  await tx.wait();
  console.log("✅ Added", amount, "ETH to gas deposit");
}

// Auto top-up service
async function autoTopUpGasService() {
  setInterval(async () => {
    const status = await checkGasDeposit(smartWallet);

    if (status.needsTopUp) {
      console.log("⚠️ Gas deposit low, topping up...");
      await topUpGas(smartWallet, "0.05");
    }
  }, 60000); // Check every minute
}
```

---

## 7. Frontend Integration

### 7.1 React Hook for Smart Wallet

```jsx
// hooks/useSmartWallet.js
import { useState, useEffect } from "react";
import { ethers } from "ethers";

export function useSmartWallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Get user's EOA (MetaMask)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const eoa = await signer.getAddress();

      // Get or create Smart Wallet
      const factory = new ethers.Contract(FACTORY, FACTORY_ABI, signer);
      let walletAddr = await factory.getWalletByOwner(eoa);

      if (walletAddr === ethers.ZeroAddress) {
        const tx = await factory.createWallet(eoa, 0);
        await tx.wait();
        walletAddr = await factory.getWalletByOwner(eoa);
      }

      // Get wallet details
      const walletContract = new ethers.Contract(walletAddr, WALLET_ABI, provider);
      const deposit = await walletContract.getDeposit();
      const nonce = await walletContract.getNonce(0);

      setWallet({
        address: walletAddr,
        owner: eoa,
        deposit: ethers.formatEther(deposit),
        nonce: nonce.toString(),
        contract: walletContract,
      });

      setLoading(false);
    }

    init();
  }, []);

  return { wallet, loading };
}

// Component usage
function DeFiCity() {
  const { wallet, loading } = useSmartWallet();

  if (loading) return <div>Loading wallet...</div>;

  return (
    <div>
      <div>Wallet: {wallet.address}</div>
      <div>Gas deposit: {wallet.deposit} ETH</div>

      <button onClick={() => buildYieldFarm(wallet.address, "100")}>
        Build Yield Farm (100 USDC)
      </button>
    </div>
  );
}
```

---

## 8. Error Handling

### 8.1 Comprehensive Error Handling

```javascript
/**
 * Robust function with error handling
 */
async function buildYieldFarmSafe(walletAddress, amount) {
  try {
    // Check wallet exists
    const code = await provider.getCode(walletAddress);
    if (code === "0x") {
      throw new Error("Wallet not deployed");
    }

    // Check sufficient balance
    const usdc = new ethers.Contract(USDC, ERC20_ABI, provider);
    const balance = await usdc.balanceOf(walletAddress);

    if (balance < ethers.parseUnits(amount, 6)) {
      throw new Error(`Insufficient USDC balance. Have: ${ethers.formatUnits(balance, 6)}, Need: ${amount}`);
    }

    // Check gas deposit
    const wallet = new ethers.Contract(walletAddress, WALLET_ABI, provider);
    const deposit = await wallet.getDeposit();

    if (deposit < ethers.parseEther("0.01")) {
      throw new Error("Insufficient gas deposit. Please top up.");
    }

    // Execute operation
    const result = await buildYieldFarm(walletAddress, amount);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error building yield farm:", error);

    // Parse error
    if (error.code === "INSUFFICIENT_FUNDS") {
      return { success: false, error: "Not enough ETH for gas" };
    } else if (error.message.includes("Insufficient USDC")) {
      return { success: false, error: error.message };
    } else if (error.message.includes("user rejected")) {
      return { success: false, error: "Transaction cancelled" };
    } else {
      return { success: false, error: "Transaction failed" };
    }
  }
}

// Usage with UI feedback
async function onBuildFarmClick() {
  showLoading("Building Yield Farm...");

  const result = await buildYieldFarmSafe(smartWallet, "100");

  hideLoading();

  if (result.success) {
    showSuccess("Yield Farm built successfully!");
    updateGameState(result.data);
  } else {
    showError(result.error);
  }
}
```

---

## Complete Example: Full User Journey

```javascript
/**
 * Complete flow: From signup to first yield farm
 */
async function completeUserJourney() {
  console.log("=== DeFi City User Journey ===\n");

  // 1. User connects MetaMask
  console.log("1. Connecting wallet...");
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const eoa = await signer.getAddress();
  console.log("✅ Connected:", eoa);

  // 2. Create Smart Wallet
  console.log("\n2. Creating Smart Wallet...");
  const smartWallet = await createWalletForUser(eoa);
  console.log("✅ Smart Wallet:", smartWallet);

  // 3. Fund Smart Wallet
  console.log("\n3. Funding Smart Wallet...");
  await depositToWallet(smartWallet, USDC, "100");
  console.log("✅ Deposited 100 USDC");

  // 4. Fund gas deposit
  console.log("\n4. Adding gas deposit...");
  await topUpGas(smartWallet, "0.05");
  console.log("✅ Added 0.05 ETH for gas");

  // 5. Build first Yield Farm
  console.log("\n5. Building Yield Farm...");
  const farm = await buildYieldFarm(smartWallet, "100");
  console.log("✅ Yield Farm built!");
  console.log("   aUSDC:", farm.aUSDC);

  // 6. Start game loop
  console.log("\n6. Starting game...");
  startGame({
    wallet: smartWallet,
    buildings: [
      {
        type: "yield_farm",
        position: { x: 5, y: 5 },
        aUSDC: farm.aUSDC,
      },
    ],
  });

  console.log("\n✅ User journey complete!");
}
```

---

## Testing Checklist

Before going to production, test:

- [ ] Wallet creation works
- [ ] Counterfactual addresses match deployed addresses
- [ ] Deposits and withdrawals execute correctly
- [ ] Aave integration works (deposit/withdraw)
- [ ] Uniswap integration works (add LP/collect fees)
- [ ] Batch operations execute atomically
- [ ] Gas deposit management works
- [ ] Error handling covers all cases
- [ ] UI updates reflect on-chain state
- [ ] Works across different wallets (MetaMask, WalletConnect)

---

*For more examples, see the [full test suite](../test/) and [frontend implementation](../frontend/).*
