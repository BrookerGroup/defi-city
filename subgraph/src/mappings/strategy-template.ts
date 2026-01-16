import { ethereum, BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import { Strategy, APYSnapshot } from "../../generated/schema";
import { IStrategy } from "../../generated/templates/Strategy/IStrategy";
import { ZERO_BD } from "../utils/helpers";

// This template is used for dynamically tracking strategy instances
// Event handlers would be added here for strategy-specific events

export function handleStrategyEvent(event: ethereum.Event): void {
  // Generic handler for strategy events
  // Could track deposits, withdrawals, harvests at strategy level
}

// Helper to update APY snapshot
export function updateAPYSnapshot(strategyAddress: Address, block: ethereum.Block): void {
  let strategyId = strategyAddress.toHex();
  let strategy = Strategy.load(strategyId);

  if (strategy == null) {
    return;
  }

  // Get APY from strategy contract
  let strategyContract = IStrategy.bind(strategyAddress);
  let apyResult = strategyContract.try_getAPY();

  if (!apyResult.reverted) {
    let apy = apyResult.value.toBigDecimal().div(BigDecimal.fromString("100")); // Convert basis points to percentage

    // Update strategy current APY
    strategy.currentAPY = apy;
    strategy.updatedAt = block.timestamp;
    strategy.save();

    // Create APY snapshot
    let snapshotId = strategyId + "-" + block.timestamp.toString();
    let snapshot = new APYSnapshot(snapshotId);
    snapshot.strategy = strategy.id;
    snapshot.apy = apy;
    snapshot.timestamp = block.timestamp;
    snapshot.blockNumber = block.number;
    snapshot.save();
  }
}
