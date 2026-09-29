import { useMemo, useState } from "react";
import { AudioLines, Captions, FlaskConical, Play, Send } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHead,
  Select,
  StatusBadge,
  Textarea,
} from "../components/ui";
import { episodes } from "../lib/data";
import { cn } from "../lib/utils";

interface Block {
  id: string;
  label: string;
  hint: string;
  target: number;
  text: string;
}

const SEED_BLOCKS: Block[] = [
  {
    id: "cold-open",
    label: "Cold open",
    hint: "No greeting. Drop the viewer into the strangest true fact you have.",
    target: 60,
    text: "In 450 BC, a soldier's pay arrived in blocks of white rock. He could eat it, trade it, or be executed for stealing it. This is the story of salt — the mineral that built empires and buried kings.",
  },
  {
    id: "question",
    label: "The question",
    hint: "One question the rest of the episode must answer. Say it once, mean it.",
    target: 45,
    text: "How did something that costs one rupee today once bought entire cities? And why did the greatest empires in history tremble the moment they taxed it?",
  },
  {
    id: "ch1",
    label: "Chapter I — The taste of power",
    hint: "Evidence first. One idea per chapter, one re-hook at the end.",
    target: 420,
    text: "Every empire learned the same lesson twice. Control salt, and you control the table of every citizen who boils, pickles, or preserves. Rome built roads for it. China drilled wells a kilometre deep for it...",
  },
  {
    id: "ch2",
    label: "Chapter II — Wars in white",
    hint: "Escalate. Wars, taxes, smugglers — make the stakes human.",
    target: 420,
    text: "When the British Raj taxed salt, a skinny man in a white shawl walked 385 kilometres to the sea and picked up a handful of mud. Within weeks, sixty thousand people were in jail...",
  },
  {
    id: "payoff",
    label: "Payoff",
    hint: "Answer the opening question completely. No dangling threads before the loop.",
    target: 160,
    text: "So salt built empires because whoever held it held time itself — meat, fish, and harvests could now outlive their seasons. And it buried them because a tax on the one thing everyone must buy is a tax on life...",
  },
  {
    id: "loop",
    label: "Loop",
    hint: "Bend the ending back to the first line so the replay feels inevitable.",
    target: 40,
    text: "Which is why, the next time a soldier asks what he is worth, the answer — then as now — is written in salt.",
  },
];

const VOICES = [
  { value: "ur-PK-ustad", label: "Ustad · warm baritone (ur-PK)" },
  { value: "ur-PK-kiran", label: "Kiran · clear storyteller (ur-PK)" },
  { value: "ur-IN-bilal", label: "Bilal · news anchor (ur-IN)" },
];

function words(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

/** Split caption text into chunks of ≤72 chars at word boundaries — the renderer's rule. */
function captionChunks(text: string, max = 72) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(/\s+/)) {
    if ((line + " " + w).trim().length > max) {
      if (line) out.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) out.push(line);
  return out;
}

export function Studio() {
  const [epId, setEpId] = useState("silk-ep3");
  const [blocks, setBlocks] = useState<Block[]>(SEED_BLOCKS);
  const [voice, setVoice] = useState(VOICES[0].value);
  const [rate, setRate] = useState(0);
  const ep = episodes.find((e) => e.id === epId) ?? episodes[0];

  const totalWords = useMemo(() => blocks.reduce((n, b) => n + words(b.text), 0), [blocks]);
  const estSec = Math.round(totalWords / 2.5); // ~150 wpm narration

  const setBlock = (id: string, text: string) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, text } : b)));

  return (
    <>
      <div className="mb-5">
        <div className="eyebrow mb-1.5">Script studio · retention-first drafts</div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[32px] leading-tight text-ink">{ep.title}</h1>
            {ep.titleUr ? (
              <p className="urdu mt-1 text-right text-[15px] text-muted" dir="rtl" lang="ur">
                {ep.titleUr}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={ep.status} />
            <Badge>{new Intl.NumberFormat("en").format(totalWords)} words</Badge>
            <Badge tone="info">≈ {Math.floor(estSec / 60)}:{String(estSec % 60).padStart(2, "0")} voiced</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Episode rail */}
        <div className="space-y-2 lg:col-span-3">
          <div className="eyebrow mb-1 px-1">Lane scripts</div>
          {episodes
            .filter((e) => e.format === "episode")
            .map((e) => (
              <button
                key={e.id}
                onClick={() => setEpId(e.id)}
                className={cn(
                  "w-full cursor-pointer rounded-xl border p-3 text-left transition-colors",
                  e.id === epId
                    ? "border-accent/40 bg-accent-soft"
                    : "border-line bg-surface hover:border-line-strong",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10.5px] text-faint">{e.code}</span>
                  <StatusBadge status={e.status} />
                </div>
                <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-ink">
                  {e.title}
                </p>
              </button>
            ))}
        </div>

        {/* Editor */}
        <div className="space-y-4 lg:col-span-6">
          {blocks.map((b) => {
            const w = words(b.text);
            const under = w < b.target * 0.85;
            return (
              <Card key={b.id} className="p-5">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg text-ink">{b.label}</h3>
                  <span
                    className={cn(
                      "font-mono text-[10.5px] tabular",
                      under ? "text-warn" : "text-live",
                    )}
                  >
                    {w}/{b.target}w
                  </span>
                </div>
                <p className="mb-3 text-xs text-muted">{b.hint}</p>
                <Textarea
                  rows={b.id === "ch1" || b.id === "ch2" ? 5 : 3}
                  value={b.text}
                  onChange={(e) => setBlock(b.id, e.target.value)}
                />
              </Card>
            );
          })}
        </div>

        {/* Voice + captions rail */}
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHead eyebrow="tts.py" title="Voice" action={<AudioLines className="size-4 text-faint" />} />
            <div className="space-y-4 px-5 py-4">
              <label className="block">
                <span className="eyebrow mb-1.5 block">Narrator</span>
                <Select value={voice} onChange={(e) => setVoice(e.target.value)}>
                  {VOICES.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block">
                <span className="eyebrow mb-1.5 flex justify-between">
                  <span>Rate</span>
                  <span className="font-mono text-muted">
                    {rate > 0 ? `+${rate}` : rate}%{" "}
                    <span className="text-faint">(TTS_RATE)</span>
                  </span>
                </span>
                <input
                  type="range"
                  min={-20}
                  max={20}
                  step={5}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </label>
              <Button icon={Play} className="w-full">
                Audition 10s
              </Button>
              <p className="font-mono text-[10.5px] leading-relaxed text-faint">
                22 chunks · loudness −14 LUFS · silence padded 350ms
              </p>
            </div>
          </Card>

          <Card>
            <CardHead
              eyebrow="Sequential chunks · ≤72 chars"
              title="Captions"
              action={<Captions className="size-4 text-faint" />}
            />
            <div className="max-h-56 space-y-1.5 overflow-y-auto px-5 py-4">
              {captionChunks(blocks[0].text).map((c, i) => (
                <p key={i} className="rounded-md bg-raised px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-muted ring-1 ring-inset ring-line">
                  <span className="mr-2 text-faint tabular">{String(2 + i * 3).padStart(2, "0")}s</span>
                  {c}
                </p>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-2.5">
              <FlaskConical className="mt-0.5 size-4 shrink-0 text-accent" />
              <p className="text-xs leading-relaxed text-muted">
                Renders run on Actions only. <span className="font-mono text-[11px]">urdu-publish.yml</span>{" "}
                picks the next queued episode — the studio just writes into it.
              </p>
            </div>
            <Button variant="primary" icon={Send} className="mt-4 w-full">
              Queue render
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
