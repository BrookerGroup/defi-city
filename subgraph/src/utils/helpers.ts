import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString("0");
export let ONE_BD = BigDecimal.fromString("1");
export let BI_18 = BigInt.fromI32(18);

// ETH address constant (0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
export let ETH_ADDRESS = Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");

// Convert token amount to decimal based on token decimals
export function convertTokenToDecimal(amount: BigInt, decimals: i32): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(decimals as u8)
    .toBigDecimal();
  return amount.toBigDecimal().div(precision);
}

// Convert decimal to token amount based on decimals
export function convertDecimalToToken(amount: BigDecimal, decimals: i32): BigInt {
  let precision = BigInt.fromI32(10).pow(decimals as u8);
  return BigInt.fromString(amount.times(precision.toBigDecimal()).truncate(0).toString());
}

// Get timestamp for start of day
export function getDayTimestamp(timestamp: BigInt): BigInt {
  let dayInSeconds = BigInt.fromI32(86400);
  return timestamp.div(dayInSeconds).times(dayInSeconds);
}

// Get timestamp for start of hour
export function getHourTimestamp(timestamp: BigInt): BigInt {
  let hourInSeconds = BigInt.fromI32(3600);
  return timestamp.div(hourInSeconds).times(hourInSeconds);
}

// Get day ID from timestamp
export function getDayId(timestamp: BigInt): i32 {
  return timestamp.div(BigInt.fromI32(86400)).toI32();
}

// Get hour ID from timestamp
export function getHourId(timestamp: BigInt): i32 {
  return timestamp.div(BigInt.fromI32(3600)).toI32();
}

// Exponentiation for BigDecimal (for APY calculations)
export function exponentiate(base: BigDecimal, exponent: BigInt): BigDecimal {
  if (exponent.equals(ZERO_BI)) {
    return ONE_BD;
  }

  let result = base;
  let exp = exponent.minus(ONE_BI);

  while (exp.gt(ZERO_BI)) {
    result = result.times(base);
    exp = exp.minus(ONE_BI);
  }

  return result;
}

// Calculate percentage
export function calculatePercentage(part: BigDecimal, whole: BigDecimal): BigDecimal {
  if (whole.equals(ZERO_BD)) {
    return ZERO_BD;
  }
  return part.div(whole).times(BigDecimal.fromString("100"));
}
