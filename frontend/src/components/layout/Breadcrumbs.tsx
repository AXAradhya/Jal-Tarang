import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home, ChevronDown, Star } from 'lucide-react';
import { useBookmarksStore } from '../../store/bookmarksStore';
import { showToast } from '../../store/toastStore';
import { audioService } from '../../lib/audioService';

const ROUTE_MAP: Record<string, { label: string; group: string; siblings: { path: string; label: string }[] }> = {
  '/dashboard': {
    label: 'Executive Dashboard',
    group: 'Command',
    siblings: [
      { path: '/dashboard', label: 'Executive Dashboard' },
      { path: '/control-tower', label: 'Operations Control Tower' },
      { path: '/notifications', label: 'Notifications & Alerts' },
      { path: '/settings', label: 'System Settings' },
    ],
  },
  '/control-tower': {
    label: 'Operations Control Tower',
    group: 'Command',
    siblings: [
      { path: '/dashboard', label: 'Executive Dashboard' },
      { path: '/control-tower', label: 'Operations Control Tower' },
      { path: '/notifications', label: 'Notifications & Alerts' },
      { path: '/settings', label: 'System Settings' },
    ],
  },
  '/decision': {
    label: 'Decision Center',
    group: 'Intelligence',
    siblings: [
      { path: '/decision', label: 'Decision Center' },
      { path: '/forecasting', label: 'Freight Forecasting' },
    ],
  },
  '/forecasting': {
    label: 'Freight Forecasting',
    group: 'Intelligence',
    siblings: [
      { path: '/decision', label: 'Decision Center' },
      { path: '/forecasting', label: 'Freight Forecasting' },
    ],
  },
  '/cargo': {
    label: 'Cargo Requirement',
    group: 'Operations',
    siblings: [
      { path: '/cargo', label: 'Cargo Requirement' },
      { path: '/chartering', label: 'Chartering & Vessels' },
      { path: '/procurement', label: 'Procurement' },
      { path: '/contracts', label: 'Contracts' },
      { path: '/ports', label: 'Port Intelligence' },
    ],
  },
  '/chartering': {
    label: 'Chartering & Vessels',
    group: 'Operations',
    siblings: [
      { path: '/cargo', label: 'Cargo Requirement' },
      { path: '/chartering', label: 'Chartering & Vessels' },
      { path: '/procurement', label: 'Procurement' },
      { path: '/contracts', label: 'Contracts' },
      { path: '/ports', label: 'Port Intelligence' },
    ],
  },
  '/procurement': {
    label: 'Procurement',
    group: 'Operations',
    siblings: [
      { path: '/cargo', label: 'Cargo Requirement' },
      { path: '/chartering', label: 'Chartering & Vessels' },
      { path: '/procurement', label: 'Procurement' },
      { path: '/contracts', label: 'Contracts' },
      { path: '/ports', label: 'Port Intelligence' },
    ],
  },
  '/contracts': {
    label: 'Contracts',
    group: 'Operations',
    siblings: [
      { path: '/cargo', label: 'Cargo Requirement' },
      { path: '/chartering', label: 'Chartering & Vessels' },
      { path: '/procurement', label: 'Procurement' },
      { path: '/contracts', label: 'Contracts' },
      { path: '/ports', label: 'Port Intelligence' },
    ],
  },
  '/ports': {
    label: 'Port Intelligence',
    group: 'Operations',
    siblings: [
      { path: '/cargo', label: 'Cargo Requirement' },
      { path: '/chartering', label: 'Chartering & Vessels' },
      { path: '/procurement', label: 'Procurement' },
      { path: '/contracts', label: 'Contracts' },
      { path: '/ports', label: 'Port Intelligence' },
    ],
  },
  '/risk': {
    label: 'Risk Engine',
    group: 'Risk & Scenarios',
    siblings: [
      { path: '/risk', label: 'Risk Engine' },
      { path: '/scenarios', label: 'Scenario Center' },
    ],
  },
  '/scenarios': {
    label: 'Scenario Center',
    group: 'Risk & Scenarios',
    siblings: [
      { path: '/risk', label: 'Risk Engine' },
      { path: '/scenarios', label: 'Scenario Center' },
    ],
  },
  '/freight': {
    label: 'Freight Market',
    group: 'Analytics',
    siblings: [
      { path: '/freight', label: 'Freight Market' },
      { path: '/reports', label: 'Reports' },
      { path: '/data', label: 'Data & Lineage' },
    ],
  },
  '/reports': {
    label: 'Reports',
    group: 'Analytics',
    siblings: [
      { path: '/freight', label: 'Freight Market' },
      { path: '/reports', label: 'Reports' },
      { path: '/data', label: 'Data & Lineage' },
    ],
  },
  '/data': {
    label: 'Data & Lineage',
    group: 'Analytics',
    siblings: [
      { path: '/freight', label: 'Freight Market' },
      { path: '/reports', label: 'Reports' },
      { path: '/data', label: 'Data & Lineage' },
    ],
  },
  '/copilot': {
    label: 'JAL TARANG Copilot',
    group: 'AI Intelligence',
    siblings: [{ path: '/copilot', label: 'JAL TARANG Copilot' }],
  },
  '/settings': {
    label: 'System Settings',
    group: 'Command',
    siblings: [
      { path: '/dashboard', label: 'Executive Dashboard' },
      { path: '/settings', label: 'System Settings' },
    ],
  },
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const [showSiblingMenu, setShowSiblingMenu] = useState(false);
  const { isPinned, togglePin, recordVisit } = useBookmarksStore();

  const currentRoute = ROUTE_MAP[location.pathname];
  if (!currentRoute) return null;

  const isCurrentPinned = isPinned(location.pathname);

  const handleTogglePin = () => {
    togglePin(location.pathname);
    audioService.playToggle(!isCurrentPinned);
    showToast(
      isCurrentPinned ? 'Removed from favorites' : 'Added to favorites',
      currentRoute.label,
      'info'
    );
  };

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs border-b border-slate-200/80 dark:border-slate-800/80 text-xs select-none">
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
        <Link
          to="/dashboard"
          className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Home / Dashboard"
        >
          <Home size={13} />
        </Link>

        <ChevronRight size={12} className="text-slate-400 dark:text-slate-600" />

        <span className="font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
          {currentRoute.group}
        </span>

        <ChevronRight size={12} className="text-slate-400 dark:text-slate-600" />

        {/* Current page with sibling quick-jump dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSiblingMenu((p) => !p)}
            className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-sky-400 px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>{currentRoute.label}</span>
            <ChevronDown size={11} className="text-slate-400" />
          </button>

          {showSiblingMenu && (
            <div
              className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-150"
              onClick={() => setShowSiblingMenu(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Jump in {currentRoute.group}
              </div>
              <div className="p-1 space-y-0.5">
                {currentRoute.siblings.map((sibling) => (
                  <Link
                    key={sibling.path}
                    to={sibling.path}
                    className={`block px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      sibling.path === location.pathname
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-sky-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {sibling.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Favorite / Pin Button */}
      <button
        onClick={handleTogglePin}
        title={isCurrentPinned ? 'Remove from Pinned Favorites' : 'Pin to Favorites'}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all active:scale-95 cursor-pointer ${
          isCurrentPinned
            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Star size={12} className={isCurrentPinned ? 'fill-amber-400 text-amber-500' : ''} />
        <span className="hidden sm:inline">{isCurrentPinned ? 'Pinned' : 'Pin'}</span>
      </button>
    </nav>
  );
};
