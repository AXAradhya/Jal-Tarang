import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { SystemRole } from '../../types';
import { Shield, ChevronDown, Check } from 'lucide-react';
import { showToast } from '../../store/toastStore';
import { audioService } from '../../lib/audioService';

const ROLES: { id: SystemRole; label: string; desc: string }[] = [
  { id: 'CHARTERING_MANAGER', label: 'Chartering Desk', desc: 'Vessel fixtures & laytime' },
  { id: 'PORT_MANAGER', label: 'Port Logistics', desc: 'Berths, queues & demurrage' },
  { id: 'PROCUREMENT_MANAGER', label: 'Procurement', desc: 'Coal supply & plant stocks' },
  { id: 'ANALYST', label: 'Market Analyst', desc: 'FFA curves & ML forecasts' },
  { id: 'SUPER_ADMIN', label: 'Super Admin', desc: 'System governance & overrides' },
];

export const RoleSwitcher: React.FC = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentRole = (user?.roles?.[0] as SystemRole) || 'CHARTERING_MANAGER';

  const handleSelectRole = (newRole: SystemRole) => {
    if (newRole === currentRole) {
      setIsOpen(false);
      return;
    }
    // Update active role in auth store
    useAuthStore.setState((state) => ({
      user: state.user ? { ...state.user, roles: [newRole] } : null,
    }));
    audioService.playClick();
    showToast(
      'Role Persona Switched',
      `Now viewing platform as ${ROLES.find((r) => r.id === newRole)?.label}`,
      'info'
    );
    setIsOpen(false);
  };

  const activeObj = ROLES.find((r) => r.id === currentRole) || ROLES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((p) => !p)}
        title="Preview platform persona & role-based features"
        className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-[10.5px] font-semibold text-blue-700 dark:text-sky-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all cursor-pointer flex-shrink-0"
      >
        <Shield size={11} className="text-blue-600 dark:text-sky-400 flex-shrink-0" />
        <span className="truncate max-w-[75px] lg:max-w-[95px] xl:max-w-[110px]">{activeObj.label}</span>
        <ChevronDown size={11} className={`text-blue-500/70 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 py-1 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Switch Perspective / Persona
          </div>
          <div className="p-1 space-y-0.5">
            {ROLES.map((role) => {
              const isSelected = role.id === currentRole;
              return (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-sky-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold leading-tight">{role.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {role.desc}
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="text-blue-600 dark:text-sky-400" />}
                </button>
              );
            })}
          </div>
        </div>
        </>
      )}
    </div>
  );
};
