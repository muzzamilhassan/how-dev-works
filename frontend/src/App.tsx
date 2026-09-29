import { HashRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout";
import { Overview } from "./pages/Overview";
import { Queue } from "./pages/Queue";
import { Studio } from "./pages/Studio";
import { Media } from "./pages/Media";
import { Channels } from "./pages/Channels";
import { Automation } from "./pages/Automation";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";

export function App() {
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
