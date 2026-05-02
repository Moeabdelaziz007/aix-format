'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Wallet, Shield } from 'lucide-react';

export function WalletButton() {
  const { isConnected } = useAccount();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-xl text-indigo-400 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 [0_4px_12px_rgba(99,102,241,0.1)]"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    Link Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="btn btn-sm bg-[var(--color-error)] text-white font-black uppercase tracking-wider"
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    className="btn btn-sm btn-ghost border-white/10 text-zinc-400 font-medium uppercase tracking-tight"
                  >
                    {chain.hasIcon && (
                      <div className="w-4 h-4">
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="w-4 h-4"
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    className="flex items-center gap-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold transition-all [0_4px_12px_rgba(16,185,129,0.1)]"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse [0_0_8px_rgba(52,211,153,0.6)]" />
                      <span className="font-mono">{account.displayName}</span>
                    </div>
                    <Shield className="w-3 h-3 opacity-50" />
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
