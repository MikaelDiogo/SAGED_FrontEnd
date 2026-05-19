export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TECNICO' | 'SOLICITANTE' | string;
  departmentId?: string; // Sincronizado com os interceptors e localStorage
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
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | string; // Adaptado para nomenclaturas padrão de Swagger
  protocol: string;
  asset_tag?: string;
  techTypeCode: string;
  departmentId: string;
  senderId: string;
  created_at: string;
}