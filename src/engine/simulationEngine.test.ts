import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CELESTIAL_BODIES,
  DEFAULT_SPACECRAFT_DESIGN,
  LAUNCH_VEHICLES,
  MISSIONS,
  ORBIT_OPTIONS,
  SCIENTIFIC_OBJECTIVES,
  SPACECRAFT_COMPONENTS,
} from '../data/seedData';
import { calculateEngineeringMetrics, runDeterministicSimulation } from './simulationEngine';

test('calculates total mass, power, cost, and budget deterministically', () => {
  const mission = MISSIONS.find((m) => m.id === 'mission-mars-recon')!;
  const destination = CELESTIAL_BODIES.find((b) => b.id === 'mars')!;
  const rocket = LAUNCH_VEHICLES.find((r) => r.id === 'rocket-astra')!;
  const orbit = ORBIT_OPTIONS.find((o) => o.id === 'orbit-mars-polar')!;
  const objectives = SCIENTIFIC_OBJECTIVES.filter((o) =>
    mission.recommendedObjectiveIds.includes(o.id)
  );

  const metrics = calculateEngineeringMetrics({
    design: DEFAULT_SPACECRAFT_DESIGN,
    catalog: SPACECRAFT_COMPONENTS,
    mission,
    destination,
    selectedObjectives: objectives,
    rocket,
    orbit,
  });

  // Starter design:
  // comp-computer (45) + 2*solar (130) + battery (55) + 2*antenna (100) + propulsion (110) + thermal (40) + camera (60) + sensors (45) + instrument (75) = 660 kg
  assert.equal(metrics.totalMassKg, 660);
  // Power draw: 55 + 0 + 15 + 140 + 140 + 35 + 65 + 50 + 85 = 585 W
  assert.equal(metrics.totalPowerDrawW, 585);
  // Raw power gen: 2*260 (solar) + 80 (battery) = 600 W
  assert.equal(metrics.totalPowerGenW, 600);
  // Effective power at Mars (0.65 solar factor * 0.88 orbit sunlit ratio) + 80 battery = round(520 * 0.65 * 0.88 + 80) = 377 W -> deficit
  assert.ok(metrics.availablePowerW < 0);
  assert.equal(metrics.launchReady, false);
});

test('adding solar panels resolves Mars power deficit and enables launch readiness', () => {
  const mission = MISSIONS.find((m) => m.id === 'mission-mars-recon')!;
  const destination = CELESTIAL_BODIES.find((b) => b.id === 'mars')!;
  const rocket = LAUNCH_VEHICLES.find((r) => r.id === 'rocket-astra')!;
  const orbit = ORBIT_OPTIONS.find((o) => o.id === 'orbit-mars-polar')!;
  const objectives = SCIENTIFIC_OBJECTIVES.filter((o) =>
    mission.recommendedObjectiveIds.includes(o.id)
  );

  const boostedDesign = {
    ...DEFAULT_SPACECRAFT_DESIGN,
    items: DEFAULT_SPACECRAFT_DESIGN.items.map((item) =>
      item.componentId === 'comp-solar' ? { ...item, quantity: 4 } : item
    ),
  };

  const metrics = calculateEngineeringMetrics({
    design: boostedDesign,
    catalog: SPACECRAFT_COMPONENTS,
    mission,
    destination,
    selectedObjectives: objectives,
    rocket,
    orbit,
  });

  assert.ok(metrics.availablePowerW > 40);
  assert.ok(metrics.remainingBudgetM >= 0);
  assert.equal(metrics.rocketPayloadCompatible, true);
  assert.equal(metrics.launchReady, true);
});

test('missing onboard computer causes MISSION_FAILURE in simulation', () => {
  const mission = MISSIONS.find((m) => m.id === 'mission-earth-climate')!;
  const destination = CELESTIAL_BODIES.find((b) => b.id === 'earth')!;
  const rocket = LAUNCH_VEHICLES.find((r) => r.id === 'rocket-scout')!;
  const orbit = ORBIT_OPTIONS.find((o) => o.id === 'orbit-leo')!;
  const objectives = SCIENTIFIC_OBJECTIVES.filter((o) =>
    mission.recommendedObjectiveIds.includes(o.id)
  );

  const brokenDesign = {
    ...DEFAULT_SPACECRAFT_DESIGN,
    name: 'No-Brain Sat',
    items: DEFAULT_SPACECRAFT_DESIGN.items.filter((i) => i.componentId !== 'comp-computer'),
  };

  const report = runDeterministicSimulation({
    design: brokenDesign,
    catalog: SPACECRAFT_COMPONENTS,
    mission,
    destination,
    selectedObjectives: objectives,
    rocket,
    orbit,
    eventDecisions: [],
  });

  assert.equal(report.outcome, 'MISSION_FAILURE');
  assert.ok(report.problemsEncountered.some((p) => p.includes('onboard computer')));
});

test('well-configured lunar mission with positive event choices achieves SUCCESS', () => {
  const mission = MISSIONS.find((m) => m.id === 'mission-lunar-ice')!;
  const destination = CELESTIAL_BODIES.find((b) => b.id === 'moon')!;
  const rocket = LAUNCH_VEHICLES.find((r) => r.id === 'rocket-astra')!;
  const orbit = ORBIT_OPTIONS.find((o) => o.id === 'orbit-llo')!;
  const objectives = SCIENTIFIC_OBJECTIVES.filter((o) =>
    mission.recommendedObjectiveIds.includes(o.id)
  );

  const lunarLanderDesign = {
    id: 'lunar-1',
    name: 'Selene Frost-2',
    updatedAt: new Date().toISOString(),
    items: [
      { componentId: 'comp-computer', quantity: 1 },
      { componentId: 'comp-solar', quantity: 3 },
      { componentId: 'comp-battery', quantity: 1 },
      { componentId: 'comp-antenna', quantity: 2 },
      { componentId: 'comp-propulsion', quantity: 1 },
      { componentId: 'comp-thermal', quantity: 1 },
      { componentId: 'comp-camera', quantity: 1 },
      { componentId: 'comp-instrument', quantity: 1 },
      { componentId: 'comp-lander', quantity: 1 },
    ],
  };

  const report = runDeterministicSimulation({
    design: lunarLanderDesign,
    catalog: SPACECRAFT_COMPONENTS,
    mission,
    destination,
    selectedObjectives: objectives,
    rocket,
    orbit,
    eventDecisions: [
      {
        eventId: 'evt-comms-drop',
        eventTitle: 'Comms',
        choiceId: 'choice-comms-reorient',
        choiceLabel: 'Reorient',
        outcomeSummary: 'OK',
        engineeringDelta: 8,
        scienceDelta: 2,
        powerDelta: -10,
        commsDelta: 15,
      },
    ],
  });

  assert.equal(report.outcome, 'SUCCESS');
  assert.ok(report.overallScore >= 80);
  assert.equal(report.successfulObjectives.length, 3);
  assert.equal(report.missedObjectives.length, 0);
});
