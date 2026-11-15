import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useMission } from '../../context/MissionContext';
import type { PageRoute } from '../../types/mission';

const NAV_ITEMS: { id: PageRoute; label: string }[] = [
  { id: 'headquarters', label: 'Headquarters' },
  { id: 'solar-system', label: 'Solar System' },
  { id: 'mission-selection', label: 'Missions' },
  { id: 'spacecraft-lab', label: 'Spacecraft Lab' },
  { id: 'rocket-orbit', label: 'Launch & Orbit' },
  { id: 'results', label: 'Reports' },
];

export const Navbar: React.FC = () => {
  const { activePage, setActivePage } = useMission();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (page: PageRoute) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070A1D] border-b border-violet-500/30 shadow-[0_4px_24px_rgba(6,8,28,0.85)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark with Orbital Emblem */}
        <button
          type="button"
          onClick={() => navigate('headquarters')}
          className="flex items-center gap-2.5 font-display text-lg font-bold tracking-wider whitespace-nowrap shrink-0 text-white hover:brightness-110 transition-all cursor-pointer"
        >
          <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0" aria-hidden="true">
            <circle cx="14" cy="14" r="5" fill="#22D3EE" />
            <ellipse
              cx="14"
              cy="14"
              rx="12"
              ry="4.8"
              transform="rotate(-24 14 14)"
              fill="none"
              stroke="#A855F7"
              strokeWidth="1.8"
            />
            <circle cx="24" cy="10" r="2.2" fill="#FACC15" />
          </svg>
          <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300 bg-clip-text text-transparent">
            MISSION: ORBIT
          </span>
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer border-b-2 ${
                  active
                    ? 'text-cyan-300 border-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.55)]'
                    : 'text-slate-300 border-transparent hover:text-white hover:border-violet-400/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('mission-control')}
            className={`px-4 py-2 text-xs sm:text-sm font-display font-bold uppercase tracking-wider rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
              activePage === 'mission-control'
                ? 'glow-cta ring-2 ring-white/40'
                : 'glow-cta'
            }`}
          >
            Mission Control
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-violet-500/40 bg-[#0d1330] text-slate-200 hover:text-white hover:border-cyan-400"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden border-t border-violet-500/30 bg-[#090E26] px-4 py-3 grid grid-cols-2 gap-2"
        >
          {[...NAV_ITEMS, { id: 'architecture' as PageRoute, label: 'Backend Docs' }].map(
            (item) => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  {item.label}
                </button>
              );
            }
          )}
        </nav>
      )}
    </header>
  );
};
