import hre from "hardhat";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { isContractDeployed } from "./networkHelpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Deployment loader utilities for integration tests
 */

const DEPLOYMENTS_DIR = join(__dirname, "../../../deployments");

// Auto-detect network from hardhat config
function getDeploymentFiles() {
  const network = hre.network.name;

  if (network === "localhost" || network === "hardhat") {
    return {
      core: "localhost-integration.json",
      integration: "localhost-integration.json"
    };
  } else {
    return {
      core: "baseSepolia.json",
      integration: "baseSepolia-integration.json"
    };
  }
}

/**
 * Load core contract deployment
 * @param {string} network - Network name
 * @returns {Object} Core deployment data
 */
function loadCoreDeployment(network) {
  const files = getDeploymentFiles();
  const filePath = join(DEPLOYMENTS_DIR, files.core);

  if (!existsSync(filePath)) {
    throw new Error(
      `Core deployment file not found: ${filePath}\n` +
      `Please deploy contracts first: npm run deploy:integration:local (or deploy:integration)`
    );
  }

  const deployment = JSON.parse(readFileSync(filePath, "utf8"));
  console.log(`✓ Loaded core deployment from ${files.core}`);

  // For localhost, core contracts are in the same file
  if (deployment.core) {
    return {
      contracts: deployment.core,
      chainId: deployment.chainId,
      deployer: deployment.deployer
    };
  }

  return deployment;
}

/**
 * Load integration contract deployment
 * @param {string} network - Network name
 * @returns {Object} Integration deployment data
 */
function loadIntegrationDeployment(network) {
  const files = getDeploymentFiles();
  const filePath = join(DEPLOYMENTS_DIR, files.integration);

  if (!existsSync(filePath)) {
    throw new Error(
      `Integration deployment file not found: ${filePath}\n` +
      `Please deploy integration contracts first: npm run deploy:integration:local (or deploy:integration)`
    );
  }

  const deployment = JSON.parse(readFileSync(filePath, "utf8"));
  console.log(`✓ Loaded integration deployment from ${files.integration}`);
  return deployment;
}

/**
 * Get all deployment addresses
 * @returns {Object} All contract addresses
 */
function getAllAddresses() {
  const coreDeployment = loadCoreDeployment();
  const integrationDeployment = loadIntegrationDeployment();

  return {
    core: {
      entryPoint: coreDeployment.contracts.entryPoint,
      core: coreDeployment.contracts.core,
      factory: coreDeployment.contracts.factory,
      treasury: coreDeployment.contracts.treasury
    },
    tokens: {
      usdc: integrationDeployment.tokens.usdc,
      weth: integrationDeployment.tokens.weth,
      aero: integrationDeployment.tokens.aero
    },
    mocks: {
      aavePool: integrationDeployment.mocks.aavePool,
      megapot: integrationDeployment.mocks.megapot,
      aerodromeRouter: integrationDeployment.mocks.aerodromeRouter
    },
    adapters: {
      bank: integrationDeployment.adapters.bank,
      lottery: integrationDeployment.adapters.lottery,
      shop: integrationDeployment.adapters.shop
    }
  };
}

/**
 * Attach to deployed contracts
 * @param {object} ethers - Ethers instance from network connection
 * @param {Object} addresses - Contract addresses
 * @returns {Promise<Object>} Attached contract instances
 */
async function attachContracts(ethers, addresses) {
  console.log("Attaching to deployed contracts...");

  // Core contracts
  const entryPoint = await ethers.getContractAt("MockEntryPoint", addresses.core.entryPoint);
  const core = await ethers.getContractAt("DefiCityCore", addresses.core.core);
  const factory = await ethers.getContractAt("WalletFactory", addresses.core.factory);

  // Token contracts
  const usdc = await ethers.getContractAt("MockERC20", addresses.tokens.usdc);
  const weth = await ethers.getContractAt("MockERC20", addresses.tokens.weth);
  const aero = await ethers.getContractAt("MockERC20", addresses.tokens.aero);

  // Mock protocol contracts
  const mockAave = await ethers.getContractAt("MockAavePool", addresses.mocks.aavePool);
  const mockMegapot = await ethers.getContractAt("MockMegapot", addresses.mocks.megapot);
  const mockRouter = await ethers.getContractAt("MockAerodromeRouter", addresses.mocks.aerodromeRouter);

  // Adapter contracts
  const bankAdapter = await ethers.getContractAt("BankAdapter", addresses.adapters.bank);
  const lotteryAdapter = await ethers.getContractAt("LotteryAdapter", addresses.adapters.lottery);
  const shopAdapter = await ethers.getContractAt("ShopAdapter", addresses.adapters.shop);

  console.log("✓ All contracts attached");

  return {
    // Core
    entryPoint,
    core,
    factory,

    // Tokens
    usdc,
    weth,
    aero,

    // Mocks
    mockAave,
    mockMegapot,
    mockRouter,

    // Adapters
    bankAdapter,
    lotteryAdapter,
    shopAdapter
  };
}

/**
 * Verify all contracts are deployed
 * @param {object} ethers - Ethers instance from network connection
 * @param {Object} addresses - Contract addresses to verify
 * @returns {Promise<boolean>} true if all contracts deployed
 */
async function verifyAllDeployed(ethers, addresses) {
  console.log("Verifying contract deployments...");

  const checks = [
    { name: "EntryPoint", address: addresses.core.entryPoint },
    { name: "DefiCityCore", address: addresses.core.core },
    { name: "WalletFactory", address: addresses.core.factory },
    { name: "USDC", address: addresses.tokens.usdc },
    { name: "WETH", address: addresses.tokens.weth },
    { name: "AERO", address: addresses.tokens.aero },
    { name: "MockAavePool", address: addresses.mocks.aavePool },
    { name: "MockMegapot", address: addresses.mocks.megapot },
    { name: "MockAerodromeRouter", address: addresses.mocks.aerodromeRouter },
    { name: "BankAdapter", address: addresses.adapters.bank },
    { name: "LotteryAdapter", address: addresses.adapters.lottery },
    { name: "ShopAdapter", address: addresses.adapters.shop }
  ];

  for (const check of checks) {
    const deployed = await isContractDeployed(ethers, check.address);
    if (!deployed) {
      console.error(`❌ ${check.name} not deployed at ${check.address}`);
      return false;
    }
    console.log(`  ✓ ${check.name}: ${check.address}`);
  }

  console.log("✓ All contracts verified");
  return true;
}

/**
 * Get deployment info for display
 * @returns {Object} Deployment info
 */
function getDeploymentInfo() {
  const coreDeployment = loadCoreDeployment();
  const integrationDeployment = loadIntegrationDeployment();

  return {
    coreDeployedAt: coreDeployment.timestamp,
    coreDeployer: coreDeployment.deployer,
    integrationDeployedAt: integrationDeployment.timestamp,
    integrationDeployer: integrationDeployment.deployer,
    network: integrationDeployment.network,
    chainId: integrationDeployment.chainId
  };
}

export {
  loadCoreDeployment,
  loadIntegrationDeployment,
  getAllAddresses,
  attachContracts,
  verifyAllDeployed,
  getDeploymentInfo
};
