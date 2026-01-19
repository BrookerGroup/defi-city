import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  BuildingPlaced,
  DepositedToBuilding,
  Harvested,
  BuildingDemolished,
} from "../../generated/BuildingManager/BuildingManager";
import {
  Building,
  BuildingType,
  BuildingPlaced as BuildingPlacedTx,
  Deposit,
  Harvest,
  BuildingDemolished as BuildingDemolishedTx,
  User,
} from "../../generated/schema";
import { ZERO_BD, ZERO_BI, ONE_BI, convertTokenToDecimal } from "../utils/helpers";
import { getOrCreateUser, updateUserTimestamp, incrementUserBuildings, decrementUserActiveBuildings } from "../utils/user";
import { getOrCreateAsset } from "../utils/asset";
import { incrementProtocolBuildings, decrementProtocolActiveBuildings, addProtocolFees, updateProtocolStats } from "../utils/protocol";
import { updateDailyStats, incrementDailyBuildingsPlaced, incrementDailyBuildingsDemolished } from "../utils/stats";

export function handleBuildingPlaced(event: BuildingPlaced): void {
  let user = getOrCreateUser(event.params.user);
  let asset = getOrCreateAsset(event.params.assetType);

  // Get or create building type
  let buildingTypeId = event.params.buildingType.toString();
  let buildingType = BuildingType.load(buildingTypeId);
  if (buildingType == null) {
    buildingType = new BuildingType(buildingTypeId);
    buildingType.name = getBuildingTypeName(event.params.buildingType);
    buildingType.strategy = event.params.strategy;
    buildingType.minDeposit = getMinDeposit(event.params.buildingType);
    buildingType.totalBuildings = ZERO_BI;
    buildingType.activeBuildings = ZERO_BI;
    buildingType.totalDeposited = ZERO_BD;
    buildingType.currentAPY = ZERO_BD;
    buildingType.updatedAt = event.block.timestamp;
  }

  // Create building
  let buildingId = event.params.user.toHex() + "-" + event.params.buildingId.toString();
  let building = new Building(buildingId);
  building.owner = user.id;
  building.buildingId = event.params.buildingId;
  building.buildingType = buildingType.id;
  building.asset = asset.id;
  building.depositedAmount = convertTokenToDecimal(event.params.initialAmount, asset.decimals);
  building.shares = convertTokenToDecimal(event.params.shares, asset.decimals);
  building.isActive = true;
  building.createdAt = event.block.timestamp;
  building.createdAtBlock = event.block.number;
  building.demolishedAt = null;
  building.demolishedAtBlock = null;
  building.totalHarvested = ZERO_BD;
  building.harvestCount = ZERO_BI;
  building.updatedAt = event.block.timestamp;
  building.updatedAtBlock = event.block.number;
  building.save();

  // Update user
  incrementUserBuildings(user);
  updateUserTimestamp(user, event.block);
  user.save();

  // Update building type
  buildingType.totalBuildings = buildingType.totalBuildings.plus(ONE_BI);
  buildingType.activeBuildings = buildingType.activeBuildings.plus(ONE_BI);
  buildingType.totalDeposited = buildingType.totalDeposited.plus(building.depositedAmount);
  buildingType.updatedAt = event.block.timestamp;
  buildingType.save();

  // Update protocol stats
  incrementProtocolBuildings();

  // Calculate fee (event.params.fee is the fee amount)
  let feeAmount = convertTokenToDecimal(event.params.fee, asset.decimals);
  addProtocolFees(feeAmount);

  // Create building placed transaction
  let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let tx = new BuildingPlacedTx(txId);
  tx.user = user.id;
  tx.building = building.id;
  tx.buildingType = buildingType.id;
  tx.asset = asset.id;
  tx.initialDeposit = building.depositedAmount;
  tx.fee = feeAmount;
  tx.hash = event.transaction.hash;
  tx.timestamp = event.block.timestamp;
  tx.blockNumber = event.block.number;
  tx.save();

  // Update daily stats
  incrementDailyBuildingsPlaced(event.block);
  updateDailyStats(event.block, building.depositedAmount, ZERO_BD, ZERO_BD, feeAmount);
}

