import {
  Stop,
  TransportNetwork,
  Disruption,
  RoutePlanResponse,
  DfaValidationResult,
  DfaSpecResponse,
  PipelineSimResult,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const err = await response.json();
      errorMsg = err.detail || err.message || errorMsg;
    } catch {
      // response wasn't json
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return handleResponse<any>(res);
}

export async function fetchStops(): Promise<Stop[]> {
  const res = await fetch(`${API_BASE}/api/stops`);
  return handleResponse<Stop[]>(res);
}

export async function fetchNetwork(): Promise<TransportNetwork> {
  const res = await fetch(`${API_BASE}/api/network`);
  return handleResponse<TransportNetwork>(res);
}

export async function fetchDisruptions(): Promise<Disruption[]> {
  const res = await fetch(`${API_BASE}/api/disruptions`);
  return handleResponse<Disruption[]>(res);
}

export async function toggleDisruption(disruptionId: string, activate: boolean): Promise<Disruption> {
  const res = await fetch(`${API_BASE}/api/disruptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ disruption_id: disruptionId, activate }),
  });
  return handleResponse<Disruption>(res);
}

export async function resetAllDisruptions(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/disruptions/reset`, {
    method: 'POST',
  });
  return handleResponse<{ message: string }>(res);
}

export async function toggleCustomEdge(edgeId: string, isActive: boolean, statusCode: string = 'DELAYED') {
  const res = await fetch(`${API_BASE}/api/disruptions/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ edge_id: edgeId, is_active: isActive, status_code: statusCode }),
  });
  return handleResponse<any>(res);
}

export async function planRoute(
  origin: string,
  destination: string,
  transportMode: string = 'all',
  preference: string = 'balanced'
): Promise<RoutePlanResponse> {
  const res = await fetch(`${API_BASE}/api/routes/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin,
      destination,
      transport_mode: transportMode,
      preference,
    }),
  });
  return handleResponse<RoutePlanResponse>(res);
}

export async function validateDfa(statusCode: string): Promise<DfaValidationResult> {
  const res = await fetch(`${API_BASE}/api/dfa/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status_code: statusCode }),
  });
  return handleResponse<DfaValidationResult>(res);
}

export async function fetchDfaSpec(): Promise<DfaSpecResponse> {
  const res = await fetch(`${API_BASE}/api/dfa/spec`);
  return handleResponse<DfaSpecResponse>(res);
}

export async function simulatePipeline(
  numRequests: number,
  stageDurations: Record<string, number>
): Promise<PipelineSimResult> {
  const res = await fetch(`${API_BASE}/api/pipeline/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      num_requests: numRequests,
      stage_durations: stageDurations,
    }),
  });
  return handleResponse<PipelineSimResult>(res);
}
