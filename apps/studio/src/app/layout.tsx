import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { AppNav } from "@/components/aix/AppNav";
import { TopBar } from "@/components/aix/TopBar";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AIX Studio — Sovereign Protocol",
  description: "The Global Marketplace for Autonomous AI Agents, secured by Pi Network KYC.",
};

function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="aurora-1 absolute -left-32 top-0 h-[55vh] w-[55vh] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.45 0.10 240 / 0.5), transparent 70%)" }}
      />
      <div
        className="aurora-2 absolute -right-32 bottom-0 h-[60vh] w-[60vh] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.42 0.10 290 / 0.5), transparent 70%)" }}
      />
      <div
        className="absolute left-1/3 top-1/2 h-[40vh] w-[40vh] -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.08 200 / 0.5), transparent 70%)" }}
      />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body
        className={`${manrope.variable} ${inter.variable} min-h-screen bg-[var(--color-background)] text-[var(--color-on-background)] font-sans antialiased overflow-x-hidden`}
      >
        <AuroraBackground />
        <div className="flex min-h-screen w-full gap-4 p-4">
          {/* Left rail (RTL: visually right) */}
          <aside className="hidden w-[260px] shrink-0 flex-col gap-4 lg:flex">
            <AppNav />
            <div className="flex-1 overflow-hidden">
              {/* Sidebar content removed */}
            </div>
          </aside>

          {/* Main */}
          <main className="flex min-w-0 flex-1 flex-col gap-4">
            <TopBar />
            <div className="flex-1 min-h-0">
              {children}
            </div>
          </main>
        </div>

        {/* Pi Network SDK */}
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
