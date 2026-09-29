import { useState } from "react";
import { Moon, RefreshCw, Sun, Timer, TriangleAlert } from "lucide-react";
import { Badge, Button, Card, CardHead, Kbd, SectionHeader, Switch } from "../components/ui";
import { useTheme } from "../components/layout";
import { cn } from "../lib/utils";

function ThemeOption({
  value,
  label,
  icon: Icon,
  current,
  onPick,
}: {
  value: "light" | "dark";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  current: "light" | "dark";
  onPick: (v: "light" | "dark") => void;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onPick(value)}
      className={cn(
        "flex-1 cursor-pointer rounded-xl border p-3 text-left transition-colors",
        active ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong",
      )}
    >
      <div
        className={cn(
          "mb-3 flex h-16 items-end gap-1 rounded-lg p-2",
          value === "light" ? "bg-[#f2f0ea]" : "bg-[#101113]",
        )}
      >
        <span className={cn("h-2 w-8 rounded-full", value === "light" ? "bg-[#cec8b8]" : "bg-[#3d4046]")} />
        <span className="h-2 w-5 rounded-full bg-accent" />
        <span className={cn("h-2 w-6 rounded-full", value === "light" ? "bg-[#e4e0d5]" : "bg-[#282a2f]")} />
      </div>
      <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
        <Icon className="size-4 text-muted" />
        {label}
        {active ? <Badge tone="accent" className="ml-auto">Active</Badge> : null}
      </span>
    </button>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-line px-5 py-4 last:border-0">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Settings() {
  const { theme, toggle } = useTheme();
  const pickTheme = (v: "light" | "dark") => {
    if (v !== theme) toggle();
  };
  const [armed, setArmed] = useState(true);
  const [pushOnPublish, setPushOnPublish] = useState(true);
  const [pushOnFail, setPushOnFail] = useState(true);
  const [digest, setDigest] = useState(false);

  return (
    <>
      <SectionHeader
        eyebrow="Workspace"
        title="Settings"
        desc="How the control room looks, when it fires, and what reaches your phone."
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHead eyebrow="Appearance" title="Theme" />
          <div className="flex gap-3 px-5 py-5">
            <ThemeOption value="light" label="Ledger paper" icon={Sun} current={theme} onPick={pickTheme} />
            <ThemeOption value="dark" label="Lacquer ink" icon={Moon} current={theme} onPick={pickTheme} />
          </div>
          <p className="px-5 pb-5 text-xs text-muted">
            Follows your system on first visit, then sticks. The quick toggle in the top bar does the same —{" "}
            <Kbd>Sun</Kbd> / <Kbd>Moon</Kbd>.
          </p>
        </Card>

        <Card>
          <CardHead eyebrow="Schedule" title="Lane clock" action={<Timer className="size-4 text-faint" />} />
          <div className="px-5 py-4">
            <div className="rounded-xl border border-line bg-raised p-4">
              <div className="eyebrow">urdu-publish.yml</div>
              <p className="mt-1.5 font-mono text-lg text-ink">
                0 1 * * 1,4 <span className="text-faint">· Mon & Thu · 06:00 PKT</span>
              </p>
            </div>
          </div>
          <Row
            title="Lane armed"
            desc="When off, the cron still renders but upload stops at unlisted — a safe rehearsal mode."
          >
            <Switch checked={armed} onCheckedChange={setArmed} label="Arm the lane" />
          </Row>
          <Row title="Timezone of record" desc="All schedules and queue stamps are Asia/Karachi (UTC+5, no DST).">
            <Badge tone="info">PKT</Badge>
          </Row>
        </Card>

        <Card>
          <CardHead eyebrow="Notifications" title="Phone push" />
          <Row title="Push on publish" desc="Episode and Shorts links the moment they go public.">
            <Switch checked={pushOnPublish} onCheckedChange={setPushOnPublish} label="Push on publish" />
          </Row>
          <Row title="Push on failure" desc="Any red run in the automation lane pings the phone immediately.">
            <Switch checked={pushOnFail} onCheckedChange={setPushOnFail} label="Push on failure" />
          </Row>
          <Row title="Weekly digest" desc="One Monday-morning summary of views, subs and queue health.">
            <Switch checked={digest} onCheckedChange={setDigest} label="Weekly digest" />
          </Row>
        </Card>

        <Card className="border-danger/30">
          <CardHead
            eyebrow="Careful"
            title="Lane controls"
            action={<TriangleAlert className="size-4 text-danger" />}
          />
          <Row
            title="Rotate automation tokens"
            desc="Rolls the TECH and URDU OAuth tokens together. Lanes re-verify with an upload smoke test."
          >
            <Button size="sm" icon={RefreshCw}>
              Rotate
            </Button>
          </Row>
          <Row
            title="Reset queue state"
            desc="Rewinds state/urdu-queue.json marks for the next cron. Drafts are untouched."
          >
            <Button size="sm" variant="danger">
              Reset marks
            </Button>
          </Row>
        </Card>
      </div>
    </>
  );
}
