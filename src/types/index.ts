export type SagedRole =
  | 'SAGED_ADMIN_GERAL'
  | 'SAGED_ADMIN_SETOR'
  | 'SAGED_TECNICO_LIDER'
  | 'SAGED_TECNICO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: SagedRole;
  departmentId?: string;   // from org_unit_id JWT claim
  is_sector_leader?: boolean; // optional compatibility field
  specialtyCodes?: string; // from specialty_codes JWT claim (comma-separated)
}

export interface Department {
  id: string;
  code: string;
  name: string;
}

export interface Specialty {
  id: string;
  code: string;
  name: string;
}

export type StatusType = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'INTERRUPTED';

export interface Demand {
  id: string;
  title: string;
  description: string;
  status: StatusType;
  protocol: string;
  assetTag?: string | null;
  specialtyId: string;
  departmentId: string;
  requesterUserId: string;
  assigneeUserId?: string | null;
  currentTechnicalNote?: string | null;
  createdAt: string;
  updatedAt?: string;
}
