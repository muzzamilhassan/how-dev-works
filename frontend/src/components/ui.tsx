import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { cn } from "../lib/utils";
import type { EpisodeStatus, RunStatus } from "../lib/data";

/* ---------------- Button ---------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-accent-strong shadow-[0_1px_0_rgba(0,0,0,0.06)] active:translate-y-px",
  secondary:
    "bg-raised text-ink ring-1 ring-inset ring-line hover:ring-line-strong hover:bg-surface active:translate-y-px",
  ghost: "text-muted hover:text-ink hover:bg-surface",
  danger: "bg-danger-soft text-danger ring-1 ring-inset ring-danger/30 hover:bg-danger hover:text-white",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-9.5 px-4 text-sm gap-2 rounded-[10px]",
};

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center font-medium whitespace-nowrap transition-all duration-150",
        "disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {Icon ? <Icon className={size === "sm" ? "size-3.5" : "size-4"} /> : null}
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface transition-colors duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHead({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-line px-5 py-4", className)}>
      <div className="min-w-0">
        {eyebrow ? <div className="eyebrow mb-1">{eyebrow}</div> : null}
        <h3 className="font-display text-xl leading-tight text-ink">{title}</h3>
      </div>
      {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
    </div>
  );
}

/* ---------------- Badges ---------------- */

export type BadgeTone = "neutral" | "accent" | "live" | "warn" | "info" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-surface text-muted ring-line",
  accent: "bg-accent-soft text-accent ring-accent/25",
  live: "bg-live-soft text-live ring-live/25",
  warn: "bg-warn-soft text-warn ring-warn/25",
  info: "bg-info-soft text-info ring-info/25",
  danger: "bg-danger-soft text-danger ring-danger/25",
};

