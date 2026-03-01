import { defineChain } from "viem";

export const goatTestnet3 = defineChain({
  id: 48816,
  name: "GOAT Testnet3",
  nativeCurrency: {
    decimals: 18,
    name: "Bitcoin",
    symbol: "BTC",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet3.goat.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "GOAT Explorer",
      url: "https://explorer.testnet3.goat.network",
    },
  },
  testnet: true,
});
