import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "dotenv/config";

export default {
  plugins: [hardhatToolboxMochaEthers],

  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },

  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
      chainId: 31337,
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.public.blastapi.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    baseSepolia: {
      type: "http",
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    base: {
      type: "http",
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },

  verify: {
    etherscan: {
      apiKey: "U5CV9XNHN1W8C6FCZ8RB8JQSCA26XMP5EZ",
      customChains: [
        {
          network: "baseSepolia",
          chainId: 84532,
          urls: {
            apiURL: "https://api-sepolia.basescan.org/api",
            browserURL: "https://sepolia.basescan.org",
          },
        },
      ],
    },
    sourcify: {
      enabled: true,
    },
  },
};
