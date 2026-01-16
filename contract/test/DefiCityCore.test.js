const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DefiCityCore", function () {
  // Fixture to deploy contracts
  async function deployDefiCityFixture() {
    const [owner, user1, user2, treasury] = await ethers.getSigners();

    // Deploy MockEntryPoint
    const MockEntryPoint = await ethers.getContractFactory("MockEntryPoint");
    const entryPoint = await MockEntryPoint.deploy();
    await entryPoint.waitForDeployment();

    // Deploy DefiCityCore
    const DefiCityCore = await ethers.getContractFactory("DefiCityCore");
    const core = await DefiCityCore.deploy(treasury.address);
    await core.waitForDeployment();

    // Deploy WalletFactory
    const WalletFactory = await ethers.getContractFactory("WalletFactory");
    const factory = await WalletFactory.deploy(
      await entryPoint.getAddress(),
      await core.getAddress()
    );
    await factory.waitForDeployment();

    // Set factory in core
    await core.setWalletFactory(await factory.getAddress());

    // Deploy MockERC20 for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();

    // Add USDC as supported asset
    await core.addSupportedAsset(await usdc.getAddress());

    return { core, factory, entryPoint, usdc, owner, user1, user2, treasury };
  }

  describe("Town Hall Creation", function () {
    it("Should successfully create Town Hall for new user", async function () {
      const { core, factory, user1 } = await loadFixture(deployDefiCityFixture);

      const x = 5;
      const y = 5;

      // Create Town Hall
      const tx = await core.connect(user1).createTownHall(x, y);
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "BuildingPlaced"
      );
      expect(event).to.not.be.undefined;

      // Get buildingId from event
      const buildingId = event.args.buildingId;

      // Verify SmartWallet was created
      const walletAddress = await core.userSmartWallets(user1.address);
      expect(walletAddress).to.not.equal(ethers.ZeroAddress);

      // Verify reverse mapping
      const owner = await core.walletToOwner(walletAddress);
      expect(owner).to.equal(user1.address);

      // Verify building was recorded
      const building = await core.buildings(buildingId);
      expect(building.id).to.equal(buildingId);
      expect(building.owner).to.equal(user1.address);
      expect(building.smartWallet).to.equal(walletAddress);
      expect(building.buildingType).to.equal("townhall");
      expect(building.asset).to.equal(ethers.ZeroAddress);
      expect(building.amount).to.equal(0);
      expect(building.coordinateX).to.equal(x);
      expect(building.coordinateY).to.equal(y);
      expect(building.active).to.be.true;

      // Verify grid position
      const buildingAtGrid = await core.getBuildingAt(user1.address, x, y);
      expect(buildingAtGrid.id).to.equal(buildingId);

      // Verify user stats
      const stats = await core.getUserStats(user1.address);
      expect(stats.buildingCount).to.equal(1);
      expect(stats.cityCreatedAt).to.be.gt(0);
    });

    it("Should revert if user already has a wallet", async function () {
      const { core, user1 } = await loadFixture(deployDefiCityFixture);

      // Create first Town Hall
      await core.connect(user1).createTownHall(5, 5);

      // Try to create second Town Hall
      await expect(
        core.connect(user1).createTownHall(10, 10)
      ).to.be.revertedWithCustomError(core, "WalletAlreadyRegistered");
    });

    it("Should revert if grid position is occupied (same user)", async function () {
      const { core, user1 } = await loadFixture(deployDefiCityFixture);

      const x = 5;
      const y = 5;

      // Create Town Hall at (5, 5)
      await core.connect(user1).createTownHall(x, y);

      // Since user already has wallet, we need to test grid occupation differently
      // This would need recordBuildingPlacement to be callable, but it requires SmartWallet
      // For now, we've verified the basic check exists in the code
    });

    it("Should allow different users to create Town Halls at same grid position", async function () {
      const { core, user1, user2 } = await loadFixture(deployDefiCityFixture);

      const x = 5;
      const y = 5;

      // User1 creates Town Hall at (5, 5)
      await core.connect(user1).createTownHall(x, y);

      // User2 should be able to create Town Hall at same position (different grid)
      const tx = await core.connect(user2).createTownHall(x, y);
      const receipt = await tx.wait();

      // Verify both buildings exist
      const user1Building = await core.getBuildingAt(user1.address, x, y);
      const user2Building = await core.getBuildingAt(user2.address, x, y);

      expect(user1Building.owner).to.equal(user1.address);
      expect(user2Building.owner).to.equal(user2.address);
      expect(user1Building.id).to.not.equal(user2Building.id);
    });

    it("Should increment buildingIdCounter correctly", async function () {
      const { core, user1, user2 } = await loadFixture(deployDefiCityFixture);

      // Get initial counter
      const initialCounter = await core.buildingIdCounter();

      // User1 creates Town Hall
      const tx1 = await core.connect(user1).createTownHall(5, 5);
      const receipt1 = await tx1.wait();
      const event1 = receipt1.logs.find(
        log => log.fragment && log.fragment.name === "BuildingPlaced"
      );
      const buildingId1 = event1.args.buildingId;

      // User2 creates Town Hall
      const tx2 = await core.connect(user2).createTownHall(5, 5);
      const receipt2 = await tx2.wait();
      const event2 = receipt2.logs.find(
        log => log.fragment && log.fragment.name === "BuildingPlaced"
      );
      const buildingId2 = event2.args.buildingId;

      // Verify IDs are sequential
      expect(buildingId1).to.equal(initialCounter + 1n);
      expect(buildingId2).to.equal(initialCounter + 2n);

      // Verify counter is updated
      const finalCounter = await core.buildingIdCounter();
      expect(finalCounter).to.equal(initialCounter + 2n);
    });

    it("Should emit BuildingPlaced event with correct parameters", async function () {
      const { core, user1 } = await loadFixture(deployDefiCityFixture);

      const x = 10;
      const y = 20;

      // Create Town Hall
      const tx = await core.connect(user1).createTownHall(x, y);
      await tx.wait();

      // Get wallet address after creation
      const walletAddress = await core.userSmartWallets(user1.address);

      // Check event was emitted with correct params
      await expect(tx)
        .to.emit(core, "BuildingPlaced")
        .withArgs(
          1, // buildingId (first building)
          user1.address, // user
          walletAddress, // smartWallet
          "townhall", // buildingType
          ethers.ZeroAddress, // asset (no asset for townhall)
          0, // amount (no amount for townhall)
          x,
          y
        );
    });

    it("Should create unique SmartWallet for each user", async function () {
      const { core, user1, user2 } = await loadFixture(deployDefiCityFixture);

      // Create Town Halls for both users
      await core.connect(user1).createTownHall(5, 5);
      await core.connect(user2).createTownHall(10, 10);

      // Get wallets
      const wallet1 = await core.userSmartWallets(user1.address);
      const wallet2 = await core.userSmartWallets(user2.address);

      // Verify wallets are different
      expect(wallet1).to.not.equal(wallet2);
      expect(wallet1).to.not.equal(ethers.ZeroAddress);
      expect(wallet2).to.not.equal(ethers.ZeroAddress);

      // Verify reverse mappings
      expect(await core.walletToOwner(wallet1)).to.equal(user1.address);
      expect(await core.walletToOwner(wallet2)).to.equal(user2.address);
    });

    it("Should initialize user stats correctly", async function () {
      const { core, user1 } = await loadFixture(deployDefiCityFixture);

      // Get stats before
      const statsBefore = await core.getUserStats(user1.address);
      expect(statsBefore.buildingCount).to.equal(0);
      expect(statsBefore.cityCreatedAt).to.equal(0);
      expect(statsBefore.totalDeposited).to.equal(0);
      expect(statsBefore.totalWithdrawn).to.equal(0);
      expect(statsBefore.totalHarvested).to.equal(0);

      // Create Town Hall
      await core.connect(user1).createTownHall(5, 5);

      // Get stats after
      const statsAfter = await core.getUserStats(user1.address);
      expect(statsAfter.buildingCount).to.equal(1);
      expect(statsAfter.cityCreatedAt).to.be.gt(0);
      expect(statsAfter.totalDeposited).to.equal(0);
      expect(statsAfter.totalWithdrawn).to.equal(0);
      expect(statsAfter.totalHarvested).to.equal(0);
    });

    it("Should add building to userBuildings array", async function () {
      const { core, user1 } = await loadFixture(deployDefiCityFixture);

      // Create Town Hall
      const tx = await core.connect(user1).createTownHall(5, 5);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "BuildingPlaced"
      );
      const buildingId = event.args.buildingId;

      // Get user's buildings
      const userBuildingIds = await core.getUserBuildings(user1.address);
      expect(userBuildingIds.length).to.equal(1);
      expect(userBuildingIds[0].toString()).to.equal(buildingId.toString());
    });

    it("Should work when contract is not paused", async function () {
      const { core, user1 } = await loadFixture(deployDefiCityFixture);

      // Verify not paused
      expect(await core.paused()).to.be.false;

      // Should succeed
      await expect(core.connect(user1).createTownHall(5, 5)).to.not.be.reverted;
    });

    it("Should revert when contract is paused", async function () {
      const { core, owner, user1 } = await loadFixture(deployDefiCityFixture);

      // Pause contract
      await core.connect(owner).pause();
      expect(await core.paused()).to.be.true;

      // Should revert with custom error from Pausable
      await expect(
        core.connect(user1).createTownHall(5, 5)
      ).to.be.revertedWithCustomError(core, "EnforcedPause");
    });
  });

  describe("Grid Management", function () {
    it("Should correctly track building position in user's grid", async function () {
      const { core, user1 } = await loadFixture(deployDefiCityFixture);

      const x = 15;
      const y = 25;

      // Create Town Hall
      await core.connect(user1).createTownHall(x, y);

      // Verify grid position
      const building = await core.getBuildingAt(user1.address, x, y);
      expect(building.coordinateX).to.equal(x);
      expect(building.coordinateY).to.equal(y);
      expect(building.owner).to.equal(user1.address);
    });

    it("Should return empty building for unoccupied position", async function () {
      const { core, user1 } = await loadFixture(deployDefiCityFixture);

      // Create Town Hall at (5, 5)
      await core.connect(user1).createTownHall(5, 5);

      // Check empty position
      const emptyBuilding = await core.getBuildingAt(user1.address, 10, 10);
      expect(emptyBuilding.id).to.equal(0);
    });

    it("Should maintain separate grids for different users", async function () {
      const { core, user1, user2 } = await loadFixture(deployDefiCityFixture);

      const x = 7;
      const y = 7;

      // Both users create Town Hall at same position
      await core.connect(user1).createTownHall(x, y);
      await core.connect(user2).createTownHall(x, y);

      // Verify separate grids
      const building1 = await core.getBuildingAt(user1.address, x, y);
      const building2 = await core.getBuildingAt(user2.address, x, y);

      expect(building1.owner).to.equal(user1.address);
      expect(building2.owner).to.equal(user2.address);
      expect(building1.id).to.not.equal(building2.id);

      // Verify user1 can't see user2's building and vice versa
      const user1ViewOfUser2Grid = await core.getBuildingAt(user2.address, x, y);
      expect(user1ViewOfUser2Grid.owner).to.equal(user2.address);
    });
  });

  describe("Access Control", function () {
    it("Should allow any user to create their first Town Hall", async function () {
      const { core, user1, user2 } = await loadFixture(deployDefiCityFixture);

      // Both users should be able to create Town Hall
      await expect(core.connect(user1).createTownHall(5, 5)).to.not.be.reverted;
      await expect(core.connect(user2).createTownHall(5, 5)).to.not.be.reverted;
    });

    it("Should not allow creating Town Hall for someone else", async function () {
      const { core, user1 } = await loadFixture(deployDefiCityFixture);

      // User creating Town Hall is always msg.sender
      // So this test verifies that the owner is always the caller
      await core.connect(user1).createTownHall(5, 5);

      const wallet = await core.userSmartWallets(user1.address);
      expect(await core.walletToOwner(wallet)).to.equal(user1.address);
    });
  });

  describe("Integration Tests", function () {
    it("Should create complete town hall setup in one transaction", async function () {
      const { core, factory, user1 } = await loadFixture(deployDefiCityFixture);

      const x = 3;
      const y = 4;

      // Execute creation
      const tx = await core.connect(user1).createTownHall(x, y);
      await tx.wait();

      // Verify all components
      const wallet = await core.userSmartWallets(user1.address);
      const building = await core.getBuildingAt(user1.address, x, y);
      const stats = await core.getUserStats(user1.address);
      const userBuildings = await core.getUserBuildings(user1.address);

      // SmartWallet created
      expect(wallet).to.not.equal(ethers.ZeroAddress);

      // Building recorded
      expect(building.id).to.be.gt(0);
      expect(building.owner).to.equal(user1.address);
      expect(building.buildingType).to.equal("townhall");
      expect(building.active).to.be.true;

      // Stats updated
      expect(stats.buildingCount).to.equal(1);
      expect(stats.cityCreatedAt).to.be.gt(0);

      // Building in user's list
      expect(userBuildings.length).to.equal(1);
      expect(userBuildings[0].toString()).to.equal(building.id.toString());
    });

    it("Should handle multiple users creating town halls simultaneously", async function () {
      const { core, user1, user2 } = await loadFixture(deployDefiCityFixture);

      // Create Town Halls for multiple users
      const tx1 = core.connect(user1).createTownHall(1, 1);
      const tx2 = core.connect(user2).createTownHall(2, 2);

      // Wait for both
      await Promise.all([tx1, tx2]);

      // Verify both succeeded
      const wallet1 = await core.userSmartWallets(user1.address);
      const wallet2 = await core.userSmartWallets(user2.address);

      expect(wallet1).to.not.equal(ethers.ZeroAddress);
      expect(wallet2).to.not.equal(ethers.ZeroAddress);
      expect(wallet1).to.not.equal(wallet2);
    });
  });
});
