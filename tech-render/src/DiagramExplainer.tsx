import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Spec-driven diagram explainer with the FULL CloudXBerry/ByteByteGo motion grammar:
//   1. narration-ordered progressive reveal        (panels/edges pop on their beat)
//   2. odometer counters                           (spec.counters — value ticks while spoken)
//   3. simulated data flow                         (spec.edges[].flow — dots run the path)
//   4. self-drawing connector lines + callouts     (edges draw + label chips)
//   5. interactive-selector simulation             (spec.selectors — highlight walks options)
//   6. typing sync                                 (hook chip + spec.terminals lines)
//   7. staggered overshoot pops                    (spring on everything)
//   8. headline crossfades                         (out-up / in-up overlap)
//   9. emphasis breathing + idle micro-motion      (panels glow on their beat, float always)
//  10. zero footage — 100% vector
// Everything is spec-driven (see specs/*.json + check-spec.mjs).

export type Word = { w: string; s: number; d: number };
export type Beat = { i: number; startMs: number; ms: number; words: Word[] };

export type SpecPart = { t: string; tint?: boolean };
export type SpecHeadline = { beat: number; parts: SpecPart[] };
export type SpecBadge = { t: string; beat: number; color?: string };
export type SpecPanel = {
  id: string;
  title: string;
  sub?: string;
  rows?: string[];
  badge?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  beat: number;
  db?: boolean;
  color?: string;
};
export type SpecEdge = {
  id: string;
  path: string;
  beat: number;
  color?: string;
  label?: string;
  lx?: number;
  ly?: number;
  dash?: boolean;
  pulse?: boolean;
  flow?: boolean;
  dots?: number;
};
export type SpecCounter = {
  beat: number;
  x: number;
  y: number;
  w?: number;
  label: string;
  from: number;
  to: number;
  suffix?: string;
  color?: string;
};
export type SpecTerminal = {
  beat: number;
  x: number;
  y: number;
  w: number;
  h?: number;
  title: string;
  lines: string[];
  color?: string;
};
export type SpecSelector = {
  beat: number;
  x: number;
  y: number;
  w: number;
  title?: string;
  options: string[];
  color?: string;
};
export type SpecTakeaway = { t: string; color?: string };
export type Spec = {
  id: string;
  title: string;
  voice?: string;
  rate?: string;
  leadMs?: number;
  gapMs?: number;
  tailMs?: number;
  accentPerBeat?: string[];
  hook?: { beat: number; text: string };
  badgeFadeBeat?: number;
  badges?: SpecBadge[];
  headlines?: SpecHeadline[];
  panels?: SpecPanel[];
  edges?: SpecEdge[];
  counters?: SpecCounter[];
  terminals?: SpecTerminal[];
  selectors?: SpecSelector[];
  takeaways?: SpecTakeaway[];
  takeawaysBeat?: number;
  outro?: string;
};

export type TimelineProps = { spec: Spec; beats: Beat[]; totalMs: number; fps: number };

// ---------- design tokens (dark, one idea, accent = chapter)
const BG = "#0a0e16";
const PANEL = "#131b2c";
const BORDER = "#2b3b55";
const TEXT = "#e7eefb";
const SUB = "#8fa1bd";
const FAINT = "#516179";

const PALETTE: Record<string, string> = {
  cyan: "#38bdf8",
  amber: "#fbbf24",
  green: "#34d399",
  violet: "#a78bfa",
  red: "#f87171",
};
const col = (c?: string): string => (c && PALETTE[c]) || PALETTE.cyan;

