import type {
  DestinationId,
  MissionReport,
  SpacecraftDesign,
} from '../types/mission';
import { ACHIEVEMENTS_CATALOG } from '../data/seedData';

export interface UnlockedAchievement {
  id: string;
  title: string;
  description: string;
  category: 'exploration' | 'engineering' | 'science' | 'command';
  accentHex: string;
  unlocked: boolean;
  progressLabel: string;
}

export interface PlayerProgression {
  xp: number;
  level: number;
  rankTitle: string;
  nextLevelXp: number;
  unlockedCount: number;
  totalCount: number;
  achievements: UnlockedAchievement[];
  unlockedDestinations: DestinationId[];
}

const RANK_TIERS = [
  { minXp: 0, title: 'Cadet Explorer' },
  { minXp: 250, title: 'Orbital Navigator' },
  { minXp: 600, title: 'Systems Architect' },
  { minXp: 1100, title: 'Flight Director' },
  { minXp: 1800, title: 'Galactic Pioneer' },
];

export function computePlayerProgression(params: {
  reports: MissionReport[];
  exploredDestinations: DestinationId[];
  savedDesigns: SpacecraftDesign[];
}): PlayerProgression {
  const { reports, exploredDestinations, savedDesigns } = params;

  const successReports = reports.filter((r) => r.outcome === 'SUCCESS');
  const hasLunarSuccess = successReports.some((r) =>
    r.destinationName.toLowerCase().includes('moon')
  );
  const hasMarsSuccess = successReports.some((r) =>
    r.destinationName.toLowerCase().includes('mars')
  );
  const hasAsteroidSuccess = successReports.some(
    (r) =>
      r.destinationName.toLowerCase().includes('bennu') ||
      r.destinationName.toLowerCase().includes('vesta')
  );
  const bestEfficiency = reports.reduce(
    (m, r) => Math.max(m, r.resourceEfficiencyScore),
    0
  );
  const bestScience = reports.reduce((m, r) => Math.max(m, r.scienceScore), 0);
  const bestEngineering = reports.reduce((m, r) => Math.max(m, r.engineeringScore), 0);
  const hasCrisisCommand = reports.some(
    (r) => r.outcome === 'SUCCESS' && r.eventDecisions.length >= 3
  );

  const unlockedDestinations = Array.from(
    new Set<DestinationId>([
      'earth',
      ...exploredDestinations.filter((d) => d !== 'sun'),
      ...(hasLunarSuccess ? (['moon'] as DestinationId[]) : []),
      ...(hasMarsSuccess ? (['mars'] as DestinationId[]) : []),
      ...(hasAsteroidSuccess ? (['bennu', 'vesta'] as DestinationId[]) : []),
    ])
  );

  const achievements: UnlockedAchievement[] = ACHIEVEMENTS_CATALOG.map((ach) => {
    let unlocked = false;
    let progressLabel = 'Locked';

    switch (ach.id) {
      case 'ach-first-mission':
        unlocked = reports.length >= 1;
        progressLabel = unlocked ? 'Completed' : '0 / 1 flight';
        break;
      case 'ach-lunar-explorer':
        unlocked = hasLunarSuccess;
        progressLabel = unlocked ? 'Lunar Success' : 'Complete a Moon mission';
        break;
      case 'ach-mars-pathfinder':
        unlocked = hasMarsSuccess;
        progressLabel = unlocked ? 'Mars Success' : 'Complete a Mars mission';
        break;
      case 'ach-asteroid-investigator':
        unlocked = hasAsteroidSuccess;
        progressLabel = unlocked ? 'Belt Success' : 'Explore Bennu or Vesta';
        break;
      case 'ach-efficient-engineer':
        unlocked = bestEfficiency >= 88;
        progressLabel = unlocked ? `Best ${bestEfficiency}/100` : `Best ${bestEfficiency}/88`;
        break;
      case 'ach-scientific-pioneer':
        unlocked = bestScience >= 90;
        progressLabel = unlocked ? `Best ${bestScience}/100` : `Best ${bestScience}/90`;
        break;
      case 'ach-spacecraft-architect':
        unlocked = savedDesigns.length >= 2 || bestEngineering >= 92;
        progressLabel = unlocked
          ? 'Verified Design'
          : `${savedDesigns.length}/2 saved crafts`;
        break;
      case 'ach-crisis-commander':
        unlocked = hasCrisisCommand;
        progressLabel = unlocked ? 'Events Mastered' : 'Solve 3+ flight events';
        break;
      default:
        break;
    }

    return {
      ...ach,
      unlocked,
      progressLabel,
    };
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const xp =
    reports.reduce((s, r) => s + r.overallScore * 2 + (r.outcome === 'SUCCESS' ? 80 : 25), 0) +
    unlockedCount * 120 +
    exploredDestinations.filter((d) => d !== 'sun').length * 40;

  const level = Math.max(1, Math.floor(xp / 250) + 1);
  const nextLevelXp = level * 250;
  const rank =
    [...RANK_TIERS].reverse().find((t) => xp >= t.minXp)?.title ?? 'Cadet Explorer';

  return {
    xp,
    level,
    rankTitle: rank,
    nextLevelXp,
    unlockedCount,
    totalCount: achievements.length,
    achievements,
    unlockedDestinations,
  };
}
