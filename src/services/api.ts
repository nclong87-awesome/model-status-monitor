import { ModelStatus } from '../types';

export const API_URL = 'http://localhost:5204/api/ai/models/status';

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
