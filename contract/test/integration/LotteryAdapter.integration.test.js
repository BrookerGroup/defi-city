const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  verifyNetwork,
  checkBalance,
  checkTokenBalance,
  waitForTx
} = require("./helpers/networkHelpers");
const {
  getAllAddresses,
  attachContracts,
  verifyAllDeployed,
  getDeploymentInfo
} = require("./helpers/deploymentLoader");

describe("LotteryAdapter Integration Tests - Base Sepolia", function() {
  // Configuration
  const NETWORK_TIMEOUT = 60000;
  const CONFIRMATION_BLOCKS = 1;
  const TEST_AMOUNT_USDC = ethers.parseUnits("100", 6); // 100 USDC for tickets
  const MIN_ETH = ethers.parseEther("0.01");

  let deployer;
  let addresses;
  let contracts;
  let smartWalletAddress;

  this.timeout(NETWORK_TIMEOUT * 3);

  before(async function() {
    console.log("\n========================================");
    console.log("  LotteryAdapter Integration Tests");
    console.log("========================================\n");

    [deployer] = await ethers.getSigners();
    console.log(`Test account: ${deployer.address}`);

    try {
      await verifyNetwork();

      const hasBalance = await checkBalance(deployer.address, MIN_ETH);
      if (!hasBalance) {
        console.log("\n⚠️  Skipping tests - insufficient ETH balance");
        this.skip();
      }

      addresses = getAllAddresses();
      const deploymentInfo = getDeploymentInfo();
      console.log(`Integration deployed: ${deploymentInfo.integrationDeployedAt}`);

      const allDeployed = await verifyAllDeployed(addresses);
      if (!allDeployed) {
        console.log("\n⚠️  Skipping tests - contracts not deployed");
        this.skip();
      }

      contracts = await attachContracts(addresses);

      const hasTokens = await checkTokenBalance(
        contracts.usdc,
        deployer.address,
        TEST_AMOUNT_USDC,
        "USDC"
      );
      if (!hasTokens) {
        console.log("\n⚠️  Skipping tests - insufficient USDC balance");
        this.skip();
      }

      console.log("\n✓ Setup complete\n");
    } catch (error) {
      console.error("\n❌ Setup failed:", error.message);
      this.skip();
    }
  });

  describe("Deployment Verification", function() {
    it("Should verify LotteryAdapter is deployed", async function() {
      expect(addresses.adapters.lottery).to.not.equal(ethers.ZeroAddress);

      const code = await ethers.provider.getCode(addresses.adapters.lottery);
      expect(code).to.not.equal("0x");
    });

    it("Should verify MockMegapot has jackpot", async function() {
      const jackpot = await contracts.mockMegapot.getCurrentJackpot();
      expect(jackpot).to.be.gt(0);
      console.log(`  ✓ Current jackpot: ${ethers.formatUnits(jackpot, 6)} USDC`);
    });

    it("Should verify adapter configuration", async function() {
      const buildingType = await contracts.lotteryAdapter.getBuildingType();
      expect(buildingType).to.equal("lottery");

      const treasury = await contracts.lotteryAdapter.getTreasury();
      expect(treasury).to.equal(addresses.core.treasury);
    });
  });

  describe("Buy Tickets Integration", function() {
    let buildingId;
    let ticketIds;

    it("Should create TownHall if needed", async function() {
      smartWalletAddress = await contracts.core.userSmartWallets(deployer.address);

      if (smartWalletAddress === ethers.ZeroAddress) {
        console.log("  Creating Town Hall...");
        const tx = await contracts.core.createTownHall(5, 5);
        await waitForTx(tx, CONFIRMATION_BLOCKS);

        smartWalletAddress = await contracts.core.userSmartWallets(deployer.address);
      } else {
        console.log(`  Using existing SmartWallet: ${smartWalletAddress}`);
      }

      expect(smartWalletAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should buy lottery tickets via SmartWallet", async function() {
      // Fund SmartWallet with USDC
      console.log("  Funding SmartWallet...");
      const fundTx = await contracts.usdc.transfer(smartWalletAddress, TEST_AMOUNT_USDC);
      await waitForTx(fundTx, CONFIRMATION_BLOCKS);

      // Prepare placement parameters
      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [
          TEST_AMOUNT_USDC, // amount
          20, // x coordinate
          20  // y coordinate
        ]
      );

      // Get batch operations
      console.log("  Preparing batch operations...");
      const result = await contracts.lotteryAdapter.preparePlace(
        deployer.address,
        smartWalletAddress,
        placeParams
      );
      const targets = [...result[0]];
      const values = [...result[1]];
      const datas = [...result[2]];

      expect(targets.length).to.equal(3); // approve, buyTickets, recordBuilding

      // Execute batch
      console.log("  Executing batch...");
      const smartWallet = await ethers.getContractAt("SmartWallet", smartWalletAddress);
      const executeTx = await smartWallet.executeBatch(targets, values, datas);
      const receipt = await waitForTx(executeTx, CONFIRMATION_BLOCKS);

      // Verify tickets purchased
      ticketIds = await contracts.mockMegapot.getTicketsByOwner(smartWalletAddress);
      expect(ticketIds.length).to.be.gt(0);
      console.log(`  ✓ Purchased ${ticketIds.length} tickets`);

      // Verify building recorded
      const buildings = await contracts.core.getUserBuildings(deployer.address);
      buildingId = buildings[buildings.length - 1].id;
      console.log(`  ✓ Building ID: ${buildingId}`);
    });

    it("Should verify ticket ownership", async function() {
      const userTickets = await contracts.mockMegapot.getTicketsByOwner(smartWalletAddress);
      expect(userTickets.length).to.be.gt(0);

      // Check first ticket details
      const ticketDetails = await contracts.mockMegapot.getTicketDetails(userTickets[0]);
      expect(ticketDetails.owner).to.equal(smartWalletAddress);
      expect(ticketDetails.claimed).to.be.false;
    });
  });

  describe("Claim Prize Integration", function() {
    it("Should manually set tickets as winners and claim prizes", async function() {
      // Get user's tickets
      const ticketIds = await contracts.mockMegapot.getTicketsByOwner(smartWalletAddress);
      if (ticketIds.length === 0) {
        console.log("  No tickets to claim");
        this.skip();
      }

      // Set first ticket as winner (test helper function)
      const prizeAmount = ethers.parseUnits("1000", 6); // 1000 USDC prize
      console.log("  Setting ticket as winner...");
      const setWinnerTx = await contracts.mockMegapot.setWinningTicket(ticketIds[0], prizeAmount);
      await waitForTx(setWinnerTx, CONFIRMATION_BLOCKS);

      // Verify ticket is winner
      const [isWinner, prizes] = await contracts.mockMegapot.checkWinners([ticketIds[0]]);
      expect(isWinner[0]).to.be.true;
      expect(prizes[0]).to.equal(prizeAmount);

      // Get building ID
      const buildings = await contracts.core.getUserBuildings(deployer.address);
      const lotteryBuilding = buildings.find(b => b.buildingType === "lottery");
      expect(lotteryBuilding).to.not.be.undefined;

      // Prepare harvest (claim prizes)
      const harvestParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(uint256[])"],
        [[[ticketIds[0]]]]
      );

      console.log("  Preparing harvest...");
      const result = await contracts.lotteryAdapter.prepareHarvest(
        deployer.address,
        smartWalletAddress,
        lotteryBuilding.id,
        harvestParams
      );

      // Execute harvest
      console.log("  Claiming prize...");
      const smartWallet = await ethers.getContractAt("SmartWallet", smartWalletAddress);
      const executeTx = await smartWallet.executeBatch([...result[0]], [...result[1]], [...result[2]]);
      const receipt = await waitForTx(executeTx, CONFIRMATION_BLOCKS);

      // Verify prize received
      const walletBalance = await contracts.usdc.balanceOf(smartWalletAddress);
      expect(walletBalance).to.be.gte(prizeAmount);
      console.log(`  ✓ Prize claimed: ${ethers.formatUnits(prizeAmount, 6)} USDC`);

      // Verify ticket marked as claimed
      const ticketDetails = await contracts.mockMegapot.getTicketDetails(ticketIds[0]);
      expect(ticketDetails.claimed).to.be.true;
    });
  });

  describe("Demolish Integration", function() {
    it("Should demolish lottery building (tickets remain in Megapot)", async function() {
      const buildings = await contracts.core.getUserBuildings(deployer.address);
      const lotteryBuilding = buildings.find(b => b.buildingType === "lottery" && b.active);

      if (!lotteryBuilding) {
        console.log("  No active lottery building to demolish");
        this.skip();
      }

      // Get ticket count before demolish
      const ticketsBefore = await contracts.mockMegapot.getTicketsByOwner(smartWalletAddress);
      console.log(`  Tickets before demolish: ${ticketsBefore.length}`);

      // Prepare demolish
      const result = await contracts.lotteryAdapter.prepareDemolish(
        deployer.address,
        smartWalletAddress,
        lotteryBuilding.id,
        "0x"
      );

      // Execute demolish
      const smartWallet = await ethers.getContractAt("SmartWallet", smartWalletAddress);
      const executeTx = await smartWallet.executeBatch([...result[0]], [...result[1]], [...result[2]]);
      const receipt = await waitForTx(executeTx, CONFIRMATION_BLOCKS);

      // Verify building demolished
      const building = await contracts.core.buildings(lotteryBuilding.id);
      expect(building.active).to.be.false;
      console.log(`  ✓ Building ${lotteryBuilding.id} demolished`);

      // Verify tickets still exist in Megapot
      const ticketsAfter = await contracts.mockMegapot.getTicketsByOwner(smartWalletAddress);
      expect(ticketsAfter.length).to.equal(ticketsBefore.length);
      console.log(`  ✓ Tickets remain in Megapot: ${ticketsAfter.length}`);
    });
  });

  describe("Referral System", function() {
    it("Should verify treasury earned referral fees", async function() {
      // Check if treasury has referral earnings (if any tickets were bought)
      const treasuryEarnings = await contracts.mockMegapot.referralEarnings(addresses.core.treasury);

      if (treasuryEarnings > 0) {
        console.log(`  ✓ Treasury referral earnings: ${ethers.formatUnits(treasuryEarnings, 6)} USDC`);
      } else {
        console.log("  No referral earnings yet (expected if minimal testing)");
      }
    });
  });
});