export function Badge({
  tone = "neutral",
  dot = false,
  pulse = false,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        badgeTones[tone],
        className,
      )}
    >
      {dot ? (
        <span className="relative flex size-1.5">
          {pulse ? (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          ) : null}
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}

const statusMap: Record<EpisodeStatus, { tone: BadgeTone; label: string; pulse?: boolean }> = {
  published: { tone: "live", label: "Published", pulse: true },
  queued: { tone: "info", label: "Queued" },
  rendering: { tone: "warn", label: "Rendering", pulse: true },
  unlisted: { tone: "neutral", label: "Unlisted" },
  draft: { tone: "neutral", label: "Draft" },
};

export function StatusBadge({ status }: { status: EpisodeStatus }) {
  const s = statusMap[status];
  return (
    <Badge tone={s.tone} dot pulse={s.pulse}>
      {s.label}
    </Badge>
  );
}

const runStatusMap: Record<RunStatus, { tone: BadgeTone; label: string; pulse?: boolean }> = {
  success: { tone: "live", label: "Success" },
  failed: { tone: "danger", label: "Failed" },
  in_progress: { tone: "warn", label: "In progress", pulse: true },
  queued: { tone: "info", label: "Queued" },
};

export function RunBadge({ status }: { status: RunStatus }) {
  const s = runStatusMap[status];
  return (
    <Badge tone={s.tone} dot pulse={s.pulse}>
      {s.label}
    </Badge>
  );
}

/* ---------------- Stat card ---------------- */

export function StatCard({
  label,
  value,
  suffix,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  delta?: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="eyebrow">{label}</div>
        <Icon className="size-4 text-faint" />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-[34px] leading-none text-ink tabular">
          {typeof value === "number" ? new Intl.NumberFormat("en").format(value) : value}
        </span>
        {suffix ? <span className="font-display text-xl text-muted">{suffix}</span> : null}
      </div>
      {delta !== undefined ? (
        <div
          className={cn(
            "mt-2 text-xs font-medium tabular",
            delta >= 0 ? "text-live" : "text-danger",
          )}
        >
          {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}
          {label.includes("CTR") ? " pts" : "%"} <span className="text-faint">vs prior 28d</span>
        </div>
      ) : null}
    </Card>
  );
}

/* ---------------- Section header ---------------- */

export function SectionHeader({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="eyebrow mb-1.5">{eyebrow}</div>
        <h1 className="font-display text-[32px] leading-tight text-ink">{title}</h1>
        {desc ? <p className="mt-1 max-w-xl text-sm text-muted">{desc}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ---------------- Progress ---------------- */

export function Progress({
  value,
  tone = "accent",
  className,
}: {
  value: number;
  tone?: "accent" | "live" | "warn" | "info";
  className?: string;
}) {
  const bg = { accent: "bg-accent", live: "bg-live", warn: "bg-warn", info: "bg-info" }[tone];
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-line", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-700", bg)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ---------------- Form controls ---------------- */

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9.5 w-full rounded-[10px] border-0 bg-raised px-3 text-sm text-ink ring-1 ring-inset ring-line",
        "placeholder:text-faint hover:ring-line-strong focus:ring-2 focus:ring-accent focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[10px] border-0 bg-raised px-3 py-2.5 text-sm leading-relaxed text-ink ring-1 ring-inset ring-line",
        "placeholder:text-faint hover:ring-line-strong focus:ring-2 focus:ring-accent focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9.5 w-full appearance-none rounded-[10px] border-0 bg-raised px-3 pr-8 text-sm text-ink ring-1 ring-inset ring-line",
        "hover:ring-line-strong focus:ring-2 focus:ring-accent focus:outline-none",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5.5 w-9.5 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
        checked ? "bg-accent" : "bg-line-strong",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-[19px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

/* ---------------- Tabs ---------------- */

const TabsCtx = createContext<{ value: string; set: (v: string) => void } | null>(null);

export function Tabs({
  defaultValue,
  value: controlled,
  onChange,
  className,
  children,
}: {
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  className?: string;
  children: ReactNode;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const value = controlled ?? internal;
  const set = (v: string) => {
    setInternal(v);
    onChange?.(v);
  };
  return (
    <TabsCtx.Provider value={{ value, set }}>
      <div className={cn("inline-flex items-center gap-1 rounded-[10px] bg-surface p-1 ring-1 ring-inset ring-line", className)}>
        {children}
      </div>
    </TabsCtx.Provider>
  );
}

export function TabItem({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsCtx);
  const active = ctx?.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx?.set(value)}
      className={cn(
        "cursor-pointer rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
        active ? "bg-raised text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Modal ---------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface shadow-2xl sm:rounded-2xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <X className="size-4.5" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Misc primitives ---------------- */

export function Avatar({ name, hue = 14 }: { name: string; hue?: number }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 48% 42%), hsl(${hue + 24} 52% 30%))`,
      }}
    >
      {initials}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted">
      {children}
    </kbd>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line", className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Icon className="size-5" />
      </div>
      <h3 className="font-display text-lg text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{desc}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** Placeholder poster used wherever a video thumbnail would render. */
export function Poster({
  title,
  hue,
  className,
  tall = false,
  badge,
}: {
  title: string;
  hue: number;
  className?: string;
  tall?: boolean;
  badge?: string;
}) {
  const id = useId();
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg",
        tall ? "aspect-[9/16]" : "aspect-video",
        className,
      )}
    >
      <svg
        viewBox="0 0 160 90"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(${hue} 34% 26%)`} />
            <stop offset="55%" stopColor={`hsl(${hue} 44% 18%)`} />
            <stop offset="100%" stopColor={`hsl(${(hue + 30) % 360} 40% 12%)`} />
          </linearGradient>
        </defs>
        <rect width="160" height="90" fill={`url(#${id})`} />
        <circle cx="118" cy="30" r="26" fill={`hsl(${hue} 52% 40% / 0.35)`} />
        <circle cx="118" cy="30" r="16" fill="none" stroke={`hsl(${hue} 60% 72% / 0.5)`} strokeWidth="0.8" />
        <rect x="0" y="70" width="160" height="20" fill="black" opacity="0.25" />
      </svg>
      <div className="absolute inset-0 flex flex-col justify-between p-2.5">
        <span className="w-fit rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-white/85">
          {badge ?? (tall ? "Short · 9:16" : "Episode · 16:9")}
        </span>
        <span className="line-clamp-2 font-display text-[13px] leading-snug text-white drop-shadow">
          {title}
        </span>
      </div>
    </div>
  );
}

export function Checklist({ items }: { items: { label: string; done: boolean }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2.5 text-sm">
          <span
            className={cn(
              "flex size-4.5 items-center justify-center rounded-full ring-1 ring-inset",
              it.done ? "bg-live-soft text-live ring-live/30" : "bg-surface text-transparent ring-line-strong",
            )}
          >
            <Check className="size-3" />
          </span>
          <span className={cn(it.done ? "text-muted line-through decoration-line-strong" : "text-ink")}>
            {it.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn("size-4 animate-spin", className)} />;
}
