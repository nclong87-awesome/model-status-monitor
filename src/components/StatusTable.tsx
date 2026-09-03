import React, { useState, useEffect } from 'react';
import { ModelStatus, SortField, SortOrder } from '../types';
import { ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { formatUnlockTime, formatSuccessRate, formatDateTime, formatRelativeTime } from '../utils/timeUtils';

interface StatusTableProps {
  models: ModelStatus[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onSelectModel: (model: ModelStatus) => void;
}

export const StatusTable: React.FC<StatusTableProps> = ({
  models,
  sortField,
  sortOrder,
  onSort,
  onSelectModel,
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-80 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
    );
  };

  if (models.length === 0) {
    return (
      <div id="no-models-found" className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-slate-800 font-semibold text-lg">No matching LLM models</h3>
        <p className="text-slate-500 text-sm mt-1">Try adjusting your search query or filter criteria.</p>
      </div>
    );
  }

  const cellPadding = density === 'compact' ? 'py-2 px-3' : 'py-2.5 px-3.5';

  return (
    <div id="status-table-wrapper" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Table Toolbar Header with Count and Density Toggle */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 border-b border-slate-200/80 text-xs text-slate-500">
        <div className="flex items-center gap-2 font-medium">
          <span>{models.length} {models.length === 1 ? 'model' : 'models'}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-400">Click any row for details</span>
        </div>

        {/* Density Toggle */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setDensity('comfortable')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              density === 'comfortable'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Comfortable row height"
          >
            Comfortable
          </button>
          <button
            type="button"
            onClick={() => setDensity('compact')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              density === 'compact'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Compact condensed view"
          >
            Compact
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider select-none">
              <th
                onClick={() => onSort('rank')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors group w-12 text-center"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>#</span>
                  {renderSortIcon('rank')}
                </div>
              </th>

              <th
                onClick={() => onSort('provider')}
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Provider</span>
                  {renderSortIcon('provider')}
                </div>
              </th>

              <th
                onClick={() => onSort('model')}
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Model Identifier</span>
                  {renderSortIcon('model')}
                </div>
              </th>

              <th
                onClick={() => onSort('status')}
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              <th
                onClick={() => onSort('tier')}
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Tier</span>
                  {renderSortIcon('tier')}
                </div>
              </th>

              <th
                onClick={() => onSort('averageTimeSeconds')}
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/80 transition-colors group text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Latency</span>
                  {renderSortIcon('averageTimeSeconds')}
                </div>
              </th>

              <th
                onClick={() => onSort('successRatePercent')}
                className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Success Rate</span>
                  {renderSortIcon('successRatePercent')}
                </div>
              </th>

              <th className="py-2.5 px-3.5 text-center">
                <span>Availability</span>
              </th>

              <th
                onClick={() => onSort('lastTestedUtc')}
                className="py-2.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Last Tested</span>
                  {renderSortIcon('lastTestedUtc')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {models.map((item) => {
              const statusLower = item.status?.toLowerCase() || 'untested';
              const isHealthy = statusLower === 'healthy';
              const isUntested = statusLower === 'untested';
              
              const rateColor =
                item.successRatePercent === null || item.successRatePercent === undefined
                  ? 'bg-slate-300'
                  : item.successRatePercent === 100
                  ? 'bg-emerald-500'
                  : item.successRatePercent >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500';

              return (
                <tr
                  key={`${item.provider}-${item.model}-${item.rank}`}
                  onClick={() => onSelectModel(item)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Rank */}
                  <td className={`${cellPadding} font-mono text-slate-400 text-xs text-center`}>
                    {item.rank}
                  </td>

                  {/* Provider - Clean typography without bulky badge */}
                  <td className={`${cellPadding} font-semibold text-xs text-slate-800 whitespace-nowrap`}>
                    {item.provider}
                  </td>

                  {/* Model Identifier - Primary visual focus */}
                  <td className={`${cellPadding} font-mono text-xs text-slate-900 font-medium`}>
                    <span className="group-hover:text-blue-600 transition-colors">
                      {item.model}
                    </span>
                  </td>

                  {/* Status - Clean dot indicator without bulky pill */}
                  <td className={`${cellPadding} whitespace-nowrap`}>
                    {isHealthy ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Healthy</span>
                      </div>
                    ) : isUntested ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                        <span>Untested</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/70">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        <span>Unhealthy</span>
                      </div>
                    )}
                  </td>

                  {/* Tier - Subtle light tag */}
                  <td className={`${cellPadding} whitespace-nowrap`}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-600 bg-slate-100">
                      {item.tier}
                    </span>
                  </td>

                  {/* Avg Latency */}
                  <td className={`${cellPadding} text-right whitespace-nowrap`}>
                    {item.averageTimeSeconds != null ? (
                      <span className={`font-mono text-xs font-medium ${
                        item.averageTimeSeconds < 3
                          ? 'text-emerald-600'
                          : item.averageTimeSeconds < 6
                          ? 'text-slate-700'
                          : 'text-amber-700'
                      }`}>
                        {item.averageTimeSeconds.toFixed(3)}s
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-slate-400">—</span>
                    )}
                  </td>

                  {/* Success Rate - Sleek compact bar */}
                  <td className={`${cellPadding} min-w-[140px]`}>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${rateColor}`}
                          style={{ width: `${Math.min(100, Math.max(0, item.successRatePercent ?? 0))}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-medium text-slate-700 min-w-[36px]">
                        {item.successRatePercent != null ? `${formatSuccessRate(item.successRatePercent)}%` : '—'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({item.successfulRequests ?? 0}/{item.totalRequests ?? 0})
                      </span>
                    </div>
                  </td>

                  {/* Availability / Lock - Quiet default state, highlighted locked state */}
                  <td className={`${cellPadding} text-center whitespace-nowrap`}>
                    {item.isLocked ? (
                      <div
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium"
                        title={item.unlocksAtUtc ? `Locked until ${item.unlocksAtUtc}` : 'Model is locked'}
                      >
                        <Lock className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>Locked</span>
                        {item.unlocksAtUtc && (
                          <span className="text-[11px] font-mono text-rose-600/90 font-normal">
                            ({formatUnlockTime(item.unlocksAtUtc, now)})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-slate-400 text-xs"
                        title="Model is ready and unlocked"
                      >
                        <Unlock className="w-3 h-3 text-slate-300 group-hover:text-slate-400 transition-colors" />
                        <span className="text-slate-400 text-xs">Ready</span>
                      </span>
                    )}
                  </td>

                  {/* Last Tested - Relative clean time with tooltip */}
                  <td className={`${density === 'compact' ? 'py-2 px-4' : 'py-2.5 px-4'} text-right whitespace-nowrap`}>
                    <span
                      className="font-mono text-xs text-slate-500 hover:text-slate-800 transition-colors"
                      title={formatDateTime(item.lastTestedUtc)}
                    >
                      {formatRelativeTime(item.lastTestedUtc, now)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

