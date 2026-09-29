import React from 'react';

interface SidebarTooltipProps {
  label: string;
  badge?: string | number;
  shortcut?: string;
  visible: boolean;
  top: number;
}

export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({
  label,
  badge,
  shortcut,
  visible,
  top,
}) => {
  if (!visible) return null;

  return (
    <div
      style={{ top }}
      className="fixed left-16 z-50 pointer-events-none select-none animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/95 text-white border border-slate-700/80 shadow-xl backdrop-blur-md text-xs font-semibold">
        <span>{label}</span>
        {badge && (
          <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.2 rounded-full font-bold">
            {badge}
          </span>
        )}
        {shortcut && (
          <kbd className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1 py-0.5 rounded border border-slate-700">
            {shortcut}
          </kbd>
        )}
      </div>
    </div>
  );
};
