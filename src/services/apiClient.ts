import type {
  MissionReport,
  SpacecraftDesign,
  UserProfile,
} from '../types/mission';
import {
  CELESTIAL_BODIES,
  DEFAULT_SPACECRAFT_DESIGN,
  INITIAL_SEED_REPORTS,
  LAUNCH_VEHICLES,
  MISSIONS,
  ORBIT_OPTIONS,
  SCIENTIFIC_OBJECTIVES,
  SPACECRAFT_COMPONENTS,
} from '../data/seedData';

const STORAGE_KEYS = {
  DESIGN_LIST: 'mission_orbit_saved_designs_v1',
  ACTIVE_STATE: 'mission_orbit_active_state_v1',
  REPORTS: 'mission_orbit_reports_v1',
  PROFILE: 'mission_orbit_user_profile_v1',
};

const SPRING_API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export interface PersistedMissionState {
  selectedDestinationId: string;
  selectedMissionId: string;
  selectedObjectiveIds: string[];
  activeDesign: SpacecraftDesign;
  selectedRocketId: string;
  selectedOrbitId: string;
}

/**
 * Clean REST client adapter designed to talk to the Java 21 Spring Boot backend (/api/v1/*)
 * when VITE_API_BASE_URL is configured and reachable, seamlessly running in deterministic
 * local-prototype mode when executed inside environments without Java/MySQL.
 */
export const apiClient = {
  isRemoteBackendConfigured(): boolean {
    return Boolean(SPRING_API_BASE);
  },

  async fetchCatalog() {
    if (SPRING_API_BASE) {
      try {
        const res = await fetch(`${SPRING_API_BASE}/api/v1/catalog/bootstrap`);
        if (res.ok) return await res.json();
      } catch {
        // Fallback to bundled deterministic seed data
      }
    }
    return {
      destinations: CELESTIAL_BODIES,
      missions: MISSIONS,
      objectives: SCIENTIFIC_OBJECTIVES,
      components: SPACECRAFT_COMPONENTS,
      rockets: LAUNCH_VEHICLES,
      orbits: ORBIT_OPTIONS,
    };
  },

  loadActiveState(): PersistedMissionState {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_STATE);
      if (raw) {
        return JSON.parse(raw) as PersistedMissionState;
      }
    } catch {
      // Ignore storage errors
    }
    return {
      selectedDestinationId: 'mars',
      selectedMissionId: 'mission-mars-recon',
      selectedObjectiveIds: ['obj-water-ice', 'obj-atmospheric-obs', 'obj-surface-photo'],
      activeDesign: { ...DEFAULT_SPACECRAFT_DESIGN },
      selectedRocketId: 'rocket-astra',
      selectedOrbitId: 'orbit-mars-polar',
    };
  },

  saveActiveState(state: PersistedMissionState) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_STATE, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  },

  loadSavedDesigns(): SpacecraftDesign[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DESIGN_LIST);
      if (raw) {
        const parsed = JSON.parse(raw) as SpacecraftDesign[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return [{ ...DEFAULT_SPACECRAFT_DESIGN }];
  },

  saveSpacecraftDesign(design: SpacecraftDesign): SpacecraftDesign[] {
    const existing = this.loadSavedDesigns();
    const updatedDesign: SpacecraftDesign = {
      ...design,
      updatedAt: new Date().toISOString(),
    };
    const idx = existing.findIndex((d) => d.id === updatedDesign.id);
    const next =
      idx >= 0
        ? existing.map((d) => (d.id === updatedDesign.id ? updatedDesign : d))
        : [updatedDesign, ...existing];
    try {
      localStorage.setItem(STORAGE_KEYS.DESIGN_LIST, JSON.stringify(next));
    } catch {
      // Ignore
    }
    return next;
  },

  loadReports(): MissionReport[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (raw) {
        const parsed = JSON.parse(raw) as MissionReport[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore
    }
    return INITIAL_SEED_REPORTS;
  },

  saveReport(report: MissionReport): MissionReport[] {
    const existing = this.loadReports();
    const next = [report, ...existing.filter((r) => r.id !== report.id)];
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(next));
    } catch {
      // Ignore
    }
    return next;
  },

  loadUserProfile(): UserProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (raw) return JSON.parse(raw) as UserProfile;
    } catch {
      // Ignore
    }
    return {
      id: 'cadet-01',
      callsign: 'Cadet Explorer',
      email: 'cadet@missionorbit.edu',
      role: 'Commander',
      teamName: 'Orbital Dynamics Squad',
    };
  },

  saveUserProfile(profile: UserProfile) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch {
      // Ignore
    }
  },
};
