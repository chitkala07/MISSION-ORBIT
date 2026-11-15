import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type {
  CelestialBody,
  DestinationId,
  EngineeringMetrics,
  EventDecisionRecord,
  LaunchVehicle,
  Mission,
  MissionReport,
  OrbitOption,
  PageRoute,
  ScientificObjective,
  SpacecraftComponent,
  SpacecraftDesign,
  UserProfile,
} from '../types/mission';
import {
  CELESTIAL_BODIES,
  DEFAULT_SPACECRAFT_DESIGN,
  LAUNCH_VEHICLES,
  MISSIONS,
  ORBIT_OPTIONS,
  SCIENTIFIC_OBJECTIVES,
  SPACECRAFT_COMPONENTS,
} from '../data/seedData';
import {
  calculateEngineeringMetrics,
  runDeterministicSimulation,
} from '../engine/simulationEngine';
import {
  computePlayerProgression,
  type PlayerProgression,
} from '../engine/progressionEngine';
import { apiClient } from '../services/apiClient';

const EXPLORED_STORAGE_KEY = 'mission_orbit_explored_v1';

interface MissionContextValue {
  activePage: PageRoute;
  setActivePage: (page: PageRoute) => void;
  destinations: CelestialBody[];
  missions: Mission[];
  objectives: ScientificObjective[];
  components: SpacecraftComponent[];
  rockets: LaunchVehicle[];
  orbits: OrbitOption[];

  selectedDestinationId: DestinationId;
  selectDestination: (id: DestinationId) => void;

  selectedMissionId: string;
  selectMission: (id: string) => void;

  selectedObjectiveIds: string[];
  toggleObjective: (id: string) => void;
  applyRecommendedObjectives: (missionId: string) => void;

  activeDesign: SpacecraftDesign;
  savedDesigns: SpacecraftDesign[];
  updateSpacecraftName: (name: string) => void;
  setComponentQuantity: (componentId: string, quantity: number) => void;
  saveCurrentDesign: () => void;
  loadSavedDesign: (designId: string) => void;
  resetSpacecraftToStarter: () => void;
  autoOptimizeForMission: () => void;

  selectedRocketId: string;
  selectRocket: (id: string) => void;

  selectedOrbitId: string;
  selectOrbit: (id: string) => void;

  selectedDestination: CelestialBody;
  selectedMission: Mission;
  selectedObjectives: ScientificObjective[];
  selectedRocket: LaunchVehicle;
  selectedOrbit: OrbitOption;
  metrics: EngineeringMetrics;

  reports: MissionReport[];
  latestReport: MissionReport | null;
  setLatestReport: (report: MissionReport | null) => void;
  executeSimulationAndSave: (decisions: EventDecisionRecord[]) => MissionReport;

  userProfile: UserProfile;
  updateUserProfile: (profile: UserProfile) => void;

  exploredDestinations: DestinationId[];
  playerProgression: PlayerProgression;
  lastComponentPulse: { componentId: string; name: string; ts: number } | null;

  toastMessage: { type: 'success' | 'warning' | 'info'; text: string } | null;
  showToast: (type: 'success' | 'warning' | 'info', text: string) => void;
  clearToast: () => void;
}

