import React, { useState, useEffect } from 'react';
import { ModelStatus, SortField, SortOrder } from '../types';
import { ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, AlertTriangle, Lock, Unlock, Clock, Info } from 'lucide-react';
import { formatUnlockTime, formatSuccessRate } from '../utils/timeUtils';

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

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-slate-800" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-slate-800" />
    );
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return dateStr;
    }
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

  return (
    <div id="status-table-wrapper" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-medium select-none">
              <th
                onClick={() => onSort('rank')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group w-16"
              >
                <div className="flex items-center gap-1">
                  <span>#</span>
                  {renderSortIcon('rank')}
                </div>
              </th>

              <th
                onClick={() => onSort('provider')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Provider</span>
                  {renderSortIcon('provider')}
                </div>
              </th>

              <th
                onClick={() => onSort('model')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Model Identifier</span>
                  {renderSortIcon('model')}
                </div>
              </th>

              <th
                onClick={() => onSort('status')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              <th
                onClick={() => onSort('tier')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Tier</span>
                  {renderSortIcon('tier')}
                </div>
              </th>

              <th
                onClick={() => onSort('averageTimeSeconds')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Avg Latency</span>
                  {renderSortIcon('averageTimeSeconds')}
                </div>
              </th>

              <th
                onClick={() => onSort('successRatePercent')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>Success Rate</span>
                  {renderSortIcon('successRatePercent')}
                </div>
              </th>

              <th className="py-3 px-4 text-center">
                <span>Lock</span>
              </th>

              <th className="py-3 px-4 text-right">
                <span>Last Tested</span>
              </th>

              <th className="py-3 px-4 text-center w-16">
                <span>Action</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {models.map((item) => {
              const isHealthy = item.status.toLowerCase() === 'healthy';
              const rateColor =
                item.successRatePercent === 100
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
                  <td className="py-3 px-4 font-semibold text-slate-500 text-xs">
                    {item.rank}
                  </td>

                  {/* Provider */}
                  <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/60 text-xs font-semibold text-slate-700">
                      {item.provider}
                    </span>
                  </td>

                  {/* Model */}
                  <td className="py-3 px-4 font-mono text-xs text-slate-900 font-medium">
                    <span className="group-hover:text-blue-600 transition-colors">
                      {item.model}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {isHealthy ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Healthy
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Unhealthy
                      </span>
                    )}
                  </td>

                  {/* Tier */}
                  <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-sm font-medium ${
                      item.tier.includes('Tier 1')
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-amber-50 text-amber-800 border border-amber-100'
                    }`}>
                      {item.tier}
                    </span>
                  </td>

                  {/* Avg Latency */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className={`font-mono font-semibold text-xs ${
                      item.averageTimeSeconds < 3
                        ? 'text-emerald-600'
                        : item.averageTimeSeconds < 6
                        ? 'text-slate-800'
                        : 'text-amber-700'
                    }`}>
                      {item.averageTimeSeconds.toFixed(3)}s
                    </span>
                  </td>

                  {/* Success Rate */}
                  <td className="py-3 px-4 min-w-[170px]">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden min-w-[36px]">
                        <div
                          className={`h-full transition-all ${rateColor}`}
                          style={{ width: `${Math.min(100, Math.max(0, item.successRatePercent))}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-medium text-slate-700 min-w-[42px] text-right shrink-0">
                        {formatSuccessRate(item.successRatePercent)}%
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        ({item.successfulRequests}/{item.totalRequests})
                      </span>
                    </div>
                  </td>

                  {/* Locked */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {item.isLocked ? (
                      <div
                        className="inline-flex flex-col items-center justify-center px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-700 min-w-[120px]"
                        title={item.unlocksAtUtc ? `Unlocks at ${item.unlocksAtUtc}` : 'Model is locked'}
                      >
                        <div className="inline-flex items-center gap-1 font-semibold text-xs text-rose-800">
                          <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Locked</span>
                        </div>
                        {item.unlocksAtUtc && (
                          <span className="text-[11px] font-mono text-rose-600 font-medium flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                            <span>{formatUnlockTime(item.unlocksAtUtc, now)}</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-medium opacity-80" title="Unlocked">
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Unlocked</span>
                      </span>
                    )}
                  </td>

                  {/* Last Tested */}
                  <td className="py-3 px-4 text-right text-xs text-slate-500 font-mono whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1" title={item.lastTestedUtc}>
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatTimestamp(item.lastTestedUtc)}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectModel(item);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View model details"
                    >
                      <Info className="w-4 h-4" />
                    </button>
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
