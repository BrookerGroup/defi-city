const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy integration contracts to local Hardhat network
 * Usage: npx hardhat run scripts/deploy-integration-local.js --network localhost
 */

const DEPLOYMENTS_DIR = path.join(__dirname, "../deployments");
const LOCAL_DEPLOYMENT_FILE = "localhost-integration.json";

async function main() {
  console.log("\n========================================");
  console.log("  Deploy Integration Contracts (Local)");
  console.log("  Target: Localhost");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Step 1: Deploy core contracts first
  console.log("--- Deploying Core Contracts ---");
  const MockEntryPoint = await ethers.getContractFactory("MockEntryPoint");
  const entryPoint = await MockEntryPoint.deploy();
  await entryPoint.waitForDeployment();
  console.log(`✓ MockEntryPoint: ${await entryPoint.getAddress()}`);

  const DefiCityCore = await ethers.getContractFactory("DefiCityCore");
  const core = await DefiCityCore.deploy(deployer.address); // deployer as treasury
  await core.waitForDeployment();
  console.log(`✓ DefiCityCore: ${await core.getAddress()}`);

  const WalletFactory = await ethers.getContractFactory("WalletFactory");
  const factory = await WalletFactory.deploy(
    await entryPoint.getAddress(),
    await core.getAddress()
  );
  await factory.waitForDeployment();
  console.log(`✓ WalletFactory: ${await factory.getAddress()}`);

  await core.setWalletFactory(await factory.getAddress());
  console.log("✓ Factory set in Core");

  // Step 2: Deploy mock tokens
  console.log("\n--- Deploying Mock Tokens ---");
  const usdc = await deployMockToken("USD Coin", "USDC", 6, ethers.parseUnits("1000000", 6));
  const weth = await deployMockToken("Wrapped Ether", "WETH", 18, ethers.parseUnits("1000", 18));
  const aero = await deployMockToken("Aerodrome", "AERO", 18, ethers.parseUnits("1000000", 18));

  // Step 3: Add supported assets
  await core.addSupportedAsset(await usdc.getAddress());
  console.log("✓ USDC added as supported asset");

  // Step 4: Deploy mock protocols
  console.log("\n--- Deploying Mock Protocols ---");
  const mockAave = await deployMockAavePool(usdc, weth);
  const mockMegapot = await deployMockMegapot(usdc);
  const mockRouter = await deployMockAerodromeRouter(usdc, weth, aero);

  // Step 5: Fund mock protocols
  console.log("\n--- Funding Mock Protocols ---");
  await fundMockProtocols(deployer, usdc, weth, mockAave, mockMegapot);

  // Step 6: Deploy adapters
  console.log("\n--- Deploying Adapters ---");
  const bankAdapter = await deployBankAdapter(
    await core.getAddress(),
    await mockAave.getAddress(),
    deployer.address
  );

  const lotteryAdapter = await deployLotteryAdapter(
    await core.getAddress(),
    await mockMegapot.getAddress(),
    await usdc.getAddress(),
    deployer.address
  );

  const shopAdapter = await deployShopAdapter(
    await core.getAddress(),
    await mockRouter.getAddress(),
    deployer.address
  );

  // Step 7: Save deployment info
  console.log("\n--- Saving Deployment Info ---");
  const deployment = {
    network: "localhost",
    chainId: "31337",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    core: {
      entryPoint: await entryPoint.getAddress(),
      core: await core.getAddress(),
      factory: await factory.getAddress(),
      treasury: deployer.address
    },
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
  printDeploymentSummary(deployment);

  console.log("\n✅ Local deployment complete!\n");
}

// === Helper Functions ===

async function deployMockToken(name, symbol, decimals, initialSupply) {
  console.log(`Deploying ${name} (${symbol})...`);
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy(name, symbol, initialSupply);
  await token.waitForDeployment();
  const address = await token.getAddress();
  console.log(`  ✓ ${symbol}: ${address}`);
  return token;
}

async function deployMockAavePool(usdc, weth) {
  console.log("Deploying MockAavePool...");
  const MockAavePool = await ethers.getContractFactory("MockAavePool");
  const mockAave = await MockAavePool.deploy();
  await mockAave.waitForDeployment();
  const address = await mockAave.getAddress();
  console.log(`  ✓ MockAavePool: ${address}`);

  // Configure assets
  await mockAave.setAssetConfig(await usdc.getAddress(), 8000, 8500, 500, 1000);
  await mockAave.setAssetConfig(await weth.getAddress(), 8000, 8500, 300, 800);
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
  // Fund MockAavePool
  const aaveLiquidityUSDC = ethers.parseUnits("500000", 6);
  const aaveLiquidityWETH = ethers.parseUnits("250", 18);

  await usdc.transfer(await mockAave.getAddress(), aaveLiquidityUSDC);
  await weth.transfer(await mockAave.getAddress(), aaveLiquidityWETH);
  await mockAave.addLiquidity(await usdc.getAddress(), aaveLiquidityUSDC);
  await mockAave.addLiquidity(await weth.getAddress(), aaveLiquidityWETH);
  console.log("  ✓ MockAave funded with liquidity");

  // Fund MockMegapot
  const jackpotAmount = ethers.parseUnits("100000", 6);
  await usdc.approve(await mockMegapot.getAddress(), jackpotAmount);
  await mockMegapot.addToJackpot(jackpotAmount);
  console.log("  ✓ MockMegapot funded with jackpot");
}

async function deployBankAdapter(core, aavePool, treasury) {
  console.log("Deploying BankAdapter...");
  const BankAdapter = await ethers.getContractFactory("BankAdapter");
  const adapter = await BankAdapter.deploy(core, aavePool, treasury);
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
  const filePath = path.join(DEPLOYMENTS_DIR, LOCAL_DEPLOYMENT_FILE);
  fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));
  console.log(`✓ Deployment info saved to ${LOCAL_DEPLOYMENT_FILE}`);
}

function printDeploymentSummary(deployment) {
  console.log("\n========================================");
  console.log("  Deployment Summary (Local)");
  console.log("========================================");
  console.log(`Network: ${deployment.network}`);
  console.log(`Chain ID: ${deployment.chainId}`);
  console.log(`Deployer: ${deployment.deployer}`);

  console.log("\n--- Core Contracts ---");
  console.log(`DefiCityCore: ${deployment.core.core}`);
  console.log(`WalletFactory: ${deployment.core.factory}`);
  console.log(`Treasury: ${deployment.core.treasury}`);

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

  console.log("\n--- Run Integration Tests ---");
  console.log("npm run test:integration:local");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
