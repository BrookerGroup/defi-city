const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing Deployed Contracts on Sepolia\n");
  console.log("=" .repeat(60));

  // Contract addresses
  const FACTORY_ADDRESS = "0x0899fDF0Dfe72751925901e72DB41A0aDB18be47";
  const WALLET_ADDRESS = "0x8F731c95d6254211c5b86Cc22319df992e869E1F";

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("📝 Testing as:", signer.address);

  // Connect to factory
  const factory = await hre.ethers.getContractAt("SimpleWalletFactory", FACTORY_ADDRESS);
  console.log("✅ Connected to Factory:", FACTORY_ADDRESS);

  // Check total wallets
  const totalWallets = await factory.totalWallets();
  console.log("📊 Total wallets created:", totalWallets.toString());

  // Get user's wallet
  const userWallet = await factory.getWallet(signer.address);
  console.log("💼 Your wallet:", userWallet);

  if (userWallet !== hre.ethers.ZeroAddress) {
    // Connect to wallet
    const wallet = await hre.ethers.getContractAt("SimpleSmartWallet", userWallet);

    // Check owner
    const owner = await wallet.owner();
    console.log("👤 Wallet owner:", owner);
    console.log("✅ Owner matches:", owner === signer.address);

    // Check ETH balance
    const ethBalance = await wallet.getETHBalance();
    console.log("\n💰 Wallet Balances:");
    console.log("   ETH:", hre.ethers.formatEther(ethBalance), "ETH");

    // Check if wallet has ETH
    if (ethBalance > 0) {
      console.log("\n✨ Wallet has ETH! You can test withdrawals.");
      console.log("   Try: await wallet.withdrawETH(yourAddress, amount)");
    } else {
      console.log("\n💡 Wallet is empty. To test:");
      console.log("   1. Send ETH: await signer.sendTransaction({ to: wallet, value: amount })");
      console.log("   2. Then withdraw: await wallet.withdrawETH(yourAddress, amount)");
    }
  } else {
    console.log("\n❌ No wallet found for your address");
    console.log("   Create one with: await factory.createWallet(yourAddress)");
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Test Complete!");
  console.log("\n🔗 View on Etherscan:");
  console.log("   Factory: https://sepolia.etherscan.io/address/" + FACTORY_ADDRESS);
  if (userWallet !== hre.ethers.ZeroAddress) {
    console.log("   Your Wallet: https://sepolia.etherscan.io/address/" + userWallet);
  }
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
