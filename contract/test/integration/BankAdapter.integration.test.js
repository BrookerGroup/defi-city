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

describe("BankAdapter Integration Tests - Base Sepolia", function() {
  // Configuration
  const NETWORK_TIMEOUT = 60000; // 1 minute for testnet transactions
  const CONFIRMATION_BLOCKS = 1;
  const TEST_AMOUNT_USDC = ethers.parseUnits("100", 6); // 100 USDC
  const MIN_ETH = ethers.parseEther("0.01"); // 0.01 ETH minimum

  let deployer;
  let addresses;
  let contracts;
  let smartWalletAddress;

  // Set timeout for all tests
  this.timeout(NETWORK_TIMEOUT * 3);

  before(async function() {
    console.log("\n========================================");
    console.log("  BankAdapter Integration Tests");
    console.log("========================================\n");

    [deployer] = await ethers.getSigners();
    console.log(`Test account: ${deployer.address}`);

    try {
      // Verify network
      await verifyNetwork();

      // Check deployer balance
      const hasBalance = await checkBalance(deployer.address, MIN_ETH);
      if (!hasBalance) {
        console.log("\n⚠️  Skipping tests - insufficient ETH balance");
        this.skip();
      }

      // Load deployments
      console.log("\nLoading deployments...");
      addresses = getAllAddresses();
      const deploymentInfo = getDeploymentInfo();
      console.log(`Core deployed: ${deploymentInfo.coreDeployedAt}`);
      console.log(`Integration deployed: ${deploymentInfo.integrationDeployedAt}`);

      // Verify contracts deployed
      const allDeployed = await verifyAllDeployed(addresses);
      if (!allDeployed) {
        console.log("\n⚠️  Skipping tests - contracts not deployed");
        this.skip();
      }

      // Attach to contracts
      contracts = await attachContracts(addresses);

      // Check token balance
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
    it("Should verify BankAdapter is deployed", async function() {
      expect(addresses.adapters.bank).to.not.equal(ethers.ZeroAddress);

      const code = await ethers.provider.getCode(addresses.adapters.bank);
      expect(code).to.not.equal("0x");
    });

    it("Should verify MockAavePool is deployed and configured", async function() {
      const config = await contracts.mockAave.assetConfigs(addresses.tokens.usdc);
      expect(config.ltv).to.equal(8000); // 80%
      expect(config.liquidationThreshold).to.equal(8500); // 85%
    });

    it("Should verify adapter configuration", async function() {
      const buildingType = await contracts.bankAdapter.getBuildingType();
      expect(buildingType).to.equal("bank");

      const treasury = await contracts.bankAdapter.getTreasury();
      expect(treasury).to.equal(addresses.core.treasury);
    });
  });

  describe("Supply Mode Integration", function() {
    let buildingId;

    it("Should create TownHall and get SmartWallet", async function() {
      // Check if SmartWallet already exists
      smartWalletAddress = await contracts.core.userSmartWallets(deployer.address);

      if (smartWalletAddress === ethers.ZeroAddress) {
        console.log("  Creating Town Hall...");
        const tx = await contracts.core.createTownHall(5, 5);
        const receipt = await waitForTx(tx, CONFIRMATION_BLOCKS);

        smartWalletAddress = await contracts.core.userSmartWallets(deployer.address);
      } else {
        console.log(`  Using existing SmartWallet: ${smartWalletAddress}`);
      }

      expect(smartWalletAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should supply USDC to Aave via SmartWallet", async function() {
      // Fund SmartWallet with USDC
      console.log("  Funding SmartWallet...");
      const fundTx = await contracts.usdc.transfer(smartWalletAddress, TEST_AMOUNT_USDC);
      await waitForTx(fundTx, CONFIRMATION_BLOCKS);

      // Prepare placement parameters (supply mode)
      // PlaceParams: asset, amount, x, y, isBorrowMode, borrowAsset, borrowAmount
      // Use timestamp-based coordinates to avoid GridOccupied errors
      const timestamp = Date.now();
      const xCoord = (timestamp % 100) + 100; // 100-199
      const yCoord = (timestamp % 100) + 200; // 200-299

      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "bool", "address", "uint256"],
        [
          addresses.tokens.usdc, // asset
          TEST_AMOUNT_USDC, // amount
          xCoord, // x coordinate
          yCoord, // y coordinate
          false, // isBorrowMode = false for supply
          ethers.ZeroAddress, // borrowAsset (not used in supply mode)
          0 // borrowAmount = 0 for supply mode
        ]
      );

      // Get batch operations from adapter
      console.log("  Preparing batch operations...");
      const result = await contracts.bankAdapter.preparePlace(
        deployer.address,
        smartWalletAddress,
        placeParams
      );
      const targets = [...result[0]];
      const values = [...result[1]];
      const datas = [...result[2]];

      expect(targets.length).to.equal(3); // approve, supply, recordBuilding

      // Execute batch via SmartWallet
      console.log("  Executing batch...");
      const smartWallet = await ethers.getContractAt("SmartWallet", smartWalletAddress);
      const executeTx = await smartWallet.executeBatch(targets, values, datas);
      const receipt = await waitForTx(executeTx, CONFIRMATION_BLOCKS);

      // Verify aToken balance
      const aTokenBalance = await contracts.mockAave.getATokenBalance(
        addresses.tokens.usdc,
        smartWalletAddress
      );
      expect(aTokenBalance).to.equal(TEST_AMOUNT_USDC);
      console.log(`  ✓ aToken balance: ${ethers.formatUnits(aTokenBalance, 6)} aUSDC`);

      // Verify building recorded
      const buildings = await contracts.core.getUserBuildings(deployer.address);
      expect(buildings.length).to.be.gte(1);

      buildingId = buildings[buildings.length - 1].id;
      console.log(`  ✓ Building ID: ${buildingId}`);
    });

    it("Should verify building state on-chain", async function() {
      const building = await contracts.core.buildings(buildingId);

      expect(building.owner).to.equal(deployer.address);
      expect(building.buildingType).to.equal("bank");
      expect(building.active).to.be.true;
      expect(building.amount).to.equal(TEST_AMOUNT_USDC);
      expect(building.asset).to.equal(addresses.tokens.usdc);
    });
  });

  describe("Borrow Mode Integration", function() {
    it("Should supply collateral and borrow USDC", async function() {
      const collateralAmount = ethers.parseUnits("200", 6); // 200 USDC collateral
      const borrowAmount = ethers.parseUnits("80", 6); // Borrow 80 USDC (40% of collateral)

      // Fund SmartWallet
      console.log("  Funding SmartWallet...");
      const fundTx = await contracts.usdc.transfer(smartWalletAddress, collateralAmount);
      await waitForTx(fundTx, CONFIRMATION_BLOCKS);

      // Prepare borrow mode placement
      // PlaceParams: asset, amount, x, y, isBorrowMode, borrowAsset, borrowAmount
      // Use timestamp-based coordinates to avoid GridOccupied errors
      const timestamp = Date.now();
      const xCoord = (timestamp % 100) + 300; // 300-399
      const yCoord = (timestamp % 100) + 400; // 400-499

      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "bool", "address", "uint256"],
        [
          addresses.tokens.usdc, // asset (collateral)
          collateralAmount, // amount
          xCoord, // x coordinate
          yCoord, // y coordinate
          true, // isBorrowMode = true for borrow
          addresses.tokens.usdc, // borrowAsset
          borrowAmount // borrowAmount
        ]
      );

      // Prepare and execute batch
      const result = await contracts.bankAdapter.preparePlace(
        deployer.address,
        smartWalletAddress,
        placeParams
      );

      const smartWallet = await ethers.getContractAt("SmartWallet", smartWalletAddress);
      const executeTx = await smartWallet.executeBatch([...result[0]], [...result[1]], [...result[2]]);
      const receipt = await waitForTx(executeTx, CONFIRMATION_BLOCKS);

      // Verify borrowed USDC in wallet
      const walletBalance = await contracts.usdc.balanceOf(smartWalletAddress);
      expect(walletBalance).to.be.gte(borrowAmount);
      console.log(`  ✓ Borrowed: ${ethers.formatUnits(borrowAmount, 6)} USDC`);

      // Verify health factor
      const userData = await contracts.mockAave.getUserAccountData(smartWalletAddress);
      expect(userData.healthFactor).to.be.gte(ethers.parseEther("1.5"));
      console.log(`  ✓ Health factor: ${ethers.formatEther(userData.healthFactor)}`);
    });
  });

  describe("Harvest Integration", function() {
    it("Should harvest partial funds from Aave", async function() {
      // Get current supply
      const buildings = await contracts.core.getUserBuildings(deployer.address);
      const supplyBuilding = buildings.find(b => b.buildingType === "bank" && b.active);

      if (!supplyBuilding) {
        this.skip();
      }

      const harvestAmount = ethers.parseUnits("50", 6); // Harvest 50 USDC

      // Prepare harvest
      // HarvestParams: asset, amount
      const harvestParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [addresses.tokens.usdc, harvestAmount]
      );

      const result = await contracts.bankAdapter.prepareHarvest(
        deployer.address,
        smartWalletAddress,
        supplyBuilding.id,
        harvestParams
      );

      // Get initial wallet balance
      const balanceBefore = await contracts.usdc.balanceOf(smartWalletAddress);

      // Execute harvest
      const smartWallet = await ethers.getContractAt("SmartWallet", smartWalletAddress);
      const executeTx = await smartWallet.executeBatch([...result[0]], [...result[1]], [...result[2]]);
      const receipt = await waitForTx(executeTx, CONFIRMATION_BLOCKS);

      // Verify USDC withdrawn to wallet
      const balanceAfter = await contracts.usdc.balanceOf(smartWalletAddress);
      expect(balanceAfter).to.be.gte(balanceBefore + harvestAmount);
      console.log(`  ✓ Harvested ${ethers.formatUnits(balanceAfter - balanceBefore, 6)} USDC`);
    });
  });

  describe("Demolish Integration", function() {
    it("Should withdraw all funds and demolish building", async function() {
      const buildings = await contracts.core.getUserBuildings(deployer.address);
      const activeBuilding = buildings.find(b => b.buildingType === "bank" && b.active);

      if (!activeBuilding) {
        console.log("  No active building to demolish");
        this.skip();
      }

      // Prepare demolish
      // DemolishParams: asset
      const demolishParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [addresses.tokens.usdc]
      );

      const result = await contracts.bankAdapter.prepareDemolish(
        deployer.address,
        smartWalletAddress,
        activeBuilding.id,
        demolishParams
      );

      // Execute demolish
      const smartWallet = await ethers.getContractAt("SmartWallet", smartWalletAddress);
      const executeTx = await smartWallet.executeBatch([...result[0]], [...result[1]], [...result[2]]);
      const receipt = await waitForTx(executeTx, CONFIRMATION_BLOCKS);

      // Verify building demolished
      const building = await contracts.core.buildings(activeBuilding.id);
      expect(building.active).to.be.false;
      console.log(`  ✓ Building ${activeBuilding.id} demolished`);
    });
  });
});
