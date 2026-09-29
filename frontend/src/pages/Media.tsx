import { useState } from "react";
import { AudioLines, Image as ImageIcon, Film } from "lucide-react";
import { Badge, Card, Poster, SectionHeader, Tabs, TabItem } from "../components/ui";
import { cn, fmtDur } from "../lib/utils";

const clips = [
  { id: "c1", query: "salt pans aerial", match: "salt-harvesting dandi march", dur: 34, usedIn: "UR-E01", hue: 24 },
  { id: "c2", query: "roman salt road", match: "via salaria ruins drone", dur: 21, usedIn: "UR-E01", hue: 30 },
  { id: "c3", query: "gandhi dandi march", match: "archive b/w 1930", dur: 18, usedIn: "UR-E01", hue: 20 },
  { id: "c4", query: "tea plantation slope", match: "darjeeling plucking hands", dur: 27, usedIn: "UR-E02", hue: 110 },
  { id: "c5", query: "silk worm cocoon", match: "macro reeling thread", dur: 24, usedIn: "UR-E03", hue: 320 },
  { id: "c6", query: "caravan camels desert", match: "silk road sunset", dur: 30, usedIn: "UR-E03", hue: 340 },
];

const thumbs = [
  { id: "t1", title: "SALT", sub: "The rock that built empires", ctr: 8.4, video: "UR-E01", hue: 24 },
  { id: "t2", title: "TEA", sub: "The leaf that ruled the world", ctr: null, video: "UR-E02", hue: 110 },
  { id: "t3", title: "SILK", sub: "Threads that bought cities", ctr: null, video: "UR-E03", hue: 320 },
];

const ttsJobs = [
  { id: "j1", ep: "UR-E03 · Silk", chunks: "14/22", voice: "ur-PK-ustad", dur: 540, state: "Rendering", tone: "warn" as const },
  { id: "j2", ep: "UR-E02 · Tea", chunks: "22/22", voice: "ur-PK-ustad", dur: 528, state: "Done", tone: "live" as const },
  { id: "j3", ep: "UR-E01 · Salt", chunks: "22/22", voice: "ur-PK-ustad", dur: 512, state: "Done", tone: "live" as const },
  { id: "j4", ep: "UR-E04 · Obsidian", chunks: "9/–", voice: "ur-PK-kiran", dur: 0, state: "Draft", tone: "neutral" as const },
];

export function Media() {
  const [tab, setTab] = useState("clips");

  return (
    <>
      <SectionHeader
        eyebrow="Media vault · everything the lanes render from"
        title="Media"
        desc="Source clips matched to the script, thumbnails from the photo-poster factory, and every voiceover chunk the TTS worker has produced."
        action={
          <Tabs defaultValue="clips" onChange={setTab}>
            <TabItem value="clips">Clips</TabItem>
            <TabItem value="thumbs">Thumbnails</TabItem>
            <TabItem value="voice">Voiceover</TabItem>
          </Tabs>
        }
      />

      {tab === "clips" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {clips.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="p-3 pb-0">
                <Poster title={c.match} hue={c.hue} />
              </div>
              <div className="px-4 py-3">
                <p className="truncate font-mono text-[11px] text-ink">“{c.query}”</p>
                <p className="mt-0.5 truncate text-xs text-muted">→ {c.match}</p>
                <div className="mt-2.5 flex items-center justify-between">
                  <Badge tone="accent">{fmtDur(c.dur)}</Badge>
                  <span className="font-mono text-[10.5px] text-faint">{c.usedIn}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "thumbs" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {thumbs.map((t) => (
            <Card key={t.id} className="overflow-hidden">
              {/* photo-poster factory style: photo plate, flat type, thin frame */}
              <div
                className="relative aspect-video overflow-hidden"
                style={{
                  background: `linear-gradient(140deg, hsl(${t.hue} 38% 30%), hsl(${t.hue} 45% 16%) 70%)`,
                }}
              >
                <div
                  className="absolute -right-8 -top-8 size-40 rounded-full opacity-40"
                  style={{ background: `radial-gradient(circle, hsl(${t.hue} 60% 55%), transparent 70%)` }}
                />
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <span className="font-display text-[40px] leading-none tracking-wide text-white/95">
                    {t.title}
                  </span>
                  <span className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white/75">
                    {t.sub}
                  </span>
                </div>
                <span className="absolute left-3 top-3 rounded bg-black/45 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/85">
                  photo-poster v2
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-mono text-[11px] text-faint">{t.video}</span>
                {t.ctr ? (
                  <Badge tone="live" dot>
                    CTR {t.ctr}%
                  </Badge>
                ) : (
                  <Badge>awaiting verify</Badge>
                )}
              </div>
            </Card>
          ))}
          <Card className="flex items-center justify-center border-dashed p-6 text-center">
            <div>
              <ImageIcon className="mx-auto size-5 text-faint" />
              <p className="mt-2 text-[13px] font-medium text-ink">Factory regenerates on demand</p>
              <p className="mt-1 text-xs text-muted">CC0 archive photos + flat text. Tech-native only.</p>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "voice" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-faint">
                  <th className="px-5 py-3 font-mono font-medium">Job</th>
                  <th className="px-3 py-3 font-mono font-medium">Chunks</th>
                  <th className="px-3 py-3 font-mono font-medium">Voice</th>
                  <th className="px-3 py-3 font-mono font-medium">Runtime</th>
                  <th className="px-3 py-3 font-mono font-medium">Waveform</th>
                  <th className="px-5 py-3 text-right font-mono font-medium">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ttsJobs.map((j) => (
                  <tr key={j.id} className="transition-colors hover:bg-raised">
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-2 font-medium text-ink">
                        <AudioLines className="size-4 text-faint" />
                        {j.ep}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-xs text-muted tabular">{j.chunks}</td>
                    <td className="px-3 py-3.5 font-mono text-xs text-muted">{j.voice}</td>
                    <td className="px-3 py-3.5 font-mono text-xs text-muted tabular">
                      {j.dur ? fmtDur(j.dur) : "—"}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex h-6 items-center gap-[2px]" aria-hidden>
                        {Array.from({ length: 28 }, (_, i) => (
                          <span
                            key={i}
                            className={cn(
                              "w-[3px] rounded-full",
                              j.state === "Rendering" ? "bg-warn/70" : j.state === "Done" ? "bg-live/60" : "bg-line-strong",
                            )}
                            style={{ height: `${20 + ((i * 37) % 80)}%` }}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Badge tone={j.tone} dot={j.tone !== "neutral"} pulse={j.state === "Rendering"}>
                        {j.state}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {tab !== "voice" ? (
        <p className="mt-4 flex items-center gap-2 font-mono text-[11px] text-faint">
          <Film className="size-3.5" />
          Source rule: CC0 / public-domain footage only, matched per script line — never per vibe.
        </p>
      ) : null}
    </>
  );
}
