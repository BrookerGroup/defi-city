import { FeeCollected, FeeUpdated } from "../../generated/FeeManager/FeeManager";
import { getOrCreateAsset } from "../utils/asset";
import { addProtocolFees } from "../utils/protocol";
import { convertTokenToDecimal } from "../utils/helpers";

export function handleFeeCollected(event: FeeCollected): void {
  let asset = getOrCreateAsset(event.params.asset);
  let feeAmount = convertTokenToDecimal(event.params.amount, asset.decimals);

  // Update protocol fee stats
  addProtocolFees(feeAmount);
}

export function handleFeeUpdated(event: FeeUpdated): void {
  // Fee percentage updated
  // Could track fee history in a separate entity if needed
}
