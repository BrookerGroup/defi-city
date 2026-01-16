import { TicketsPurchased } from "../../generated/MegapotStrategy/MegapotStrategy";
import { LotteryTicket, Building, User } from "../../generated/schema";
import { convertTokenToDecimal } from "../utils/helpers";
import { getOrCreateUser } from "../utils/user";
import { getOrCreateAsset } from "../utils/asset";
import { Address } from "@graphprotocol/graph-ts";

const USDC_DECIMALS = 6;

export function handleTicketsPurchased(event: TicketsPurchased): void {
  let user = getOrCreateUser(event.params.user);

  // Get building
  let buildingId = event.params.user.toHex() + "-" + event.params.buildingId.toString();
  let building = Building.load(buildingId);

  if (building == null) {
    return; // Building not found
  }

  // Convert amount to decimal
  let amount = convertTokenToDecimal(event.params.amountSpent, USDC_DECIMALS);

  // Create lottery ticket record
  let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let ticket = new LotteryTicket(txId);
  ticket.user = user.id;
  ticket.building = building.id;
  ticket.ticketCount = event.params.ticketCount;
  ticket.amount = amount;
  ticket.timestamp = event.block.timestamp;
  ticket.blockNumber = event.block.number;
  ticket.hash = event.transaction.hash;
  ticket.save();
}
