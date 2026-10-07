import { HashRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import { AppLayout } from "./components/layout";
import { LockScreen } from "./pages/LockScreen";
import { Overview } from "./pages/Overview";
import { Queue } from "./pages/Queue";
import { Studio } from "./pages/Studio";
import { Media } from "./pages/Media";
import { Channels } from "./pages/Channels";
import { Automation } from "./pages/Automation";
import { Settings } from "./pages/Settings";
import { isUnlocked, setUnlocked } from "./lib/access";

// Analytics pulls in recharts (~half the bundle) — load it on first visit instead
// of shipping it in the entry chunk.
const Analytics = lazy(() =>
  import("./pages/Analytics").then((m) => ({ default: m.Analytics })),
);

function RouteFallback() {
  return <div className="min-h-[60vh] animate-pulse rounded-xl bg-surface" aria-busy="true" />;
}

export function App() {
  const [unlocked, setUnlockedState] = useState(isUnlocked);

  // While sealed, render nothing but the lock — no sidebar, no topbar, no content.
  if (!unlocked) {
    return (
      <LockScreen
        onUnlock={() => {
          setUnlocked();
          setUnlockedState(true);
        }}
      />
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="queue" element={<Queue />} />
          <Route path="studio" element={<Studio />} />
          <Route path="media" element={<Media />} />
          <Route path="channels" element={<Channels />} />
          <Route path="automation" element={<Automation />} />
          <Route path="analytics" element={<Suspense fallback={<RouteFallback />}><Analytics /></Suspense>} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Overview />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
