import { UserOperationSponsored } from "../../generated/DefiCityPaymaster/DefiCityPaymaster";
import { GaslessTransaction, SmartWallet, User } from "../../generated/schema";
import { ZERO_BD, ONE_BI, convertTokenToDecimal } from "../utils/helpers";
import { getOrCreateUser } from "../utils/user";

const ETH_DECIMALS = 18;

export function handleUserOperationSponsored(event: UserOperationSponsored): void {
  let user = getOrCreateUser(event.params.user);

  // Get wallet
  let walletId = event.params.user.toHex(); // Assuming user address is wallet address
  let wallet = SmartWallet.load(walletId);

  if (wallet == null) {
    // Wallet might not be indexed yet, create placeholder
    wallet = new SmartWallet(walletId);
    wallet.owner = user.id;
    wallet.createdAt = event.block.timestamp;
    wallet.createdAtBlock = event.block.number;
    wallet.gaslessTransactions = ZERO_BD.truncate(0).digits;
    wallet.gasSaved = ZERO_BD;
    wallet.updatedAt = event.block.timestamp;
  }

  // Convert gas cost to ETH
  let gasCostETH = convertTokenToDecimal(event.params.actualGasCost, ETH_DECIMALS);
  let gasCostUSD = convertTokenToDecimal(event.params.actualGasCostUSD, 6); // USDC decimals

  // Create gasless transaction record
  let txId = event.transaction.hash.toHex();
  let gaslessTx = new GaslessTransaction(txId);
  gaslessTx.user = user.id;
  gaslessTx.wallet = wallet.id;
  gaslessTx.operation = "UserOperation"; // Could parse from event data
  gaslessTx.gasCost = gasCostETH;
  gaslessTx.gasCostUSD = gasCostUSD;
  gaslessTx.timestamp = event.block.timestamp;
  gaslessTx.blockNumber = event.block.number;
  gaslessTx.save();

  // Update wallet stats
  wallet.gaslessTransactions = wallet.gaslessTransactions.plus(ONE_BI);
  wallet.gasSaved = wallet.gasSaved.plus(gasCostUSD);
  wallet.updatedAt = event.block.timestamp;
  wallet.save();
}
