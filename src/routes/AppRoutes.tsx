import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { DefaultLayout } from '../layouts/DefaultLayout';
import { Dashboard } from '../pages/Dashboard';
import { SelectUnit } from '../pages/SelectUnit';
import { Demands } from '../pages/Demands';
import { SelectQueue } from '../pages/SelectQueue';
import { Login } from '../pages/Login';
import { Reports } from '../pages/Reports';
import { CreateDemand } from '../pages/CreateDemand';
import { CreateTechnician } from '../pages/CreateTechnician';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Center, Loader } from '@mantine/core';

function InitialRedirect() {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  
  const role = user.role?.trim().toUpperCase();
  
  if (role === 'ADMIN_GERAL') {
    return <Navigate to="/selecionar-unidade" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export function AppRoutes() {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Center style={{ height: '100vh', backgroundColor: '#f8f9fa' }}>
        <Loader color="green.8" size="xl" type="dots" />
      </Center>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública de Autenticação */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <InitialRedirect /> : <Login />} 
        />

        {/* Grupo de Rotas Privadas e Protegidas via RBAC */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DefaultLayout />
            </ProtectedRoute>
          }
        >
          {/* Redirecionamento Inicial inteligente com base no Perfil */}
          <Route index element={<InitialRedirect />} />
          
          <Route path="selecionar-unidade" element={<SelectUnit />} />
          <Route path="selecionar-fila" element={<SelectQueue />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route 
            path="relatorios" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN_GERAL', 'ADMIN_SETOR', 'TECNICO_LIDER']}>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route path="demandas" element={<Demands />} />
          <Route path="novo-chamado" element={<CreateDemand />} /> 
          <Route 
            path="gerenciar-tecnicos" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN_GERAL', 'ADMIN_SETOR']}><CreateTechnician /></ProtectedRoute>
            } 
          />
        </Route>

        {/* Fallback de rotas inexistentes redirecionando para a Autenticação */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}