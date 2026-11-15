import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  CheckSquare,
  Compass,
  Cpu,
  FileText,
  Square,
  Target,
  X,
} from 'lucide-react';
import { useMission } from '../../context/MissionContext';
import { DESTINATION_IMAGES } from '../../data/seedData';
import type { ComponentCategory, DestinationId, DifficultyLevel, Mission } from '../../types/mission';
import { soundFx } from '../../utils/soundFx';
import { TooltipInfo } from '../common/TooltipInfo';

const DESTINATION_FILTERS: { id: 'all' | DestinationId; label: string }[] = [
  { id: 'all', label: 'All Sectors' },
  { id: 'earth', label: 'Earth' },
  { id: 'moon', label: 'The Moon' },
  { id: 'mars', label: 'Mars' },
  { id: 'bennu', label: 'Asteroid Bennu' },
  { id: 'vesta', label: 'Asteroid Vesta' },
];

const DIFFICULTY_STYLES: Record<DifficultyLevel, { cls: string; level: number }> = {
  Beginner: { cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40', level: 1 },
  Intermediate: { cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40', level: 2 },
  Advanced: { cls: 'bg-amber-500/20 text-amber-300 border-amber-400/40', level: 3 },
  Expert: { cls: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/40', level: 4 },
};

const DESTINATION_ACCENTS: Record<string, string> = {
  earth: '#38BDF8',
  moon: '#A78BFA',
  mars: '#FB923C',
  bennu: '#2DD4BF',
  vesta: '#EC4899',
};

const CATEGORY_ACCENTS: Record<string, string> = {
  optics: '#22D3EE',
  science: '#A855F7',
  sensors: '#F59E0B',
};

const renderDifficultyChevrons = (level: number, colorHex: string) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`Difficulty ${level} of 4`}>
    {[1, 2, 3, 4].map((pip) => (
      <span
        key={pip}
        className="w-2 h-3 rounded-[2px] border transition-colors"
        style={{
          backgroundColor: pip <= level ? colorHex : 'rgba(15, 23, 42, 0.7)',
          borderColor: pip <= level ? colorHex : 'rgba(148, 163, 184, 0.28)',
        }}
      />
    ))}
  </span>
);

const renderPayloadCategorySvg = (category: ComponentCategory, accent: string) => (
  <svg
    viewBox="0 0 32 32"
    className="w-8 h-8 shrink-0 rounded-lg bg-[#050819] p-1 border border-white/10"
    aria-hidden="true"
  >
    {category === 'optics' && (
      <>
        <circle cx="16" cy="16" r="8" fill={`${accent}24`} stroke={accent} strokeWidth="1.8" />
        <circle cx="16" cy="16" r="3.5" fill={accent} />
      </>
    )}
    {category === 'sensors' && (
      <>
        <path d="M6 21 C10 11 22 11 26 21" fill="none" stroke={accent} strokeWidth="1.8" />
        <circle cx="16" cy="18" r="2.8" fill={accent} />
        <path d="M10 10 L13 13 M22 10 L19 13" stroke={accent} strokeWidth="1.6" />
      </>
    )}
    {category === 'science' && (
      <>
        <polygon points="16,5 26,24 6,24" fill={`${accent}24`} stroke={accent} strokeWidth="1.8" />
        <line x1="11" y1="18" x2="21" y2="18" stroke={accent} strokeWidth="1.8" />
      </>
    )}
  </svg>
);

export const MissionSelectionPage: React.FC = () => {
  const {
    missions,
    selectedMissionId,
    selectMission,
    selectedMission,
    objectives,
    selectedObjectiveIds,
    toggleObjective,
    applyRecommendedObjectives,
    activeDesign,
    components,
    setActivePage,
  } = useMission();

  const [destFilter, setDestFilter] = useState<'all' | DestinationId>('all');
  const [briefingMission, setBriefingMission] = useState<Mission | null>(null);

  useEffect(() => {
    if (!briefingMission) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBriefingMission(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [briefingMission]);

  const installedCategories = useMemo(() => {
    const set = new Set<ComponentCategory>();
    for (const item of activeDesign.items) {
      if (item.quantity <= 0) continue;
      const comp = components.find((c) => c.id === item.componentId);
      if (comp) set.add(comp.category);
    }
    return set;
  }, [activeDesign.items, components]);

  const visibleMissions =
    destFilter === 'all'
      ? missions
      : missions.filter((m) => m.destinationId === destFilter);

  const selectedAccent = DESTINATION_ACCENTS[selectedMission.destinationId] || '#22D3EE';
  const selectedDiff = DIFFICULTY_STYLES[selectedMission.difficulty];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-fuchsia-300">
            Sector 02 · Campaign Contracts &amp; Scientific Loadout
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            Mission Selection &amp; Scientific Objectives
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Lock an expedition contract from Beginner orbiters to Expert Main-Belt campaigns, then arm
            your science instruments before entering the Spacecraft Lab.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playClick(620);
            setActivePage('spacecraft-lab');
          }}
          className="menu-blade glow-cta px-6 py-3 font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Cpu className="w-4 h-4" aria-hidden="true" />
          <span>Design Spacecraft in Lab</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Active Contract Tactical HUD Strip */}
      <section className="hud-frame rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 rounded-xl overflow-hidden border shrink-0 bg-slate-900" style={{ borderColor: selectedAccent }}>
            <img
              src={DESTINATION_IMAGES[selectedMission.destinationId]}
              alt={`${selectedMission.destinationName} armed target`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
              <span className="uppercase tracking-wider" style={{ color: selectedAccent }}>
                Armed Contract · {selectedMission.destinationName}
              </span>
              <span className="text-slate-600">/</span>
              {renderDifficultyChevrons(selectedDiff.level, selectedAccent)}
              <span className="text-slate-300">{selectedMission.difficulty}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-white truncate mt-0.5">
              {selectedMission.name}
            </h2>
            <p className="text-xs text-slate-300 truncate">
              {selectedMission.primaryObjectiveSummary}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:shrink-0 text-xs">
          <div className="px-3 py-2 rounded-lg bg-[#050819]/85 border border-slate-800">
            <span className="text-slate-400 block font-mono uppercase text-[10px]">Budget Cap</span>
            <span className="font-mono font-bold text-cyan-300 tabular-nums">
              ${selectedMission.budgetLimitM}M
            </span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-[#050819]/85 border border-slate-800">
            <span className="text-slate-400 block font-mono uppercase text-[10px]">Mass Limit</span>
            <span className="font-mono font-bold text-white tabular-nums">
              {selectedMission.massLimitKg} kg
            </span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-[#050819]/85 border border-slate-800">
            <span className="text-slate-400 block font-mono uppercase text-[10px]">Min Comms</span>
            <span className="font-mono font-bold text-violet-300 tabular-nums">
              {selectedMission.minCommsCapacity} Mbps
            </span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-[#050819]/85 border border-slate-800">
            <span className="text-slate-400 block font-mono uppercase text-[10px]">Science Goals</span>
            <span className="font-mono font-bold text-emerald-300 tabular-nums">
              {selectedObjectiveIds.length} Armed
            </span>
          </div>
        </div>
      </section>

      {/* Part 1: Video-Game Mission Contracts */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-300" aria-hidden="true" />
            1. Choose Your Expedition
          </h2>

          {/* Destination Filter Bar */}
          <div
            role="group"
            aria-label="Filter missions by destination"
            className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#090d22] border border-violet-500/25"
          >
            {DESTINATION_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  soundFx.playClick(480);
                  setDestFilter(f.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  destFilter === f.id
                    ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleMissions.map((mission) => {
            const active = mission.id === selectedMissionId;
            const accent = DESTINATION_ACCENTS[mission.destinationId] || '#22D3EE';
            const diffInfo = DIFFICULTY_STYLES[mission.difficulty];
            return (
              <div
                key={mission.id}
                className={`hud-frame rounded-2xl overflow-hidden flex flex-col justify-between transition-all ${
                  active ? '-translate-y-0.5' : 'hover:-translate-y-0.5'
                }`}
                style={{
                  borderColor: active ? accent : `${accent}3D`,
                  boxShadow: active
                    ? `0 0 34px ${accent}38`
                    : '0 14px 32px -12px rgba(4, 6, 20, 0.72)',
                }}
              >
                <div>
                  {/* Planetary Banner Artwork */}
                  <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                    <img
                      src={DESTINATION_IMAGES[mission.destinationId]}
                      alt={`${mission.destinationName} mission environment`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090d22] via-[#090d22]/45 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-2 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border ${diffInfo.cls}`}
                      >
                        {mission.difficulty}
                        {renderDifficultyChevrons(diffInfo.level, accent)}
                      </span>
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-[#050716]/85 border border-white/15 text-amber-300">
                        +{mission.rewardXp ?? 200} XP
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-mono font-semibold uppercase tracking-wider"
                        style={{ color: accent }}
                      >
                        {mission.destinationName}
                      </span>
                      <span className="text-xs font-mono text-slate-300">
                        {mission.estimatedDurationDays} days
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-display text-xl font-bold text-white leading-snug">
                      {mission.name}
                    </h3>

                    <p className="text-xs font-semibold text-cyan-300">
                      Goal: {mission.primaryObjectiveSummary}
                    </p>

                    <p className="text-sm text-slate-300 leading-relaxed">
                      {mission.description}
                    </p>

                    {mission.requiresLandingSystem && (
                      <p className="text-[11px] font-mono text-pink-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        Requires Precision Landing System
                      </p>
                    )}

                    {mission.rewardTitle && (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-amber-200 pt-0.5">
                        <Award className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
                        <span>Reward: {mission.rewardTitle}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5 space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">Budget Cap</span>
                      <span className="font-mono tabular-nums font-semibold text-white">
                        ${mission.budgetLimitM}M
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Mass Limit</span>
                      <span className="font-mono tabular-nums font-semibold text-white">
                        {mission.massLimitKg} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Min Comms</span>
                      <span className="font-mono tabular-nums font-semibold text-white">
                        {mission.minCommsCapacity} Mbps
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick(540);
                        setBriefingMission(mission);
                      }}
                      className="py-2 px-3 rounded-lg bg-[#0d1433] hover:bg-[#172252] border border-slate-700 hover:border-cyan-400/60 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                      Briefing
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick(680);
                        selectMission(mission.id);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        active
                          ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {active ? (
                        <>
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          Selected
                        </>
                      ) : (
                        'Select Mission'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Part 2: Scientific Objectives Loadout Bay */}
      <section className="space-y-4 pt-6 border-t border-violet-500/25">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-fuchsia-300" aria-hidden="true" />
              2. Scientific Objectives for {selectedMission.name}
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Active Goals:{' '}
              <span className="font-mono font-semibold text-cyan-300">
                {selectedObjectiveIds.length}
              </span>{' '}
              selected · Cross-checked live against instruments currently mounted on{' '}
              <span className="text-white font-semibold">{activeDesign.name}</span>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick(580);
              applyRecommendedObjectives(selectedMission.id);
            }}
            className="px-4 py-2 rounded-lg bg-[#11193b] hover:bg-[#192452] text-xs font-semibold text-cyan-300 border border-cyan-500/35 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Reset to Recommended Goals
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {objectives.map((obj) => {
            const selected = selectedObjectiveIds.includes(obj.id);
            const recommended = obj.recommendedDestinations.includes(
              selectedMission.destinationId
            );
            const hasHardware = installedCategories.has(obj.requiredCategory);
            const catColor = CATEGORY_ACCENTS[obj.requiredCategory] || '#22D3EE';
            return (
              <div
                key={obj.id}
                className={`hud-frame rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all ${
                  selected ? 'border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.18)]' : ''
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-[11px] font-mono font-semibold"
                      style={{ color: recommended ? '#FACC15' : '#94a3b8' }}
                    >
                      {recommended ? 'Priority Target · ' : ''}
                      +{obj.sciencePoints} sci pts
                    </span>
                    {selected ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    {renderPayloadCategorySvg(obj.requiredCategory, catColor)}
                    <h3 className="font-display text-base font-bold text-white leading-snug">
                      {obj.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{obj.shortDesc}</p>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
                  <p className="text-slate-300 leading-relaxed">{obj.beginnerExplanation}</p>

                  <div className="flex items-center justify-between gap-1 font-mono">
                    <div className="flex items-center" style={{ color: catColor }}>
                      <span>Needs: {obj.requiredCategory}</span>
                      <TooltipInfo
                        term="Required Hardware Category"
                        explanation={`Install at least one component in the "${obj.requiredCategory}" category inside the Spacecraft Laboratory to achieve ${obj.name}.`}
                      />
                    </div>
                    {hasHardware ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                        Armed
                      </span>
                    ) : (
                      <span className="text-amber-300">Add in Lab</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick(selected ? 420 : 640);
                      toggleObjective(obj.id);
                    }}
                    aria-pressed={selected}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {selected ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        Objective Selected
                      </>
                    ) : (
                      `Include ${obj.name}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Mission Briefing Modal */}
      {briefingMission && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="briefing-modal-title"
          className="fixed inset-0 z-50 bg-[#040613]/85 flex items-center justify-center p-4"
        >
          <div className="hud-frame rounded-2xl max-w-2xl w-full overflow-hidden border border-cyan-400/50 shadow-[0_0_50px_rgba(34,211,238,0.25)] badge-pop">
            <div className="relative h-44 w-full overflow-hidden bg-slate-900">
              <img
                src={DESTINATION_IMAGES[briefingMission.destinationId]}
                alt={`${briefingMission.destinationName} briefing header`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090d22] via-[#090d22]/45 to-transparent" />
              <button
                type="button"
                aria-label="Close mission briefing"
                onClick={() => setBriefingMission(null)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-[#050716]/85 border border-white/15 text-slate-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
              <div className="absolute bottom-3 left-6 right-6">
                <span
                  className={`inline-block text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border mb-1.5 ${DIFFICULTY_STYLES[briefingMission.difficulty].cls}`}
                >
                  {briefingMission.difficulty} · {briefingMission.destinationName}
                </span>
                <h2
                  id="briefing-modal-title"
                  className="font-display text-2xl sm:text-3xl font-bold text-white"
                >
                  {briefingMission.name}
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-200 leading-relaxed">
                {briefingMission.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#070b1e] border border-slate-800">
                  <span className="text-slate-400 block">Duration</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {briefingMission.estimatedDurationDays} days
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#070b1e] border border-slate-800">
                  <span className="text-slate-400 block">Budget Cap</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    ${briefingMission.budgetLimitM}M
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#070b1e] border border-slate-800">
                  <span className="text-slate-400 block">Mass Limit</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {briefingMission.massLimitKg} kg
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#070b1e] border border-slate-800">
                  <span className="text-slate-400 block">Reward</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    +{briefingMission.rewardXp ?? 200} XP
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#070b1e] border border-violet-500/30 space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-violet-300">
                  Primary Objectives &amp; Hardware Notes
                </p>
                <p className="text-sm text-slate-200">
                  {briefingMission.primaryObjectiveSummary}
                </p>
                {briefingMission.requiresLandingSystem && (
                  <p className="text-xs font-semibold text-amber-300">
                    Mandatory Requirement: Equip a Precision Landing System in the Spacecraft Lab.
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick(580);
                    selectMission(briefingMission.id);
                    setBriefingMission(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
                >
                  Accept &amp; Customize Objectives
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick(680);
                    selectMission(briefingMission.id);
                    setBriefingMission(null);
                    setActivePage('spacecraft-lab');
                  }}
                  className="menu-blade w-full sm:w-auto glow-cta px-5 py-2.5 font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Accept &amp; Enter Spacecraft Lab</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
