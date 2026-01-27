// Token addresses for Base Sepolia testnet - Whitelist approach
export const TOKENS = {
  ETH: {
    symbol: "ETH",
    decimals: 18,
    address: "0x0000000000000000000000000000000000000000" as const,
    isNative: true,
  },
  USDC: {
    symbol: "USDC",
    decimals: 6,
    address: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f" as const,
    isNative: false,
  },
  // Add more testnet tokens here
  // WETH: {
  //   symbol: "WETH",
  //   decimals: 18,
  //   address: "0x..." as const,
  //   isNative: false,
  // },
} as const;

export type TokenSymbol = keyof typeof TOKENS;

// Whitelist of supported tokens for the UI
export const TOKEN_LIST = Object.values(TOKENS);

// Standard ERC20 ABI for balance, transfer, and approve
export const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
