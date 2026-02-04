/**
 * Uniswap V3 on Base Sepolia
 * @see https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments
 */
module.exports = {
  SWAP_ROUTER_02: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4',
  QUOTER_V2: '0xC5290058841028F1614F3A6F0F5816cAd0df5E27',
  V3_FACTORY: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
  WETH: '0x4200000000000000000000000000000000000006',
  // Fee tiers: 500 = 0.05%, 3000 = 0.3%, 10000 = 1%
  FEE_LOW: 500,
  FEE_MEDIUM: 3000,
  FEE_HIGH: 10000,
};
