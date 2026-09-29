import { useState } from "react";
import { KeyRound, Plus, RefreshCw, ShieldCheck, Tv, CircleAlert } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHead,
  SectionHeader,
} from "../components/ui";
import { channels, credentials } from "../lib/data";
import { fmtCompact } from "../lib/utils";

const credState = {
  verified: { tone: "live" as const, label: "Verified" },
  pending: { tone: "warn" as const, label: "Pending" },
  missing: { tone: "danger" as const, label: "Missing" },
};

export function Channels() {
  return (
    <>
      <SectionHeader
        eyebrow="Network · both lanes live on the dev mail"
        title="Channels & tokens"
        desc="One automation client (“yt-automation”), one credential per lane. Upload rights are scoped tight; the analytics scope is the next grant."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {channels.map((c) => (
          <Card key={c.id} className="flex flex-col p-5">
            <div className="flex items-start gap-3">
              <Avatar name={c.name} hue={c.hue} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-display text-xl leading-tight text-ink">{c.name}</h3>
                <p className="truncate font-mono text-[11px] text-faint">{c.handle}</p>
              </div>
              <Badge tone={c.status === "live" ? "live" : "neutral"} dot pulse={c.status === "live"}>
                {c.status === "live" ? "Live" : "Paused"}
              </Badge>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">{c.kind}</p>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-line bg-raised p-3 text-center">
              <div>
                <div className="font-display text-xl text-ink tabular">{fmtCompact(c.stats.subs)}</div>
                <div className="eyebrow mt-0.5">Subs</div>
              </div>
              <div>
                <div className="font-display text-xl text-ink tabular">{fmtCompact(c.stats.views28d)}</div>
                <div className="eyebrow mt-0.5">28d views</div>
              </div>
              <div>
                <div className="font-display text-xl text-ink tabular">{c.stats.uploads}</div>
                <div className="eyebrow mt-0.5">Uploads</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-surface px-3.5 py-2.5 ring-1 ring-inset ring-line">
              <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                <KeyRound className="size-3.5 text-faint" />
                {c.token.label}
              </span>
              <Badge tone={credState[c.token.state].tone} dot>
                {credState[c.token.state].label}
              </Badge>
            </div>

            {c.note ? (
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-warn">
                <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
                {c.note}
              </p>
            ) : null}

            <div className="mt-auto flex gap-2 pt-4">
              <Button size="sm" icon={RefreshCw}>
                Rotate token
              </Button>
              <Button size="sm" variant="ghost">
                Open channel
              </Button>
            </div>
          </Card>
        ))}

        <button className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line-strong text-muted transition-colors hover:border-accent hover:bg-surface hover:text-accent">
          <Tv className="size-5" />
          <span className="mt-2 text-[13px] font-medium">Connect a channel</span>
          <span className="mt-0.5 max-w-[220px] text-xs text-faint">
            Mint an OAuth token against the new brand account, then the lane picks it up.
          </span>
        </button>
      </div>

      <Card className="mt-4">
        <CardHead
          eyebrow="Credentials"
          title="Automation tokens & scopes"
          action={
            <Button size="sm" icon={Plus}>
              Add credential
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-faint">
                <th className="px-5 py-3 font-mono font-medium">Credential</th>
                <th className="px-3 py-3 font-mono font-medium">Scope</th>
                <th className="px-3 py-3 font-mono font-medium">State</th>
                <th className="px-3 py-3 font-mono font-medium">Note</th>
                <th className="px-5 py-3 text-right font-mono font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {credentials.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-raised">
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2 font-medium text-ink">
                      {c.state === "verified" ? (
                        <ShieldCheck className="size-4 text-live" />
                      ) : (
                        <KeyRound className="size-4 text-faint" />
                      )}
                      {c.name}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 font-mono text-xs text-muted">{c.scope}</td>
                  <td className="px-3 py-3.5">
                    <Badge tone={credState[c.state].tone} dot>
                      {credState[c.state].label}
                    </Badge>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-muted">{c.hint}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Button size="sm" variant="ghost">
                      {c.state === "missing" ? "Add" : "Test"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
