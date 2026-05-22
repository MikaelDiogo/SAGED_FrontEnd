import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  allowSectorLeader?: boolean;
  children: React.ReactNode;
}

export function ProtectedRoute({ 
  allowedRoles, 
  allowSectorLeader = false, 
  children 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useContext(AuthContext);

  // 1. Barreira de Autenticação Global: Se não houver token ou usuário, vai para o Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role.toUpperCase();

  // 2. Exceção de Escopo: Se for Técnico mas atuar como Líder de Secretaria, concede acesso
  if (userRole === 'TECNICO' && allowSectorLeader && user.is_sector_leader) {
    return <>{children}</>;
  }

  // 3. Validação Hierárquica por RBAC (Role-Based Access Control)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Caso tente acessar um recurso fora do seu papel, retorna à segurança do Dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Autorização Concedida: Renderiza os nós filhos (DefaultLayout / Sub-rotas)
  return <>{children}</>;
}