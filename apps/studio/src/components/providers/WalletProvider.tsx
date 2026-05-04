'use client';

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wallet-config';
import '@rainbow-me/rainbowkit/styles.css';

import { useEffect } from 'react';

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initPi = () => {
      if (typeof window !== 'undefined' && (window as any).Pi) {
        console.log('Initializing Pi SDK...');
        try {
          (window as any).Pi.init({
            version: '2.0',
            sandbox: process.env.NODE_ENV !== 'production'
          });
        } catch (e) {
          console.error('Failed to initialize Pi SDK:', e);
        }
      }
    };

    // If script is already loaded
    if ((window as any).Pi) {
      initPi();
    } else {
      window.addEventListener('load', initPi);
    }
    
    return () => window.removeEventListener('load', initPi);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#6366f1',        // indigo-500
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'system',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
