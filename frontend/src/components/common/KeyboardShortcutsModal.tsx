import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { X, Keyboard, Command, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Navigation' | 'Actions' | 'Copilot & AI' | 'Display';
}

const SHORTCUTS: ShortcutItem[] = [
  // Navigation
  { keys: ['Ctrl', 'K'], description: 'Open Global Command Search', category: 'Navigation' },
  { keys: ['G', 'D'], description: 'Go to Executive Dashboard', category: 'Navigation' },
  { keys: ['G', 'C'], description: 'Go to Chartering Desk', category: 'Navigation' },
  { keys: ['G', 'P'], description: 'Go to Port Intelligence', category: 'Navigation' },
  { keys: ['G', 'F'], description: 'Go to Freight Forecasting', category: 'Navigation' },
  { keys: ['G', 'S'], description: 'Go to System Settings', category: 'Navigation' },

  // Actions
  { keys: ['Ctrl', 'S'], description: 'Open Quick Scenario Simulator', category: 'Actions' },
  { keys: ['Ctrl', 'N'], description: 'Open Charterer Scratchpad', category: 'Actions' },
  { keys: ['Ctrl', 'L'], description: 'Open Demurrage Calculator', category: 'Actions' },
  { keys: ['Esc'], description: 'Close any open modal or drawer', category: 'Actions' },

  // Copilot & AI
  { keys: ['Ctrl', '/'], description: 'Toggle JAL TARANG Copilot Assistant', category: 'Copilot & AI' },
  { keys: ['Ctrl', 'Enter'], description: 'Submit prompt to Copilot', category: 'Copilot & AI' },

  // Display
  { keys: ['T'], description: 'Toggle Dark / Light Mode', category: 'Display' },
  { keys: ['?'], description: 'Show this Keyboard Shortcuts help', category: 'Display' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  // iOS-style smooth open and close lifecycle
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animClass, setAnimClass] = useState(isOpen ? 'animate-ios-search-open' : '');
  const [backdropClass, setBackdropClass] = useState(isOpen ? 'animate-ios-backdrop-open' : '');
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);

    if (isOpen) {
      setShouldRender(true);
      setAnimClass('animate-ios-search-open');
      setBackdropClass('animate-ios-backdrop-open');
    } else if (shouldRender) {
      setAnimClass('animate-ios-search-close');
      setBackdropClass('animate-ios-backdrop-close');
      animTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setAnimClass('');
        setBackdropClass('');
      }, 230);
    }

    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const categories = ['Navigation', 'Actions', 'Copilot & AI', 'Display'] as const;

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm", backdropClass)}
      onClick={onClose}
    >
      <div
        className={cn("relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6", animClass)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-sky-400">
              <Keyboard size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Keyboard Shortcuts
                <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 px-2 py-0.5 rounded-full">
                  JAL TARANG
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speed up your chartering and port logistics workflows with hotkeys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-5 max-h-[65vh] overflow-y-auto pr-1">
          {categories.map((cat) => {
            const items = SHORTCUTS.filter((s) => s.category === cat);
            return (
              <div key={cat} className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {cat}
                </h3>
                <div className="space-y-1.5">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((k, i) => (
                          <kbd
                            key={i}
                            className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded shadow-2xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" />
            <span>Tip: Press <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">?</kbd> anywhere to open this dialog</span>
          </div>
          <span>Press <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
