export const DEFICITY_CORE_ADDRESS = "0xf9678a801Bf0E16C3781157A859741B87c9bC8eF" as const;

export const DEFICITY_CORE_ABI = [
  {
    inputs: [{ internalType: "address", name: "_treasury", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "uint256", name: "x", type: "uint256" },
      { internalType: "uint256", name: "y", type: "uint256" },
    ],
    name: "createTownHall",
    outputs: [
      { internalType: "address", name: "walletAddress", type: "address" },
      { internalType: "uint256", name: "buildingId", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserBuildings",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "smartWallet", type: "address" },
          { internalType: "string", name: "buildingType", type: "string" },
          { internalType: "address", name: "asset", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "placedAt", type: "uint256" },
          { internalType: "uint256", name: "coordinateX", type: "uint256" },
          { internalType: "uint256", name: "coordinateY", type: "uint256" },
          { internalType: "bool", name: "active", type: "bool" },
          { internalType: "bytes", name: "metadata", type: "bytes" },
        ],
        internalType: "struct DefiCityCore.Building[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserStats",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "totalDeposited", type: "uint256" },
          { internalType: "uint256", name: "totalWithdrawn", type: "uint256" },
          { internalType: "uint256", name: "totalHarvested", type: "uint256" },
          { internalType: "uint256", name: "buildingCount", type: "uint256" },
          { internalType: "uint256", name: "cityCreatedAt", type: "uint256" },
        ],
        internalType: "struct DefiCityCore.UserStats",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "hasWallet",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getWallet",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "buildingId", type: "uint256" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "smartWallet", type: "address" },
      { indexed: false, internalType: "string", name: "buildingType", type: "string" },
      { indexed: false, internalType: "address", name: "asset", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "x", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "y", type: "uint256" },
    ],
    name: "BuildingPlaced",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "smartWallet", type: "address" },
    ],
    name: "WalletRegistered",
    type: "event",
  },
] as const;
