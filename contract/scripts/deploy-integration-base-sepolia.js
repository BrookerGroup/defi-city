const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy integration contracts (mocks + adapters) to Base Sepolia
 * Usage: npx hardhat run scripts/deploy-integration-base-sepolia.js --network baseSepolia
 */

const DEPLOYMENTS_DIR = path.join(__dirname, "../deployments");
const CORE_DEPLOYMENT_FILE = "baseSepolia.json";
const INTEGRATION_DEPLOYMENT_FILE = "baseSepolia-integration.json";
const BASE_SEPOLIA_CHAIN_ID = 84532;
const MIN_ETH_BALANCE = ethers.parseEther("0.1"); // 0.1 ETH minimum

async function main() {
  console.log("\n========================================");
  console.log("  Deploy Integration Contracts");
  console.log("  Target: Base Sepolia");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  // Step 1: Pre-deployment checks
  console.log("\n--- Pre-Deployment Checks ---");
  await verifyNetwork();
  await checkDeployerBalance(deployer);
  const coreAddresses = loadCoreDeployment();

  // Step 2: Check for existing deployment
  const force = process.argv.includes("--force");
  if (!force && fs.existsSync(path.join(DEPLOYMENTS_DIR, INTEGRATION_DEPLOYMENT_FILE))) {
    console.log("\n⚠️  Integration contracts already deployed!");
    console.log("   Use --force flag to redeploy");
    console.log("   File:", path.join(DEPLOYMENTS_DIR, INTEGRATION_DEPLOYMENT_FILE));
    process.exit(0);
  }

  // Step 3: Deploy mock tokens
  console.log("\n--- Deploying Mock Tokens ---");
  const usdc = await deployMockToken("USD Coin", "USDC", 6, ethers.parseUnits("1000000", 6));
  const weth = await deployMockToken("Wrapped Ether", "WETH", 18, ethers.parseUnits("1000", 18));
  const aero = await deployMockToken("Aerodrome", "AERO", 18, ethers.parseUnits("1000000", 18));

  // Step 4: Deploy mock protocols
  console.log("\n--- Deploying Mock Protocols ---");
  const mockAave = await deployMockAavePool(usdc, weth);
  const mockMegapot = await deployMockMegapot(usdc);
  const mockRouter = await deployMockAerodromeRouter(usdc, weth, aero);

  // Step 5: Fund mock protocols with liquidity
  console.log("\n--- Funding Mock Protocols ---");
  await fundMockProtocols(deployer, usdc, weth, mockAave, mockMegapot);

  // Step 6: Deploy adapters
  console.log("\n--- Deploying Adapters ---");
  const bankAdapter = await deployBankAdapter(
    coreAddresses.core,
    await mockAave.getAddress(),
    await usdc.getAddress(),
    coreAddresses.treasury
  );

  const lotteryAdapter = await deployLotteryAdapter(
    coreAddresses.core,
    await mockMegapot.getAddress(),
    await usdc.getAddress(),
    coreAddresses.treasury
  );

  const shopAdapter = await deployShopAdapter(
    coreAddresses.core,
    await mockRouter.getAddress(),
    coreAddresses.treasury
  );

  // Step 7: Save deployment info
  console.log("\n--- Saving Deployment Info ---");
  const deployment = {
    network: "baseSepolia",
    chainId: BASE_SEPOLIA_CHAIN_ID.toString(),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    tokens: {
      usdc: await usdc.getAddress(),
      weth: await weth.getAddress(),
      aero: await aero.getAddress()
    },
    mocks: {
      aavePool: await mockAave.getAddress(),
      megapot: await mockMegapot.getAddress(),
      aerodromeRouter: await mockRouter.getAddress()
    },
    adapters: {
      bank: await bankAdapter.getAddress(),
      lottery: await lotteryAdapter.getAddress(),
      shop: await shopAdapter.getAddress()
    }
  };

  saveDeployment(deployment);

  // Step 8: Print summary
  printDeploymentSummary(deployment, coreAddresses);

  console.log("\n✅ Integration deployment complete!\n");
}

// === Helper Functions ===

async function verifyNetwork() {
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
    throw new Error(
      `Wrong network! Expected Base Sepolia (${BASE_SEPOLIA_CHAIN_ID}), ` +
      `got chain ID ${chainId}`
    );
  }

  console.log(`✓ Connected to Base Sepolia (Chain ID: ${chainId})`);
}

