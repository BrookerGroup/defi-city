import { WalletCreated } from "../../generated/WalletFactory/WalletFactory";
import { SmartWallet, User } from "../../generated/schema";
import { ZERO_BI, ZERO_BD } from "../utils/helpers";
import { getOrCreateUser } from "../utils/user";

export function handleWalletCreated(event: WalletCreated): void {
  let user = getOrCreateUser(event.params.owner);

  // Create smart wallet
  let walletId = event.params.wallet.toHex();
  let wallet = new SmartWallet(walletId);
  wallet.owner = user.id;
  wallet.createdAt = event.block.timestamp;
  wallet.createdAtBlock = event.block.number;
  wallet.gaslessTransactions = ZERO_BI;
  wallet.gasSaved = ZERO_BD;
  wallet.updatedAt = event.block.timestamp;
  wallet.save();
}
