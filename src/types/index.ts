export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN_GERAL' | 'ADMIN_SETOR' | 'TECNICO_LIDER' | 'TECNICO';
  departmentId?: string;
  tech_type_code?: string;
  is_sector_leader?: boolean;
}

export interface SignInCredentials {
  email: string;
  password: string;
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

export type StatusType = 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'INTERROMPIDO' | 'CANCELADO';

export interface Demand {
  id: string;
  title: string;
  description: string;
  status: StatusType;
  protocol: string;
  asset_tag?: string;
  techTypeCode: string;
  departmentId: string;
  senderId: string;
  created_at: string;
}