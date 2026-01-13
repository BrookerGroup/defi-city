# DeFi City - Quick Start Guide

เริ่มต้นใช้งาน Smart Wallet แบบง่ายๆ ภายใน 5 นาที! 🚀

---

## 📦 Installation

```bash
cd defi-city

# Install dependencies
npm install

# or
yarn install
```

---

## 🛠️ Setup

### 1. Configure Environment (Optional for local testing)

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your keys (only needed for testnet/mainnet)
# For local testing, you can skip this step
```

### 2. Compile Contracts

```bash
npx hardhat compile
```

---

## 🧪 Testing

### Run Tests

```bash
npx hardhat test
```

Expected output:
```
  SimpleWallet System
    Factory
      ✔ Should deploy factory successfully
      ✔ Should create wallet for user
      ✔ Should revert if creating wallet for same user twice
      ✔ Should get or create wallet
    Wallet - Deposit & Withdraw ETH
      ✔ Should have correct owner
      ✔ Should deposit ETH to wallet
      ✔ Should withdraw ETH from wallet
      ✔ Should withdraw all ETH from wallet
      ✔ Should revert if non-owner tries to withdraw
      ✔ Should revert if insufficient balance
    Wallet - Deposit & Withdraw ERC20
      ✔ Should deposit tokens to wallet
      ✔ Should withdraw tokens from wallet
      ✔ Should withdraw all tokens from wallet
      ✔ Should revert if non-owner tries to withdraw tokens
    Ownership
      ✔ Should transfer ownership
      ✔ Should revert if non-owner tries to transfer ownership

  15 passing
```

---

## 🚀 Deployment

### Deploy to Local Network

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy to Testnet (Sepolia)

```bash
# Make sure you have:
# 1. PRIVATE_KEY in .env
# 2. SEPOLIA_RPC_URL in .env
# 3. Some Sepolia ETH (get from faucet)

npx hardhat run scripts/deploy.js --network sepolia
```

---

## 💻 Usage Examples

### JavaScript/TypeScript (Frontend)

```javascript
const { ethers } = require("ethers");

// 1. Connect to network
const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const signer = await provider.getSigner();

// 2. Connect to Factory
const FACTORY_ADDRESS = "0x..."; // From deployment
const factoryABI = [...]; // From artifacts

const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, signer);

// ============================================
// CREATE WALLET
// ============================================

// Create wallet for user
async function createWallet(ownerAddress) {
  console.log("Creating wallet for:", ownerAddress);

  const tx = await factory.createWallet(ownerAddress);
  await tx.wait();

  const walletAddress = await factory.getWallet(ownerAddress);
  console.log("✅ Wallet created:", walletAddress);

  return walletAddress;
}

// Usage
const userAddress = await signer.getAddress();
const walletAddress = await createWallet(userAddress);

// ============================================
// DEPOSIT ETH
// ============================================

async function depositETH(walletAddress, amount) {
  console.log("Depositing", amount, "ETH to wallet...");

  // Simply send ETH to wallet address
  const tx = await signer.sendTransaction({
    to: walletAddress,
    value: ethers.parseEther(amount),
  });

  await tx.wait();
  console.log("✅ Deposited", amount, "ETH");
}

// Usage
await depositETH(walletAddress, "1.0"); // Deposit 1 ETH

// ============================================
// DEPOSIT USDC (ERC20)
// ============================================

async function depositUSDC(walletAddress, amount) {
  const USDC_ADDRESS = "0x..."; // USDC contract address
  const usdcABI = [...]; // ERC20 ABI

  const usdc = new ethers.Contract(USDC_ADDRESS, usdcABI, signer);
  const wallet = new ethers.Contract(walletAddress, walletABI, signer);

  console.log("Depositing", amount, "USDC...");

  // 1. Approve wallet to spend USDC
  const approveTx = await usdc.approve(
    walletAddress,
    ethers.parseUnits(amount, 6) // USDC has 6 decimals
  );
  await approveTx.wait();

  // 2. Deposit to wallet
  const depositTx = await wallet.depositToken(
    USDC_ADDRESS,
    ethers.parseUnits(amount, 6)
  );
  await depositTx.wait();

  console.log("✅ Deposited", amount, "USDC");
}

// Usage
await depositUSDC(walletAddress, "100"); // Deposit 100 USDC

// ============================================
// WITHDRAW ETH
// ============================================

async function withdrawETH(walletAddress, toAddress, amount) {
  const wallet = new ethers.Contract(walletAddress, walletABI, signer);

  console.log("Withdrawing", amount, "ETH...");

  const tx = await wallet.withdrawETH(
    toAddress,
    ethers.parseEther(amount)
  );

  await tx.wait();
  console.log("✅ Withdrawn", amount, "ETH to", toAddress);
}

// Usage
const recipientAddress = "0x..."; // User's MetaMask or CEX address
await withdrawETH(walletAddress, recipientAddress, "0.5"); // Withdraw 0.5 ETH

// ============================================
// WITHDRAW USDC
// ============================================

