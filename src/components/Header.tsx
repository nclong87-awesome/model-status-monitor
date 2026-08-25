import React from 'react';
import { Activity, Code2, RefreshCw, Server } from 'lucide-react';

interface HeaderProps {
  totalCount: number;
  lastUpdated: string;
  isLoading?: boolean;
  apiEndpoint?: string;
  onOpenJsonModal: () => void;
  onRefreshApi: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  lastUpdated,
  isLoading = false,
  apiEndpoint = 'http://localhost:5204/api/ai/models/status',
  onOpenJsonModal,
  onRefreshApi,
}) => {
  return (
    <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs shrink-0">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              LLM Model Status Monitor
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
              <Server className="w-3 h-3" />
              API Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fetching status from <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono text-[11px]">{apiEndpoint}</code> ({totalCount} models tracked • Last updated: {lastUpdated})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start md:self-auto">
        <button
          onClick={onRefreshApi}
          disabled={isLoading}
          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Fetch latest status from API"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Fetching...' : 'Fetch API'}
        </button>

        <button
          onClick={onOpenJsonModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>View / Export JSON</span>
        </button>
      </div>
    </header>
  );
};

