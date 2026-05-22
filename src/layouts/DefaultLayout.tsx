import { AppShell, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header/index';
import { useMemo } from 'react';
import type { User } from '../types';

export function DefaultLayout() {
  const [opened, { toggle, close }] = useDisclosure();
  const navigate = useNavigate();

  // Verifica se o usuário logado tem privilégios para ver o botão de gestão
  const isAdmin = useMemo(() => {
    const storageUser = localStorage.getItem('@SAGE:user');
    if (!storageUser) return false;
    const user = JSON.parse(storageUser) as User;
    const role = user?.role?.trim().toUpperCase();
    return role === 'ADMIN' || role === 'ADMIN_GERAL'; // Já estava consistente, mas mantemos atenção aqui
  }, []);

  return (
    <AppShell
      header={{ height: { base: 120, sm: 170 } }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding={0}
      bg="gray.1" 
    >
      <AppShell.Header withBorder={false}>
        <Header opened={opened} toggle={toggle} />
      </AppShell.Header>

      <AppShell.Navbar p="md" bg="crateus-green.9" style={{ border: 0 }}>
        <NavLink 
          label="Painel de Visualização" 
          c="white" 
          fw={600}
          onClick={() => { navigate('/selecionar-unidade'); close(); }} 
        />
        <NavLink 
          label="Quadro de Demandas" 
          c="white" 
          fw={600}
          onClick={() => { navigate('/demandas'); close(); }} 
        />
        <NavLink 
          label="Criação de Demanda" 
          c="white" 
          fw={600}
          onClick={() => { navigate('/novo-chamado'); close(); }} 
        />
        <NavLink 
          label="Relatórios" 
          c="white" 
          fw={600}
          onClick={() => { navigate('/relatorios'); close(); }} 
        />
        
        {/* Renderização Condicional Exclusiva para os Perfis Admin */}
        {isAdmin && (
          <NavLink 
            label="Gerenciar Técnicos" 
            c="yellow.4" // Destaque visual sutil para diferenciar acessos de gestão
            fw={700}
            onClick={() => { navigate('/gerenciar-tecnicos'); close(); }} 
          />
        )}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}