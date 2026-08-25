export interface ModelStatus {
  rank: number;
  provider: string;
  model: string;
  status: 'healthy' | 'unhealthy' | string;
  tier: string;
  averageTimeSeconds: number;
  successfulRequests: number;
  totalRequests: number;
  successRatePercent: number;
  isLocked: boolean;
  unlocksAtUtc: string | null;
  lastTestedUtc: string;
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
  | 'consecutiveFailures';

export type SortOrder = 'asc' | 'desc';
