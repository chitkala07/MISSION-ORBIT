import type {
  CelestialBody,
  ComponentCategory,
  EngineeringMetrics,
  EngineeringWarning,
  EventDecisionRecord,
  LaunchVehicle,
  Mission,
  MissionOutcome,
  MissionReport,
  OrbitOption,
  ScientificObjective,
  SpacecraftComponent,
  SpacecraftDesign,
} from '../types/mission';

/**
 * Deterministic educational engineering calculation engine.
 * Note: Simplified educational model — not real aerospace flight physics.
 * Mirrors the authoritative Java SimulationEngine rules in backend/src/main/java/com/missionorbit/simulation/SimulationEngine.java.
 */
export function calculateEngineeringMetrics(params: {
  design: SpacecraftDesign;
  catalog: SpacecraftComponent[];
  mission: Mission;
  destination: CelestialBody;
  selectedObjectives: ScientificObjective[];
  rocket: LaunchVehicle | null;
  orbit: OrbitOption | null;
}): EngineeringMetrics {
  const { design, catalog, mission, destination, selectedObjectives, rocket, orbit } = params;

  const catalogMap = new Map<string, SpacecraftComponent>();
  for (const c of catalog) {
    catalogMap.set(c.id, c);
  }

  let totalMassKg = 0;
  let totalPowerDrawW = 0;
  let totalPowerGenW = 0;
  let spacecraftCostM = 0;
  let totalScienceValue = 0;
  let totalCommsCapacity = 0;

  const categoryCounts = new Map<ComponentCategory, number>();

  for (const item of design.items) {
    if (item.quantity <= 0) continue;
    const comp = catalogMap.get(item.componentId);
    if (!comp) continue;

    // Total mass = sum of mass * quantity
    totalMassKg += comp.massKg * item.quantity;
    // Total power consumption = sum of power draw * quantity
    totalPowerDrawW += comp.powerDrawW * item.quantity;
    // Raw power generation (solar panels scale with destination sunlight, batteries do not)
    if (comp.category === 'power-gen') {
      totalPowerGenW += comp.powerGenW * item.quantity;
    } else {
      totalPowerGenW += comp.powerGenW * item.quantity;
    }
    spacecraftCostM += comp.costM * item.quantity;
    totalScienceValue += comp.scienceValue * item.quantity;
    totalCommsCapacity += comp.commsCapacity * item.quantity;

    categoryCounts.set(
      comp.category,
      (categoryCounts.get(comp.category) ?? 0) + item.quantity
    );
  }

  // Apply simplified destination solar irradiance & orbital sunlit factor to solar panels only
  const solarPanelRawW = design.items.reduce((sum, item) => {
    if (item.quantity <= 0) return sum;
    const comp = catalogMap.get(item.componentId);
    if (!comp || comp.category !== 'power-gen') return sum;
    return sum + comp.powerGenW * item.quantity;
  }, 0);

  const batteryBackupW = totalPowerGenW - solarPanelRawW;
  const orbitSunFactor = orbit ? orbit.powerSunlitRatio : 0.85;
  const effectivePowerGenW = Math.round(
    solarPanelRawW * destination.solarEfficiencyFactor * orbitSunFactor + batteryBackupW
  );

  // Available power = effective generated power minus consumed power
  const availablePowerW = effectivePowerGenW - totalPowerDrawW;

  const launchCostM = rocket ? rocket.launchCostM : 0;
  const totalCostM = spacecraftCostM + launchCostM;
  // Remaining budget = mission budget minus spacecraft and launch costs
  const remainingBudgetM = mission.budgetLimitM - totalCostM;

  const hasOnboardComputer = (categoryCounts.get('avionics') ?? 0) > 0;
  const hasPropulsion = (categoryCounts.get('propulsion') ?? 0) > 0;
  const hasThermalControl = (categoryCounts.get('thermal') ?? 0) > 0;
  const hasLandingSystem = (categoryCounts.get('landing') ?? 0) > 0;

  const rocketPayloadCompatible = rocket ? totalMassKg <= rocket.payloadCapacityKg : false;
  const destinationCompatible = rocket
    ? rocket.compatibleDestinations.includes(mission.destinationId)
    : false;
  const orbitCompatible = orbit
    ? orbit.compatibleDestinations.includes(mission.destinationId)
    : false;

  const missingObjectiveCategories = selectedObjectives
    .filter((obj) => (categoryCounts.get(obj.requiredCategory) ?? 0) === 0)
    .map((obj) => ({
      objectiveId: obj.id,
      objectiveName: obj.name,
      requiredCategory: obj.requiredCategory,
    }));

  const warnings: EngineeringWarning[] = [];

  if (totalMassKg === 0) {
    warnings.push({
      code: 'EMPTY_SPACECRAFT',
      severity: 'critical',
      title: 'Spacecraft has no components',
      detail: 'Add structural avionics, power, communications, and science hardware before launch.',
      fixHint: 'Add at least an Onboard Computer, Solar Panels, and High-Gain Antenna in the Spacecraft Lab.',
    });
  }

  if (!hasOnboardComputer) {
    warnings.push({
      code: 'NO_COMPUTER',
      severity: 'critical',
      title: 'Missing Onboard Computer',
      detail: 'A spacecraft cannot navigate, process telemetry, or trigger science sequences without flight avionics.',
      fixHint: 'Add 1 Radiation-Hardened Computer in the Spacecraft Laboratory.',
    });
  }

  if (!hasPropulsion && mission.destinationId !== 'earth') {
    warnings.push({
      code: 'NO_PROPULSION',
      severity: 'critical',
      title: 'Missing Propulsion System',
      detail: `Reaching and capturing orbit around ${mission.destinationName} requires onboard thrusters.`,
      fixHint: 'Install an Ion Propulsion Thruster.',
    });
  }

  if (totalMassKg > mission.massLimitKg) {
    warnings.push({
      code: 'MISSION_MASS_EXCEEDED',
      severity: 'critical',
      title: `Exceeds mission mass limit (${totalMassKg} / ${mission.massLimitKg} kg)`,
      detail: 'The spacecraft is too heavy for the mission trajectory profile.',
      fixHint: 'Remove redundant heavy modules or switch to lighter sensor configurations.',
    });
  }

  if (rocket && !rocketPayloadCompatible) {
    warnings.push({
      code: 'ROCKET_OVERWEIGHT',
      severity: 'critical',
      title: `Exceeds ${rocket.name} payload capacity (${totalMassKg} / ${rocket.payloadCapacityKg} kg)`,
      detail: 'The selected launch vehicle cannot lift this spacecraft mass into transfer trajectory.',
      fixHint: 'Either trim spacecraft mass or choose a heavier launch vehicle (e.g., Helios-Heavy IX).',
    });
  }

  if (rocket && !destinationCompatible) {
    warnings.push({
      code: 'ROCKET_DEST_MISMATCH',
      severity: 'critical',
      title: `${rocket.name} cannot reach ${mission.destinationName}`,
      detail: 'This launcher lacks the delta-v energy needed for your selected celestial destination.',
      fixHint: 'Select a launch vehicle rated for your destination on the Rocket & Orbit page.',
    });
  }

  if (orbit && !orbitCompatible) {
    warnings.push({
      code: 'ORBIT_DEST_MISMATCH',
      severity: 'critical',
      title: `${orbit.name} does not match ${mission.destinationName}`,
      detail: 'Choose an orbital profile designed specifically for your mission target.',
      fixHint: 'Pick a compatible orbit on the Rocket & Orbit page.',
    });
  }

  if (availablePowerW < 0) {
    warnings.push({
      code: 'POWER_DEFICIT',
      severity: 'critical',
      title: `Power deficit of ${Math.abs(availablePowerW)} W`,
      detail: `Consuming ${totalPowerDrawW} W while effective generation is only ${effectivePowerGenW} W at ${destination.name}.`,
      fixHint: 'Add Deployable Solar Panels or a Battery Pack, or turn off duplicate power-hungry hardware.',
    });
  } else if (availablePowerW < 40 && totalMassKg > 0) {
    warnings.push({
      code: 'LOW_POWER_MARGIN',
      severity: 'warning',
      title: `Tight power safety margin (+${availablePowerW} W)`,
      detail: 'Unexpected thermal spikes during planetary eclipses may force payload shutdowns.',
      fixHint: 'Aim for at least +40 W surplus for resilient mission control.',
    });
  }

  if (remainingBudgetM < 0) {
    warnings.push({
      code: 'OVER_BUDGET',
      severity: 'critical',
      title: `Over mission budget by $${Math.abs(remainingBudgetM)}M`,
      detail: `Combined spacecraft ($${spacecraftCostM}M) and launch ($${launchCostM}M) costs exceed the $${mission.budgetLimitM}M cap.`,
      fixHint: 'Reduce component quantities or select a more economical rocket.',
    });
  }

  if (totalCommsCapacity < mission.minCommsCapacity) {
    warnings.push({
      code: 'INSUFFICIENT_COMMS',
      severity: 'warning',
      title: `Low communications capacity (${totalCommsCapacity} / ${mission.minCommsCapacity} Mbps eq.)`,
      detail: `Distance to ${mission.destinationName} requires stronger antenna gain to return full science data.`,
      fixHint: 'Add another High-Gain Dish Antenna in the Spacecraft Laboratory.',
    });
  }

  if (mission.requiresLandingSystem && !hasLandingSystem) {
    warnings.push({
      code: 'MISSING_LANDER',
      severity: 'critical',
      title: 'Precision Landing System required',
      detail: `${mission.name} includes surface touchdown operations.`,
      fixHint: 'Install the Precision Landing System component.',
    });
  }

  if (!hasThermalControl && mission.destinationId !== 'earth') {
    warnings.push({
      code: 'NO_THERMAL',
      severity: 'warning',
      title: 'No Thermal-Control Louvers installed',
      detail: 'Deep space temperature swings can degrade electronics and batteries during mission events.',
      fixHint: 'Add Thermal-Control Louvers for improved reliability.',
    });
  }

  if (selectedObjectives.length === 0) {
    warnings.push({
      code: 'NO_OBJECTIVES',
      severity: 'warning',
      title: 'No scientific objectives selected',
      detail: 'Choose at least one scientific objective so your mission earns science points.',
      fixHint: 'Select 1–4 goals on the Mission & Objectives screen.',
    });
  } else if (missingObjectiveCategories.length > 0) {
    const names = missingObjectiveCategories.map((m) => m.objectiveName).join(', ');
    warnings.push({
      code: 'MISSING_INSTRUMENTS',
      severity: 'warning',
      title: 'Instruments missing for selected objectives',
      detail: `Missing required hardware category for: ${names}.`,
      fixHint: 'Install the matching Camera, Sensor, or Ice & Mineral Spectrometer in the Spacecraft Lab.',
    });
  }

  const hasCritical = warnings.some((w) => w.severity === 'critical');
  const launchReady =
    !hasCritical &&
    rocket !== null &&
    orbit !== null &&
    selectedObjectives.length > 0;

  return {
    totalMassKg,
    totalPowerDrawW,
    totalPowerGenW,
    effectivePowerGenW,
    availablePowerW,
    spacecraftCostM,
    launchCostM,
    totalCostM,
    remainingBudgetM,
    totalScienceValue,
    totalCommsCapacity,
    hasOnboardComputer,
    hasPropulsion,
    hasThermalControl,
    hasLandingSystem,
    rocketPayloadCompatible,
    destinationCompatible,
    orbitCompatible,
    missingObjectiveCategories,
    warnings,
    launchReady,
  };
}

