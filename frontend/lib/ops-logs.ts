import { API_BASE_URL } from '@/lib/config';

export interface OpsLogEntry {
  level: string;
  event: string;
  category?: string | null;
  requestId?: string | null;
  business?: string | null;
  templateKey?: string | null;
  channel?: string | null;
  status?: string | null;
  timestamp: string;
}

export interface OpsLogsResponse {
  success: boolean;
  business: string | null;
  count: number;
  logs: OpsLogEntry[];
  businesses: string[];
  businessesWithLogs: string[];
}

export async function fetchOpsLogs(options?: {
  business?: string;
  limit?: number;
  since?: string;
}): Promise<OpsLogsResponse> {
  const base = API_BASE_URL;
  const params = new URLSearchParams();
  if (options?.business) params.set('business', options.business);
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.since) params.set('since', options.since);

  const res = await fetch(`${base}/ops/logs?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load logs (${res.status})`);
  }
  return res.json() as Promise<OpsLogsResponse>;
}
