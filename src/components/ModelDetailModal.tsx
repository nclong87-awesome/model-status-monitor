import React, { useState, useEffect } from 'react';
import { ModelStatus } from '../types';
import { X, CheckCircle2, AlertTriangle, Lock, Unlock, Clock, Shield, Server } from 'lucide-react';
import { formatUnlockTime, formatSuccessRate, formatDateTime } from '../utils/timeUtils';

interface ModelDetailModalProps {
  model: ModelStatus | null;
  onClose: () => void;
  onToggleLock?: (model: ModelStatus, durationMinutes?: number) => void;
}

export const ModelDetailModal: React.FC<ModelDetailModalProps> = ({ model, onClose, onToggleLock }) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!model) return null;

  const statusLower = model.status?.toLowerCase() || 'untested';
  const isHealthy = statusLower === 'healthy';
  const relativeUnlockTime = model.isLocked ? formatUnlockTime(model.unlocksAtUtc, now) : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
              Rank #{model.rank}
            </span>
            <span className="text-sm font-semibold text-slate-900">{model.provider}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Model Name</div>
            <div className="font-mono text-base font-bold text-slate-900 break-all bg-slate-50 p-3 rounded-lg border border-slate-200">
              {model.model}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                <Server className="w-3.5 h-3.5" />
                Health Status
              </div>
              {isHealthy ? (
                <div className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Healthy
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-rose-700 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Unhealthy
                </div>
              )}
            </div>

            {/* Lock Status */}
            <div className={`p-3 rounded-lg border ${model.isLocked ? 'bg-rose-50/80 border-rose-200/80' : 'bg-slate-50 border-slate-100'}`}>
              <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Circuit Lock
              </div>
              {model.isLocked ? (
                <div>
                  <div className="inline-flex items-center gap-1.5 text-rose-800 font-bold text-sm">
                    <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                    Locked
                  </div>
                  <div className="text-xs font-semibold text-rose-700 mt-1 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>Unlocks {relativeUnlockTime}</span>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-sm">
                  <Unlock className="w-4 h-4 text-emerald-600" />
                  Unlocked
                </div>
              )}
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Tier Category</span>
              <span className="font-medium text-slate-800">{model.tier}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Average Response Time</span>
              <span className="font-mono font-semibold text-slate-800">
                {model.averageTimeSeconds != null ? `${model.averageTimeSeconds.toFixed(3)}s` : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Successful / Total Requests</span>
              <span className="font-mono font-semibold text-slate-800">
                {model.successfulRequests ?? 0} / {model.totalRequests ?? 0} ({model.successRatePercent != null ? `${formatSuccessRate(model.successRatePercent)}%` : 'N/A'})
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Consecutive Failures</span>
              <span className={`font-mono font-semibold ${(model.consecutiveFailures ?? 0) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {model.consecutiveFailures ?? 0}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Last Tested</span>
              <span className="font-mono text-slate-700">{formatDateTime(model.lastTestedUtc)}</span>
            </div>

            {model.isLocked && (
              <div className="py-2.5 px-3 bg-amber-50/90 border border-amber-200/80 rounded-lg space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-amber-900 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    Unlock Countdown
                  </span>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded border border-amber-300">
                    {relativeUnlockTime}
                  </span>
                </div>
                {model.unlocksAtUtc && (
                  <div className="flex justify-between items-center text-[11px] text-amber-800/80 font-mono pt-1 border-t border-amber-200/50">
                    <span>Unlocks At (UTC):</span>
                    <span>{model.unlocksAtUtc}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Lock/Unlock Controls */}
          {onToggleLock && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="text-xs font-semibold text-slate-700">Lock Control Actions</div>
              {model.isLocked ? (
                <button
                  type="button"
                  onClick={() => onToggleLock(model)}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Unlock Model Now
                </button>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-500">Set circuit lock duration:</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleLock(model, 25)}
                      className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      25 Mins
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleLock(model, 180)}
                      className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      3 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleLock(model, 1440)}
                      className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      1 Day
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleLock(model, 6060)}
                      className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      4d 5h
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Raw JSON Code block preview */}
          <div>
            <div className="text-xs text-slate-400 font-medium mb-1">Raw JSON Record</div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto max-h-36 scrollbar-thin">
              {JSON.stringify(model, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