const MissionContext = createContext<MissionContextValue | null>(null);

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialActive = useMemo(() => apiClient.loadActiveState(), []);

  const [activePage, setActivePageState] = useState<PageRoute>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return 'solar-system';
    return 'headquarters';
  });

  const setActivePage = (page: PageRoute) => {
    setActivePageState(page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const [selectedDestinationId, setSelectedDestinationId] = useState<DestinationId>(
    (initialActive.selectedDestinationId as DestinationId) || 'mars'
  );
  const [selectedMissionId, setSelectedMissionId] = useState<string>(
    initialActive.selectedMissionId || 'mission-mars-recon'
  );
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>(
    initialActive.selectedObjectiveIds || ['obj-water-ice', 'obj-atmospheric-obs', 'obj-surface-photo']
  );
  const [activeDesign, setActiveDesign] = useState<SpacecraftDesign>(
    initialActive.activeDesign || { ...DEFAULT_SPACECRAFT_DESIGN }
  );
  const [savedDesigns, setSavedDesigns] = useState<SpacecraftDesign[]>(() =>
    apiClient.loadSavedDesigns()
  );
  const [selectedRocketId, setSelectedRocketId] = useState<string>(
    initialActive.selectedRocketId || 'rocket-astra'
  );
  const [selectedOrbitId, setSelectedOrbitId] = useState<string>(
    initialActive.selectedOrbitId || 'orbit-mars-polar'
  );

  const [reports, setReports] = useState<MissionReport[]>(() => apiClient.loadReports());
  const [latestReport, setLatestReport] = useState<MissionReport | null>(() => {
    const loaded = apiClient.loadReports();
    return loaded.length > 0 ? loaded[0] : null;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    apiClient.loadUserProfile()
  );

  const [exploredDestinations, setExploredDestinations] = useState<DestinationId[]>(() => {
    try {
      const raw = localStorage.getItem(EXPLORED_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as DestinationId[];
    } catch {
      // ignore storage failure
    }
    return ['earth', 'moon', 'mars'];
  });

  const [lastComponentPulse, setLastComponentPulse] = useState<{
    componentId: string;
    name: string;
    ts: number;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'info';
    text: string;
  } | null>(null);

  const showToast = (type: 'success' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
  };
  const clearToast = () => setToastMessage(null);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  // Persist active mission configuration whenever user changes selections
  useEffect(() => {
    apiClient.saveActiveState({
      selectedDestinationId,
      selectedMissionId,
      selectedObjectiveIds,
      activeDesign,
      selectedRocketId,
      selectedOrbitId,
    });
  }, [
    selectedDestinationId,
    selectedMissionId,
    selectedObjectiveIds,
    activeDesign,
    selectedRocketId,
    selectedOrbitId,
  ]);

  const selectedDestination = useMemo(
    () =>
      CELESTIAL_BODIES.find((b) => b.id === selectedDestinationId) || CELESTIAL_BODIES[3],
    [selectedDestinationId]
  );

  const selectedMission = useMemo(
    () => MISSIONS.find((m) => m.id === selectedMissionId) || MISSIONS[2],
    [selectedMissionId]
  );

  const selectedObjectives = useMemo(
    () => SCIENTIFIC_OBJECTIVES.filter((o) => selectedObjectiveIds.includes(o.id)),
    [selectedObjectiveIds]
  );

  const selectedRocket = useMemo(
    () => LAUNCH_VEHICLES.find((r) => r.id === selectedRocketId) || LAUNCH_VEHICLES[1],
    [selectedRocketId]
  );

  const selectedOrbit = useMemo(
    () => ORBIT_OPTIONS.find((o) => o.id === selectedOrbitId) || ORBIT_OPTIONS[2],
    [selectedOrbitId]
  );

  const metrics = useMemo(
    () =>
      calculateEngineeringMetrics({
        design: activeDesign,
        catalog: SPACECRAFT_COMPONENTS,
        mission: selectedMission,
        destination: selectedDestination,
        selectedObjectives,
        rocket: selectedRocket,
        orbit: selectedOrbit,
      }),
    [
      activeDesign,
      selectedMission,
      selectedDestination,
      selectedObjectives,
      selectedRocket,
      selectedOrbit,
    ]
  );

  const markDestinationExplored = (id: DestinationId) => {
    if (id === 'sun') return;
    setExploredDestinations((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(EXPLORED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const selectDestination = (id: DestinationId) => {
    setSelectedDestinationId(id);
    markDestinationExplored(id);
    const matchingMission = MISSIONS.find((m) => m.destinationId === id);
    if (matchingMission) {
      setSelectedMissionId(matchingMission.id);
      setSelectedObjectiveIds(matchingMission.recommendedObjectiveIds);
      const compatibleRocket = LAUNCH_VEHICLES.find((r) =>
        r.compatibleDestinations.includes(id)
      );
      if (compatibleRocket) setSelectedRocketId(compatibleRocket.id);
      const compatibleOrbit = ORBIT_OPTIONS.find((o) =>
        o.compatibleDestinations.includes(id)
      );
      if (compatibleOrbit) setSelectedOrbitId(compatibleOrbit.id);
    }
  };

  const selectMission = (id: string) => {
    const mission = MISSIONS.find((m) => m.id === id);
    if (!mission) return;
    setSelectedMissionId(mission.id);
    setSelectedDestinationId(mission.destinationId);
    setSelectedObjectiveIds(mission.recommendedObjectiveIds);

    // Ensure rocket & orbit default to compatible choices if current selection is incompatible
    if (!selectedRocket.compatibleDestinations.includes(mission.destinationId)) {
      const compatibleRocket = LAUNCH_VEHICLES.find((r) =>
        r.compatibleDestinations.includes(mission.destinationId)
      );
      if (compatibleRocket) setSelectedRocketId(compatibleRocket.id);
    }
    if (!selectedOrbit.compatibleDestinations.includes(mission.destinationId)) {
      const compatibleOrbit = ORBIT_OPTIONS.find((o) =>
        o.compatibleDestinations.includes(mission.destinationId)
      );
      if (compatibleOrbit) setSelectedOrbitId(compatibleOrbit.id);
    }
  };

  const toggleObjective = (id: string) => {
    setSelectedObjectiveIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const applyRecommendedObjectives = (missionId: string) => {
    const mission = MISSIONS.find((m) => m.id === missionId);
    if (mission) {
      setSelectedObjectiveIds(mission.recommendedObjectiveIds);
      showToast('info', `Loaded recommended science objectives for ${mission.name}.`);
    }
  };

  const updateSpacecraftName = (name: string) => {
    setActiveDesign((prev) => ({
      ...prev,
      name,
      updatedAt: new Date().toISOString(),
    }));
  };

  const setComponentQuantity = (componentId: string, quantity: number) => {
    const comp = SPACECRAFT_COMPONENTS.find((c) => c.id === componentId);
    if (!comp) return;
    const clamped = Math.max(0, Math.min(comp.maxQuantity, quantity));
    const currentQty = activeDesign.items.find((i) => i.componentId === componentId)?.quantity ?? 0;
    if (clamped > currentQty) {
      setLastComponentPulse({ componentId, name: comp.name, ts: Date.now() });
    }
    setActiveDesign((prev) => {
      const exists = prev.items.some((i) => i.componentId === componentId);
      const items = exists
        ? prev.items
            .map((i) =>
              i.componentId === componentId ? { ...i, quantity: clamped } : i
            )
            .filter((i) => i.quantity > 0)
        : clamped > 0
        ? [...prev.items, { componentId, quantity: clamped }]
        : prev.items;
      return {
        ...prev,
        items,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const saveCurrentDesign = () => {
    const trimmedName = activeDesign.name.trim();
    if (!trimmedName) {
      showToast('warning', 'Enter a spacecraft name before saving your configuration.');
      return;
    }
    const designToSave: SpacecraftDesign = {
      ...activeDesign,
      name: trimmedName,
      id: activeDesign.id || `design-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    const updatedList = apiClient.saveSpacecraftDesign(designToSave);
    setSavedDesigns(updatedList);
    setActiveDesign(designToSave);
    showToast('success', `Saved spacecraft configuration "${trimmedName}".`);
  };

  const loadSavedDesign = (designId: string) => {
    const found = savedDesigns.find((d) => d.id === designId);
    if (found) {
      setActiveDesign({ ...found, items: found.items.map((i) => ({ ...i })) });
      showToast('info', `Loaded spacecraft "${found.name}".`);
    }
  };

  const resetSpacecraftToStarter = () => {
    setActiveDesign({
      ...DEFAULT_SPACECRAFT_DESIGN,
      id: `design-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    });
    showToast('info', 'Reset spacecraft to baseline explorer configuration.');
  };

  const autoOptimizeForMission = () => {
    const neededCats = new Set(selectedObjectives.map((o) => o.requiredCategory));
    const items: { componentId: string; quantity: number }[] = [
      { componentId: 'comp-computer', quantity: 1 },
      {
        componentId: 'comp-solar',
        quantity:
          selectedDestination.id === 'vesta'
            ? 5
            : selectedDestination.id === 'mars'
            ? 4
            : 3,
      },
      { componentId: 'comp-battery', quantity: 1 },
      {
        componentId: 'comp-antenna',
        quantity: selectedMission.minCommsCapacity > 60 ? 2 : 1,
      },
      { componentId: 'comp-propulsion', quantity: 1 },
      { componentId: 'comp-thermal', quantity: 1 },
    ];
    if (neededCats.has('optics')) items.push({ componentId: 'comp-camera', quantity: 1 });
    if (neededCats.has('sensors')) items.push({ componentId: 'comp-sensors', quantity: 1 });
    if (neededCats.has('science')) items.push({ componentId: 'comp-instrument', quantity: 1 });
    if (selectedMission.requiresLandingSystem) {
      items.push({ componentId: 'comp-lander', quantity: 1 });
    }
    setActiveDesign((prev) => ({
      ...prev,
      items,
      updatedAt: new Date().toISOString(),
    }));
    showToast(
      'success',
      `Configured baseline subsystems for ${selectedMission.name}. Review margins in the Engineering Dashboard.`
    );
  };

  const selectRocket = (id: string) => setSelectedRocketId(id);
  const selectOrbit = (id: string) => setSelectedOrbitId(id);

  const executeSimulationAndSave = (decisions: EventDecisionRecord[]) => {
    const report = runDeterministicSimulation({
      design: activeDesign,
      catalog: SPACECRAFT_COMPONENTS,
      mission: selectedMission,
      destination: selectedDestination,
      selectedObjectives,
      rocket: selectedRocket,
      orbit: selectedOrbit,
      eventDecisions: decisions,
      commanderName: userProfile.callsign,
      teamName: userProfile.teamName,
    });
    const updatedReports = apiClient.saveReport(report);
    setReports(updatedReports);
    setLatestReport(report);
    return report;
  };

  const updateUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    apiClient.saveUserProfile(profile);
    showToast('success', `Updated crew profile for ${profile.callsign}.`);
  };

  const playerProgression = useMemo(
    () =>
      computePlayerProgression({
        reports,
        exploredDestinations,
        savedDesigns,
      }),
    [reports, exploredDestinations, savedDesigns]
  );

  const value: MissionContextValue = {
    activePage,
    setActivePage,
    destinations: CELESTIAL_BODIES,
    missions: MISSIONS,
    objectives: SCIENTIFIC_OBJECTIVES,
    components: SPACECRAFT_COMPONENTS,
    rockets: LAUNCH_VEHICLES,
    orbits: ORBIT_OPTIONS,
    selectedDestinationId,
    selectDestination,
    selectedMissionId,
    selectMission,
    selectedObjectiveIds,
    toggleObjective,
    applyRecommendedObjectives,
    activeDesign,
    savedDesigns,
    updateSpacecraftName,
    setComponentQuantity,
    saveCurrentDesign,
    loadSavedDesign,
    resetSpacecraftToStarter,
    autoOptimizeForMission,
    selectedRocketId,
    selectRocket,
    selectedOrbitId,
    selectOrbit,
    selectedDestination,
    selectedMission,
    selectedObjectives,
    selectedRocket,
    selectedOrbit,
    metrics,
    reports,
    latestReport,
    setLatestReport,
    executeSimulationAndSave,
    userProfile,
    updateUserProfile,
    exploredDestinations,
    playerProgression,
    lastComponentPulse,
    toastMessage,
    showToast,
    clearToast,
  };

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
};

export function useMission() {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error('useMission must be used inside MissionProvider');
  return ctx;
}
