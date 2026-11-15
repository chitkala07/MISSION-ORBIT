import React from 'react';

interface RadialGaugeProps {
  label: string;
  valueText: string;
  subValueText?: string;
  sublabel?: string;
  percent: number;
  colorHex: string;
  size?: number;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  label,
  valueText,
  subValueText,
  sublabel,
  percent,
  colorHex,
  size = 96,
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.16)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorHex}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 450ms cubic-bezier(0.16, 1, 0.3, 1)',
              filter: `drop-shadow(0 0 6px ${colorHex}80)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
          <span className="font-mono tabular-nums text-sm font-bold text-white leading-tight">
            {valueText}
          </span>
          <span className="font-mono tabular-nums text-[10px] text-slate-400">
            {subValueText ?? `${Math.round(clamped)}%`}
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-200">{label}</p>
        {sublabel && <p className="text-[11px] text-slate-400">{sublabel}</p>}
      </div>
    </div>
  );
};
