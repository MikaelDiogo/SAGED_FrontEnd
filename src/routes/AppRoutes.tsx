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
import { ManageTelegramNumbers } from '../pages/ManageTelegramNumbers';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { TourProvider } from '../components/Tour';
import { CreateTechnician } from '../pages/CreateTechnician';
import { Center, Loader } from '@mantine/core';

function InitialRedirect() {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'SAGED_ADMIN_GERAL') {
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
      <TourProvider>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <InitialRedirect /> : <Login />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DefaultLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<InitialRedirect />} />

          <Route path="selecionar-unidade" element={<SelectUnit />} />
          <Route path="selecionar-fila" element={<SelectQueue />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route
            path="relatorios"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SAGED_ADMIN_GERAL',
                  'SAGED_ADMIN_SETOR',
                  'SAGED_TECNICO_LIDER',
                ]}
              >
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route path="demandas" element={<Demands />} />
          <Route path="novo-chamado" element={<CreateDemand />} />
          <Route
            path="gerenciar-numeros"
            element={
              <ProtectedRoute allowedRoles={['SAGED_ADMIN_GERAL', 'SAGED_ADMIN_SETOR']}>
                <ManageTelegramNumbers />
              </ProtectedRoute>
            }
          />
          <Route
            path="gerenciar-tecnicos"
            element={
              <ProtectedRoute allowedRoles={['SAGED_ADMIN_GERAL', 'SAGED_ADMIN_SETOR']}>
                <CreateTechnician />
              </ProtectedRoute>
            }
          />
          <Route path="usuarios-telegram" element={<Navigate to="/gerenciar-numeros" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </TourProvider>
    </BrowserRouter>
  );
}
