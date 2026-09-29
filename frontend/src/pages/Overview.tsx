import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowRight,
  Clapperboard,
  Eye,
  Image as ImageIcon,
  KeyRound,
  ListVideo,
  MousePointerClick,
  Play,
  Timer,
  Upload,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CronDial, FormatDonut, ViewsChart, WeekdayBars } from "../components/charts";
import {
  Badge,
  Button,
  Card,
  CardHead,
  Checklist,
  Poster,
  Progress,
  SectionHeader,
  StatCard,
  StatusBadge,
} from "../components/ui";
import {
  activity,
  episodes,
  formatSplit,
  kpis,
  views28d,
  type ActivityItem,
} from "../lib/data";
import { fmtCompact, fmtDay, fmtDur, fmtPKT, nextUrduRun, relTime } from "../lib/utils";

const activityIcon: Record<ActivityItem["kind"], React.ComponentType<{ className?: string }>> = {
  publish: Upload,
  render: Clapperboard,
  cron: Timer,
  thumb: ImageIcon,
  warn: AlertTriangle,
  auth: KeyRound,
};

const activityTone: Record<ActivityItem["kind"], string> = {
  publish: "text-live bg-live-soft",
  render: "text-info bg-info-soft",
  cron: "text-accent bg-accent-soft",
  thumb: "text-muted bg-surface",
  warn: "text-warn bg-warn-soft",
  auth: "text-muted bg-surface",
};

function nowInLane() {
  return episodes.find((e) => e.status === "rendering") ?? null;
}

export function Overview() {
  const next = nextUrduRun(new Date());
  const lane = nowInLane();
  const upcoming = episodes
    .filter((e) => e.status === "queued" || e.status === "rendering")
    .slice(0, 5);

  return (
    <>
      <SectionHeader
        eyebrow="Control room"
        title="The press is warm"
        desc="Two lanes, one queue of record. The Urdu lane renders and publishes itself every Monday and Thursday at 06:00 PKT."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="live" dot pulse>
              Lane armed
            </Badge>
            <Button variant="primary" icon={Play}>
              Render now
            </Button>
          </div>
        }
      />

      {/* Row 1 — dial · lane · KPIs */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHead eyebrow="Signature schedule" title="Cron dial" />
          <div className="px-5 pb-6 pt-4">
            <CronDial next={next} />
          </div>
        </Card>

        <Card className="flex flex-col lg:col-span-4">
          <CardHead
            eyebrow="In the lane now"
            title={lane ? lane.code : "Idle"}
            action={lane ? <Badge tone="warn" dot pulse>Rendering</Badge> : null}
          />
          {lane ? (
            <div className="flex flex-1 flex-col px-5 py-4">
              <h4 className="font-display text-[22px] leading-snug text-ink">{lane.title}</h4>
              {lane.titleUr ? (
                <p className="urdu mt-1 text-right text-[15px] text-muted" dir="rtl" lang="ur">
                  {lane.titleUr}
                </p>
              ) : null}
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-mono text-muted">{lane.stage}</span>
                  <span className="font-mono font-medium text-ink tabular">{lane.progress}%</span>
                </div>
                <Progress value={lane.progress ?? 0} tone="warn" />
              </div>
              {lane.checklist ? (
                <div className="mt-4">
                  <Checklist items={lane.checklist.slice(0, 3)} />
                </div>
              ) : null}
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="font-mono text-[11px] text-faint">
                  airs {fmtPKT(new Date(lane.scheduledFor ?? next.toISOString()))}
                </span>
                <Link to="/studio">
                  <Button size="sm" icon={ArrowRight}>
                    Studio
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:col-span-4">
          <StatCard label={kpis.subs.label} value={kpis.subs.value} delta={kpis.subs.delta} icon={Users} />
          <StatCard label={kpis.views.label} value={kpis.views.value} delta={kpis.views.delta} icon={Eye} />
          <StatCard label={kpis.watchHours.label} value={kpis.watchHours.value} delta={kpis.watchHours.delta} icon={Timer} />
          <StatCard label={kpis.ctr.label} value={kpis.ctr.value} suffix={kpis.ctr.suffix} delta={kpis.ctr.delta} icon={MousePointerClick} />
        </div>
      </div>

      {/* Row 2 — views · activity */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHead
            eyebrow="Ledger · last 28 days"
            title="Views"
            action={
              <span className="font-mono text-xs text-live">
                ▲ {fmtCompact(kpis.views.value)} total
              </span>
            }
          />
          <div className="px-3 py-4 pr-5">
            <ViewsChart data={views28d} />
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <CardHead eyebrow="Ticker" title="Recent activity" />
          <ul className="px-5 py-2">
            {activity.map((a) => {
              const Icon = activityIcon[a.kind];
              return (
                <li key={a.id} className="flex gap-3 border-b border-line py-3 last:border-0">
                  <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${activityTone[a.kind]}`}>
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-snug text-ink">{a.text}</p>
                    <p className="mt-0.5 truncate font-mono text-[10.5px] text-faint">
                      {a.meta} · {relTime(a.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Row 3 — queue preview · mix */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHead
            eyebrow="Queue of record"
            title="Up next"
            action={
              <Link to="/queue" className="flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-strong">
                Full queue <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <ul className="divide-y divide-line px-5">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center gap-4 py-3">
                <Link to="/queue" className="w-24 shrink-0">
                  <Poster
                    title={e.title}
                    hue={e.hue}
                    badge={e.format === "short" ? "Short · 9:16" : undefined}
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink">{e.title}</p>
                  <p className="mt-0.5 font-mono text-[10.5px] text-faint">
                    {e.code} · {e.format === "short" ? "Short 9:16" : `Episode · ${e.durationSec ? fmtDur(e.durationSec) : "—"}`}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-mono text-[11px] text-muted">
                    {e.scheduledFor ? fmtPKT(new Date(e.scheduledFor)) : "—"}
                  </p>
                  <p className="font-mono text-[10.5px] text-faint">
                    {e.scheduledFor ? fmtDay(new Date(e.scheduledFor)) : "unscheduled"}
                  </p>
                </div>
                <StatusBadge status={e.status} />
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid gap-4 lg:col-span-4">
          <Card>
            <CardHead eyebrow="Where views come from" title="Format mix" />
            <div className="px-5 pb-5 pt-2">
              <FormatDonut data={formatSplit} />
              <div className="mt-1 flex justify-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-accent" /> Shorts
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-line-strong" /> Episodes
                </span>
              </div>
            </div>
          </Card>
          <Card>
            <CardHead eyebrow="Publish rhythm" title="Uploads by weekday" />
            <div className="px-3 pb-4 pt-2">
              <WeekdayBars
                data={[
                  { day: "Mon", uploads: 3 }, { day: "Tue", uploads: 1 }, { day: "Wed", uploads: 0 },
                  { day: "Thu", uploads: 2 }, { day: "Fri", uploads: 0 }, { day: "Sat", uploads: 0 },
                  { day: "Sun", uploads: 0 },
                ]}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
