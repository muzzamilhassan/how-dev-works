import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ListVideo,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Checklist,
  EmptyState,
  Input,
  Modal,
  Poster,
  Progress,
  SectionHeader,
  StatusBadge,
  Tabs,
  TabItem,
} from "../components/ui";
import { episodes, type Episode, type EpisodeStatus } from "../lib/data";
import { fmtDay, fmtDur, fmtPKT, relTime } from "../lib/utils";

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "rendering", label: "Rendering" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
];

function matchFilter(e: Episode, filter: string) {
  if (filter === "all") return true;
  if (filter === "draft") return e.status === "draft" || e.status === "unlisted";
  return e.status === (filter as EpisodeStatus);
}

function scheduleCell(e: Episode) {
  if (e.publishedAt && e.status === "published")
    return { main: relTime(e.publishedAt), sub: "went out" };
  if (e.scheduledFor) {
    const d = new Date(e.scheduledFor);
    return { main: fmtPKT(d), sub: fmtDay(d) };
  }
  return { main: "—", sub: "unscheduled" };
}

export function Queue() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Episode | null>(null);

  const rows = useMemo(
    () =>
      episodes.filter(
        (e) =>
          matchFilter(e, filter) &&
          (query.trim() === "" ||
            `${e.title} ${e.titleUr ?? ""} ${e.code}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [filter, query],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: episodes.length };
    for (const e of episodes) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, []);

  return (
    <>
      <SectionHeader
        eyebrow="Queue of record · mirrors state/urdu-queue.json"
        title="Publishing queue"
        desc="The Monday/Thursday cron picks the next queued episode in order. Drafts stay out of the lane until their script passes the retention pass."
        action={
          <Button variant="primary" icon={Plus}>
            New episode
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs defaultValue="all" onChange={setFilter} className="flex-wrap">
          {FILTERS.map((f) => (
            <TabItem key={f.value} value={f.value}>
              {f.label}
              <span className="ml-1.5 font-mono text-[10px] text-faint">{counts[f.value] ?? 0}</span>
            </TabItem>
          ))}
        </Tabs>
        <label className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            placeholder="Filter by title or code…"
            className="pl-9"
          />
        </label>
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            icon={ListVideo}
            title="Nothing matches"
            desc="No episode in the queue matches that filter. Clear the search or switch tabs to see the full ledger."
            action={
              <Button
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-faint">
                  <th className="px-5 py-3 font-mono font-medium">Episode</th>
                  <th className="px-3 py-3 font-mono font-medium">Format</th>
                  <th className="px-3 py-3 font-mono font-medium">Status</th>
                  <th className="px-3 py-3 font-mono font-medium">Airs / aired</th>
                  <th className="px-3 py-3 font-mono font-medium">Length</th>
                  <th className="px-5 py-3 text-right font-mono font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((e) => {
                  const sched = scheduleCell(e);
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className="cursor-pointer transition-colors hover:bg-raised"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-20 shrink-0">
                            <Poster
                              title={e.title}
                              hue={e.hue}
                              badge={e.format === "short" ? "Short · 9:16" : undefined}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{e.title}</p>
                            {e.titleUr ? (
                              <p className="urdu truncate text-right text-[13px] text-muted" dir="rtl" lang="ur">
                                {e.titleUr}
                              </p>
                            ) : null}
                            <p className="mt-0.5 font-mono text-[10.5px] text-faint">{e.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={e.format === "short" ? "accent" : "neutral"}>
                          {e.format === "short" ? "Short · 9:16" : "Episode · 16:9"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-mono text-xs text-ink tabular">{sched.main}</p>
                        <p className="font-mono text-[10.5px] text-faint">{sched.sub}</p>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-muted tabular">
                        {e.durationSec ? fmtDur(e.durationSec) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {e.videoId ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={ArrowUpRight}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                window.open(`https://youtu.be/${e.videoId}`, "_blank", "noopener");
                              }}
                              aria-label="Open on YouTube"
                            />
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={Pencil}
                              onClick={(ev) => ev.stopPropagation()}
                              aria-label="Edit script"
                            />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={MoreHorizontal}
                            onClick={(ev) => ev.stopPropagation()}
                            aria-label="More"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <EpisodeSheet episode={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function EpisodeSheet({ episode, onClose }: { episode: Episode | null; onClose: () => void }) {
  if (!episode) return null;
  const sched = scheduleCell(episode);
  return (
    <Modal open onClose={onClose} wide title={episode.code}>
      <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
        <div>
          <Poster title={episode.title} hue={episode.hue} tall={episode.format === "short"} />
          {episode.videoId ? (
            <p className="mt-3 rounded-lg bg-raised px-2.5 py-2 font-mono text-[11px] text-muted ring-1 ring-inset ring-line">
              youtu.be/{episode.videoId}
            </p>
          ) : null}
        </div>
        <div>
          <h3 className="font-display text-[26px] leading-tight text-ink">{episode.title}</h3>
          {episode.titleUr ? (
            <p className="urdu mt-2 text-right text-[17px] text-muted" dir="rtl" lang="ur">
              {episode.titleUr}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge status={episode.status} />
            <Badge tone={episode.format === "short" ? "accent" : "neutral"}>
              {episode.format === "short" ? "Short · 9:16" : "Episode · 16:9"}
            </Badge>
            <Badge>{episode.durationSec ? fmtDur(episode.durationSec) : "duration TBD"}</Badge>
            {episode.words ? <Badge>{new Intl.NumberFormat("en").format(episode.words)} words</Badge> : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-line bg-raised p-4">
            <div>
              <div className="eyebrow">{sched.sub === "went out" ? "Published" : "Scheduled"}</div>
              <p className="mt-1 font-mono text-[13px] text-ink tabular">
                {sched.main !== "—" ? sched.main : "not yet"}
              </p>
            </div>
            <div>
              <div className="eyebrow">Lane</div>
              <p className="mt-1 font-mono text-[13px] text-ink">urdu-publish.yml</p>
            </div>
          </div>

          {episode.progress !== undefined ? (
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-mono text-muted">{episode.stage}</span>
                <span className="font-mono font-medium text-ink tabular">{episode.progress}%</span>
              </div>
              <Progress value={episode.progress} tone="warn" />
            </div>
          ) : null}

          {episode.checklist ? (
            <div className="mt-5">
              <div className="eyebrow mb-2.5">Pipeline checklist</div>
              <Checklist items={episode.checklist} />
            </div>
          ) : null}

          {episode.notes ? (
            <p className="mt-5 rounded-xl bg-accent-soft px-4 py-3 text-[13px] leading-relaxed text-ink">
              {episode.notes}
            </p>
          ) : null}

          <div className="mt-6 flex gap-2">
            {episode.videoId ? (
              <Button
                variant="primary"
                icon={ArrowUpRight}
                onClick={() => window.open(`https://youtu.be/${episode.videoId}`, "_blank", "noopener")}
              >
                Open on YouTube
              </Button>
            ) : (
              <Button variant="primary" icon={Pencil}>
                Edit script
              </Button>
            )}
            <Button>Re-render</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
