import {
  BarChart3,
  Bell,
  Film,
  LayoutDashboard,
  ListVideo,
  Lock,
  Menu,
  Moon,
  PenLine,
  Settings as SettingsIcon,
  Stamp,
  Sun,
  Tv,
  Workflow,
  X,
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn, fmtDay, fmtPKT, pad2, splitCountdown, nextUrduRun } from "../lib/utils";
import { clearUnlocked } from "../lib/access";
import { Avatar, Kbd } from "./ui";

/* ---------------- Theme ---------------- */

type Theme = "light" | "dark";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("sh-theme", theme);
    } catch {
      /* private mode — theme stays for the session */
    }
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);

/* ---------------- Navigation ---------------- */

const NAV = [
  {
    section: "Control",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/queue", label: "Publishing queue", icon: ListVideo },
      { to: "/studio", label: "Script studio", icon: PenLine },
      { to: "/media", label: "Media vault", icon: Film },
    ],
  },
  {
    section: "Network",
    items: [
      { to: "/channels", label: "Channels & tokens", icon: Tv },
      { to: "/automation", label: "Automation runs", icon: Workflow },
    ],
  },
  {
    section: "Insight",
    items: [{ to: "/analytics", label: "Analytics", icon: BarChart3 }],
  },
] as const;

const TITLES: Record<string, { title: string; crumb: string }> = {
  "/": { title: "Overview", crumb: "The Sealed Histories" },
  "/queue": { title: "Publishing queue", crumb: "state/urdu-queue.json" },
  "/studio": { title: "Script studio", crumb: "retention-first drafts" },
  "/media": { title: "Media vault", crumb: "clips · thumbs · voice" },
  "/channels": { title: "Channels & tokens", crumb: "both lanes" },
  "/automation": { title: "Automation runs", crumb: "GitHub Actions" },
  "/analytics": { title: "Analytics", crumb: "demo data until yt-analytics scope" },
  "/settings": { title: "Settings", crumb: "workspace" },
};

/* ---------------- Sidebar ---------------- */

function Seal({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-accent text-accent-ink",
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-full ring-2 ring-inset ring-accent-ink/60">
        <Stamp className="size-4.5" />
      </span>
    </span>
  );
}

function NextRunChip() {
  const next = useMemo(() => nextUrduRun(new Date()), []);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const cd = splitCountdown(next.getTime() - now.getTime());
  return (
    <div className="rounded-xl border border-line bg-raised p-3">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-50" />
          <span className="relative inline-flex size-2 rounded-full bg-accent" />
        </span>
        <span className="eyebrow">Lane armed</span>
      </div>
      <p className="mt-2 text-[13px] leading-snug text-ink">
        Next render <span className="font-medium">{fmtDay(next)}</span>{" "}
        <span className="font-mono text-xs text-accent">{fmtPKT(next)}</span>
      </p>
      <p className="mt-0.5 font-mono text-[11px] text-faint tabular">
        T−{cd.d}d {pad2(cd.h)}h {pad2(cd.m)}m
      </p>
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden" onClick={onClose} aria-hidden />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-line bg-surface transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-15 items-center gap-3 border-b border-line px-5">
          <Seal />
          <div className="min-w-0">
            <div className="font-display text-[19px] leading-none text-ink">Scriptorium</div>
            <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Sealed Histories ops
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto cursor-pointer rounded-lg p-1.5 text-muted hover:bg-raised hover:text-ink lg:hidden"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group) => (
            <div key={group.section} className="mb-5">
              <div className="eyebrow mb-2 px-2">{group.section}</div>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={"end" in item ? item.end : false}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                          isActive
                            ? "bg-accent-soft text-accent"
                            : "text-muted hover:bg-raised hover:text-ink",
                        )
                      }
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-line p-3">
          <NextRunChip />
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                isActive ? "bg-accent-soft text-accent" : "text-muted hover:bg-raised hover:text-ink",
              )
            }
          >
            <SettingsIcon className="size-4" />
            Settings
          </NavLink>
          <button
            onClick={() => {
              clearUnlocked();
              onClose();
              window.location.reload();
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] font-medium text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <Lock className="size-4" />
            Lock console
          </button>
        </div>
      </aside>
    </>
  );
}

/* ---------------- Topbar ---------------- */

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();
  const meta = TITLES[pathname] ?? TITLES["/"];
  return (
    <header className="sticky top-0 z-30 flex h-15 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="cursor-pointer rounded-lg p-2 text-muted hover:bg-surface hover:text-ink lg:hidden"
      >
        <Menu className="size-5" />
      </button>
      <div className="min-w-0">
        <h2 className="truncate font-display text-lg leading-tight text-ink">{meta.title}</h2>
        <p className="hidden truncate font-mono text-[10.5px] text-faint sm:block">{meta.crumb}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <label className="relative hidden md:block">
          <input
            placeholder="Search episodes, runs…"
            className="h-9 w-56 rounded-[10px] border-0 bg-surface pl-8 pr-12 text-sm text-ink ring-1 ring-inset ring-line placeholder:text-faint focus:ring-2 focus:ring-accent focus:outline-none lg:w-64"
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-faint">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            <Kbd>⌘K</Kbd>
          </span>
        </label>

        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className="cursor-pointer rounded-[10px] p-2 text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
        </button>

        <button
          aria-label="Notifications"
          className="relative cursor-pointer rounded-[10px] p-2 text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <Bell className="size-4.5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent ring-2 ring-bg" />
        </button>

        <span className="ml-1 hidden sm:block">
          <Avatar name="Muzzamil Hassan" hue={14} />
        </span>
      </div>
    </header>
  );
}

/* ---------------- Layout ---------------- */

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setNavOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1180px]">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-line px-6 py-4">
          <p className="font-mono text-[10.5px] text-faint">
            Scriptorium v0.1 · pipeline runs on GitHub Actions only · queue of record: state/urdu-queue.json
          </p>
        </footer>
      </div>
    </div>
  );
}
