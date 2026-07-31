/** Adapted for our backend: action field, justification, createdAt camelCase, createdBy string */

export interface ViewerInfo {
  name: string;
  role?: string;
  at: string;
}

export interface HistoryEntryLike {
  id: string;
  demandId?: string;
  action: string;
  justification?: string | null;
  createdAt: string;
  createdBy?: string;
}

export function extractViewersFromHistory(_history: HistoryEntryLike[]): ViewerInfo[] {
  // Our backend does not have a VISUALIZADO action, so no viewer info
  return [];
}

export function invalidateDemandViewersCache(_demandId: string): void {
  // No-op: viewer caching not needed (no /view endpoint)
}

export async function fetchDemandViewers(_demandId: string): Promise<ViewerInfo[]> {
  return [];
}

export function formatViewerDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
