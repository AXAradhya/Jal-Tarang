import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface InlineSuggestionBadgeProps {
  label: string;
  suggestedValue: string | number;
  economicImpact?: string;
  onApply?: (value: string | number) => void;
  tooltipText?: string;
}

export const InlineSuggestionBadge: React.FC<InlineSuggestionBadgeProps> = ({
  label,
  suggestedValue,
  economicImpact,
  onApply,
  tooltipText,
}) => {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-xs text-blue-900 dark:text-blue-300 animate-fade-in group hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all cursor-pointer shadow-2xs"
      title={tooltipText || `AI Suggestion: ${label}`}
      onClick={() => onApply && onApply(suggestedValue)}
    >
      <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
        AI: <span className="font-bold text-slate-900 dark:text-white">{String(suggestedValue)}</span>
      </span>
      {economicImpact && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-500/30">
          {economicImpact}
        </span>
      )}
      {onApply && (
        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold ml-1 opacity-90 group-hover:opacity-100 flex items-center">
          Apply <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
        </span>
      )}
    </div>
  );
};
