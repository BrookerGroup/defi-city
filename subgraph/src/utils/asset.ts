import { Address } from "@graphprotocol/graph-ts";
import { Asset } from "../../generated/schema";
import { ERC20 } from "../../generated/DefiCityCore/ERC20";
import { ZERO_BD, ZERO_BI, ETH_ADDRESS } from "./helpers";

export function getOrCreateAsset(address: Address): Asset {
  let asset = Asset.load(address.toHex());

  if (asset == null) {
    asset = new Asset(address.toHex());

    // Handle ETH
    if (address.equals(ETH_ADDRESS)) {
      asset.symbol = "ETH";
      asset.name = "Ethereum";
      asset.decimals = 18;
    } else {
      // Try to get ERC20 info
      let tokenContract = ERC20.bind(address);

      let symbolResult = tokenContract.try_symbol();
      asset.symbol = symbolResult.reverted ? "UNKNOWN" : symbolResult.value;

      let nameResult = tokenContract.try_name();
      asset.name = nameResult.reverted ? "Unknown Token" : nameResult.value;

      let decimalsResult = tokenContract.try_decimals();
      asset.decimals = decimalsResult.reverted ? 18 : decimalsResult.value;
    }

    asset.totalDeposited = ZERO_BD;
    asset.totalWithdrawn = ZERO_BD;
    asset.totalBalance = ZERO_BD;
    asset.priceUSD = null;
    asset.updatedAt = ZERO_BI;
  }

  return asset;
}
