import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import CoreContractsModule from "./CoreContracts";

/**
 * Integration Contracts Deployment Module
 *
 * Deploys integration adapters and mock DeFi protocols:
 * - Mock tokens (USDC, WETH)
 * - Mock DeFi protocols (Aave, Megapot, Aerodrome)
 * - Building adapters (Bank, Lottery, Shop, Vault, Staking)
 *
 * Depends on CoreContractsModule
 */
const IntegrationContractsModule = buildModule("IntegrationContracts", (m) => {
  // Get core contracts
  const { buildingRegistry, defiCityCore } = m.useModule(CoreContractsModule);

  // Get treasury from core module parameters
  const treasuryAddress = m.getParameter("treasury", m.getAccount(0));

  // Deploy Mock Tokens (using MockERC20)
  const mockUSDC = m.contract("MockERC20", [
    "Mock USDC",
    "USDC",
    1_000_000_000_000n, // 1M USDC (6 decimals)
  ], { id: "MockUSDC" });

  const mockWETH = m.contract("MockERC20", [
    "Mock WETH",
    "WETH",
    1_000_000_000_000_000_000_000_000n, // 1M WETH (18 decimals)
  ], { id: "MockWETH" });

  const mockAERO = m.contract("MockERC20", [
    "Mock AERO",
    "AERO",
    1_000_000_000_000_000_000_000_000n, // 1M AERO (18 decimals)
  ], { id: "MockAERO" });

  // Deploy Mock DeFi Protocols
  const mockAavePool = m.contract("MockAavePool");
  const mockMegapot = m.contract("MockMegapot", [mockUSDC]);
  const mockAerodromeRouter = m.contract("MockAerodromeRouter");

  // Configure MockAavePool
  m.call(mockAavePool, "setAssetConfig", [
    mockUSDC,
    8000, // 80% LTV
    8500, // 85% liquidation threshold
    500, // 5% supply APY (in basis points)
    1000, // 10% borrow APY (in basis points)
  ]);

  // Deploy Building Adapters with correct parameters
  const bankAdapter = m.contract("BankAdapter", [
    defiCityCore,
    mockAavePool,
    treasuryAddress,
  ]);

  const lotteryAdapter = m.contract("LotteryAdapter", [
    defiCityCore,
    mockMegapot,
    mockUSDC,
    treasuryAddress,
  ]);

  const shopAdapter = m.contract("ShopAdapter", [
    defiCityCore,
    mockAerodromeRouter,
    treasuryAddress,
  ]);

  // Deploy Morpho Vault (Mock ERC4626)
  const mockMorphoVault = m.contract("MockMorphoVault", [mockUSDC]);

  const vaultAdapter = m.contract("VaultAdapter", [
    defiCityCore,
    mockMorphoVault,
    mockUSDC,
    treasuryAddress,
  ]);

  // Deploy Pendle (Mock Router + PT + Market)
  // Maturity: 6 months from now (in seconds)
  const sixMonthsFromNow = BigInt(Math.floor(Date.now() / 1000) + 180 * 24 * 60 * 60);
  const mockPendleRouter = m.contract("MockPendleRouter", [
    mockUSDC,
    sixMonthsFromNow,
  ]);

  const stakingAdapter = m.contract("StakingAdapter", [
    defiCityCore,
    mockPendleRouter,
    mockUSDC,
    treasuryAddress,
  ]);

  // Register adapters in BuildingRegistry
  m.call(buildingRegistry, "registerAdapter", [
    "bank",
    bankAdapter,
  ], { id: "RegisterBankAdapter" });

  m.call(buildingRegistry, "registerAdapter", [
    "lottery",
    lotteryAdapter,
  ], { id: "RegisterLotteryAdapter" });

  m.call(buildingRegistry, "registerAdapter", [
    "shop",
    shopAdapter,
  ], { id: "RegisterShopAdapter" });

  m.call(buildingRegistry, "registerAdapter", [
    "vault",
    vaultAdapter,
  ], { id: "RegisterVaultAdapter" });

  m.call(buildingRegistry, "registerAdapter", [
    "staking",
    stakingAdapter,
  ], { id: "RegisterStakingAdapter" });

  return {
    // Tokens
    mockUSDC,
    mockWETH,
    mockAERO,
    // Mock Protocols
    mockAavePool,
    mockMegapot,
    mockAerodromeRouter,
    // Adapters
    bankAdapter,
    lotteryAdapter,
    shopAdapter,
    // Morpho Vault
    mockMorphoVault,
    vaultAdapter,
    // Pendle Staking
    mockPendleRouter,
    stakingAdapter,
  };
});

export default IntegrationContractsModule;
