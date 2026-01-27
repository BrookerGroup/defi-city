import hre from "hardhat";

/**
 * Network utilities for Base Sepolia integration tests
 */

const BASE_SEPOLIA_CHAIN_ID = 84532;
const LOCALHOST_CHAIN_ID = 31337;

/**
 * Verify connected to the expected network
 * @param {object} ethers - Ethers instance from network connection
 * @param {number} expectedChainId - Expected chain ID (optional, auto-detect if not provided)
 * @throws {Error} if network doesn't match
 */
async function verifyNetwork(ethers, expectedChainId) {
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  // Auto-detect expected chain ID from hardhat config
  if (!expectedChainId) {
    const networkName = hre.network.name;

    if (networkName === "localhost" || networkName === "hardhat") {
      expectedChainId = LOCALHOST_CHAIN_ID;
    } else if (networkName === "baseSepolia") {
      expectedChainId = BASE_SEPOLIA_CHAIN_ID;
    }
  }

  if (expectedChainId && chainId !== expectedChainId) {
    throw new Error(
      `Wrong network! Expected ${expectedChainId}, got ${chainId}.`
    );
  }

  console.log(`✓ Connected to network: ${network.name} (Chain ID: ${chainId})`);
  return true;
}

/**
 * Check if address has sufficient ETH balance
 * @param {object} ethers - Ethers instance from network connection
 * @param {string} address - Address to check
 * @param {BigInt} minAmount - Minimum required amount in wei
 * @returns {Promise<boolean>} true if sufficient balance
 */
async function checkBalance(ethers, address, minAmount) {
  const balance = await ethers.provider.getBalance(address);

  if (balance < minAmount) {
    const balanceEth = ethers.formatEther(balance);
    const minEth = ethers.formatEther(minAmount);
    console.warn(
      `⚠️  Insufficient ETH balance: ${balanceEth} ETH (need ${minEth} ETH)`
    );
    console.log(`   Get testnet ETH from: https://faucet.quicknode.com/base/sepolia`);
    return false;
  }

  console.log(`✓ ETH balance: ${ethers.formatEther(balance)} ETH`);
  return true;
}

/**
 * Check if address has sufficient token balance
 * @param {object} ethers - Ethers instance from network connection
 * @param {Contract} token - Token contract instance
 * @param {string} address - Address to check
 * @param {BigInt} minAmount - Minimum required amount
 * @param {string} tokenName - Token name for logging
 * @returns {Promise<boolean>} true if sufficient balance
 */
async function checkTokenBalance(ethers, token, address, minAmount, tokenName = "Token") {
  try {
    const balance = await token.balanceOf(address);
    const decimals = await token.decimals();

    if (balance < minAmount) {
      const balanceFormatted = ethers.formatUnits(balance, decimals);
      const minFormatted = ethers.formatUnits(minAmount, decimals);
      console.warn(
        `⚠️  Insufficient ${tokenName} balance: ${balanceFormatted} (need ${minFormatted})`
      );
      return false;
    }

    console.log(`✓ ${tokenName} balance: ${ethers.formatUnits(balance, decimals)}`);
    return true;
  } catch (error) {
    console.error(`Error checking ${tokenName} balance:`, error.message);
    return false;
  }
}

/**
 * Wait for transaction with better error handling
 * @param {TransactionResponse} tx - Transaction to wait for
 * @param {number} confirmations - Number of confirmations to wait for
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<TransactionReceipt>} Transaction receipt
 */
async function waitForTx(tx, confirmations = 1, timeout = 60000) {
  try {
    console.log(`⏳ Waiting for tx ${tx.hash}...`);
    const receipt = await tx.wait(confirmations, timeout);

    if (receipt.status === 0) {
      throw new Error("Transaction reverted");
    }

    console.log(`✓ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`  Gas used: ${receipt.gasUsed.toString()}`);

    return receipt;
  } catch (error) {
    if (error.code === "TIMEOUT") {
      console.error("❌ Transaction timeout - check RPC connection");
      console.log(`   Transaction hash: ${tx.hash}`);
      console.log(`   Check status: https://sepolia.basescan.org/tx/${tx.hash}`);
    }
    throw error;
  }
}

/**
 * Check if contract is deployed at address
 * @param {object} ethers - Ethers instance from network connection
 * @param {string} address - Contract address
 * @returns {Promise<boolean>} true if contract exists
 */
async function isContractDeployed(ethers, address) {
  try {
    const code = await ethers.provider.getCode(address);
    return code !== "0x";
  } catch (error) {
    console.error(`Error checking contract at ${address}:`, error.message);
    return false;
  }
}

/**
 * Estimate gas for a transaction
 * @param {Contract} contract - Contract instance
 * @param {string} method - Method name
 * @param {Array} args - Method arguments
 * @returns {Promise<BigInt>} Estimated gas
 */
async function estimateGas(contract, method, args = []) {
  try {
    const gas = await contract[method].estimateGas(...args);
    console.log(`  Estimated gas for ${method}: ${gas.toString()}`);
    return gas;
  } catch (error) {
    console.warn(`  Could not estimate gas for ${method}:`, error.message);
    return null;
  }
}

/**
 * Get current gas price
 * @param {object} ethers - Ethers instance from network connection
 * @returns {Promise<BigInt>} Current gas price in wei
 */
async function getCurrentGasPrice(ethers) {
  const feeData = await ethers.provider.getFeeData();
  console.log(`  Current gas price: ${ethers.formatUnits(feeData.gasPrice, "gwei")} gwei`);
  return feeData.gasPrice;
}

/**
 * Wait for specific number of blocks
 * @param {object} ethers - Ethers instance from network connection
 * @param {number} blocks - Number of blocks to wait
 */
async function waitForBlocks(ethers, blocks) {
  console.log(`⏳ Waiting for ${blocks} blocks...`);
  const startBlock = await ethers.provider.getBlockNumber();

  return new Promise((resolve) => {
    const checkBlock = async () => {
      const currentBlock = await ethers.provider.getBlockNumber();
      if (currentBlock >= startBlock + blocks) {
        console.log(`✓ ${blocks} blocks passed (now at block ${currentBlock})`);
        resolve();
      } else {
        setTimeout(checkBlock, 2000); // Check every 2 seconds
      }
    };
    checkBlock();
  });
}

export {
  BASE_SEPOLIA_CHAIN_ID,
  LOCALHOST_CHAIN_ID,
  verifyNetwork,
  checkBalance,
  checkTokenBalance,
  waitForTx,
  isContractDeployed,
  estimateGas,
  getCurrentGasPrice,
  waitForBlocks
};
