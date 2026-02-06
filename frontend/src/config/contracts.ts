/**
 * Smart Contract Configuration
 * Contains contract addresses and ABIs for DefiCity
 */

/** Network environment: 'testnet' or 'mainnet' */
export const NETWORK_ENV: 'testnet' | 'mainnet' =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_NETWORK === 'mainnet')
    ? 'mainnet'
    : 'testnet';

/** Flag to check if running on testnet (useful for showing testnet-only features like manual jackpot) */
export const IS_TESTNET = NETWORK_ENV === 'testnet';

/** Use localhost when NEXT_PUBLIC_USE_LOCALHOST=true (after full migration) */
export const ACTIVE_NETWORK: 'localhost' | 'baseSepolia' =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_USE_LOCALHOST === 'true')
    ? 'localhost'
    : 'baseSepolia';

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
    // Megapot Lottery (Base Sepolia)
    MEGAPOT: '0x6f03c7BCaDAdBf5E6F5900DA3d56AdD8FbDac5De',
    MPUSDC: '0xA4253E7C13525287C56550b8708100f93E60509f',
    // Uniswap V3 (Base Sepolia)
    SWAP_ROUTER_02: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4',
    QUOTER_V2: '0xC5290058841028F1614F3A6F0F5816cAd0df5E27',
    SWAP_ADAPTER: '0xf692caBc47D0E05DeDEeF8e39Ef762E7a4940f35',
    // Uniswap V3 LP (Base Sepolia)
    UNISWAP_V3_FACTORY: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
    NONFUNGIBLE_POSITION_MANAGER: '0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2',
  },
  localhost: {
    WALLET_FACTORY: '',
    DEFICITY_CORE: '',
    ENTRY_POINT: '',
    BUILDING_REGISTRY: '',
    BANK_ADAPTER: '',
    AAVE_POOL_ADDRESSES_PROVIDER: '0xE4C23309117Aa30342BFaae6c95c6478e0A4Ad00',
    AAVE_POOL: '0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27',
    AAVE_DATA_PROVIDER: '0xBc9f5b7E248451CdD7cA54e717a2BFe1F32b566b',
    USDC: '0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f',
    USDT: '0x0a215D8ba66387DCA84B284D18c3B4ec3de6E54a',
    ETH: '0x4200000000000000000000000000000000000006',
    WBTC: '0x54114591963CF60EF3aA63bEfD6eC263D98145a4',
    LINK: '0x810D46F9a9027E28F9B01F75E2bdde839dA61115',
    MEGAPOT: '0x6f03c7BCaDAdBf5E6F5900DA3d56AdD8FbDac5De',
    MPUSDC: '0xA4253E7C13525287C56550b8708100f93E60509f',
    SWAP_ROUTER_02: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4',
    QUOTER_V2: '0xC5290058841028F1614F3A6F0F5816cAd0df5E27',
    SWAP_ADAPTER: '',
    UNISWAP_V3_FACTORY: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
    NONFUNGIBLE_POSITION_MANAGER: '0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2',
  }
} as const;

