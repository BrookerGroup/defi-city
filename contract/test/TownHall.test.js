const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Town Hall Creation", function () {
  let owner, user1, user2, treasury;
  let entryPoint, core, factory;
  let smartWallet;

  // Test constants
  const BUILDING_TYPE_TOWNHALL = "townhall";
  const GRID_X = 5;
  const GRID_Y = 5;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, treasury] = await ethers.getSigners();

    // 1. Deploy Mock EntryPoint (simplified for testing)
    const EntryPoint = await ethers.getContractFactory("MockEntryPoint");
    entryPoint = await EntryPoint.deploy();
    await entryPoint.waitForDeployment();

    // 2. Deploy DefiCityCore
    const DefiCityCore = await ethers.getContractFactory("DefiCityCore");
    core = await DefiCityCore.deploy(treasury.address);
    await core.waitForDeployment();

    // 3. Deploy WalletFactory
    const WalletFactory = await ethers.getContractFactory("WalletFactory");
    factory = await WalletFactory.deploy(
      await entryPoint.getAddress(),
      await core.getAddress()
    );
    await factory.waitForDeployment();

    console.log("✓ Contracts deployed:");
    console.log("  EntryPoint:", await entryPoint.getAddress());
    console.log("  Core:", await core.getAddress());
    console.log("  Factory:", await factory.getAddress());
  });

  describe("Wallet Creation & Registration", function () {
    it("Should create a SmartWallet and register in Core", async function () {
      // Create wallet for user1
      const tx = await factory.connect(user1).createWallet(user1.address, 0);
      const receipt = await tx.wait();

      // Get wallet address from event
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "WalletCreated"
      );
      expect(event).to.not.be.undefined;

      const walletAddress = event.args.wallet;
      console.log("  Wallet created at:", walletAddress);

      // Verify wallet is registered in factory
      const registeredWallet = await factory.walletsByOwner(user1.address);
      expect(registeredWallet).to.equal(walletAddress);

      // Verify wallet is registered in Core
      const coreWallet = await core.userSmartWallets(user1.address);
      expect(coreWallet).to.equal(walletAddress);

      // Verify user stats initialized
      const stats = await core.userStats(user1.address);
      expect(stats.cityCreatedAt).to.be.gt(0);
      expect(stats.buildingCount).to.equal(0);

      console.log("✓ Wallet registered in Core");
      console.log("  City created at:", stats.cityCreatedAt.toString());
    });

    it("Should prevent duplicate wallet registration", async function () {
      // Create first wallet
      await factory.connect(user1).createWallet(user1.address, 0);

      // Try to register again should fail
      await expect(
        core.connect(user1).registerWallet(user1.address, user1.address)
      ).to.be.revertedWithCustomError(core, "WalletAlreadyRegistered");
    });

    it("Should allow checking if wallet is deployed", async function () {
      // Check before deployment
      const deployedBefore = await factory.isWalletDeployed(user1.address, 0);
      expect(deployedBefore).to.be.false;

      // Deploy wallet
      await factory.connect(user1).createWallet(user1.address, 0);

      // Check after deployment
      const deployedAfter = await factory.isWalletDeployed(user1.address, 0);
      expect(deployedAfter).to.be.true;

      // Get wallet address
      const walletAddress = await factory.walletsByOwner(user1.address);
      console.log("✓ Wallet deployment check works");
      console.log("  Wallet address:", walletAddress);
    });
  });

  describe("Town Hall Placement", function () {
    beforeEach(async function () {
      // Create wallet for user1
      const tx = await factory.connect(user1).createWallet(user1.address, 0);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "WalletCreated"
      );
      smartWallet = await ethers.getContractAt("SmartWallet", event.args.wallet);

      console.log("  Test wallet:", await smartWallet.getAddress());
    });

    it("Should place Town Hall building", async function () {
      // Prepare Town Hall placement data
      const buildingType = BUILDING_TYPE_TOWNHALL;
      const asset = ethers.ZeroAddress; // No asset for Town Hall
      const amount = 0; // No amount for Town Hall
      const x = GRID_X;
      const y = GRID_Y;
      const metadata = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string"],
        ["First Town Hall"]
      );

      // Record building placement
      // Note: In production, this would be called by the SmartWallet after executing DeFi operations
      // For Town Hall, there are no DeFi operations, so we call directly from the wallet
      const tx = await smartWallet
        .connect(user1)
        .execute(
          await core.getAddress(),
          0,
          core.interface.encodeFunctionData("recordBuildingPlacement", [
            user1.address,
            buildingType,
            asset,
            amount,
            x,
            y,
            metadata
          ])
        );

      const receipt = await tx.wait();
      console.log("  Gas used:", receipt.gasUsed.toString());

      // Verify building was created
      const buildingId = 1; // First building
      const building = await core.buildings(buildingId);

      expect(building.id).to.equal(buildingId);
      expect(building.owner).to.equal(user1.address);
      expect(building.smartWallet).to.equal(await smartWallet.getAddress());
      expect(building.buildingType).to.equal(buildingType);
      expect(building.asset).to.equal(asset);
      expect(building.amount).to.equal(amount);
      expect(building.coordinateX).to.equal(x);
      expect(building.coordinateY).to.equal(y);
      expect(building.active).to.be.true;

      console.log("✓ Town Hall placed:");
      console.log("  Building ID:", building.id.toString());
      console.log("  Type:", building.buildingType);
      console.log("  Position: (", building.coordinateX.toString(), ",", building.coordinateY.toString(), ")");

      // Verify grid position is occupied
      const gridBuildingId = await core.gridBuildings(x, y);
      expect(gridBuildingId).to.equal(buildingId);

      // Verify user stats updated
      const stats = await core.userStats(user1.address);
      expect(stats.buildingCount).to.equal(1);

      // Verify user buildings array
      const userBuildingIds = await core.userBuildings(user1.address, 0);
      expect(userBuildingIds).to.equal(buildingId);
    });

    it("Should prevent placing building on occupied grid", async function () {
      // Place first building
      const buildingType = BUILDING_TYPE_TOWNHALL;
      const metadata = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string"],
        ["First Town Hall"]
      );

      await smartWallet
        .connect(user1)
        .execute(
          await core.getAddress(),
          0,
          core.interface.encodeFunctionData("recordBuildingPlacement", [
            user1.address,
            buildingType,
            ethers.ZeroAddress,
            0,
            GRID_X,
            GRID_Y,
            metadata
          ])
        );

      // Try to place another building at same position
      await expect(
        smartWallet
          .connect(user1)
          .execute(
            await core.getAddress(),
            0,
            core.interface.encodeFunctionData("recordBuildingPlacement", [
              user1.address,
              buildingType,
              ethers.ZeroAddress,
              0,
              GRID_X,
              GRID_Y,
              metadata
            ])
          )
      ).to.be.reverted; // GridOccupied error
    });

    it("Should allow multiple buildings at different positions", async function () {
      const buildingType = BUILDING_TYPE_TOWNHALL;
      const metadata = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string"],
        ["Town Hall"]
      );

      // Place first building at (5, 5)
      await smartWallet
        .connect(user1)
        .execute(
          await core.getAddress(),
          0,
          core.interface.encodeFunctionData("recordBuildingPlacement", [
            user1.address,
            buildingType,
            ethers.ZeroAddress,
            0,
            5,
            5,
            metadata
          ])
        );

      // Place second building at (10, 10)
      await smartWallet
        .connect(user1)
        .execute(
          await core.getAddress(),
          0,
          core.interface.encodeFunctionData("recordBuildingPlacement", [
            user1.address,
            "bank", // Different building type
            ethers.ZeroAddress,
            0,
            10,
            10,
            metadata
          ])
        );

      // Verify both buildings exist
      const building1 = await core.buildings(1);
      const building2 = await core.buildings(2);

      expect(building1.buildingType).to.equal(BUILDING_TYPE_TOWNHALL);
      expect(building2.buildingType).to.equal("bank");

      // Verify user stats
      const stats = await core.userStats(user1.address);
      expect(stats.buildingCount).to.equal(2);

      console.log("✓ Multiple buildings placed");
      console.log("  Building 1:", building1.buildingType, "at (", building1.coordinateX.toString(), ",", building1.coordinateY.toString(), ")");
      console.log("  Building 2:", building2.buildingType, "at (", building2.coordinateX.toString(), ",", building2.coordinateY.toString(), ")");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Create wallet and place a building
      const tx = await factory.connect(user1).createWallet(user1.address, 0);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "WalletCreated"
      );
      smartWallet = await ethers.getContractAt("SmartWallet", event.args.wallet);

      // Place Town Hall
      const metadata = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string"],
        ["Test Town Hall"]
      );

      await smartWallet
        .connect(user1)
        .execute(
          await core.getAddress(),
          0,
          core.interface.encodeFunctionData("recordBuildingPlacement", [
            user1.address,
            BUILDING_TYPE_TOWNHALL,
            ethers.ZeroAddress,
            0,
            GRID_X,
            GRID_Y,
            metadata
          ])
        );
    });

    it("Should get user buildings", async function () {
      const buildings = await core.getUserBuildings(user1.address);
      expect(buildings.length).to.equal(1);
      expect(buildings[0].buildingType).to.equal(BUILDING_TYPE_TOWNHALL);

      console.log("✓ User buildings retrieved:", buildings.length);
    });

    it("Should get building at grid position", async function () {
      const building = await core.getBuildingAt(GRID_X, GRID_Y);
      expect(building.id).to.equal(1);
      expect(building.buildingType).to.equal(BUILDING_TYPE_TOWNHALL);

      console.log("✓ Building at grid (", GRID_X, ",", GRID_Y, "):", building.buildingType);
    });

    it("Should get user stats", async function () {
      const stats = await core.getUserStats(user1.address);
      expect(stats.buildingCount).to.equal(1);
      expect(stats.cityCreatedAt).to.be.gt(0);

      console.log("✓ User stats:");
      console.log("  Buildings:", stats.buildingCount.toString());
      console.log("  City created:", new Date(Number(stats.cityCreatedAt) * 1000).toISOString());
    });

    it("Should check wallet existence", async function () {
      const hasWallet = await core.hasWallet(user1.address);
      expect(hasWallet).to.be.true;

      const noWallet = await core.hasWallet(user2.address);
      expect(noWallet).to.be.false;

      console.log("✓ Wallet checks passed");
    });
  });
});
