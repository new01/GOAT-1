import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { goatTestnet3 } from "./chains";

// WalletConnect projectId is required by RainbowKit.
// Get one free at https://dashboard.reown.com/
// Without a real project ID, wallet connection will not work.
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "PLACEHOLDER";

export const wagmiConfig = getDefaultConfig({
  appName: "Hello GOAT",
  projectId,
  chains: [goatTestnet3],
  transports: {
    [goatTestnet3.id]: http(goatTestnet3.rpcUrls.default.http[0]),
  },
  ssr: true,
});
