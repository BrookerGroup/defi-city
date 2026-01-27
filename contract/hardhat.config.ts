import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "dotenv/config";

const config = defineConfig({
  plugins: [hardhatToolboxMochaEthers],

  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR-based compilation for stack too deep fix
    },
  },

  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
      chainId: 31337,
      blockGasLimit: 50_000_000, // 50M gas limit for complex transactions
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Testnets
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    baseSepolia: {
      type: "http",
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
    },
    // Mainnets
    base: {
      type: "http",
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
    },
  },

  etherscan: {
    apiKey: process.env.BASESCAN_API_KEY || "",
  },

  sourcify: {
    enabled: true,
  },
});

export default config;
