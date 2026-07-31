import { AppShell, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header, HEADER_HEIGHT_EXPANDED_DESKTOP, HEADER_HEIGHT_EXPANDED_MOBILE } from '../components/Header/index';
import { Footer } from '../components/Footer';
import { useMemo, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { UnitContext } from '../contexts/UnitContext';

export function DefaultLayout() {
  const [opened, { toggle, close }] = useDisclosure();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const isKanban = pathname === '/demandas';

  const { user } = useContext(AuthContext);
  const { setSelectedUnit } = useContext(UnitContext);
  const roleUpper = user?.role?.trim().toUpperCase();

  const isAdmin = roleUpper === 'SAGED_ADMIN_GERAL';
  const isReportAllowed =
    roleUpper === 'SAGED_ADMIN_GERAL' ||
    roleUpper === 'SAGED_ADMIN_SETOR' ||
    roleUpper === 'SAGED_TECNICO_LIDER';
  const canManageTelegramUsers =
    roleUpper === 'SAGED_ADMIN_GERAL' || roleUpper === 'SAGED_ADMIN_SETOR';

  // Propaga unit/name da URL atual para SelectQueue no mobile nav
  const mobileQueueLink = useMemo(() => {
    const params = new URLSearchParams(search);
    const unit = params.get('unit');
    const name = params.get('name');
    if (!unit || unit === 'geral') return '/selecionar-fila';
    const fwd = new URLSearchParams({ unit, ...(name ? { name } : {}) });
    return `/selecionar-fila?${fwd.toString()}`;
  }, [search]);

  const handleSelectUnit = () => {
    setSelectedUnit(null);
    navigate('/selecionar-unidade');
    close();
  };

  return (
    <AppShell
      header={{ height: { base: HEADER_HEIGHT_EXPANDED_MOBILE, sm: HEADER_HEIGHT_EXPANDED_DESKTOP } }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding={0}
      bg="gray.1"
    >
      <AppShell.Header withBorder={false} bg="transparent" style={{ display: 'block' }}>
        <Header opened={opened} toggle={toggle} />
      </AppShell.Header>

      <AppShell.Navbar p="md" bg="crateus-green.9" style={{ border: 0 }}>
        <NavLink
          label="Painel de Visualizacao"
          c="white"
          fw={600}
          onClick={handleSelectUnit}
        />
        <NavLink
          label="Quadro de Demandas"
          c="white"
          fw={600}
          onClick={() => { navigate(mobileQueueLink); close(); }}
        />
        <NavLink
          label="Criacao de Demanda"
          c="white"
          fw={600}
          onClick={() => { navigate('/novo-chamado'); close(); }}
        />
        {isReportAllowed && (
          <NavLink
            label="Relatorios"
            c="white"
            fw={600}
            onClick={() => { navigate('/relatorios'); close(); }}
          />
        )}
        {canManageTelegramUsers && (
          <NavLink
            label="Autorizar Usuarios"
            c="white"
            fw={600}
            onClick={() => { navigate('/gerenciar-numeros'); close(); }}
          />
        )}
        {isAdmin && (
          <NavLink
            label="Gerenciar Profissionais"
            c="yellow.4"
            fw={700}
            onClick={() => { navigate('/gerenciar-tecnicos'); close(); }}
          />
        )}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
        {!isKanban && <Footer />}
      </AppShell.Main>
    </AppShell>
  );
}
