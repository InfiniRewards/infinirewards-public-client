export const pointsContractAbi = [
  {
    name: "get_details",
    type: "function",
    inputs: [],
    outputs: [
      { name: "name", type: "ByteArray" },
      { name: "symbol", type: "ByteArray" },
      { name: "metadata", type: "ByteArray" },
      { name: "decimals", type: "u8" },
      { name: "total_supply", type: "u256" }
    ],
    stateMutability: "view"
  }
];

export const collectibleContractAbi = [
  {
    name: "get_details",
    type: "function",
    inputs: [],
    outputs: [
      { name: "name", type: "ByteArray" },
      { name: "metadata", type: "ByteArray" },
      { name: "points_contract", type: "ContractAddress" },
      { name: "token_ids", type: "Array<u256>" },
      { name: "token_prices", type: "Array<u256>" },
      { name: "token_expiry", type: "Array<u64>" },
      { name: "token_metadata", type: "Array<ByteArray>" },
      { name: "token_supplies", type: "Array<u256>" }
    ],
    stateMutability: "view"
  },
  {
    name: "get_token_data",
    type: "function",
    inputs: [{ name: "token_id", type: "u256" }],
    outputs: [
      { name: "points_contract", type: "ContractAddress" },
      { name: "price", type: "u256" },
      { name: "expiry", type: "u64" },
      { name: "metadata", type: "ByteArray" },
      { name: "supply", type: "u256" }
    ],
    stateMutability: "view"
  }
];