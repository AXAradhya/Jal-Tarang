import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from '../common';
import {
  Download,
  SlidersHorizontal,
  Search,
  Check,
  Eye,
  EyeOff,
  X,
  FileSpreadsheet,
  FileCode,
  Info,
} from 'lucide-react';
import { audioService } from '../../lib/audioService';
import { showToast } from '../../store/toastStore';

export interface Column<T = any> {
  key: string;
  header: string;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'right' | 'center';
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  defaultHidden?: boolean;
}

interface EnterpriseDataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  rowKey?: (row: T) => string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string;
  emptyMessage?: string;
  caption?: string;
  stickyHeader?: boolean;
  maxHeight?: string;
  enableSearch?: boolean;
  enableExport?: boolean;
  enableColumnToggle?: boolean;
  searchPlaceholder?: string;
}

export function EnterpriseDataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey = (row) => row.id ?? JSON.stringify(row),
  loading,
  onRowClick,
  selectedRowKey,
  emptyMessage = 'No records found',
  caption,
  stickyHeader = true,
  maxHeight,
  enableSearch = true,
  enableExport = true,
  enableColumnToggle = true,
  searchPlaceholder = 'Search table records…',
}: EnterpriseDataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    columns.filter((c) => !c.defaultHidden).map((c) => c.key)
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [inspectRow, setInspectRow] = useState<T | null>(null);

  const handleSort = (key: string) => {
    audioService.playClick();
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleColumn = (key: string) => {
    audioService.playToggle(!visibleColumns.includes(key));
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Filtered by search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? '').toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  // Sorted data
  const sorted = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const activeColumns = columns.filter((c) => visibleColumns.includes(c.key));

  // CSV Export
  const handleExportCsv = () => {
    if (sorted.length === 0) return;
    audioService.playClick();
    const headers = activeColumns.map((c) => c.header).join(',');
    const rows = sorted.map((row) =>
      activeColumns
        .map((c) => {
          const val = row[c.key];
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${caption ? caption.toLowerCase().replace(/\s+/g, '_') : 'table_export'}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Complete', `Exported ${sorted.length} records to CSV`, 'success');
  };

  // JSON Export
  const handleExportJson = () => {
    if (sorted.length === 0) return;
    audioService.playClick();
    const jsonStr = JSON.stringify(sorted, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${caption ? caption.toLowerCase().replace(/\s+/g, '_') : 'table_export'}_${Date.now()}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Complete', `Exported ${sorted.length} records to JSON`, 'success');
  };

  const handleRowClick = (row: T) => {
    if (onRowClick) {
      onRowClick(row);
    } else {
      setInspectRow(row);
    }
  };

  return (
    <div
      className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs"
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
    >
      {/* Table Header & Utility Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          {caption && (
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {caption}
            </span>
          )}
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-750">
            {sorted.length} of {data.length} {data.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Inline Search Bar */}
          {enableSearch && (
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-7 pr-6 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          )}

          {/* Column Visibility Customizer */}
          {enableColumnToggle && (
            <div className="relative">
              <button
                onClick={() => setShowColumnMenu((p) => !p)}
                title="Customize visible columns"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <SlidersHorizontal size={12} />
                <span className="hidden sm:inline">Columns</span>
              </button>

              {showColumnMenu && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Visible Columns
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-0.5">
                    {columns.map((col) => {
                      const isVis = visibleColumns.includes(col.key);
                      return (
                        <button
                          key={col.key}
                          onClick={() => toggleColumn(col.key)}
                          className="w-full flex items-center justify-between px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-pointer"
                        >
                          <span className="truncate">{col.header}</span>
                          {isVis ? (
                            <Check size={13} className="text-blue-600 dark:text-sky-400" />
                          ) : (
                            <span className="w-3" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <button
                      onClick={() => setVisibleColumns(columns.map((c) => c.key))}
                      className="text-[10px] text-blue-600 dark:text-sky-400 hover:underline"
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => setShowColumnMenu(false)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Actions */}
          {enableExport && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleExportCsv}
                title="Export visible records to CSV"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <FileSpreadsheet size={12} className="text-emerald-500" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={handleExportJson}
                title="Export visible records to JSON"
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <FileCode size={12} className="text-sky-500" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-xs border-collapse">
          <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
              {activeColumns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width, minWidth: col.minWidth || col.width }}
                  className={cn(
                    'px-3.5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider whitespace-nowrap',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sortable &&
                      'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors',
                    col.className
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-blue-600 dark:text-sky-400">
                        {sortDir === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                    {col.sortable && sortKey !== col.key && (
                      <span className="opacity-30">⇅</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={activeColumns.length} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <LoadingSpinner size="sm" />
                    <span className="text-xs">Loading records…</span>
                  </div>
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={activeColumns.length}
                  className="py-12 text-center text-slate-400 text-xs"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row, idx) => {
                const key = rowKey(row);
                const isSelected = selectedRowKey === key;
                return (
                  <tr
                    key={key}
                    onClick={() => handleRowClick(row)}
                    className={cn(
                      'border-b border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer',
                      idx % 2 === 0
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-slate-50/50 dark:bg-slate-850/40',
                      'hover:bg-blue-50/60 dark:hover:bg-slate-800/70',
                      isSelected && 'bg-blue-50/90 dark:bg-blue-950/50 font-medium'
                    )}
                  >
                    {activeColumns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-3.5 py-2.5 whitespace-nowrap text-slate-800 dark:text-slate-200 text-xs',
                          col.align === 'right' && 'text-right tabular-nums',
                          col.align === 'center' && 'text-center',
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(row[col.key], row, idx)
                          : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Row Inspection Side Drawer */}
      {inspectRow && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setInspectRow(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-250 p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-sky-400">
                  <Info size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Record Inspection
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Detailed field-level specifications
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectRow(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-2.5">
              {Object.entries(inspectRow).map(([key, val]) => (
                <div
                  key={key}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750 flex flex-col"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5 break-all">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setInspectRow(null)}
              className="mt-auto w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
