import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Radio, Bot, Bell, Search } from 'lucide-react';

interface MobileNavBarProps {
  onOpenSearch: () => void;
  onOpenCopilot: () => void;
  unreadCount?: number;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  onOpenSearch,
  onOpenCopilot,
  unreadCount = 0,
}) => {
  const location = useLocation();

  const navButtons = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      label: 'Tower',
      path: '/control-tower',
      icon: <Radio size={18} />,
    },
    {
      label: 'Copilot',
      onClick: onOpenCopilot,
      icon: <Bot size={18} />,
      isSpecial: true,
    },
    {
      label: 'Alerts',
      path: '/notifications',
      icon: <Bell size={18} />,
      badge: unreadCount,
    },
    {
      label: 'Search',
      onClick: onOpenSearch,
      icon: <Search size={18} />,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 px-2 flex items-center justify-around select-none shadow-lg">
      {navButtons.map((btn, idx) => {
        const isActive = btn.path ? location.pathname === btn.path : false;

        if (btn.isSpecial) {
          return (
            <button
              key={idx}
              onClick={btn.onClick}
              className="flex flex-col items-center justify-center -mt-4 w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg active:scale-90 transition-transform"
            >
              {btn.icon}
            </button>
          );
        }

        const content = (
          <div className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 relative">
            <span
              className={
                isActive
                  ? 'text-blue-600 dark:text-sky-400'
                  : 'text-slate-500 dark:text-slate-400'
              }
            >
              {btn.icon}
            </span>
            <span
              className={`text-[10px] font-medium leading-none ${
                isActive
                  ? 'text-blue-600 dark:text-sky-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {btn.label}
            </span>
            {btn.badge && btn.badge > 0 ? (
              <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                {btn.badge > 9 ? '9+' : btn.badge}
              </span>
            ) : null}
          </div>
        );

        if (btn.path) {
          return (
            <Link key={idx} to={btn.path} className="flex-1 text-center">
              {content}
            </Link>
          );
        }

        return (
          <button key={idx} onClick={btn.onClick} className="flex-1 text-center">
            {content}
          </button>
        );
      })}
    </div>
  );
};
