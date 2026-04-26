import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
        {/* Ambient background glow */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-primary-dim)] opacity-20 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--color-secondary)] opacity-10 blur-[150px]" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>

        {/* Pi Network SDK */}
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
