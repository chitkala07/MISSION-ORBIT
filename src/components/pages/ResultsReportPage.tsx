import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Cpu,
  FileText,
  Home,
  Lightbulb,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useMission } from '../../context/MissionContext';
import { DESTINATION_IMAGES } from '../../data/seedData';
import { soundFx } from '../../utils/soundFx';
import { AchievementBadge } from '../common/AchievementBadge';
import { RadialGauge } from '../common/RadialGauge';

const useAnimatedScore = (target: number, reportKey: string) => {
  const [val, setVal] = useState(target);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setVal(target);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const duration = 650;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reportKey]);

  return val;
};

export const ResultsReportPage: React.FC = () => {
  const {
    reports,
    latestReport,
    setLatestReport,
    setActivePage,
    destinations,
    playerProgression,
  } = useMission();

  const reportSectionRef = useRef<HTMLDivElement | null>(null);
  const report = latestReport || reports[0] || null;

  const animOverall = useAnimatedScore(report?.overallScore ?? 0, report?.id ?? 'none');
  const animEng = useAnimatedScore(report?.engineeringScore ?? 0, report?.id ?? 'none');
  const animSci = useAnimatedScore(report?.scienceScore ?? 0, report?.id ?? 'none');
  const animEff = useAnimatedScore(
    report?.resourceEfficiencyScore ?? 0,
    report?.id ?? 'none'
  );

  if (!report) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center space-y-5">
        <h1 className="font-display text-3xl font-bold text-white">
          No Mission Reports Yet
        </h1>
        <p className="text-sm text-slate-300 max-w-md mx-auto">
          Launch and complete a mission simulation in Mission Control to unlock achievements and archive your first engineering report.
        </p>
        <button
          type="button"
          onClick={() => setActivePage('mission-control')}
          className="menu-blade glow-cta px-6 py-3 font-display font-bold text-sm uppercase tracking-wider cursor-pointer"
        >
          Go to Mission Control
        </button>
      </div>
    );
  }

  const matchedDest = destinations.find((d) => d.name === report.destinationName);
  const backdropImg = matchedDest
    ? DESTINATION_IMAGES[matchedDest.id]
    : DESTINATION_IMAGES.mars;

  const outcomeLabel =
    report.outcome === 'SUCCESS'
      ? 'Mission Success'
      : report.outcome === 'PARTIAL_SUCCESS'
      ? 'Partial Success'
      : 'Mission Failure';

  const outcomeAccent =
    report.outcome === 'SUCCESS'
      ? { border: 'border-emerald-400/60', text: 'text-emerald-300', badge: 'bg-emerald-500/20' }
      : report.outcome === 'PARTIAL_SUCCESS'
      ? { border: 'border-amber-400/60', text: 'text-amber-300', badge: 'bg-amber-500/20' }
      : { border: 'border-rose-400/60', text: 'text-rose-300', badge: 'bg-rose-500/20' };

  const unlockedList = playerProgression.achievements.filter((a) => a.unlocked);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Reward Banner with Planetary Illustration Backdrop */}
      <section
        className={`relative rounded-3xl overflow-hidden border ${outcomeAccent.border} shadow-[0_20px_60px_-15px_rgba(34,211,238,0.24)]`}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={backdropImg}
            alt={`${report.destinationName} mission completion backdrop`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050716]/95 via-[#090d24]/88 to-[#090d24]/70" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase px-3 py-1 rounded-lg border ${outcomeAccent.border} ${outcomeAccent.badge} ${outcomeAccent.text}`}
                >
                  <Award className="w-4 h-4" aria-hidden="true" />
                  {outcomeLabel} · Level {playerProgression.level} {playerProgression.rankTitle}
                </span>
                <span className="text-xs font-mono text-amber-300">
                  {playerProgression.xp} / {playerProgression.nextLevelXp} XP
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
                {report.missionName}
              </h1>

              <p className="text-sm text-slate-200 leading-relaxed">
                {report.resultExplanation}
              </p>

              <p className="text-xs font-mono text-cyan-300 pt-1">
                Commander {report.commanderName} · {report.spacecraftName} · {report.rocketName} ·{' '}
                {report.orbitName}
              </p>
            </div>

            <div className="hud-frame rounded-2xl p-5 text-center border border-cyan-400/40 shrink-0 min-w-[190px]">
              <p className="text-xs font-mono uppercase text-cyan-300">Overall Mission Score</p>
              <p className="font-display text-5xl font-bold text-white tabular-nums mt-1">
                {animOverall}
              </p>
              <p className="text-xs font-mono text-slate-400 mt-0.5">out of 100 pts</p>
            </div>
          </div>

          {/* 4 Animated SVG Progress Rings */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
            <div className="hud-frame rounded-2xl p-4 flex justify-center border border-cyan-500/25">
              <RadialGauge
                label="Overall Score"
                valueText={`${animOverall}`}
                subValueText="/ 100"
                sublabel="Combined Rating"
                percent={animOverall}
                colorHex="#22D3EE"
              />
            </div>
            <div className="hud-frame rounded-2xl p-4 flex justify-center border border-violet-500/25">
              <RadialGauge
                label="Engineering"
                valueText={`${animEng}`}
                subValueText="/ 100"
                sublabel="40% Weight"
                percent={animEng}
                colorHex="#A855F7"
              />
            </div>
            <div className="hud-frame rounded-2xl p-4 flex justify-center border border-emerald-500/25">
              <RadialGauge
                label="Scientific Gain"
                valueText={`${animSci}`}
                subValueText="/ 100"
                sublabel="40% Weight"
                percent={animSci}
                colorHex="#34D399"
              />
            </div>
            <div className="hud-frame rounded-2xl p-4 flex justify-center border border-amber-500/25">
              <RadialGauge
                label="Efficiency"
                valueText={`${animEff}`}
                subValueText="/ 100"
                sublabel="20% Weight"
                percent={animEff}
                colorHex="#FACC15"
              />
            </div>
          </div>

          {/* 4 Requested Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick(600);
                reportSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="menu-blade glow-cta px-5 py-2.5 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              View Mission Report
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick(560);
                setActivePage('mission-control');
              }}
              className="px-4 py-2.5 rounded-xl bg-[#10183a] hover:bg-[#192556] border border-cyan-400/50 text-xs font-display font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Try Again
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick(560);
                setActivePage('spacecraft-lab');
              }}
              className="px-4 py-2.5 rounded-xl bg-[#14133a] hover:bg-[#201e59] border border-violet-400/45 text-xs font-display font-bold uppercase tracking-wider text-violet-200 flex items-center gap-2 cursor-pointer"
            >
              <Cpu className="w-4 h-4" aria-hidden="true" />
              Design Another Spacecraft
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick(500);
                setActivePage('headquarters');
              }}
              className="px-4 py-2.5 rounded-xl bg-[#11172f] hover:bg-[#1c2549] border border-slate-700 text-xs font-display font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              Return to Headquarters
            </button>
          </div>
        </div>
      </section>

      {/* Unlocked Achievements Showcase */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" aria-hidden="true" />
            Earned Achievement Badges ({unlockedList.length} / {playerProgression.totalCount})
          </h2>
          <span className="font-mono text-xs text-amber-300">
            Total Commander XP: {playerProgression.xp} XP
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...playerProgression.achievements]
            .sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
            .slice(0, 4)
            .map((ach) => (
              <AchievementBadge key={ach.id} achievement={ach} compact />
            ))}
        </div>
      </section>

      {/* Detailed Objectives & Engineering Breakdown */}
      <div ref={reportSectionRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="hud-frame rounded-2xl p-6 space-y-5 border border-cyan-500/25">
          <h3 className="font-display text-lg font-bold text-white">
            Scientific Objectives Breakdown
          </h3>

          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase text-emerald-400">
              Successful Objectives ({report.successfulObjectives.length})
            </h4>
            {report.successfulObjectives.length === 0 ? (
              <p className="text-xs text-slate-400">No objectives completed on this flight.</p>
            ) : (
              <ul className="space-y-2">
                {report.successfulObjectives.map((obj) => (
                  <li key={obj} className="flex items-center gap-2 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <h4 className="text-xs font-mono uppercase text-rose-400">
              Missed Objectives ({report.missedObjectives.length})
            </h4>
            {report.missedObjectives.length === 0 ? (
              <p className="text-xs text-slate-400">Zero missed objectives.</p>
            ) : (
              <ul className="space-y-2">
                {report.missedObjectives.map((obj) => (
                  <li key={obj} className="flex items-center gap-2 text-sm text-rose-200">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="hud-frame rounded-2xl p-6 space-y-5 border border-violet-500/25">
          <h3 className="font-display text-lg font-bold text-white">
            Engineering Diagnostics &amp; Recommendations
          </h3>

          <div className="space-y-2.5">
            <h4 className="text-xs font-mono uppercase text-amber-300">
              Problems Encountered ({report.problemsEncountered.length})
            </h4>
            {report.problemsEncountered.length === 0 ? (
              <p className="text-xs text-emerald-300">
                No critical engineering problems recorded during flight.
              </p>
            ) : (
              <ul className="space-y-2">
                {report.problemsEncountered.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-slate-200">
                    <AlertTriangle
                      className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
            <h4 className="text-xs font-mono uppercase text-cyan-300">
              Suggestions to Improve Your Spacecraft
            </h4>
            <ul className="space-y-2">
              {report.improvementSuggestions.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-slate-200">
                  <Lightbulb
                    className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Saved Mission Reports Archive Table */}
      <section className="hud-frame rounded-2xl p-6 space-y-4 border border-fuchsia-500/25">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-white">
            Mission Archive ({reports.length} Saved Flights)
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Persisted across sessions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-mono uppercase text-slate-400">
                <th className="py-2.5 pr-4">Mission</th>
                <th className="py-2.5 pr-4">Spacecraft</th>
                <th className="py-2.5 pr-4">Destination</th>
                <th className="py-2.5 pr-4">Outcome</th>
                <th className="py-2.5 pr-4">Overall</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {reports.map((item) => {
                const isSelected = item.id === report.id;
                const destMeta = destinations.find((d) => d.name === item.destinationName);
                return (
                  <tr
                    key={item.id}
                    className={isSelected ? 'bg-cyan-500/10' : 'hover:bg-slate-800/40'}
                  >
                    <td className="py-3 pr-4 font-semibold text-white">{item.missionName}</td>
                    <td className="py-3 pr-4 text-slate-300">{item.spacecraftName}</td>
                    <td className="py-3 pr-4 text-slate-300">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: destMeta?.accentHex || '#22D3EE' }}
                        />
                        {item.destinationName}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      <span
                        className={
                          item.outcome === 'SUCCESS'
                            ? 'text-emerald-400'
                            : item.outcome === 'PARTIAL_SUCCESS'
                            ? 'text-amber-300'
                            : 'text-rose-400'
                        }
                      >
                        {item.outcome}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono tabular-nums text-cyan-300 font-semibold">
                      {item.overallScore}/100
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playClick(540);
                          setLatestReport(item);
                        }}
                        className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 cursor-pointer"
                      >
                        {isSelected ? 'Viewing' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
