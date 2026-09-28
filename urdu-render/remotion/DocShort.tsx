import React, { useEffect } from "react";
import {
  AbsoluteFill, Audio, Img, OffthreadVideo, interpolate, Sequence, continueRender, delayRender,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

// Urdu documentary composition — the NEW channel's own visual language:
// full-screen historical imagery with Ken Burns motion, Nastaliq headlines,
// timed Urdu caption chunks, dark gradient overlays, music bed. No relation
// to the How Dev Works tech templates.

export type CaptionChunk = { text: string; t0: number; t1: number };
export type DocScene = {
  image?: string;           // public-relative still (Ken Burns)
  video?: string;           // public-relative stock clip (muted, covers frame)
  headline?: string;        // Nastaliq headline (RTL)
  era?: string;             // small era chip (e.g. "800 عیسوی — چین")
  start: number;            // seconds
  dur: number;              // seconds
  audio?: string | null;    // narration mp3 (public-relative)
  captions: CaptionChunk[];
  zoomDir: number;          // +1 zoom in, -1 zoom out
};
export type DocProps = {
  scenes: DocScene[];
  totalMs: number;
  fps: number;
  music: string | null;
};

const loadFonts = () => {
  useEffect(() => {
    const h = delayRender("urdu fonts");
    Promise.all([
      new Promise<void>((res) => {
        const f = new FontFace("Nastaliq", `url(${staticFile("fonts/NotoNastaliqUrdu.ttf")})`);
        f.load().then((l) => { document.fonts.add(l); res(); }).catch(() => res());
      }),
      new Promise<void>((res) => {
        const f = new FontFace("Naskh", `url(${staticFile("fonts/NotoNaskhArabic.ttf")})`);
        f.load().then((l) => { document.fonts.add(l); res(); }).catch(() => res());
      }),
      new Promise<void>((res) => {
        const f = new FontFace("Archivo", `url(${staticFile("fonts/ArchivoBlack-Regular.ttf")})`);
        f.load().then((l) => { document.fonts.add(l); res(); }).catch(() => res());
      }),
      new Promise<void>((res) => {
        const f = new FontFace("SansArabic", `url(${staticFile("fonts/NotoSansArabic.ttf")})`, { weight: "700" });
        f.load().then((l) => { document.fonts.add(l); res(); }).catch(() => res());
      }),
    ]).then(() => continueRender(h)).catch(() => continueRender(h));
  }, []);
};

const KenBurns: React.FC<{ src: string; dur: number; zoomDir: number }> = ({ src, dur, zoomDir }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(f, [0, dur * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = zoomDir > 0 ? 1 + 0.12 * p : 1.12 - 0.12 * p;
  const dx = zoomDir > 0 ? -18 * p : 18 * p;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: `scale(${scale}) translateX(${dx}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const ClipCover: React.FC<{ src: string }> = ({ src }) => {
  const f = useCurrentFrame();
  const scale = 1.04 + 0.02 * Math.sin(f / 90);   // subtle breathing motion on clips
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      {/* loop: a clip shorter than its scene keeps moving — no frozen last frame */}
      <OffthreadVideo src={staticFile(src)} muted loop style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />
    </AbsoluteFill>
  );
};

const SceneMedia: React.FC<{ s: DocScene }> = ({ s }) => {
  if (s.video) return <ClipCover src={s.video} />;
  if (s.image) return <KenBurns src={s.image} dur={s.dur} zoomDir={s.zoomDir} />;
  return <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #182029 0%, #0B0E13 70%)" }} />;
};

const Gradient: React.FC<{ heavy?: boolean }> = ({ heavy }) => (
  <AbsoluteFill style={{
    background:
      `linear-gradient(180deg, rgba(8,10,14,0.62) 0%, rgba(8,10,14,0.18) 34%, rgba(8,10,14,0.30) 62%, rgba(8,10,14,${heavy ? 0.94 : 0.86}) 100%)`,
  }} />
);

const Headline: React.FC<{ text: string; era?: string; delaySec?: number }> = ({ text, era, delaySec = 0.4 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(f, [delaySec * fps, (delaySec + 0.9) * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{
      position: "absolute", top: 54, left: 0, right: 0, textAlign: "center",
      opacity: p, transform: `translateY(${(1 - p) * -26}px)`,
    }}>
      {era ? (
        <div style={{
          display: "inline-block", fontFamily: "Archivo, sans-serif",
          fontSize: 30, color: "#FDE68A", letterSpacing: 6,
          background: "rgba(20,24,32,0.72)", borderRadius: 999, padding: "8px 34px", marginBottom: 20,
          border: "1px solid rgba(253,230,138,0.35)",
        }}>{era}</div>
      ) : null}
      <div style={{
        fontFamily: "Archivo, sans-serif", fontSize: 110, lineHeight: 1.08,
        color: "#F8FAFC", textShadow: "0 4px 30px rgba(0,0,0,0.9)", padding: "0 80px",
      }}>{text}</div>
    </div>
  );
};

const Captions: React.FC<{ chunks: CaptionChunk[] }> = ({ chunks }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (f / fps) * 1000;
  const cur = chunks.find(c => ms >= c.t0 && ms < c.t1 + 250);
  if (!cur) return null;
  return (
    <div style={{
      position: "absolute", bottom: 58, left: 110, right: 110, textAlign: "center",
      fontFamily: "SansArabic, sans-serif", direction: "rtl", fontWeight: 700,
      fontSize: 54, lineHeight: 1.8, color: "#FFFFFF",
      textShadow: "0 2px 18px rgba(0,0,0,0.98), 0 0 70px rgba(0,0,0,0.65)",
    }}>{cur.text}</div>
  );
};

const FadeEdges: React.FC<{ fadeSec: number; fps: number; dur: number; children: React.ReactNode }> = ({ fadeSec, fps, dur, children }) => {
  const f = useCurrentFrame();
  const dF = Math.round(dur * fps);           // dur arrives in SECONDS
  const fF = Math.round(fadeSec * fps);
  const op = dF < fF * 2 + 4 ? 1
    : interpolate(f, [0, fF, dF - fF, dF - 2], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

export const DocShort: React.FC<DocProps> = (props) => {
  loadFonts();
  const { fps, durationInFrames } = useVideoConfig();
  const scenes: DocScene[] = props.scenes || [];
  const u = (s: number) => Math.round(s * fps);
  const fade = 0.18; // sentence-level cuts: quick dips, not long fades
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {scenes.map((s, i) => (
        <Sequence key={i} from={u(s.start)} durationInFrames={u(s.dur)} layout="none">
          <FadeEdges fadeSec={fade} fps={fps} dur={s.dur}>
            <SceneMedia s={s} />
            <Gradient heavy={i === 0 || i === scenes.length - 1} />
            {s.headline ? <Headline text={s.headline} era={s.era} /> : null}
            <Captions chunks={s.captions} />
            {s.audio ? <Audio src={staticFile(s.audio)} /> : null}
          </FadeEdges>
        </Sequence>
      ))}
      {props.music ? (
        <Audio src={staticFile(props.music)} loop
          volume={(f: number) => interpolate(f, [0, 30, durationInFrames - 45, durationInFrames - 2], [0, 0.16, 0.16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      ) : null}
    </AbsoluteFill>
  );
};
