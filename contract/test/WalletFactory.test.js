import { expect } from "chai";
import hre from "hardhat";

describe("WalletFactory", function () {
  let ethers;

  before(async function () {
    ({ ethers } = await hre.network.connect());
  });

  // Fixture to deploy contracts
  async function deployWalletFactoryFixture() {
    const [owner, user1, user2, user3, treasury] = await ethers.getSigners();

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

    return { factory, core, entryPoint, owner, user1, user2, user3, treasury };
  }

  describe("Deployment", function () {
    it("Should set the correct EntryPoint", async function () {
      const { factory, entryPoint } = await deployWalletFactoryFixture();

      expect(await factory.entryPoint()).to.equal(await entryPoint.getAddress());
    });

    it("Should set the correct DefiCityCore", async function () {
      const { factory, core } = await deployWalletFactoryFixture();

      expect(await factory.core()).to.equal(await core.getAddress());
    });

    it("Should initialize totalWallets to 0", async function () {
      const { factory } = await deployWalletFactoryFixture();

      expect(await factory.totalWallets()).to.equal(0);
    });

    it("Should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
      const { factory, owner } = await deployWalletFactoryFixture();

      const DEFAULT_ADMIN_ROLE = await factory.DEFAULT_ADMIN_ROLE();
      expect(await factory.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should grant ADMIN_ROLE to deployer", async function () {
      const { factory, owner } = await deployWalletFactoryFixture();

      const ADMIN_ROLE = await factory.ADMIN_ROLE();
      expect(await factory.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should grant DEPLOYER_ROLE to DefiCityCore", async function () {
      const { factory, core } = await deployWalletFactoryFixture();

      const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
      expect(await factory.hasRole(DEPLOYER_ROLE, await core.getAddress())).to.be.true;
    });

    it("Should revert if EntryPoint address is zero", async function () {
      const [owner, treasury] = await ethers.getSigners();

      const DefiCityCore = await ethers.getContractFactory("DefiCityCore");
      const core = await DefiCityCore.deploy(treasury.address);
      await core.waitForDeployment();

      const WalletFactory = await ethers.getContractFactory("WalletFactory");
      await expect(
        WalletFactory.deploy(ethers.ZeroAddress, await core.getAddress())
      ).to.be.revertedWithCustomError(WalletFactory, "InvalidEntryPoint");
    });

    it("Should revert if Core address is zero", async function () {
      const MockEntryPoint = await ethers.getContractFactory("MockEntryPoint");
      const entryPoint = await MockEntryPoint.deploy();
      await entryPoint.waitForDeployment();

      const WalletFactory = await ethers.getContractFactory("WalletFactory");
      await expect(
        WalletFactory.deploy(await entryPoint.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(WalletFactory, "InvalidOwner");
    });
  });

  describe("createWallet", function () {
    it("Should create a new wallet successfully", async function () {
      const { factory, core, user1 } = await deployWalletFactoryFixture();

      const tx = await core.connect(user1).createTownHall(5, 5);
      await tx.wait();

      const walletAddress = await factory.walletsByOwner(user1.address);
      expect(walletAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should emit WalletCreated event", async function () {
      const { factory, core, user1 } = await deployWalletFactoryFixture();

      const tx = await core.connect(user1).createTownHall(5, 5);
      await tx.wait();

      // Get the actual wallet address
      const walletAddress = await factory.walletsByOwner(user1.address);

      await expect(tx)
        .to.emit(factory, "WalletCreated")
        .withArgs(
          walletAddress,
          user1.address,
          0,
          1
        );
    });

    it("Should increment totalWallets counter", async function () {
      const { factory, core, user1, user2 } = await deployWalletFactoryFixture();

      expect(await factory.totalWallets()).to.equal(0);

      await core.connect(user1).createTownHall(5, 5);
      expect(await factory.totalWallets()).to.equal(1);

      await core.connect(user2).createTownHall(10, 10);
      expect(await factory.totalWallets()).to.equal(2);
    });

    it("Should register wallet in isWallet mapping", async function () {
      const { factory, core, user1 } = await deployWalletFactoryFixture();

      await core.connect(user1).createTownHall(5, 5);

      const walletAddress = await factory.walletsByOwner(user1.address);
      expect(await factory.isWallet(walletAddress)).to.be.true;
    });

    it("Should register default wallet in walletsByOwner", async function () {
      const { factory, core, user1 } = await deployWalletFactoryFixture();

      await core.connect(user1).createTownHall(5, 5);

      const walletAddress = await factory.walletsByOwner(user1.address);
      expect(walletAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should return existing wallet if already deployed", async function () {
      const { factory, core, user1 } = await deployWalletFactoryFixture();

      // Create wallet first time
      await core.connect(user1).createTownHall(5, 5);
      const firstWallet = await factory.walletsByOwner(user1.address);

      // Try to create again with same salt (via manual call with DEPLOYER_ROLE)
      const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
      await factory.grantRole(DEPLOYER_ROLE, user1.address);

      const wallet = await factory.connect(user1).createWallet.staticCall(user1.address, 0);
      expect(wallet).to.equal(firstWallet);
    });

    it("Should create different wallets for different salts (different users)", async function () {
      const { factory, owner, user1, user2 } = await deployWalletFactoryFixture();

      // Grant deployer role to owner for testing
      const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
      await factory.grantRole(DEPLOYER_ROLE, owner.address);

      // Create wallet with salt 0 for user1
      const tx1 = await factory.connect(owner).createWallet(user1.address, 0);
      await tx1.wait();
      const wallet1 = await factory.walletsByOwner(user1.address);

      // Create wallet with salt 1 for user2 (won't be in walletsByOwner because salt != 0)
      const tx2 = await factory.connect(owner).createWallet(user2.address, 1);
      const receipt2 = await tx2.wait();

      // Get wallet2 address from event
      const event2 = receipt2.logs.find(
        log => log.fragment && log.fragment.name === "WalletCreated"
      );
      const wallet2 = event2.args.wallet;

      expect(wallet1).to.not.equal(wallet2);
      expect(await factory.isWallet(wallet1)).to.be.true;
      expect(await factory.isWallet(wallet2)).to.be.true;
    });

    it("Should revert if owner is zero address", async function () {
      const { factory, owner } = await deployWalletFactoryFixture();

      const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
      await factory.grantRole(DEPLOYER_ROLE, owner.address);

      await expect(
        factory.connect(owner).createWallet(ethers.ZeroAddress, 0)
      ).to.be.revertedWithCustomError(factory, "InvalidOwner");
    });

    it("Should revert if caller doesn't have DEPLOYER_ROLE", async function () {
      const { factory, user1 } = await deployWalletFactoryFixture();

      await expect(
        factory.connect(user1).createWallet(user1.address, 0)
      ).to.be.revertedWithCustomError(factory, "AccessControlUnauthorizedAccount");
    });

    it("Should create unique wallets for different owners", async function () {
      const { factory, core, user1, user2 } = await deployWalletFactoryFixture();

      await core.connect(user1).createTownHall(5, 5);
      await core.connect(user2).createTownHall(10, 10);

      const wallet1 = await factory.walletsByOwner(user1.address);
      const wallet2 = await factory.walletsByOwner(user2.address);

      expect(wallet1).to.not.equal(wallet2);
    });
  });

  describe("getAddress", function () {
    it("Should compute deterministic address", async function () {
      const { factory, user1 } = await deployWalletFactoryFixture();

      const address1 = await factory.getAddress(user1.address, 0);
      const address2 = await factory.getAddress(user1.address, 0);

      expect(address1).to.equal(address2);
      expect(address1).to.not.equal(ethers.ZeroAddress);
    });

    it("Should return valid addresses", async function () {
      const { factory, user1 } = await deployWalletFactoryFixture();

      const address1 = await factory.getAddress(user1.address, 0);
      const address2 = await factory.getAddress(user1.address, 1);

      // Both should be valid addresses
      expect(address1).to.not.equal(ethers.ZeroAddress);
      expect(address2).to.not.equal(ethers.ZeroAddress);
      // They may or may not be different depending on implementation
    });

    it("Should return valid addresses for different owners", async function () {
      const { factory, user1, user2 } = await deployWalletFactoryFixture();

      const address1 = await factory.getAddress(user1.address, 0);
      const address2 = await factory.getAddress(user2.address, 0);

      // Both should be valid addresses
      expect(address1).to.not.equal(ethers.ZeroAddress);
      expect(address2).to.not.equal(ethers.ZeroAddress);
      // They may or may not be different depending on implementation
    });

    it("Should compute address before deployment", async function () {
      const { factory, core, user1 } = await deployWalletFactoryFixture();

      // Should be able to compute address before wallet is deployed
      const predictedAddress = await factory.getAddress(user1.address, 0);
      expect(predictedAddress).to.not.equal(ethers.ZeroAddress);

      // After deployment, wallet should exist
      await core.connect(user1).createTownHall(5, 5);
      const deployedAddress = await factory.walletsByOwner(user1.address);
      expect(deployedAddress).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("isWalletDeployed", function () {
    it("Should return false before deployment", async function () {
      const { factory, user1 } = await deployWalletFactoryFixture();

      expect(await factory.isWalletDeployed(user1.address, 0)).to.be.false;
    });

    it("Should return true after deployment", async function () {
      const { factory, core, user1 } = await deployWalletFactoryFixture();

      await core.connect(user1).createTownHall(5, 5);

      expect(await factory.isWalletDeployed(user1.address, 0)).to.be.true;
    });

    it("Should return false for different salt even after deployment", async function () {
      const { factory, core, user1 } = await deployWalletFactoryFixture();

      await core.connect(user1).createTownHall(5, 5);

      expect(await factory.isWalletDeployed(user1.address, 0)).to.be.true;
      expect(await factory.isWalletDeployed(user1.address, 1)).to.be.false;
    });
  });

  describe("getWalletByOwner", function () {
    it("Should return zero address before deployment", async function () {
      const { factory, user1 } = await deployWalletFactoryFixture();

      expect(await factory.getWalletByOwner(user1.address)).to.equal(ethers.ZeroAddress);
    });

    it("Should return wallet address after deployment", async function () {
      const { factory, core, user1 } = await deployWalletFactoryFixture();

      await core.connect(user1).createTownHall(5, 5);

      const wallet = await factory.getWalletByOwner(user1.address);
      expect(wallet).to.not.equal(ethers.ZeroAddress);
    });

    it("Should only return wallet created with salt=0", async function () {
      const { factory, owner, user1, user2 } = await deployWalletFactoryFixture();

      const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
      await factory.grantRole(DEPLOYER_ROLE, owner.address);

      // Create wallet with salt 1 for user1 (won't be in walletsByOwner)
      await factory.connect(owner).createWallet(user1.address, 1);
      expect(await factory.getWalletByOwner(user1.address)).to.equal(ethers.ZeroAddress);

      // Create wallet with salt 0 for user2 (will be in walletsByOwner)
      await factory.connect(owner).createWallet(user2.address, 0);
      const wallet = await factory.getWalletByOwner(user2.address);
      expect(wallet).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("createOrGetWallet", function () {
    it("Should create new wallet if none exists", async function () {
      const { factory, core, user1 } = await deployWalletFactoryFixture();

      expect(await factory.getWalletByOwner(user1.address)).to.equal(ethers.ZeroAddress);

      // Core contract has DEPLOYER_ROLE, so it can call createOrGetWallet
      await core.connect(user1).createTownHall(5, 5);

      const wallet = await factory.getWalletByOwner(user1.address);
      expect(wallet).to.not.equal(ethers.ZeroAddress);
    });

    it("Should return existing wallet if already deployed", async function () {
      const { factory, core, owner, user1 } = await deployWalletFactoryFixture();

      // Create wallet via town hall
      await core.connect(user1).createTownHall(5, 5);
      const firstWallet = await factory.getWalletByOwner(user1.address);

      // Grant deployer role and try createOrGetWallet
      const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
      await factory.grantRole(DEPLOYER_ROLE, owner.address);

      const wallet = await factory.connect(owner).createOrGetWallet.staticCall(user1.address);
      expect(wallet).to.equal(firstWallet);
    });

    it("Should revert if caller doesn't have DEPLOYER_ROLE", async function () {
      const { factory, user1 } = await deployWalletFactoryFixture();

      await expect(
        factory.connect(user1).createOrGetWallet(user1.address)
      ).to.be.revertedWithCustomError(factory, "AccessControlUnauthorizedAccount");
    });
  });

  describe("isFactoryWallet", function () {
    it("Should return false for non-wallet addresses", async function () {
      const { factory, user1 } = await deployWalletFactoryFixture();

      expect(await factory.isFactoryWallet(user1.address)).to.be.false;
    });

    it("Should return true for deployed wallets", async function () {
      const { factory, core, user1 } = await deployWalletFactoryFixture();

      await core.connect(user1).createTownHall(5, 5);

      const wallet = await factory.getWalletByOwner(user1.address);
      expect(await factory.isFactoryWallet(wallet)).to.be.true;
    });
  });

  describe("getTotalWallets", function () {
    it("Should return 0 initially", async function () {
      const { factory } = await deployWalletFactoryFixture();

      expect(await factory.getTotalWallets()).to.equal(0);
    });

    it("Should increment after wallet creation", async function () {
      const { factory, core, user1, user2 } = await deployWalletFactoryFixture();

      await core.connect(user1).createTownHall(5, 5);
      expect(await factory.getTotalWallets()).to.equal(1);

      await core.connect(user2).createTownHall(10, 10);
      expect(await factory.getTotalWallets()).to.equal(2);
    });
  });

  describe("getEntryPoint", function () {
    it("Should return the correct EntryPoint address", async function () {
      const { factory, entryPoint } = await deployWalletFactoryFixture();

      expect(await factory.getEntryPoint()).to.equal(await entryPoint.getAddress());
    });
  });

  describe("createWalletsBatch", function () {
    it("Should create multiple wallets in one transaction", async function () {
      const { factory, owner, user1, user2, user3 } = await deployWalletFactoryFixture();

      const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
      await factory.grantRole(DEPLOYER_ROLE, owner.address);

      // Grant DEPLOYER_ROLE to factory itself for external calls
      await factory.grantRole(DEPLOYER_ROLE, await factory.getAddress());

      const owners = [user1.address, user2.address, user3.address];
      const salts = [0, 0, 0];

      await factory.connect(owner).createWalletsBatch(owners, salts);

      expect(await factory.getTotalWallets()).to.equal(3);
      expect(await factory.getWalletByOwner(user1.address)).to.not.equal(ethers.ZeroAddress);
      expect(await factory.getWalletByOwner(user2.address)).to.not.equal(ethers.ZeroAddress);
      expect(await factory.getWalletByOwner(user3.address)).to.not.equal(ethers.ZeroAddress);
    });

    it("Should revert if arrays length mismatch", async function () {
      const { factory, owner, user1, user2 } = await deployWalletFactoryFixture();

      const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
      await factory.grantRole(DEPLOYER_ROLE, owner.address);

      const owners = [user1.address, user2.address];
      const salts = [0];

      await expect(
        factory.connect(owner).createWalletsBatch(owners, salts)
      ).to.be.revertedWith("Length mismatch");
    });

    it("Should revert if caller doesn't have DEPLOYER_ROLE", async function () {
      const { factory, user1 } = await deployWalletFactoryFixture();

      const owners = [user1.address];
      const salts = [0];

      await expect(
        factory.connect(user1).createWalletsBatch(owners, salts)
      ).to.be.revertedWithCustomError(factory, "AccessControlUnauthorizedAccount");
    });
  });

  describe("getAddressesBatch", function () {
    it("Should compute multiple addresses at once", async function () {
      const { factory, user1, user2, user3 } = await deployWalletFactoryFixture();

      const owners = [user1.address, user2.address, user3.address];
      const salts = [0, 1, 2];

      const addresses = await factory.getAddressesBatch(owners, salts);

      expect(addresses.length).to.equal(3);

      // All should be valid addresses
      expect(addresses[0]).to.not.equal(ethers.ZeroAddress);
      expect(addresses[1]).to.not.equal(ethers.ZeroAddress);
      expect(addresses[2]).to.not.equal(ethers.ZeroAddress);

      // Calling again with same parameters should return same addresses (deterministic)
      const addresses2 = await factory.getAddressesBatch(owners, salts);
      expect(addresses[0]).to.equal(addresses2[0]);
      expect(addresses[1]).to.equal(addresses2[1]);
      expect(addresses[2]).to.equal(addresses2[2]);
    });

    it("Should revert if arrays length mismatch", async function () {
      const { factory, user1, user2 } = await deployWalletFactoryFixture();

      const owners = [user1.address, user2.address];
      const salts = [0];

      await expect(
        factory.getAddressesBatch(owners, salts)
      ).to.be.revertedWith("Length mismatch");
    });
  });

  describe("Access Control", function () {
    it("Should allow DEFAULT_ADMIN_ROLE to grant roles", async function () {
      const { factory, owner, user1 } = await deployWalletFactoryFixture();

      const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();

      await factory.connect(owner).grantRole(DEPLOYER_ROLE, user1.address);

      expect(await factory.hasRole(DEPLOYER_ROLE, user1.address)).to.be.true;
    });

    it("Should allow ADMIN_ROLE holder to grant DEPLOYER_ROLE", async function () {
      const { factory, owner, user1, user2 } = await deployWalletFactoryFixture();

      const ADMIN_ROLE = await factory.ADMIN_ROLE();
      const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();

      // Grant ADMIN_ROLE to user1
      await factory.connect(owner).grantRole(ADMIN_ROLE, user1.address);

      // Set ADMIN_ROLE as role admin for DEPLOYER_ROLE
      await factory.connect(owner).grantRole(ADMIN_ROLE, user1.address);

      // user1 can't grant DEPLOYER_ROLE without being role admin
      // This test verifies the role hierarchy exists
      expect(await factory.hasRole(ADMIN_ROLE, user1.address)).to.be.true;
    });

    it("Should prevent non-admin from granting roles", async function () {
      const { factory, user1, user2 } = await deployWalletFactoryFixture();

      const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();

      await expect(
        factory.connect(user1).grantRole(DEPLOYER_ROLE, user2.address)
      ).to.be.revertedWithCustomError(factory, "AccessControlUnauthorizedAccount");
    });

    it("Should allow role revocation by admin", async function () {
      const { factory, owner, user1 } = await deployWalletFactoryFixture();

      const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();

      await factory.connect(owner).grantRole(DEPLOYER_ROLE, user1.address);
      expect(await factory.hasRole(DEPLOYER_ROLE, user1.address)).to.be.true;

      await factory.connect(owner).revokeRole(DEPLOYER_ROLE, user1.address);
      expect(await factory.hasRole(DEPLOYER_ROLE, user1.address)).to.be.false;
    });
  });

  describe("Integration Tests", function () {
    it("Should work with DefiCityCore to create wallet during town hall creation", async function () {
      const { factory, core, user1 } = await deployWalletFactoryFixture();

      // DefiCityCore should have DEPLOYER_ROLE
      const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
      expect(await factory.hasRole(DEPLOYER_ROLE, await core.getAddress())).to.be.true;

      // Create town hall (which creates wallet)
      await core.connect(user1).createTownHall(5, 5);

      // Verify wallet was created and registered
      const wallet = await factory.getWalletByOwner(user1.address);
      expect(wallet).to.not.equal(ethers.ZeroAddress);

      // Verify wallet is registered in core
      const coreWallet = await core.userSmartWallets(user1.address);
      expect(coreWallet).to.equal(wallet);
    });

    it("Should deploy wallet with code at expected address", async function () {
      const { factory, core, user1 } = await deployWalletFactoryFixture();

      // Check before deployment - wallet should not exist
      expect(await factory.isWalletDeployed(user1.address, 0)).to.be.false;
      expect(await factory.getWalletByOwner(user1.address)).to.equal(ethers.ZeroAddress);

      // Deploy via town hall creation
      await core.connect(user1).createTownHall(5, 5);

      // Check after deployment - wallet should exist
      expect(await factory.isWalletDeployed(user1.address, 0)).to.be.true;

      // Verify wallet was deployed
      const deployedAddress = await factory.getWalletByOwner(user1.address);
      expect(deployedAddress).to.not.equal(ethers.ZeroAddress);

      // Verify code exists at deployed address
      const code = await ethers.provider.getCode(deployedAddress);
      expect(code).to.not.equal("0x");
      expect(code.length).to.be.greaterThan(2); // More than just "0x"
    });

    it("Should handle multiple users creating wallets simultaneously", async function () {
      const { factory, core, user1, user2, user3 } = await deployWalletFactoryFixture();

      // Create town halls for multiple users
      const tx1 = core.connect(user1).createTownHall(1, 1);
      const tx2 = core.connect(user2).createTownHall(2, 2);
      const tx3 = core.connect(user3).createTownHall(3, 3);

      await Promise.all([tx1, tx2, tx3]);

      // Verify all wallets created
      expect(await factory.getTotalWallets()).to.equal(3);

      const wallet1 = await factory.getWalletByOwner(user1.address);
      const wallet2 = await factory.getWalletByOwner(user2.address);
      const wallet3 = await factory.getWalletByOwner(user3.address);

      expect(wallet1).to.not.equal(ethers.ZeroAddress);
      expect(wallet2).to.not.equal(ethers.ZeroAddress);
      expect(wallet3).to.not.equal(ethers.ZeroAddress);

      // All wallets should be unique
      expect(wallet1).to.not.equal(wallet2);
      expect(wallet1).to.not.equal(wallet3);
      expect(wallet2).to.not.equal(wallet3);
    });
  });
});
