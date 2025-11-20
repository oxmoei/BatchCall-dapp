"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet, polygon, bsc, arbitrum, base, sepolia, optimism } from "viem/chains";
import { ReactNode } from "react";
import { metaMask } from "wagmi/connectors";

export const connectors = [
   metaMask({
     infuraAPIKey: process.env.NEXT_PUBLIC_INFURA_API_KEY,
   }),
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, bsc, arbitrum, base, sepolia, optimism],
  connectors,
  multiInjectedProviderDiscovery: false,
  ssr: false,
  transports: {
    [mainnet.id]: http('https://eth.llamarpc.com', { retryCount: 3 }),
    [polygon.id]: http('https://polygon-rpc.com', { retryCount: 3 }),
    [bsc.id]: http('https://bsc-dataseed.binance.org', { retryCount: 3 }),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc', { retryCount: 3 }),
    [base.id]: http('https://mainnet.base.org', { retryCount: 3 }),
    [sepolia.id]: http('https://rpc.sepolia.org', { retryCount: 3 }),
    [optimism.id]: http('https://mainnet.optimism.io', { retryCount: 3 }),
  },
});

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
}