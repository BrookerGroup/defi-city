/**
 * Auto-Verification Script for SmartWallet Deployments
 *
 * Monitors WalletCreated events and automatically verifies newly deployed wallets
 * on Basescan with correct constructor arguments.
 *
 * Usage:
 *   npx hardhat run scripts/auto-verify-wallets.ts --network baseSepolia
 */

import hre from "hardhat";
import { WalletFactory } from "../types/ethers-contracts";

interface WalletCreatedEvent {
  wallet: string;
  owner: string;
  salt: bigint;
  walletNumber: bigint;
}

async function main() {
  console.log("\n========================================");
  console.log("  Auto-Verification for SmartWallets");
  console.log("========================================\n");

  const network = hre.network.name;
  console.log(`Network: ${network}`);

  // Load factory address from deployment
  const deploymentPath = `./deployments/${network}-deployment.json`;
  let deployment: any;

  try {
    deployment = await import(deploymentPath);
  } catch (error) {
    console.error(`❌ Deployment file not found: ${deploymentPath}`);
    console.log("Please deploy contracts first.");
    process.exit(1);
  }

  const factoryAddress = deployment.walletFactory;
  const coreAddress = deployment.defiCityCore;
  const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // ERC-4337 EntryPoint

  console.log(`WalletFactory: ${factoryAddress}`);
  console.log(`DefiCityCore: ${coreAddress}`);
  console.log(`EntryPoint: ${entryPointAddress}\n`);

  // Connect to factory
  const factory = await hre.ethers.getContractAt("WalletFactory", factoryAddress) as WalletFactory;

  // Get all WalletCreated events
  console.log("Fetching WalletCreated events...");
  const filter = factory.filters.WalletCreated();
  const events = await factory.queryFilter(filter);

  console.log(`Found ${events.length} wallet(s) created\n`);

  if (events.length === 0) {
    console.log("No wallets to verify. Exiting.");
    return;
  }

  // Verify each wallet
  for (const event of events) {
    const { wallet, owner, salt } = event.args as any as WalletCreatedEvent;

    console.log(`\nVerifying Wallet #${events.indexOf(event) + 1}:`);
    console.log(`  Address: ${wallet}`);
    console.log(`  Owner: ${owner}`);
    console.log(`  Salt: ${salt.toString()}`);

    // Check if already verified
    try {
      const code = await hre.ethers.provider.getCode(wallet);
      if (code === "0x") {
        console.log(`  ⚠️ Wallet not deployed yet`);
        continue;
      }

      // Try to verify
      await verifyWallet(wallet, owner, entryPointAddress, coreAddress);
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log(`  ✅ Already verified`);
      } else {
        console.error(`  ❌ Error: ${error.message}`);
      }
    }
  }

  console.log("\n========================================");
  console.log("  Verification Complete");
  console.log("========================================\n");
}

async function verifyWallet(
  walletAddress: string,
  owner: string,
  entryPoint: string,
  core: string
) {
  try {
    await hre.run("verify:verify", {
      address: walletAddress,
      contract: "contracts/wallet/SmartWallet.sol:SmartWallet",
      constructorArguments: [entryPoint, owner, core],
    });

    console.log(`  ✅ Verified successfully`);
    console.log(`  Explorer: https://sepolia.basescan.org/address/${walletAddress}#code`);
  } catch (error: any) {
    throw error;
  }
}

// Run with error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
