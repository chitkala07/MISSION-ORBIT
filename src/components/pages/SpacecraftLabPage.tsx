import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useMission } from '../../context/MissionContext';
import type { ComponentCategory } from '../../types/mission';
import { soundFx } from '../../utils/soundFx';
import { RadialGauge } from '../common/RadialGauge';
import { TooltipInfo } from '../common/TooltipInfo';
import { SpacecraftScene } from '../three/SpacecraftScene';

type SubsystemTab = 'all' | 'core' | 'flight' | 'science';

const SUBSYSTEM_TABS: { id: SubsystemTab; label: string }[] = [
  { id: 'all', label: 'All Subsystems (10)' },
  { id: 'core', label: 'Power & Avionics' },
  { id: 'flight', label: 'Comms, Propulsion & Thermal' },
  { id: 'science', label: 'Science & Landing' },
];

const CATEGORY_STYLES: Record<
  ComponentCategory,
  { accent: string; badge: string; tab: SubsystemTab }
> = {
  avionics: { accent: '#22D3EE', badge: 'Avionics', tab: 'core' },
  'power-gen': { accent: '#FACC15', badge: 'Solar Power', tab: 'core' },
  'power-storage': { accent: '#34D399', badge: 'Energy Storage', tab: 'core' },
  comms: { accent: '#38BDF8', badge: 'Deep Space Comms', tab: 'flight' },
  propulsion: { accent: '#EC4899', badge: 'Propulsion', tab: 'flight' },
  thermal: { accent: '#FB923C', badge: 'Thermal Control', tab: 'flight' },
  optics: { accent: '#67E8F9', badge: 'Imaging Optics', tab: 'science' },
  sensors: { accent: '#A78BFA', badge: 'Science Sensors', tab: 'science' },
  science: { accent: '#C084FC', badge: 'Spectrometry', tab: 'science' },
  landing: { accent: '#F472B6', badge: 'Surface Landing', tab: 'science' },
};

const renderSubsystemSvg = (category: ComponentCategory, accent: string) => (
  <svg
    viewBox="0 0 36 36"
    className="w-9 h-9 shrink-0 rounded-lg bg-[#070b1e] p-1.5 border border-white/10"
    aria-hidden="true"
  >
    {category === 'avionics' && (
      <>
        <rect x="9" y="9" width="18" height="18" rx="2" fill="none" stroke={accent} strokeWidth="2" />
        <rect x="14" y="14" width="8" height="8" fill={accent} />
        <path d="M5 13 H9 M5 23 H9 M27 13 H31 M27 23 H31" stroke={accent} strokeWidth="1.8" />
      </>
    )}
    {category === 'power-gen' && (
      <>
        <polygon points="4,13 15,10 15,26 4,23" fill={`${accent}33`} stroke={accent} strokeWidth="1.8" />
        <polygon points="32,13 21,10 21,26 32,23" fill={`${accent}33`} stroke={accent} strokeWidth="1.8" />
        <rect x="16" y="13" width="4" height="10" fill={accent} />
      </>
    )}
    {category === 'power-storage' && (
      <>
        <rect x="10" y="9" width="16" height="20" rx="2" fill="none" stroke={accent} strokeWidth="2" />
        <rect x="15" y="6" width="6" height="3" fill={accent} />
        <path d="M19 13 L14 20 H18 L17 26 L22 18 H18 Z" fill={accent} />
      </>
    )}
    {category === 'comms' && (
      <>
        <path d="M8 22 C11 11 25 11 28 22" fill="none" stroke={accent} strokeWidth="2.2" />
        <line x1="18" y1="14" x2="18" y2="28" stroke={accent} strokeWidth="2" />
        <circle cx="18" cy="10" r="2.2" fill={accent} />
      </>
    )}
    {category === 'propulsion' && (
      <>
        <polygon points="14,8 22,8 25,18 11,18" fill="none" stroke={accent} strokeWidth="2" />
        <polygon points="13,20 23,20 18,30" fill={accent} />
      </>
    )}
    {category === 'thermal' && (
      <>
        <rect x="8" y="8" width="20" height="20" rx="2" fill="none" stroke={accent} strokeWidth="2" />
        <path d="M11 14 H25 M11 18 H25 M11 22 H25" stroke={accent} strokeWidth="2" />
      </>
    )}
    {category === 'optics' && (
      <>
        <circle cx="18" cy="18" r="9" fill="none" stroke={accent} strokeWidth="2" />
        <circle cx="18" cy="18" r="4.5" fill={`${accent}44`} stroke={accent} strokeWidth="1.6" />
      </>
    )}
    {category === 'sensors' && (
      <>
        <path d="M8 24 Q14 10 18 18 T28 12" fill="none" stroke={accent} strokeWidth="2.2" />
        <circle cx="28" cy="12" r="2.3" fill={accent} />
      </>
    )}
    {category === 'science' && (
      <>
        <polygon points="18,6 28,15 24,29 12,29 8,15" fill={`${accent}28`} stroke={accent} strokeWidth="2" />
        <circle cx="18" cy="18" r="3" fill={accent} />
      </>
    )}
    {category === 'landing' && (
      <>
        <rect x="12" y="10" width="12" height="8" rx="1.5" fill="none" stroke={accent} strokeWidth="2" />
        <path d="M13 18 L7 28 M23 18 L29 28 M5 28 H10 M26 28 H31" stroke={accent} strokeWidth="2" />
      </>
    )}
  </svg>
);