/** Active contract addresses (use this instead of CONTRACTS.baseSepolia when supporting localhost) */
export const ADDRESSES = CONTRACTS[ACTIVE_NETWORK];

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
    'event BuildingDemolished(uint256 indexed buildingId, address indexed user, uint256 returnedAmount)',
    'event Harvested(uint256 indexed buildingId, address indexed user, uint256 yieldAmount)',
    'event DepositRecorded(address indexed user, address indexed asset, uint256 amount)',
    'event WithdrawalRecorded(address indexed user, address indexed asset, uint256 amount)',
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
    'function preparePlace(string calldata buildingType, address user, address userSmartWallet, bytes calldata params) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas)',
    'function prepareHarvest(string calldata buildingType, address user, address userSmartWallet, uint256 buildingId, bytes calldata params) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas)',
    'function prepareDemolish(string calldata buildingType, address user, address userSmartWallet, uint256 buildingId, bytes calldata params) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas)',
    'function adapters(string calldata buildingType) external view returns (address)',
    'function isRegistered(string calldata buildingType) external view returns (bool)',
  ],

  BANK_ADAPTER: [
    'function preparePlace(address user, address userSmartWallet, bytes calldata params) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas)',
    'function BUILDING_TYPE() external pure returns (string memory)',
  ],
  LP_BUILDING_ADAPTER: [
    'function preparePlace(address user, address userSmartWallet, bytes calldata params) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas)',
    'function prepareHarvest(address user, address userSmartWallet, uint256 buildingId, bytes calldata params) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas)',
    'function prepareDemolish(address user, address userSmartWallet, uint256 buildingId, bytes calldata params) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas)',
    'function prepareIncreaseLiquidity(address user, address userSmartWallet, uint256 buildingId, bytes calldata params) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas)',
    'function prepareDecreaseLiquidity(address user, address userSmartWallet, uint256 buildingId, bytes calldata params) external view returns (address[] memory targets, uint256[] memory values, bytes[] memory datas)',
    'function getBuildingType() external view returns (string memory)',
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
  SWAP_ADAPTER: [
    'function prepareSwap(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMinimum, uint24 fee, address recipient, uint256 deadline) params) external view returns (address[] targets, uint256[] values, bytes[] datas)',
  ],
  QUOTER_V2: [
    'function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  ],
  SWAP_ROUTER_02: [
    'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)',
  ],
  UNISWAP_V3_FACTORY: [
    'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
  ],
  UNISWAP_V3_POOL: [
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function fee() external view returns (uint24)',
    'function tickSpacing() external view returns (int24)',
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
    'function liquidity() external view returns (uint128)',
  ],
  NONFUNGIBLE_POSITION_MANAGER: [
    'function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
    'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
    'function balanceOf(address owner) external view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  ],
  AAVE_POOL_ADDRESSES_PROVIDER: [
    'function getPriceOracle() external view returns (address)',
    'function getPool() external view returns (address)',
    'function getPoolDataProvider() external view returns (address)',
  ],

  MEGAPOT: [
    // Ticket functions
    'function purchaseTickets(address referrer, uint256 amount, address recipient) external',
    'function withdrawWinnings() external',
    'function runJackpot(bytes32 userRandomNumber) external payable',
    'function ticketPrice() external view returns (uint256)',
    'function lastJackpotEndTime() external view returns (uint256)',
    'function roundDurationInSeconds() external view returns (uint256)',
    'function feeBps() external view returns (uint256)',
    'function allowPurchasing() external view returns (bool)',
    'function getJackpotFee() external view returns (uint256)',
    'function usersInfo(address user) external view returns (uint256 ticketsPurchased, uint256 winningsClaimable)',
    // LP functions - Write
    'function lpDeposit(uint256 riskPercentage, uint256 value) external returns (bool)',
    'function lpAdjustRiskPercentage(uint256 riskPercentage) external returns (bool)',
    'function withdrawAllLp() external returns (bool)',
    // LP functions - Read
    'function lpsInfo(address lp) external view returns (uint256 principal, uint256 stake, uint256 riskPercentage, bool active)',
    'function lpPoolTotal() external view returns (uint256)',
    'function lpPoolCap() external view returns (uint256)',
    // Events
    'event UserTicketPurchase(address indexed recipient, uint256 ticketsPurchasedTotalBps, address indexed referrer, address indexed buyer)',
    'event JackpotRun(uint256 time, address winner, uint256 winningTicket, uint256 winAmount, uint256 ticketsPurchasedTotalBps)',
    'event UserWinWithdrawal(address indexed user, uint256 amount)',
  ],

  MPUSDC: [
    'function balanceOf(address account) external view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function mint(address to, uint256 amount) external',
    'function decimals() external view returns (uint8)',
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
