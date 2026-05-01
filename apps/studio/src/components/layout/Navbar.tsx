"use client";
import { WalletButton } from '@/components/studio/WalletButton';

import { APP_VERSION } from "@/lib/version";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Shield, Wallet, LogOut, ChevronDown, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Badge, Typography } from "@/components/shared";

interface PiUser {
  username: string;
  uid: string;
}

interface PiAuthResult {
  user: PiUser;
  accessToken: string;
}

const categories = [
  { 
    label: "Discover", 
    links: [
      { href: "/marketplace", label: "Marketplace" },
      { href: "/marketplace?filter=featured", label: "Featured" }
    ] 
  },
  { 
    label: "Build", 
    links: [
      { href: "/builder", label: "Agent Builder" },
      { href: "/space", label: "Agent Space" },
      { href: "/builder?template=true", label: "Templates" }
    ] 
  },
  { 
    label: "Connect", 
    links: [
      { href: "/mcp", label: "MCP Registry" },
      { href: "/playground", label: "API Explorer" },
      { href: "/skills", label: "Skills Catalog" }
    ] 
  },
  { 
    label: "Run", 
    links: [
      { href: "/fleet", label: "My Fleet" },
      { href: "/pulse", label: "Live Pulse" },
      { href: "/analytics", label: "Monitoring" }
    ] 
  },
  { 
    label: "Earn", 
    links: [
      { href: "/analytics", label: "Revenue" }
    ] 
  },
  { 
    label: "Trust", 
    links: [
      { href: "/settings", label: "Identity & KYC" },
      { href: "/scan", label: "ABOM Scanner" }
    ] 
  },
  { 
    label: "Learn", 
    links: [
      { href: "/docs", label: "Documentation" }
    ] 
  }
];

// Flatten categories for mobile menu
const navLinks = categories.flatMap(cat => cat.links);

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<PiUser | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePiAuth = async () => {
    setIsAuthenticating(true);
    try {
      if (typeof window !== "undefined" && (window as any).Pi) {
        const authResult: PiAuthResult = await (window as any).Pi.authenticate(["username", "wallet_address"], () => {});
        setUser(authResult.user);
      } else {
        // Mock auth for development
        await new Promise(r => setTimeout(r, 800));
        setUser({ username: "Pioneer_Dev", uid: "dev_123" });
      }
    } catch (err) {
      console.error("Auth failed:", err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    setUser(null);
    setShowUserMenu(false);
  };

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
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:rotate-12 transition-transform duration-500  /20">
            <Typography variant="h4" className="text-primary-dark italic leading-none m-0">A</Typography>
          </div>
          <div className="flex flex-col leading-none">
            <Typography variant="h6" className="text-white uppercase italic tracking-tighter m-0">
              AIX<span className="text-primary">Studio</span>
            </Typography>
            <Typography variant="caption" className="tracking-[0.2em] uppercase opacity-40 font-bold m-0">
              Sovereign Intel
            </Typography>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {categories.map(cat => {
            const isActive = cat.links.some(l => pathname === l.href);
            return (
              <div 
                key={cat.label} 
                className="relative group/cat"
                onMouseEnter={() => setActiveCategory(cat.label)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <button 
                  className={cn(
                    "px-3 py-2 rounded-lg text-[10px] font-black uppercase italic tracking-[0.15em] transition-all duration-200 flex items-center gap-1",
                    isActive ? "text-primary" : "text-foreground/50 hover:text-white"
                  )}
                >
                  {cat.label}
                  <ChevronDown className="w-3 h-3 opacity-20" />
                </button>

                <AnimatePresence>
                  {activeCategory === cat.label && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 top-full pt-2 w-48 z-[60]"
                    >
                      <div className="bg-surface-2/95  border border-white/10 rounded-xl p-1.5 ">
                        {cat.links.map(link => (
                          <Link 
                            key={link.href}
                            href={link.href}
                            className={cn(
                              "block px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors",
                              pathname === link.href ? "bg-primary/10 text-primary" : "text-white/40 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="hidden lg:flex opacity-50 border-white/5">
            v{APP_VERSION}
          </Badge>

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-surface-2 border border-white/10 hover:border-primary/30 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-mcp flex items-center justify-center text-[10px] font-black text-white">
                  {user.username[0].toUpperCase()}
                </div>
                <Typography variant="caption" weight="bold" className="text-white uppercase italic">{user.username}</Typography>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform text-foreground/40", showUserMenu && "rotate-180")} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-surface-3 border border-white/10 rounded-xl overflow-hidden  z-50 p-1"
                  >
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase italic text-foreground/60 hover:bg-white/5 hover:text-white transition-colors">
                      <Shield className="w-4 h-4" /> Account Security
                    </button>
                    <div className="divider my-1" />
                    <button 
                      onClick={handleDisconnect}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase italic text-danger hover:bg-danger/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Disconnect
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button onClick={handlePiAuth} size="sm" className="font-black italic uppercase tracking-wider">
              <Wallet className="w-4 h-4 mr-2" /> Connect Pi
            </Button>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-foreground/60 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X /> : <Menu />}
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
