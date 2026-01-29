/**
 * Smart Contract Configuration
 * Contains contract addresses and ABIs for DefiCity
 */

// Contract addresses - Base Sepolia Testnet
export const CONTRACTS = {
  baseSepolia: {
    WALLET_FACTORY: '0x764f2D0F274d23B4cf51e5ae0c27e4020eD8ee2A',
    DEFICITY_CORE: '0x641adC5d1e2AB02f772E86Dc3694d3e763fC549B',
    ENTRY_POINT: '0x5864A489a25e8cE84b22903dc8f3038F6b0484f3',
    BUILDING_REGISTRY: '0x4c85d20BEF9D52ae6f4dAA05DE758932A3042486',
    BANK_ADAPTER: '0x16306E942AE4140ff4114C4548Bcb89500DaE5af',
    AAVE_POOL_ADDRESSES_PROVIDER: '0xE4C23309117Aa30342BFaae6c95c6478e0A4Ad00',
    AAVE_POOL: '0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27',
    AAVE_DATA_PROVIDER: '0xBc9f5b7E248451CdD7cA54e717a2BFe1F32b566b',
    // Token addresses (Base Sepolia - Aave Testnet)
    USDC: '0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f',
    USDT: '0x0a215D8ba66387DCA84B284D18c3B4ec3de6E54a',
    ETH: '0x4200000000000000000000000000000000000006',
    WBTC: '0x54114591963CF60EF3aA63bEfD6eC263D98145a4',
    LINK: '0x810D46F9a9027E28F9B01F75E2bdde839dA61115',
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
    // createTownHall - Entry point for new players (creates wallet + townhall)
    'function createTownHall(uint256 x, uint256 y) external returns (address walletAddress, uint256 buildingId)',
    // View functions
    'function hasWallet(address user) external view returns (bool)',
    'function userSmartWallets(address user) external view returns (address)',
    'function getWallet(address user) external view returns (address)',
    'function buildings(uint256 buildingId) external view returns (tuple(uint256 id, address owner, address smartWallet, string buildingType, address asset, uint256 amount, uint256 placedAt, uint256 coordinateX, uint256 coordinateY, bool active, bytes metadata))',
    'function getUserBuildings(address user) external view returns (tuple(uint256 id, address owner, address smartWallet, string buildingType, address asset, uint256 amount, uint256 placedAt, uint256 coordinateX, uint256 coordinateY, bool active, bytes metadata)[])',
    'function getBuildingAt(address user, uint256 x, uint256 y) external view returns (tuple(uint256 id, address owner, address smartWallet, string buildingType, address asset, uint256 amount, uint256 placedAt, uint256 coordinateX, uint256 coordinateY, bool active, bytes metadata))',
    'function getUserStats(address user) external view returns (tuple(uint256 totalDeposited, uint256 totalWithdrawn, uint256 totalHarvested, uint256 buildingCount, uint256 cityCreatedAt))',
    'function userGridBuildings(address user, uint256 x, uint256 y) external view returns (uint256)',
    'function recordDemolition(address user, uint256 buildingId, uint256 returnedAmount) external',
    'function recordBuildingPlacement(address user, string calldata buildingType, address asset, uint256 amount, uint256 x, uint256 y, bytes calldata metadata) external returns (uint256)',
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

  BUILDING_REGISTRY: [
    'function preparePlace(address user, address userSmartWallet, string calldata buildingType, uint256 x, uint256 y, bytes calldata params) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas)',
    'function prepareHarvest(string calldata buildingType, address user, address userSmartWallet, uint256 buildingId, bytes calldata params) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas)',
    'function adapters(string calldata buildingType) external view returns (address)',
    'function isRegistered(string calldata buildingType) external view returns (bool)',
  ],

  BANK_ADAPTER: [
    'function preparePlace(address user, address userSmartWallet, bytes calldata params) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas)',
    'function BUILDING_TYPE() external pure returns (string memory)',
  ],

  ERC20: [
    'function balanceOf(address account) external view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function transfer(address to, uint256 amount) external returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
    'function decimals() external view returns (uint8)',
    'function symbol() external view returns (string)',
  ],

  AAVE_POOL: [
    'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
    'function withdraw(address asset, uint256 amount, address to) external returns (uint256)',
    'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external',
    'function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) external returns (uint256)',
    'function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
  ],
  AAVE_DATA_PROVIDER: [
    'function getUserReserveData(address asset, address user) external view returns (uint256 currentATokenBalance, uint256 currentStableDebt, uint256 currentVariableDebt, uint256 principalStableDebt, uint256 scaledVariableDebt, uint256 stableBorrowRate, uint256 liquidityIndex, bool usageAsCollateralEnabled, uint256 variableBorrowIndex)',
    'function getReserveData(address asset) external view returns (uint256 unbacked, uint256 accruedToTreasuryScaled, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)',
    // Reserve configuration (LTV, liquidation threshold, etc.)
    'function getReserveConfigurationData(address asset) external view returns (uint256 decimals, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen)',
    // Reserve caps (supply cap, borrow cap)
    'function getReserveCaps(address asset) external view returns (uint256 borrowCap, uint256 supplyCap)',
    // Get all reserves list
    'function getAllReservesTokens() external view returns (tuple(string symbol, address tokenAddress)[])',
  ],
  AAVE_ORACLE: [
    'function getAssetPrice(address asset) external view returns (uint256)',
    'function BASE_CURRENCY_UNIT() external view returns (uint256)',
    'function getAssetsPrices(address[] calldata assets) external view returns (uint256[])',
  ],
  AAVE_POOL_ADDRESSES_PROVIDER: [
    'function getPriceOracle() external view returns (address)',
    'function getPool() external view returns (address)',
    'function getPoolDataProvider() external view returns (address)',
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
