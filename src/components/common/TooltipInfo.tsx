import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipInfoProps {
  term: string;
  explanation: string;
}

export const TooltipInfo: React.FC<TooltipInfoProps> = ({ term, explanation }) => {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center align-middle ml-1.5">
      <button
        type="button"
        aria-label={`Explain ${term}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-cyan-300 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-3 rounded-lg bg-[#0F172A] border border-slate-700 text-xs leading-relaxed text-slate-200 shadow-xl pointer-events-none"
        >
          <span className="block font-semibold text-cyan-300 mb-1">{term}</span>
          <span>{explanation}</span>
        </span>
      )}
    </span>
  );
};
