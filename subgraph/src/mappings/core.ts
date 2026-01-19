import { BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import {
  Deposited,
  Withdrawn,
  AssetAdded,
  AssetRemoved,
  Paused,
  Unpaused,
} from "../../generated/DefiCityCore/DefiCityCore";
import {
  User,
  UserBalance,
  Asset,
  ProtocolStats,
  AssetProtocolStats,
  Deposit,
  Withdrawal,
  DailyStats,
  HourlyStats,
} from "../../generated/schema";
import { ZERO_BD, ZERO_BI, ONE_BI, ETH_ADDRESS, convertTokenToDecimal } from "../utils/helpers";
import { getOrCreateUser, updateUserTimestamp } from "../utils/user";
import { getOrCreateAsset } from "../utils/asset";
import { getOrCreateProtocolStats, updateProtocolStats } from "../utils/protocol";
import { updateDailyStats, updateHourlyStats } from "../utils/stats";

export function handleDeposited(event: Deposited): void {
  let user = getOrCreateUser(event.params.user);
  let asset = getOrCreateAsset(event.params.asset);

  // Get or create user balance
  let balanceId = event.params.user.toHex() + "-" + event.params.asset.toHex();
  let userBalance = UserBalance.load(balanceId);
  if (userBalance == null) {
    userBalance = new UserBalance(balanceId);
    userBalance.user = user.id;
    userBalance.asset = asset.id;
    userBalance.balance = ZERO_BD;
    userBalance.updatedAt = event.block.timestamp;
    userBalance.updatedAtBlock = event.block.number;
  }

  // Convert amount to decimal
  let amount = convertTokenToDecimal(event.params.amount, asset.decimals);

  // Update user balance
  userBalance.balance = userBalance.balance.plus(amount);
  userBalance.updatedAt = event.block.timestamp;
  userBalance.updatedAtBlock = event.block.number;
  userBalance.save();

  // Update user totals
  user.totalDeposited = user.totalDeposited.plus(amount);
  updateUserTimestamp(user, event.block);
  user.save();

  // Update asset stats
  asset.totalDeposited = asset.totalDeposited.plus(amount);
  asset.totalBalance = asset.totalBalance.plus(amount);
  asset.updatedAt = event.block.timestamp;
  asset.save();

  // Create deposit transaction
  let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let deposit = new Deposit(txId);
  deposit.user = user.id;
  deposit.asset = asset.id;
  deposit.amount = amount;
  deposit.shares = ZERO_BD; // Updated if from building deposit
  deposit.fee = ZERO_BD;
  deposit.hash = event.transaction.hash;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  deposit.save();

  // Update protocol stats
  updateProtocolStats(asset, amount, ZERO_BD, ZERO_BD, event.block);

  // Update daily/hourly stats
  updateDailyStats(event.block, amount, ZERO_BD, ZERO_BD, ZERO_BD);
  updateHourlyStats(event.block, amount, ZERO_BD);
}

export function handleWithdrawn(event: Withdrawn): void {
  let user = getOrCreateUser(event.params.user);
  let asset = getOrCreateAsset(event.params.asset);

  // Get user balance
  let balanceId = event.params.user.toHex() + "-" + event.params.asset.toHex();
  let userBalance = UserBalance.load(balanceId);
  if (userBalance == null) {
    // Should not happen, but handle gracefully
    userBalance = new UserBalance(balanceId);
    userBalance.user = user.id;
    userBalance.asset = asset.id;
    userBalance.balance = ZERO_BD;
  }

  // Convert amount to decimal
  let amount = convertTokenToDecimal(event.params.amount, asset.decimals);

  // Update user balance
  userBalance.balance = userBalance.balance.minus(amount);
  userBalance.updatedAt = event.block.timestamp;
  userBalance.updatedAtBlock = event.block.number;
  userBalance.save();

  // Update user totals
  user.totalWithdrawn = user.totalWithdrawn.plus(amount);
  updateUserTimestamp(user, event.block);
  user.save();

  // Update asset stats
  asset.totalWithdrawn = asset.totalWithdrawn.plus(amount);
  asset.totalBalance = asset.totalBalance.minus(amount);
  asset.updatedAt = event.block.timestamp;
  asset.save();

  // Create withdrawal transaction
  let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let withdrawal = new Withdrawal(txId);
  withdrawal.user = user.id;
  withdrawal.asset = asset.id;
  withdrawal.amount = amount;
  withdrawal.shares = ZERO_BD;
  withdrawal.hash = event.transaction.hash;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.blockNumber = event.block.number;
  withdrawal.save();

  // Update protocol stats
  updateProtocolStats(asset, ZERO_BD, amount, ZERO_BD, event.block);

  // Update daily/hourly stats
  updateDailyStats(event.block, ZERO_BD, amount, ZERO_BD, ZERO_BD);
  updateHourlyStats(event.block, ZERO_BD, amount);
}

export function handleAssetAdded(event: AssetAdded): void {
  let asset = getOrCreateAsset(event.params.asset);
  asset.save();
}

export function handleAssetRemoved(event: AssetRemoved): void {
  // Asset remains in database but might need to be marked as unsupported
  // For now, just leave it as is
}

export function handlePaused(event: Paused): void {
  // Could track pause events in a separate entity if needed
}

export function handleUnpaused(event: Unpaused): void {
  // Could track unpause events in a separate entity if needed
}
