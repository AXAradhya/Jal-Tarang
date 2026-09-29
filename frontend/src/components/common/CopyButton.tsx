import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { audioService } from '../../lib/audioService';
import { showToast } from '../../store/toastStore';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  size?: number;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  label = 'value',
  className,
  size = 12,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      audioService.playSuccess();
      setCopied(true);
      showToast('Copied to clipboard', value, 'success', 2500);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      showToast('Failed to copy', undefined, 'error');
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={`Copy ${label}: ${value}`}
      className={cn(
        'inline-flex items-center justify-center p-1 rounded-md transition-all active:scale-90',
        copied
          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
        className
      )}
    >
      {copied ? <Check size={size} className="text-emerald-500 animate-in zoom-in-75 duration-150" /> : <Copy size={size} />}
    </button>
  );
};
