import test from 'node:test';
import assert from 'node:assert/strict';
import { computePlayerProgression } from './progressionEngine';
import { INITIAL_SEED_REPORTS, DEFAULT_SPACECRAFT_DESIGN } from '../data/seedData';

test('computes unlocked achievements and XP from mission history', () => {
  const prog = computePlayerProgression({
    reports: INITIAL_SEED_REPORTS,
    exploredDestinations: ['earth', 'moon', 'mars'],
    savedDesigns: [DEFAULT_SPACECRAFT_DESIGN],
  });

  assert.equal(prog.unlockedCount >= 4, true);
  assert.equal(
    prog.achievements.find((a) => a.id === 'ach-first-mission')?.unlocked,
    true
  );
  assert.equal(
    prog.achievements.find((a) => a.id === 'ach-lunar-explorer')?.unlocked,
    true
  );
  assert.equal(
    prog.achievements.find((a) => a.id === 'ach-mars-pathfinder')?.unlocked,
    false
  );
  assert.equal(prog.xp > 0, true);
});

test('unlocks Crisis Commander when a successful flight resolves 3+ events', () => {
  const crisisReport = {
    ...INITIAL_SEED_REPORTS[0],
    id: 'rep-crisis-test',
    destinationName: 'Mars',
    eventDecisions: [
      {
        eventId: 'e1',
        eventTitle: 'E1',
        choiceId: 'c1',
        choiceLabel: 'C1',
        outcomeSummary: 'OK',
        engineeringDelta: 5,
        scienceDelta: 5,
        powerDelta: 0,
        commsDelta: 0,
      },
      {
        eventId: 'e2',
        eventTitle: 'E2',
        choiceId: 'c2',
        choiceLabel: 'C2',
        outcomeSummary: 'OK',
        engineeringDelta: 5,
        scienceDelta: 5,
        powerDelta: 0,
        commsDelta: 0,
      },
      {
        eventId: 'e3',
        eventTitle: 'E3',
        choiceId: 'c3',
        choiceLabel: 'C3',
        outcomeSummary: 'OK',
        engineeringDelta: 5,
        scienceDelta: 5,
        powerDelta: 0,
        commsDelta: 0,
      },
    ],
  };

  const prog = computePlayerProgression({
    reports: [crisisReport],
    exploredDestinations: ['earth', 'mars'],
    savedDesigns: [DEFAULT_SPACECRAFT_DESIGN],
  });

  assert.equal(
    prog.achievements.find((a) => a.id === 'ach-crisis-commander')?.unlocked,
    true
  );
  assert.equal(
    prog.achievements.find((a) => a.id === 'ach-mars-pathfinder')?.unlocked,
    true
  );
});
