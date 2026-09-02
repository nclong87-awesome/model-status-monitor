import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedTier: string;
  onTierChange: (tier: string) => void;
  providers: string[];
  tiers: string[];
  totalResults: number;
  totalItems: number;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedProvider,
  onProviderChange,
  selectedStatus,
  onStatusChange,
  selectedTier,
  onTierChange,
  providers,
  tiers,
  totalResults,
  totalItems,
  onReset,
}) => {
  const isFiltered = searchQuery !== '' || selectedProvider !== 'all' || selectedStatus !== 'all' || selectedTier !== 'all';

  return (
    <div id="filter-bar-container" className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-input"
            type="text"
            placeholder="Search model name or provider..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Provider Filter */}
          <select
            id="provider-select"
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-400 cursor-pointer"
          >
            <option value="all">All Providers ({providers.length})</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Tier Filter */}
          <select
            id="tier-select"
            value={selectedTier}
            onChange={(e) => onTierChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-400 cursor-pointer"
          >
            <option value="all">All Tiers</option>
            {tiers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            id="status-select"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-400 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="healthy">Healthy Only</option>
            <option value="unhealthy">Unhealthy Only</option>
            <option value="untested">Untested Only</option>
            <option value="locked">Locked Only</option>
          </select>

          {isFiltered && (
            <button
              id="reset-filters-btn"
              onClick={onReset}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <div>
          Showing <span className="font-semibold text-slate-800">{totalResults}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalItems}</span> models
        </div>
        {isFiltered && (
          <div className="text-slate-500 italic">
            Filter active
          </div>
        )}
      </div>
    </div>
  );
};
