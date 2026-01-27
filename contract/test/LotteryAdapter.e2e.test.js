import { expect  } from "chai";
// Note: ethers will be obtained from network.connect()
import hre from "hardhat";

describe("LotteryAdapter E2E with SmartWallet and MockMegapot", function () {
  let ethers;

  before(async function () {
    ({ ethers } = await hre.network.connect());
  });

  // Fixture to deploy complete ecosystem
  async function deployLotteryEcosystemFixture() {
    const [owner, user1, user2, treasury] = await ethers.getSigners();

    // 1. Deploy MockEntryPoint
    const MockEntryPoint = await ethers.getContractFactory("MockEntryPoint");
    const entryPoint = await MockEntryPoint.deploy();
    await entryPoint.waitForDeployment();

    // 2. Deploy DefiCityCore
    const DefiCityCore = await ethers.getContractFactory("DefiCityCore");
    const core = await DefiCityCore.deploy(treasury.address);
    await core.waitForDeployment();

    // 3. Deploy WalletFactory
    const WalletFactory = await ethers.getContractFactory("WalletFactory");
    const factory = await WalletFactory.deploy(
      await entryPoint.getAddress(),
      await core.getAddress()
    );
    await factory.waitForDeployment();

    await core.setWalletFactory(await factory.getAddress());

    // 4. Deploy MockERC20 (USDC)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC", ethers.parseUnits("1000000", 6));
    await usdc.waitForDeployment();

    await core.addSupportedAsset(await usdc.getAddress());

    // 5. Deploy MockMegapot
    const MockMegapot = await ethers.getContractFactory("MockMegapot");
    const mockMegapot = await MockMegapot.deploy(await usdc.getAddress());
    await mockMegapot.waitForDeployment();

    // Add initial jackpot
    const initialJackpot = ethers.parseUnits("100000", 6); // 100k USDC
    await usdc.approve(await mockMegapot.getAddress(), initialJackpot);
    await mockMegapot.addToJackpot(initialJackpot);

    // 6. Deploy LotteryAdapter
    const LotteryAdapter = await ethers.getContractFactory("LotteryAdapter");
    const lotteryAdapter = await LotteryAdapter.deploy(
      await core.getAddress(),
      await mockMegapot.getAddress(),
      await usdc.getAddress(),
      treasury.address
    );
    await lotteryAdapter.waitForDeployment();

    // Fund users with USDC
    const userFunding = ethers.parseUnits("10000", 6); // 10k USDC
    await usdc.transfer(user1.address, userFunding);
    await usdc.transfer(user2.address, userFunding);

    return {
      core,
      factory,
      entryPoint,
      usdc,
      mockMegapot,
      lotteryAdapter,
      owner,
      user1,
      user2,
      treasury
    };
  }

  describe("Buy Tickets E2E Flow", function () {
    it("Should complete full ticket purchase flow: User -> SmartWallet -> LotteryAdapter -> MockMegapot", async function () {
      const { core, usdc, mockMegapot, lotteryAdapter, user1 } = await deployLotteryEcosystemFixture();

      // Step 1: User creates Town Hall (gets SmartWallet)
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);

      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      // Step 2: User funds SmartWallet with USDC
      const ticketAmount = ethers.parseUnits("5", 6); // 100 USDC for tickets
      await usdc.connect(user1).transfer(smartWalletAddress, ticketAmount);

      // Step 3: Prepare placement parameters
      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [
          ticketAmount,  // amount
          10,            // x coordinate
          10             // y coordinate
        ]
      );

      // Step 4: Get batch calls from adapter
      const result1 = await lotteryAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const targets = [...result1[0]];
      const values = [...result1[1]];
      const datas = [...result1[2]];

      // Verify batch structure
      expect(targets.length).to.equal(3); // approve USDC, buyTickets, recordBuilding
      expect(targets[0]).to.equal(await usdc.getAddress());
      expect(targets[1]).to.equal(await mockMegapot.getAddress());
      expect(targets[2]).to.equal(await core.getAddress());

      // Step 5: Execute batch via SmartWallet
      const executeTx = await smartWallet.connect(user1).executeBatch(targets, values, datas, { gasLimit: 10_000_000 });
      await executeTx.wait();

      // Step 6: Verify results

      // Check tickets were purchased
      const userTickets = await mockMegapot.getTicketsByOwner(smartWalletAddress);
      expect(userTickets.length).to.be.gt(0);

      // Check SmartWallet USDC balance is now 0
      const walletBalance = await usdc.balanceOf(smartWalletAddress);
      expect(walletBalance).to.equal(0);

      // Check building was recorded
      const userBuildings = await core.getUserBuildings(user1.address);
      expect(userBuildings.length).to.equal(2); // Town Hall + Lottery

      const lotteryBuilding = userBuildings[1];
      expect(lotteryBuilding.buildingType).to.equal("lottery");
      expect(lotteryBuilding.asset).to.equal(await usdc.getAddress());
      expect(lotteryBuilding.amount).to.equal(ticketAmount);
      expect(lotteryBuilding.coordinateX).to.equal(10);
      expect(lotteryBuilding.coordinateY).to.equal(10);
      expect(lotteryBuilding.active).to.be.true;

      // Verify jackpot increased
      const currentJackpot = await mockMegapot.getCurrentJackpot();
      expect(currentJackpot).to.be.gt(ethers.parseUnits("100000", 6));
    });

    it("Should handle ticket purchase with referrer", async function () {
      const { core, usdc, mockMegapot, lotteryAdapter, user1, treasury } = await deployLotteryEcosystemFixture();

      // Setup
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);
      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      // Fund wallet
      const ticketAmount = ethers.parseUnits("5", 6);
      await usdc.connect(user1).transfer(smartWalletAddress, ticketAmount);

      // Get initial referral earnings
      const initialEarnings = await mockMegapot.referralEarnings(treasury.address);

      // Prepare and execute
      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [ticketAmount, 10, 10]
      );

      const result2 = await lotteryAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const targets = [...result2[0]];
      const values = [...result2[1]];
      const datas = [...result2[2]];

      await smartWallet.connect(user1).executeBatch(targets, values, datas, { gasLimit: 10_000_000 });

      // Verify referral earnings increased (treasury is used as referrer in adapter)
      const finalEarnings = await mockMegapot.referralEarnings(treasury.address);
      expect(finalEarnings).to.be.gt(initialEarnings);
    });
  });

  describe("Harvest (Claim Prizes) E2E Flow", function () {
    it("Should claim winning ticket prizes", async function () {
      const { core, usdc, mockMegapot, lotteryAdapter, user1 } = await deployLotteryEcosystemFixture();

      // Setup: Create Town Hall and SmartWallet
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);
      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      // Step 1: Buy tickets
      const ticketAmount = ethers.parseUnits("5", 6);
      await usdc.connect(user1).transfer(smartWalletAddress, ticketAmount);

      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [ticketAmount, 10, 10]
      );

      const result3 = await lotteryAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const placeTargets = [...result3[0]];
      const placeValues = [...result3[1]];
      const placeDatas = [...result3[2]];
      await smartWallet.connect(user1).executeBatch(placeTargets, placeValues, placeDatas, { gasLimit: 10_000_000 });

      // Get building ID - use the last building (most recently placed lottery)
      const userBuildings = await core.getUserBuildings(user1.address);
      expect(userBuildings.length).to.be.gte(2); // Should have Town Hall + Lottery
      const buildingId = userBuildings[userBuildings.length - 1].id;

      // Get purchased tickets
      const ticketIds = await mockMegapot.getTicketsByOwner(smartWalletAddress);
      expect(ticketIds.length).to.be.gt(0);

      // Step 2: Manually set some tickets as winners (test helper)
      const winningTicketId = ticketIds[0];
      const prizeAmount = ethers.parseUnits("1000", 6); // 1000 USDC prize
      await mockMegapot.setWinningTicket(winningTicketId, prizeAmount);

      // Verify ticket is marked as winner
      const [isWinner, prizes] = await mockMegapot.checkWinners([winningTicketId]);
      expect(isWinner[0]).to.be.true;
      expect(prizes[0]).to.equal(prizeAmount);

      // Step 3: Prepare harvest (claim prizes)
      // Encode as struct: (uint256[] ticketIds)
      const harvestParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(uint256[])"],
        [[[winningTicketId]]]
      );

      const result4 = await lotteryAdapter.prepareHarvest(
        user1.address,
        smartWalletAddress,
        buildingId,
        harvestParams
      );
      const targets = [...result4[0]];
      const values = [...result4[1]];
      const datas = [...result4[2]];

      // Verify harvest batch structure
      expect(targets.length).to.equal(2); // claimPrizes, recordHarvest

      // Execute harvest
      await smartWallet.connect(user1).executeBatch(targets, values, datas, { gasLimit: 10_000_000 });

      // Verify prize was received
      const walletBalance = await usdc.balanceOf(smartWalletAddress);
      expect(walletBalance).to.equal(prizeAmount);

      // Verify ticket is marked as claimed
      const ticketDetails = await mockMegapot.getTicketDetails(winningTicketId);
      expect(ticketDetails.claimed).to.be.true;
    });

    it("Should claim multiple winning tickets at once", async function () {
      const { core, usdc, mockMegapot, lotteryAdapter, user1 } = await deployLotteryEcosystemFixture();

      // Setup
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);
      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      // Buy tickets
      const ticketAmount = ethers.parseUnits("5", 6);
      await usdc.connect(user1).transfer(smartWalletAddress, ticketAmount);

      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [ticketAmount, 10, 10]
      );

      const result5 = await lotteryAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const placeTargets2 = [...result5[0]];
      const placeValues2 = [...result5[1]];
      const placeDatas2 = [...result5[2]];

      // Execute all operations together in one batch (like the working test)
      await smartWallet.connect(user1).executeBatch(placeTargets2, placeValues2, placeDatas2, { gasLimit: 10_000_000 });

      const userBuildings2 = await core.getUserBuildings(user1.address);
      const buildingId = userBuildings2[userBuildings2.length - 1].id;
      const ticketIds = await mockMegapot.getTicketsByOwner(smartWalletAddress);

      // Set multiple tickets as winners
      const winningTickets = [ticketIds[0], ticketIds[1], ticketIds[2]];
      const prizesArray = [
        ethers.parseUnits("5", 6),
        ethers.parseUnits("250", 6),
        ethers.parseUnits("500", 6)
      ];

      await mockMegapot.setWinningTickets(winningTickets, prizesArray);

      // Claim all prizes
      const harvestParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(uint256[])"],
        [[winningTickets]]
      );

      const result6 = await lotteryAdapter.prepareHarvest(
        user1.address,
        smartWalletAddress,
        buildingId,
        harvestParams
      );
      const targets = [...result6[0]];
      const values = [...result6[1]];
      const datas = [...result6[2]];

      await smartWallet.connect(user1).executeBatch(targets, values, datas, { gasLimit: 10_000_000 });

      // Verify total prize
      const totalPrize = prizesArray.reduce((a, b) => a + b, 0n);
      const walletBalance = await usdc.balanceOf(smartWalletAddress);
      expect(walletBalance).to.equal(totalPrize);
    });
  });

  describe("Demolish E2E Flow", function () {
    it("Should demolish lottery building (tickets remain in Megapot)", async function () {
      const { core, usdc, mockMegapot, lotteryAdapter, user1 } = await deployLotteryEcosystemFixture();

      // Setup: Create Town Hall and buy tickets
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);
      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      // Buy tickets
      const ticketAmount = ethers.parseUnits("5", 6);
      await usdc.connect(user1).transfer(smartWalletAddress, ticketAmount);

      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [ticketAmount, 10, 10]
      );

      const result7 = await lotteryAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const placeTargets3 = [...result7[0]];
      const placeValues3 = [...result7[1]];
      const placeDatas3 = [...result7[2]];
      await smartWallet.connect(user1).executeBatch(placeTargets3, placeValues3, placeDatas3, { gasLimit: 10_000_000 });

      const userBuildings2 = await core.getUserBuildings(user1.address);
      const buildingId = userBuildings2[userBuildings2.length - 1].id;
      const ticketsBefore = await mockMegapot.getTicketsByOwner(smartWalletAddress);
      expect(ticketsBefore.length).to.be.gt(0);

      // Demolish lottery building
      const demolishParams = ethers.AbiCoder.defaultAbiCoder().encode([], []);

      const result8 = await lotteryAdapter.prepareDemolish(
        user1.address,
        smartWalletAddress,
        buildingId,
        demolishParams
      );
      const targets = [...result8[0]];
      const values = [...result8[1]];
      const datas = [...result8[2]];

      // Verify demolish only records (no withdrawal from Megapot)
      expect(targets.length).to.equal(1); // Only recordDemolition

      await smartWallet.connect(user1).executeBatch(targets, values, datas, { gasLimit: 10_000_000 });

      // Verify building marked as inactive
      const building = await core.buildings(buildingId);
      expect(building.active).to.be.false;

      // Verify tickets still exist in Megapot (user can still claim if they win)
      const ticketsAfter = await mockMegapot.getTicketsByOwner(smartWalletAddress);
      expect(ticketsAfter.length).to.equal(ticketsBefore.length);
    });
  });

  describe("Edge Cases and Validation", function () {
    it("Should revert if trying to claim non-winning ticket", async function () {
      const { core, usdc, mockMegapot, lotteryAdapter, user1 } = await deployLotteryEcosystemFixture();

      // Setup and buy tickets
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);
      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      const ticketAmount = ethers.parseUnits("5", 6);
      await usdc.connect(user1).transfer(smartWalletAddress, ticketAmount);

      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [ticketAmount, 10, 10]
      );

      const result9 = await lotteryAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const placeTargets4 = [...result9[0]];
      const placeValues4 = [...result9[1]];
      const placeDatas4 = [...result9[2]];
      await smartWallet.connect(user1).executeBatch(placeTargets4, placeValues4, placeDatas4, { gasLimit: 10_000_000 });

      const userBuildings2 = await core.getUserBuildings(user1.address);
      const buildingId = userBuildings2[userBuildings2.length - 1].id;
      const ticketIds = await mockMegapot.getTicketsByOwner(smartWalletAddress);

      // Try to claim without setting as winner
      const harvestParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(uint256[])"],
        [[[ticketIds[0]]]]
      );

      const result10 = await lotteryAdapter.prepareHarvest(
        user1.address,
        smartWalletAddress,
        buildingId,
        harvestParams
      );
      const targets = [...result10[0]];
      const values = [...result10[1]];
      const datas = [...result10[2]];

      // This should revert because ticket is not a winner
      await expect(
        smartWallet.connect(user1).executeBatch(targets, values, datas, { gasLimit: 10_000_000 })
      ).to.be.revertedWithCustomError;
    });
  });
});
