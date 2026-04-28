"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Boxes, ScanSearch, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Orchestration", icon: LayoutGrid },
  { to: "/agents", label: "Agents", icon: Boxes },
  { to: "/inspector", label: "Inspector", icon: ScanSearch },
  { to: "/identity", label: "Identity", icon: Fingerprint },
] as const;

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="glass-panel flex flex-col gap-1 rounded-2xl p-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.to === "/"
            ? pathname === "/"
            : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            href={item.to}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
              active
                ? "bg-white/[0.08] text-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.08)]"
                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground/90",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.5} />
            <span className="font-medium">{item.label}</span>
            {active && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-azure shadow-[0_0_8px_oklch(0.85_0.08_240)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
