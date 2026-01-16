const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Create Town Hall (New Player Flow)", function () {
  let owner, user1, user2, treasury;
  let entryPoint, core, factory;

  // Test constants
  const GRID_X = 5;
  const GRID_Y = 5;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, treasury] = await ethers.getSigners();

    // 1. Deploy Mock EntryPoint
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

    // 4. Set factory in Core (required for Town Hall creation)
    await core.setWalletFactory(await factory.getAddress());

    console.log("\n✓ Game Contracts Deployed:");
    console.log("  EntryPoint:", await entryPoint.getAddress());
    console.log("  Core:", await core.getAddress());
    console.log("  Factory:", await factory.getAddress());
    console.log("  Factory set in Core:", await core.walletFactory());
  });

  describe("Complete Onboarding Flow", function () {
    it("Should create wallet + Town Hall in one transaction", async function () {
      console.log("\n=== New Player Onboarding ===");
      console.log("1. User connects EOA:", user1.address);

      // Check user has no wallet yet
      const hasWalletBefore = await core.hasWallet(user1.address);
      expect(hasWalletBefore).to.be.false;
      console.log("2. User has no wallet yet: ✓");

      // User clicks "Create Town Hall" - calls factory.createTownHall()
      console.log("3. User clicks 'Create Town Hall'");
      const tx = await factory.connect(user1).createTownHall(
        user1.address,
        GRID_X,
        GRID_Y
      );
      const receipt = await tx.wait();

      console.log("4. Transaction completed!");
      console.log("   Gas used:", receipt.gasUsed.toString());

      // Verify wallet was created
      const hasWalletAfter = await core.hasWallet(user1.address);
      expect(hasWalletAfter).to.be.true;

      const walletAddress = await core.userSmartWallets(user1.address);
      console.log("5. SmartWallet created:", walletAddress);

      // Verify Town Hall was created
      const buildingId = 1;
      const building = await core.buildings(buildingId);

      expect(building.id).to.equal(buildingId);
      expect(building.owner).to.equal(user1.address);
      expect(building.smartWallet).to.equal(walletAddress);
      expect(building.buildingType).to.equal("townhall");
      expect(building.coordinateX).to.equal(GRID_X);
      expect(building.coordinateY).to.equal(GRID_Y);
      expect(building.active).to.be.true;

      console.log("6. Town Hall created:");
      console.log("   Building ID:", building.id.toString());
      console.log("   Position: (", building.coordinateX.toString(), ",", building.coordinateY.toString(), ")");
      console.log("   Type:", building.buildingType);

      // Verify user stats
      const stats = await core.userStats(user1.address);
      expect(stats.buildingCount).to.equal(1);
      console.log("7. User stats:");
      console.log("   Buildings:", stats.buildingCount.toString());
      console.log("   City created:", new Date(Number(stats.cityCreatedAt) * 1000).toISOString());

      console.log("\n✓ Onboarding Complete!");
    });

    it("Should prevent creating multiple Town Halls", async function () {
      // Create first Town Hall
      await factory.connect(user1).createTownHall(
        user1.address,
        GRID_X,
        GRID_Y
      );

      // Try to create second Town Hall should fail
      await expect(
        factory.connect(user1).createTownHall(
          user1.address,
          10,
          10
        )
      ).to.be.revertedWithCustomError(factory, "WalletAlreadyExists");

      console.log("✓ Prevented multiple Town Halls");
    });

    it("Should prevent Town Hall on occupied grid", async function () {
      // User1 creates Town Hall at (5, 5)
      await factory.connect(user1).createTownHall(
        user1.address,
        GRID_X,
        GRID_Y
      );

      // User2 tries to create Town Hall at same position
      await expect(
        factory.connect(user2).createTownHall(
          user2.address,
          GRID_X,
          GRID_Y
        )
      ).to.be.reverted; // GridOccupied error

      console.log("✓ Grid collision prevented");
    });

    it("Should allow multiple users to create Town Halls", async function () {
      // User1 creates Town Hall
      await factory.connect(user1).createTownHall(
        user1.address,
        5,
        5
      );

      // User2 creates Town Hall at different position
      await factory.connect(user2).createTownHall(
        user2.address,
        10,
        10
      );

      // Verify both users have wallets
      const wallet1 = await core.userSmartWallets(user1.address);
      const wallet2 = await core.userSmartWallets(user2.address);

      expect(wallet1).to.not.equal(ethers.ZeroAddress);
      expect(wallet2).to.not.equal(ethers.ZeroAddress);
      expect(wallet1).to.not.equal(wallet2);

      // Verify both have Town Halls
      const building1 = await core.buildings(1);
      const building2 = await core.buildings(2);

      expect(building1.owner).to.equal(user1.address);
      expect(building2.owner).to.equal(user2.address);

      console.log("✓ Multiple users onboarded:");
      console.log("  User1 wallet:", wallet1);
      console.log("  User2 wallet:", wallet2);
      console.log("  User1 Town Hall: (", building1.coordinateX.toString(), ",", building1.coordinateY.toString(), ")");
      console.log("  User2 Town Hall: (", building2.coordinateX.toString(), ",", building2.coordinateY.toString(), ")");
    });
  });

  describe("View Functions After Onboarding", function () {
    beforeEach(async function () {
      // Create Town Hall for user1
      await factory.connect(user1).createTownHall(
        user1.address,
        GRID_X,
        GRID_Y
      );
    });

    it("Should get user buildings", async function () {
      const buildings = await core.getUserBuildings(user1.address);
      expect(buildings.length).to.equal(1);
      expect(buildings[0].buildingType).to.equal("townhall");

      console.log("✓ User buildings:", buildings.length);
    });

    it("Should get building at grid position", async function () {
      const building = await core.getBuildingAt(GRID_X, GRID_Y);
      expect(building.buildingType).to.equal("townhall");
      expect(building.owner).to.equal(user1.address);

      console.log("✓ Building at (", GRID_X, ",", GRID_Y, "):", building.buildingType);
    });

    it("Should check wallet existence", async function () {
      const hasWallet = await core.hasWallet(user1.address);
      expect(hasWallet).to.be.true;

      console.log("✓ User has wallet: true");
    });
  });

  describe("Gas Estimation", function () {
    it("Should measure gas for complete onboarding", async function () {
      const tx = await factory.connect(user1).createTownHall(
        user1.address,
        GRID_X,
        GRID_Y
      );
      const receipt = await tx.wait();

      console.log("\n=== Gas Report ===");
      console.log("Complete onboarding (Wallet + Town Hall):");
      console.log("  Gas used:", receipt.gasUsed.toString());
      console.log("  Estimated cost @ 1 gwei:", ethers.formatEther(receipt.gasUsed * 1000000000n), "ETH");
      console.log("  Estimated cost @ 0.001 gwei (Base):", ethers.formatEther(receipt.gasUsed * 1000000n), "ETH");
    });
  });
});
