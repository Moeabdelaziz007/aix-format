"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Shield, Cpu, Activity } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePiAuth = async () => {
    setIsAuthenticating(true);
    try {
      // @ts-ignore - Pi is loaded globally via Script tag in layout
      if (typeof window !== 'undefined' && window.Pi) {
        // @ts-ignore
        window.Pi.init({ version: "2.0", sandbox: true });
        // @ts-ignore
        const scopes = ['username', 'payments'];
        // @ts-ignore
        const authResults = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
        setUser(authResults.user);
      } else {
        console.warn("Pi SDK not loaded yet or not running in Pi Browser environment.");
        // Mock authentication for development outside Pi Browser
        setTimeout(() => {
          setUser({ username: "Pioneer_Dev", uid: "dev_uid_123" });
        }, 1500);
      }
    } catch (error) {
      console.error("Pi Auth Error", error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const onIncompletePaymentFound = (payment: any) => {
    console.log("Incomplete payment found:", payment);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-[rgba(12,19,36,0.8)] backdrop-blur-xl border-[var(--color-glass-border)] py-4"
          : "bg-transparent border-transparent py-6"
      )}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-primary shadow-[0_0_20px_rgba(0,219,233,0.3)]">
            <Cpu className="text-[var(--color-surface)] w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg leading-tight text-white tracking-tight">Sovereign Studio</span>
            <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)] font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3" /> Pi Network Secured
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="https://axiomid.app/marketplace" className="text-sm font-medium text-[var(--color-on-surface-variant)] hover:text-white transition-colors">Marketplace</a>
          <a href="https://axiomid.app/agents" className="text-sm font-medium text-[var(--color-on-surface-variant)] hover:text-white transition-colors">My Agents</a>
          <a href="https://axiomid.app/status" className="text-sm font-medium text-[var(--color-on-surface-variant)] hover:text-white transition-colors">Network Status</a>
        </nav>

        <div>
          {user ? (
            <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-full border border-[var(--color-primary-dim)]/30">
              <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
              <span className="text-sm font-medium text-white">{user.username}</span>
              <div className="h-4 w-[1px] bg-[var(--color-glass-border)] mx-1" />
              <span className="text-xs text-[var(--color-secondary)] flex items-center gap-1">
                <Activity className="w-3 h-3" /> KYC Verified
              </span>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePiAuth}
              disabled={isAuthenticating}
              className="relative overflow-hidden group px-6 py-2.5 rounded-full bg-[var(--color-surface-container-highest)] border border-[var(--color-glass-border)] hover:border-[var(--color-primary)]/50 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2 text-sm font-semibold text-white">
                {isAuthenticating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-[var(--color-primary)] rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Pi Wallet
                  </>
                )}
              </span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}