// ---------- SVG path sampling (pure math — no DOM, deterministic per frame)
type Seg = { t: "L"; ax: number; ay: number; bx: number; by: number; len: number } | {
  t: "C";
  ax: number; ay: number;
  c1x: number; c1y: number; c2x: number; c2y: number;
  bx: number; by: number;
  len: number;
};
function parsePath(d: string): Seg[] {
  const toks = String(d).match(/[MLCzZ]|-?\d*\.?\d+/gi) || [];
  const segs: Seg[] = [];
  let i = 0;
  let cx = 0, cy = 0;
  const num = () => parseFloat(toks[i++]);
  while (i < toks.length) {
    const cmd = toks[i].toUpperCase();
    if (cmd === "M") { cx = num(); cy = num(); }
    else if (cmd === "L") { const bx = num(), by = num(); segs.push({ t: "L", ax: cx, ay: cy, bx, by, len: Math.hypot(bx - cx, by - cy) }); cx = bx; cy = by; }
    else if (cmd === "C") {
      const c1x = num(), c1y = num(), c2x = num(), c2y = num(), bx = num(), by = num();
      let len = 0, px = cx, py = cy;
      for (let s = 1; s <= 16; s++) { const u = s / 16; const x = (1-u)**3*cx + 3*(1-u)**2*u*c1x + 3*(1-u)*u*u*c2x + u**3*bx; const y = (1-u)**3*cy + 3*(1-u)**2*u*c1y + 3*(1-u)*u*u*c2y + u**3*by; len += Math.hypot(x - px, y - py); px = x; py = y; }
      segs.push({ t: "C", ax: cx, ay: cy, c1x, c1y, c2x, c2y, bx, by, len });
      cx = bx; cy = by;
    } else i += 1;
  }
  return segs;
}
function pointAt(segs: Seg[], frac: number): { x: number; y: number } {
  const total = segs.reduce((a, s) => a + s.len, 0) || 1;
  let target = Math.max(0, Math.min(1, frac)) * total;
  for (const s of segs) {
    if (target > s.len) { target -= s.len; continue; }
    const u = s.len ? target / s.len : 0;
    if (s.t === "L") return { x: s.ax + (s.bx - s.ax) * u, y: s.ay + (s.by - s.ay) * u };
    const v = 1 - u;
    return {
      x: v**3*s.ax + 3*v**2*u*s.c1x + 3*v*u**2*s.c2x + u**3*s.bx,
      y: v**3*s.ay + 3*v**2*u*s.c1y + 3*v*u**2*s.c2y + u**3*s.by,
    };
  }
  const last = segs[segs.length - 1];
  return last ? { x: last.bx, y: last.by } : { x: 0, y: 0 };
}
const hashOf = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

// ---------- flow dots on an edge (simulated data flow)
const FlowEdge: React.FC<{ d: string; color: string; dots: number; appearFrame: number; frame: number }> = ({ d, color, dots, appearFrame, frame }) => {
  const segs = useMemo(() => parsePath(d), [d]);
  const cycle = 52;
  const born = Math.max(0, frame - appearFrame);
  const fade = interpolate(born, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      {[...Array(dots)].map((_, k) => {
        const t = ((frame % cycle) / cycle + k / dots) % 1;
        const p = pointAt(segs, t);
        return <circle key={k} cx={p.x} cy={p.y} r={4.5} fill={color} opacity={0.92 * fade} style={{ filter: `drop-shadow(0 0 5px ${color})` }} />;
      })}
    </>
  );
};

