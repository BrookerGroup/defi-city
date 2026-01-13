# 📍 Deployed Contracts

## Sepolia Testnet

**Deployed Date**: January 13, 2025

### Contract Addresses

| Contract | Address | Explorer |
|----------|---------|----------|
| **SimpleWalletFactory** | `0x0899fDF0Dfe72751925901e72DB41A0aDB18be47` | [View on Etherscan](https://sepolia.etherscan.io/address/0x0899fDF0Dfe72751925901e72DB41A0aDB18be47) |
| **Test Wallet** | `0x8F731c95d6254211c5b86Cc22319df992e869E1F` | [View on Etherscan](https://sepolia.etherscan.io/address/0x8F731c95d6254211c5b86Cc22319df992e869E1F) |

### Network Information

- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: `https://ethereum-sepolia-rpc.publicnode.com`
- **Deployer**: `0x0007E5829637D89C5488af6833fA70581a1887d2`
- **Gas Used**: ~620,204 (for wallet creation)

---

## Usage in Frontend

### JavaScript/TypeScript

```javascript
// config.js
export const CONTRACTS = {
  FACTORY_ADDRESS: "0x0899fDF0Dfe72751925901e72DB41A0aDB18be47",
  CHAIN_ID: 11155111,
  NETWORK_NAME: "sepolia",
  RPC_URL: "https://ethereum-sepolia-rpc.publicnode.com",
  EXPLORER_URL: "https://sepolia.etherscan.io"
};
```

### Connect to Factory

```javascript
import { ethers } from "ethers";
import { CONTRACTS } from "./config";

// Connect to provider
const provider = new ethers.JsonRpcProvider(CONTRACTS.RPC_URL);
const signer = await provider.getSigner();

// Factory ABI (minimal)
const factoryABI = [
  "function createWallet(address owner) external returns (address)",
  "function getWallet(address owner) external view returns (address)",
  "function getOrCreateWallet(address owner) external returns (address)",
  "function totalWallets() external view returns (uint256)"
];

// Connect to factory
const factory = new ethers.Contract(
  CONTRACTS.FACTORY_ADDRESS,
  factoryABI,
  signer
);

// Create wallet
const userAddress = await signer.getAddress();
const tx = await factory.createWallet(userAddress);
await tx.wait();

// Get wallet address
const walletAddress = await factory.getWallet(userAddress);
console.log("Your wallet:", walletAddress);
```

### Wallet ABI (minimal)

```javascript
const walletABI = [
  "function owner() external view returns (address)",
  "function depositToken(address token, uint256 amount) external",
  "function withdrawETH(address payable to, uint256 amount) external",
  "function withdrawToken(address token, address to, uint256 amount) external",
  "function getETHBalance() external view returns (uint256)",
  "function getTokenBalance(address token) external view returns (uint256)"
];
```

---

## Quick Test

### Using Hardhat Console

```bash
npx hardhat console --network sepolia
```

```javascript
// Get factory
const factory = await ethers.getContractAt(
  "SimpleWalletFactory",
  "0x0899fDF0Dfe72751925901e72DB41A0aDB18be47"
);

// Check total wallets
const total = await factory.totalWallets();
console.log("Total wallets:", total.toString()); // Should show 1

// Get deployer's wallet
const [deployer] = await ethers.getSigners();
const myWallet = await factory.getWallet(deployer.address);
console.log("My wallet:", myWallet);

// Connect to wallet
const wallet = await ethers.getContractAt("SimpleSmartWallet", myWallet);

// Check owner
const owner = await wallet.owner();
console.log("Owner:", owner);

// Check balances
const ethBalance = await wallet.getETHBalance();
console.log("ETH Balance:", ethers.formatEther(ethBalance));
```

---

## Test Deposit & Withdraw

### Deposit ETH

```javascript
// Send 0.01 ETH to wallet
await deployer.sendTransaction({
  to: myWallet,
  value: ethers.parseEther("0.01")
});

// Check balance
const balance = await wallet.getETHBalance();
console.log("New balance:", ethers.formatEther(balance));
```

### Withdraw ETH

```javascript
// Withdraw 0.005 ETH
await wallet.withdrawETH(
  deployer.address,
  ethers.parseEther("0.005")
);
```

---

## Block Explorer Links

### Factory Contract
🔗 https://sepolia.etherscan.io/address/0x0899fDF0Dfe72751925901e72DB41A0aDB18be47

**Functions you can call:**
- `createWallet(address)` - Create new wallet
- `getWallet(address)` - Get wallet for owner
- `totalWallets()` - Get total wallets created

### Your Test Wallet
🔗 https://sepolia.etherscan.io/address/0x8F731c95d6254211c5b86Cc22319df992e869E1F

**This is your first wallet!** You can:
- Send ETH/tokens to this address
- Call `withdrawETH()` to withdraw
- Check balances via `getETHBalance()`

---

## Verify Contracts (Optional)

```bash
# Install verification plugin
npm install --save-dev @nomiclabs/hardhat-etherscan

# Verify Factory
npx hardhat verify --network sepolia 0x0899fDF0Dfe72751925901e72DB41A0aDB18be47

# Verify Wallet
npx hardhat verify --network sepolia \
  0x8F731c95d6254211c5b86Cc22319df992e869E1F \
  0x0007E5829637D89C5488af6833fA70581a1887d2
```

---

## Next Steps

1. ✅ **Contracts Deployed** - Factory + Test Wallet on Sepolia
2. 🔄 **Test Transactions** - Try deposit/withdraw
3. 🔄 **Integrate Frontend** - Connect your game to these contracts
4. 🔄 **Add DeFi Features** - Aave, Uniswap integration
5. 🔄 **Deploy to Base** - Lower gas costs for mainnet

---

## Support

- **Factory Address**: `0x0899fDF0Dfe72751925901e72DB41A0aDB18be47`
- **Network**: Sepolia Testnet
- **Explorer**: https://sepolia.etherscan.io/

Need help? Check:
- [QUICKSTART.md](./QUICKSTART.md)
- [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
