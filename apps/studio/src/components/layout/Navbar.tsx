"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Wallet,
  Shield,
  ChevronDown,
  LogOut,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

// Minimal logo SVG to replace external imports
const AxiomLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 10L8 18H16L12 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const navLinks = [
  { href: "/marketplace",  label: "Marketplace" },
  { href: "/builder",      label: "Builder" },
  { href: "/my-agents",    label: "My Agents" },
  { href: "/identity",     label: "Identity" },
  { href: "/network-status", label: "Network" },
  { href: "/spec",         label: "AIX Spec" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // User state mock
  const [user, setUser] = useState<{ username: string; uid: string } | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePiAuth = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      if (typeof window !== "undefined" && window.Pi) {
        // Authenticate the user, and get permission to request payments from them
        const scopes = ['payments', 'username'];
        function onIncompletePaymentFound(payment: any) {
            console.log("Incomplete payment", payment);
        }

        // This causes hydration mismatch, so wait till we figure it out.
        // const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
        // setUser(authResult.user);
        await new Promise(r => setTimeout(r, 1000));
        setUser({ username: "Pioneer_Dev", uid: "dev_" + crypto.randomUUID().slice(0, 8) });
      } else {
        await new Promise(r => setTimeout(r, 1000));
        setUser({ username: "Pioneer_Dev", uid: "dev_" + crypto.randomUUID().slice(0, 8) });
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
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 pt-4",
      isScrolled ? "pt-2" : "pt-4"
    )}>
      <nav className={cn(
        "max-w-7xl mx-auto h-16 rounded-2xl flex items-center justify-between px-6 transition-all duration-500 border",
        isScrolled 
          ? "bg-surface-1/80  border-white/10  /50"
          : "bg-transparent border-transparent"
      )}>
        {/* Logo */}
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
                      <div className="bg-surface-2/95 border border-white/10 rounded-xl p-1.5">
                        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase italic text-foreground/60 hover:bg-white/5 hover:text-white transition-colors">
                          <Shield className="w-4 h-4" /> Account Security
                        </button>
                        <div className="h-px bg-white/5 my-1" />
                        <button
                          onClick={handleDisconnect}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase italic text-danger hover:bg-danger/10 transition-colors"
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
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Connect Pi
                  </>
                )}
              </button>
            )}

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
        </nav>

        {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface-2 border border-white/10 rounded-2xl mt-2 overflow-hidden "
          >
            <div className="p-4 flex flex-col gap-2">
              {navLinks.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-bold uppercase italic tracking-wider text-foreground/60 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Typography variant="body" weight="bold">{link.label}</Typography>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