export const DiagramExplainer: React.FC<TimelineProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const spec = props.spec;
  const beats = props.beats;

  if (!beats.length || !spec) {
    return <AbsoluteFill style={{ backgroundColor: BG }} />;
  }

  const startF = (b: number) => Math.round(((beats[b]?.startMs ?? 0) / 1000) * fps);
  const msNow = (frame / fps) * 1000;
  const lastBeat = beats.length - 1;

  let beatIdx = 0;
  for (let i = 0; i < beats.length; i++) {
    if (frame >= startF(i)) beatIdx = i;
  }
  const accent = col(spec.accentPerBeat?.[beatIdx]);
  const pop = (atFrame: number) =>
    spring({ frame: frame - atFrame, fps, config: { damping: 12 } });

  const badges = spec.badges ?? [];
  const panels = spec.panels ?? [];
  const edges = spec.edges ?? [];
  const counters = spec.counters ?? [];
  const terminals = spec.terminals ?? [];
  const selectors = spec.selectors ?? [];
  const takeaways = spec.takeaways ?? [];
  const shrinkBeat = spec.takeawaysBeat ?? lastBeat;
  const hook = spec.hook;
  const hookFade = hook ? startF(hook.beat + 1) : durationInFrames + 10;

  const edgeColors = Array.from(new Set(["cyan", ...edges.map((e) => e.color || "cyan")]));

  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* faint blueprint grid + shimmer breathing */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(#111a2b 1px, transparent 1px), linear-gradient(90deg, #111a2b 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          opacity: 0.3 + 0.05 * Math.sin(frame / 30),
        }}
      />

      {/* progress bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 4,
          width: `${(frame / durationInFrames) * 100}%`,
          background: `linear-gradient(90deg, ${PALETTE.cyan}, ${PALETTE.green})`,
          opacity: 0.7,
        }}
      />

      {/* headline with CROSSFADE (previous fades up-out while current springs in) */}
      {(() => {
        const hs = spec.headlines ?? [];
        let cur = -1;
        for (let i = 0; i < hs.length; i++) {
          if (frame >= startF(hs[i].beat)) cur = i;
        }
        if (cur < 0) return null;
        const h = hs[cur];
        const s = pop(startF(h.beat));
        const since = frame - startF(h.beat);
        const render = (parts: SpecPart[], hb: number, style: React.CSSProperties, key: string) => (
          <div key={key} style={{ position: "absolute", top: 62, left: 0, right: 0, textAlign: "center", fontSize: 46, fontWeight: 800, letterSpacing: -0.5, color: TEXT, ...style }}>
            {parts.map((p, pi) => (
              <span key={pi} style={p.tint ? { color: col(spec.accentPerBeat?.[hb]) } : undefined}>{p.t}</span>
            ))}
          </div>
        );
        const out: React.CSSProperties[] = [];
        if (cur > 0 && since < 12) {
          const prev = hs[cur - 1];
          const k = since / 12;
          out.push(render(prev.parts, prev.beat, { opacity: 1 - k, transform: `translateY(${-8 * k}px)` }, "prev"));
        }
        out.push(render(h.parts, h.beat, { opacity: s, transform: `translateY(${(1 - s) * 10}px)` }, "cur"));
        return out;
      })()}

      {/* job badge strip */}
      {badges.length
        ? (() => {
            const visible = frame >= startF(badges[0].beat);
            const fadeAt = startF(spec.badgeFadeBeat ?? panels[0]?.beat ?? lastBeat + 1);
            const opacity = visible
              ? frame < fadeAt
                ? 1
                : interpolate(frame, [fadeAt, fadeAt + 10], [1, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })
              : 0;
            if (opacity <= 0) return null;
            return (
              <div
                style={{
                  position: "absolute",
                  top: 168,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  gap: 14,
                  opacity,
                }}
              >
                {badges.map((bdg, i) => {
                  const s = pop(startF(bdg.beat) + 3 + i * 5);
                  const c = col(bdg.color);
                  return (
                    <div
                      key={i}
                      style={{
                        transform: `scale(${0.6 + 0.4 * s})`,
                        opacity: s,
                        fontFamily: "Consolas, monospace",
                        fontSize: 17,
                        fontWeight: 700,
                        color: c,
                        border: `1.5px solid ${c}55`,
                        background: `${c}14`,
                        borderRadius: 999,
                        padding: "7px 16px",
                      }}
                    >
                      {bdg.t}
                    </div>
                  );
                })}
              </div>
            );
          })()
        : null}

      {/* SQL / query typewriter (hook) */}
      {hook
        ? (() => {
            const s0 = startF(hook.beat);
            const fade = interpolate(frame, [hookFade - 6, hookFade + 8], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            if (fade <= 0) return null;
            const chars = Math.max(
              0,
              Math.round(
                interpolate(
                  frame - s0,
                  [8, Math.max((beats[hook.beat].ms / 1000) * fps - 6, 12)],
                  [0, hook.text.length],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                )
              )
            );
            const shown = hook.text.slice(0, chars);
            const cursorOn = Math.floor(frame / 4) % 2 === 0;
            const c = col(spec.accentPerBeat?.[hook.beat]);
            return (
              <div
                style={{
                  position: "absolute",
                  top: 250,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  opacity: fade,
                }}
              >
                <div
                  style={{
                    fontFamily: "Consolas, monospace",
                    fontSize: 30,
                    color: c,
                    background: "#0d1524",
                    border: `1.5px solid ${c}44`,
                    borderRadius: 12,
                    padding: "16px 28px",
                    boxShadow: `0 0 34px ${c}22`,
                  }}
                >
                  {shown}
                  <span style={{ opacity: cursorOn ? 1 : 0, color: TEXT }}>▌</span>
                </div>
              </div>
            );
          })()
        : null}

      {/* diagram group (shrinks up when takeaways arrive) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${interpolate(pop(startF(shrinkBeat)), [0, 1], [0, -70], {
            extrapolateRight: "clamp",
          })}px) scale(${interpolate(pop(startF(shrinkBeat)), [0, 1], [1, 0.88], {
            extrapolateRight: "clamp",
          })})`,
          transformOrigin: "960px 300px",
        }}
      >
        {/* edges (SVG) with draw-on, pulse-while-spoken, and FLOW DOTS */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            {edgeColors.map((c) => (
              <marker
                key={c}
                id={`arr-${c}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={col(c)} />
              </marker>
            ))}
          </defs>
          {edges.map((e) => {
            if (frame < startF(e.beat)) return null;
            const t = Math.min(frame - startF(e.beat), 22);
            const draw = spring({ frame: t, fps, config: { damping: 16 } });
            const c = col(e.color);
            const pulse = e.pulse && beatIdx === e.beat ? 3 + 2.4 * Math.abs(Math.sin(frame / 3)) : 3;
            return (
              <path
                key={e.id}
                d={e.path}
                fill="none"
                stroke={c}
                strokeWidth={pulse}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={e.dash ? "0.045 0.03" : 1}
                strokeDashoffset={1 - draw}
                opacity={0.95}
                markerEnd={`url(#arr-${e.color || "cyan"})`}
                style={{ filter: `drop-shadow(0 0 6px ${c}66)` }}
              />
            );
          })}
          {edges.map((e) =>
            e.flow && frame >= startF(e.beat) + 14 ? (
              <FlowEdge
                key={e.id + "-flow"}
                d={e.path}
                color={col(e.color)}
                dots={e.dots ?? 3}
                appearFrame={startF(e.beat) + 14}
                frame={frame}
              />
            ) : null
          )}
        </svg>

        {/* edge label chips */}
        {edges.map((e) => {
          if (!e.label || frame < startF(e.beat) + 14) return null;
          const s = pop(startF(e.beat) + 14);
          const c = col(e.color);
          return (
            <div
              key={e.id + "-lbl"}
              style={{
                position: "absolute",
                left: (e.lx ?? 0) - 60,
                top: (e.ly ?? 0) - 20,
                width: 120,
                textAlign: "center",
                transform: `scale(${0.7 + 0.3 * s})`,
                opacity: s,
                fontFamily: "Consolas, monospace",
                fontSize: 16,
                fontWeight: 700,
                color: c,
                background: "#0d1420",
                border: `1.5px solid ${c}55`,
                borderRadius: 999,
                padding: "5px 8px",
              }}
            >
              {e.label}
            </div>
          );
        })}

        {/* panels — overshoot pop, ACTIVE BEAT BREATHING, idle float, optional rows */}
        {panels.map((p) => {
          if (frame < startF(p.beat)) return null;
          const s = pop(startF(p.beat));
          const flash = Math.max(0, 1 - (frame - startF(p.beat)) / 26);
          const c = col(p.color || spec.accentPerBeat?.[p.beat]);
          const active = beatIdx === p.beat;
          const breathe = active ? 1 + 0.015 * Math.sin(frame / 4) : 1;
          const glow = active ? `0 0 ${18 + 8 * Math.abs(Math.sin(frame / 4))}px ${c}55` : flash > 0 ? `0 0 ${26 * flash}px ${c}55` : "0 6px 22px #00000066";
          const floatY = Math.sin((frame + hashOf(p.id)) / 38) * 2.5;
          const rows = p.rows ?? null;
          return (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: p.x,
                top: p.y,
                width: p.w,
                height: p.h,
                transform: `translateY(${floatY}px) scale(${(0.72 + 0.28 * s) * breathe})`,
                opacity: s,
                background: PANEL,
                border: `1.5px solid ${active ? c : flash > 0 ? c : BORDER}`,
                borderRadius: 14,
                boxShadow: glow,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                paddingLeft: 22,
                gap: 5,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {p.badge ? (
                  <span
                    style={{
                      fontFamily: "Consolas, monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      color: c,
                      background: `${c}16`,
                      border: `1px solid ${c}44`,
                      borderRadius: 6,
                      padding: "2px 7px",
                    }}
                  >
                    {p.badge}
                  </span>
                ) : null}
                <span style={{ fontSize: 19, fontWeight: 800, color: TEXT, letterSpacing: 0.4 }}>{p.title}</span>
              </div>
              {rows ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {rows.map((r, ri) => {
                    const rs = pop(startF(p.beat) + 8 + ri * 9);
                    return (
                      <div key={ri} style={{ display: "flex", alignItems: "center", gap: 8, opacity: rs, transform: `translateX(${(1 - rs) * 10}px)` }}>
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: c }} />
                        <span style={{ fontFamily: "Consolas, monospace", fontSize: 13, color: SUB }}>{r}</span>
                      </div>
                    );
                  })}
                </div>
              ) : p.sub ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {p.db ? (
                    <svg width="20" height="24" viewBox="0 0 20 24">
                      <ellipse cx="10" cy="5" rx="7" ry="3" fill="none" stroke={SUB} strokeWidth="1.6" />
                      <path d="M3 5 L3 19 A7 3 0 0 0 17 19 L17 5" fill="none" stroke={SUB} strokeWidth="1.6" />
                    </svg>
                  ) : null}
                  <span style={{ fontFamily: "Consolas, monospace", fontSize: 14, color: SUB }}>{p.sub}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* odometer COUNTERS — the number ticks up while its beat is spoken */}
      {counters.map((ctr, ci) => {
        if (frame < startF(ctr.beat)) return null;
        const b = beats[ctr.beat];
        const durF = Math.max((b.ms / 1000) * fps - 4, 12);
        const prog = interpolate(frame - startF(ctr.beat), [4, durF], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const eased = 1 - Math.pow(1 - prog, 3);
        const val = Math.round(ctr.from + (ctr.to - ctr.from) * eased);
        const s = pop(startF(ctr.beat));
        const c = col(ctr.color);
        return (
          <div
            key={"ctr" + ci}
            style={{
              position: "absolute",
              left: ctr.x,
              top: ctr.y,
              width: ctr.w ?? 240,
              opacity: s,
              transform: `scale(${0.7 + 0.3 * s})`,
              background: "#0d1524",
              border: `1.5px solid ${c}55`,
              borderRadius: 12,
              padding: "10px 16px",
              boxShadow: `0 0 ${16 + 8 * Math.abs(Math.sin(frame / 6))}px ${c}33`,
            }}
          >
            <div style={{ fontFamily: "Consolas, monospace", fontSize: 13, fontWeight: 700, color: SUB, letterSpacing: 1.5 }}>
              {ctr.label.toUpperCase()}
            </div>
            <div style={{ fontFamily: "Consolas, monospace", fontSize: 34, fontWeight: 800, color: c, lineHeight: 1.15 }}>
              {val.toLocaleString("en-US")}
              {ctr.suffix ?? ""}
            </div>
          </div>
        );
      })}

      {/* TERMINALS — fake window, lines type character-by-character */}
      {terminals.map((t, ti) => {
        if (frame < startF(t.beat)) return null;
        const b = beats[t.beat];
        const durF = Math.max((b.ms / 1000) * fps - 4, 20);
        const c = col(t.color);
        const s = pop(startF(t.beat));
        const total = t.lines.join("").length;
        const typed = Math.round(
          interpolate(frame - startF(t.beat), [8, durF], [0, total], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        );
        const cursorOn = Math.floor(frame / 4) % 2 === 0;
        let used = 0;
        const h = t.h ?? 130;
        return (
          <div
            key={"term" + ti}
            style={{
              position: "absolute",
              left: t.x,
              top: t.y,
              width: t.w,
              height: h,
              opacity: s,
              transform: `scale(${0.75 + 0.25 * s})`,
              transformOrigin: "top left",
              background: "#0b1120",
              border: `1.5px solid ${c}55`,
              borderRadius: 12,
              boxShadow: `0 0 26px ${c}22`,
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderBottom: `1px solid ${BORDER}` }}>
              {["#ef4444", "#f59e0b", "#22c55e"].map((d) => (
                <span key={d} style={{ width: 9, height: 9, borderRadius: 5, background: d, opacity: 0.85 }} />
              ))}
              <span style={{ fontFamily: "Consolas, monospace", fontSize: 12, color: FAINT, marginLeft: 6 }}>{t.title}</span>
            </div>
            <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
              {t.lines.map((ln, li) => {
                const startAt = used;
                used += ln.length;
                if (typed <= startAt) return null;
                const shown = ln.slice(0, Math.max(0, typed - startAt));
                const isCurrent = typed > startAt && typed < startAt + ln.length;
                const isLast = li === t.lines.length - 1;
                return (
                  <div key={li} style={{ fontFamily: "Consolas, monospace", fontSize: 14, color: TEXT, whiteSpace: "pre" }}>
                    {shown}
                    {(isCurrent || (isLast && typed >= total)) && cursorOn ? <span style={{ color: c }}>▌</span> : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* SELECTORS — highlight walks the options in narration order */}
      {selectors.map((sel, si) => {
        if (frame < startF(sel.beat)) return null;
        const b = beats[sel.beat];
        const durF = Math.max((b.ms / 1000) * fps, 20);
        const prog = interpolate(frame - startF(sel.beat), [6, durF], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const activeIdx = Math.min(sel.options.length - 1, Math.floor(prog * sel.options.length));
        const s = pop(startF(sel.beat));
        const c = col(sel.color);
        return (
          <div
            key={"sel" + si}
            style={{
              position: "absolute",
              left: sel.x,
              top: sel.y,
              width: sel.w,
              opacity: s,
              transform: `scale(${0.75 + 0.25 * s})`,
              background: "#0d1524",
              border: `1.5px solid ${c}44`,
              borderRadius: 12,
              padding: "10px 14px 12px",
            }}
          >
            {sel.title ? (
              <div style={{ fontFamily: "Consolas, monospace", fontSize: 12, fontWeight: 700, color: SUB, letterSpacing: 1.5, marginBottom: 8 }}>
                {sel.title.toUpperCase()}
              </div>
            ) : null}
            <div style={{ display: "flex", gap: 8 }}>
              {sel.options.map((o, oi) => {
                const on = oi === activeIdx;
                return (
                  <div
                    key={oi}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontFamily: "Consolas, monospace",
                      fontSize: 14,
                      fontWeight: 700,
                      color: on ? "#081018" : c,
                      background: on ? c : "transparent",
                      border: `1.5px solid ${on ? c : `${c}44`}`,
                      borderRadius: 8,
                      padding: "6px 4px",
                      transform: `scale(${on ? 1.06 : 1})`,
                      boxShadow: on ? `0 0 16px ${c}66` : "none",
                      transition: "none",
                    }}
                  >
                    {o}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* takeaways */}
      {frame >= startF(shrinkBeat) + 10
        ? takeaways.map((r, i) => {
            const s = pop(startF(shrinkBeat) + 10 + i * 9);
            const c = col(r.color);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 480,
                  top: 690 + i * 74,
                  width: 960,
                  opacity: s,
                  transform: `translateX(${(1 - s) * 60}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                }}
              >
                <div style={{ width: 5, height: 40, borderRadius: 3, background: c, boxShadow: `0 0 12px ${c}88` }} />
                <span style={{ fontFamily: "Consolas, monospace", fontSize: 30, fontWeight: 700, color: TEXT }}>{r.t}</span>
              </div>
            );
          })
        : null}

      {/* outro lockup */}
      {spec.outro
        ? (() => {
            const at = durationInFrames - 55;
            if (frame < at) return null;
            const s = spring({ frame: frame - at, fps, config: { damping: 12 } });
            return (
              <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: s }}>
                <div
                  style={{
                    fontFamily: "Consolas, monospace",
                    fontSize: 30,
                    fontWeight: 700,
                    color: PALETTE.green,
                    background: "#0d1524",
                    border: `2px solid ${PALETTE.green}77`,
                    borderRadius: 16,
                    padding: "18px 34px",
                    transform: `scale(${0.8 + 0.2 * s})`,
                    boxShadow: `0 0 44px ${PALETTE.green}33`,
                  }}
                >
                  {spec.outro}
                </div>
              </div>
            );
          })()
        : null}

      {/* karaoke captions */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 52,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 7,
          padding: "0 120px",
        }}
      >
        {(() => {
          const b = beats[beatIdx];
          return b.words.map((w, i) => {
            const abs = b.startMs + w.s;
            const end = abs + w.d;
            const active = msNow >= abs - 40 && msNow < end + 150;
            const spoken = msNow >= end + 150;
            return (
              <span
                key={i}
                style={{
                  fontFamily: "Consolas, monospace",
                  fontSize: 24,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#081018" : spoken ? TEXT : FAINT,
                  background: active ? accent : "transparent",
                  borderRadius: 8,
                  padding: "3px 9px",
                }}
              >
                {w.w}
              </span>
            );
          });
        })()}
      </div>

      {/* footer */}
      <div
        style={{
          position: "absolute",
          left: 48,
          bottom: 24,
          fontFamily: "Consolas, monospace",
          fontSize: 14,
          color: FAINT,
          letterSpacing: 1,
        }}
      >
        how dev works · diagram lab
      </div>

      {/* narration audio, one clip per beat at its exact start */}
      {beats.map((b) => (
        <Sequence key={b.i} from={startF(b.i)}>
          <Audio src={staticFile(`tts/beat-${String(b.i).padStart(2, "0")}.mp3`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
