import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Core Contracts Deployment Module
 *
 * Deploys the core contracts for DefiCity:
 * - BuildingRegistry: Manages building type registrations
 * - DefiCityCore: Main game logic contract
 * - WalletFactory: Creates SmartWallets for users
 *
 * Uses official EntryPoint v0.6 for ERC-4337 Account Abstraction
 */
const CoreContractsModule = buildModule("CoreContracts", (m) => {
  // Parameters - Use account 0 as default treasury for local deployments
  const entryPointAddress = m.getParameter("entryPoint", "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789");
  const treasuryAddress = m.getParameter("treasury", m.getAccount(0));

  // Deploy BuildingRegistry
  const buildingRegistry = m.contract("BuildingRegistry");

  // Deploy DefiCityCore
  const defiCityCore = m.contract("DefiCityCore", [treasuryAddress]);

  // Deploy WalletFactory
  const walletFactory = m.contract("WalletFactory", [
    entryPointAddress,
    defiCityCore,
  ]);

  // Set WalletFactory in DefiCityCore
  m.call(defiCityCore, "setWalletFactory", [walletFactory]);

  return {
    buildingRegistry,
    defiCityCore,
    walletFactory,
  };
});

export default CoreContractsModule;
