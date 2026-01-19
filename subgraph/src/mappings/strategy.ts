import { BigInt } from "@graphprotocol/graph-ts";
import {
  StrategyRegistered,
  StrategyActivated,
  StrategyDeprecated,
} from "../../generated/StrategyRegistry/StrategyRegistry";
import { Strategy, BuildingType } from "../../generated/schema";
import { ZERO_BI, ZERO_BD } from "../utils/helpers";

export function handleStrategyRegistered(event: StrategyRegistered): void {
  let strategyId = event.params.strategy.toHex();
  let strategy = Strategy.load(strategyId);

  if (strategy == null) {
    strategy = new Strategy(strategyId);
    strategy.totalDeposited = ZERO_BD;
    strategy.totalWithdrawn = ZERO_BD;
    strategy.totalHarvested = ZERO_BD;
    strategy.currentTVL = ZERO_BD;
    strategy.currentAPY = ZERO_BD;
    strategy.isActive = false;
    strategy.activatedAt = ZERO_BI;
    strategy.deactivatedAt = null;
  }

  // Update building type reference
  let buildingTypeId = event.params.buildingType.toString();
  let buildingType = BuildingType.load(buildingTypeId);
  if (buildingType != null) {
    strategy.buildingType = buildingType.id;
    buildingType.strategy = event.params.strategy;
    buildingType.save();
  }

  strategy.version = event.params.version;
  strategy.updatedAt = event.block.timestamp;
  strategy.save();
}

export function handleStrategyActivated(event: StrategyActivated): void {
  let strategyId = event.params.strategy.toHex();
  let strategy = Strategy.load(strategyId);

  if (strategy != null) {
    strategy.isActive = true;
    strategy.activatedAt = event.block.timestamp;
    strategy.deactivatedAt = null;
    strategy.updatedAt = event.block.timestamp;
    strategy.save();
  }

  // Update building type
  let buildingTypeId = event.params.buildingType.toString();
  let buildingType = BuildingType.load(buildingTypeId);
  if (buildingType != null) {
    buildingType.strategy = event.params.strategy;
    buildingType.updatedAt = event.block.timestamp;
    buildingType.save();
  }
}

export function handleStrategyDeprecated(event: StrategyDeprecated): void {
  let strategyId = event.params.strategy.toHex();
  let strategy = Strategy.load(strategyId);

  if (strategy != null) {
    strategy.isActive = false;
    strategy.deactivatedAt = event.block.timestamp;
    strategy.updatedAt = event.block.timestamp;
    strategy.save();
  }
}
