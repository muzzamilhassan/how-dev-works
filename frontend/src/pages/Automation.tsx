import { useMemo, useState } from "react";
import { CalendarClock, GitBranch, ScrollText, Workflow as WorkflowIcon } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHead,
  RunBadge,
  SectionHeader,
  Tabs,
  TabItem,
} from "../components/ui";
import { runLog, runs, workflows } from "../lib/data";
import { cn, fmtDur, relTime } from "../lib/utils";

const logTone = {
  ok: "text-live",
  info: "text-ink",
  warn: "text-warn",
  err: "text-danger",
  dim: "text-faint",
} as const;

export function Automation() {
  const [wfId, setWfId] = useState("urdu-publish");
  const [view, setView] = useState("logs");
  const wf = workflows.find((w) => w.id === wfId)!;

  const wfRuns = useMemo(() => runs.filter((r) => r.workflowId === wfId), [wfId]);
  const latest = wfRuns[0] ?? runs[0];

  return (
    <>
      <SectionHeader
        eyebrow="Automation · GitHub Actions only, no local execution"
        title="Automation runs"
        desc="Crons and dispatch workflows that carry episodes from script to published. The Urdu lane fires on schedule; everything else runs on demand."
        action={
          <Button variant="primary" icon={WorkflowIcon}>
            Run workflow
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Workflow list */}
        <div className="space-y-2 lg:col-span-4">
          {workflows.map((w) => {
            const active = w.id === wfId;
            const lastRun = runs.find((r) => r.workflowId === w.id);
            return (
              <button
                key={w.id}
                onClick={() => setWfId(w.id)}
                className={cn(
                  "w-full cursor-pointer rounded-xl border p-4 text-left transition-colors",
                  active ? "border-accent/40 bg-accent-soft" : "border-line bg-surface hover:border-line-strong",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-semibold text-ink">{w.name}</span>
                  {lastRun ? <RunBadge status={lastRun.status} /> : null}
                </div>
                <p className="mt-1.5 font-mono text-[11px] text-muted">{w.file}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone={active ? "accent" : "neutral"}>
                    <CalendarClock className="size-3" />
                    {w.schedule}
                  </Badge>
                  <Badge>{w.lane}</Badge>
                </div>
                <p className="mt-2 font-mono text-[10.5px] text-faint">cron: {w.cron}</p>
              </button>
            );
          })}
        </div>

        {/* Runs + logs */}
        <div className="space-y-4 lg:col-span-8">
          <Card>
            <CardHead
              eyebrow={`${wf.file} · ${wf.schedule}`}
              title="Run history"
              action={<Badge tone="info">{wfRuns.length} runs on record</Badge>}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wider text-faint">
                    <th className="px-5 py-3 font-mono font-medium">Run</th>
                    <th className="px-3 py-3 font-mono font-medium">Trigger</th>
                    <th className="px-3 py-3 font-mono font-medium">Started</th>
                    <th className="px-3 py-3 font-mono font-medium">Duration</th>
                    <th className="px-5 py-3 text-right font-mono font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {wfRuns.map((r) => (
                    <tr
                      key={r.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-raised",
                        r.id === latest.id && "bg-raised",
                      )}
                    >
                      <td className="px-5 py-3 font-mono text-xs font-medium text-accent tabular">#{r.id}</td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1.5 text-xs text-muted">
                          {r.trigger === "schedule" ? (
                            <CalendarClock className="size-3.5" />
                          ) : (
                            <GitBranch className="size-3.5" />
                          )}
                          {r.trigger === "workflow_dispatch" ? "manual" : r.trigger}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-muted">{relTime(r.startedAt)}</td>
                      <td className="px-3 py-3 font-mono text-xs text-muted tabular">
                        {r.durationSec ? fmtDur(r.durationSec) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <RunBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHead
              eyebrow={`Run #${latest.id} · ${latest.status === "failed" ? "exit 1" : "exit 0"}`}
              title={
                <span className="flex items-center gap-2 font-mono text-base">
                  <ScrollText className="size-4 text-faint" />
                  {wf.file}
                </span>
              }
              action={
                <Tabs defaultValue="logs" value={view} onChange={setView}>
                  <TabItem value="summary">Summary</TabItem>
                  <TabItem value="logs">Logs</TabItem>
                </Tabs>
              }
            />
            {view === "logs" ? (
              <div className="max-h-[380px] overflow-y-auto bg-raised px-5 py-4">
                {runLog.map((l, i) => (
                  <p key={i} className="flex gap-3 py-0.5 font-mono text-[11.5px] leading-relaxed">
                    <span className="shrink-0 text-faint">{l.t}</span>
                    <span className={cn("min-w-0", logTone[l.kind])}>{l.line}</span>
                  </p>
                ))}
                <p className="mt-2 flex gap-3 font-mono text-[11.5px] text-faint">
                  <span className="shrink-0">00:24:52</span>
                  <span>job succeeded — lane cleared, next cron picks next queued episode</span>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-4">
                {[
                  { k: "Episode", v: "UR-E01 · Salt" },
                  { k: "Renders", v: "16:9 + 9:16" },
                  { k: "Uploads", v: "ep + 2 shorts" },
                  { k: "Push", v: "2 links sent" },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl border border-line bg-raised p-3.5">
                    <div className="eyebrow">{s.k}</div>
                    <div className="mt-1.5 font-mono text-xs text-ink">{s.v}</div>
                  </div>
                ))}
                <p className="col-span-2 text-xs leading-relaxed text-muted sm:col-span-4">
                  A clean run takes ~25 minutes end to end: TTS voiceover, clip matching, 16:9 master,
                  DocShort 9:16, thumbnail factory, public upload, queue marked done, phone push fired.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
