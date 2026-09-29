import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtCompact, fmtPKT, fmtDay, pad2, splitCountdown } from "../lib/utils";

const axisTick = { fontSize: 11, fill: "var(--muted)" } as const;

function tipStyle() {
  return {
    background: "var(--raised)",
    border: "1px solid var(--line)",
    borderRadius: 10,
    fontSize: 12,
    color: "var(--ink)",
    boxShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
  };
}

/* ---------------- Views over time ---------------- */

export function ViewsChart({ data, height = 264 }: { data: { d: string; views: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -14 }}>
        <defs>
          <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 5" vertical={false} />
        <XAxis dataKey="d" tick={axisTick} tickLine={false} axisLine={false} interval={4} dy={6} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={fmtCompact} width={46} />
        <Tooltip
          contentStyle={tipStyle()}
          labelStyle={{ color: "var(--muted)", fontWeight: 500 }}
          formatter={(v) => [new Intl.NumberFormat("en").format(Number(v)), "views"]}
          cursor={{ stroke: "var(--line-strong)", strokeDasharray: "3 3" }}
        />
        <Area
          type="monotone"
          dataKey="views"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#gViews)"
          dot={false}
          activeDot={{ r: 3.5, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---------------- Retention curve ---------------- */

export function RetentionChart({ data, height = 220 }: { data: { t: string; pct: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 5" vertical={false} />
        <XAxis dataKey="t" tick={axisTick} tickLine={false} axisLine={false} dy={6} />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          width={50}
        />
        <Tooltip
          contentStyle={tipStyle()}
          labelStyle={{ color: "var(--muted)", fontWeight: 500 }}
          formatter={(v) => [`${v}%`, "viewers kept"]}
        />
        <Line
          type="monotone"
          dataKey="pct"
          stroke="var(--live)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3.5, fill: "var(--live)", stroke: "var(--surface)", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ---------------- Format split donut ---------------- */

const donutColors = ["var(--accent)", "var(--line-strong)"];

export function FormatDonut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={58}
            outerRadius={80}
            paddingAngle={3}
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={donutColors[i % donutColors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tipStyle()}
            formatter={(v, n) => [`${v}% of views`, String(n)]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl text-ink tabular">61%</span>
        <span className="eyebrow mt-0.5">Shorts</span>
      </div>
    </div>
  );
}

/* ---------------- Uploads by weekday ---------------- */

export function WeekdayBars({ data }: { data: { day: string; uploads: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -30 }}>
        <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={false} dy={6} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip contentStyle={tipStyle()} cursor={{ fill: "var(--line)", opacity: 0.4 }} />
        <Bar dataKey="uploads" radius={[5, 5, 2, 2]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={i === 1 || i === 4 ? "var(--accent)" : "var(--line-strong)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------------- Cron dial (the signature) ----------------
 * One glance answers "when does the machine run next":
 * a week ring with the Mon/Thu spokes sealed in wax, an
 * hour ring marking 06:00, and a live countdown in the hub.
 */

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

const WEEK = [
  { key: 1, label: "M", full: "Mon" },
  { key: 2, label: "T", full: "Tue" },
  { key: 3, label: "W", full: "Wed" },
  { key: 4, label: "T", full: "Thu" },
  { key: 5, label: "F", full: "Fri" },
  { key: 6, label: "S", full: "Sat" },
  { key: 0, label: "S", full: "Sun" },
];

export function CronDial({ next }: { next: Date }) {
  const now = useNow();
  const cd = splitCountdown(next.getTime() - now.getTime());
  const nextDow = next.getUTCDay();

  // day nodes on a ring, starting Monday at the top
  const order = [1, 2, 3, 4, 5, 6, 0];
  const cx = 110;
  const cy = 110;
  const dayR = 74;
  const hourR = 96;

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <svg viewBox="0 0 220 220" className="w-full" role="img" aria-label="Publishing schedule dial">
        {/* hour ticks */}
        {Array.from({ length: 24 }, (_, h) => {
          const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
          const isRunHour = h === 1; // 01:00 UTC == 06:00 PKT
          const r1 = hourR;
          const r2 = isRunHour ? hourR - 11 : hourR - 5;
          return (
            <line
              key={h}
              x1={cx + r1 * Math.cos(a)}
              y1={cy + r1 * Math.sin(a)}
              x2={cx + r2 * Math.cos(a)}
              y2={cy + r2 * Math.sin(a)}
              stroke={isRunHour ? "var(--accent)" : "var(--line-strong)"}
              strokeWidth={isRunHour ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
        {/* spokes to run days */}
        {order.map((dow, i) => {
          if (dow !== 1 && dow !== 4) return null;
          const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
          return (
            <line
              key={dow}
              x1={cx}
              y1={cy}
              x2={cx + dayR * Math.cos(a)}
              y2={cy + dayR * Math.sin(a)}
              stroke="var(--accent)"
              strokeOpacity={0.35}
              strokeWidth={1.5}
              strokeDasharray="1 4"
            />
          );
        })}
        {/* day nodes */}
        {order.map((dow, i) => {
          const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
          const x = cx + dayR * Math.cos(a);
          const y = cy + dayR * Math.sin(a);
          const isRun = dow === 1 || dow === 4;
          const isNext = dow === nextDow;
          return (
            <g key={dow}>
              <circle
                cx={x}
                cy={y}
                r={isNext ? 13 : 11}
                fill={isRun ? "var(--accent)" : "var(--surface)"}
                stroke={isRun ? "var(--accent)" : "var(--line-strong)"}
                strokeWidth={1.5}
              />
              {isNext ? (
                <circle cx={x} cy={y} r={17} fill="none" stroke="var(--accent)" strokeOpacity={0.4} strokeWidth={1} />
              ) : null}
              <text
                x={x}
                y={y + 3.5}
                textAnchor="middle"
                fontSize={10}
                fontWeight={isRun ? 600 : 500}
                fill={isRun ? "var(--accent-ink)" : "var(--muted)"}
                fontFamily="JetBrains Mono, monospace"
              >
                {WEEK.find((w) => w.key === dow)?.label}
              </text>
            </g>
          );
        })}
        {/* hub */}
        <circle cx={cx} cy={cy} r={50} fill="var(--raised)" stroke="var(--line)" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={44} fill="none" stroke="var(--accent)" strokeOpacity={0.25} strokeWidth={1} strokeDasharray="1 4" />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="eyebrow">Next render</span>
        <span className="mt-1 font-display text-[24px] leading-none text-ink">
          {fmtDay(next).replace(/ \d+ .*/, "")} {pad2(cd.d)}d {pad2(cd.h)}h
        </span>
        <span className="mt-1.5 font-mono text-[11px] font-medium text-accent">{fmtPKT(next)}</span>
        <span className="mt-0.5 font-mono text-[10px] text-faint tabular">
          {pad2(cd.m)}m {pad2(cd.s)}s to fire
        </span>
      </div>
    </div>
  );
}
