const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n DefiCity Deployment Script - Base Sepolia\n");
  console.log("=".repeat(50));
  console.log("Excluding: BuildingRegistry (will deploy later)\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Treasury address (use deployer for now, change later)
  const treasury = deployer.address;

  // 1. Deploy EntryPoint (or use existing)
  console.log("1. Deploying MockEntryPoint...");
  const EntryPoint = await hre.ethers.getContractFactory("MockEntryPoint");
  const entryPoint = await EntryPoint.deploy();
  await entryPoint.waitForDeployment();
  const entryPointAddress = await entryPoint.getAddress();
  console.log("   EntryPoint deployed to:", entryPointAddress);

  // 2. Deploy DefiCityCore
  console.log("\n2. Deploying DefiCityCore...");
  const DefiCityCore = await hre.ethers.getContractFactory("DefiCityCore");
  const core = await DefiCityCore.deploy(treasury);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log("   Core deployed to:", coreAddress);

  // 3. Deploy WalletFactory
  console.log("\n3. Deploying WalletFactory...");
  const WalletFactory = await hre.ethers.getContractFactory("WalletFactory");
  const factory = await WalletFactory.deploy(entryPointAddress, coreAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("   Factory deployed to:", factoryAddress);

  // 4. Set Factory in Core
  console.log("\n4. Setting Factory in Core...");
  const tx1 = await core.setWalletFactory(factoryAddress);
  await tx1.wait();
  console.log("   Factory authorized in Core");

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("Deployment Complete!\n");
  console.log("Contract Addresses:");
  console.log("-".repeat(50));
  console.log("EntryPoint:       ", entryPointAddress);
  console.log("Core:             ", coreAddress);
  console.log("Factory:          ", factoryAddress);
  console.log("Treasury:         ", treasury);
  console.log("-".repeat(50));

  console.log("\nNext Steps:");
  console.log("1. Verify contracts on BaseScan");
  console.log("2. Deploy BuildingRegistry when ready");
  console.log("3. Update frontend config with these addresses");

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
      treasury: treasury,
    }
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\nDeployment info saved to ${deploymentFile}`);

  // Return addresses for verification
  return {
    entryPoint: entryPointAddress,
    core: coreAddress,
    factory: factoryAddress,
    treasury: treasury
  };
}

main()
  .then((addresses) => {
    console.log("\n\nVerification Commands:");
    console.log("=".repeat(50));
    console.log(`npx hardhat verify --network baseSepolia ${addresses.entryPoint}`);
    console.log(`npx hardhat verify --network baseSepolia ${addresses.core} ${addresses.treasury}`);
    console.log(`npx hardhat verify --network baseSepolia ${addresses.factory} ${addresses.entryPoint} ${addresses.core}`);
    console.log("\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
