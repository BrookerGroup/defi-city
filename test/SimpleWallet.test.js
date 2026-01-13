const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleWallet System", function () {
  let factory;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy factory
    const SimpleWalletFactory = await ethers.getContractFactory("SimpleWalletFactory");
    factory = await SimpleWalletFactory.deploy();
    await factory.waitForDeployment();
  });

  describe("Factory", function () {
    it("Should deploy factory successfully", async function () {
      expect(await factory.getAddress()).to.be.properAddress;
      expect(await factory.totalWallets()).to.equal(0);
    });

    it("Should create wallet for user", async function () {
      const tx = await factory.createWallet(user1.address);
      await tx.wait();

      const walletAddress = await factory.getWallet(user1.address);
      expect(walletAddress).to.be.properAddress;
      expect(walletAddress).to.not.equal(ethers.ZeroAddress);
      expect(await factory.totalWallets()).to.equal(1);
    });

    it("Should revert if creating wallet for same user twice", async function () {
      await factory.createWallet(user1.address);
      await expect(factory.createWallet(user1.address)).to.be.revertedWithCustomError(
        factory,
        "WalletAlreadyExists"
      );
    });

    it("Should get or create wallet", async function () {
      // First call - creates wallet
      const wallet1 = await factory.getOrCreateWallet.staticCall(user1.address);
      await factory.getOrCreateWallet(user1.address);

      // Second call - returns existing wallet
      const wallet2 = await factory.getOrCreateWallet.staticCall(user1.address);
      await factory.getOrCreateWallet(user1.address);

      expect(wallet1).to.equal(wallet2);
      expect(await factory.totalWallets()).to.equal(1);
    });
  });

  describe("Wallet - Deposit & Withdraw ETH", function () {
    let wallet;
    let walletContract;

    beforeEach(async function () {
      // Create wallet for user1
      await factory.createWallet(user1.address);
      const walletAddress = await factory.getWallet(user1.address);

      // Get wallet contract instance
      walletContract = await ethers.getContractAt("SimpleSmartWallet", walletAddress);
      wallet = walletAddress;
    });

    it("Should have correct owner", async function () {
      expect(await walletContract.owner()).to.equal(user1.address);
    });

    it("Should deposit ETH to wallet", async function () {
      const depositAmount = ethers.parseEther("1.0");

      // Send ETH to wallet
      await user1.sendTransaction({
        to: wallet,
        value: depositAmount,
      });

      // Check balance
      const balance = await walletContract.getETHBalance();
      expect(balance).to.equal(depositAmount);
    });

    it("Should withdraw ETH from wallet", async function () {
      // Deposit ETH
      const depositAmount = ethers.parseEther("1.0");
      await user1.sendTransaction({
        to: wallet,
        value: depositAmount,
      });

      // Withdraw ETH
      const withdrawAmount = ethers.parseEther("0.5");
      const initialBalance = await ethers.provider.getBalance(user2.address);

      await walletContract.connect(user1).withdrawETH(user2.address, withdrawAmount);

      const finalBalance = await ethers.provider.getBalance(user2.address);
      expect(finalBalance - initialBalance).to.equal(withdrawAmount);

      // Check wallet balance
      const walletBalance = await walletContract.getETHBalance();
      expect(walletBalance).to.equal(ethers.parseEther("0.5"));
    });

    it("Should withdraw all ETH from wallet", async function () {
      // Deposit ETH
      const depositAmount = ethers.parseEther("2.0");
      await user1.sendTransaction({
        to: wallet,
        value: depositAmount,
      });

      // Withdraw all
      const initialBalance = await ethers.provider.getBalance(user2.address);
      await walletContract.connect(user1).withdrawAllETH(user2.address);

      const finalBalance = await ethers.provider.getBalance(user2.address);
      expect(finalBalance - initialBalance).to.equal(depositAmount);

      // Wallet should be empty
      expect(await walletContract.getETHBalance()).to.equal(0);
    });

    it("Should revert if non-owner tries to withdraw", async function () {
      // Deposit ETH
      await user1.sendTransaction({
        to: wallet,
        value: ethers.parseEther("1.0"),
      });

      // Try to withdraw as different user
      await expect(
        walletContract.connect(user2).withdrawETH(user2.address, ethers.parseEther("0.5"))
      ).to.be.revertedWithCustomError(walletContract, "OnlyOwner");
    });

    it("Should revert if insufficient balance", async function () {
      await expect(
        walletContract.connect(user1).withdrawETH(user2.address, ethers.parseEther("1.0"))
      ).to.be.revertedWithCustomError(walletContract, "InsufficientBalance");
    });
  });

  describe("Wallet - Deposit & Withdraw ERC20", function () {
    let wallet;
    let walletContract;
    let token;

    beforeEach(async function () {
      // Create wallet
      await factory.createWallet(user1.address);
      const walletAddress = await factory.getWallet(user1.address);
      walletContract = await ethers.getContractAt("SimpleSmartWallet", walletAddress);
      wallet = walletAddress;

      // Deploy mock ERC20 token
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      token = await MockERC20.deploy("Test Token", "TEST", ethers.parseEther("1000000"));
      await token.waitForDeployment();

      // Give user1 some tokens
      await token.transfer(user1.address, ethers.parseEther("1000"));
    });

    it("Should deposit tokens to wallet", async function () {
      const depositAmount = ethers.parseEther("100");

      // Approve wallet to spend tokens
      await token.connect(user1).approve(wallet, depositAmount);

      // Deposit tokens
      await walletContract.connect(user1).depositToken(await token.getAddress(), depositAmount);

      // Check balance
      const balance = await walletContract.getTokenBalance(await token.getAddress());
      expect(balance).to.equal(depositAmount);
    });

    it("Should withdraw tokens from wallet", async function () {
      // Deposit tokens
      const depositAmount = ethers.parseEther("100");
      await token.connect(user1).approve(wallet, depositAmount);
      await walletContract.connect(user1).depositToken(await token.getAddress(), depositAmount);

      // Withdraw tokens
      const withdrawAmount = ethers.parseEther("50");
      const initialBalance = await token.balanceOf(user2.address);

      await walletContract
        .connect(user1)
        .withdrawToken(await token.getAddress(), user2.address, withdrawAmount);

      const finalBalance = await token.balanceOf(user2.address);
      expect(finalBalance - initialBalance).to.equal(withdrawAmount);

      // Check wallet balance
      const walletBalance = await walletContract.getTokenBalance(await token.getAddress());
      expect(walletBalance).to.equal(ethers.parseEther("50"));
    });

    it("Should withdraw all tokens from wallet", async function () {
      // Deposit tokens
      const depositAmount = ethers.parseEther("200");
      await token.connect(user1).approve(wallet, depositAmount);
      await walletContract.connect(user1).depositToken(await token.getAddress(), depositAmount);

      // Withdraw all
      const initialBalance = await token.balanceOf(user2.address);
      await walletContract
        .connect(user1)
        .withdrawAllTokens(await token.getAddress(), user2.address);

      const finalBalance = await token.balanceOf(user2.address);
      expect(finalBalance - initialBalance).to.equal(depositAmount);

      // Wallet should be empty
      const walletBalance = await walletContract.getTokenBalance(await token.getAddress());
      expect(walletBalance).to.equal(0);
    });

    it("Should revert if non-owner tries to withdraw tokens", async function () {
      // Deposit tokens
      const depositAmount = ethers.parseEther("100");
      await token.connect(user1).approve(wallet, depositAmount);
      await walletContract.connect(user1).depositToken(await token.getAddress(), depositAmount);

      // Try to withdraw as different user
      await expect(
        walletContract
          .connect(user2)
          .withdrawToken(await token.getAddress(), user2.address, ethers.parseEther("50"))
      ).to.be.revertedWithCustomError(walletContract, "OnlyOwner");
    });
  });

  describe("Ownership", function () {
    let wallet;
    let walletContract;

    beforeEach(async function () {
      await factory.createWallet(user1.address);
      const walletAddress = await factory.getWallet(user1.address);
      walletContract = await ethers.getContractAt("SimpleSmartWallet", walletAddress);
    });

    it("Should transfer ownership", async function () {
      expect(await walletContract.owner()).to.equal(user1.address);

      await walletContract.connect(user1).transferOwnership(user2.address);

      expect(await walletContract.owner()).to.equal(user2.address);
    });

    it("Should revert if non-owner tries to transfer ownership", async function () {
      await expect(
        walletContract.connect(user2).transferOwnership(user2.address)
      ).to.be.revertedWithCustomError(walletContract, "OnlyOwner");
    });
  });
});

// Mock ERC20 Token for testing
// (In a real project, you might use OpenZeppelin's ERC20Mock)
