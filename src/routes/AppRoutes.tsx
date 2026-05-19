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
import { Center, Loader } from '@mantine/core';

function InitialRedirect() {
  const storedUser = localStorage.getItem('@SAGE:user');
  if (!storedUser) return <Navigate to="/login" replace />;

  const currentUser = JSON.parse(storedUser);
  const role = currentUser?.role?.trim().toUpperCase();

  if (role === 'ADMIN' || role === 'ADMIN_GERAL') {
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
        <Route 
          path="/login" 
          element={isAuthenticated ? <InitialRedirect /> : <Login />} 
        />

        <Route 
          path="/" 
          element={isAuthenticated ? <DefaultLayout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<InitialRedirect />} />
          
          <Route path="selecionar-unidade" element={<SelectUnit />} />
          <Route path="selecionar-fila" element={<SelectQueue />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="relatorios" element={<Reports />} />
          <Route path="demandas" element={<Demands />} />
          <Route path="novo-chamado" element={<CreateDemand />} />
          {/* Nova Rota Administrativa adicionada */}
          <Route path="gerenciar-tecnicos" element={<CreateTechnician />} />
        </Route>

        {/* 🟢 CORREÇÃO AQUI: Aspas fechadas em path="*" */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}