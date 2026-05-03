"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hexagon,
  Brain,
  Plug,
  Package,
  Rocket,
  Radar,
  Activity,
  ShieldCheck,
  Palette,
  FlaskConical,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Bell,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── PERSPECTIVE DEPTH TOKENS ─────────────────────────────
// Layer 0: #09090B (app bg)         Layer 1: #111113 (sidebar)
// Layer 2: #18181B (topbar / hover) Layer 3: #27272A (active / pill)
// Layer 5: floating modal w/ heavy shadow
const ACCENT = "#00BD7D";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "CORE",
    items: [
      { href: "/agents",      label: "Agents",      icon: Hexagon },
      { href: "/knowledge",   label: "Knowledge",   icon: Brain },
      { href: "/plugins",     label: "Plugins",     icon: Plug },
      { href: "/marketplace", label: "Marketplace", icon: Package },
    ],
  },
  {
    label: "OPS",
    items: [
      { href: "/deploy",   label: "Deploy",   icon: Rocket },
      { href: "/fleet",    label: "Fleet",    icon: Radar },
      { href: "/pulse",    label: "Pulse",    icon: Activity },
      { href: "/identity", label: "Identity", icon: ShieldCheck },
    ],
  },
  {
    label: "BUILD",
    items: [
      { href: "/builder",     label: "Builder",     icon: Palette },
      { href: "/playground",  label: "Playground",  icon: FlaskConical },
      { href: "/analytics",   label: "Analytics",   icon: BarChart3 },
    ],
  },
];

const COMMAND_RESULTS = [
  { section: "Recent",  icon: Hexagon,      label: "ResearchBot",            shortcut: "↵" },
  { section: "Recent",  icon: FlaskConical, label: "Playground · GPT-5",     shortcut: "↵" },
  { section: "Agents",  icon: Hexagon,      label: "Create new agent",       shortcut: "⌘N" },
  { section: "Agents",  icon: Brain,        label: "Browse knowledge bases", shortcut: "⌘B" },
  { section: "Pages",   icon: Rocket,       label: "Deploy",                 shortcut: "G D" },
  { section: "Pages",   icon: BarChart3,    label: "Analytics",              shortcut: "G A" },
  { section: "Actions", icon: Settings,     label: "Open Settings",          shortcut: "⌘," },
  { section: "Actions", icon: LogOut,       label: "Sign Out",               shortcut: "⇧⌘Q" },
];

