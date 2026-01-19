import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { DailyStats, HourlyStats } from "../../generated/schema";
import { ZERO_BI, ZERO_BD, ONE_BI, getDayTimestamp, getHourTimestamp, getDayId, getHourId } from "./helpers";
import { getOrCreateProtocolStats } from "./protocol";

export function updateDailyStats(
  block: ethereum.Block,
  depositVolume: BigDecimal,
  withdrawVolume: BigDecimal,
  harvestVolume: BigDecimal,
  feesCollected: BigDecimal
): void {
  let dayTimestamp = getDayTimestamp(block.timestamp);
  let dayId = getDayId(block.timestamp);
  let id = dayTimestamp.toString();

  let stats = DailyStats.load(id);

  if (stats == null) {
    stats = new DailyStats(id);
    stats.date = dayId;
    stats.activeUsers = ZERO_BI;
    stats.newUsers = ZERO_BI;
    stats.buildingsPlaced = ZERO_BI;
    stats.buildingsDemolished = ZERO_BI;
    stats.depositVolume = ZERO_BD;
    stats.withdrawVolume = ZERO_BD;
    stats.harvestVolume = ZERO_BD;
    stats.tvl = ZERO_BD;
    stats.feesCollected = ZERO_BD;
    stats.timestamp = dayTimestamp;
  }

  // Update volumes
  stats.depositVolume = stats.depositVolume.plus(depositVolume);
  stats.withdrawVolume = stats.withdrawVolume.plus(withdrawVolume);
  stats.harvestVolume = stats.harvestVolume.plus(harvestVolume);
  stats.feesCollected = stats.feesCollected.plus(feesCollected);

  // Update TVL from protocol stats
  let protocolStats = getOrCreateProtocolStats();
  stats.tvl = protocolStats.currentTVL;

  stats.save();
}

export function updateHourlyStats(
  block: ethereum.Block,
  depositVolume: BigDecimal,
  withdrawVolume: BigDecimal
): void {
  let hourTimestamp = getHourTimestamp(block.timestamp);
  let hourId = getHourId(block.timestamp);
  let id = hourTimestamp.toString();

  let stats = HourlyStats.load(id);

  if (stats == null) {
    stats = new HourlyStats(id);
    stats.hour = hourId;
    stats.activeUsers = ZERO_BI;
    stats.depositVolume = ZERO_BD;
    stats.withdrawVolume = ZERO_BD;
    stats.tvl = ZERO_BD;
    stats.timestamp = hourTimestamp;
  }

  // Update volumes
  stats.depositVolume = stats.depositVolume.plus(depositVolume);
  stats.withdrawVolume = stats.withdrawVolume.plus(withdrawVolume);

  // Update TVL from protocol stats
  let protocolStats = getOrCreateProtocolStats();
  stats.tvl = protocolStats.currentTVL;

  stats.save();
}

export function incrementDailyBuildingsPlaced(block: ethereum.Block): void {
  let dayTimestamp = getDayTimestamp(block.timestamp);
  let id = dayTimestamp.toString();
  let stats = DailyStats.load(id);

  if (stats != null) {
    stats.buildingsPlaced = stats.buildingsPlaced.plus(ONE_BI);
    stats.save();
  }
}

export function incrementDailyBuildingsDemolished(block: ethereum.Block): void {
  let dayTimestamp = getDayTimestamp(block.timestamp);
  let id = dayTimestamp.toString();
  let stats = DailyStats.load(id);

  if (stats != null) {
    stats.buildingsDemolished = stats.buildingsDemolished.plus(ONE_BI);
    stats.save();
  }
}
