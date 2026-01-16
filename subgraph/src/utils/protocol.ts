import { BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { ProtocolStats, AssetProtocolStats, Asset } from "../../generated/schema";
import { ZERO_BI, ZERO_BD, ONE_BI } from "./helpers";

const PROTOCOL_STATS_ID = "1";

export function getOrCreateProtocolStats(): ProtocolStats {
  let stats = ProtocolStats.load(PROTOCOL_STATS_ID);

  if (stats == null) {
    stats = new ProtocolStats(PROTOCOL_STATS_ID);
    stats.totalUsers = ZERO_BI;
    stats.activeUsers = ZERO_BI;
    stats.totalBuildings = ZERO_BI;
    stats.activeBuildings = ZERO_BI;
    stats.totalDeposited = ZERO_BD;
    stats.totalWithdrawn = ZERO_BD;
    stats.totalHarvested = ZERO_BD;
    stats.currentTVL = ZERO_BD;
    stats.totalFeesCollected = ZERO_BD;
    stats.updatedAt = ZERO_BI;
    stats.updatedAtBlock = ZERO_BI;
  }

  return stats;
}

export function getOrCreateAssetProtocolStats(asset: Asset): AssetProtocolStats {
  let stats = AssetProtocolStats.load(asset.id);

  if (stats == null) {
    stats = new AssetProtocolStats(asset.id);
    stats.protocol = PROTOCOL_STATS_ID;
    stats.asset = asset.id;
    stats.totalDeposited = ZERO_BD;
    stats.totalWithdrawn = ZERO_BD;
    stats.currentTVL = ZERO_BD;
    stats.updatedAt = ZERO_BI;
  }

  return stats;
}

export function updateProtocolStats(
  asset: Asset,
  depositAmount: BigDecimal,
  withdrawAmount: BigDecimal,
  harvestAmount: BigDecimal,
  block: ethereum.Block
): void {
  let protocolStats = getOrCreateProtocolStats();
  let assetStats = getOrCreateAssetProtocolStats(asset);

  // Update protocol totals
  protocolStats.totalDeposited = protocolStats.totalDeposited.plus(depositAmount);
  protocolStats.totalWithdrawn = protocolStats.totalWithdrawn.plus(withdrawAmount);
  protocolStats.totalHarvested = protocolStats.totalHarvested.plus(harvestAmount);
  protocolStats.currentTVL = protocolStats.currentTVL.plus(depositAmount).minus(withdrawAmount);
  protocolStats.updatedAt = block.timestamp;
  protocolStats.updatedAtBlock = block.number;
  protocolStats.save();

  // Update asset stats
  assetStats.totalDeposited = assetStats.totalDeposited.plus(depositAmount);
  assetStats.totalWithdrawn = assetStats.totalWithdrawn.plus(withdrawAmount);
  assetStats.currentTVL = assetStats.currentTVL.plus(depositAmount).minus(withdrawAmount);
  assetStats.updatedAt = block.timestamp;
  assetStats.save();
}

export function incrementProtocolUsers(): void {
  let stats = getOrCreateProtocolStats();
  stats.totalUsers = stats.totalUsers.plus(ONE_BI);
  stats.activeUsers = stats.activeUsers.plus(ONE_BI);
  stats.save();
}

export function incrementProtocolBuildings(): void {
  let stats = getOrCreateProtocolStats();
  stats.totalBuildings = stats.totalBuildings.plus(ONE_BI);
  stats.activeBuildings = stats.activeBuildings.plus(ONE_BI);
  stats.save();
}

export function decrementProtocolActiveBuildings(): void {
  let stats = getOrCreateProtocolStats();
  stats.activeBuildings = stats.activeBuildings.minus(ONE_BI);
  stats.save();
}

export function addProtocolFees(feeAmount: BigDecimal): void {
  let stats = getOrCreateProtocolStats();
  stats.totalFeesCollected = stats.totalFeesCollected.plus(feeAmount);
  stats.save();
}
