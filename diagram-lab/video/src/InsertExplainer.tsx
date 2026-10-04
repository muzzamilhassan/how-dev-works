import React from "react";
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

export type Word = { w: string; s: number; d: number };
export type Beat = { i: number; startMs: number; ms: number; words: Word[] };
export type TimelineProps = { fps: number; beats: Beat[]; totalMs: number };

// ---------- design tokens (ByteByteGo grammar: dark, one idea, accent = chapter)
const BG = "#0a0e16";
const PANEL = "#131b2c";
const BORDER = "#2b3b55";
const TEXT = "#e7eefb";
const SUB = "#8fa1bd";
const FAINT = "#516179";
const CYAN = "#38bdf8";
const AMBER = "#fbbf24";
const GREEN = "#34d399";
const VIOLET = "#a78bfa";

// accent per narration beat (chapter color)
const ACCENT = [CYAN, CYAN, CYAN, AMBER, GREEN, GREEN, VIOLET, GREEN];

const HEADLINES: { b: number; parts: { t: string; tint?: boolean }[] }[] = [
  { b: 0, parts: [{ t: "One line of " }, { t: "SQL", tint: true }, { t: "." }] },
  { b: 1, parts: [{ t: "Five jobs " }, { t: "under the hood", tint: true }, { t: "." }] },
  { b: 3, parts: [{ t: "Parse it. " }, { t: "Plan it cheap", tint: true }, { t: "." }] },
  { b: 4, parts: [{ t: "The log " }, { t: "is the contract", tint: true }, { t: "." }] },
  { b: 6, parts: [{ t: "Tables update " }, { t: "later", tint: true }, { t: "." }] },
  { b: 7, parts: [{ t: "Sequential " }, { t: "beats random", tint: true }, { t: "." }] },
];

const BADGES = ["01 · POOL", "02 · PLAN", "03 · LOG", "04 · FLUSH", "05 · ACK"];
const BADGE_ACCENT = [CYAN, AMBER, GREEN, VIOLET, GREEN];

const SQL_LINE = "INSERT INTO orders VALUES (...);";

// ---------- diagram layout (1920x1080 canvas)
type PanelDef = {
  id: string;
  badge: string;
  title: string;
  sub: string;
  x: number;
  y: number;
  w: number;
  h: number;
  beat: number;
  db?: boolean;
};

const PANELS: PanelDef[] = [
  { id: "client", badge: "", title: "CLIENT", sub: "your app", x: 80, y: 430, w: 220, h: 104, beat: 2 },
  { id: "pool", badge: "01", title: "CONNECTION POOL", sub: "free worker", x: 380, y: 430, w: 250, h: 104, beat: 2 },
  { id: "plan", badge: "02", title: "PARSER + PLANNER", sub: "cheapest path", x: 710, y: 430, w: 280, h: 104, beat: 3 },
  { id: "walbuf", badge: "03", title: "WAL BUFFER", sub: "append-only", x: 1070, y: 430, w: 230, h: 104, beat: 4, db: true },
  { id: "waldisk", badge: "03", title: "WAL SEGMENT", sub: "fsync'd on disk", x: 1070, y: 620, w: 230, h: 104, beat: 4, db: true },
  { id: "buf", badge: "", title: "BUFFER POOL", sub: "dirty page", x: 1420, y: 430, w: 220, h: 104, beat: 5 },
  { id: "table", badge: "04", title: "TABLE FILES", sub: "16 KB pages", x: 1420, y: 620, w: 220, h: 104, beat: 6, db: true },
];

type EdgeDef = {
  id: string;
  path: string;
  beat: number;
  color: string;
  label?: string;
  lx?: number;
  ly?: number;
  dash?: boolean;
  pulse?: boolean;
  marker: string;
};

const EDGES: EdgeDef[] = [
  { id: "e1", path: "M 300 482 L 380 482", beat: 2, color: CYAN, marker: "arr-cyan" },
  { id: "e2", path: "M 630 482 L 710 482", beat: 3, color: AMBER, marker: "arr-amber" },
  { id: "e3", path: "M 990 482 L 1070 482", beat: 4, color: GREEN, marker: "arr-green" },
  { id: "e4", path: "M 1185 534 L 1185 620", beat: 4, color: GREEN, label: "fsync", lx: 1100, ly: 577, pulse: true, marker: "arr-green" },
  { id: "e5", path: "M 1300 672 C 1360 672 1370 482 1420 482", beat: 5, color: GREEN, label: "row safe", lx: 1470, ly: 577, marker: "arr-green" },
  { id: "e6", path: "M 1070 640 C 900 240 420 240 190 430", beat: 5, color: GREEN, label: "COMMIT ✓", lx: 630, ly: 258, dash: true, marker: "arr-green" },
  { id: "e7", path: "M 1530 534 L 1530 620", beat: 6, color: VIOLET, label: "checkpoint", lx: 1648, ly: 577, marker: "arr-violet" },
];