export const SpacecraftLabPage: React.FC = () => {
  const {
    components,
    activeDesign,
    savedDesigns,
    updateSpacecraftName,
    setComponentQuantity,
    saveCurrentDesign,
    loadSavedDesign,
    resetSpacecraftToStarter,
    autoOptimizeForMission,
    selectedMission,
    selectedDestination,
    selectedRocket,
    metrics,
    lastComponentPulse,
    setActivePage,
  } = useMission();

  const [recentAddedName, setRecentAddedName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SubsystemTab>('all');

  useEffect(() => {
    if (!lastComponentPulse) return;
    setRecentAddedName(lastComponentPulse.name);
    const t = window.setTimeout(() => setRecentAddedName(null), 3200);
    return () => window.clearTimeout(t);
  }, [lastComponentPulse]);

  const getQty = (id: string) =>
    activeDesign.items.find((i) => i.componentId === id)?.quantity ?? 0;

  const massPct = Math.min(
    100,
    Math.round((metrics.totalMassKg / Math.max(1, selectedMission.massLimitKg)) * 100)
  );
  const budgetPct = Math.min(
    100,
    Math.round((metrics.totalCostM / Math.max(1, selectedMission.budgetLimitM)) * 100)
  );
  const commsPct = Math.min(
    100,
    Math.round((metrics.totalCommsCapacity / Math.max(1, selectedMission.minCommsCapacity)) * 100)
  );
  const powerReservePct =
    metrics.availablePowerW >= 0
      ? Math.min(100, 60 + Math.round((metrics.availablePowerW / 240) * 40))
      : Math.max(8, 35 + Math.round(metrics.availablePowerW / 10));

  const criticalCount = metrics.warnings.filter((w) => w.severity === 'critical').length;
  const warningCount = metrics.warnings.filter((w) => w.severity === 'warning').length;
  const efficiencyScore = Math.max(
    20,
    Math.min(
      100,
      Math.round(
        100 -
          criticalCount * 22 -
          warningCount * 8 -
          (metrics.remainingBudgetM < 0 ? 15 : 0) +
          (metrics.availablePowerW >= 60 ? 4 : 0)
      )
    )
  );

  const maxPowerBar = Math.max(100, metrics.effectivePowerGenW, metrics.totalPowerDrawW);

  const filteredComponents =
    activeTab === 'all'
      ? components
      : components.filter((c) => CATEGORY_STYLES[c.category].tab === activeTab);

  const getSmartFixAction = (
    code: string
  ): { label: string; apply: () => void } | null => {
    if (code === 'POWER_DEFICIT' || code === 'CRITICAL_POWER') {
      const qty = getQty('comp-solar');
      if (qty < 6) {
        return {
          label: '+1 Solar Panel',
          apply: () => {
            soundFx.playClick(660);
            setComponentQuantity('comp-solar', qty + 1);
          },
        };
      }
    }
    if (code === 'NO_COMPUTER') {
      return {
        label: '+1 Flight Computer',
        apply: () => {
          soundFx.playClick(660);
          setComponentQuantity('comp-computer', 1);
        },
      };
    }
    if (code === 'LOW_COMMS') {
      const qty = getQty('comp-antenna');
      if (qty < 3) {
        return {
          label: '+1 High-Gain Dish',
          apply: () => {
            soundFx.playClick(660);
            setComponentQuantity('comp-antenna', qty + 1);
          },
        };
      }
    }
    if (code === 'NO_LANDER') {
      return {
        label: '+1 Landing System',
        apply: () => {
          soundFx.playClick(660);
          setComponentQuantity('comp-lander', 1);
        },
      };
    }
    return null;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header + Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-300">
            Sector 03 · 3D Spacecraft Hangar &amp; Telemetry
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            Spacecraft Laboratory &amp; Engineering Gauges
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Mission: <strong className="text-cyan-300">{selectedMission.name}</strong> ({selectedDestination.name}) ·
            Modular parts snap onto the 3D craft in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick(680);
              autoOptimizeForMission();
            }}
            className="px-3.5 py-2 rounded-xl bg-[#11193b] hover:bg-[#192556] border border-cyan-500/40 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Auto-Fit for Mission
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick(420);
              resetSpacecraftToStarter();
            }}
            className="px-3.5 py-2 rounded-xl bg-[#11193b] hover:bg-[#192556] border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset
          </button>

          <button
            type="button"
            onClick={() => setActivePage('rocket-orbit')}
            className="glow-cta px-5 py-2.5 rounded-xl font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <span>Choose Rocket &amp; Orbit</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Main Split: 3D Spacecraft Hangar (7 cols) + Engineering Dashboard (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="hud-frame rounded-2xl p-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              <label
                htmlFor="spacecraft-name-input"
                className="block text-xs font-mono text-slate-400 mb-1"
              >
                Spacecraft Name
              </label>
              <input
                id="spacecraft-name-input"
                type="text"
                value={activeDesign.name}
                onChange={(e) => updateSpacecraftName(e.target.value)}
                placeholder="Enter spacecraft name"
                className="w-full px-3 py-2 rounded-lg bg-[#050819] border border-slate-700 text-sm text-white focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="load-design-select" className="sr-only">
                Load saved spacecraft design
              </label>
              <select
                id="load-design-select"
                value=""
                onChange={(e) => {
                  if (e.target.value) loadSavedDesign(e.target.value);
                }}
                className="px-3 py-2 rounded-lg bg-[#050819] border border-slate-700 text-xs text-slate-200 max-w-[170px]"
              >
                <option value="">Load Saved ({savedDesigns.length})</option>
                {savedDesigns.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={saveCurrentDesign}
                className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                Save Design
              </button>
            </div>
          </div>

          <div className="relative">
            <SpacecraftScene
              items={activeDesign.items}
              destinationId={selectedDestination.id}
              highlightPulseKey={lastComponentPulse?.ts ?? 0}
            />

            {recentAddedName && (
              <div
                role="status"
                aria-live="polite"
                className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg webgl-hud-panel border border-emerald-400/60 text-xs font-semibold text-emerald-300 badge-pop pointer-events-none"
              >
                Module Installed: {recentAddedName}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Engineering Dashboard with Circular Gauges + Quick-Fix Alerts */}
        <aside
          aria-label="Live Engineering Dashboard"
          className="lg:col-span-5 hud-frame rounded-2xl p-5 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Engineering Dashboard
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Efficiency Index:{' '}
                <strong className="text-cyan-300">{efficiencyScore}%</strong> · Rocket cap{' '}
                {selectedRocket.payloadCapacityKg} kg
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold ${
                metrics.launchReady ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {metrics.launchReady ? (
                <>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Launch Ready
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  Needs Tuning
                </>
              )}
            </span>
          </div>

          {/* 4 Radial Circular Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4 py-1">
            <RadialGauge
              label="Mass Budget"
              valueText={`${metrics.totalMassKg} kg`}
              sublabel={`Cap ${selectedMission.massLimitKg} kg`}
              percent={massPct}
              colorHex={
                metrics.totalMassKg > selectedMission.massLimitKg || !metrics.rocketPayloadCompatible
                  ? '#F43F5E'
                  : massPct > 85
                  ? '#FBBF24'
                  : '#22D3EE'
              }
            />
            <RadialGauge
              label="Power Balance"
              valueText={`${metrics.availablePowerW >= 0 ? '+' : ''}${metrics.availablePowerW}W`}
              sublabel={`${Math.round(selectedDestination.solarEfficiencyFactor * 100)}% sun`}
              percent={powerReservePct}
              colorHex={
                metrics.availablePowerW >= 40
                  ? '#34D399'
                  : metrics.availablePowerW >= 0
                  ? '#FBBF24'
                  : '#F43F5E'
              }
            />
            <RadialGauge
              label="Mission Budget"
              valueText={`$${metrics.totalCostM}M`}
              sublabel={`$${metrics.remainingBudgetM}M left`}
              percent={budgetPct}
              colorHex={metrics.remainingBudgetM < 0 ? '#F43F5E' : '#A855F7'}
            />
            <RadialGauge
              label="Comms Bandwidth"
              valueText={`${metrics.totalCommsCapacity} Mb`}
              sublabel={`Req ${selectedMission.minCommsCapacity} Mbps`}
              percent={commsPct}
              colorHex={
                metrics.totalCommsCapacity >= selectedMission.minCommsCapacity
                  ? '#38BDF8'
                  : '#FBBF24'
              }
            />
          </div>

          {/* Power Generation vs Consumption Bars */}
          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200 font-medium flex items-center">
                Power Generation vs Draw
                <TooltipInfo
                  term="Available Power"
                  explanation="Effective generated power (solar panels scaled by planet distance + battery reserve) minus total power consumed by all components."
                />
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                Craft ${metrics.spacecraftCostM}M + Launch ${metrics.launchCostM}M
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className="w-20 text-slate-400 shrink-0">Supply</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                    style={{
                      width: `${Math.round((metrics.effectivePowerGenW / maxPowerBar) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-14 text-right tabular-nums text-emerald-300">
                  {metrics.effectivePowerGenW} W
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 text-slate-400 shrink-0">Demand</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-400 to-pink-400 transition-all"
                    style={{
                      width: `${Math.round((metrics.totalPowerDrawW / maxPowerBar) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-14 text-right tabular-nums text-pink-300">
                  {metrics.totalPowerDrawW} W
                </span>
              </div>
            </div>
          </div>

          {/* Engineering Constraint Alerts with 1-Click Quick Fix */}
          <div className="pt-3 border-t border-slate-800 space-y-2 max-h-[240px] overflow-y-auto pr-1">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Flight Readiness Alerts ({metrics.warnings.length})
            </h3>

            {metrics.warnings.length === 0 ? (
              <div className="p-3 rounded-xl bg-emerald-500/12 border border-emerald-400/40 text-xs text-emerald-200 flex items-start gap-2 badge-pop">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  All mass, power, budget, comms, and science payload checks passed! Ready for Rocket &amp; Orbit selection.
                </span>
              </div>
            ) : (
              metrics.warnings.map((w) => {
                const fix = getSmartFixAction(w.code);
                return (
                  <div
                    key={w.code}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 badge-pop ${
                      w.severity === 'critical'
                        ? 'bg-rose-500/14 border-rose-400/50 text-rose-100 shadow-[0_0_16px_rgba(244,63,94,0.18)]'
                        : 'bg-amber-500/12 border-amber-400/45 text-amber-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold flex items-center gap-1.5">
                        {w.severity === 'critical' ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
                        ) : (
                          <AlertTriangle
                            className="w-3.5 h-3.5 text-amber-400 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        {w.title}
                      </p>
                      {fix && (
                        <button
                          type="button"
                          onClick={fix.apply}
                          className="px-2.5 py-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-[11px] font-semibold text-cyan-200 flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Wrench className="w-3 h-3" aria-hidden="true" />
                          {fix.label}
                        </button>
                      )}
                    </div>
                    <p className="text-slate-300">{w.fixHint}</p>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {/* Component Catalog Builder Grid with Game Category Tabs */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              Spacecraft Subsystems &amp; Instruments Bay
            </h2>
            <p className="text-sm text-slate-300">
              Equip hardware modules below to snap them onto your 3D spacecraft. Science Payload:{' '}
              <strong className="text-fuchsia-300 font-mono">{metrics.totalScienceValue} pts</strong>
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter spacecraft subsystems"
            className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#090d22] border border-violet-500/30"
          >
            {SUBSYSTEM_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredComponents.map((comp) => {
            const qty = getQty(comp.id);
            const active = qty > 0;
            const cat = CATEGORY_STYLES[comp.category];
            return (
              <div
                key={comp.id}
                className="game-panel rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all"
                style={{
                  borderColor: active ? `${cat.accent}88` : 'rgba(148, 163, 184, 0.2)',
                  boxShadow: active ? `0 0 22px ${cat.accent}1f` : undefined,
                }}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      {renderSubsystemSvg(comp.category, cat.accent)}
                      <div className="min-w-0">
                        <span
                          className="text-[11px] font-mono uppercase tracking-wider font-semibold"
                          style={{ color: cat.accent }}
                        >
                          {cat.badge}
                        </span>
                        <h3 className="font-display text-base font-bold text-white leading-snug">
                          {comp.name}
                        </h3>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1 bg-[#050819] border border-slate-700 rounded-lg p-1 shrink-0">
                      <button
                        type="button"
                        aria-label={`Remove ${comp.name}`}
                        disabled={qty <= 0}
                        onClick={() => {
                          soundFx.playClick(420);
                          setComponentQuantity(comp.id, qty - 1);
                        }}
                        className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:bg-slate-800 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <span
                        data-testid={`qty-${comp.id}`}
                        className="w-6 text-center font-mono tabular-nums text-sm font-bold text-white"
                      >
                        {qty}
                      </span>
                      <button
                        type="button"
                        aria-label={`Add ${comp.name}`}
                        disabled={qty >= comp.maxQuantity}
                        onClick={() => {
                          soundFx.playClick(620);
                          setComponentQuantity(comp.id, qty + 1);
                        }}
                        className="w-7 h-7 rounded flex items-center justify-center text-cyan-300 hover:bg-slate-800 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {comp.shortExplanation}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block">Mass</span>
                    <span className="tabular-nums text-white">{comp.massKg} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Power</span>
                    <span
                      className={`tabular-nums ${
                        comp.powerGenW > comp.powerDrawW ? 'text-emerald-400' : 'text-blue-300'
                      }`}
                    >
                      {comp.powerGenW > 0 ? `+${comp.powerGenW}` : `-${comp.powerDrawW}`} W
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cost</span>
                    <span className="tabular-nums text-white">${comp.costM}M</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      {comp.commsCapacity > 0 ? 'Comms' : 'Science'}
                    </span>
                    <span className="tabular-nums text-cyan-300">
                      {comp.commsCapacity > 0
                        ? `${comp.commsCapacity} Mbps`
                        : `${comp.scienceValue} pts`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
