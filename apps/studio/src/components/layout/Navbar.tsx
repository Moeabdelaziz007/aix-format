"use client";
import { WalletButton } from '@/components/studio/WalletButton';

import { APP_VERSION } from "@/lib/version";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Shield, Cpu, Activity, Wallet, LogOut, ChevronDown, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface PiUser {
  username: string;
  uid: string;
}

interface PiAuthResult {
  user: PiUser;
  accessToken: string;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/builder", label: "Builder" },
  { href: "/my-agents", label: "Fleet" },
  { href: "/marketplace", label: "Market" },
  { href: "/analytics", label: "Analytics" },
  { href: "/spec", label: "Spec" },
  { href: "/settings", label: "Settings" },
];

function AxiomLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5L10 25V75L50 95L90 75V25L50 5Z" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
      <path d="M50 25V75M25 62.5L75 37.5M25 37.5L75 62.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<PiUser | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePiAuth = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      if (typeof window !== "undefined" && (window as any).Pi) {
        const authResult: PiAuthResult = await (window as any).Pi.authenticate(["username", "wallet_address"], (payment: any) => {
          console.log("Payment callback:", payment);
        });
        setUser(authResult.user);
      } else {
        await new Promise(r => setTimeout(r, 1000));
        setUser({ username: "Pioneer_Dev", uid: "dev_" + Math.random().toString(36).slice(2, 8) });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setAuthError(msg);
      setTimeout(() => setAuthError(null), 4000);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => { setUser(null); setShowUserMenu(false); };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
      isScrolled
        ? "bg-[rgba(5,5,7,0.92)] backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_0_rgba(0,212,255,0.04)]"
        : "bg-transparent border-b border-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-[rgba(0,212,255,0.15)] blur-md group-hover:bg-[rgba(0,212,255,0.25)] transition-all duration-300" />
            <div className="relative w-9 h-9 rounded-xl bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center">
              <AxiomLogo size={28} />
            </div>
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-display font-bold text-[15px] text-white tracking-tight">
              Axiom<span className="text-[var(--color-primary)]">Studio</span>
            </span>
            <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--color-on-surface-variant)] mt-0.5">
              AIX · Pi Network
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={cn(
                "relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                active ? "text-white bg-white/[0.06]" : "text-[var(--color-on-surface-variant)] hover:text-white hover:bg-white/[0.04]"
              )}>
                {link.label}
                {active && (
                  <motion.div layoutId="nav-active" className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden lg:inline-flex badge badge-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
            v{APP_VERSION}
          </span>
          {user ? (
            <div className="relative">
              <button onClick={() => setShowUserMenu(v => !v)} className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.15)] hover:border-[rgba(0,212,255,0.3)] transition-all">
                <span className="text-sm font-semibold text-white">{user.username}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showUserMenu && "rotate-180")} />
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 top-full mt-2 w-60 glass-heavy rounded-2xl border border-white/10 z-50">
                    <div className="p-2">
                      <button onClick={handleDisconnect} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--color-error)] hover:bg-red-500/10">
                        <LogOut className="w-4 h-4" /> Disconnect
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={handlePiAuth} className="btn btn-primary btn-md">
              <Wallet className="w-4 h-4 mr-2" /> Connect Pi
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