/**
 * Simplified, deterministic mission simulation and scoring engine.
 * Documented scoring rules:
 * - Engineering Score (40% weight): Baseline 100 minus penalties for mass/budget/power/comms/thermal/lander gaps, plus event engineering adjustments.
 * - Scientific Achievement Score (40% weight): Ratio of supported objectives + instrument science value * orbit multiplier + event science adjustments.
 * - Resource Efficiency Score (20% weight): Rewards staying comfortably under mass and budget caps without over-spending.
 */
export function runDeterministicSimulation(params: {
  design: SpacecraftDesign;
  catalog: SpacecraftComponent[];
  mission: Mission;
  destination: CelestialBody;
  selectedObjectives: ScientificObjective[];
  rocket: LaunchVehicle;
  orbit: OrbitOption;
  eventDecisions: EventDecisionRecord[];
  commanderName?: string;
  teamName?: string;
}): MissionReport {
  const {
    design,
    catalog,
    mission,
    destination,
    selectedObjectives,
    rocket,
    orbit,
    eventDecisions,
    commanderName = 'Cadet Explorer',
    teamName = 'Mission Orbit Ops',
  } = params;

  const metrics = calculateEngineeringMetrics({
    design,
    catalog,
    mission,
    destination,
    selectedObjectives,
    rocket,
    orbit,
  });

  const problemsEncountered: string[] = [];
  const improvementSuggestions: string[] = [];

  // 1. Engineering Score Calculation
  let engineeringScore = 88;

  if (!metrics.hasOnboardComputer) {
    engineeringScore -= 40;
    problemsEncountered.push('Flight avionics failure: no onboard computer was installed.');
    improvementSuggestions.push('Always include at least one Radiation-Hardened Computer.');
  }
  if (!metrics.hasPropulsion && mission.destinationId !== 'earth') {
    engineeringScore -= 30;
    problemsEncountered.push('Orbital insertion failure: no propulsion module available.');
    improvementSuggestions.push('Install an Ion Propulsion Thruster for non-Earth orbital maneuvers.');
  }
  if (metrics.totalMassKg > mission.massLimitKg || !metrics.rocketPayloadCompatible) {
    engineeringScore -= 28;
    problemsEncountered.push('Launch fairing mass limits exceeded, reducing structural safety margins.');
    improvementSuggestions.push('Trim duplicate components or choose a higher-capacity launch vehicle.');
  }
  if (metrics.availablePowerW < 0) {
    engineeringScore -= 25;
    problemsEncountered.push(`Electrical power brownout (${metrics.availablePowerW} W deficit) forced subsystems offline.`);
    improvementSuggestions.push('Add Deployable Solar Panels or a Battery Pack until Available Power is at least +40 W.');
  } else if (metrics.availablePowerW >= 50) {
    engineeringScore += 6;
  }

  if (metrics.totalCommsCapacity < mission.minCommsCapacity) {
    engineeringScore -= 15;
    problemsEncountered.push('Weak radio downlink dropped telemetry frames during deep-space pass.');
    improvementSuggestions.push('Add an extra High-Gain Dish Antenna to exceed the mission comms threshold.');
  } else {
    engineeringScore += 4;
  }

  if (!metrics.hasThermalControl && mission.destinationId !== 'earth') {
    engineeringScore -= 10;
    problemsEncountered.push('Thermal extremes stressed unshielded batteries during eclipse.');
    improvementSuggestions.push('Include Thermal-Control Louvers for deep-space thermal protection.');
  }

  if (mission.requiresLandingSystem && !metrics.hasLandingSystem) {
    engineeringScore -= 35;
    problemsEncountered.push('Surface touchdown aborted: Precision Landing System was not installed.');
    improvementSuggestions.push('Equip a Precision Landing System when attempting surface lander missions.');
  }

  if (!metrics.destinationCompatible || !metrics.orbitCompatible) {
    engineeringScore -= 25;
    problemsEncountered.push('Launch vehicle or orbit selection did not match destination trajectory.');
    improvementSuggestions.push('Verify rocket and orbit compatibility badges before launching.');
  }

  // Apply deterministic event deltas
  let eventEngSum = 0;
  let eventSciSum = 0;
  let eventPowerSum = 0;
  let eventCommsSum = 0;

  for (const d of eventDecisions) {
    eventEngSum += d.engineeringDelta;
    eventSciSum += d.scienceDelta;
    eventPowerSum += d.powerDelta;
    eventCommsSum += d.commsDelta;
  }

  engineeringScore += eventEngSum;

  // Check if event power drain pushed positive power into brownout
  const postEventPower = metrics.availablePowerW + eventPowerSum;
  if (postEventPower < 0 && metrics.availablePowerW >= 0) {
    engineeringScore -= 10;
    problemsEncountered.push('In-flight power demand exceeded remaining battery margin during an anomaly.');
    improvementSuggestions.push('Carry an extra 40+ W of power surplus to absorb unexpected flight anomalies.');
  }

  engineeringScore = clampScore(engineeringScore);

  // 2. Scientific Achievement Score Calculation
  const missingSet = new Set(metrics.missingObjectiveCategories.map((m) => m.objectiveId));
  const successfulObjectives: string[] = [];
  const missedObjectives: string[] = [];

  for (const obj of selectedObjectives) {
    const commsOk = metrics.totalCommsCapacity + eventCommsSum >= mission.minCommsCapacity * 0.7;
    const powerOk = postEventPower >= -20;
    const landerOk = !mission.requiresLandingSystem || metrics.hasLandingSystem;

    if (!missingSet.has(obj.id) && commsOk && powerOk && landerOk) {
      successfulObjectives.push(obj.name);
    } else {
      missedObjectives.push(obj.name);
      if (missingSet.has(obj.id)) {
        problemsEncountered.push(`Objective "${obj.name}" missed due to missing ${obj.requiredCategory} instrument.`);
        improvementSuggestions.push(`Install hardware matching "${obj.requiredCategory}" to accomplish ${obj.name}.`);
      }
    }
  }

  let scienceScore = 0;
  if (selectedObjectives.length > 0) {
    const objCompletionRatio = successfulObjectives.length / selectedObjectives.length;
    const baseObjectivePts = objCompletionRatio * 65;
    const instrumentBonus = Math.min(25, Math.round((metrics.totalScienceValue / 90) * 25));
    const orbitBonus = Math.round((orbit.scienceMultiplier - 1) * 40);
    scienceScore = baseObjectivePts + instrumentBonus + orbitBonus + eventSciSum;
  } else {
    problemsEncountered.push('No scientific objectives were assigned to this mission.');
    improvementSuggestions.push('Select 2 to 3 Scientific Objectives aligned with your destination.');
  }

  scienceScore = clampScore(scienceScore);

  // 3. Resource Efficiency Score Calculation
  let resourceEfficiencyScore = 50;
  if (metrics.remainingBudgetM >= 0) {
    const budgetUsedRatio = metrics.totalCostM / Math.max(1, mission.budgetLimitM);
    // Sweet spot: using 65%-95% of budget effectively without overspending
    const budgetEfficiency =
      budgetUsedRatio <= 0.98
        ? 35 + Math.round((1 - Math.abs(0.82 - budgetUsedRatio)) * 15)
        : 32;
    resourceEfficiencyScore += budgetEfficiency;
  } else {
    resourceEfficiencyScore -= 30;
    problemsEncountered.push(`Budget overrun of $${Math.abs(metrics.remainingBudgetM)}M penalized resource efficiency.`);
    improvementSuggestions.push('Balance component count and rocket tier so Remaining Budget stays >= $0M.');
  }

  const massRatio = metrics.totalMassKg / Math.max(1, mission.massLimitKg);
  if (massRatio <= 1 && metrics.totalMassKg > 0) {
    resourceEfficiencyScore += Math.round((1 - massRatio * 0.35) * 15);
  } else {
    resourceEfficiencyScore -= 18;
  }

  resourceEfficiencyScore = clampScore(resourceEfficiencyScore);

  // 4. Overall Weighted Score & Outcome Classification
  const overallScore = clampScore(
    Math.round(engineeringScore * 0.4 + scienceScore * 0.4 + resourceEfficiencyScore * 0.2)
  );

  let outcome: MissionOutcome;
  if (
    overallScore >= 75 &&
    engineeringScore >= 65 &&
    successfulObjectives.length > 0 &&
    metrics.hasOnboardComputer &&
    (!mission.requiresLandingSystem || metrics.hasLandingSystem) &&
    metrics.remainingBudgetM >= 0
  ) {
    outcome = 'SUCCESS';
  } else if (overallScore >= 45 && metrics.hasOnboardComputer) {
    outcome = 'PARTIAL_SUCCESS';
  } else {
    outcome = 'MISSION_FAILURE';
  }

  if (improvementSuggestions.length === 0) {
    improvementSuggestions.push(
      'Strong design! Try adding a complementary scientific objective or testing an Advanced destination next.'
    );
  }

  const resultExplanation =
    outcome === 'SUCCESS'
      ? `${design.name} successfully completed ${successfulObjectives.length} of ${selectedObjectives.length} scientific objectives at ${destination.name} aboard ${rocket.name} in ${orbit.name}.`
      : outcome === 'PARTIAL_SUCCESS'
      ? `${design.name} reached ${destination.name} and returned partial telemetry, but engineering constraints or missed hardware reduced mission effectiveness.`
      : `${design.name} suffered critical engineering or constraint failures before completing primary mission goals at ${destination.name}.`;

  return {
    id: `rep-${Date.now()}`,
    timestamp: new Date().toISOString(),
    missionId: mission.id,
    missionName: mission.name,
    destinationName: destination.name,
    spacecraftName: design.name,
    rocketName: rocket.name,
    orbitName: orbit.name,
    commanderName,
    teamName,
    outcome,
    engineeringScore,
    scienceScore,
    resourceEfficiencyScore,
    overallScore,
    successfulObjectives,
    missedObjectives,
    problemsEncountered: Array.from(new Set(problemsEncountered)),
    resultExplanation,
    improvementSuggestions: Array.from(new Set(improvementSuggestions)),
    eventDecisions,
    metricsSnapshot: {
      totalMassKg: metrics.totalMassKg,
      availablePowerW: postEventPower,
      remainingBudgetM: metrics.remainingBudgetM,
      totalCommsCapacity: metrics.totalCommsCapacity + eventCommsSum,
    },
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
