"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet, polygon, bsc, arbitrum, base, sepolia, optimism } from "viem/chains";
import { defineChain } from "viem";
import { ReactNode } from "react";
import { metaMask } from "wagmi/connectors";

// Define Monad chain
// 注意：Monad 链目前尚未被 viem/chains 官方支持，因此需要使用 defineChain 手动定义
// 如果未来 viem 添加了 Monad 支持，可以改为从 viem/chains 导入
export const monad = defineChain({
  id: 143,
  name: 'Monad',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://monad-mainnet.api.onfinality.io/public'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://monad.socialscan.io',
    },
  },
});

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
  chains: [mainnet, polygon, bsc, arbitrum, base, sepolia, optimism, monad],
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
    [monad.id]: http('https://monad-mainnet.api.onfinality.io/public', { retryCount: 3 }),
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