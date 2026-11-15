import React from 'react';
import {
  ArrowRight,
  Check,
  Compass,
  Radio,
  Sparkles,
  SunMedium,
  Thermometer,
} from 'lucide-react';
import { useMission } from '../../context/MissionContext';
import { DESTINATION_IMAGES } from '../../data/seedData';
import { SolarSystemScene } from '../three/SolarSystemScene';
import { TooltipInfo } from '../common/TooltipInfo';

export const SolarSystemPage: React.FC = () => {
  const {
    destinations,
    selectedDestinationId,
    selectDestination,
    selectedDestination,
    missions,
    selectedMissionId,
    selectMission,
    setActivePage,
  } = useMission();

  const matchingMissions = missions.filter(
    (m) => m.destinationId === selectedDestination.id
  );
  const accent = selectedDestination.accentHex;
  const solarPct = Math.round(selectedDestination.solarEfficiencyFactor * 100);
  const commsBarPct = Math.min(100, Math.round((selectedDestination.requiredCommsTier / 110) * 100));

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-cyan-300">
            Sector 01 · Interactive Star Chart &amp; Planet Reconnaissance
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            3D Solar System Explorer
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Warp camera lock onto any planet or asteroid, inspect solar flux &amp; gravity, and launch an expedition.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActivePage('mission-selection')}
          className="glow-cta px-5 py-2.5 rounded-xl font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          Proceed to Mission Selection
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Top Interactive Sector Warp Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {destinations.map((body) => {
          const active = body.id === selectedDestinationId;
          return (
            <button
              key={body.id}
              type="button"
              onClick={() => selectDestination(body.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                active
                  ? 'bg-[#121a42] text-white -translate-y-0.5'
                  : 'bg-[#080d22]/95 border-slate-800 text-slate-300 hover:border-slate-600'
              }`}
              style={
                active
                  ? {
                      borderColor: body.accentHex,
                      boxShadow: `0 0 20px ${body.accentHex}38`,
                    }
                  : undefined
              }
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display font-bold text-sm">{body.name}</p>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: body.accentHex }}
                  aria-hidden="true"
                />
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                {body.distanceLabel}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Split: 3D Stage (left 8 cols) + Planetary Recon Scanner Dossier (right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 min-h-[520px] lg:min-h-[600px]">
          <SolarSystemScene
            selectedId={selectedDestinationId}
            onSelect={selectDestination}
            selectedName={selectedDestination.name}
            selectedDistance={selectedDestination.distanceLabel.split('(')[0].trim()}
            solarPercent={solarPct}
          />
        </div>

        <aside
          className="lg:col-span-4 hud-frame rounded-2xl overflow-hidden flex flex-col justify-between"
          style={{
            borderColor: `${accent}77`,
            boxShadow: `0 18px 46px -12px ${accent}33`,
          }}
        >
          <div>
            {/* Destination Artwork Header */}
            <div className="relative h-36 w-full overflow-hidden bg-slate-900">
              <img
                src={DESTINATION_IMAGES[selectedDestination.id]}
                alt={`${selectedDestination.name} planetary environment artwork`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080d22] via-[#080d22]/45 to-transparent" />
              <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between gap-2">
                <div>
                  <span
                    className="text-[11px] font-mono uppercase tracking-wider font-semibold"
                    style={{ color: accent }}
                  >
                    {selectedDestination.classification}
                  </span>
                  <h2 className="font-display text-2xl font-bold text-white leading-tight">
                    {selectedDestination.name}
                  </h2>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#050716]/90 border border-white/15 text-slate-200 whitespace-nowrap">
                  {selectedDestination.distanceLabel}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-200 leading-relaxed">
                {selectedDestination.summary}
              </p>

              {/* Visual Planetary Telemetry Meters */}
              <div className="space-y-2.5 pt-3 border-t border-slate-800/80 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-[#060a1b] border border-slate-800/80">
                    <p className="text-[11px] text-slate-400">Diameter &amp; Gravity</p>
                    <p className="font-mono tabular-nums text-xs font-semibold text-white mt-0.5">
                      {selectedDestination.diameterKm.toLocaleString()} km
                    </p>
                    <p className="font-mono text-[11px] text-cyan-300">
                      {selectedDestination.gravityLabel}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#060a1b] border border-slate-800/80">
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-fuchsia-300" aria-hidden="true" />
                      Temperature
                    </p>
                    <p className="font-mono tabular-nums text-xs font-semibold text-white mt-0.5">
                      {selectedDestination.temperatureRange}
                    </p>
                  </div>
                </div>

                {/* Solar Efficiency Meter Bar */}
                <div className="p-2.5 rounded-lg bg-[#060a1b] border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 flex items-center">
                      <SunMedium className="w-3.5 h-3.5 mr-1 text-amber-300" aria-hidden="true" />
                      Solar Panel Output
                      <TooltipInfo
                        term="Solar Output Factor"
                        explanation="Sunlight weakens with distance from the Sun. A 65% factor at Mars means solar panels generate 65% of their Earth baseline."
                      />
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-amber-300">
                      {solarPct}% of Earth
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all"
                      style={{ width: `${Math.min(100, solarPct)}%` }}
                    />
                  </div>
                </div>

                {selectedDestination.exploreTarget && (
                  <div className="p-2.5 rounded-lg bg-[#060a1b] border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                        Required Downlink Tier
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-cyan-300">
                        {selectedDestination.requiredCommsTier} Mbps eq.
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all"
                        style={{ width: `${commsBarPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Beginner Learning Callout */}
              <div
                className="p-3.5 rounded-xl bg-[#060a1b] border space-y-1"
                style={{ borderColor: `${accent}44` }}
              >
                <p
                  className="text-xs font-semibold flex items-center gap-1.5"
                  style={{ color: accent }}
                >
                  <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                  Explorer Science Fact
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedDestination.beginnerFact}
                </p>
              </div>

              {/* Interactive Destination Mission Contracts */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                  Available Expeditions ({matchingMissions.length})
                </h3>
                {matchingMissions.length > 0 ? (
                  <div className="space-y-1.5">
                    {matchingMissions.map((m) => {
                      const isArmed = m.id === selectedMissionId;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => selectMission(m.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isArmed
                              ? 'bg-cyan-500/15 border-cyan-400/60 text-white font-semibold'
                              : 'bg-[#060a1b] border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <span className="truncate">{m.name}</span>
                          <span className="font-mono text-[11px] text-cyan-300 shrink-0 flex items-center gap-1">
                            {isArmed ? (
                              <>
                                <Check className="w-3 h-3" aria-hidden="true" />
                                Active
                              </>
                            ) : (
                              m.difficulty
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <ul className="space-y-1 text-xs text-slate-300">
                    {selectedDestination.missionOpportunities.map((opp) => (
                      <li key={opp}>› {opp}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 pt-3 border-t border-slate-800/80">
            {selectedDestination.exploreTarget ? (
              <button
                type="button"
                onClick={() => setActivePage('mission-selection')}
                className="glow-cta w-full py-3 px-4 rounded-xl font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Exploration · {selectedDestination.name}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <p className="text-xs text-amber-300 leading-relaxed">
                The Sun is our solar energy calibration star. Select Earth, the Moon, Mars,
                Vesta, or Bennu to begin a mission.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
