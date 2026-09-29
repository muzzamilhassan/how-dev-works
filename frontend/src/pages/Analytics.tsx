import { useState } from "react";
import { Eye, MousePointerClick, Timer, Users } from "lucide-react";
import { FormatDonut, RetentionChart, ViewsChart } from "../components/charts";
import {
  Badge,
  Card,
  CardHead,
  Progress,
  SectionHeader,
  StatCard,
  Tabs,
  TabItem,
} from "../components/ui";
import { formatSplit, geoSplit, kpis, retention, topContent, views28d } from "../lib/data";

export function Analytics() {
  const [range, setRange] = useState("28");

  return (
    <>
      <SectionHeader
        eyebrow="Analytics · demo data until the yt-analytics scope is granted"
        title="Analytics"
        desc="What the lane earns you: reach by format, where viewers stay, and which titles pull. Numbers go live the moment the scope lands in the token."
        action={
          <Tabs defaultValue="28" value={range} onChange={setRange}>
            <TabItem value="7">7d</TabItem>
            <TabItem value="28">28d</TabItem>
            <TabItem value="90">90d</TabItem>
          </Tabs>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label={kpis.subs.label} value={kpis.subs.value} delta={kpis.subs.delta} icon={Users} />
        <StatCard label={kpis.views.label} value={kpis.views.value} delta={kpis.views.delta} icon={Eye} />
        <StatCard label={kpis.watchHours.label} value={kpis.watchHours.value} delta={kpis.watchHours.delta} icon={Timer} />
        <StatCard label={kpis.ctr.label} value={kpis.ctr.value} suffix={kpis.ctr.suffix} delta={kpis.ctr.delta} icon={MousePointerClick} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHead eyebrow={`Ledger · last ${range} days`} title="Views" />
          <div className="px-3 py-4 pr-5">
            <ViewsChart data={range === "7" ? views28d.slice(-7) : views28d} height={300} />
          </div>
        </Card>
        <div className="grid content-start gap-4 lg:col-span-4">
          <Card>
            <CardHead eyebrow="Format pull" title="Views by format" />
            <div className="px-5 pb-5 pt-2">
              <FormatDonut data={formatSplit} />
              <p className="mt-2 text-center text-xs text-muted">
                Shorts bring the crowd; episodes keep the library compounding.
              </p>
            </div>
          </Card>
          <Card>
            <CardHead eyebrow="Audience" title="Top geographies" />
            <ul className="space-y-3 px-5 py-4">
              {geoSplit.map((g) => (
                <li key={g.country}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-ink">{g.country}</span>
                    <span className="font-mono text-muted tabular">{g.pct}%</span>
                  </div>
                  <Progress value={g.pct} tone={g.country === "Pakistan" ? "accent" : "info"} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHead eyebrow="UR-E01 · Salt episode" title="Audience retention" />
          <div className="px-3 py-4 pr-5">
            <RetentionChart data={retention} />
            <p className="px-2 pb-2 text-xs text-muted">
              49% still watching at the end — the payoff and loop are doing their job.
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-7">
          <CardHead eyebrow="Library" title="Top content" action={<Badge tone="accent">28d</Badge>} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-faint">
                  <th className="px-5 py-3 font-mono font-medium">Title</th>
                  <th className="px-3 py-3 font-mono font-medium">Views</th>
                  <th className="px-3 py-3 font-mono font-medium">CTR</th>
                  <th className="px-5 py-3 font-mono font-medium">Retention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {topContent.map((v) => (
                  <tr key={v.title} className="transition-colors hover:bg-raised">
                    <td className="max-w-[240px] px-5 py-3.5">
                      <p className="truncate text-[13px] font-medium text-ink">{v.title}</p>
                      <Badge tone={v.kind === "Short" ? "accent" : "neutral"} className="mt-1">
                        {v.kind}
                      </Badge>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-xs text-ink tabular">
                      {new Intl.NumberFormat("en").format(v.views)}
                    </td>
                    <td className="px-3 py-3.5 font-mono text-xs text-muted tabular">{v.ctr}%</td>
                    <td className="w-32 px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Progress value={v.ret} tone={v.ret >= 60 ? "live" : "warn"} />
                        <span className="font-mono text-[10.5px] text-faint tabular">{v.ret}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
