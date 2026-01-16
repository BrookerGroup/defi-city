/**
 * Smart Contract Configuration
 * Contains contract addresses and ABIs for DefiCity
 */

// Contract addresses - Base Sepolia Testnet
export const CONTRACTS = {
  baseSepolia: {
    WALLET_FACTORY: '0xD7e5Ef23F53c98a01b63e99A91e1547229579c7A',
    DEFICITY_CORE: '0xaDc51D79177BA89E1b3c99994F95E5A825194e59',
    ENTRY_POINT: '0x4290Cd4e3c7a781856c507EeaA02A4F8192d0922',
  },
  localhost: {
    WALLET_FACTORY: '',
    DEFICITY_CORE: '',
    ENTRY_POINT: '',
  }
} as const;

// Minimal ABIs for required functions
export const ABIS = {
  WALLET_FACTORY: [
    // createWallet - Main wallet creation function
    'function createWallet(address owner, uint256 salt) external returns (address wallet)',
    // createOrGetWallet - Convenience function (recommended)
    'function createOrGetWallet(address owner) external returns (address wallet)',
    // View functions
    'function walletsByOwner(address owner) external view returns (address)',
    'function getAddress(address owner, uint256 salt) external view returns (address)',
    'function isWalletDeployed(address owner, uint256 salt) external view returns (bool)',
    'function getWalletByOwner(address owner) external view returns (address)',
    // Events
    'event WalletCreated(address indexed wallet, address indexed owner, uint256 salt, uint256 walletNumber)',
  ],

  DEFICITY_CORE: [
    // View functions
    'function hasWallet(address user) external view returns (bool)',
    'function userSmartWallets(address user) external view returns (address)',
    'function buildings(uint256 buildingId) external view returns (tuple(uint256 id, address owner, address smartWallet, string buildingType, address asset, uint256 amount, uint256 placedAt, uint256 coordinateX, uint256 coordinateY, bool active, bytes metadata))',
    'function getUserBuildings(address user) external view returns (tuple(uint256 id, address owner, address smartWallet, string buildingType, address asset, uint256 amount, uint256 placedAt, uint256 coordinateX, uint256 coordinateY, bool active, bytes metadata)[])',
    'function getBuildingAt(uint256 x, uint256 y) external view returns (tuple(uint256 id, address owner, address smartWallet, string buildingType, address asset, uint256 amount, uint256 placedAt, uint256 coordinateX, uint256 coordinateY, bool active, bytes metadata))',
    'function userStats(address user) external view returns (tuple(uint256 totalDeposited, uint256 totalWithdrawn, uint256 totalHarvested, uint256 buildingCount, uint256 cityCreatedAt))',
    'function gridBuildings(uint256 x, uint256 y) external view returns (uint256)',
    // Events
    'event BuildingPlaced(uint256 indexed buildingId, address indexed user, address indexed smartWallet, string buildingType, address asset, uint256 amount, uint256 x, uint256 y)',
  ],

  SMART_WALLET: [
    // Execution functions
    'function execute(address dest, uint256 value, bytes calldata func) external',
    'function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external',
    // Session key functions
    'function createSessionKey(address sessionKey, uint256 validUntil, uint256 dailyLimit) external',
    'function revokeSessionKey(address sessionKey) external',
    'function executeFromGame(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas) external',
    // View functions
    'function owner() external view returns (address)',
    'function sessionKeys(address key) external view returns (tuple(bool active, uint256 validUntil, uint256 dailyLimit, uint256 spentToday, uint256 lastResetDay))',
  ],
} as const;

// Chain configuration
export const SUPPORTED_CHAINS = {
  baseSepolia: {
    id: 84532,
    name: 'Base Sepolia',
    network: 'base-sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: ['https://sepolia.base.org'],
      },
      public: {
        http: ['https://sepolia.base.org'],
      },
    },
    blockExplorers: {
      default: {
        name: 'BaseScan',
        url: 'https://sepolia.basescan.org',
      },
    },
    testnet: true,
  },
  localhost: {
    id: 31337,
    name: 'Localhost',
    network: 'localhost',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: ['http://127.0.0.1:8545'],
      },
    },
    testnet: true,
  },
} as const;
