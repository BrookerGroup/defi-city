import { Address, ethereum } from "@graphprotocol/graph-ts";
import { User } from "../../generated/schema";
import { ZERO_BI, ZERO_BD, ONE_BI } from "./helpers";

export function getOrCreateUser(address: Address): User {
  let user = User.load(address.toHex());

  if (user == null) {
    user = new User(address.toHex());
    user.cityCreatedAt = ZERO_BI;
    user.totalBuildings = ZERO_BI;
    user.activeBuildings = ZERO_BI;
    user.totalDeposited = ZERO_BD;
    user.totalWithdrawn = ZERO_BD;
    user.totalEarned = ZERO_BD;
    user.updatedAt = ZERO_BI;
    user.updatedAtBlock = ZERO_BI;
  }

  return user;
}

export function updateUserTimestamp(user: User, block: ethereum.Block): void {
  user.updatedAt = block.timestamp;
  user.updatedAtBlock = block.number;

  // Set city creation time if this is first interaction
  if (user.cityCreatedAt.equals(ZERO_BI)) {
    user.cityCreatedAt = block.timestamp;
  }
}

export function incrementUserBuildings(user: User): void {
  user.totalBuildings = user.totalBuildings.plus(ONE_BI);
  user.activeBuildings = user.activeBuildings.plus(ONE_BI);
}

export function decrementUserActiveBuildings(user: User): void {
  user.activeBuildings = user.activeBuildings.minus(ONE_BI);
}
