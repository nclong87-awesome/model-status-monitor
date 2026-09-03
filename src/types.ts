export interface ModelStatus {
  rank: number;
  provider: string;
  model: string;
  status: 'healthy' | 'unhealthy' | 'untested' | string;
  tier: string;
  averageTimeSeconds: number | null;
  successfulRequests: number;
  totalRequests: number;
  successRatePercent: number | null;
  isLocked: boolean;
  unlocksAtUtc: string | null;
  lastTestedUtc: string | null;
  consecutiveFailures: number;
}

export type SortField = 
  | 'rank' 
  | 'provider' 
  | 'model' 
  | 'status' 
  | 'tier' 
  | 'averageTimeSeconds' 
  | 'successRatePercent' 
  | 'consecutiveFailures'
  | 'lastTestedUtc';

export type SortOrder = 'asc' | 'desc';

export interface HealthCheckResponse {
  jobId: string;
  provider: string;
  model: string;
  status: 'queued' | string;
}

export interface QueuedJobInfo extends HealthCheckResponse {
  timestamp: string;
}

