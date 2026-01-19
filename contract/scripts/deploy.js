const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 DefiCity Deployment Script\n");
  console.log("=".repeat(50));

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Treasury address (use deployer for now, change later)
  const treasury = deployer.address;

  // 1. Deploy EntryPoint (or use existing)
  console.log("1️⃣  Deploying EntryPoint...");
  const EntryPoint = await hre.ethers.getContractFactory("MockEntryPoint");
  const entryPoint = await EntryPoint.deploy();
  await entryPoint.waitForDeployment();
  const entryPointAddress = await entryPoint.getAddress();
  console.log("   ✅ EntryPoint deployed to:", entryPointAddress);

  // 2. Deploy DefiCityCore
  console.log("\n2️⃣  Deploying DefiCityCore...");
  const DefiCityCore = await hre.ethers.getContractFactory("DefiCityCore");
  const core = await DefiCityCore.deploy(treasury);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log("   ✅ Core deployed to:", coreAddress);

  // 3. Deploy WalletFactory
  console.log("\n3️⃣  Deploying WalletFactory...");
  const WalletFactory = await hre.ethers.getContractFactory("WalletFactory");
  const factory = await WalletFactory.deploy(entryPointAddress, coreAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("   ✅ Factory deployed to:", factoryAddress);

  // 4. Set Factory in Core
  console.log("\n4️⃣  Setting Factory in Core...");
  const tx1 = await core.setWalletFactory(factoryAddress);
  await tx1.wait();
  console.log("   ✅ Factory authorized in Core");

  // 5. Deploy BuildingManager
  console.log("\n5️⃣  Deploying BuildingManager...");
  const BuildingManager = await hre.ethers.getContractFactory("BuildingManager");
  const buildingManager = await BuildingManager.deploy(coreAddress);
  await buildingManager.waitForDeployment();
  const buildingManagerAddress = await buildingManager.getAddress();
  console.log("   ✅ BuildingManager deployed to:", buildingManagerAddress);

  // 6. Add supported assets (example: mock USDC)
  console.log("\n6️⃣  Adding supported assets...");
  // For testing, we'll skip this for now
  // In production, add actual token addresses
  console.log("   ⏭️  Skipped (add real token addresses later)");

  // 7. Set protocol addresses in BuildingManager (example: Aave)
  console.log("\n7️⃣  Setting protocol addresses...");
  // For testing, we'll skip this for now
  // In production, set Aave Pool, Aerodrome Router, etc.
  console.log("   ⏭️  Skipped (add real protocol addresses later)");

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 Deployment Complete!\n");
  console.log("Contract Addresses:");
  console.log("━".repeat(50));
  console.log("EntryPoint:       ", entryPointAddress);
  console.log("Core:             ", coreAddress);
  console.log("Factory:          ", factoryAddress);
  console.log("BuildingManager:  ", buildingManagerAddress);
  console.log("Treasury:         ", treasury);
  console.log("━".repeat(50));

  console.log("\n📝 Next Steps:");
  console.log("1. Update frontend/src/config/contracts.ts with these addresses");
  console.log("2. Set environment variables in frontend/.env.local");
  console.log("3. Add real protocol addresses (Aave, Aerodrome, etc.)");
  console.log("4. Add supported assets (USDC, USDT, WETH, etc.)");

  console.log("\n📄 Frontend Config:");
  console.log(`
export const CONTRACTS = {
  localhost: {
    WALLET_FACTORY: '${factoryAddress}',
    DEFICITY_CORE: '${coreAddress}',
    BUILDING_MANAGER: '${buildingManagerAddress}',
    ENTRY_POINT: '${entryPointAddress}',
  }
}
  `);

  console.log("🧪 Test the deployment:");
  console.log("npx hardhat test --network localhost\n");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      entryPoint: entryPointAddress,
      core: coreAddress,
      factory: factoryAddress,
      buildingManager: buildingManagerAddress,
      treasury: treasury,
    }
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`💾 Deployment info saved to ${deploymentFile}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
