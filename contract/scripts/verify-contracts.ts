import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Verification Script for DefiCity Contracts
 *
 * This script verifies all deployed contracts on Basescan
 * Usage: npm run verify:baseSepolia
 */

interface DeploymentData {
  network: string;
  buildingRegistry: string;
  defiCityCore: string;
  walletFactory: string;
  treasury: string;
  mockUSDC?: string;
  mockWETH?: string;
  mockAERO?: string;
  mockAavePool?: string;
  mockMegapot?: string;
  mockAerodromeRouter?: string;
  bankAdapter?: string;
  lotteryAdapter?: string;
  shopAdapter?: string;
}

async function verifyContract(
  name: string,
  address: string,
  constructorArguments: any[]
): Promise<boolean> {
  console.log(`\n🔍 Verifying ${name}...`);
  console.log(`   Address: ${address}`);

  if (constructorArguments.length > 0) {
    console.log(`   Args:`, constructorArguments);
  }

  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments,
    });
    console.log(`✅ ${name} verified successfully!`);
    return true;
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`ℹ️  ${name} was already verified`);
      return true;
    } else if (error.message.includes("does not have bytecode")) {
      console.log(`❌ ${name} - Invalid contract address`);
      return false;
    } else {
      console.log(`⚠️  ${name} verification failed:`, error.message);
      return false;
    }
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  DefiCity Contract Verification");
  console.log("═══════════════════════════════════════════════════\n");

  const network = hre.network.name;
  console.log(`Network: ${network}`);

  // Load deployment data
  const deploymentPath = path.join(
    __dirname,
    "..",
    "deployments",
    `${network}-deployment.json`
  );

  if (!fs.existsSync(deploymentPath)) {
    console.error(`\n❌ Deployment file not found: ${deploymentPath}`);
    console.error("Please deploy contracts first or specify correct deployment file.");
    process.exit(1);
  }

  const deployment: DeploymentData = JSON.parse(
    fs.readFileSync(deploymentPath, "utf8")
  );

  console.log(`Loaded deployment data from: ${deploymentPath}\n`);

  // Constants
  const ENTRYPOINT_V06 = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  // Verification counters
  let verified = 0;
  let failed = 0;
  let total = 0;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  CORE CONTRACTS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 1. BuildingRegistry
  total++;
  if (await verifyContract("BuildingRegistry", deployment.buildingRegistry, [])) {
    verified++;
  } else {
    failed++;
  }

  // 2. DefiCityCore
  total++;
  if (
    await verifyContract("DefiCityCore", deployment.defiCityCore, [
      deployment.treasury,
    ])
  ) {
    verified++;
  } else {
    failed++;
  }

  // 3. WalletFactory
  total++;
  if (
    await verifyContract("WalletFactory", deployment.walletFactory, [
      ENTRYPOINT_V06,
      deployment.defiCityCore,
    ])
  ) {
    verified++;
  } else {
    failed++;
  }

  // Integration contracts (optional)
  if (deployment.mockUSDC) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  MOCK TOKENS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // 4. Mock USDC
    total++;
    if (
      await verifyContract("MockUSDC", deployment.mockUSDC, [
        "Mock USDC",
        "USDC",
        6,
      ])
    ) {
      verified++;
    } else {
      failed++;
    }

    // 5. Mock WETH
    if (deployment.mockWETH) {
      total++;
      if (
        await verifyContract("MockWETH", deployment.mockWETH, [
          "Mock WETH",
          "WETH",
          18,
        ])
      ) {
        verified++;
      } else {
        failed++;
      }
    }

    // 6. Mock AERO
    if (deployment.mockAERO) {
      total++;
      if (
        await verifyContract("MockAERO", deployment.mockAERO, [
          "Mock AERO",
          "AERO",
          18,
        ])
      ) {
        verified++;
      } else {
        failed++;
      }
    }
  }

  if (deployment.mockAavePool) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  MOCK PROTOCOLS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // 7. MockAavePool
    total++;
    if (await verifyContract("MockAavePool", deployment.mockAavePool, [])) {
      verified++;
    } else {
      failed++;
    }

    // 8. MockMegapot
    if (deployment.mockMegapot) {
      total++;
      if (
        await verifyContract("MockMegapot", deployment.mockMegapot, [
          deployment.mockUSDC,
        ])
      ) {
        verified++;
      } else {
        failed++;
      }
    }

    // 9. MockAerodromeRouter
    if (deployment.mockAerodromeRouter) {
      total++;
      if (
        await verifyContract(
          "MockAerodromeRouter",
          deployment.mockAerodromeRouter,
          []
        )
      ) {
        verified++;
      } else {
        failed++;
      }
    }
  }

  if (deployment.bankAdapter) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  BUILDING ADAPTERS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // 10. BankAdapter
    total++;
    if (
      await verifyContract("BankAdapter", deployment.bankAdapter, [
        deployment.defiCityCore,
        deployment.buildingRegistry,
        deployment.mockAavePool,
      ])
    ) {
      verified++;
    } else {
      failed++;
    }

    // 11. LotteryAdapter
    if (deployment.lotteryAdapter) {
      total++;
      if (
        await verifyContract("LotteryAdapter", deployment.lotteryAdapter, [
          deployment.defiCityCore,
          deployment.mockMegapot,
          deployment.mockUSDC,
          deployment.treasury,
        ])
      ) {
        verified++;
      } else {
        failed++;
      }
    }

    // 12. ShopAdapter
    if (deployment.shopAdapter) {
      total++;
      if (
        await verifyContract("ShopAdapter", deployment.shopAdapter, [
          deployment.defiCityCore,
          deployment.buildingRegistry,
          deployment.mockAerodromeRouter,
        ])
      ) {
        verified++;
      } else {
        failed++;
      }
    }
  }

  // Summary
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  VERIFICATION SUMMARY");
  console.log("═══════════════════════════════════════════════════");
  console.log(`Total Contracts:    ${total}`);
  console.log(`✅ Verified:        ${verified}`);
  console.log(`❌ Failed:          ${failed}`);
  console.log(`📊 Success Rate:    ${((verified / total) * 100).toFixed(1)}%`);
  console.log("═══════════════════════════════════════════════════\n");

  if (failed > 0) {
    console.log("⚠️  Some contracts failed verification.");
    console.log("Please check the errors above and verify manually if needed.\n");
    process.exit(1);
  } else {
    console.log("🎉 All contracts verified successfully!\n");
    process.exit(0);
  }
}

// Execute
main().catch((error) => {
  console.error("\n❌ Verification script failed:");
  console.error(error);
  process.exit(1);
});
