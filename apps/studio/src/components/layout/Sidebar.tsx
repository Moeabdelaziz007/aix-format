"use client";
import { APP_VERSION } from "@/lib/version";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  PlusSquare, 
  Library, 
  ShieldCheck, 
  Box, 
  FileCode, 
  Settings, 
  BarChart3,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

const sidebarLinks = [
  { href: "/",           label: "Command Center", icon: LayoutDashboard },
  { href: "/builder",    label: "Agent Builder",  icon: PlusSquare      },
  { href: "/registry",   label: "Registry",       icon: Library         },
  { href: "/abom",       label: "ABOM Explorer",  icon: Box             },
  { href: "/identity",   label: "Identity / KYC", icon: ShieldCheck     },
  { href: "/schema",     label: "Schema Docs",    icon: FileCode        },
  { href: "/analytics",  label: "Analytics",      icon: BarChart3       },
  { href: "/settings",   label: "Settings",       icon: Settings        },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] z-40 hidden lg:flex flex-col">
      <div className="p-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center shadow-[0_0_15px_var(--color-primary-dim)]">
            <Activity className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none text-white">AIX <span className="text-[var(--color-primary)]">Studio</span></h1>
            <p className="text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest mt-1">Sovereign Protocol</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative",
                isActive 
                  ? "text-[var(--color-primary)] bg-[var(--color-primary-dim)]/10" 
                  : "text-[var(--color-on-surface-variant)] hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
              <span className="font-medium text-sm">{link.label}</span>
              
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active-indicator"
                  className="absolute right-0 top-2 bottom-2 w-1 bg-[var(--color-primary)] rounded-l-full shadow-[0_0_10px_var(--color-primary)]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-[var(--color-border)]">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[var(--color-primary-dim)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] text-[var(--color-on-surface-variant)] uppercase mb-2">System Status</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white">Parser v${APP_VERSION}</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse shadow-[0_0_5px_var(--color-success)]" />
              <span className="text-[10px] text-[var(--color-success)] font-bold uppercase">Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