async function withdrawUSDC(walletAddress, toAddress, amount) {
  const USDC_ADDRESS = "0x...";
  const wallet = new ethers.Contract(walletAddress, walletABI, signer);

  console.log("Withdrawing", amount, "USDC...");

  const tx = await wallet.withdrawToken(
    USDC_ADDRESS,
    toAddress,
    ethers.parseUnits(amount, 6)
  );

  await tx.wait();
  console.log("✅ Withdrawn", amount, "USDC to", toAddress);
}

// Usage
await withdrawUSDC(walletAddress, recipientAddress, "50"); // Withdraw 50 USDC

// ============================================
// CHECK BALANCE
// ============================================

async function checkBalance(walletAddress) {
  const wallet = new ethers.Contract(walletAddress, walletABI, provider);

  // ETH balance
  const ethBalance = await wallet.getETHBalance();
  console.log("ETH Balance:", ethers.formatEther(ethBalance), "ETH");

  // USDC balance
  const USDC_ADDRESS = "0x...";
  const usdcBalance = await wallet.getTokenBalance(USDC_ADDRESS);
  console.log("USDC Balance:", ethers.formatUnits(usdcBalance, 6), "USDC");
}

// Usage
await checkBalance(walletAddress);
```

---

## 🎮 Integration with Game

### Example: User Flow

```javascript
// ============================================
// STEP 1: User connects wallet (MetaMask)
// ============================================
async function connectWallet() {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  console.log("Connected:", userAddress);
  return { provider, signer, userAddress };
}

// ============================================
// STEP 2: Get or create Smart Wallet
// ============================================
async function getOrCreateSmartWallet(factory, userAddress) {
  // Check if wallet exists
  let walletAddress = await factory.getWallet(userAddress);

  if (walletAddress === ethers.ZeroAddress) {
    // Create new wallet
    console.log("Creating Smart Wallet...");
    const tx = await factory.createWallet(userAddress);
    await tx.wait();

    walletAddress = await factory.getWallet(userAddress);
    console.log("✅ Smart Wallet created:", walletAddress);
  } else {
    console.log("✅ Smart Wallet exists:", walletAddress);
  }

  // Save to localStorage
  localStorage.setItem("smartWallet", walletAddress);

  return walletAddress;
}

// ============================================
// STEP 3: Deposit funds to play game
// ============================================
async function depositToGame(walletAddress, amount) {
  // User deposits USDC from MetaMask to Smart Wallet
  await depositUSDC(walletAddress, amount);

  // Update game UI
  updateGameBalance(amount);
}

// ============================================
// STEP 4: Withdraw when user wants to exit
// ============================================
async function withdrawFromGame(walletAddress, amount) {
  const userAddress = await signer.getAddress();

  // Withdraw from Smart Wallet to user's MetaMask
  await withdrawUSDC(walletAddress, userAddress, amount);

  // Update game UI
  updateGameBalance(-amount);
}

// ============================================
// COMPLETE FLOW
// ============================================
async function startGame() {
  // 1. Connect wallet
  const { provider, signer, userAddress } = await connectWallet();

  // 2. Get factory
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

  // 3. Get or create Smart Wallet
  const walletAddress = await getOrCreateSmartWallet(factory, userAddress);

  // 4. Check balance
  await checkBalance(walletAddress);

  // 5. Ready to play!
  console.log("🎮 Ready to play DeFi City!");
  renderGame(walletAddress);
}
```

---

## 📁 Contract Addresses

After deployment, save these addresses:

### Local Network
```
Factory: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Sepolia Testnet
```
Factory: (deploy first)
```

### Base Mainnet
```
Factory: (deploy first)
```

---

## 🔍 Verify Balances

### Using Hardhat Console

```bash
npx hardhat console --network localhost
```

```javascript
const factory = await ethers.getContractAt("SimpleWalletFactory", "0x...");
const walletAddress = await factory.getWallet("0xUSER_ADDRESS");
const wallet = await ethers.getContractAt("SimpleSmartWallet", walletAddress);

// Check ETH balance
const ethBalance = await wallet.getETHBalance();
console.log("ETH:", ethers.formatEther(ethBalance));

// Check owner
const owner = await wallet.owner();
console.log("Owner:", owner);
```

---

## 🐛 Troubleshooting

### Issue: "Insufficient balance"
**Solution**: Make sure you've deposited funds to the wallet first.

### Issue: "OnlyOwner" error
**Solution**: Make sure you're calling withdraw functions with the wallet owner's account.

### Issue: "WalletAlreadyExists"
**Solution**: Use `getWallet()` to get existing wallet instead of creating new one.

### Issue: Tests failing
**Solution**:
```bash
npx hardhat clean
npx hardhat compile
npx hardhat test
```

---

## 📚 Next Steps

1. ✅ Deploy to local network and test
2. ✅ Integrate with your game frontend
3. ✅ Deploy to Sepolia testnet
4. 🔄 Add Aave integration (for Yield Farms)
5. 🔄 Add Uniswap integration (for LP Mines)
6. 🔄 Deploy to mainnet

---

## 🆘 Need Help?

- Check the test files for more examples: `test/SimpleWallet.test.js`
- Review contract source: `contracts/SimpleSmartWallet.sol`
- Full documentation: `docs/`

---

**Happy Building! 🏗️**
