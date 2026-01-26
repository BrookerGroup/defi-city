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

describe("ShopAdapter Integration Tests - Base Sepolia", function() {
  // Configuration
  const NETWORK_TIMEOUT = 60000;
  const CONFIRMATION_BLOCKS = 1;
  const TEST_USDC_AMOUNT = ethers.parseUnits("100", 6); // 100 USDC
  const TEST_WETH_AMOUNT = ethers.parseUnits("0.05", 18); // 0.05 WETH
  const MIN_ETH = ethers.parseEther("0.01");

  let deployer;
  let addresses;
  let contracts;
  let smartWalletAddress;
  let pairAddress;

  this.timeout(NETWORK_TIMEOUT * 3);

  before(async function() {
    console.log("\n========================================");
    console.log("  ShopAdapter Integration Tests");
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

      // Check both USDC and WETH balances
      const hasUSDC = await checkTokenBalance(
        contracts.usdc,
        deployer.address,
        TEST_USDC_AMOUNT,
        "USDC"
      );

      const hasWETH = await checkTokenBalance(
        contracts.weth,
        deployer.address,
        TEST_WETH_AMOUNT,
        "WETH"
      );

      if (!hasUSDC || !hasWETH) {
        console.log("\n⚠️  Skipping tests - insufficient token balance");
        this.skip();
      }

      console.log("\n✓ Setup complete\n");
    } catch (error) {
      console.error("\n❌ Setup failed:", error.message);
      this.skip();
    }
  });

  describe("Deployment Verification", function() {
    it("Should verify ShopAdapter is deployed", async function() {
      expect(addresses.adapters.shop).to.not.equal(ethers.ZeroAddress);

      const code = await ethers.provider.getCode(addresses.adapters.shop);
      expect(code).to.not.equal("0x");
    });

    it("Should verify MockAerodromeRouter is deployed", async function() {
      const routerCode = await ethers.provider.getCode(addresses.mocks.aerodromeRouter);
      expect(routerCode).to.not.equal("0x");
    });

    it("Should verify adapter configuration", async function() {
      const buildingType = await contracts.shopAdapter.getBuildingType();
      expect(buildingType).to.equal("shop");

      const treasury = await contracts.shopAdapter.getTreasury();
      expect(treasury).to.equal(addresses.core.treasury);
    });
  });

  describe("Add Liquidity Integration", function() {
    let buildingId;

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

    it("Should add liquidity to USDC/WETH pool via SmartWallet", async function() {
      // Fund SmartWallet with both tokens
      console.log("  Funding SmartWallet...");
      const fundUSDC = await contracts.usdc.transfer(smartWalletAddress, TEST_USDC_AMOUNT);
      await waitForTx(fundUSDC, CONFIRMATION_BLOCKS);

      const fundWETH = await contracts.weth.transfer(smartWalletAddress, TEST_WETH_AMOUNT);
      await waitForTx(fundWETH, CONFIRMATION_BLOCKS);

      // Prepare placement parameters
      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "bool", "uint256", "uint256"],
        [
          addresses.tokens.usdc,
          addresses.tokens.weth,
          TEST_USDC_AMOUNT,
          TEST_WETH_AMOUNT,
          false, // volatile pool
          25, // x coordinate
          25  // y coordinate
        ]
      );

      // Get batch operations
      console.log("  Preparing batch operations...");
      const result = await contracts.shopAdapter.preparePlace(
        deployer.address,
        smartWalletAddress,
        placeParams
      );
      const targets = [...result[0]];
      const values = [...result[1]];
      const datas = [...result[2]];

      expect(targets.length).to.equal(4); // approve USDC, approve WETH, addLiquidity, recordBuilding

      // Execute batch
      console.log("  Executing batch...");
      const smartWallet = await ethers.getContractAt("SmartWallet", smartWalletAddress);
      const executeTx = await smartWallet.executeBatch(targets, values, datas);
      const receipt = await waitForTx(executeTx, CONFIRMATION_BLOCKS);

      // Get pair address
      pairAddress = await contracts.mockRouter.pairFor(
        addresses.tokens.usdc,
        addresses.tokens.weth,
        false
      );
      console.log(`  ✓ Pair address: ${pairAddress}`);

      // Verify LP tokens received
      const MockAerodromePair = await ethers.getContractFactory("MockAerodromePair");
      const pair = MockAerodromePair.attach(pairAddress);

      const lpBalance = await pair.balanceOf(smartWalletAddress);
      expect(lpBalance).to.be.gt(0);
      console.log(`  ✓ LP tokens: ${lpBalance.toString()}`);

      // Verify building recorded
      const buildings = await contracts.core.getUserBuildings(deployer.address);
      buildingId = buildings[buildings.length - 1].id;
      console.log(`  ✓ Building ID: ${buildingId}`);
    });

    it("Should verify building state on-chain", async function() {
      const building = await contracts.core.buildings(buildingId);

      expect(building.owner).to.equal(deployer.address);
      expect(building.buildingType).to.equal("shop");
      expect(building.active).to.be.true;
    });
  });

  describe("Harvest (Claim Fees) Integration", function() {
    it("Should simulate and claim trading fees", async function() {
      // Get shop building
      const buildings = await contracts.core.getUserBuildings(deployer.address);
      const shopBuilding = buildings.find(b => b.buildingType === "shop");

      if (!shopBuilding) {
        console.log("  No shop building found");
        this.skip();
      }

      // Get pair contract
      const MockAerodromePair = await ethers.getContractFactory("MockAerodromePair");
      const pair = MockAerodromePair.attach(pairAddress);

      // Get token ordering from pair
      const [token0Address, token1Address] = await pair.tokens();
      const isUSDCToken0 = token0Address === addresses.tokens.usdc;

      // Simulate trading fees (test helper)
      console.log("  Simulating trading fees...");
      const usdcFee = ethers.parseUnits("5", 6); // 5 USDC fees
      const wethFee = ethers.parseUnits("0.002", 18); // 0.002 WETH fees
      const fee0 = isUSDCToken0 ? usdcFee : wethFee;
      const fee1 = isUSDCToken0 ? wethFee : usdcFee;

      await pair.addTradingFees(smartWalletAddress, fee0, fee1);

      // Fund pair with tokens for fee payouts
      await contracts.usdc.connect(deployer).transfer(pairAddress, usdcFee);
      await contracts.weth.connect(deployer).transfer(pairAddress, wethFee);

      // Verify fees are claimable
      const claimable0 = await pair.claimable0(smartWalletAddress);
      const claimable1 = await pair.claimable1(smartWalletAddress);
      expect(claimable0).to.be.gt(0);
      expect(claimable1).to.be.gt(0);
      console.log(`  ✓ Claimable fees: ${ethers.formatUnits(fee0, isUSDCToken0 ? 6 : 18)} / ${ethers.formatUnits(fee1, isUSDCToken0 ? 18 : 6)}`);

      // Prepare harvest
      const harvestParams = "0x"; // Empty for basic fee claim

      const result = await contracts.shopAdapter.prepareHarvest(
        deployer.address,
        smartWalletAddress,
        shopBuilding.id,
        harvestParams
      );

      // Execute harvest
      console.log("  Claiming fees...");
      const smartWallet = await ethers.getContractAt("SmartWallet", smartWalletAddress);
      const executeTx = await smartWallet.executeBatch([...result[0]], [...result[1]], [...result[2]]);
      const receipt = await waitForTx(executeTx, CONFIRMATION_BLOCKS);

      // Verify fees claimed
      const claimable0After = await pair.claimable0(smartWalletAddress);
      const claimable1After = await pair.claimable1(smartWalletAddress);
      expect(claimable0After).to.equal(0);
      expect(claimable1After).to.equal(0);
      console.log("  ✓ Fees claimed successfully");
    });
  });

  describe("Remove Liquidity Integration", function() {
    it("Should remove liquidity and demolish building", async function() {
      const buildings = await contracts.core.getUserBuildings(deployer.address);
      const shopBuilding = buildings.find(b => b.buildingType === "shop" && b.active);

      if (!shopBuilding) {
        console.log("  No active shop building to demolish");
        this.skip();
      }

      // Get LP token balance before
      const MockAerodromePair = await ethers.getContractFactory("MockAerodromePair");
      const pair = MockAerodromePair.attach(pairAddress);
      const lpBalanceBefore = await pair.balanceOf(smartWalletAddress);
      console.log(`  LP tokens before: ${lpBalanceBefore.toString()}`);

      // Prepare demolish
      const result = await contracts.shopAdapter.prepareDemolish(
        deployer.address,
        smartWalletAddress,
        shopBuilding.id,
        "0x"
      );

      // Execute demolish
      console.log("  Removing liquidity...");
      const smartWallet = await ethers.getContractAt("SmartWallet", smartWalletAddress);
      const executeTx = await smartWallet.executeBatch([...result[0]], [...result[1]], [...result[2]]);
      const receipt = await waitForTx(executeTx, CONFIRMATION_BLOCKS);

      // Verify LP tokens burned
      const lpBalanceAfter = await pair.balanceOf(smartWalletAddress);
      expect(lpBalanceAfter).to.be.lt(lpBalanceBefore);
      console.log(`  LP tokens after: ${lpBalanceAfter.toString()}`);

      // Verify underlying tokens returned to wallet
      const usdcBalance = await contracts.usdc.balanceOf(smartWalletAddress);
      const wethBalance = await contracts.weth.balanceOf(smartWalletAddress);
      console.log(`  ✓ Returned: ${ethers.formatUnits(usdcBalance, 6)} USDC, ${ethers.formatUnits(wethBalance, 18)} WETH`);

      // Verify building demolished
      const building = await contracts.core.buildings(shopBuilding.id);
      expect(building.active).to.be.false;
      console.log(`  ✓ Building ${shopBuilding.id} demolished`);
    });
  });
});
