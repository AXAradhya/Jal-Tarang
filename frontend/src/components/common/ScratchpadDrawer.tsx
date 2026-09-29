import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { X, FileEdit, Trash2, Check, Copy } from 'lucide-react';
import { showToast } from '../../store/toastStore';
import { audioService } from '../../lib/audioService';

interface ScratchpadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScratchpadDrawer: React.FC<ScratchpadDrawerProps> = ({ isOpen, onClose }) => {
  const [note, setNote] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sail_charterer_scratchpad') || '';
      setNote(saved);
      if (saved) setLastSaved('Restored from memory');
    }
  }, []);

  const handleChange = (val: string) => {
    setNote(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sail_charterer_scratchpad', val);
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all notes in the scratchpad?')) {
      handleChange('');
      showToast('Scratchpad cleared', undefined, 'info');
    }
  };

  const handleCopy = async () => {
    if (!note) return;
    await navigator.clipboard.writeText(note);
    audioService.playSuccess();
    showToast('Notes copied to clipboard', undefined, 'success');
  };

  // iOS-style smooth open and close drawer lifecycle
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animClass, setAnimClass] = useState(isOpen ? 'animate-ios-drawer-open' : '');
  const [backdropClass, setBackdropClass] = useState(isOpen ? 'animate-ios-backdrop-open' : '');
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);

    if (isOpen) {
      setShouldRender(true);
      setAnimClass('animate-ios-drawer-open');
      setBackdropClass('animate-ios-backdrop-open');
    } else if (shouldRender) {
      setAnimClass('animate-ios-drawer-close');
      setBackdropClass('animate-ios-backdrop-close');
      animTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setAnimClass('');
        setBackdropClass('');
      }, 260);
    }

    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn("fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs", backdropClass)}
      onClick={onClose}
    >
      <div
        className={cn("w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col", animClass)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <FileEdit size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Charterer's Scratchpad
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lastSaved ? `Auto-saved at ${lastSaved}` : 'Type notes, fixture numbers, or quotes'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              disabled={!note}
              title="Copy notes"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <Copy size={15} />
            </button>
            <button
              onClick={handleClear}
              disabled={!note}
              title="Clear scratchpad"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 transition-colors"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Note area */}
        <div className="flex-1 p-4 flex flex-col">
          <textarea
            value={note}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Jot down quick freight calculations, laytime terms, vessel positions, broker quotes...

• MV SAIL GLORY - Gladstone to Vizag ($14.20/t)
• Demurrage rate: $18,500/day
• Target laycan: 12 - 18 Oct"
            className="flex-1 w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-slate-100 leading-relaxed placeholder:text-slate-400"
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Persists in browser storage</span>
          <span className="font-mono">{note.length} chars</span>
        </div>
      </div>
    </div>
  );
};
