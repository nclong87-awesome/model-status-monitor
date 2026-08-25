import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ModelStatus, SortField, SortOrder } from './types';
import { INITIAL_MODEL_DATA } from './data/initialData';
import { fetchModelStatus, API_URL } from './services/api';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { FilterBar } from './components/FilterBar';
import { StatusTable } from './components/StatusTable';
import { ModelDetailModal } from './components/ModelDetailModal';
import { JsonModal } from './components/JsonModal';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'llm_model_status_data_v1';

export default function App() {
  const [data, setData] = useState<ModelStatus[]>(INITIAL_MODEL_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string>('Just now');
  const [usingFallback, setUsingFallback] = useState<boolean>(false);

  const loadApiData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const apiData = await fetchModelStatus();
      setData(apiData);
      setUsingFallback(false);
      setLastFetchTime(new Date().toLocaleTimeString());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apiData));
    } catch (err: any) {
      console.warn('API fetch failed, utilizing model data fallback:', err);
      setFetchError(err?.message || 'Unable to connect to http://localhost:5204/api/ai/models/status');
      setUsingFallback(true);
      // Attempt to load cached data or keep current/initial data
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setData(parsed);
          }
        }
      } catch {
        // keep initial data
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    loadApiData();
  }, [loadApiData]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [selectedModel, setSelectedModel] = useState<ModelStatus | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  // Sync to local storage on manual state edits
  useEffect(() => {
    if (data && data.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  // Extract unique providers & tiers
  const providers = useMemo(() => {
    const set = new Set(data.map((m) => m.provider));
    return Array.from(set).sort();
  }, [data]);

  const tiers = useMemo(() => {
    const set = new Set(data.map((m) => m.tier));
    return Array.from(set).sort();
  }, [data]);

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Toggle or update lock duration for a model
  const handleToggleLock = (targetModel: ModelStatus, durationMinutes?: number) => {
    const isUnlocking = targetModel.isLocked;
    const newUnlockTime = isUnlocking
      ? null
      : new Date(Date.now() + (durationMinutes || 180) * 60 * 1000).toISOString();

    setData((prev) =>
      prev.map((m) => {
        if (m.model === targetModel.model && m.provider === targetModel.provider) {
          return {
            ...m,
            isLocked: !isUnlocking,
            unlocksAtUtc: newUnlockTime,
          };
        }
        return m;
      })
    );

    if (selectedModel && selectedModel.model === targetModel.model && selectedModel.provider === targetModel.provider) {
      setSelectedModel((prev) =>
        prev
          ? {
              ...prev,
              isLocked: !isUnlocking,
              unlocksAtUtc: newUnlockTime,
            }
          : null
      );
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedProvider('all');
    setSelectedStatus('all');
    setSelectedTier('all');
    setSortField('rank');
    setSortOrder('asc');
  };

  // Reset/re-fetch data
  const handleResetData = () => {
    loadApiData();
    handleResetFilters();
  };

  // Filtered & Sorted models
  const filteredModels = useMemo(() => {
    return data
      .filter((m) => {
        // Search filter
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchModel = m.model.toLowerCase().includes(q);
          const matchProvider = m.provider.toLowerCase().includes(q);
          const matchTier = m.tier.toLowerCase().includes(q);
          if (!matchModel && !matchProvider && !matchTier) return false;
        }

        // Provider filter
        if (selectedProvider !== 'all' && m.provider !== selectedProvider) {
          return false;
        }

        // Tier filter
        if (selectedTier !== 'all' && m.tier !== selectedTier) {
          return false;
        }

        // Status filter
        if (selectedStatus === 'healthy') {
          return m.status.toLowerCase() === 'healthy';
        }
        if (selectedStatus === 'unhealthy') {
          return m.status.toLowerCase() !== 'healthy';
        }
        if (selectedStatus === 'locked') {
          return m.isLocked;
        }

        return true;
      })
      .sort((a, b) => {
        let aVal: any = a[sortField];
        let bVal: any = b[sortField];

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal as string).toLowerCase();
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [data, searchQuery, selectedProvider, selectedStatus, selectedTier, sortField, sortOrder]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Top App Header */}
        <Header
          totalCount={data.length}
          lastUpdated={lastFetchTime}
          isLoading={isLoading}
          apiEndpoint={API_URL}
          onOpenJsonModal={() => setIsJsonModalOpen(true)}
          onRefreshApi={loadApiData}
        />

        {/* API Fetch Notification Banner if Offline or Failed */}
        {fetchError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>API connection note:</strong> Could not connect to <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">{API_URL}</code> ({fetchError}). Displaying local model status schema.
              </span>
            </div>
            <button
              onClick={loadApiData}
              disabled={isLoading}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Retry Fetch
            </button>
          </div>
        )}

        {!fetchError && !isLoading && !usingFallback && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Successfully fetched live model status from <code className="bg-emerald-100/80 px-1 py-0.5 rounded text-emerald-950 font-mono">{API_URL}</code>
            </span>
          </div>
        )}

        {/* Summary Stats Cards */}
        <StatsOverview data={data} />

        {/* Search & Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedTier={selectedTier}
          onTierChange={setSelectedTier}
          providers={providers}
          tiers={tiers}
          totalResults={filteredModels.length}
          totalItems={data.length}
          onReset={handleResetFilters}
        />

        {/* Main Status Table */}
        <StatusTable
          models={filteredModels}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onSelectModel={setSelectedModel}
        />

        {/* Footer info */}
        <footer className="mt-8 text-center text-xs text-slate-400 py-4 border-t border-slate-200/60">
          <p>LLM Model Status Monitor • Standalone Light Dashboard • {data.length} models tracked</p>
        </footer>
      </div>

      {/* Model Detail Drawer / Modal */}
      <ModelDetailModal
        model={selectedModel}
        onClose={() => setSelectedModel(null)}
        onToggleLock={handleToggleLock}
      />

      {/* JSON Import/Export Modal */}
      {isJsonModalOpen && (
        <JsonModal
          data={data}
          onSave={(newData) => setData(newData)}
          onReset={handleResetData}
          onClose={() => setIsJsonModalOpen(false)}
        />
      )}
    </div>
  );
}

