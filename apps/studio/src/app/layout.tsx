import React from 'react';
import type { Metadata } from "next";
import { Manrope, Inter, JetBrains_Mono, Oswald, Poppins } from "next/font/google";
import "./globals.css";
import "./expert-animations.css";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'sonner';
import { WalletProvider } from '@/components/providers/WalletProvider';
import { VoiceCommandProvider } from '@/components/providers/VoiceCommandProvider';
import { SovereignAetherClient } from '@/components/studio/SovereignAetherClient';
import { GlobalVoiceCommandPalette } from '@/components/studio/GlobalVoiceCommandPalette';
import { GlobalVoiceFAB } from '@/components/studio/GlobalVoiceFAB';
import { validateEnv } from '@/lib/env';

// Run environment validation on startup
validateEnv();

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sovereign Pi Agents Studio",
  description: "The Global Marketplace for Autonomous AI Agents, secured by Pi Network KYC.",
};

// ROLE: layout
function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable} ${oswald.variable} ${poppins.variable} min-h-screen bg-[var(--color-background)] text-[var(--color-on-background)] font-sans antialiased overflow-x-hidden`}
      >
        <Toaster richColors theme="dark" position="bottom-right" />
        <SovereignAetherClient />
        <VoiceCommandProvider>
          <div className="relative z-10 flex flex-col min-h-screen">
            <WalletProvider>
              {children}
            </WalletProvider>
          </div>
          {/* Global voice UI — rendered once, available on every page */}
          <GlobalVoiceCommandPalette />
          <GlobalVoiceFAB />
        </VoiceCommandProvider>

        {/*
          Pi Network SDK — must use afterInteractive.
          beforeInteractive only works for self-hosted scripts in Next.js 13+.
          External CDN scripts with beforeInteractive will throw a build error.
        */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="afterInteractive"
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

export default React.memo(RootLayout);

RootLayout.displayName = 'RootLayout';
