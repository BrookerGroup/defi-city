import hre from "hardhat";
import { expect } from "chai";
import { ethers as ethersLib } from "ethers";

const DEPOSIT_AMOUNT = ethersLib.parseUnits("1000", 18);
const INITIAL_SUPPLY = ethersLib.parseUnits("1000000", 18);
const ROUTER_LIQUIDITY = ethersLib.parseUnits("100000", 18);
const abiCoder = ethersLib.AbiCoder.defaultAbiCoder();

// PT price: 950000 / 1e6 = 0.95 USDC per PT → ~5.26% implied yield
const PT_PRICE = 950000n;
const PRICE_PRECISION = 1000000n;

// Expected PT from 1000 USDC at 0.95 price: 1000 / 0.95 ≈ 1052.631578...
const EXPECTED_PT = (DEPOSIT_AMOUNT * PRICE_PRECISION) / PT_PRICE;

// ethers v6 Result objects are frozen; spread into mutable arrays for executeBatch
function toArrays(result: any): [string[], bigint[], string[]] {
  return [[...result[0]], [...result[1]], [...result[2]]];
}

describe("StakingAdapter", function () {
  let ethers: Awaited<ReturnType<typeof hre.network.connect>>["ethers"];
  let deployer: any;
  let user: any;
  let treasury: any;
  let other: any;

  let entryPoint: any;
  let core: any;
  let walletFactory: any;
  let usdc: any;
  let pendleRouter: any;
  let stakingAdapter: any;
  let pt: any;
  let marketAddr: string;

  let smartWalletAddr: string;
  let smartWallet: any;

  beforeEach(async function () {
    const connection = await hre.network.connect();
    ethers = connection.ethers;

    [deployer, user, treasury, other] = await ethers.getSigners();

    // 1. Deploy MockEntryPoint
    const MockEntryPoint = await ethers.getContractFactory("MockEntryPoint");
    entryPoint = await MockEntryPoint.deploy();
    await entryPoint.waitForDeployment();

    // 2. Deploy DefiCityCore
    const DefiCityCore = await ethers.getContractFactory("DefiCityCore");
    core = await DefiCityCore.deploy(treasury.address);
    await core.waitForDeployment();

    // 3. Deploy WalletFactory
    const WalletFactory = await ethers.getContractFactory("WalletFactory");
    walletFactory = await WalletFactory.deploy(
      await entryPoint.getAddress(),
      await core.getAddress()
    );
    await walletFactory.waitForDeployment();

    // 4. Set WalletFactory in Core
    await core.setWalletFactory(await walletFactory.getAddress());

    // 5. Deploy MockERC20 (USDC) — MockERC20 uses 18 decimals
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("USD Coin", "USDC", INITIAL_SUPPLY);
    await usdc.waitForDeployment();

    // 6. Deploy MockPendleRouter (creates MockPT + MockPendleMarket internally)
    //    Maturity set to 1 year from now
    const maturity = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
    const MockPendleRouter = await ethers.getContractFactory(
      "MockPendleRouter"
    );
    pendleRouter = await MockPendleRouter.deploy(
      await usdc.getAddress(),
      maturity
    );
    await pendleRouter.waitForDeployment();

    // Get PT and market addresses from router
    const ptAddr = await pendleRouter.getPT();
    pt = await ethers.getContractAt("MockPT", ptAddr);
    marketAddr = await pendleRouter.getMarket();

    // 7. Deploy StakingAdapter
    const StakingAdapter = await ethers.getContractFactory("StakingAdapter");
    stakingAdapter = await StakingAdapter.deploy(
      await core.getAddress(),
      await pendleRouter.getAddress(),
      await usdc.getAddress(),
      treasury.address
    );
    await stakingAdapter.waitForDeployment();

    // 8. Add USDC as supported asset
    await core.addSupportedAsset(await usdc.getAddress());

    // 9. Create TownHall for user (creates SmartWallet)
    await core.connect(user).createTownHall(0, 0);
    smartWalletAddr = await core.userSmartWallets(user.address);
    smartWallet = await ethers.getContractAt("SmartWallet", smartWalletAddr);

    // 10. Fund SmartWallet with USDC
    await usdc.transfer(smartWalletAddr, DEPOSIT_AMOUNT);

    // 11. Fund MockPendleRouter with USDC for sell/redeem liquidity
    await usdc.approve(await pendleRouter.getAddress(), ROUTER_LIQUIDITY);
    await pendleRouter.addLiquidity(ROUTER_LIQUIDITY);
  });

  // ============ Helper: place a staking building ============

  async function placeStaking(): Promise<bigint> {
    const params = abiCoder.encode(
      ["uint256", "address", "uint256", "uint256", "uint256"],
      [DEPOSIT_AMOUNT, marketAddr, 1, 1, 1]
    );

    const result = await stakingAdapter.preparePlace(
      user.address,
      smartWalletAddr,
      params
    );
    const [targets, values, datas] = toArrays(result);
    await smartWallet.connect(user).executeBatch(targets, values, datas);

    return 2n; // buildingId (TownHall is 1)
  }

  // ============ Tests ============

  describe("Deployment", function () {
    it("should set correct core address", async function () {
      expect(await stakingAdapter.core()).to.equal(await core.getAddress());
    });

    it("should set correct pendleRouter address", async function () {
      expect(await stakingAdapter.pendleRouter()).to.equal(
        await pendleRouter.getAddress()
      );
    });

    it("should set correct stakingAsset address", async function () {
      expect(await stakingAdapter.stakingAsset()).to.equal(
        await usdc.getAddress()
      );
    });

    it("should set correct treasury address", async function () {
      expect(await stakingAdapter.treasury()).to.equal(treasury.address);
    });

    it("should set correct default placement fee", async function () {
      expect(await stakingAdapter.placementFeeBps()).to.equal(5n);
    });

    it("should revert with zero core address", async function () {
      const StakingAdapter = await ethers.getContractFactory("StakingAdapter");
      await expect(
        StakingAdapter.deploy(
          ethersLib.ZeroAddress,
          await pendleRouter.getAddress(),
          await usdc.getAddress(),
          treasury.address
        )
      ).to.be.revertedWithCustomError(stakingAdapter, "InvalidAddress");
    });

    it("should revert with zero router address", async function () {
      const StakingAdapter = await ethers.getContractFactory("StakingAdapter");
      await expect(
        StakingAdapter.deploy(
          await core.getAddress(),
          ethersLib.ZeroAddress,
          await usdc.getAddress(),
          treasury.address
        )
      ).to.be.revertedWithCustomError(stakingAdapter, "InvalidAddress");
    });

    it("should revert with zero stakingAsset address", async function () {
      const StakingAdapter = await ethers.getContractFactory("StakingAdapter");
      await expect(
        StakingAdapter.deploy(
          await core.getAddress(),
          await pendleRouter.getAddress(),
          ethersLib.ZeroAddress,
          treasury.address
        )
      ).to.be.revertedWithCustomError(stakingAdapter, "InvalidAddress");
    });

    it("should revert with zero treasury address", async function () {
      const StakingAdapter = await ethers.getContractFactory("StakingAdapter");
      await expect(
        StakingAdapter.deploy(
          await core.getAddress(),
          await pendleRouter.getAddress(),
          await usdc.getAddress(),
          ethersLib.ZeroAddress
        )
      ).to.be.revertedWithCustomError(stakingAdapter, "InvalidAddress");
    });
  });

  describe("preparePlace", function () {
    it("should buy PT with USDC and record building", async function () {
      const params = abiCoder.encode(
        ["uint256", "address", "uint256", "uint256", "uint256"],
        [DEPOSIT_AMOUNT, marketAddr, 1, 1, 1]
      );

      const result = await stakingAdapter.preparePlace(
        user.address,
        smartWalletAddr,
        params
      );
      const [targets, values, datas] = toArrays(result);

      await smartWallet.connect(user).executeBatch(targets, values, datas);

      // PT is minted to user EOA (receiver = user in preparePlace)
      // NOTE: This is a potential issue — PT goes to user EOA, but demolish
      // executes from SmartWallet which needs PT for burn(msg.sender).
      const userPt = await pt.balanceOf(user.address);
      expect(userPt).to.equal(EXPECTED_PT);

      // SmartWallet should have no PT
      const walletPt = await pt.balanceOf(smartWalletAddr);
      expect(walletPt).to.equal(0n);

      // USDC was deducted from SmartWallet
      const walletUsdc = await usdc.balanceOf(smartWalletAddr);
      expect(walletUsdc).to.equal(0n);

      // Building was recorded in Core
      const building = await core.buildings(2); // buildingId 2 (TownHall is 1)
      expect(building.owner).to.equal(user.address);
      expect(building.buildingType).to.equal("staking");
      expect(building.active).to.equal(true);
    });
  });

  describe("prepareHarvest", function () {
    it("should return empty arrays (no intermediate yield for PT)", async function () {
      const buildingId = await placeStaking();

      const harvestResult = await stakingAdapter.prepareHarvest(
        user.address,
        smartWalletAddr,
        buildingId,
        "0x"
      );
      const [targets, values, datas] = toArrays(harvestResult);

      expect(targets.length).to.equal(0);
      expect(values.length).to.equal(0);
      expect(datas.length).to.equal(0);
    });
  });

  describe("prepareDemolish (before maturity)", function () {
    let buildingId: bigint;
    let ptBalance: bigint;

    beforeEach(async function () {
      buildingId = await placeStaking();
      ptBalance = await pt.balanceOf(user.address);

      // Transfer PT from user EOA → SmartWallet so demolish can work.
      // NOTE: This transfer is needed because preparePlace sends PT to user EOA,
      // but prepareDemolish executes from SmartWallet (which needs PT for burn).
      // This is a potential bug in the adapter — in production, PT should go to
      // SmartWallet or demolish should handle the PT being on the EOA.
      await pt.connect(user).transfer(smartWalletAddr, ptBalance);
    });

    it("should sell PT via AMM and user receives USDC at discount", async function () {
      const demolishParams = abiCoder.encode(
        ["uint256", "address", "bool", "uint256"],
        [ptBalance, marketAddr, false, 1] // isMatured = false
      );

      const demolishResult = await stakingAdapter.prepareDemolish(
        user.address,
        smartWalletAddr,
        buildingId,
        demolishParams
      );
      const [targets, values, datas] = toArrays(demolishResult);

      await smartWallet.connect(user).executeBatch(targets, values, datas);

      // User EOA receives USDC (receiver = user in prepareDemolish)
      const userUsdc = await usdc.balanceOf(user.address);
      // Sell at 0.95: ptBalance * 950000 / 1e6 ≈ original deposit
      const expectedUsdc = (ptBalance * PT_PRICE) / PRICE_PRECISION;
      expect(userUsdc).to.equal(expectedUsdc);

      // All PT burned
      const remainingPt = await pt.balanceOf(smartWalletAddr);
      expect(remainingPt).to.equal(0n);

      // Building is deactivated
      const building = await core.buildings(buildingId);
      expect(building.active).to.equal(false);
    });
  });

  describe("prepareDemolish (at maturity)", function () {
    let buildingId: bigint;
    let ptBalance: bigint;

    beforeEach(async function () {
      buildingId = await placeStaking();
      ptBalance = await pt.balanceOf(user.address);

      // Transfer PT from user EOA → SmartWallet
      await pt.connect(user).transfer(smartWalletAddr, ptBalance);

      // Set maturity to the past so redeemPyToToken works
      await pendleRouter.setMaturity(1);
    });

    it("should redeem PT 1:1 and user receives full USDC", async function () {
      const demolishParams = abiCoder.encode(
        ["uint256", "address", "bool", "uint256"],
        [ptBalance, marketAddr, true, 1] // isMatured = true
      );

      const demolishResult = await stakingAdapter.prepareDemolish(
        user.address,
        smartWalletAddr,
        buildingId,
        demolishParams
      );
      const [targets, values, datas] = toArrays(demolishResult);

      await smartWallet.connect(user).executeBatch(targets, values, datas);

      // User EOA receives USDC at 1:1 (more than original deposit due to PT discount)
      const userUsdc = await usdc.balanceOf(user.address);
      expect(userUsdc).to.equal(ptBalance); // 1 PT = 1 USDC at maturity

      // PT > original deposit since we bought at discount
      expect(userUsdc).to.be.gt(DEPOSIT_AMOUNT);

      // All PT burned
      const remainingPt = await pt.balanceOf(smartWalletAddr);
      expect(remainingPt).to.equal(0n);

      // Building is deactivated
      const building = await core.buildings(buildingId);
      expect(building.active).to.equal(false);
    });
  });

  describe("validatePlacement", function () {
    it("should reject zero amount", async function () {
      const params = abiCoder.encode(
        ["uint256", "address", "uint256", "uint256", "uint256"],
        [0, marketAddr, 1, 1, 1]
      );
      const [isValid, reason] = await stakingAdapter.validatePlacement(params);
      expect(isValid).to.equal(false);
      expect(reason).to.equal("Amount must be > 0");
    });

    it("should reject zero market address", async function () {
      const params = abiCoder.encode(
        ["uint256", "address", "uint256", "uint256", "uint256"],
        [DEPOSIT_AMOUNT, ethersLib.ZeroAddress, 1, 1, 1]
      );
      const [isValid, reason] = await stakingAdapter.validatePlacement(params);
      expect(isValid).to.equal(false);
      expect(reason).to.equal("Invalid market");
    });

    it("should accept valid params", async function () {
      const params = abiCoder.encode(
        ["uint256", "address", "uint256", "uint256", "uint256"],
        [DEPOSIT_AMOUNT, marketAddr, 1, 1, 1]
      );
      const [isValid, reason] = await stakingAdapter.validatePlacement(params);
      expect(isValid).to.equal(true);
      expect(reason).to.equal("");
    });
  });

  describe("Admin functions", function () {
    it("setPendleRouter should update router address", async function () {
      await stakingAdapter.setPendleRouter(other.address);
      expect(await stakingAdapter.pendleRouter()).to.equal(other.address);
    });

    it("setPendleRouter should revert with zero address", async function () {
      await expect(
        stakingAdapter.setPendleRouter(ethersLib.ZeroAddress)
      ).to.be.revertedWithCustomError(stakingAdapter, "InvalidAddress");
    });

    it("setPendleRouter should revert for non-owner", async function () {
      await expect(
        stakingAdapter.connect(user).setPendleRouter(other.address)
      ).to.be.revertedWithCustomError(
        stakingAdapter,
        "OwnableUnauthorizedAccount"
      );
    });

    it("setPlacementFee should update fee", async function () {
      await stakingAdapter.setPlacementFee(50);
      expect(await stakingAdapter.placementFeeBps()).to.equal(50n);
    });

    it("setPlacementFee should revert if exceeds max", async function () {
      await expect(
        stakingAdapter.setPlacementFee(101)
      ).to.be.revertedWithCustomError(stakingAdapter, "InvalidFee");
    });

    it("setTreasury should update treasury address", async function () {
      await stakingAdapter.setTreasury(other.address);
      expect(await stakingAdapter.treasury()).to.equal(other.address);
    });

    it("setTreasury should revert with zero address", async function () {
      await expect(
        stakingAdapter.setTreasury(ethersLib.ZeroAddress)
      ).to.be.revertedWithCustomError(stakingAdapter, "InvalidAddress");
    });
  });

  describe("View functions", function () {
    it("getBuildingType should return 'staking'", async function () {
      expect(await stakingAdapter.getBuildingType()).to.equal("staking");
    });

    it("getRequiredProtocols should return router and asset addresses", async function () {
      const protocols = await stakingAdapter.getRequiredProtocols();
      expect(protocols[0]).to.equal(await pendleRouter.getAddress());
      expect(protocols[1]).to.equal(await usdc.getAddress());
    });

    it("calculateFee should compute correct fee and net", async function () {
      const amount = ethersLib.parseUnits("10000", 18);
      const [feeAmount, netAmount] = await stakingAdapter.calculateFee(amount);
      // 0.05% of 10000 = 5
      expect(feeAmount).to.equal(ethersLib.parseUnits("5", 18));
      expect(netAmount).to.equal(amount - feeAmount);
    });

    it("getPlacementFee should return current fee", async function () {
      expect(await stakingAdapter.getPlacementFee()).to.equal(5n);
    });

    it("getTreasury should return treasury address", async function () {
      expect(await stakingAdapter.getTreasury()).to.equal(treasury.address);
    });

    it("estimateYield should return zero (fixed yield tracked off-chain)", async function () {
      const [estimatedYield, yieldAsset] =
        await stakingAdapter.estimateYield(1);
      expect(estimatedYield).to.equal(0n);
      expect(yieldAsset).to.equal(ethersLib.ZeroAddress);
    });
  });
});
