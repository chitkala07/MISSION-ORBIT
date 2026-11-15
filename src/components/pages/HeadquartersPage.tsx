import React from 'react';
import {
  Archive,
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Cpu,
  Globe2,
  Rocket,
  SlidersHorizontal,
  Sparkles,
  SunMedium,
} from 'lucide-react';
import { useMission } from '../../context/MissionContext';
import { DESTINATION_IMAGES } from '../../assets/destinationImages';
import { HeroSpaceScene } from '../three/HeroSpaceScene';
import { AchievementBadge } from '../common/AchievementBadge';

export const HeadquartersPage: React.FC = () => {
  const {
    setActivePage,
    destinations,
    reports,
    selectedMission,
    selectedDestination,
    selectedRocket,
    activeDesign,
    metrics,
    userProfile,
    playerProgression,
    selectDestination,
    setLatestReport,
  } = useMission();

  const totalMissions = reports.length;
  const successCount = reports.filter((r) => r.outcome === 'SUCCESS').length;
  const clearRate = totalMissions > 0 ? Math.round((successCount / totalMissions) * 100) : 0;
  const avgScore =
    totalMissions > 0
      ? Math.round(reports.reduce((s, r) => s + r.overallScore, 0) / totalMissions)
      : 0;

  const xpIntoLevel = playerProgression.xp % 250;
  const levelProgressPct = Math.min(100, Math.round((xpIntoLevel / 250) * 100));

  const exploredTargets = destinations.filter(
    (d) => d.exploreTarget && playerProgression.unlockedDestinations.includes(d.id)
  );

  const massFillPct = Math.min(
    100,
    Math.round((metrics.totalMassKg / Math.max(1, selectedMission.massLimitKg)) * 100)
  );

  return (
    <div className="space-y-12 pb-12">
      {/* FULL-VIEWPORT 3D GAME TITLE MENU */}
      <section className="relative min-h-[600px] lg:min-h-[660px] w-full overflow-hidden border-b border-violet-500/35 bg-[#050716]">
        <div className="absolute inset-0 z-0">
          <HeroSpaceScene />
        </div>

        {/* Asymmetric Left Contrast Scrim preserving right-side 3D planetary vista */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-[#050716]/96 via-[#070b24]/78 to-transparent"
        />

        <div className="relative z-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 min-h-[600px] lg:min-h-[660px] flex flex-col justify-between gap-8">
          <div className="max-w-2xl space-y-6">
            {/* Bespoke Inline SVG Title Emblem + Commander Tag */}
            <div className="flex items-center gap-3.5">
              <svg viewBox="0 0 48 48" className="w-11 h-11 shrink-0" aria-hidden="true">
                <polygon
                  points="24,3 43,14 43,34 24,45 5,34 5,14"
                  fill="#0b1332"
                  stroke="#22D3EE"
                  strokeWidth="2"
                />
                <circle cx="24" cy="24" r="7" fill="#38BDF8" />
                <ellipse
                  cx="24"
                  cy="24"
                  rx="16"
                  ry="6.5"
                  transform="rotate(-24 24 24)"
                  fill="none"
                  stroke="#E879F9"
                  strokeWidth="2"
                />
                <circle cx="38" cy="18" r="2.6" fill="#FACC15" />
              </svg>

              <div>
                <p className="font-display text-sm sm:text-base font-bold tracking-[0.26em] uppercase bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
                  MISSION: ORBIT
                </p>
                <p className="text-xs font-mono text-cyan-200/90">
                  Level {playerProgression.level} {playerProgression.rankTitle} · {userProfile.teamName}
                </p>
              </div>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-white leading-[1.06] [text-wrap:balance]">
              Command Your Spacecraft Across a Living Solar System.
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl">
              Welcome aboard, <strong className="text-cyan-300">{userProfile.callsign}</strong>.
              Chart planetary sectors in 3D, snap custom hardware onto orbital probes, and pilot through live anomalies.
            </p>

            {/* Chamfered Game Main Menu Blades */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <button
                type="button"
                data-start="true"
                onClick={() => setActivePage('mission-selection')}
                className="menu-blade glow-cta px-6 py-4 font-display font-bold text-sm uppercase tracking-wider flex items-center justify-between cursor-pointer"
              >
                <span>Start Your Mission</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setActivePage('solar-system')}
                className="menu-blade px-5 py-4 bg-[#0d163a]/95 hover:bg-[#172357] text-white border border-cyan-400/55 hover:border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.2)] font-display font-bold text-sm uppercase tracking-wider flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                  Explore the Galaxy
                </span>
                <ArrowRight className="w-4 h-4 text-cyan-300" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setActivePage('spacecraft-lab')}
                className="menu-blade px-5 py-3.5 bg-[#131238]/95 hover:bg-[#1f1c59] text-violet-100 border border-violet-400/50 hover:border-violet-300 shadow-[0_0_20px_rgba(168,85,247,0.18)] font-display font-semibold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-violet-300" aria-hidden="true" />
                  Spacecraft Lab
                </span>
                <ArrowRight className="w-4 h-4 text-violet-300" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setActivePage('results')}
                className="menu-blade px-5 py-3.5 bg-[#201233]/95 hover:bg-[#311a4d] text-pink-100 border border-pink-400/45 hover:border-pink-300 shadow-[0_0_20px_rgba(236,72,153,0.16)] font-display font-semibold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-pink-300" aria-hidden="true" />
                  Mission Archive
                </span>
                <ArrowRight className="w-4 h-4 text-pink-300" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Docked Pre-Flight Spacecraft Status Strip */}
          <div className="webgl-hud-panel rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block text-[11px] font-mono uppercase">Active Contract</span>
                <span className="font-semibold text-white">{selectedMission.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-mono uppercase">Equipped Craft</span>
                <span className="font-semibold text-cyan-300">{activeDesign.name}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px] font-mono uppercase">
                  Hull Mass ({massFillPct}% of limit)
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-violet-400"
                      style={{ width: `${massFillPct}%` }}
                    />
                  </div>
                  <span className="font-mono tabular-nums text-xs text-white shrink-0">
                    {metrics.totalMassKg} kg
                  </span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-mono uppercase">Power Margin</span>
                <span
                  className={`font-mono tabular-nums font-semibold ${
                    metrics.availablePowerW >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {metrics.availablePowerW >= 0 ? '+' : ''}
                  {metrics.availablePowerW} W net
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setActivePage('spacecraft-lab')}
                className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-xs font-semibold text-cyan-200 whitespace-nowrap cursor-pointer"
              >
                Inspect Craft
              </button>
              <button
                type="button"
                onClick={() => setActivePage('mission-control')}
                className="px-4 py-2 rounded-lg bg-violet-500/25 hover:bg-violet-500/35 border border-violet-400/50 text-xs font-semibold text-violet-100 whitespace-nowrap cursor-pointer"
              >
                Launch Pad
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* COMMANDER CAREER CONSOLE + ACTIVE CAMPAIGN CHECKLIST */}
        <section
          aria-label="Mission progress and statistics"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
        >
          {/* Unified Commander Progression Console */}
          <div className="lg:col-span-7 hud-frame rounded-2xl p-6 flex flex-col justify-between gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <svg viewBox="0 0 56 56" className="w-14 h-14 shrink-0" aria-hidden="true">
                  <polygon
                    points="28,3 50,15 50,41 28,53 6,41 6,15"
                    fill="#10183a"
                    stroke="#A855F7"
                    strokeWidth="2"
                  />
                  <polygon points="28,12 35,28 28,24 21,28" fill="#22D3EE" />
                  <path d="M18 35 H38 L28 43 Z" fill="#FACC15" />
                </svg>
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-fuchsia-300">
                    Commander Career Rank
                  </p>
                  <h2 className="font-display text-2xl font-bold text-white mt-0.5">
                    Level {playerProgression.level} · {playerProgression.rankTitle}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono tabular-nums text-base font-bold text-amber-300">
                  {playerProgression.xp} XP
                </span>
                <button
                  type="button"
                  onClick={() => setActivePage('architecture')}
                  className="px-3 py-1.5 rounded-lg bg-[#0a1029] hover:bg-[#141f4a] border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                  Crew &amp; Backend
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span>Rank Advancement</span>
                <span className="tabular-nums">
                  {xpIntoLevel} / 250 XP to Level {playerProgression.level + 1}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#06091a] overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 transition-all duration-500"
                  style={{ width: `${levelProgressPct}%` }}
                />
              </div>
            </div>

            {/* Integrated Flight Record Strip (replaces standalone admin KPI boxes) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 font-mono uppercase block">Flights Logged</span>
                <span className="font-mono tabular-nums text-xl font-bold text-white">
                  {totalMissions}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-mono uppercase block">Mission Success</span>
                <span className="font-mono tabular-nums text-xl font-bold text-emerald-400">
                  {successCount} ({clearRate}%)
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-mono uppercase block">Avg Rating</span>
                <span className="font-mono tabular-nums text-xl font-bold text-fuchsia-300">
                  {avgScore} / 100
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-mono uppercase block">Worlds Charted</span>
                <span className="font-mono tabular-nums text-xl font-bold text-cyan-300">
                  {exploredTargets.length} / 5
                </span>
              </div>
            </div>
          </div>

          {/* Active Expedition Readiness Card */}
          <div className="lg:col-span-5 hud-frame rounded-2xl p-6 flex flex-col justify-between gap-4 border-violet-500/35">
            <div className="space-y-1">
              <p className="text-xs font-mono uppercase tracking-wider text-cyan-300">
                Flight Deck Brief · Active Setup
              </p>
              <h2 className="font-display text-xl font-bold text-white">
                {selectedMission.name}
              </h2>
              <p className="text-xs text-slate-300">
                {selectedDestination.name} · {selectedRocket.name} · Budget ${metrics.remainingBudgetM}M left
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-800/70">
                <span className="text-slate-300">Destination &amp; Solar Output</span>
                <span className="font-mono text-amber-300 font-semibold">
                  {selectedDestination.name} ({Math.round(selectedDestination.solarEfficiencyFactor * 100)}% sun)
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/70">
                <span className="text-slate-300">Engineering Readiness</span>
                <span
                  className={`font-mono font-semibold ${
                    metrics.launchReady ? 'text-emerald-400' : 'text-amber-300'
                  }`}
                >
                  {metrics.launchReady
                    ? 'All Checks Nominal'
                    : `${metrics.warnings.length} Alert(s) in Lab`}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-300">Science Payload Rating</span>
                <span className="font-mono text-fuchsia-300 font-semibold">
                  {metrics.totalScienceValue} pts
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActivePage('spacecraft-lab')}
                className="py-2.5 px-3 rounded-xl bg-[#0d163b] hover:bg-[#172357] border border-cyan-400/45 text-xs font-display font-bold uppercase tracking-wider text-cyan-200 cursor-pointer"
              >
                Tune in Lab
              </button>
              <button
                type="button"
                onClick={() => setActivePage('mission-control')}
                className="glow-cta py-2.5 px-3 rounded-xl text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Rocket className="w-3.5 h-3.5" aria-hidden="true" />
                Launch Control
              </button>
            </div>
          </div>
        </section>

        {/* PLANETARY SECTOR PORTALS */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-cyan-300">
                Star Chart · Planetary Sectors
              </p>
              <h2 className="font-display text-2xl font-bold text-white mt-0.5">
                Recently Explored Destinations
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('solar-system')}
              className="text-sm font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
            >
              Open 3D Solar System
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {destinations
              .filter((d) => d.exploreTarget)
              .slice(0, 4)
              .map((body) => {
                const unlocked = playerProgression.unlockedDestinations.includes(body.id);
                return (
                  <button
                    key={body.id}
                    type="button"
                    onClick={() => {
                      selectDestination(body.id);
                      setActivePage('solar-system');
                    }}
                    className="group text-left rounded-2xl overflow-hidden border border-slate-700/70 hover:border-cyan-400 bg-[#091028] transition-all hover:-translate-y-1 cursor-pointer shadow-[0_12px_30px_-14px_rgba(3,6,22,0.85)]"
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                      <img
                        src={DESTINATION_IMAGES[body.id]}
                        alt={`${body.name} planetary sector illustration`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#091028] via-[#091028]/35 to-transparent" />
                      <span
                        className="absolute top-3 right-3 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded bg-[#050716]/90 border border-white/15"
                        style={{ color: unlocked ? body.accentHex : '#94a3b8' }}
                      >
                        {unlocked ? 'Explored' : 'Uncharted'}
                      </span>
                      <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-300">
                        <span>{body.gravityLabel.split(' ')[0]} m/s²</span>
                        <span className="flex items-center gap-1 text-amber-300">
                          <SunMedium className="w-3 h-3" aria-hidden="true" />
                          {Math.round(body.solarEfficiencyFactor * 100)}% Sun
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="text-[11px] font-mono text-slate-400">{body.distanceLabel}</p>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {body.name}
                        </h3>
                        <ArrowRight
                          className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">{body.classification}</p>
                    </div>
                  </button>
                );
              })}
          </div>
        </section>

        {/* CONNECTED CAMPAIGN TRAJECTORY + RECENT FLIGHT LOGS */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 hud-frame rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-300" aria-hidden="true" />
                4-Stage Space Mission Loop
              </h2>
              <span className="text-xs font-mono text-cyan-300">Interactive Campaign Path</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  step: '01',
                  title: 'Explore Destinations',
                  desc: 'Zoom across our 3D Solar System to inspect sunlight strength, gravity, and destination leads.',
                  status: `Target: ${selectedDestination.name}`,
                  done: true,
                  target: 'solar-system' as const,
                  accent: 'text-cyan-300',
                  icon: Compass,
                },
                {
                  step: '02',
                  title: 'Accept Mission Briefing',
                  desc: 'Choose Beginner to Expert expeditions and assign scientific payloads.',
                  status: selectedMission.difficulty,
                  done: true,
                  target: 'mission-selection' as const,
                  accent: 'text-fuchsia-300',
                  icon: Globe2,
                },
                {
                  step: '03',
                  title: 'Build Spacecraft in 3D',
                  desc: 'Snap solar wings, cameras, and thrusters onto your craft while balancing gauges.',
                  status: metrics.launchReady ? 'Craft Ready' : 'Tuning Needed',
                  done: metrics.launchReady,
                  target: 'spacecraft-lab' as const,
                  accent: 'text-violet-300',
                  icon: Cpu,
                },
                {
                  step: '04',
                  title: 'Launch & Command',
                  desc: 'Ride the countdown into deep space, survive orbital events, and claim rewards.',
                  status: `${totalMissions} Flights Logged`,
                  done: totalMissions > 0,
                  target: 'mission-control' as const,
                  accent: 'text-amber-300',
                  icon: Rocket,
                },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setActivePage(s.target)}
                    className="text-left p-4 rounded-xl bg-[#070c22] hover:bg-[#0f1740] border border-slate-800 hover:border-cyan-400/60 transition-all space-y-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs font-bold ${s.accent}`}>
                        STAGE {s.step}
                      </span>
                      <Icon className={`w-4 h-4 ${s.accent}`} aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-base font-bold text-white">{s.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-slate-200">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${s.done ? 'text-emerald-400' : 'text-amber-300'}`}
                        aria-hidden="true"
                      />
                      <span>{s.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 hud-frame rounded-2xl p-6 space-y-4 border-fuchsia-500/30">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-white">Recent Flight Logs</h2>
              <button
                type="button"
                onClick={() => setActivePage('results')}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 cursor-pointer"
              >
                Full Archive
              </button>
            </div>

            <div className="space-y-3">
              {reports.slice(0, 3).map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl bg-[#070c22] border border-slate-800 hover:border-violet-400/50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-slate-400">
                      {rep.destinationName} ·{' '}
                      <span
                        className={
                          rep.outcome === 'SUCCESS'
                            ? 'text-emerald-400'
                            : rep.outcome === 'PARTIAL_SUCCESS'
                            ? 'text-amber-300'
                            : 'text-rose-400'
                        }
                      >
                        {rep.outcome === 'SUCCESS'
                          ? 'Mission Success'
                          : rep.outcome === 'PARTIAL_SUCCESS'
                          ? 'Partial Success'
                          : 'Failure'}
                      </span>
                    </p>
                    <h3 className="font-display text-sm font-bold text-white truncate mt-0.5">
                      {rep.missionName}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {rep.spacecraftName} · Score{' '}
                      <strong className="text-cyan-300">{rep.overallScore}/100</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLatestReport(rep);
                      setActivePage('results');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#11193b] hover:bg-[#1a2658] border border-cyan-500/30 text-xs font-semibold text-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Debrief
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ACHIEVEMENTS SHOWCASE */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" aria-hidden="true" />
                Flight Honors &amp; Progression
              </p>
              <h2 className="font-display text-2xl font-bold text-white mt-0.5">
                Mission Achievements ({playerProgression.unlockedCount} / {playerProgression.totalCount})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {playerProgression.achievements.map((ach) => (
              <AchievementBadge key={ach.id} achievement={ach} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
