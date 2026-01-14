const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying DeFi City Contracts...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy SimpleWalletFactory
  console.log("⏳ Deploying SimpleWalletFactory...");
  const SimpleWalletFactory = await hre.ethers.getContractFactory("SimpleWalletFactory");
  const factory = await SimpleWalletFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ SimpleWalletFactory deployed to:", factoryAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    factory: factoryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", deploymentFile);

  // Test: Create a test wallet
  console.log("\n🧪 Testing wallet creation...");
  const testOwner = deployer.address;
  const tx = await factory.createWallet(testOwner);
  const receipt = await tx.wait();

  const walletAddress = await factory.getWallet(testOwner);
  console.log("✅ Test wallet created at:", walletAddress);
  console.log("⛽ Gas used:", receipt.gasUsed.toString());

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log("  Factory:", factoryAddress);
  console.log("  Test Wallet:", walletAddress);
  console.log("\nNetwork:", hre.network.name);
  console.log("Chain ID:", deploymentInfo.chainId);
  console.log("\nNext Steps:");
  console.log("  1. Verify contracts on block explorer (if mainnet/testnet)");
  console.log("  2. Update frontend with factory address");
  console.log("  3. Test deposit and withdraw functions");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
