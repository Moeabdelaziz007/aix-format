import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, sepolia } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'AIX Studio',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
              'aix-studio-dev',
  chains: [mainnet, polygon, sepolia],
  ssr: true,
});

export const SUPPORTED_CHAINS = [mainnet, polygon, sepolia];
