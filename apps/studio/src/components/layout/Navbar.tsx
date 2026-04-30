"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Shield, Cpu, Activity, Wallet, LogOut, ChevronDown, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { WalletButton } from "../studio/WalletButton";
import { usePathname } from "next/navigation";

interface PiUser {
  username: string;
  uid: string;
}

interface PiAuthResult {
  user: PiUser;
  accessToken: string;
}

declare global {
  interface Window {
    Pi?: {
      init: (config: { version: string; sandbox?: boolean }) => void;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: unknown) => void
      ) => Promise<PiAuthResult>;
    };
  }
}

const navLinks = [
  { href: "/",               label: "Studio"          },
  { href: "/marketplace",    label: "Marketplace"     },
  { href: "/builder",        label: "Builder"         },
  { href: "/identity",       label: "Identity"        },
  { href: "/spec",           label: "AIX Spec"         },
  { href: "/network-status", label: "Network"         },
];

/* ─── SVG Logo ─── */
function AxiomLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-label="Axiom Studio">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Outer ring */}
      <circle cx="18" cy="18" r="16" stroke="url(#lg1)" strokeWidth="1.5" opacity="0.4" />
      {/* Inner hex-ish mark */}
      <path
        d="M18 6 L28 12 L28 24 L18 30 L8 24 L8 12 Z"
        stroke="url(#lg1)" strokeWidth="1.5" fill="none" filter="url(#glow)"
      />
      {/* Center A mark */}
      <path
        d="M13 24 L18 13 L23 24 M15.5 20.5 H20.5"
        stroke="url(#lg1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        filter="url(#glow)"
      />
    </svg>
  );
}

export function Navbar() {
  const [isScrolled,     setIsScrolled]     = useState(false);
  const [user,           setUser]           = useState<PiUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showUserMenu,   setShowUserMenu]   = useState(false);
  const [authError,      setAuthError]      = useState<string | null>(null);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const onIncompletePaymentFound = (payment: unknown) => {
    console.log("Incomplete payment found:", payment);
  };

  const handlePiAuth = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      if (typeof window !== "undefined" && window.Pi) {
        window.Pi.init({ version: "2.0", sandbox: process.env.NODE_ENV !== "production" });
        const authResult = await window.Pi.authenticate(["username", "payments"], onIncompletePaymentFound);
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
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "bg-[rgba(5,5,7,0.92)] backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_0_rgba(0,212,255,0.04)]"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">

          {/* ── Logo ── */}
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

          {/* ── Nav Links ── */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    active
                      ? "text-white bg-white/[0.06]"
                      : "text-[var(--color-on-surface-variant)] hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-primary)]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Right zone ── */}
          <div className="flex items-center gap-3">

            {/* Version badge */}
            <span className="hidden lg:inline-flex badge badge-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
              v1.2
            </span>

            {/* Auth error */}
            <AnimatePresence>
              {authError && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
                >
                  {authError}
                </motion.span>
              )}
            </AnimatePresence>

            {/* User menu or Connect button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.15)] hover:border-[rgba(0,212,255,0.3)] transition-all duration-200"
                >
                  <span className="status-dot status-online" />
                  <span className="text-sm font-semibold text-white">{user.username}</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[var(--color-primary)] bg-[rgba(0,212,255,0.08)] px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" /> KYC
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-[var(--color-on-surface-variant)] transition-transform", showUserMenu && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-60 glass-heavy rounded-2xl border border-white/10 overflow-hidden z-50"
                    >
                      <div className="px-4 py-3.5 border-b border-white/[0.06]">
                        <p className="text-[11px] text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1">Connected Pioneer</p>
                        <p className="text-sm font-bold text-white">{user.username}</p>
                        <p className="text-[10px] font-mono text-[var(--color-on-surface-faint)] mt-0.5 truncate">{user.uid}</p>
                      </div>
                      <div className="p-2">
                        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--color-on-surface-variant)] hover:text-white hover:bg-white/[0.05] transition-all">
                          <Wallet className="w-4 h-4 text-[var(--color-accent)]" /> Pi Wallet
                        </button>
                        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--color-on-surface-variant)] hover:text-white hover:bg-white/[0.05] transition-all">
                          <Activity className="w-4 h-4 text-[var(--color-primary)]" /> Agent Dashboard
                        </button>
                        <div className="my-1.5 divider" />
                        <button
                          onClick={handleDisconnect}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--color-error)] hover:bg-red-500/10 transition-all"
                        >
                          <LogOut className="w-4 h-4" /> Disconnect
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={handlePiAuth}
                disabled={isAuthenticating}
                className="btn btn-primary btn-md flex items-center gap-2 disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-[#050507] rounded-full animate-spin" />
                    <span>Connecting…</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Connect Pi</span>
                  </>
                )}
              </button>
            )}

            <WalletButton />

            {/* Mobile menu toggle */}
            <button
              className="md:hidden btn btn-ghost btn-sm p-2"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <div className="flex flex-col gap-1 w-5">
                <span className={cn("h-[1.5px] bg-current transition-all", mobileOpen ? "rotate-45 translate-y-[4.5px]" : "")} />
                <span className={cn("h-[1.5px] bg-current transition-all", mobileOpen ? "opacity-0" : "")} />
                <span className={cn("h-[1.5px] bg-current transition-all", mobileOpen ? "-rotate-45 -translate-y-[4.5px]" : "")} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[0.06] bg-[rgba(5,5,7,0.95)] backdrop-blur-2xl overflow-hidden"
            >
              <div className="px-5 py-4 flex flex-col gap-1">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      pathname === link.href
                        ? "text-white bg-white/[0.06] border border-white/[0.08]"
                        : "text-[var(--color-on-surface-variant)] hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
