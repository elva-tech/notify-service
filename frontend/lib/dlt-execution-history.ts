export interface DltExecutionHistoryEntry {
  id: string;
  timestamp: string;
  businessId: string;
  templateKey: string;
  phone: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED';
  httpStatus: number | null;
  requestId: string | null;
  deliveryMode: string;
  liveMode: boolean;
}

const STORAGE_KEY = 'elva-dlt-suite-history';
const MAX_ENTRIES = 20;

export function loadDltExecutionHistory(): DltExecutionHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DltExecutionHistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

export function pushDltExecutionHistory(
  entry: Omit<DltExecutionHistoryEntry, 'id'>,
): DltExecutionHistoryEntry[] {
  const full: DltExecutionHistoryEntry = {
    ...entry,
    id: `${Date.now()}-${entry.businessId}-${entry.templateKey}`,
  };
  const next = [full, ...loadDltExecutionHistory()].slice(0, MAX_ENTRIES);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearDltExecutionHistory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
