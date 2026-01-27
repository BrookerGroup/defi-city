import { expect } from "chai";
import hre from "hardhat";

describe("BuildingRegistry", function () {
  let ethers;

  before(async function () {
    ({ ethers } = await hre.network.connect());
  });

  // Fixture to deploy contracts
  async function deployBuildingRegistryFixture() {
    const [owner, adapterManager, pauser, user1, treasury] = await ethers.getSigners();

    // Deploy BuildingRegistry
    const BuildingRegistry = await ethers.getContractFactory("BuildingRegistry");
    const registry = await BuildingRegistry.deploy();
    await registry.waitForDeployment();

    // Deploy MockEntryPoint
    const MockEntryPoint = await ethers.getContractFactory("MockEntryPoint");
    const entryPoint = await MockEntryPoint.deploy();
    await entryPoint.waitForDeployment();

    // Deploy DefiCityCore
    const DefiCityCore = await ethers.getContractFactory("DefiCityCore");
    const core = await DefiCityCore.deploy(treasury.address);
    await core.waitForDeployment();

    // Deploy MockAavePool
    const MockAavePool = await ethers.getContractFactory("MockAavePool");
    const aavePool = await MockAavePool.deploy();
    await aavePool.waitForDeployment();

    // Deploy BankAdapter
    const BankAdapter = await ethers.getContractFactory("BankAdapter");
    const bankAdapter = await BankAdapter.deploy(
      await core.getAddress(),
      await aavePool.getAddress(),
      treasury.address
    );
    await bankAdapter.waitForDeployment();

    // Get role hashes
    const ADAPTER_MANAGER_ROLE = await registry.ADAPTER_MANAGER_ROLE();
    const PAUSER_ROLE = await registry.PAUSER_ROLE();
    const DEFAULT_ADMIN_ROLE = await registry.DEFAULT_ADMIN_ROLE();

    return {
      registry,
      bankAdapter,
      core,
      aavePool,
      owner,
      adapterManager,
      pauser,
      user1,
      treasury,
      ADAPTER_MANAGER_ROLE,
      PAUSER_ROLE,
      DEFAULT_ADMIN_ROLE
    };
  }

  describe("Deployment", function () {
    it("Should grant all roles to deployer", async function () {
      const { registry, owner, ADAPTER_MANAGER_ROLE, PAUSER_ROLE, DEFAULT_ADMIN_ROLE } =
        await deployBuildingRegistryFixture();

      expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await registry.hasRole(ADAPTER_MANAGER_ROLE, owner.address)).to.be.true;
      expect(await registry.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
    });

    it("Should not grant roles to other addresses initially", async function () {
      const { registry, user1, ADAPTER_MANAGER_ROLE, PAUSER_ROLE } =
        await deployBuildingRegistryFixture();

      expect(await registry.hasRole(ADAPTER_MANAGER_ROLE, user1.address)).to.be.false;
      expect(await registry.hasRole(PAUSER_ROLE, user1.address)).to.be.false;
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to grant ADAPTER_MANAGER_ROLE", async function () {
      const { registry, owner, adapterManager, ADAPTER_MANAGER_ROLE } =
        await deployBuildingRegistryFixture();

      await registry.connect(owner).grantRole(ADAPTER_MANAGER_ROLE, adapterManager.address);

      expect(await registry.hasRole(ADAPTER_MANAGER_ROLE, adapterManager.address)).to.be.true;
    });

    it("Should allow admin to grant PAUSER_ROLE", async function () {
      const { registry, owner, pauser, PAUSER_ROLE } =
        await deployBuildingRegistryFixture();

      await registry.connect(owner).grantRole(PAUSER_ROLE, pauser.address);

      expect(await registry.hasRole(PAUSER_ROLE, pauser.address)).to.be.true;
    });

    it("Should allow admin to revoke roles", async function () {
      const { registry, owner, adapterManager, ADAPTER_MANAGER_ROLE } =
        await deployBuildingRegistryFixture();

      await registry.connect(owner).grantRole(ADAPTER_MANAGER_ROLE, adapterManager.address);
      expect(await registry.hasRole(ADAPTER_MANAGER_ROLE, adapterManager.address)).to.be.true;

      await registry.connect(owner).revokeRole(ADAPTER_MANAGER_ROLE, adapterManager.address);
      expect(await registry.hasRole(ADAPTER_MANAGER_ROLE, adapterManager.address)).to.be.false;
    });

    it("Should not allow non-admin to grant roles", async function () {
      const { registry, user1, adapterManager, ADAPTER_MANAGER_ROLE } =
        await deployBuildingRegistryFixture();

      await expect(
        registry.connect(user1).grantRole(ADAPTER_MANAGER_ROLE, adapterManager.address)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Adapter Registration - Access Control", function () {
    it("Should allow ADAPTER_MANAGER_ROLE to register adapter", async function () {
      const { registry, bankAdapter, owner } =
        await deployBuildingRegistryFixture();

      await registry.connect(owner).registerAdapter("bank", await bankAdapter.getAddress());

      expect(await registry.isRegistered("bank")).to.be.true;
      expect(await registry.getAdapter("bank")).to.equal(await bankAdapter.getAddress());
    });

    it("Should not allow non-ADAPTER_MANAGER_ROLE to register adapter", async function () {
      const { registry, bankAdapter, user1 } =
        await deployBuildingRegistryFixture();

      await expect(
        registry.connect(user1).registerAdapter("bank", await bankAdapter.getAddress())
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("Should allow delegated ADAPTER_MANAGER_ROLE to register adapter", async function () {
      const { registry, bankAdapter, owner, adapterManager, ADAPTER_MANAGER_ROLE } =
        await deployBuildingRegistryFixture();

      // Grant role to adapterManager
      await registry.connect(owner).grantRole(ADAPTER_MANAGER_ROLE, adapterManager.address);

      // adapterManager should be able to register
      await registry.connect(adapterManager).registerAdapter("bank", await bankAdapter.getAddress());

      expect(await registry.isRegistered("bank")).to.be.true;
    });
  });

  describe("Adapter Upgrade - Access Control", function () {
    it("Should allow ADAPTER_MANAGER_ROLE to upgrade adapter", async function () {
      const { registry, bankAdapter, owner, core, aavePool, treasury } =
        await deployBuildingRegistryFixture();

      // Register initial adapter
      await registry.connect(owner).registerAdapter("bank", await bankAdapter.getAddress());

      // Deploy new adapter version
      const BankAdapter = await ethers.getContractFactory("BankAdapter");
      const newBankAdapter = await BankAdapter.deploy(
        await core.getAddress(),
        await aavePool.getAddress(),
        treasury.address
      );
      await newBankAdapter.waitForDeployment();

      // Upgrade
      await registry.connect(owner).upgradeAdapter("bank", await newBankAdapter.getAddress());

      expect(await registry.getAdapter("bank")).to.equal(await newBankAdapter.getAddress());
    });

    it("Should not allow non-ADAPTER_MANAGER_ROLE to upgrade adapter", async function () {
      const { registry, bankAdapter, owner, user1, core, aavePool, treasury } =
        await deployBuildingRegistryFixture();

      // Register initial adapter
      await registry.connect(owner).registerAdapter("bank", await bankAdapter.getAddress());

      // Deploy new adapter
      const BankAdapter = await ethers.getContractFactory("BankAdapter");
      const newBankAdapter = await BankAdapter.deploy(
        await core.getAddress(),
        await aavePool.getAddress(),
        treasury.address
      );
      await newBankAdapter.waitForDeployment();

      // Try to upgrade with non-manager
      await expect(
        registry.connect(user1).upgradeAdapter("bank", await newBankAdapter.getAddress())
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Adapter Removal - Access Control", function () {
    it("Should allow ADAPTER_MANAGER_ROLE to remove adapter", async function () {
      const { registry, bankAdapter, owner } =
        await deployBuildingRegistryFixture();

      // Register adapter
      await registry.connect(owner).registerAdapter("bank", await bankAdapter.getAddress());
      expect(await registry.isRegistered("bank")).to.be.true;

      // Remove
      await registry.connect(owner).removeAdapter("bank");

      expect(await registry.isRegistered("bank")).to.be.false;
    });

    it("Should not allow non-ADAPTER_MANAGER_ROLE to remove adapter", async function () {
      const { registry, bankAdapter, owner, user1 } =
        await deployBuildingRegistryFixture();

      // Register adapter
      await registry.connect(owner).registerAdapter("bank", await bankAdapter.getAddress());

      // Try to remove with non-manager
      await expect(
        registry.connect(user1).removeAdapter("bank")
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow PAUSER_ROLE to pause", async function () {
      const { registry, owner } =
        await deployBuildingRegistryFixture();

      await registry.connect(owner).pause();
      expect(await registry.paused()).to.be.true;
    });

    it("Should allow PAUSER_ROLE to unpause", async function () {
      const { registry, owner } =
        await deployBuildingRegistryFixture();

      await registry.connect(owner).pause();
      expect(await registry.paused()).to.be.true;

      await registry.connect(owner).unpause();
      expect(await registry.paused()).to.be.false;
    });

    it("Should not allow non-PAUSER_ROLE to pause", async function () {
      const { registry, user1 } =
        await deployBuildingRegistryFixture();

      await expect(registry.connect(user1).pause()).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow non-PAUSER_ROLE to unpause", async function () {
      const { registry, owner, user1 } =
        await deployBuildingRegistryFixture();

      await registry.connect(owner).pause();

      await expect(registry.connect(user1).unpause()).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("Should allow delegated PAUSER_ROLE to pause", async function () {
      const { registry, owner, pauser, PAUSER_ROLE } =
        await deployBuildingRegistryFixture();

      // Grant role
      await registry.connect(owner).grantRole(PAUSER_ROLE, pauser.address);

      // Pauser should be able to pause
      await registry.connect(pauser).pause();
      expect(await registry.paused()).to.be.true;
    });
  });

  describe("Prepare Functions When Paused", function () {
    it("Should revert preparePlace when paused", async function () {
      const { registry, bankAdapter, owner, user1 } =
        await deployBuildingRegistryFixture();

      // Register adapter
      await registry.connect(owner).registerAdapter("bank", await bankAdapter.getAddress());

      // Pause
      await registry.connect(owner).pause();

      // Try to call preparePlace
      const params = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "bool", "address", "uint256"],
        [ethers.ZeroAddress, 1000, 0, 0, false, ethers.ZeroAddress, 0]
      );

      await expect(
        registry.preparePlace("bank", user1.address, user1.address, params)
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");
    });

    it("Should revert prepareHarvest when paused", async function () {
      const { registry, bankAdapter, owner, user1 } =
        await deployBuildingRegistryFixture();

      // Register adapter
      await registry.connect(owner).registerAdapter("bank", await bankAdapter.getAddress());

      // Pause
      await registry.connect(owner).pause();

      // Try to call prepareHarvest
      const params = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [ethers.ZeroAddress, 1000]
      );

      await expect(
        registry.prepareHarvest("bank", user1.address, user1.address, 1, params)
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");
    });

    it("Should revert prepareDemolish when paused", async function () {
      const { registry, bankAdapter, owner, user1 } =
        await deployBuildingRegistryFixture();

      // Register adapter
      await registry.connect(owner).registerAdapter("bank", await bankAdapter.getAddress());

      // Pause
      await registry.connect(owner).pause();

      // Try to call prepareDemolish
      const params = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [ethers.ZeroAddress]
      );

      await expect(
        registry.prepareDemolish("bank", user1.address, user1.address, 1, params)
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");
    });

    it("Should allow prepare functions when not paused", async function () {
      const { registry, bankAdapter, owner, user1 } =
        await deployBuildingRegistryFixture();

      // Register adapter
      await registry.connect(owner).registerAdapter("bank", await bankAdapter.getAddress());

      // Prepare functions should work
      const params = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "bool", "address", "uint256"],
        [ethers.ZeroAddress, 1000, 0, 0, false, ethers.ZeroAddress, 0]
      );

      await expect(
        registry.preparePlace("bank", user1.address, user1.address, params)
      );
    });

    it("Should allow prepare functions after unpause", async function () {
      const { registry, bankAdapter, owner, user1 } =
        await deployBuildingRegistryFixture();

      // Register adapter
      await registry.connect(owner).registerAdapter("bank", await bankAdapter.getAddress());

      // Pause and unpause
      await registry.connect(owner).pause();
      await registry.connect(owner).unpause();

      // Prepare functions should work
      const params = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "bool", "address", "uint256"],
        [ethers.ZeroAddress, 1000, 0, 0, false, ethers.ZeroAddress, 0]
      );

      await expect(
        registry.preparePlace("bank", user1.address, user1.address, params)
      );
    });
  });

  describe("View Functions - Always Accessible", function () {
    it("Should allow anyone to call getAdapter", async function () {
      const { registry, bankAdapter, owner, user1 } =
        await deployBuildingRegistryFixture();

      await registry.connect(owner).registerAdapter("bank", await bankAdapter.getAddress());

      expect(await registry.connect(user1).getAdapter("bank")).to.equal(
        await bankAdapter.getAddress()
      );
    });

    it("Should allow anyone to call getAllBuildingTypes", async function () {
      const { registry, bankAdapter, owner, user1 } =
        await deployBuildingRegistryFixture();

      await registry.connect(owner).registerAdapter("bank", await bankAdapter.getAddress());

      const types = await registry.connect(user1).getAllBuildingTypes();
      expect(types).to.have.lengthOf(1);
      expect(types[0]).to.equal("bank");
    });

    it("Should allow anyone to call isBuildingTypeRegistered", async function () {
      const { registry, bankAdapter, owner, user1 } =
        await deployBuildingRegistryFixture();

      await registry.connect(owner).registerAdapter("bank", await bankAdapter.getAddress());

      expect(await registry.connect(user1).isBuildingTypeRegistered("bank")).to.be.true;
      expect(await registry.connect(user1).isBuildingTypeRegistered("shop")).to.be.false;
    });
  });
});
