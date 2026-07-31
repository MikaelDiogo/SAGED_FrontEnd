/** Adapted for our backend: uses specialtyId as queue param */

interface DemandNavigationTarget {
  id: string;
  departmentId: string;
  department?: { name?: string };
  specialtyId: string;
}

export function buildDemandsUrl(demand: DemandNavigationTarget): string {
  const params = new URLSearchParams({
    unit: demand.departmentId,
    name: demand.department?.name ?? 'Secretaria',
    queue: demand.specialtyId,
    demandId: demand.id,
  });

  return `/demandas?${params.toString()}`;
}
