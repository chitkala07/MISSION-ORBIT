import React from 'react';
import { X } from 'lucide-react';
import { MissionProvider, useMission } from './context/MissionContext';
import { Navbar } from './components/common/Navbar';
import { HeadquartersPage } from './components/pages/HeadquartersPage';
import { SolarSystemPage } from './components/pages/SolarSystemPage';
import { MissionSelectionPage } from './components/pages/MissionSelectionPage';
import { SpacecraftLabPage } from './components/pages/SpacecraftLabPage';
import { RocketOrbitPage } from './components/pages/RocketOrbitPage';
import { MissionControlPage } from './components/pages/MissionControlPage';
import { ResultsReportPage } from './components/pages/ResultsReportPage';
import { ArchitectureDocsPage } from './components/pages/ArchitectureDocsPage';

const AppShell: React.FC = () => {
  const { activePage, setActivePage, toastMessage, clearToast } = useMission();

  return (
    <div className="min-h-screen flex flex-col cosmic-backdrop text-slate-100">
      <Navbar />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-xl bg-[#101836] border border-cyan-400/50 shadow-[0_0_24px_rgba(34,211,238,0.22)] flex items-start justify-between gap-3 text-xs sm:text-sm text-slate-100 badge-pop"
        >
          <span>{toastMessage.text}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={clearToast}
            className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <main className="flex-1">
        {activePage === 'headquarters' && <HeadquartersPage />}
        {activePage === 'solar-system' && <SolarSystemPage />}
        {activePage === 'mission-selection' && <MissionSelectionPage />}
        {activePage === 'spacecraft-lab' && <SpacecraftLabPage />}
        {activePage === 'rocket-orbit' && <RocketOrbitPage />}
        {activePage === 'mission-control' && <MissionControlPage />}
        {activePage === 'results' && <ResultsReportPage />}
        {activePage === 'architecture' && <ArchitectureDocsPage />}
      </main>

      <footer className="border-t border-violet-500/25 bg-[#070A1D] py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>MISSION: ORBIT · Educational 3D Space Exploration &amp; Mission Design</span>
          <div className="flex items-center gap-4">
            <span>Simplified educational metrics</span>
            <button
              type="button"
              onClick={() => setActivePage('architecture')}
              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4 cursor-pointer"
            >
              Backend Docs &amp; Crew Profile
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <MissionProvider>
      <AppShell />
    </MissionProvider>
  );
}
