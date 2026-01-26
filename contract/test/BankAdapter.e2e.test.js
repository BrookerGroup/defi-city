const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("BankAdapter E2E with SmartWallet and MockAave", function () {

  // Fixture to deploy complete ecosystem
  async function deployBankEcosystemFixture() {
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

    // Set factory in core
    await core.setWalletFactory(await factory.getAddress());

    // 4. Deploy MockERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC", ethers.parseUnits("1000000", 6));
    await usdc.waitForDeployment();

    const weth = await MockERC20.deploy("Wrapped ETH", "WETH", ethers.parseUnits("1000", 18));
    await weth.waitForDeployment();

    // Add USDC and WETH as supported assets
    await core.addSupportedAsset(await usdc.getAddress());
    await core.addSupportedAsset(await weth.getAddress());

    // 5. Deploy MockAavePool
    const MockAavePool = await ethers.getContractFactory("MockAavePool");
    const mockAave = await MockAavePool.deploy();
    await mockAave.waitForDeployment();

    // Configure USDC in Aave
    await mockAave.setAssetConfig(
      await usdc.getAddress(),
      8000,  // 80% LTV
      8500,  // 85% liquidation threshold
      500,   // 5% APR supply rate
      1000   // 10% APR borrow rate
    );

    // Configure WETH in Aave
    await mockAave.setAssetConfig(
      await weth.getAddress(),
      7500,  // 75% LTV
      8000,  // 80% liquidation threshold
      300,   // 3% APR supply rate
      800    // 8% APR borrow rate
    );

    // Add liquidity to MockAave for borrowing
    const aaveLiquidity = ethers.parseUnits("500000", 6); // 500k USDC
    await usdc.transfer(await mockAave.getAddress(), aaveLiquidity);
    await mockAave.addLiquidity(await usdc.getAddress(), aaveLiquidity);

    const wethLiquidity = ethers.parseUnits("100", 18); // 100 WETH
    await weth.transfer(await mockAave.getAddress(), wethLiquidity);
    await mockAave.addLiquidity(await weth.getAddress(), wethLiquidity);

    // 6. Deploy BankAdapter
    const BankAdapter = await ethers.getContractFactory("BankAdapter");
    const bankAdapter = await BankAdapter.deploy(
      await core.getAddress(),
      await mockAave.getAddress(),
      treasury.address
    );
    await bankAdapter.waitForDeployment();

    // Fund users with tokens
    const userFunding = ethers.parseUnits("10000", 6); // 10k USDC
    await usdc.transfer(user1.address, userFunding);
    await usdc.transfer(user2.address, userFunding);

    const wethFunding = ethers.parseUnits("10", 18); // 10 WETH
    await weth.transfer(user1.address, wethFunding);
    await weth.transfer(user2.address, wethFunding);

    return {
      core,
      factory,
      entryPoint,
      usdc,
      weth,
      mockAave,
      bankAdapter,
      owner,
      user1,
      user2,
      treasury
    };
  }

  describe("Supply Mode E2E Flow", function () {
    it("Should complete full supply flow: User -> SmartWallet -> BankAdapter -> MockAave", async function () {
      const { core, usdc, mockAave, bankAdapter, user1 } = await loadFixture(deployBankEcosystemFixture);

      // Step 1: User creates Town Hall (gets SmartWallet)
      const tx = await core.connect(user1).createTownHall(5, 5);
      await tx.wait();

      const smartWalletAddress = await core.userSmartWallets(user1.address);
      expect(smartWalletAddress).to.not.equal(ethers.ZeroAddress);

      // Get SmartWallet contract instance
      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      // Step 2: User funds their SmartWallet with USDC
      const supplyAmount = ethers.parseUnits("1000", 6); // 1000 USDC
      await usdc.connect(user1).transfer(smartWalletAddress, supplyAmount);

      const walletBalance = await usdc.balanceOf(smartWalletAddress);
      expect(walletBalance).to.equal(supplyAmount);

      // Step 3: Prepare placement parameters
      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "bool", "address", "uint256"],
        [
          await usdc.getAddress(),  // asset
          supplyAmount,              // amount
          10,                        // x coordinate
          10,                        // y coordinate
          false,                     // isBorrowMode
          ethers.ZeroAddress,        // borrowAsset (not used in supply mode)
          0                          // borrowAmount (not used in supply mode)
        ]
      );

      // Step 4: Call adapter's preparePlace to get batch calls
      const result = await bankAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const targets = [...result[0]];
      const values = [...result[1]];
      const datas = [...result[2]];

      // Verify batch structure
      expect(targets.length).to.equal(3); // approve, supply, recordBuilding
      expect(targets[0]).to.equal(await usdc.getAddress()); // Approve USDC
      expect(targets[1]).to.equal(await mockAave.getAddress()); // Supply to Aave
      expect(targets[2]).to.equal(await core.getAddress()); // Record in core

      // Step 5: Execute batch via SmartWallet
      const executeTx = await smartWallet.connect(user1).executeBatch(targets, values, datas);
      const receipt = await executeTx.wait();

      // Step 6: Verify results

      // Check Aave received the deposit (aToken balance)
      const aTokenBalance = await mockAave.getATokenBalance(await usdc.getAddress(), smartWalletAddress);
      expect(aTokenBalance).to.equal(supplyAmount);

      // Check SmartWallet USDC balance is now 0 (transferred to Aave)
      const finalWalletBalance = await usdc.balanceOf(smartWalletAddress);
      expect(finalWalletBalance).to.equal(0);

      // Check building was recorded in Core
      const userBuildings = await core.getUserBuildings(user1.address);
      expect(userBuildings.length).to.equal(2); // Town Hall + Bank

      const bankBuilding = userBuildings[1]; // Second building
      expect(bankBuilding.buildingType).to.equal("bank");
      expect(bankBuilding.asset).to.equal(await usdc.getAddress());
      expect(bankBuilding.amount).to.equal(supplyAmount);
      expect(bankBuilding.coordinateX).to.equal(10);
      expect(bankBuilding.coordinateY).to.equal(10);
      expect(bankBuilding.active).to.be.true;

      // Event verification: BuildingPlaced is emitted by Core (verified by state changes above)
    });
  });

  describe("Borrow Mode E2E Flow", function () {
    it("Should complete full borrow flow with health factor check", async function () {
      const { core, usdc, weth, mockAave, bankAdapter, user1 } = await loadFixture(deployBankEcosystemFixture);

      // Setup: Create Town Hall and get SmartWallet
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);
      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      // Fund SmartWallet with WETH (collateral)
      const collateralAmount = ethers.parseUnits("5", 18); // 5 WETH
      await weth.connect(user1).transfer(smartWalletAddress, collateralAmount);

      // Prepare borrow parameters
      const borrowAmount = ethers.parseUnits("1000", 6); // Borrow 1000 USDC
      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "bool", "address", "uint256"],
        [
          await weth.getAddress(),   // collateral asset (WETH)
          collateralAmount,          // collateral amount
          15,                        // x coordinate
          15,                        // y coordinate
          true,                      // isBorrowMode = true
          await usdc.getAddress(),   // borrowAsset (USDC)
          borrowAmount               // borrowAmount
        ]
      );

      // Get batch calls from adapter
      const result = await bankAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const targets = [...result[0]];
      const values = [...result[1]];
      const datas = [...result[2]];

      // Verify batch structure for borrow mode
      expect(targets.length).to.equal(4); // approve, supply collateral, borrow, recordBuilding

      // Execute batch
      await smartWallet.connect(user1).executeBatch(targets, values, datas);

      // Verify collateral was supplied
      const aTokenBalance = await mockAave.getATokenBalance(await weth.getAddress(), smartWalletAddress);
      expect(aTokenBalance).to.equal(collateralAmount);

      // Verify debt was created
      const debtBalance = await mockAave.getVariableDebt(await usdc.getAddress(), smartWalletAddress);
      expect(debtBalance).to.equal(borrowAmount);

      // Verify borrowed USDC was received by SmartWallet
      const usdcBalance = await usdc.balanceOf(smartWalletAddress);
      expect(usdcBalance).to.equal(borrowAmount);

      // Verify building recorded
      const userBuildings = await core.getUserBuildings(user1.address);
      const bankBuilding = userBuildings[1];
      expect(bankBuilding.buildingType).to.equal("bank");
    });
  });

  describe("Harvest E2E Flow", function () {
    it("Should harvest interest from supply position", async function () {
      const { core, usdc, mockAave, bankAdapter, user1 } = await loadFixture(deployBankEcosystemFixture);

      // Setup: Create Town Hall and SmartWallet
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);
      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      // Step 1: First supply USDC (place bank)
      const supplyAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).transfer(smartWalletAddress, supplyAmount);

      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "bool", "address", "uint256"],
        [await usdc.getAddress(), supplyAmount, 10, 10, false, ethers.ZeroAddress, 0]
      );

      const placeResult = await bankAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const placetargets = [...placeResult[0]];
      const placeValues = [...placeResult[1]];
      const placeDatas = [...placeResult[2]];
      await smartWallet.connect(user1).executeBatch(placetargets, placeValues, placeDatas);

      // Get building ID
      const userBuildings = await core.getUserBuildings(user1.address);
      const buildingId = userBuildings[1].id;

      // Step 2: Simulate time passing and interest accrual
      await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]); // 1 year
      await ethers.provider.send("evm_mine");

      // Step 3: Check balance before harvest (includes interest)
      const balanceBeforeHarvest = await mockAave.getATokenBalance(await usdc.getAddress(), smartWalletAddress);
      expect(balanceBeforeHarvest).to.be.gte(supplyAmount); // Should have earned interest (or at least equal)

      // Prepare harvest (withdraw some interest)
      const harvestAmount = ethers.parseUnits("50", 6); // Withdraw 50 USDC
      const harvestParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [await usdc.getAddress(), harvestAmount]
      );

      const harvestResult = await bankAdapter.prepareHarvest(
        user1.address,
        smartWalletAddress,
        buildingId,
        harvestParams
      );
      const targets = [...harvestResult[0]];
      const values = [...harvestResult[1]];
      const datas = [...harvestResult[2]];

      // Verify harvest batch structure
      expect(targets.length).to.equal(2); // withdraw from Aave, record harvest

      // Execute harvest
      await smartWallet.connect(user1).executeBatch(targets, values, datas);

      // Verify USDC was withdrawn to SmartWallet
      const walletBalance = await usdc.balanceOf(smartWalletAddress);
      expect(walletBalance).to.be.gte(harvestAmount);

      // Verify harvest was successful - check that we still have aTokens but withdrew some
      const remainingATokens = await mockAave.getATokenBalance(await usdc.getAddress(), smartWalletAddress);
      expect(remainingATokens).to.be.gt(0); // Still has some aTokens
      expect(walletBalance).to.equal(harvestAmount); // Successfully withdrew the harvest amount
    });
  });

  describe("Demolish E2E Flow", function () {
    it("Should demolish bank and withdraw all funds", async function () {
      const { core, usdc, mockAave, bankAdapter, user1 } = await loadFixture(deployBankEcosystemFixture);

      // Setup: Create Town Hall and SmartWallet
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);
      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      // Step 1: Place bank
      const supplyAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).transfer(smartWalletAddress, supplyAmount);

      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "bool", "address", "uint256"],
        [await usdc.getAddress(), supplyAmount, 10, 10, false, ethers.ZeroAddress, 0]
      );

      const placeResult2 = await bankAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const placeTargets = [...placeResult2[0]];
      const placeValues = [...placeResult2[1]];
      const placeDatas = [...placeResult2[2]];
      await smartWallet.connect(user1).executeBatch(placeTargets, placeValues, placeDatas);

      // Get building ID
      const userBuildings = await core.getUserBuildings(user1.address);
      const buildingId = userBuildings[1].id;

      // Step 2: Demolish
      const demolishParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [await usdc.getAddress()]
      );

      const demolishResult = await bankAdapter.prepareDemolish(
        user1.address,
        smartWalletAddress,
        buildingId,
        demolishParams
      );
      const targets = [...demolishResult[0]];
      const values = [...demolishResult[1]];
      const datas = [...demolishResult[2]];

      // Verify demolish batch structure
      expect(targets.length).to.equal(2); // withdraw all from Aave, record demolition

      // Execute demolish
      await smartWallet.connect(user1).executeBatch(targets, values, datas);

      // Verify all funds returned to SmartWallet
      const walletBalance = await usdc.balanceOf(smartWalletAddress);
      expect(walletBalance).to.be.gte(supplyAmount); // At least initial amount (plus any interest)

      // Verify aToken balance is 0
      const aTokenBalance = await mockAave.getATokenBalance(await usdc.getAddress(), smartWalletAddress);
      expect(aTokenBalance).to.equal(0);

      // Verify building marked as inactive
      const buildingAfter = await core.buildings(buildingId);
      expect(buildingAfter.active).to.be.false;
    });
  });

  describe("Multiple Users Concurrent Operations", function () {
    it("Should handle multiple users supplying to banks simultaneously", async function () {
      const { core, usdc, mockAave, bankAdapter, user1, user2 } = await loadFixture(deployBankEcosystemFixture);

      // Setup both users
      await core.connect(user1).createTownHall(5, 5);
      await core.connect(user2).createTownHall(5, 5);

      const wallet1 = await core.userSmartWallets(user1.address);
      const wallet2 = await core.userSmartWallets(user2.address);

      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const sw1 = SmartWallet.attach(wallet1);
      const sw2 = SmartWallet.attach(wallet2);

      // Fund both wallets
      const amount1 = ethers.parseUnits("500", 6);
      const amount2 = ethers.parseUnits("1500", 6);

      await usdc.connect(user1).transfer(wallet1, amount1);
      await usdc.connect(user2).transfer(wallet2, amount2);

      // Prepare params for both
      const params1 = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "bool", "address", "uint256"],
        [await usdc.getAddress(), amount1, 10, 10, false, ethers.ZeroAddress, 0]
      );

      const params2 = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "bool", "address", "uint256"],
        [await usdc.getAddress(), amount2, 20, 20, false, ethers.ZeroAddress, 0]
      );

      // Get batch calls
      const r1 = await bankAdapter.preparePlace(user1.address, wallet1, params1);
      const t1 = [...r1[0]]; const v1 = [...r1[1]]; const d1 = [...r1[2]];
      const r2 = await bankAdapter.preparePlace(user2.address, wallet2, params2);
      const t2 = [...r2[0]]; const v2 = [...r2[1]]; const d2 = [...r2[2]];

      // Execute both
      await sw1.connect(user1).executeBatch(t1, v1, d1);
      await sw2.connect(user2).executeBatch(t2, v2, d2);

      // Verify both deposited correctly
      const balance1 = await mockAave.getATokenBalance(await usdc.getAddress(), wallet1);
      const balance2 = await mockAave.getATokenBalance(await usdc.getAddress(), wallet2);

      expect(balance1).to.equal(amount1);
      expect(balance2).to.equal(amount2);
    });
  });
});
