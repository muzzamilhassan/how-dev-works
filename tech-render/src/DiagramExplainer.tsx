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

// Spec-driven diagram explainer — the whole video comes from props.spec
// (see specs/*.json + check-spec.mjs). One composition renders ANY topic:
// narration beats drive headline swaps, panel pops, edge draws and captions.

export type Word = { w: string; s: number; d: number };
export type Beat = { i: number; startMs: number; ms: number; words: Word[] };

export type SpecPart = { t: string; tint?: boolean };
export type SpecHeadline = { beat: number; parts: SpecPart[] };
export type SpecBadge = { t: string; beat: number; color?: string };
export type SpecPanel = {
  id: string;
  title: string;
  sub?: string;
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
  takeaways?: SpecTakeaway[];
  takeawaysBeat?: number;
  outro?: string;
};

export type TimelineProps = { spec: Spec; beats: Beat[]; totalMs: number; fps: number };

// ---------- design tokens (ByteByteGo grammar: dark, one idea, accent = chapter)
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
  const takeaways = spec.takeaways ?? [];
  const shrinkBeat = spec.takeawaysBeat ?? lastBeat;
  const hook = spec.hook;
  const hookFade = hook ? startF(hook.beat + 1) : durationInFrames + 10;

  const edgeColors = Array.from(new Set(["cyan", ...edges.map((e) => e.color || "cyan")]));

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
          background: `linear-gradient(90deg, ${PALETTE.cyan}, ${PALETTE.green})`,
          opacity: 0.7,
        }}
      />

      {/* headline (current chapter only, spring-in on change) */}
      {(() => {
        const hs = spec.headlines ?? [];
        let cur = -1;
        for (let i = 0; i < hs.length; i++) {
          if (frame >= startF(hs[i].beat)) cur = i;
        }
        if (cur < 0) return null;
        const h = hs[cur];
        const s = pop(startF(h.beat));
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
              <span key={pi} style={p.tint ? { color: col(spec.accentPerBeat?.[h.beat]) } : undefined}>
                {p.t}
              </span>
            ))}
          </div>
        );
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
        {/* edges (SVG) */}
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

        {/* panels */}
        {panels.map((p) => {
          if (frame < startF(p.beat)) return null;
          const s = pop(startF(p.beat));
          const flash = Math.max(0, 1 - (frame - startF(p.beat)) / 26);
          const c = col(p.color || spec.accentPerBeat?.[p.beat]);
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
                {p.sub ? (
                  <span style={{ fontFamily: "Consolas, monospace", fontSize: 14, color: SUB }}>{p.sub}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

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
          <Audio src={staticFile(`tts/beat-0${b.i}.mp3`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
