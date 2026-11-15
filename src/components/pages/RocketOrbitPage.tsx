import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Orbit,
  Rocket,
  ShieldCheck,
  Sun,
  XCircle,
} from 'lucide-react';
import { useMission } from '../../context/MissionContext';
import { soundFx } from '../../utils/soundFx';
import { TooltipInfo } from '../common/TooltipInfo';

const ROCKET_ACCENTS: Record<string, string> = {
  'rocket-scout': '#22D3EE',
  'rocket-astra': '#A855F7',
  'rocket-helios': '#FB923C',
  'rocket-titan': '#EC4899',
};

const renderRocketSvg = (rocketId: string, accent: string, large = false) => (
  <svg
    viewBox="0 0 64 96"
    className={large ? 'w-28 h-40 shrink-0' : 'w-11 h-14 shrink-0'}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id={`hull-${rocketId}-${large ? 'lg' : 'sm'}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="55%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>

    {/* Pad base */}
    {large && (
      <g>
        <rect x="10" y="84" width="44" height="4" rx="1.5" fill="#1E293B" stroke="#38BDF8" strokeWidth="0.8" />
        <line x1="15" y1="22" x2="15" y2="84" stroke="#334155" strokeWidth="2.2" />
        <line x1="15" y1="30" x2="25" y2="30" stroke={accent} strokeWidth="1.4" strokeDasharray="2 1" />
        <line x1="15" y1="52" x2="25" y2="52" stroke="#64748B" strokeWidth="1.2" />
      </g>
    )}

    {/* Side boosters for Helios & Titan */}
    {(rocketId === 'rocket-helios' || rocketId === 'rocket-titan') && (
      <g>
        <rect x="19" y="42" width="6" height="33" rx="2" fill="#CBD5E1" stroke={accent} strokeWidth="1" />
        <polygon points="19,42 22,35 25,42" fill={accent} />
        <rect x="39" y="42" width="6" height="33" rx="2" fill="#CBD5E1" stroke={accent} strokeWidth="1" />
        <polygon points="39,42 42,35 45,42" fill={accent} />
        <polygon points="20,76 24,76 22,84" fill="#FACC15" opacity="0.9" />
        <polygon points="40,76 44,76 42,84" fill="#FACC15" opacity="0.9" />
      </g>
    )}

    {/* Main fairing + stage */}
    <path
      d="M32 10 C38 17 40 24 40 31 H24 C24 24 26 17 32 10 Z"
      fill={`${accent}38`}
      stroke={accent}
      strokeWidth="1.8"
    />
    {/* Spacecraft payload silhouette inside fairing */}
    {large && (
      <g>
        <rect x="29" y="19" width="6" height="8" rx="1" fill="#38BDF8" opacity="0.85" />
        <line x1="25" y1="23" x2="39" y2="23" stroke="#FACC15" strokeWidth="1.4" />
      </g>
    )}

    {/* Core tank */}
    <rect
      x="25"
      y="31"
      width="14"
      height="45"
      rx="1.5"
      fill={`url(#hull-${rocketId}-${large ? 'lg' : 'sm'})`}
      stroke={accent}
      strokeWidth="1.4"
    />
    {/* Fuel stripe & mission chevron */}
    <rect x="25" y="46" width="14" height="5" fill={accent} opacity="0.85" />
    {rocketId === 'rocket-titan' && (
      <rect x="27" y="55" width="10" height="14" rx="1" fill="#0F172A" opacity="0.55" />
    )}

    {/* Aero fins */}
    <polygon points="25,67 18,77 25,77" fill={accent} />
    <polygon points="39,67 46,77 39,77" fill={accent} />

    {/* Main plume */}
    <polygon points="28,77 36,77 32,89" fill="#FACC15" />
    <polygon points="30,77 34,77 32,84" fill="#FFFFFF" />
  </svg>
);

const renderOrbitCorridorSvg = (opts: {
  planetHex: string;
  planetName: string;
  orbitName: string;
  sunlitRatio: number;
  orbitId: string;
  large?: boolean;
}) => {
  const { planetHex, sunlitRatio, orbitId, large = false } = opts;
  const tilt = orbitId.includes('polar')
    ? -68
    : orbitId.includes('gto') || orbitId.includes('elliptical')
    ? -24
    : -12;
  const rx = orbitId.includes('gto') || orbitId.includes('elliptical') ? 96 : 80;
  const ry = orbitId.includes('polar') ? 38 : 34;

  if (!large) {
    return (
      <svg viewBox="0 0 64 40" className="w-16 h-10 shrink-0" aria-hidden="true">
        <ellipse
          cx="32"
          cy="20"
          rx="26"
          ry="12"
          fill="none"
          stroke={planetHex}
          strokeWidth="1.8"
          strokeDasharray="4 3"
          transform={`rotate(${tilt} 32 20)`}
        />
        <circle cx="32" cy="20" r="7.5" fill="#1E293B" stroke={planetHex} strokeWidth="1.4" />
        <path
          d="M32 12.5 A7.5 7.5 0 0 1 32 27.5 Z"
          fill={sunlitRatio > 0.85 ? '#38BDF8' : planetHex}
          opacity="0.72"
        />
        <circle cx="53" cy="15" r="2.6" fill="#FACC15" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 260 150" className="w-full h-40" aria-hidden="true">
      {/* Subtle star coordinates */}
      <circle cx="24" cy="24" r="1" fill="#94A3B8" opacity="0.6" />
      <circle cx="232" cy="30" r="1.2" fill="#67E8F9" opacity="0.7" />
      <circle cx="212" cy="126" r="1" fill="#FACC15" opacity="0.55" />
      <circle cx="44" cy="122" r="1.1" fill="#C084FC" opacity="0.6" />

      {/* Sun ray vector */}
      <g opacity="0.75">
        <circle cx="22" cy="75" r="9" fill="#FACC15" />
        <line x1="35" y1="62" x2="72" y2="66" stroke="#FACC15" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="35" y1="75" x2="78" y2="75" stroke="#FACC15" strokeWidth="1.2" strokeDasharray="3 3" />
        <line x1="35" y1="88" x2="72" y2="84" stroke="#FACC15" strokeWidth="1" strokeDasharray="3 3" />
      </g>

      {/* Outer atmospheric glow */}
      <circle cx="135" cy="75" r="34" fill={`${planetHex}1E`} />

      {/* Target Orbital Corridor */}
      <ellipse
        cx="135"
        cy="75"
        rx={rx}
        ry={ry}
        fill="none"
        stroke="#22D3EE"
        strokeWidth="2"
        strokeDasharray="6 4"
        transform={`rotate(${tilt} 135 75)`}
      />
      <ellipse
        cx="135"
        cy="75"
        rx={rx - 14}
        ry={ry - 6}
        fill="none"
        stroke={planetHex}
        strokeOpacity="0.32"
        strokeWidth="1"
        transform={`rotate(${tilt} 135 75)`}
      />

      {/* Planet Body + Day/Night Terminator */}
      <circle cx="135" cy="75" r="24" fill="#0F172A" stroke={planetHex} strokeWidth="2" />
      <path
        d="M135 51 A24 24 0 0 0 135 99 Z"
        fill={planetHex}
        opacity={0.45 + sunlitRatio * 0.45}
      />

      {/* Active Spacecraft Marker on Corridor */}
      <g transform={`rotate(${tilt} 135 75)`}>
        <circle cx={135 + rx} cy="75" r="5" fill="#FACC15" />
        <circle cx={135 + rx} cy="75" r="9" fill="none" stroke="#22D3EE" strokeWidth="1.2" />
      </g>
    </svg>
  );
};

export const RocketOrbitPage: React.FC = () => {
  const {
    rockets,
    orbits,
    selectedRocketId,
    selectRocket,
    selectedOrbitId,
    selectOrbit,
    selectedMission,
    selectedDestination,
    selectedRocket,
    selectedOrbit,
    metrics,
    setActivePage,
  } = useMission();

  const selectedRocketAccent = ROCKET_ACCENTS[selectedRocket.id] || '#22D3EE';
  const payloadFillPct = Math.min(
    100,
    Math.round((metrics.totalMassKg / Math.max(1, selectedRocket.payloadCapacityKg)) * 100)
  );
  const criticalCount = metrics.warnings.filter((w) => w.severity === 'critical').length;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-amber-300">
            Sector 04 · Launch Vehicle &amp; Trajectory Pairing
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            Rocket &amp; Orbit Selection
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Integrate your{' '}
            <span className="font-mono font-semibold text-white">{metrics.totalMassKg} kg</span>{' '}
            spacecraft onto a launch booster and plot its arrival corridor around{' '}
            <span className="font-semibold" style={{ color: selectedDestination.accentHex }}>
              {selectedMission.destinationName}
            </span>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playClick(680);
            setActivePage('mission-control');
          }}
          className="menu-blade glow-cta px-6 py-3 font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Proceed to Mission Control</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Interactive Launchpad & Orbital Corridor Staging Visualizer */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Rocket Cutaway & Payload Bay */}
        <div className="lg:col-span-5 hud-frame rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-cyan-300">
                Armed Booster · Pad Config
              </p>
              <h2 className="font-display text-xl font-bold text-white">{selectedRocket.name}</h2>
            </div>
            <span
              className={`text-xs font-mono font-bold inline-flex items-center gap-1 ${
                metrics.rocketPayloadCompatible && metrics.destinationCompatible
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {metrics.rocketPayloadCompatible && metrics.destinationCompatible ? (
                <>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Payload Cleared
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" aria-hidden="true" />
                  Check Fit
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-5 bg-[#050819]/85 border border-slate-800 rounded-xl p-4">
            {renderRocketSvg(selectedRocket.id, selectedRocketAccent, true)}

            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Payload Bay Load</span>
                  <span
                    className={`tabular-nums font-semibold ${
                      metrics.rocketPayloadCompatible ? 'text-cyan-300' : 'text-rose-400'
                    }`}
                  >
                    {metrics.totalMassKg} / {selectedRocket.payloadCapacityKg} kg ({payloadFillPct}%)
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-700">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${payloadFillPct}%`,
                      background: metrics.rocketPayloadCompatible
                        ? `linear-gradient(90deg, ${selectedRocketAccent}, #22D3EE)`
                        : '#FB7185',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-[#090f28] border border-slate-800">
                  <span className="text-slate-400 block font-mono text-[10px]">RELIABILITY</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {selectedRocket.reliabilityRating}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#090f28] border border-slate-800">
                  <span className="text-slate-400 block font-mono text-[10px]">LAUNCH + CRAFT</span>
                  <span
                    className={`font-mono font-bold tabular-nums ${
                      metrics.remainingBudgetM >= 0 ? 'text-emerald-300' : 'text-rose-400'
                    }`}
                  >
                    ${metrics.totalCostM}M
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Orbital Corridor Simulator & Telemetry */}
        <div className="lg:col-span-7 hud-frame rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-fuchsia-300">
                Orbital Trajectory Plot · {selectedDestination.name}
              </p>
              <h2 className="font-display text-xl font-bold text-white">{selectedOrbit.name}</h2>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-300">
                {selectedOrbit.altitudeLabel} · {selectedOrbit.inclinationLabel}
              </span>
              <span
                className={`inline-flex items-center gap-1 font-bold ${
                  metrics.launchReady ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {metrics.launchReady ? (
                  <>
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                    Go for Launch
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                    Review Warnings ({criticalCount})
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="bg-[#050819]/85 border border-slate-800 rounded-xl px-4 py-2">
            {renderOrbitCorridorSvg({
              planetHex: selectedDestination.accentHex,
              planetName: selectedDestination.name,
              orbitName: selectedOrbit.name,
              sunlitRatio: selectedOrbit.powerSunlitRatio,
              orbitId: selectedOrbit.id,
              large: true,
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-[#050819]/85 border border-slate-800">
              <span className="text-slate-400 block font-mono text-[10px]">REMAINING BUDGET</span>
              <span
                className={`font-mono font-bold tabular-nums text-sm ${
                  metrics.remainingBudgetM >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ${metrics.remainingBudgetM}M
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#050819]/85 border border-slate-800">
              <span className="text-slate-400 block font-mono text-[10px]">EFFECTIVE POWER</span>
              <span
                className={`font-mono font-bold tabular-nums text-sm ${
                  metrics.availablePowerW >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {metrics.availablePowerW >= 0 ? '+' : ''}
                {metrics.availablePowerW} W
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#050819]/85 border border-slate-800">
              <span className="text-slate-400 block font-mono text-[10px]">SCIENCE GAIN</span>
              <span className="font-mono font-bold text-cyan-300 tabular-nums text-sm">
                {selectedOrbit.scienceMultiplier.toFixed(2)}x
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#050819]/85 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1 font-mono text-[10px]">
                <Sun className="w-3 h-3 text-amber-300" aria-hidden="true" />
                SUNLIT ORBIT
              </span>
              <span className="font-mono font-bold text-amber-300 tabular-nums text-sm">
                {Math.round(selectedOrbit.powerSunlitRatio * 100)}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Launch Vehicles */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
          <Rocket className="w-5 h-5 text-amber-300" aria-hidden="true" />
          1. Select Launch Vehicle (Simplified Game Data)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rockets.map((rocket) => {
            const selected = rocket.id === selectedRocketId;
            const destOk = rocket.compatibleDestinations.includes(
              selectedMission.destinationId
            );
            const massOk = metrics.totalMassKg <= rocket.payloadCapacityKg;
            const accent = ROCKET_ACCENTS[rocket.id] || '#22D3EE';

            return (
              <div
                key={rocket.id}
                className="hud-frame rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all"
                style={{
                  borderColor: selected ? accent : 'rgba(148, 163, 184, 0.22)',
                  boxShadow: selected ? `0 0 30px ${accent}38` : undefined,
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">Reliability {rocket.reliabilityRating}%</span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        destOk && massOk ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {destOk && massOk ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Compatible
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          Check Limits
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {renderRocketSvg(rocket.id, accent)}
                    <h3 className="font-display text-lg font-bold text-white leading-tight">
                      {rocket.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">{rocket.summary}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {rocket.beginnerExplanation}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 flex items-center">
                        Max Payload
                        <TooltipInfo
                          term="Payload Capacity"
                          explanation="Maximum spacecraft mass in kg this rocket can lift to your target destination."
                        />
                      </span>
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          massOk ? 'text-white' : 'text-rose-400'
                        }`}
                      >
                        {rocket.payloadCapacityKg} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Launch Cost</span>
                      <span className="font-mono tabular-nums font-semibold text-cyan-300">
                        ${rocket.launchCostM}M
                      </span>
                    </div>
                  </div>

                  {!destOk && (
                    <p className="text-xs text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      Not rated for {selectedMission.destinationName}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick(600);
                      selectRocket(rocket.id);
                    }}
                    className={`w-full py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {selected ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        Selected Rocket
                      </>
                    ) : (
                      'Select Rocket'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Target Orbits */}
      <section className="space-y-4 pt-6 border-t border-violet-500/25">
        <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
          <Orbit className="w-5 h-5 text-cyan-300" aria-hidden="true" />
          2. Select Target Orbit / Entry Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orbits.map((orbit) => {
            const selected = orbit.id === selectedOrbitId;
            const compatible = orbit.compatibleDestinations.includes(
              selectedMission.destinationId
            );
            return (
              <div
                key={orbit.id}
                className={`hud-frame rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all ${
                  selected
                    ? 'border-cyan-400 shadow-[0_0_26px_rgba(34,211,238,0.22)]'
                    : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">
                      {orbit.altitudeLabel} · {orbit.inclinationLabel}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        compatible ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {compatible ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Matches target
                        </>
                      ) : (
                        'Other world'
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-bold text-white leading-snug">
                      {orbit.name}
                    </h3>
                    {renderOrbitCorridorSvg({
                      planetHex: selected ? '#22D3EE' : '#A78BFA',
                      planetName: selectedDestination.name,
                      orbitName: orbit.name,
                      sunlitRatio: orbit.powerSunlitRatio,
                      orbitId: orbit.id,
                    })}
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">{orbit.description}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {orbit.beginnerExplanation}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">
                      Science Gain:{' '}
                      <strong className="text-cyan-300">
                        {orbit.scienceMultiplier.toFixed(2)}x
                      </strong>
                    </span>
                    <span className="text-slate-300">
                      Sunlit Orbit:{' '}
                      <strong className="text-amber-300">
                        {Math.round(orbit.powerSunlitRatio * 100)}%
                      </strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick(640);
                      selectOrbit(orbit.id);
                    }}
                    className={`w-full py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {selected ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        Selected Orbit
                      </>
                    ) : (
                      'Select Orbit'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
