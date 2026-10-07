import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtCompact(n: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function fmtFull(n: number): string {
  return new Intl.NumberFormat("en").format(n);
}

export function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function fmtDur(totalSec: number): string {
  const total = Math.round(totalSec); // round once: 119.7s is "2:00", never "1:60"
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** PKT is UTC+5 with no DST — the cron's own clock. */
export const PKT_OFFSET_MIN = 300;

export function fmtPKT(d: Date): string {
  const pkt = new Date(d.getTime() + PKT_OFFSET_MIN * 60_000);
  const hh = String(pkt.getUTCHours()).padStart(2, "0");
  const mm = String(pkt.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} PKT`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDay(d: Date): string {
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function relTime(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.round(days / 7)}w ago`;
}

/** Next Mon/Thu 06:00 PKT — the Urdu lane cron (01:00 UTC). */
export function nextUrduRun(from: Date = new Date()): Date {
  for (let i = 0; i < 9; i++) {
    const t = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + i, 1, 0, 0),
    );
    const dow = t.getUTCDay();
    if ((dow === 1 || dow === 4) && t.getTime() > from.getTime()) return t;
  }
  return from;
}

export function splitCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
