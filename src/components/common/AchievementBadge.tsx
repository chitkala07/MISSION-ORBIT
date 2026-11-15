import React from 'react';
import type { UnlockedAchievement } from '../../engine/progressionEngine';

interface AchievementBadgeProps {
  achievement: UnlockedAchievement;
  compact?: boolean;
}

const renderAchievementEmblem = (id: string, color: string, unlocked: boolean) => {
  const stroke = unlocked ? color : '#64748b';
  const fill = unlocked ? `${color}28` : 'rgba(30, 41, 59, 0.45)';

  return (
    <svg viewBox="0 0 40 40" className="w-10 h-10 shrink-0" aria-hidden="true">
      <polygon
        points="20,2 36,11 36,29 20,38 4,29 4,11"
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
      />
      {id === 'ach-first-mission' && (
        <path d="M20 9 L24 21 L20 19 L16 21 Z M15 24 H25 L20 30 Z" fill={stroke} />
      )}
      {id === 'ach-lunar-explorer' && (
        <path
          d="M23 11 A9 9 0 1 0 29 26 A7 7 0 1 1 23 11 Z"
          fill={stroke}
        />
      )}
      {id === 'ach-mars-pathfinder' && (
        <>
          <circle cx="20" cy="20" r="7" fill="none" stroke={stroke} strokeWidth="2.2" />
          <path d="M13 20 H27 M20 13 V27" stroke={stroke} strokeWidth="1.6" />
        </>
      )}
      {id === 'ach-asteroid-investigator' && (
        <polygon
          points="15,12 24,11 29,19 25,28 14,27 11,18"
          fill="none"
          stroke={stroke}
          strokeWidth="2.2"
        />
      )}
      {id === 'ach-efficient-engineer' && (
        <path
          d="M21 9 L13 21 H20 L18 31 L27 18 H20 Z"
          fill={stroke}
        />
      )}
      {id === 'ach-scientific-pioneer' && (
        <>
          <ellipse cx="20" cy="20" rx="10" ry="4.5" transform="rotate(35 20 20)" fill="none" stroke={stroke} strokeWidth="1.8" />
          <ellipse cx="20" cy="20" rx="10" ry="4.5" transform="rotate(-35 20 20)" fill="none" stroke={stroke} strokeWidth="1.8" />
          <circle cx="20" cy="20" r="2.5" fill={stroke} />
        </>
      )}
      {id === 'ach-spacecraft-architect' && (
        <>
          <rect x="15" y="13" width="10" height="14" rx="1.5" fill="none" stroke={stroke} strokeWidth="2" />
          <path d="M9 17 H15 M25 17 H31 M9 23 H15 M25 23 H31" stroke={stroke} strokeWidth="2" />
        </>
      )}
      {id === 'ach-crisis-commander' && (
        <path
          d="M20 9 L29 14 V21 C29 26 24.5 29.5 20 31 C15.5 29.5 11 26 11 21 V14 Z"
          fill="none"
          stroke={stroke}
          strokeWidth="2.2"
        />
      )}
    </svg>
  );
};

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  compact = false,
}) => {
  const { id, title, description, accentHex, unlocked, progressLabel } = achievement;

  return (
    <div
      className={`rounded-xl border p-4 flex items-start gap-3.5 transition-all ${
        unlocked
          ? 'bg-[#101836] border-cyan-400/40 shadow-[0_0_24px_rgba(34,211,238,0.12)] badge-pop'
          : 'bg-[#090d22]/85 border-slate-800/90 opacity-75'
      }`}
    >
      {renderAchievementEmblem(id, accentHex, unlocked)}

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-display text-sm font-bold text-white leading-snug">
            {title}
          </h3>
          <span
            className="text-[11px] font-mono font-semibold"
            style={{ color: unlocked ? accentHex : '#94a3b8' }}
          >
            {unlocked ? 'Unlocked' : progressLabel}
          </span>
        </div>

        {!compact && (
          <p className="text-xs text-slate-300 leading-relaxed pt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
};
