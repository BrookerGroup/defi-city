import hre from "hardhat";
import { expect } from "chai";
import { ethers as ethersLib } from "ethers";

const DEPOSIT_AMOUNT = ethersLib.parseUnits("1000", 18);
const INITIAL_SUPPLY = ethersLib.parseUnits("1000000", 18);
const abiCoder = ethersLib.AbiCoder.defaultAbiCoder();

// ethers v6 Result objects are frozen; spread into mutable arrays for executeBatch
function toArrays(result: any): [string[], bigint[], string[]] {
  return [[...result[0]], [...result[1]], [...result[2]]];
}

describe("VaultAdapter", function () {
  let ethers: Awaited<ReturnType<typeof hre.network.connect>>["ethers"];
  let deployer: any;
  let user: any;
  let treasury: any;
  let other: any;

  let entryPoint: any;
  let core: any;
  let walletFactory: any;
  let usdc: any;
  let morphoVault: any;
  let vaultAdapter: any;

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

    // 5. Deploy MockERC20 (USDC)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("USD Coin", "USDC", INITIAL_SUPPLY);
    await usdc.waitForDeployment();

    // 6. Deploy MockMorphoVault
    const MockMorphoVault = await ethers.getContractFactory("MockMorphoVault");
    morphoVault = await MockMorphoVault.deploy(await usdc.getAddress());
    await morphoVault.waitForDeployment();

    // 7. Deploy VaultAdapter
    const VaultAdapter = await ethers.getContractFactory("VaultAdapter");
    vaultAdapter = await VaultAdapter.deploy(
      await core.getAddress(),
      await morphoVault.getAddress(),
      await usdc.getAddress(),
      treasury.address
    );
    await vaultAdapter.waitForDeployment();

    // 8. Add USDC as supported asset
    await core.addSupportedAsset(await usdc.getAddress());

    // 9. Create TownHall for user (creates SmartWallet)
    await core.connect(user).createTownHall(0, 0);
    smartWalletAddr = await core.userSmartWallets(user.address);
    smartWallet = await ethers.getContractAt("SmartWallet", smartWalletAddr);

    // 10. Fund SmartWallet with USDC (deployer has initial supply)
    await usdc.transfer(smartWalletAddr, DEPOSIT_AMOUNT);
  });

  describe("Deployment", function () {
    it("should set correct core address", async function () {
      expect(await vaultAdapter.core()).to.equal(await core.getAddress());
    });

    it("should set correct morphoVault address", async function () {
      expect(await vaultAdapter.morphoVault()).to.equal(
        await morphoVault.getAddress()
      );
    });

    it("should set correct vaultAsset address", async function () {
      expect(await vaultAdapter.vaultAsset()).to.equal(
        await usdc.getAddress()
      );
    });

    it("should set correct treasury address", async function () {
      expect(await vaultAdapter.treasury()).to.equal(treasury.address);
    });

    it("should set correct default placement fee", async function () {
      expect(await vaultAdapter.placementFeeBps()).to.equal(5n);
    });

    it("should revert with zero core address", async function () {
      const VaultAdapter = await ethers.getContractFactory("VaultAdapter");
      await expect(
        VaultAdapter.deploy(
          ethersLib.ZeroAddress,
          await morphoVault.getAddress(),
          await usdc.getAddress(),
          treasury.address
        )
      ).to.be.revertedWithCustomError(vaultAdapter, "InvalidAddress");
    });

    it("should revert with zero vault address", async function () {
      const VaultAdapter = await ethers.getContractFactory("VaultAdapter");
      await expect(
        VaultAdapter.deploy(
          await core.getAddress(),
          ethersLib.ZeroAddress,
          await usdc.getAddress(),
          treasury.address
        )
      ).to.be.revertedWithCustomError(vaultAdapter, "InvalidAddress");
    });
  });

  describe("preparePlace", function () {
    it("should deposit USDC and SmartWallet receives vault shares", async function () {
      const params = abiCoder.encode(
        ["uint256", "uint256", "uint256"],
        [DEPOSIT_AMOUNT, 1, 1]
      );

      const result = await vaultAdapter.preparePlace(
        user.address,
        smartWalletAddr,
        params
      );
      const [targets, values, datas] = toArrays(result);

      await smartWallet.connect(user).executeBatch(targets, values, datas);

      // Verify SmartWallet received vault shares (not user EOA)
      const walletShares = await morphoVault.balanceOf(smartWalletAddr);
      const userShares = await morphoVault.balanceOf(user.address);
      expect(walletShares).to.be.gt(0n);
      expect(userShares).to.equal(0n);

      // Verify USDC was transferred out of SmartWallet
      const walletUsdcBalance = await usdc.balanceOf(smartWalletAddr);
      expect(walletUsdcBalance).to.equal(0n);

      // Verify building was recorded in Core
      const building = await core.buildings(2); // buildingId 2 (TownHall is 1)
      expect(building.owner).to.equal(user.address);
      expect(building.buildingType).to.equal("vault");
      expect(building.active).to.equal(true);
    });
  });

  describe("simulateYield", function () {
    it("should increase share value after yield injection", async function () {
      // First deposit
      const params = abiCoder.encode(
        ["uint256", "uint256", "uint256"],
        [DEPOSIT_AMOUNT, 1, 1]
      );
      const result = await vaultAdapter.preparePlace(
        user.address,
        smartWalletAddr,
        params
      );
      const [targets, values, datas] = toArrays(result);
      await smartWallet.connect(user).executeBatch(targets, values, datas);

      const sharesBefore = await morphoVault.balanceOf(smartWalletAddr);
      const redeemableBefore = await morphoVault.previewRedeem(sharesBefore);

      // Inject yield into vault
      const yieldAmount = ethersLib.parseUnits("100", 18);
      await usdc.approve(await morphoVault.getAddress(), yieldAmount);
      await morphoVault.simulateYield(yieldAmount);

      // Same shares should now be worth more
      const redeemableAfter = await morphoVault.previewRedeem(sharesBefore);
      expect(redeemableAfter).to.be.gt(redeemableBefore);
    });
  });

  describe("prepareHarvest", function () {
    let buildingId: bigint;
    let sharesAfterDeposit: bigint;

    beforeEach(async function () {
      const params = abiCoder.encode(
        ["uint256", "uint256", "uint256"],
        [DEPOSIT_AMOUNT, 1, 1]
      );
      const placeResult = await vaultAdapter.preparePlace(
        user.address,
        smartWalletAddr,
        params
      );
      const [t, v, d] = toArrays(placeResult);
      await smartWallet.connect(user).executeBatch(t, v, d);

      buildingId = 2n;
      sharesAfterDeposit = await morphoVault.balanceOf(smartWalletAddr);

      // Inject yield
      const yieldAmount = ethersLib.parseUnits("100", 18);
      await usdc.approve(await morphoVault.getAddress(), yieldAmount);
      await morphoVault.simulateYield(yieldAmount);
    });

    it("should partial redeem and SmartWallet receives USDC", async function () {
      const sharesToRedeem = sharesAfterDeposit / 2n;
      const harvestParams = abiCoder.encode(["uint256"], [sharesToRedeem]);

      const harvestResult = await vaultAdapter.prepareHarvest(
        user.address,
        smartWalletAddr,
        buildingId,
        harvestParams
      );
      const [targets, values, datas] = toArrays(harvestResult);

      const walletUsdcBefore = await usdc.balanceOf(smartWalletAddr);

      await smartWallet.connect(user).executeBatch(targets, values, datas);

      // SmartWallet received USDC (not user EOA)
      const walletUsdcAfter = await usdc.balanceOf(smartWalletAddr);
      const userUsdc = await usdc.balanceOf(user.address);
      expect(walletUsdcAfter).to.be.gt(walletUsdcBefore);
      expect(userUsdc).to.equal(0n);

      // Remaining shares still in SmartWallet
      const remainingShares = await morphoVault.balanceOf(smartWalletAddr);
      expect(remainingShares).to.be.gt(0n);
      expect(remainingShares).to.be.lt(sharesAfterDeposit);
    });
  });

  describe("prepareDemolish", function () {
    let buildingId: bigint;
    let sharesAfterDeposit: bigint;

    beforeEach(async function () {
      const params = abiCoder.encode(
        ["uint256", "uint256", "uint256"],
        [DEPOSIT_AMOUNT, 1, 1]
      );
      const placeResult = await vaultAdapter.preparePlace(
        user.address,
        smartWalletAddr,
        params
      );
      const [t, v, d] = toArrays(placeResult);
      await smartWallet.connect(user).executeBatch(t, v, d);

      buildingId = 2n;
      sharesAfterDeposit = await morphoVault.balanceOf(smartWalletAddr);
    });

    it("should full redeem and SmartWallet receives all USDC", async function () {
      const demolishParams = abiCoder.encode(
        ["uint256"],
        [sharesAfterDeposit]
      );

      const demolishResult = await vaultAdapter.prepareDemolish(
        user.address,
        smartWalletAddr,
        buildingId,
        demolishParams
      );
      const [targets, values, datas] = toArrays(demolishResult);

      await smartWallet.connect(user).executeBatch(targets, values, datas);

      // SmartWallet received all USDC back
      const walletUsdc = await usdc.balanceOf(smartWalletAddr);
      expect(walletUsdc).to.equal(DEPOSIT_AMOUNT);

      // No shares remain
      const remainingShares = await morphoVault.balanceOf(smartWalletAddr);
      expect(remainingShares).to.equal(0n);

      // User EOA got nothing
      expect(await usdc.balanceOf(user.address)).to.equal(0n);

      // Building is deactivated
      const building = await core.buildings(buildingId);
      expect(building.active).to.equal(false);
    });
  });

  describe("validatePlacement", function () {
    it("should reject zero amount", async function () {
      const params = abiCoder.encode(
        ["uint256", "uint256", "uint256"],
        [0, 1, 1]
      );
      const [isValid, reason] = await vaultAdapter.validatePlacement(params);
      expect(isValid).to.equal(false);
      expect(reason).to.equal("Amount must be > 0");
    });

    it("should accept valid amount", async function () {
      const params = abiCoder.encode(
        ["uint256", "uint256", "uint256"],
        [DEPOSIT_AMOUNT, 1, 1]
      );
      const [isValid, reason] = await vaultAdapter.validatePlacement(params);
      expect(isValid).to.equal(true);
      expect(reason).to.equal("");
    });
  });

  describe("Admin functions", function () {
    it("setMorphoVault should update vault address", async function () {
      await vaultAdapter.setMorphoVault(other.address);
      expect(await vaultAdapter.morphoVault()).to.equal(other.address);
    });

    it("setMorphoVault should revert with zero address", async function () {
      await expect(
        vaultAdapter.setMorphoVault(ethersLib.ZeroAddress)
      ).to.be.revertedWithCustomError(vaultAdapter, "InvalidAddress");
    });

    it("setMorphoVault should revert for non-owner", async function () {
      await expect(
        vaultAdapter.connect(user).setMorphoVault(other.address)
      ).to.be.revertedWithCustomError(vaultAdapter, "OwnableUnauthorizedAccount");
    });

    it("setPlacementFee should update fee", async function () {
      await vaultAdapter.setPlacementFee(50);
      expect(await vaultAdapter.placementFeeBps()).to.equal(50n);
    });

    it("setPlacementFee should revert if exceeds max", async function () {
      await expect(
        vaultAdapter.setPlacementFee(101)
      ).to.be.revertedWithCustomError(vaultAdapter, "InvalidFee");
    });

    it("setTreasury should update treasury address", async function () {
      await vaultAdapter.setTreasury(other.address);
      expect(await vaultAdapter.treasury()).to.equal(other.address);
    });

    it("setTreasury should revert with zero address", async function () {
      await expect(
        vaultAdapter.setTreasury(ethersLib.ZeroAddress)
      ).to.be.revertedWithCustomError(vaultAdapter, "InvalidAddress");
    });
  });

  describe("View functions", function () {
    it("getBuildingType should return 'vault'", async function () {
      expect(await vaultAdapter.getBuildingType()).to.equal("vault");
    });

    it("getRequiredProtocols should return vault and asset addresses", async function () {
      const protocols = await vaultAdapter.getRequiredProtocols();
      expect(protocols[0]).to.equal(await morphoVault.getAddress());
      expect(protocols[1]).to.equal(await usdc.getAddress());
    });

    it("calculateFee should compute correct fee and net", async function () {
      const amount = ethersLib.parseUnits("10000", 18);
      const [feeAmount, netAmount] = await vaultAdapter.calculateFee(amount);
      // 0.05% of 10000 = 5
      expect(feeAmount).to.equal(ethersLib.parseUnits("5", 18));
      expect(netAmount).to.equal(amount - feeAmount);
    });

    it("getPlacementFee should return current fee", async function () {
      expect(await vaultAdapter.getPlacementFee()).to.equal(5n);
    });

    it("getTreasury should return treasury address", async function () {
      expect(await vaultAdapter.getTreasury()).to.equal(treasury.address);
    });

    it("estimateYield should return zero (simplified)", async function () {
      const [estimatedYield, yieldAsset] = await vaultAdapter.estimateYield(1);
      expect(estimatedYield).to.equal(0n);
      expect(yieldAsset).to.equal(ethersLib.ZeroAddress);
    });
  });
});
