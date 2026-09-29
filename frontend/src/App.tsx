import { HashRouter, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { AppLayout } from "./components/layout";
import { LockScreen } from "./pages/LockScreen";
import { Overview } from "./pages/Overview";
import { Queue } from "./pages/Queue";
import { Studio } from "./pages/Studio";
import { Media } from "./pages/Media";
import { Channels } from "./pages/Channels";
import { Automation } from "./pages/Automation";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";
import { isUnlocked, setUnlocked } from "./lib/access";

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
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Overview />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
