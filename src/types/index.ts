export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN_GERAL' | 'ADMIN_SETOR' | 'TECNICO_LIDER' | 'TECNICO';
  is_sector_leader: boolean;
  departmentId?: string;
  tech_type_code?: string; 
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
}

export interface Demand {
  id: string;
  title: string;
  description: string;
  status: 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'INTERROMPIDO' | 'CANCELADO';
  protocol: string;
  asset_tag?: string;
  techTypeCode: string;
  departmentId: string;
  senderId: string;
  created_at: string;
}