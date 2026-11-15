import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Circle,
  FastForward,
  Flame,
  Gauge,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Volume2,
  VolumeX,
  XCircle,
  Zap,
} from 'lucide-react';
import { useMission } from '../../context/MissionContext';
import { MISSION_EVENTS } from '../../data/seedData';
import { soundFx } from '../../utils/soundFx';
import { MissionLaunchScene } from '../three/MissionLaunchScene';
import type { EventDecisionRecord, MissionEvent } from '../../types/mission';

const FLIGHT_STAGES = [
  { id: 1, label: 'Preparation' },
  { id: 2, label: 'Systems Check' },
  { id: 3, label: 'Countdown' },
  { id: 4, label: 'Launch' },
  { id: 5, label: 'Space Cruise' },
  { id: 6, label: 'Arrival' },
  { id: 7, label: 'Evaluation' },
];

const TIMELINE_MILESTONES = [
  { pct: 0, label: 'Launch & Fairing Separation' },
  { pct: 25, label: 'Deep Space Cruise & Comms Check' },
  { pct: 50, label: 'Planetary Eclipse & Thermal Test' },
  { pct: 72, label: 'Instrument Calibration Pass' },
  { pct: 90, label: 'Target Orbit Insertion / Descent' },
  { pct: 100, label: 'Primary Science Complete' },
];

const EVENT_COLORS: Record<string, { border: string; badge: string; text: string }> = {
  Communication: {
    border: 'border-cyan-400/70 shadow-[0_0_32px_rgba(34,211,238,0.24)]',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    text: 'text-cyan-300',
  },
  Power: {
    border: 'border-amber-400/70 shadow-[0_0_32px_rgba(251,191,36,0.24)]',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    text: 'text-amber-300',
  },
  Instrument: {
    border: 'border-violet-400/70 shadow-[0_0_32px_rgba(167,139,250,0.24)]',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-400/40',
    text: 'text-violet-300',
  },
  Navigation: {
    border: 'border-fuchsia-400/70 shadow-[0_0_32px_rgba(232,121,249,0.24)]',
    badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/40',
    text: 'text-fuchsia-300',
  },
};

