import { ModelStatus, HealthCheckResponse } from '../types';

export const DEFAULT_API_BASE_URL = 'http://localhost:5204';
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
export const API_URL = `${API_BASE_URL}/api/ai/models/status`;

export async function fetchModelStatus(): Promise<ModelStatus[]> {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('API response format invalid: expected an array');
  }
  return data as ModelStatus[];
}

/**
 * Queue a health check for one registered model via POST:
 * POST /api/ai/models/{provider}/health-check?model={model}
 * - Model sent as query parameter, NOT in request body
 * - Returns HTTP 202 on success with { jobId, provider, model, status: "queued" }
 */
export async function queueHealthCheck(provider: string, model: string): Promise<HealthCheckResponse> {
  const url = `${API_BASE_URL}/api/ai/models/${encodeURIComponent(provider)}/health-check?model=${encodeURIComponent(model)}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
    },
    // Note: No body sent as per requirement
  });

  if (!response.ok && response.status !== 202) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.message || errJson.error || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(`API error ${response.status}: ${errorDetail || response.statusText}`);
  }

  const data = await response.json();
  return data as HealthCheckResponse;
}

/**
 * Simulates a 202 Accepted response for demo / preview mode when localhost:5204 is offline
 */
export function simulateHealthCheck(provider: string, model: string): HealthCheckResponse {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return {
    jobId: `job-${Date.now().toString(36)}-${randomSuffix}`,
    provider,
    model,
    status: 'queued',
  };
}