export function handleDepositedToBuilding(event: DepositedToBuilding): void {
  let user = getOrCreateUser(event.params.user);
  let buildingId = event.params.user.toHex() + "-" + event.params.buildingId.toString();
  let building = Building.load(buildingId);

  if (building == null) {
    return; // Building not found, shouldn't happen
  }

  let asset = getOrCreateAsset(Address.fromString(building.asset));
  let amount = convertTokenToDecimal(event.params.amount, asset.decimals);

  // Update building
  building.depositedAmount = building.depositedAmount.plus(amount);
  building.updatedAt = event.block.timestamp;
  building.updatedAtBlock = event.block.number;
  building.save();

  // Update building type
  let buildingType = BuildingType.load(building.buildingType);
  if (buildingType != null) {
    buildingType.totalDeposited = buildingType.totalDeposited.plus(amount);
    buildingType.updatedAt = event.block.timestamp;
    buildingType.save();
  }

  // Create deposit transaction
  let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let deposit = new Deposit(txId);
  deposit.user = user.id;
  deposit.building = building.id;
  deposit.asset = asset.id;
  deposit.amount = amount;
  deposit.shares = ZERO_BD; // TODO: Get shares from event if available
  deposit.fee = ZERO_BD;
  deposit.hash = event.transaction.hash;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  deposit.save();

  // Update protocol stats
  updateProtocolStats(asset, amount, ZERO_BD, ZERO_BD, event.block);

  // Update daily stats
  updateDailyStats(event.block, amount, ZERO_BD, ZERO_BD, ZERO_BD);
}

export function handleHarvested(event: Harvested): void {
  let user = getOrCreateUser(event.params.user);
  let buildingId = event.params.user.toHex() + "-" + event.params.buildingId.toString();
  let building = Building.load(buildingId);

  if (building == null) {
    return;
  }

  let asset = getOrCreateAsset(Address.fromString(building.asset));
  let rewards = convertTokenToDecimal(event.params.rewards, asset.decimals);

  // Update building
  building.totalHarvested = building.totalHarvested.plus(rewards);
  building.harvestCount = building.harvestCount.plus(ONE_BI);
  building.updatedAt = event.block.timestamp;
  building.updatedAtBlock = event.block.number;
  building.save();

  // Update user
  user.totalEarned = user.totalEarned.plus(rewards);
  updateUserTimestamp(user, event.block);
  user.save();

  // Create harvest transaction
  let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let harvest = new Harvest(txId);
  harvest.user = user.id;
  harvest.building = building.id;
  harvest.asset = asset.id;
  harvest.rewards = rewards;
  harvest.hash = event.transaction.hash;
  harvest.timestamp = event.block.timestamp;
  harvest.blockNumber = event.block.number;
  harvest.save();

  // Update protocol stats
  updateProtocolStats(asset, ZERO_BD, ZERO_BD, rewards, event.block);

  // Update daily stats
  updateDailyStats(event.block, ZERO_BD, ZERO_BD, rewards, ZERO_BD);
}

export function handleBuildingDemolished(event: BuildingDemolished): void {
  let user = getOrCreateUser(event.params.user);
  let buildingId = event.params.user.toHex() + "-" + event.params.buildingId.toString();
  let building = Building.load(buildingId);

  if (building == null) {
    return;
  }

  let asset = getOrCreateAsset(Address.fromString(building.asset));
  let withdrawn = convertTokenToDecimal(event.params.withdrawn, asset.decimals);

  // Update building
  building.isActive = false;
  building.demolishedAt = event.block.timestamp;
  building.demolishedAtBlock = event.block.number;
  building.updatedAt = event.block.timestamp;
  building.updatedAtBlock = event.block.number;
  building.save();

  // Update user
  decrementUserActiveBuildings(user);
  updateUserTimestamp(user, event.block);
  user.save();

  // Update building type
  let buildingType = BuildingType.load(building.buildingType);
  if (buildingType != null) {
    buildingType.activeBuildings = buildingType.activeBuildings.minus(ONE_BI);
    buildingType.updatedAt = event.block.timestamp;
    buildingType.save();
  }

  // Update protocol stats
  decrementProtocolActiveBuildings();

  // Create demolish transaction
  let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let tx = new BuildingDemolishedTx(txId);
  tx.user = user.id;
  tx.building = building.id;
  tx.asset = asset.id;
  tx.withdrawn = withdrawn;
  tx.hash = event.transaction.hash;
  tx.timestamp = event.block.timestamp;
  tx.blockNumber = event.block.number;
  tx.save();

  // Update daily stats
  incrementDailyBuildingsDemolished(event.block);
  updateDailyStats(event.block, ZERO_BD, withdrawn, ZERO_BD, ZERO_BD);
}

// Helper functions

function getBuildingTypeName(buildingType: BigInt): string {
  if (buildingType.equals(ZERO_BI)) return "Town Hall";
  if (buildingType.equals(ONE_BI)) return "Bank";
  if (buildingType.equals(BigInt.fromI32(2))) return "Shop";
  if (buildingType.equals(BigInt.fromI32(3))) return "Lottery";
  return "Unknown";
}

function getMinDeposit(buildingType: BigInt): BigDecimal {
  if (buildingType.equals(ZERO_BI)) return ZERO_BD; // Town Hall - free
  if (buildingType.equals(ONE_BI)) return BigDecimal.fromString("100"); // Bank - $100
  if (buildingType.equals(BigInt.fromI32(2))) return BigDecimal.fromString("500"); // Shop - $500
  if (buildingType.equals(BigInt.fromI32(3))) return BigDecimal.fromString("10"); // Lottery - $10
  return ZERO_BD;
}