// ─── ROOT ─────────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sidebarWidth = isMobile || collapsed ? 40 : 220;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#09090B" }}>
      <Sidebar
        width={sidebarWidth}
        collapsed={isMobile || collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        canToggle={!isMobile}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onOpenPalette={() => setPaletteOpen(true)} />
        <main className="flex-1 min-w-0" style={{ backgroundColor: "#09090B" }}>
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────
function Sidebar({
  width,
  collapsed,
  onToggle,
  canToggle,
}: {
  width: number;
  collapsed: boolean;
  onToggle: () => void;
  canToggle: boolean;
}) {
  const pathname = usePathname();
  const [workspaceOpen, setWorkspaceOpen] = React.useState(false);

  return (
    <aside
      className="sticky top-0 h-screen flex flex-col shrink-0"
      style={{
        width,
        backgroundColor: "#111113",
        transition: "width 150ms ease",
      }}
    >
      {/* Logo row */}
      <div
        className="flex items-center justify-between h-12 px-3 shrink-0"
        style={{ borderBottom: "1px solid #1f1f23" }}
      >
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Hexagon className="w-5 h-5 shrink-0" style={{ color: ACCENT }} strokeWidth={2} />
          {!collapsed && (
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span
                className="text-white"
                style={{
                  fontFamily: "var(--font-oswald)",
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                AIX
              </span>
              <span
                style={{
                  fontFamily: "var(--font-poppins)",
                  fontSize: 14,
                  color: "#a1a1aa",
                }}
              >
                Studio
              </span>
            </div>
          )}
        </Link>
        {canToggle && !collapsed && (
          <button
            onClick={onToggle}
            className="p-1 hover:text-zinc-300 transition-colors"
            style={{ color: "#52525b" }}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {canToggle && collapsed && (
          <button
            onClick={onToggle}
            className="p-1 hover:text-zinc-300 transition-colors"
            style={{ color: "#52525b" }}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Workspace switcher */}
      {!collapsed && (
        <div className="px-3 py-3 shrink-0">
          <button
            onClick={() => setWorkspaceOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 transition-colors"
            style={{
              backgroundColor: "#27272A",
              fontFamily: "var(--font-poppins)",
              fontSize: 13,
              color: "#e4e4e7",
            }}
          >
            <span className="truncate">Default Workspace</span>
            <ChevronDown
              className="w-3.5 h-3.5 shrink-0"
              style={{
                color: "#71717a",
                transform: workspaceOpen ? "rotate(180deg)" : "none",
                transition: "transform 120ms",
              }}
            />
          </button>
          <AnimatePresence>
            {workspaceOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="mt-1 py-1"
                style={{ backgroundColor: "#18181B", border: "1px solid #27272A" }}
              >
                {["Default Workspace", "Sovereign Pi", "Personal"].map((ws) => (
                  <button
                    key={ws}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#27272A] transition-colors"
                    style={{
                      fontFamily: "var(--font-poppins)",
                      fontSize: 13,
                      color: "#d4d4d8",
                    }}
                  >
                    {ws}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map((group) => (
          <NavGroupSection key={group.label} group={group} pathname={pathname} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom: user + version */}
      <div className="shrink-0" style={{ borderTop: "1px solid #27272A" }}>
        <UserRow collapsed={collapsed} />
        {!collapsed && (
          <div
            className="px-3 pb-2 pt-1"
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: 10,
              color: "#52525b",
            }}
          >
            v0.9.1-alpha
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── NAV GROUP ────────────────────────────────────────────
function NavGroupSection({
  group,
  pathname,
  collapsed,
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div className="mb-4">
      {!collapsed && (
        <div
          className="px-4 mb-1.5"
          style={{
            fontFamily: "var(--font-oswald)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#71717a",
          }}
        >
          {group.label}
        </div>
      )}
      <ul>
        {group.items.map((item) => (
          <NavRow key={item.href} item={item} active={pathname?.startsWith(item.href) ?? false} collapsed={collapsed} />
        ))}
      </ul>
    </div>
  );
}

function NavRow({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  const [hover, setHover] = React.useState(false);

  return (
    <li className="relative">
      <Link
        href={item.href}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="relative flex items-center gap-3 h-9 px-3 transition-colors"
        style={{
          paddingLeft: collapsed ? 12 : 16,
          backgroundColor: active ? "#27272A" : hover ? "#18181B" : "transparent",
          color: active ? "#ffffff" : hover ? "#e4e4e7" : "#a1a1aa",
          fontFamily: "var(--font-poppins)",
          fontSize: 14,
          fontWeight: 400,
          transitionDuration: "100ms",
        }}
        title={collapsed ? item.label : undefined}
      >
        {active && (
          <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0"
            style={{ width: 2, backgroundColor: ACCENT }}
          />
        )}
        <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        {!collapsed && <span className="truncate">{item.label}</span>}

        {/* Tooltip when collapsed */}
        {collapsed && hover && (
          <span
            className="absolute left-full ml-2 px-2 py-1 whitespace-nowrap z-50 pointer-events-none"
            style={{
              backgroundColor: "#27272A",
              color: "#e4e4e7",
              fontFamily: "var(--font-poppins)",
              fontSize: 12,
              border: "1px solid #3f3f46",
            }}
          >
            {item.label}
          </span>
        )}
      </Link>
    </li>
  );
}

// ─── USER ROW ─────────────────────────────────────────────
function UserRow({ collapsed }: { collapsed: boolean }) {
  const [hover, setHover] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="px-3 py-3 flex items-center gap-2.5"
      style={{ backgroundColor: hover ? "#18181B" : "transparent", transition: "background-color 100ms" }}
    >
      <div
        className="w-8 h-8 shrink-0 flex items-center justify-center"
        style={{
          backgroundColor: "#3f3f46",
          color: "#e4e4e7",
          fontFamily: "var(--font-oswald)",
          fontSize: 13,
          fontWeight: 600,
          borderRadius: "50%",
        }}
      >
        MA
      </div>
      {!collapsed && (
        <div className="flex-1 min-w-0">
          {!hover ? (
            <>
              <div
                className="truncate flex items-center gap-2"
                style={{ fontFamily: "var(--font-poppins)", fontSize: 14, color: "#e4e4e7" }}
              >
                <span className="truncate">moe.aix</span>
                <span
                  className="px-1.5 py-0.5 shrink-0"
                  style={{
                    backgroundColor: "#3f3f46",
                    color: "#a1a1aa",
                    fontFamily: "var(--font-poppins)",
                    fontSize: 10,
                  }}
                >
                  Free tier
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-1 hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-poppins)", fontSize: 12, color: "#a1a1aa" }}
              >
                <Settings className="w-3 h-3" /> Settings
              </button>
              <button
                className="flex items-center gap-1 hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-poppins)", fontSize: 12, color: "#a1a1aa" }}
              >
                <LogOut className="w-3 h-3" /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────
function TopBar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const pathname = usePathname() || "/";
  const crumbs = breadcrumbsFromPath(pathname);

  return (
    <header
      className="sticky top-0 z-30 h-12 flex items-center px-4 gap-4 shrink-0"
      style={{ backgroundColor: "#18181B", borderBottom: "1px solid #27272A" }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <span style={{ color: "#52525b", fontFamily: "var(--font-poppins)", fontSize: 14 }}>/</span>
            )}
            <span
              className="truncate"
              style={{
                fontFamily: "var(--font-poppins)",
                fontSize: 14,
                color: i === crumbs.length - 1 ? "#e4e4e7" : "#a1a1aa",
              }}
            >
              {c}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Command palette trigger */}
      <button
        onClick={onOpenPalette}
        className="flex items-center justify-between gap-2 h-8 px-3 hover:brightness-125 transition"
        style={{
          width: 240,
          backgroundColor: "#27272A",
          color: "#71717a",
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: 13,
        }}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Search or run a command...</span>
        </span>
        <span
          className="shrink-0 px-1.5 py-0.5"
          style={{
            backgroundColor: "#18181B",
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 11,
            color: "#a1a1aa",
          }}
        >
          ⌘K
        </span>
      </button>

      {/* Right cluster */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          className="relative p-1.5 hover:text-white transition-colors"
          style={{ color: "#a1a1aa" }}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5"
            style={{ backgroundColor: "#ef4444", borderRadius: "50%" }}
          />
        </button>

        <div
          className="flex items-center gap-1.5"
          style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11 }}
        >
          <span style={{ color: ACCENT }}>●</span>
          <span style={{ color: "#a1a1aa", letterSpacing: "0.05em" }}>CONNECTED</span>
        </div>

        <div
          className="w-8 h-8 flex items-center justify-center"
          style={{
            backgroundColor: "#3f3f46",
            color: "#e4e4e7",
            fontFamily: "var(--font-oswald)",
            fontSize: 13,
            fontWeight: 600,
            borderRadius: "50%",
          }}
        >
          MA
        </div>
      </div>
    </header>
  );
}

function breadcrumbsFromPath(path: string): string[] {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return ["Home"];
  return segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

// ─── COMMAND PALETTE ──────────────────────────────────────
function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMAND_RESULTS;
    return COMMAND_RESULTS.filter((r) => r.label.toLowerCase().includes(q));
  }, [query]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered.length, onClose]);

  // Group filtered by section preserving order
  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof COMMAND_RESULTS>();
    filtered.forEach((r) => {
      const arr = map.get(r.section) ?? [];
      arr.push(r);
      map.set(r.section, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  let runningIdx = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden"
            style={{
              backgroundColor: "#18181B",
              boxShadow:
                "0 0 0 1px #27272A, 0 25px 60px rgba(0,0,0,0.7)",
            }}
          >
            {/* Input */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #27272A" }}>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIdx(0);
                }}
                placeholder="Type a command or search..."
                className="w-full bg-transparent outline-none border-0"
                style={{
                  fontFamily: "var(--font-poppins)",
                  fontSize: 16,
                  color: "#fafafa",
                }}
              />
            </div>

            {/* Results */}
            <div className="max-h-[420px] overflow-y-auto">
              {grouped.length === 0 ? (
                <div
                  className="px-5 py-8 text-center"
                  style={{ fontFamily: "var(--font-poppins)", fontSize: 14, color: "#71717a" }}
                >
                  No results
                </div>
              ) : (
                grouped.map(([section, items]) => (
                  <div key={section} className="py-1">
                    <div
                      className="px-5 py-1.5"
                      style={{
                        fontFamily: "var(--font-oswald)",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#52525b",
                      }}
                    >
                      {section}
                    </div>
                    {items.map((r) => {
                      runningIdx += 1;
                      const isActive = runningIdx === activeIdx;
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.label}
                          onMouseEnter={() => setActiveIdx(filtered.indexOf(r))}
                          onClick={onClose}
                          className="relative w-full flex items-center justify-between gap-3 px-5 py-2.5 transition-colors"
                          style={{
                            backgroundColor: isActive ? "#27272A" : "transparent",
                            color: isActive ? "#ffffff" : "#d4d4d8",
                          }}
                        >
                          {isActive && (
                            <span
                              aria-hidden
                              className="absolute left-0 top-0 bottom-0"
                              style={{ width: 2, backgroundColor: ACCENT }}
                            />
                          )}
                          <span className="flex items-center gap-3 min-w-0">
                            <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                            <span
                              className="truncate"
                              style={{ fontFamily: "var(--font-poppins)", fontSize: 14 }}
                            >
                              {r.label}
                            </span>
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-oswald)",
                              fontSize: 11,
                              fontWeight: 600,
                              letterSpacing: "0.08em",
                              color: isActive ? "#a1a1aa" : "#52525b",
                            }}
                          >
                            {r.shortcut}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AppShell;
