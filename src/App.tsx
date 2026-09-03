import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ModelStatus, SortField, SortOrder, HealthCheckResponse } from './types';
import { INITIAL_MODEL_DATA } from './data/initialData';
import { fetchModelStatus, queueHealthCheck, simulateHealthCheck, API_URL } from './services/api';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { FilterBar } from './components/FilterBar';
import { StatusTable } from './components/StatusTable';
import { ModelDetailModal } from './components/ModelDetailModal';
import { JsonModal } from './components/JsonModal';
import { AlertCircle, RefreshCw, CheckCircle2, X } from 'lucide-react';


const STORAGE_KEY = 'llm_model_status_data_v1';
const SHOW_STATS_KEY = 'llm_model_status_show_stats';

export default function App() {
  const [data, setData] = useState<ModelStatus[]>(INITIAL_MODEL_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string>('Just now');
  const [usingFallback, setUsingFallback] = useState<boolean>(false);

  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SHOW_STATS_KEY);
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const toggleStats = useCallback(() => {
    setShowStats((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SHOW_STATS_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const loadApiData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    setIsBannerDismissed(false);
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
  const [sortField, setSortField] = useState<SortField>('lastTestedUtc');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [selectedModel, setSelectedModel] = useState<ModelStatus | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  // Health check state
  const [checkingModelKey, setCheckingModelKey] = useState<string | null>(null);
  const [activeJobs, setActiveJobs] = useState<Record<string, HealthCheckResponse>>({});
  const [healthCheckError, setHealthCheckError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error';
    jobId?: string;
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Execute health check for a model
  const handleRunHealthCheck = useCallback(async (targetModel: ModelStatus, isSimulation: boolean = false) => {
    const key = `${targetModel.provider}-${targetModel.model}`;
    setCheckingModelKey(key);
    setHealthCheckError(null);

    try {
      let result: HealthCheckResponse;
      if (isSimulation) {
        result = simulateHealthCheck(targetModel.provider, targetModel.model);
      } else {
        result = await queueHealthCheck(targetModel.provider, targetModel.model);
      }

      // Record active job
      setActiveJobs((prev) => ({
        ...prev,
        [key]: result,
      }));

      // Update model lastTestedUtc in data table
      const nowIso = new Date().toISOString();
      setData((prev) =>
        prev.map((m) => {
          if (m.provider === targetModel.provider && m.model === targetModel.model) {
            return {
              ...m,
              lastTestedUtc: nowIso,
            };
          }
          return m;
        })
      );

      // Also update selectedModel if it's currently open
      setSelectedModel((prev) => {
        if (prev && prev.provider === targetModel.provider && prev.model === targetModel.model) {
          return {
            ...prev,
            lastTestedUtc: nowIso,
          };
        }
        return prev;
      });

      setToastMessage({
        text: `Health check queued for ${targetModel.model} (${targetModel.provider})`,
        jobId: result.jobId,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to run health check:', err);
      const errMsg = err?.message || 'Network request failed';
      setHealthCheckError(errMsg);
      setToastMessage({
        text: `Health check request failed: ${errMsg}`,
        type: 'error',
      });
    } finally {
      setCheckingModelKey(null);
    }
  }, []);


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
      setSortOrder(field === 'lastTestedUtc' ? 'desc' : 'asc');
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
    setSortField('lastTestedUtc');
    setSortOrder('desc');
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
          return m.status?.toLowerCase() === 'healthy';
        }
        if (selectedStatus === 'unhealthy') {
          return m.status?.toLowerCase() === 'unhealthy';
        }
        if (selectedStatus === 'untested') {
          return m.status?.toLowerCase() === 'untested';
        }
        if (selectedStatus === 'locked') {
          return m.isLocked;
        }

        return true;
      })
      .sort((a, b) => {
        let aVal: any = a[sortField];
        let bVal: any = b[sortField];

        // Untested models or missing data should ALWAYS sort to the bottom
        const isAUntested = aVal == null || a.status?.toLowerCase() === 'untested';
        const isBUntested = bVal == null || b.status?.toLowerCase() === 'untested';

        if (isAUntested && isBUntested) return 0;
        if (isAUntested) return 1;  // 'a' goes to the bottom
        if (isBUntested) return -1; // 'b' goes to the bottom

        if (sortField === 'lastTestedUtc') {
          const timeA = new Date(aVal).getTime();
          const timeB = new Date(bVal).getTime();
          const validA = !isNaN(timeA);
          const validB = !isNaN(timeB);

          if (!validA && !validB) return 0;
          if (!validA) return 1;
          if (!validB) return -1;

          return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        }

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
      <div className="w-full">
        {/* Top App Header */}
        <Header
          totalCount={data.length}
          lastUpdated={lastFetchTime}
          isLoading={isLoading}
          apiEndpoint={API_URL}
          showStats={showStats}
          onToggleStats={toggleStats}
          onOpenJsonModal={() => setIsJsonModalOpen(true)}
          onRefreshApi={loadApiData}
        />

        {/* API Fetch Notification Banner if Offline or Failed */}
        {fetchError && !isBannerDismissed && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-800 transition-all">
            <div className="flex items-center gap-2 flex-1 pr-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>API connection note:</strong> Could not connect to <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">{API_URL}</code> ({fetchError}). Displaying local model status schema.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadApiData}
                disabled={isLoading}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 cursor-pointer flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Retry Fetch
              </button>
              <button
                onClick={() => setIsBannerDismissed(true)}
                className="p-1 hover:bg-amber-200/60 text-amber-700 rounded-lg transition-colors cursor-pointer"
                title="Dismiss connection notice to save space"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {!fetchError && !isLoading && !usingFallback && !isBannerDismissed && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Successfully fetched live model status from <code className="bg-emerald-100/80 px-1 py-0.5 rounded text-emerald-950 font-mono">{API_URL}</code>
              </span>
            </div>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="p-1 hover:bg-emerald-200/60 text-emerald-800 rounded-lg transition-colors cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary Stats Cards */}
        {showStats && <StatsOverview data={data} onHide={toggleStats} />}

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
        onClose={() => {
          setSelectedModel(null);
          setHealthCheckError(null);
        }}
        onToggleLock={handleToggleLock}
        onRunHealthCheck={(m) => handleRunHealthCheck(m, false)}
        isHealthChecking={selectedModel ? checkingModelKey === `${selectedModel.provider}-${selectedModel.model}` : false}
        activeJob={selectedModel ? activeJobs[`${selectedModel.provider}-${selectedModel.model}`] : null}
        healthCheckError={healthCheckError}
        onClearHealthCheckError={() => setHealthCheckError(null)}
        onSimulateHealthCheck={(m) => handleRunHealthCheck(m, true)}
      />

      {/* Floating Health Check Toast Notification */}
      {toastMessage && (
        <div
          id="health-check-toast"
          className="fixed bottom-6 right-6 z-50 max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200"
        >
          {toastMessage.type === 'success' ? (
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700 shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1 text-xs min-w-0">
            <div className="font-bold text-slate-900">
              {toastMessage.type === 'success' ? 'Health Check Queued (HTTP 202)' : 'Health Check Request Failed'}
            </div>
            <div className="text-slate-600 mt-0.5 break-words">{toastMessage.text}</div>
            {toastMessage.jobId && (
              <div className="font-mono text-[11px] text-blue-800 bg-blue-50 border border-blue-200/80 rounded-md px-2 py-0.5 mt-1.5 inline-flex items-center gap-1">
                <span className="text-blue-600">Job ID:</span>
                <span className="font-semibold select-all">{toastMessage.jobId}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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

