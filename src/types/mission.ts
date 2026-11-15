export type DestinationId = 'sun' | 'earth' | 'moon' | 'mars' | 'vesta' | 'bennu';

export type PageRoute =
  | 'headquarters'
  | 'solar-system'
  | 'mission-selection'
  | 'spacecraft-lab'
  | 'rocket-orbit'
  | 'mission-control'
  | 'results'
  | 'architecture';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type ComponentCategory =
  | 'optics'
  | 'comms'
  | 'sensors'
  | 'avionics'
  | 'power-gen'
  | 'power-storage'
  | 'propulsion'
  | 'thermal'
  | 'landing'
  | 'science';

export interface CelestialBody {
  id: DestinationId;
  name: string;
  classification: string;
  distanceLabel: string;
  diameterKm: number;
  gravityLabel: string;
  temperatureRange: string;
  accentHex: string;
  summary: string;
  beginnerFact: string;
  exploreTarget: boolean;
  missionOpportunities: string[];
  requiredCommsTier: number;
  solarEfficiencyFactor: number;
}

export interface ScientificObjective {
  id: string;
  name: string;
  shortDesc: string;
  beginnerExplanation: string;
  requiredCategory: ComponentCategory;
  sciencePoints: number;
  powerDemandNote: string;
  recommendedDestinations: DestinationId[];
}

export interface Mission {
  id: string;
  name: string;
  destinationId: DestinationId;
  destinationName: string;
  primaryObjectiveSummary: string;
  difficulty: DifficultyLevel;
  estimatedDurationDays: number;
  budgetLimitM: number;
  massLimitKg: number;
  minCommsCapacity: number;
  recommendedObjectiveIds: string[];
  description: string;
  requiresLandingSystem: boolean;
  rewardXp?: number;
  rewardTitle?: string;
}

export interface SpacecraftComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  massKg: number;
  powerDrawW: number;
  powerGenW: number;
  costM: number;
  scienceValue: number;
  commsCapacity: number;
  maxQuantity: number;
  shortExplanation: string;
  educationalNote: string;
}

export interface SelectedComponentItem {
  componentId: string;
  quantity: number;
}

export interface SpacecraftDesign {
  id: string;
  name: string;
  items: SelectedComponentItem[];
  updatedAt: string;
}

export interface LaunchVehicle {
  id: string;
  name: string;
  payloadCapacityKg: number;
  launchCostM: number;
  compatibleDestinations: DestinationId[];
  reliabilityRating: number;
  summary: string;
  beginnerExplanation: string;
}

export interface OrbitOption {
  id: string;
  name: string;
  altitudeLabel: string;
  inclinationLabel: string;
  compatibleDestinations: DestinationId[];
  scienceMultiplier: number;
  powerSunlitRatio: number;
  description: string;
  beginnerExplanation: string;
}

export type WarningSeverity = 'critical' | 'warning' | 'info';

export interface EngineeringWarning {
  code: string;
  severity: WarningSeverity;
  title: string;
  detail: string;
  fixHint: string;
}

export interface EngineeringMetrics {
  totalMassKg: number;
  totalPowerDrawW: number;
  totalPowerGenW: number;
  effectivePowerGenW: number;
  availablePowerW: number;
  spacecraftCostM: number;
  launchCostM: number;
  totalCostM: number;
  remainingBudgetM: number;
  totalScienceValue: number;
  totalCommsCapacity: number;
  hasOnboardComputer: boolean;
  hasPropulsion: boolean;
  hasThermalControl: boolean;
  hasLandingSystem: boolean;
  rocketPayloadCompatible: boolean;
  destinationCompatible: boolean;
  orbitCompatible: boolean;
  missingObjectiveCategories: {
    objectiveId: string;
    objectiveName: string;
    requiredCategory: ComponentCategory;
  }[];
  warnings: EngineeringWarning[];
  launchReady: boolean;
}

export interface MissionEventChoice {
  id: string;
  label: string;
  explanation: string;
  powerDelta: number;
  commsDelta: number;
  scienceDelta: number;
  engineeringDelta: number;
  outcomeSummary: string;
}

export interface MissionEvent {
  id: string;
  phasePercent: number;
  title: string;
  category: 'Communication' | 'Power' | 'Instrument' | 'Navigation' | 'Thermal';
  description: string;
  beginnerContext: string;
  choices: MissionEventChoice[];
}

export interface EventDecisionRecord {
  eventId: string;
  eventTitle: string;
  choiceId: string;
  choiceLabel: string;
  outcomeSummary: string;
  engineeringDelta: number;
  scienceDelta: number;
  powerDelta: number;
  commsDelta: number;
}

export type MissionOutcome = 'SUCCESS' | 'PARTIAL_SUCCESS' | 'MISSION_FAILURE';

export interface MissionReport {
  id: string;
  timestamp: string;
  missionId: string;
  missionName: string;
  destinationName: string;
  spacecraftName: string;
  rocketName: string;
  orbitName: string;
  commanderName: string;
  teamName: string;
  outcome: MissionOutcome;
  engineeringScore: number;
  scienceScore: number;
  resourceEfficiencyScore: number;
  overallScore: number;
  successfulObjectives: string[];
  missedObjectives: string[];
  problemsEncountered: string[];
  resultExplanation: string;
  improvementSuggestions: string[];
  eventDecisions: EventDecisionRecord[];
  metricsSnapshot: {
    totalMassKg: number;
    availablePowerW: number;
    remainingBudgetM: number;
    totalCommsCapacity: number;
  };
}

export interface UserProfile {
  id: string;
  callsign: string;
  email: string;
  role: 'Commander' | 'Flight Engineer' | 'Science Lead';
  teamName: string;
}
