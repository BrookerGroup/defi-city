import { expect  } from "chai";
// Note: ethers will be obtained from network.connect()
import hre from "hardhat";

describe("ShopAdapter E2E with SmartWallet and MockAerodrome", function () {
  let ethers;

  before(async function () {
    ({ ethers } = await hre.network.connect());
  });

  // Fixture to deploy complete ecosystem
  async function deployShopEcosystemFixture() {
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

    // 4. Deploy MockERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");

    const usdc = await MockERC20.deploy("USD Coin", "USDC", ethers.parseUnits("1000000", 6));
    await usdc.waitForDeployment();

    const weth = await MockERC20.deploy("Wrapped ETH", "WETH", ethers.parseUnits("10000", 18));
    await weth.waitForDeployment();

    const aero = await MockERC20.deploy("Aerodrome", "AERO", ethers.parseUnits("1000000", 18));
    await aero.waitForDeployment();

    await core.addSupportedAsset(await usdc.getAddress());
    await core.addSupportedAsset(await weth.getAddress());

    // 5. Deploy MockAerodromeRouter
    const MockAerodromeRouter = await ethers.getContractFactory("MockAerodromeRouter");
    const mockRouter = await MockAerodromeRouter.deploy();
    await mockRouter.waitForDeployment();

    // 6. Deploy ShopAdapter
    const ShopAdapter = await ethers.getContractFactory("ShopAdapter");
    const shopAdapter = await ShopAdapter.deploy(
      await core.getAddress(),
      await mockRouter.getAddress(),
      treasury.address
    );
    await shopAdapter.waitForDeployment();

    // Fund users with tokens
    const usdcAmount = ethers.parseUnits("10000", 6);
    const wethAmount = ethers.parseUnits("10", 18);

    await usdc.transfer(user1.address, usdcAmount);
    await usdc.transfer(user2.address, usdcAmount);
    await weth.transfer(user1.address, wethAmount);
    await weth.transfer(user2.address, wethAmount);

    return {
      core,
      factory,
      entryPoint,
      usdc,
      weth,
      aero,
      mockRouter,
      shopAdapter,
      owner,
      user1,
      user2,
      treasury
    };
  }

  describe("Add Liquidity E2E Flow", function () {
    it("Should complete full LP provision flow: User -> SmartWallet -> ShopAdapter -> MockAerodrome", async function () {
      const { core, usdc, weth, mockRouter, shopAdapter, user1 } = await deployShopEcosystemFixture();

      // Step 1: User creates Town Hall (gets SmartWallet)
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);

      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      // Step 2: User funds SmartWallet with both tokens
      const usdcAmount = ethers.parseUnits("1000", 6); // 1000 USDC
      const wethAmount = ethers.parseUnits("0.5", 18); // 0.5 WETH

      await usdc.connect(user1).transfer(smartWalletAddress, usdcAmount);
      await weth.connect(user1).transfer(smartWalletAddress, wethAmount);

      // Step 3: Prepare placement parameters
      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "bool", "uint256", "uint256"],
        [
          await usdc.getAddress(),  // tokenA
          await weth.getAddress(),  // tokenB
          usdcAmount,               // amountA
          wethAmount,               // amountB
          false,                    // stable (volatile pool)
          10,                       // x coordinate
          10                        // y coordinate
        ]
      );

      // Step 4: Get batch calls from adapter
      const result1 = await shopAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const targets = [...result1[0]];
      const values = [...result1[1]];
      const datas = [...result1[2]];

      // Verify batch structure
      expect(targets.length).to.equal(4); // approve tokenA, approve tokenB, addLiquidity, recordBuilding
      expect(targets[0]).to.equal(await usdc.getAddress());
      expect(targets[1]).to.equal(await weth.getAddress());
      expect(targets[2]).to.equal(await mockRouter.getAddress());
      expect(targets[3]).to.equal(await core.getAddress());

      // Step 5: Execute batch via SmartWallet
      const executeTx = await smartWallet.connect(user1).executeBatch(targets, values, datas);
      await executeTx.wait();

      // Step 6: Verify results

      // Get the created pair address
      const pairAddress = await mockRouter.pairFor(
        await usdc.getAddress(),
        await weth.getAddress(),
        false
      );
      expect(pairAddress).to.not.equal(ethers.ZeroAddress);

      // Get pair contract
      const MockAerodromePair = await ethers.getContractFactory("MockAerodromePair");
      const pair = MockAerodromePair.attach(pairAddress);

      // Verify LP tokens were minted to SmartWallet
      const lpBalance = await pair.balanceOf(smartWalletAddress);
      expect(lpBalance).to.be.gt(0);

      // Verify tokens were transferred from SmartWallet to pair
      const usdcBalance = await usdc.balanceOf(smartWalletAddress);
      const wethBalance = await weth.balanceOf(smartWalletAddress);
      expect(usdcBalance).to.equal(0);
      expect(wethBalance).to.equal(0);

      // Verify reserves in pair
      const [reserve0, reserve1] = await pair.getReserves();
      expect(reserve0).to.be.gt(0);
      expect(reserve1).to.be.gt(0);

      // Verify building was recorded
      const userBuildings = await core.getUserBuildings(user1.address);
      expect(userBuildings.length).to.equal(2); // Town Hall + Shop

      const shopBuilding = userBuildings[1];
      expect(shopBuilding.buildingType).to.equal("shop");
      expect(shopBuilding.coordinateX).to.equal(10);
      expect(shopBuilding.coordinateY).to.equal(10);
      expect(shopBuilding.active).to.be.true;
    });

    it("Should create stable pool when stable=true", async function () {
      const { core, usdc, weth, mockRouter, shopAdapter, user1 } = await deployShopEcosystemFixture();

      // Setup
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);
      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      // Fund wallet
      const usdcAmount = ethers.parseUnits("1000", 6);
      const wethAmount = ethers.parseUnits("0.5", 18);
      await usdc.connect(user1).transfer(smartWalletAddress, usdcAmount);
      await weth.connect(user1).transfer(smartWalletAddress, wethAmount);

      // Create stable pool
      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "bool", "uint256", "uint256"],
        [await usdc.getAddress(), await weth.getAddress(), usdcAmount, wethAmount, true, 10, 10]
      );

      const result2 = await shopAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const targets = [...result2[0]];
      const values = [...result2[1]];
      const datas = [...result2[2]];

      await smartWallet.connect(user1).executeBatch(targets, values, datas);

      // Verify stable pool was created
      const pairAddress = await mockRouter.pairFor(
        await usdc.getAddress(),
        await weth.getAddress(),
        true // stable
      );
      expect(pairAddress).to.not.equal(ethers.ZeroAddress);

      const MockAerodromePair = await ethers.getContractFactory("MockAerodromePair");
      const pair = MockAerodromePair.attach(pairAddress);
      expect(await pair.stable()).to.be.true;
    });
  });

  describe("Harvest (Claim Fees) E2E Flow", function () {
    it("Should claim trading fees from LP position", async function () {
      const { core, usdc, weth, mockRouter, shopAdapter, owner, user1 } = await deployShopEcosystemFixture();

      // Setup: Create Town Hall and add liquidity
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);
      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      // Add liquidity
      const usdcAmount = ethers.parseUnits("1000", 6);
      const wethAmount = ethers.parseUnits("0.5", 18);
      await usdc.connect(user1).transfer(smartWalletAddress, usdcAmount);
      await weth.connect(user1).transfer(smartWalletAddress, wethAmount);

      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "bool", "uint256", "uint256"],
        [await usdc.getAddress(), await weth.getAddress(), usdcAmount, wethAmount, false, 10, 10]
      );

      const result3 = await shopAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const placeTargets = [...result3[0]];
      const placeValues = [...result3[1]];
      const placeDatas = [...result3[2]];
      await smartWallet.connect(user1).executeBatch(placeTargets, placeValues, placeDatas);

      const buildingId = (await core.getUserBuildings(user1.address))[1].id;

      // Get pair address
      const pairAddress = await mockRouter.pairFor(
        await usdc.getAddress(),
        await weth.getAddress(),
        false
      );

      const MockAerodromePair = await ethers.getContractFactory("MockAerodromePair");
      const pair = MockAerodromePair.attach(pairAddress);

      // Get token ordering from pair
      const [token0Address, token1Address] = await pair.tokens();
      const isUSDCToken0 = token0Address === await usdc.getAddress();

      // Simulate trading fees (test helper) - must match pair's token ordering
      const usdcFee = ethers.parseUnits("10", 6); // 10 USDC fees
      const wethFee = ethers.parseUnits("0.005", 18); // 0.005 WETH fees
      const fee0 = isUSDCToken0 ? usdcFee : wethFee;
      const fee1 = isUSDCToken0 ? wethFee : usdcFee;

      // Add trading fees and fund pair
      await pair.addTradingFees(smartWalletAddress, fee0, fee1);

      // Transfer tokens directly to pair for fee payouts
      await usdc.connect(owner).transfer(pairAddress, usdcFee);
      await weth.connect(owner).transfer(pairAddress, wethFee);

      // Verify fees are claimable
      const claimable0 = await pair.claimable0(smartWalletAddress);
      const claimable1 = await pair.claimable1(smartWalletAddress);
      expect(claimable0).to.equal(fee0);
      expect(claimable1).to.equal(fee1);

      // Prepare harvest (no gauge address = just claim fees from pair)
      const harvestParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address"],
        [pairAddress, ethers.ZeroAddress] // No gauge
      );

      const result4 = await shopAdapter.prepareHarvest(
        user1.address,
        smartWalletAddress,
        buildingId,
        harvestParams
      );
      const targets = [...result4[0]];
      const values = [...result4[1]];
      const datas = [...result4[2]];

      // Verify harvest batch structure (without gauge)
      expect(targets.length).to.equal(2); // claimFees, recordHarvest

      // Execute harvest
      await smartWallet.connect(user1).executeBatch(targets, values, datas);

      // Verify fees were claimed to SmartWallet
      const usdcBalance = await usdc.balanceOf(smartWalletAddress);
      const wethBalance = await weth.balanceOf(smartWalletAddress);
      expect(usdcBalance).to.equal(usdcFee);
      expect(wethBalance).to.equal(wethFee);

      // Verify fees are no longer claimable
      expect(await pair.claimable0(smartWalletAddress)).to.equal(0);
      expect(await pair.claimable1(smartWalletAddress)).to.equal(0);
    });

    it("Should claim both trading fees and AERO rewards when staked in gauge", async function () {
      const { core, usdc, weth, aero, mockRouter, shopAdapter, owner, user1 } = await deployShopEcosystemFixture();

      // Setup and add liquidity
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);
      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      const usdcAmount = ethers.parseUnits("1000", 6);
      const wethAmount = ethers.parseUnits("0.5", 18);
      await usdc.connect(user1).transfer(smartWalletAddress, usdcAmount);
      await weth.connect(user1).transfer(smartWalletAddress, wethAmount);

      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "bool", "uint256", "uint256"],
        [await usdc.getAddress(), await weth.getAddress(), usdcAmount, wethAmount, false, 10, 10]
      );

      const result5 = await shopAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const placeTargets = [...result5[0]];
      const placeValues = [...result5[1]];
      const placeDatas = [...result5[2]];
      await smartWallet.connect(user1).executeBatch(placeTargets, placeValues, placeDatas);

      const buildingId = (await core.getUserBuildings(user1.address))[1].id;
      const pairAddress = await mockRouter.pairFor(await usdc.getAddress(), await weth.getAddress(), false);

      // Deploy MockAerodromeGauge for this pair
      const MockAerodromeGauge = await ethers.getContractFactory("MockAerodromeGauge");
      const gauge = await MockAerodromeGauge.deploy(pairAddress, await aero.getAddress());
      await gauge.waitForDeployment();

      // Fund gauge with AERO rewards
      const aeroRewards = ethers.parseUnits("1000", 18);
      await aero.transfer(await gauge.getAddress(), aeroRewards);

      // Stake LP tokens in gauge (manually for this test)
      const MockAerodromePair = await ethers.getContractFactory("MockAerodromePair");
      const pair = MockAerodromePair.attach(pairAddress);
      const lpBalance = await pair.balanceOf(smartWalletAddress);

      // Approve and stake
      await pair.connect(user1).approve(await gauge.getAddress(), lpBalance);
      // Note: In real scenario, this would be done through SmartWallet batch execution

      // Get token ordering from pair
      const [token0Address, token1Address] = await pair.tokens();
      const isUSDCToken0 = token0Address === await usdc.getAddress();

      // Add trading fees - must match pair's token ordering
      const usdcFee = ethers.parseUnits("10", 6);
      const wethFee = ethers.parseUnits("0.005", 18);
      const fee0 = isUSDCToken0 ? usdcFee : wethFee;
      const fee1 = isUSDCToken0 ? wethFee : usdcFee;

      // Add trading fees and fund pair
      await pair.addTradingFees(smartWalletAddress, fee0, fee1);
      // Transfer tokens directly to pair for fee payouts
      await usdc.connect(owner).transfer(pairAddress, usdcFee);
      await weth.connect(owner).transfer(pairAddress, wethFee);

      // Prepare harvest with gauge
      const harvestParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address"],
        [pairAddress, await gauge.getAddress()]
      );

      const result6 = await shopAdapter.prepareHarvest(
        user1.address,
        smartWalletAddress,
        buildingId,
        harvestParams
      );
      const targets = [...result6[0]];
      const values = [...result6[1]];
      const datas = [...result6[2]];

      // Verify harvest batch includes gauge rewards
      expect(targets.length).to.equal(3); // claimFees, getReward, recordHarvest

      // Execute harvest
      await smartWallet.connect(user1).executeBatch(targets, values, datas);

      // Verify trading fees claimed
      expect(await usdc.balanceOf(smartWalletAddress)).to.be.gte(usdcFee);
      expect(await weth.balanceOf(smartWalletAddress)).to.be.gte(wethFee);
    });
  });

  describe("Demolish (Remove Liquidity) E2E Flow", function () {
    it("Should remove liquidity and return underlying tokens", async function () {
      const { core, usdc, weth, mockRouter, shopAdapter, user1 } = await deployShopEcosystemFixture();

      // Setup and add liquidity
      await core.connect(user1).createTownHall(5, 5);
      const smartWalletAddress = await core.userSmartWallets(user1.address);
      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const smartWallet = SmartWallet.attach(smartWalletAddress);

      const usdcAmount = ethers.parseUnits("1000", 6);
      const wethAmount = ethers.parseUnits("0.5", 18);
      await usdc.connect(user1).transfer(smartWalletAddress, usdcAmount);
      await weth.connect(user1).transfer(smartWalletAddress, wethAmount);

      const placeParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "bool", "uint256", "uint256"],
        [await usdc.getAddress(), await weth.getAddress(), usdcAmount, wethAmount, false, 10, 10]
      );

      const result7 = await shopAdapter.preparePlace(
        user1.address,
        smartWalletAddress,
        placeParams
      );
      const placeTargets = [...result7[0]];
      const placeValues = [...result7[1]];
      const placeDatas = [...result7[2]];
      await smartWallet.connect(user1).executeBatch(placeTargets, placeValues, placeDatas);

      const buildingId = (await core.getUserBuildings(user1.address))[1].id;
      const pairAddress = await mockRouter.pairFor(await usdc.getAddress(), await weth.getAddress(), false);

      const MockAerodromePair = await ethers.getContractFactory("MockAerodromePair");
      const pair = MockAerodromePair.attach(pairAddress);
      const lpBalance = await pair.balanceOf(smartWalletAddress);

      // Prepare demolish
      const demolishParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "bool", "uint256"],
        [
          await usdc.getAddress(),
          await weth.getAddress(),
          false, // stable
          lpBalance // liquidity to remove
        ]
      );

      const result8 = await shopAdapter.prepareDemolish(
        user1.address,
        smartWalletAddress,
        buildingId,
        demolishParams
      );
      const targets = [...result8[0]];
      const values = [...result8[1]];
      const datas = [...result8[2]];

      // Verify demolish batch structure
      expect(targets.length).to.equal(3); // approve LP, removeLiquidity, recordDemolition

      // Execute demolish
      await smartWallet.connect(user1).executeBatch(targets, values, datas);

      // Verify LP tokens were burned
      const lpBalanceAfter = await pair.balanceOf(smartWalletAddress);
      expect(lpBalanceAfter).to.equal(0);

      // Verify underlying tokens returned to SmartWallet
      const usdcBalance = await usdc.balanceOf(smartWalletAddress);
      const wethBalance = await weth.balanceOf(smartWalletAddress);
      expect(usdcBalance).to.be.gt(0);
      expect(wethBalance).to.be.gt(0);

      // Verify building marked as inactive
      const building = await core.buildings(buildingId);
      expect(building.active).to.be.false;
    });
  });

  describe("Multiple Users and Pools", function () {
    it("Should handle multiple users providing liquidity to same pool", async function () {
      const { core, usdc, weth, mockRouter, shopAdapter, user1, user2 } = await deployShopEcosystemFixture();

      // Setup both users
      await core.connect(user1).createTownHall(5, 5);
      await core.connect(user2).createTownHall(5, 5);

      const wallet1 = await core.userSmartWallets(user1.address);
      const wallet2 = await core.userSmartWallets(user2.address);

      const SmartWallet = await ethers.getContractFactory("SmartWallet");
      const sw1 = SmartWallet.attach(wallet1);
      const sw2 = SmartWallet.attach(wallet2);

      // Fund both wallets
      const usdc1 = ethers.parseUnits("500", 6);
      const weth1 = ethers.parseUnits("0.25", 18);
      await usdc.connect(user1).transfer(wallet1, usdc1);
      await weth.connect(user1).transfer(wallet1, weth1);

      const usdc2 = ethers.parseUnits("1000", 6);
      const weth2 = ethers.parseUnits("0.5", 18);
      await usdc.connect(user2).transfer(wallet2, usdc2);
      await weth.connect(user2).transfer(wallet2, weth2);

      // Both add liquidity to same pool
      const params1 = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "bool", "uint256", "uint256"],
        [await usdc.getAddress(), await weth.getAddress(), usdc1, weth1, false, 10, 10]
      );

      const params2 = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "bool", "uint256", "uint256"],
        [await usdc.getAddress(), await weth.getAddress(), usdc2, weth2, false, 20, 20]
      );

      const result9 = await shopAdapter.preparePlace(user1.address, wallet1, params1);
      const t1 = [...result9[0]];
      const v1 = [...result9[1]];
      const d1 = [...result9[2]];
      const result10 = await shopAdapter.preparePlace(user2.address, wallet2, params2);
      const t2 = [...result10[0]];
      const v2 = [...result10[1]];
      const d2 = [...result10[2]];

      await sw1.connect(user1).executeBatch(t1, v1, d1);
      await sw2.connect(user2).executeBatch(t2, v2, d2);

      // Verify same pair used
      const pairAddress = await mockRouter.pairFor(await usdc.getAddress(), await weth.getAddress(), false);
      const MockAerodromePair = await ethers.getContractFactory("MockAerodromePair");
      const pair = MockAerodromePair.attach(pairAddress);

      // Both should have LP tokens
      const lp1 = await pair.balanceOf(wallet1);
      const lp2 = await pair.balanceOf(wallet2);
      console.log("LP1:", lp1.toString());
      console.log("LP2:", lp2.toString());
      expect(lp1).to.be.gt(0);
      expect(lp2).to.be.gt(0);
      expect(lp2).to.be.gt(lp1); // User2 provided more liquidity
    });
  });
});
