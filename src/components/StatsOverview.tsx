import React from 'react';
import { ModelStatus } from '../types';
import { Activity, CheckCircle2, AlertTriangle, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface StatsOverviewProps {
  data: ModelStatus[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ data }) => {
  const total = data.length;
  const healthyCount = data.filter((m) => m.status?.toLowerCase() === 'healthy').length;
  const unhealthyCount = total - healthyCount;
  const lockedCount = data.filter((m) => m.isLocked).length;

  const healthyModelsWithLatency = data.filter(
    (m) => m.status?.toLowerCase() === 'healthy' && m.averageTimeSeconds != null
  );

  const avgLatency = healthyModelsWithLatency.length > 0
    ? (healthyModelsWithLatency.reduce((acc, m) => acc + (m.averageTimeSeconds ?? 0), 0) / healthyModelsWithLatency.length).toFixed(2)
    : '0.00';

  const modelsWithLatency = data.filter((m) => m.averageTimeSeconds != null);
  const fastestModel = modelsWithLatency.length > 0
    ? [...modelsWithLatency].sort((a, b) => (a.averageTimeSeconds ?? 0) - (b.averageTimeSeconds ?? 0))[0]
    : null;

  const healthyPercentage = total > 0 ? Math.round((healthyCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Total Models */}
      <div id="stat-total-models" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Models</span>
          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{total}</span>
          <span className="text-xs text-slate-500">tracked</span>
        </div>
      </div>

      {/* Healthy Models */}
      <div id="stat-healthy-models" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Healthy Status</span>
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-600">{healthyCount}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            {healthyPercentage}%
          </span>
        </div>
      </div>

      {/* Unhealthy / Locked */}
      <div id="stat-unhealthy-models" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unhealthy / Locked</span>
          <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-rose-600">{unhealthyCount}</span>
          <span className="text-xs text-slate-500">
            ({lockedCount} locked)
          </span>
        </div>
      </div>

      {/* Avg Latency */}
      <div id="stat-avg-latency" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Latency (Healthy)</span>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{avgLatency}s</span>
          {fastestModel && fastestModel.averageTimeSeconds != null && (
            <span className="text-xs text-slate-500 truncate max-w-[110px]" title={`Fastest: ${fastestModel.model} (${fastestModel.averageTimeSeconds.toFixed(2)}s)`}>
              Best: {fastestModel.averageTimeSeconds.toFixed(2)}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