const TAKEAWAYS = [
  { t: "the log = ONE sequential append", c: GREEN },
  { t: "random page writes = slow", c: AMBER },
  { t: "log first → durable commit ✓", c: CYAN },
];

// ---------- helpers
export const InsertExplainer: React.FC<TimelineProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const beats = props.beats;

  if (!beats.length) {
    return <AbsoluteFill style={{ backgroundColor: BG }} />;
  }

  const startF = (b: number) => Math.round((beats[b].startMs / 1000) * fps);
  const msNow = (frame / fps) * 1000;

  let beatIdx = 0;
  for (let i = 0; i < beats.length; i++) {
    if (frame >= startF(i)) beatIdx = i;
  }
  const accent = ACCENT[beatIdx] ?? CYAN;

  const pop = (atFrame: number, cfg?: object) =>
    spring({ frame: frame - atFrame, fps, config: { damping: 12, ...(cfg || {}) } });

  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* faint blueprint grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(#111a2b 1px, transparent 1px), linear-gradient(90deg, #111a2b 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          opacity: 0.35,
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
          background: `linear-gradient(90deg, ${CYAN}, ${GREEN})`,
          opacity: 0.7,
        }}
      />

      {/* headline (current chapter only, spring-in on change) */}
      {(() => {
        let cur = -1;
        for (let i = 0; i < HEADLINES.length; i++) {
          if (frame >= startF(HEADLINES[i].b)) cur = i;
        }
        if (cur < 0) return null;
        const h = HEADLINES[cur];
        const s = pop(startF(h.b));
        return (
          <div
            key={cur}
            style={{
              position: "absolute",
              top: 62,
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 46,
              fontWeight: 800,
              letterSpacing: -0.5,
              color: TEXT,
              opacity: s,
              transform: `translateY(${(1 - s) * 10}px)`,
            }}
          >
            {h.parts.map((p, pi) => (
              <span key={pi} style={p.tint ? { color: ACCENT[h.b] ?? CYAN } : undefined}>
                {p.t}
              </span>
            ))}
          </div>
        );
      })()}

      {/* job badge strip (beat 1) */}
      <div
        style={{
          position: "absolute",
          top: 168,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 14,
          opacity: frame >= startF(1) && frame < startF(2) ? 1 : interpolate(frame, [startF(2), startF(2) + 10], [1, 0], { extrapolateRight: "clamp" }),
        }}
      >
        {BADGES.map((t, i) => {
          const s = pop(startF(1) + 3 + i * 5);
          const c = BADGE_ACCENT[i];
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
              {t}
            </div>
          );
        })}
      </div>

      {/* SQL typewriter (hook) */}
      {(() => {
        const s0 = startF(0);
        const fade = interpolate(frame, [startF(2) - 6, startF(2) + 8], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        if (fade <= 0) return null;
        const chars = Math.max(
          0,
          Math.round(
            interpolate(frame - s0, [8, (beats[0].ms / 1000) * fps - 6], [0, SQL_LINE.length], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          )
        );
        const shown = SQL_LINE.slice(0, chars);
        const cursorOn = Math.floor(frame / 4) % 2 === 0;
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
                color: CYAN,
                background: "#0d1524",
                border: `1.5px solid ${CYAN}44`,
                borderRadius: 12,
                padding: "16px 28px",
                boxShadow: `0 0 34px ${CYAN}22`,
              }}
            >
              {shown}
              <span style={{ opacity: cursorOn ? 1 : 0, color: TEXT }}>▌</span>
            </div>
          </div>
        );
      })()}

      {/* diagram group (shrinks up when takeaways arrive on beat 7) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${interpolate(
            pop(startF(7)),
            [0, 1],
            [0, -70],
            { extrapolateRight: "clamp" }
          )}px) scale(${interpolate(pop(startF(7)), [0, 1], [1, 0.88], { extrapolateRight: "clamp" })})`,
          transformOrigin: "960px 300px",
        }}
      >
        {/* edges (SVG) */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            {[
              ["arr-cyan", CYAN],
              ["arr-amber", AMBER],
              ["arr-green", GREEN],
              ["arr-violet", VIOLET],
            ].map(([id, c]) => (
              <marker key={id} id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
              </marker>
            ))}
          </defs>
          {EDGES.map((e) => {
            if (frame < startF(e.beat)) return null;
            const t = Math.min(frame - startF(e.beat), 22);
            const draw = spring({ frame: t, fps, config: { damping: 16 } });
            const pulse = e.pulse && beatIdx === 4 ? 3 + 2.4 * Math.abs(Math.sin(frame / 3)) : 3;
            return (
              <path
                key={e.id}
                d={e.path}
                fill="none"
                stroke={e.color}
                strokeWidth={pulse}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={e.dash ? "0.045 0.03" : 1}
                strokeDashoffset={e.dash ? 1 - draw : 1 - draw}
                opacity={0.95}
                markerEnd={`url(#${e.marker})`}
                style={{ filter: `drop-shadow(0 0 6px ${e.color}66)` }}
              />
            );
          })}
        </svg>

        {/* edge label chips */}
        {EDGES.map((e) => {
          if (!e.label || frame < startF(e.beat) + 14) return null;
          const s = pop(startF(e.beat) + 14);
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
                color: e.color,
                background: "#0d1420",
                border: `1.5px solid ${e.color}55`,
                borderRadius: 999,
                padding: "5px 8px",
              }}
            >
              {e.label}
            </div>
          );
        })}

        {/* panels */}
        {PANELS.map((p) => {
          if (frame < startF(p.beat)) return null;
          const s = pop(startF(p.beat));
          const flash = Math.max(0, 1 - (frame - startF(p.beat)) / 26);
          const c = ACCENT[p.beat] ?? CYAN;
          return (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: p.x,
                top: p.y,
                width: p.w,
                height: p.h,
                transform: `scale(${0.72 + 0.28 * s})`,
                opacity: s,
                background: PANEL,
                border: `1.5px solid ${flash > 0 ? c : BORDER}`,
                borderRadius: 14,
                boxShadow: flash > 0 ? `0 0 ${26 * flash}px ${c}55` : "0 6px 22px #00000066",
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {p.db ? (
                  <svg width="20" height="24" viewBox="0 0 20 24">
                    <ellipse cx="10" cy="5" rx="7" ry="3" fill="none" stroke={SUB} strokeWidth="1.6" />
                    <path d="M3 5 L3 19 A7 3 0 0 0 17 19 L17 5" fill="none" stroke={SUB} strokeWidth="1.6" />
                  </svg>
                ) : null}
                <span style={{ fontFamily: "Consolas, monospace", fontSize: 14, color: SUB }}>{p.sub}</span>
              </div>
            </div>
          );
        })}

        {/* OK chip next to client after commit ack */}
        {(() => {
          if (frame < startF(5) + 30) return null;
          const s = pop(startF(5) + 30);
          return (
            <div
              style={{
                position: "absolute",
                left: 96,
                top: 356,
                transform: `scale(${0.6 + 0.4 * s})`,
                opacity: s,
                fontFamily: "Consolas, monospace",
                fontSize: 18,
                fontWeight: 700,
                color: GREEN,
                background: "#0d1420",
                border: `1.5px solid ${GREEN}66`,
                borderRadius: 999,
                padding: "6px 14px",
                boxShadow: `0 0 20px ${GREEN}33`,
              }}
            >
              OK ✓
            </div>
          );
        })()}
      </div>

      {/* takeaways (beat 7) */}
      {frame >= startF(7) + 10
        ? TAKEAWAYS.map((r, i) => {
            const s = pop(startF(7) + 10 + i * 9);
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
                <div style={{ width: 5, height: 40, borderRadius: 3, background: r.c, boxShadow: `0 0 12px ${r.c}88` }} />
                <span style={{ fontFamily: "Consolas, monospace", fontSize: 30, fontWeight: 700, color: TEXT }}>{r.t}</span>
              </div>
            );
          })
        : null}

      {/* outro lockup */}
      {(() => {
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
                color: GREEN,
                background: "#0d1524",
                border: `2px solid ${GREEN}77`,
                borderRadius: 16,
                padding: "18px 34px",
                transform: `scale(${0.8 + 0.2 * s})`,
                boxShadow: `0 0 44px ${GREEN}33`,
              }}
            >
              one line of SQL → durable commit
            </div>
          </div>
        );
      })()}

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
          <Audio src={staticFile(`tts/beat-0${b.i}.mp3`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
