"use client";

import { createContext, useContext } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "@/lib/wagmi-config";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;
const queryClient = new QueryClient();

/**
 * Context that signals whether ConvexProvider is available.
 * Hooks can check this before calling useQuery/useMutation to avoid
 * errors when Convex is not configured (e.g., during build or SSR).
 */
const ConvexAvailableContext = createContext(false);

export function useConvexAvailable(): boolean {
  return useContext(ConvexAvailableContext);
}

function ConvexWrapper({ children }: { children: React.ReactNode }) {
  if (!convex) {
    return (
      <ConvexAvailableContext.Provider value={false}>
        {children}
      </ConvexAvailableContext.Provider>
    );
  }
  return (
    <ConvexAvailableContext.Provider value={true}>
      <ConvexProvider client={convex}>{children}</ConvexProvider>
    </ConvexAvailableContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ConvexWrapper>
            {children}
          </ConvexWrapper>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
