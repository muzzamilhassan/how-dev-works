import { Eye, EyeOff, LockKeyhole, Stamp } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button, Input } from "../components/ui";
import { checkPassword } from "../lib/access";

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!pw || busy) return;
    setBusy(true);
    const ok = await checkPassword(pw);
    if (ok) {
      onUnlock();
      return;
    }
    setError(true);
    setAttempts((n) => n + 1);
    setBusy(false);
    setPw("");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4">
      {/* ambient seal glow — the one flourish, then quiet */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 size-[480px] -translate-x-1/2 rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }}
        aria-hidden
      />
      <div key={attempts} className={`w-full max-w-sm ${attempts > 0 ? "animate-shake" : ""}`}>
        <div className="rounded-2xl border border-line bg-surface p-8 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-ink">
              <span className="flex size-14 items-center justify-center rounded-full ring-2 ring-inset ring-accent-ink/60">
                <Stamp className="size-6" />
              </span>
            </span>
            <div className="eyebrow mt-5">Sealed archive · restricted</div>
            <h1 className="mt-1.5 font-display text-[34px] leading-none text-ink">Scriptorium</h1>
            <p className="urdu mt-2 text-[15px] text-muted" dir="rtl" lang="ur">
              یہ خزانہ مہر بند ہے
            </p>
          </div>

          <form onSubmit={submit} className="mt-7">
            <label className="eyebrow mb-1.5 block" htmlFor="vault-password">
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <Input
                id="vault-password"
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value);
                  setError(false);
                }}
                placeholder="Enter the vault password"
                autoComplete="current-password"
                autoFocus
                className={`pl-9 pr-10 ${error ? "ring-danger focus:ring-danger" : ""}`}
                aria-invalid={error}
                aria-describedby={error ? "vault-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-faint transition-colors hover:text-ink"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {error ? (
              <p id="vault-error" role="alert" className="mt-2.5 text-[13px] font-medium text-danger">
                Wrong password. The seal holds.
              </p>
            ) : null}

            <Button type="submit" variant="primary" disabled={busy || !pw} className="mt-5 w-full">
              {busy ? "Checking the seal…" : "Unlock the console"}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
          Scriptorium v0.1 · The Sealed Histories ops
        </p>
      </div>
    </div>
  );
}