async function checkDeployerBalance(deployer) {
  const balance = await ethers.provider.getBalance(deployer.address);

  if (balance < MIN_ETH_BALANCE) {
    console.error(
      `❌ Insufficient balance: ${ethers.formatEther(balance)} ETH ` +
      `(need at least ${ethers.formatEther(MIN_ETH_BALANCE)} ETH)`
    );
    console.log("   Get testnet ETH from: https://faucet.quicknode.com/base/sepolia");
    process.exit(1);
  }

  console.log(`✓ Deployer balance: ${ethers.formatEther(balance)} ETH`);
}

function loadCoreDeployment() {
  const filePath = path.join(DEPLOYMENTS_DIR, CORE_DEPLOYMENT_FILE);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Core deployment file not found: ${filePath}\n` +
      `Please deploy core contracts first`
    );
  }

  const deployment = JSON.parse(fs.readFileSync(filePath, "utf8"));
  console.log(`✓ Loaded core deployment from ${CORE_DEPLOYMENT_FILE}`);
  console.log(`  Core: ${deployment.contracts.core}`);
  console.log(`  Factory: ${deployment.contracts.factory}`);
  console.log(`  Treasury: ${deployment.contracts.treasury}`);

  return deployment.contracts;
}

async function deployMockToken(name, symbol, decimals, initialSupply) {
  console.log(`Deploying ${name} (${symbol})...`);

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy(name, symbol, initialSupply);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log(`  ✓ ${symbol}: ${address}`);
  console.log(`    Initial supply: ${ethers.formatUnits(initialSupply, decimals)}`);

  return token;
}

async function deployMockAavePool(usdc, weth) {
  console.log("Deploying MockAavePool...");

  const MockAavePool = await ethers.getContractFactory("MockAavePool");
  const mockAave = await MockAavePool.deploy();
  await mockAave.waitForDeployment();

  const address = await mockAave.getAddress();
  console.log(`  ✓ MockAavePool: ${address}`);

  // Configure USDC asset
  console.log("  Configuring USDC asset...");
  await mockAave.setAssetConfig(
    await usdc.getAddress(),
    8000, // 80% LTV
    8500, // 85% liquidation threshold
    500,  // 5% supply rate (500 bps)
    1000  // 10% borrow rate (1000 bps)
  );

  // Configure WETH asset
  console.log("  Configuring WETH asset...");
  await mockAave.setAssetConfig(
    await weth.getAddress(),
    8000, // 80% LTV
    8500, // 85% liquidation threshold
    300,  // 3% supply rate
    800   // 8% borrow rate
  );

  console.log("  ✓ Asset configurations complete");

  return mockAave;
}

async function deployMockMegapot(usdc) {
  console.log("Deploying MockMegapot...");

  const MockMegapot = await ethers.getContractFactory("MockMegapot");
  const mockMegapot = await MockMegapot.deploy(await usdc.getAddress());
  await mockMegapot.waitForDeployment();

  const address = await mockMegapot.getAddress();
  console.log(`  ✓ MockMegapot: ${address}`);

  return mockMegapot;
}

async function deployMockAerodromeRouter(usdc, weth, aero) {
  console.log("Deploying MockAerodromeRouter...");

  const MockAerodromeRouter = await ethers.getContractFactory("MockAerodromeRouter");
  const mockRouter = await MockAerodromeRouter.deploy(); // No constructor parameters
  await mockRouter.waitForDeployment();

  const address = await mockRouter.getAddress();
  console.log(`  ✓ MockAerodromeRouter: ${address}`);

  return mockRouter;
}

async function fundMockProtocols(deployer, usdc, weth, mockAave, mockMegapot) {
  // Fund MockAavePool with liquidity
  console.log("Funding MockAavePool with liquidity...");
  const aaveLiquidityUSDC = ethers.parseUnits("500000", 6); // 500k USDC
  const aaveLiquidityWETH = ethers.parseUnits("250", 18);   // 250 WETH

  await usdc.transfer(await mockAave.getAddress(), aaveLiquidityUSDC);
  console.log(`  ✓ Transferred ${ethers.formatUnits(aaveLiquidityUSDC, 6)} USDC to MockAave`);

  await weth.transfer(await mockAave.getAddress(), aaveLiquidityWETH);
  console.log(`  ✓ Transferred ${ethers.formatUnits(aaveLiquidityWETH, 18)} WETH to MockAave`);

  await mockAave.addLiquidity(await usdc.getAddress(), aaveLiquidityUSDC);
  await mockAave.addLiquidity(await weth.getAddress(), aaveLiquidityWETH);
  console.log("  ✓ Liquidity added to MockAave");

  // Fund MockMegapot with jackpot
  console.log("Funding MockMegapot with initial jackpot...");
  const jackpotAmount = ethers.parseUnits("100000", 6); // 100k USDC

  await usdc.approve(await mockMegapot.getAddress(), jackpotAmount);
  await mockMegapot.addToJackpot(jackpotAmount);
  console.log(`  ✓ Added ${ethers.formatUnits(jackpotAmount, 6)} USDC to jackpot`);

  // Keep some tokens for deployer (for tests)
  const deployerUSDC = await usdc.balanceOf(deployer.address);
  const deployerWETH = await weth.balanceOf(deployer.address);
  console.log(`  Deployer remaining balance:`);
  console.log(`    USDC: ${ethers.formatUnits(deployerUSDC, 6)}`);
  console.log(`    WETH: ${ethers.formatUnits(deployerWETH, 18)}`);
}

async function deployBankAdapter(core, aavePool, usdc, treasury) {
  console.log("Deploying BankAdapter...");

  const BankAdapter = await ethers.getContractFactory("BankAdapter");
  const adapter = await BankAdapter.deploy(core, aavePool, usdc, treasury);
  await adapter.waitForDeployment();

  const address = await adapter.getAddress();
  console.log(`  ✓ BankAdapter: ${address}`);

  return adapter;
}

async function deployLotteryAdapter(core, megapot, usdc, treasury) {
  console.log("Deploying LotteryAdapter...");

  const LotteryAdapter = await ethers.getContractFactory("LotteryAdapter");
  const adapter = await LotteryAdapter.deploy(core, megapot, usdc, treasury);
  await adapter.waitForDeployment();

  const address = await adapter.getAddress();
  console.log(`  ✓ LotteryAdapter: ${address}`);

  return adapter;
}

async function deployShopAdapter(core, router, treasury) {
  console.log("Deploying ShopAdapter...");

  const ShopAdapter = await ethers.getContractFactory("ShopAdapter");
  const adapter = await ShopAdapter.deploy(core, router, treasury);
  await adapter.waitForDeployment();

  const address = await adapter.getAddress();
  console.log(`  ✓ ShopAdapter: ${address}`);

  return adapter;
}

function saveDeployment(deployment) {
  if (!fs.existsSync(DEPLOYMENTS_DIR)) {
    fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  }

  const filePath = path.join(DEPLOYMENTS_DIR, INTEGRATION_DEPLOYMENT_FILE);
  fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));

  console.log(`✓ Deployment info saved to ${INTEGRATION_DEPLOYMENT_FILE}`);
}

function printDeploymentSummary(deployment, coreAddresses) {
  console.log("\n========================================");
  console.log("  Deployment Summary");
  console.log("========================================");
  console.log(`Network: ${deployment.network}`);
  console.log(`Chain ID: ${deployment.chainId}`);
  console.log(`Deployer: ${deployment.deployer}`);
  console.log(`Timestamp: ${deployment.timestamp}`);

  console.log("\n--- Core Contracts (Existing) ---");
  console.log(`DefiCityCore: ${coreAddresses.core}`);
  console.log(`WalletFactory: ${coreAddresses.factory}`);
  console.log(`Treasury: ${coreAddresses.treasury}`);

  console.log("\n--- Mock Tokens ---");
  console.log(`USDC: ${deployment.tokens.usdc}`);
  console.log(`WETH: ${deployment.tokens.weth}`);
  console.log(`AERO: ${deployment.tokens.aero}`);

  console.log("\n--- Mock Protocols ---");
  console.log(`MockAavePool: ${deployment.mocks.aavePool}`);
  console.log(`MockMegapot: ${deployment.mocks.megapot}`);
  console.log(`MockAerodromeRouter: ${deployment.mocks.aerodromeRouter}`);

  console.log("\n--- Adapters ---");
  console.log(`BankAdapter: ${deployment.adapters.bank}`);
  console.log(`LotteryAdapter: ${deployment.adapters.lottery}`);
  console.log(`ShopAdapter: ${deployment.adapters.shop}`);

  console.log("\n--- Verification Commands ---");
  console.log(`\nnpx hardhat verify --network baseSepolia ${deployment.tokens.usdc} "USD Coin" "USDC" "1000000000000"`);
  console.log(`npx hardhat verify --network baseSepolia ${deployment.adapters.bank} ${coreAddresses.core} ${deployment.mocks.aavePool} ${deployment.tokens.usdc} ${coreAddresses.treasury}`);

  console.log("\n--- Next Steps ---");
  console.log("1. Run integration tests:");
  console.log("   npm run test:integration");
  console.log("\n2. Or run specific adapter tests:");
  console.log("   npm run test:integration:bank");
  console.log("   npm run test:integration:lottery");
  console.log("   npm run test:integration:shop");
}

// === Main Execution ===

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
