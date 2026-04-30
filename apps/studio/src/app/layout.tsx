import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'sonner';
import { WalletProvider } from '@/components/providers/WalletProvider';
import dynamic from 'next/dynamic';

const SovereignAether = dynamic(
  () => import('@/components/studio/SovereignAether').then(mod => mod.SovereignAether),
  { ssr: false, loading: () => null }
);

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

export const metadata: Metadata = {
  title: "Sovereign Pi Agents Studio",
  description: "The Global Marketplace for Autonomous AI Agents, secured by Pi Network KYC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${manrope.variable} ${inter.variable} min-h-screen bg-[var(--color-background)] text-[var(--color-on-background)] font-sans antialiased overflow-x-hidden`}
      >
        <Toaster richColors theme="dark" position="bottom-right" />
        <SovereignAether />
        <div className="relative z-10 flex flex-col min-h-screen">
          <WalletProvider>
            {children}
          </WalletProvider>
        </div>

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