export const MissionControlPage: React.FC = () => {
  const {
    activeDesign,
    selectedMission,
    selectedDestination,
    selectedRocket,
    selectedOrbit,
    metrics,
    executeSimulationAndSave,
    setActivePage,
  } = useMission();

  const [simRunning, setSimRunning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [systemsChecked, setSystemsChecked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeEvent, setActiveEvent] = useState<MissionEvent | null>(null);
  const [decisions, setDecisions] = useState<EventDecisionRecord[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(() => soundFx.isEnabled());
  const [notifications, setNotifications] = useState<string[]>([
    `Flight Director initialized telemetry for ${activeDesign.name} (${selectedMission.name}).`,
  ]);
  const [completed, setCompleted] = useState(false);

  const powerDeltaTotal = decisions.reduce((s, d) => s + d.powerDelta, 0);
  const commsDeltaTotal = decisions.reduce((s, d) => s + d.commsDelta, 0);
  const currentPowerW = metrics.availablePowerW + powerDeltaTotal;
  const currentComms = Math.max(0, metrics.totalCommsCapacity + commsDeltaTotal);

  // Derived real-time flight telemetry
  const altitudeKm =
    progress === 0
      ? 0
      : progress < 25
      ? Math.round((progress / 25) * 240)
      : Math.round(240 + ((progress - 25) / 75) * 420);
  const velocityKmS =
    progress === 0
      ? '0.0'
      : progress < 25
      ? ((progress / 25) * 7.8).toFixed(1)
      : (7.8 + Math.sin((progress / 100) * Math.PI) * 3.4).toFixed(1);

  const currentStage = completed
    ? 7
    : progress >= 66
    ? 6
    : progress >= 25
    ? 5
    : progress > 0
    ? 4
    : countdown !== null
    ? 3
    : systemsChecked
    ? 2
    : 1;

  // Countdown -> Liftoff transition
  useEffect(() => {
    if (countdown === null) return;
    soundFx.playCountdownBeep(countdown === 1);
    const t = window.setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
      } else {
        setCountdown(null);
        setSimRunning(true);
        setProgress(4);
        soundFx.playIgnitionSweep();
        setNotifications((logs) => [
          `[T-0] LIFTOFF! ${selectedRocket.name} cleared the tower carrying ${activeDesign.name}.`,
          ...logs,
        ]);
      }
    }, 380);
    return () => window.clearTimeout(t);
  }, [countdown, selectedRocket.name, activeDesign.name]);

  // Simulation flight tick
  useEffect(() => {
    if (!simRunning || activeEvent || completed) return;

    const timer = window.setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(100, prev + 2);

        const triggered = MISSION_EVENTS.find(
          (evt) =>
            next >= evt.phasePercent &&
            !decisions.some((d) => d.eventId === evt.id)
        );
        if (triggered) {
          setActiveEvent(triggered);
          setSimRunning(false);
          soundFx.playAlertChime();
          setNotifications((logs) => [
            `[T+${triggered.phasePercent}%] Advisory: ${triggered.title}`,
            ...logs,
          ]);
          return triggered.phasePercent;
        }

        if (next >= 100) {
          setSimRunning(false);
          setCompleted(true);
          soundFx.playSuccessFanfare();
          setNotifications((logs) => [
            `[T+100%] Mission sequence complete! Evaluation ready.`,
            ...logs,
          ]);
        }
        return next;
      });
    }, 150);

    return () => window.clearInterval(timer);
  }, [simRunning, activeEvent, completed, decisions]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.setEnabled(next);
    if (next) soundFx.playClick(640);
  };

  const handleLaunchOrToggle = () => {
    if (progress === 0 && !simRunning && countdown === null) {
      setSystemsChecked(true);
      setCountdown(3);
      setNotifications((logs) => [
        `[Pre-Flight] Systems check passed. Initiating T-3 launch countdown...`,
        ...logs,
      ]);
      return;
    }
    setSimRunning((r) => !r);
  };

  const handleChooseDecision = (event: MissionEvent, choiceId: string) => {
    const choice = event.choices.find((c) => c.id === choiceId);
    if (!choice) return;
    soundFx.playClick(680);

    const record: EventDecisionRecord = {
      eventId: event.id,
      eventTitle: event.title,
      choiceId: choice.id,
      choiceLabel: choice.label,
      outcomeSummary: choice.outcomeSummary,
      engineeringDelta: choice.engineeringDelta,
      scienceDelta: choice.scienceDelta,
      powerDelta: choice.powerDelta,
      commsDelta: choice.commsDelta,
    };

    setDecisions((prev) => [...prev, record]);
    setNotifications((logs) => [
      `[Decision] ${choice.label} → ${choice.outcomeSummary}`,
      ...logs,
    ]);
    setActiveEvent(null);
    setSimRunning(true);
  };

  const handleFinishAndViewReport = () => {
    executeSimulationAndSave(decisions);
    setActivePage('results');
  };

  const handleResetSim = () => {
    soundFx.playClick(420);
    setSimRunning(false);
    setCountdown(null);
    setSystemsChecked(false);
    setProgress(0);
    setActiveEvent(null);
    setDecisions([]);
    setCompleted(false);
    setNotifications([
      `Simulation reset for ${activeDesign.name} targeting ${selectedDestination.name}.`,
    ]);
  };

  const handleSkipToNextEvent = () => {
    if (completed || activeEvent || countdown !== null) return;
    setSystemsChecked(true);
    const nextEvent = MISSION_EVENTS.find(
      (evt) => !decisions.some((d) => d.eventId === evt.id)
    );
    if (nextEvent) {
      setProgress(nextEvent.phasePercent);
      setActiveEvent(nextEvent);
      setSimRunning(false);
      soundFx.playAlertChime();
      setNotifications((logs) => [
        `[T+${nextEvent.phasePercent}%] Advisory: ${nextEvent.title}`,
        ...logs,
      ]);
    } else {
      setProgress(100);
      setCompleted(true);
      setSimRunning(false);
      soundFx.playSuccessFanfare();
    }
  };

  const evtStyle = activeEvent
    ? EVENT_COLORS[activeEvent.category] || EVENT_COLORS.Communication
    : EVENT_COLORS.Communication;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Flight Control Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-cyan-300">
            Sector 05 · Interactive 7-Stage Launch &amp; Flight Command
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            Mission Control: {activeDesign.name}
          </h1>
          <p className="text-sm text-slate-300">
            {selectedMission.name} · {selectedRocket.name} · {selectedOrbit.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={soundEnabled ? 'Mute flight audio' : 'Unmute flight audio'}
            className="px-3 py-2.5 rounded-xl bg-[#11193b] hover:bg-[#192556] border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                Audio On
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                Muted
              </>
            )}
          </button>

          {!completed ? (
            <>
              <button
                type="button"
                onClick={handleLaunchOrToggle}
                disabled={Boolean(activeEvent) || countdown !== null}
                className="glow-cta px-5 py-2.5 rounded-xl font-display font-bold text-sm uppercase tracking-wider disabled:opacity-45 flex items-center gap-2 cursor-pointer"
              >
                {countdown !== null ? (
                  <>
                    <Flame className="w-4 h-4" aria-hidden="true" />
                    T-{countdown} Countdown...
                  </>
                ) : simRunning ? (
                  <>
                    <Pause className="w-4 h-4" aria-hidden="true" />
                    Pause Flight
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" aria-hidden="true" />
                    {progress === 0 ? 'Launch Mission Simulation' : 'Resume Flight'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkipToNextEvent}
                disabled={Boolean(activeEvent) || countdown !== null}
                className="px-3.5 py-2.5 rounded-xl bg-[#11193b] hover:bg-[#192556] border border-cyan-500/35 disabled:opacity-45 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" aria-hidden="true" />
                Advance to Next Event
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleFinishAndViewReport}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-slate-950 font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_0_24px_rgba(52,211,153,0.4)]"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              View Mission Results &amp; Rewards
            </button>
          )}

          <button
            type="button"
            onClick={handleResetSim}
            className="px-3.5 py-2.5 rounded-xl bg-[#11193b] hover:bg-[#192556] border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      {/* 7-Stage Flight Sequence Stepper + Live Trajectory Bar */}
      <div className="hud-frame rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {FLIGHT_STAGES.map((st) => {
            const done = currentStage > st.id;
            const active = currentStage === st.id;
            return (
              <div
                key={st.id}
                className={`px-3 py-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition-colors ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-[0_0_16px_rgba(34,211,238,0.26)]'
                    : done
                    ? 'bg-emerald-500/12 border-emerald-400/40 text-emerald-300'
                    : 'bg-[#070b1e] border-slate-800 text-slate-500'
                }`}
              >
                <span className="shrink-0">0{st.id}</span>
                <span className="truncate">{st.label}</span>
              </div>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-slate-300">
              Flight Trajectory ({selectedMission.estimatedDurationDays}-day profile to{' '}
              {selectedDestination.name})
            </span>
            <div className="flex items-center gap-4">
              <span className="text-slate-300">
                ALT <strong className="text-white tabular-nums">{altitudeKm} km</strong>
              </span>
              <span className="text-slate-300">
                VEL <strong className="text-amber-300 tabular-nums">{velocityKmS} km/s</strong>
              </span>
              <span className="text-cyan-300 font-bold tabular-nums">{progress}%</span>
            </div>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-cyan-400 to-fuchsia-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Split: 3D Launch/Cruise Stage + Event Command Deck vs Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5">
          <div className="relative">
            <MissionLaunchScene
              items={activeDesign.items}
              rocketId={selectedRocket.id}
              destinationId={selectedDestination.id}
              progress={progress}
              countdown={countdown}
              simRunning={simRunning}
              hasActiveEvent={Boolean(activeEvent)}
              completed={completed}
            />

            {countdown !== null && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="webgl-hud-panel px-10 py-6 rounded-2xl border-amber-400/75 text-center badge-pop shadow-[0_0_40px_rgba(251,191,36,0.3)]">
                  <p className="text-xs font-mono uppercase tracking-widest text-amber-300">
                    Main Engine Ignition Sequence
                  </p>
                  <p className="font-display text-6xl font-bold text-white mt-1 tabular-nums">
                    T-{countdown}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Educational Event Decision Card */}
          {activeEvent ? (
            <section
              aria-live="polite"
              className={`hud-frame rounded-2xl p-6 space-y-4 badge-pop ${evtStyle.border}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase px-2.5 py-0.5 rounded border ${evtStyle.badge}`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                    In-Flight Event · {activeEvent.category} ({activeEvent.phasePercent}%)
                  </span>
                  <h2 className="font-display text-xl font-bold text-white">
                    {activeEvent.title}
                  </h2>
                </div>
                <AlertCircle className={`w-6 h-6 shrink-0 ${evtStyle.text}`} aria-hidden="true" />
              </div>

              <p className="text-sm text-slate-200 leading-relaxed">
                {activeEvent.description}
              </p>

              <p className="text-xs text-cyan-200 bg-[#070b1e] border border-cyan-500/25 rounded-xl p-3.5 leading-relaxed">
                <strong>Engineering Context:</strong> {activeEvent.beginnerContext}
              </p>

              <div className="space-y-2.5">
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Choose Flight Director Response:
                </p>
                {activeEvent.choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleChooseDecision(activeEvent, choice.id)}
                    className="w-full text-left p-4 rounded-xl bg-[#070b1e] hover:bg-[#131b3d] border border-slate-700 hover:border-cyan-400 transition-all space-y-1 cursor-pointer"
                  >
                    <p className="text-sm font-bold text-white">{choice.label}</p>
                    <p className="text-xs text-slate-300">{choice.explanation}</p>
                    <p className="text-[11px] font-mono text-cyan-300 pt-1">
                      Power {choice.powerDelta >= 0 ? `+${choice.powerDelta}` : choice.powerDelta} W ·
                      Comms {choice.commsDelta >= 0 ? `+${choice.commsDelta}` : choice.commsDelta} ·
                      Science {choice.scienceDelta >= 0 ? `+${choice.scienceDelta}` : choice.scienceDelta}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          ) : completed ? (
            <div className="hud-frame border-emerald-400/60 shadow-[0_0_32px_rgba(52,211,153,0.22)] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 badge-pop">
              <div className="space-y-1">
                <p className="text-xs font-mono uppercase text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  Stage 07 · Evaluation Ready
                </p>
                <h2 className="font-display text-xl font-bold text-white">
                  Simulation Sequence Complete
                </h2>
                <p className="text-sm text-slate-200">
                  All orbital phases and flight decisions have been recorded for{' '}
                  <strong>{activeDesign.name}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFinishAndViewReport}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-display font-bold text-sm uppercase tracking-wider whitespace-nowrap cursor-pointer"
              >
                Generate Mission Report
              </button>
            </div>
          ) : (
            <div className="hud-frame rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  {countdown !== null
                    ? `Countdown Active — T-${countdown} to Ignition`
                    : simRunning
                    ? 'Spacecraft En Route — Live Telemetry Active'
                    : 'Ready for Launch Sequence'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Press Launch Mission Simulation to ride the countdown or Advance to Next Event to resolve flight anomalies.
                </p>
              </div>
              <Activity className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Right 5 Cols: Subsystem Status + Timeline + Notifications */}
        <aside className="lg:col-span-5 space-y-5">
          <div className="hud-frame rounded-2xl p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">Destination</p>
              <p className="font-display font-bold text-white mt-0.5">
                {selectedDestination.name}
              </p>
              <p className="text-[11px] text-slate-400">{selectedDestination.distanceLabel}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                Spacecraft Status
              </p>
              <p
                className={`font-semibold text-sm mt-0.5 flex items-center gap-1.5 ${
                  metrics.hasOnboardComputer ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {metrics.hasOnboardComputer ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Avionics Online</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>No Computer</span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-slate-400">{metrics.totalMassKg} kg wet mass</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                Power Status
              </p>
              <p
                className={`font-mono tabular-nums font-semibold text-sm mt-0.5 ${
                  currentPowerW >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {currentPowerW >= 0 ? '+' : ''}
                {currentPowerW} W margin
              </p>
              <p className="text-[11px] text-slate-400">
                {currentPowerW >= 0 ? 'Bus nominal' : 'Brownout risk'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                Comms Status
              </p>
              <p
                className={`font-mono tabular-nums font-semibold text-sm mt-0.5 ${
                  currentComms >= selectedMission.minCommsCapacity
                    ? 'text-cyan-300'
                    : 'text-amber-300'
                }`}
              >
                {currentComms} Mbps eq.
              </p>
              <p className="text-[11px] text-slate-400">
                Req: {selectedMission.minCommsCapacity} Mbps
              </p>
            </div>
          </div>

          {/* Mission Timeline */}
          <div className="hud-frame rounded-2xl p-5 space-y-3 border-violet-500/30">
            <h2 className="font-display text-base font-bold text-white">
              Flight Milestones
            </h2>
            <ol className="space-y-2.5 text-xs">
              {TIMELINE_MILESTONES.map((m) => {
                const reached = progress >= m.pct;
                return (
                  <li key={m.pct} className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-2 ${
                        reached ? 'text-white font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {reached ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />
                      )}
                      {m.label}
                    </span>
                    <span className="font-mono tabular-nums text-slate-400">{m.pct}%</span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Event Notifications Log */}
          <div className="hud-frame rounded-2xl p-5 space-y-3 border-fuchsia-500/30">
            <h2 className="font-display text-base font-bold text-white">
              Mission Comms Feed
            </h2>
            <ul className="space-y-2 max-h-[195px] overflow-y-auto text-xs text-slate-200">
              {notifications.map((note, idx) => (
                <li
                  key={`${idx}-${note.slice(0, 12)}`}
                  className="p-2.5 rounded-xl bg-[#070b1e] border border-slate-800/80 leading-relaxed"
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};
