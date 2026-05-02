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
                    className="btn btn-sm bg-[var(--color-primary)] text-black font-black uppercase tracking-wider"
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
                    className="btn btn-sm border-[var(--color-success)] text-[var(--color-success)] font-black uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-[var(--color-success)] rounded-none" />
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
