import {
  Group,
  Image,
  Container,
  UnstyledButton,
  Burger,
  Box,
  Menu,
  Text,
} from '@mantine/core';
import { useMediaQuery, useWindowScroll } from '@mantine/hooks';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconLogout, IconUserCircle, IconRoute } from '@tabler/icons-react';
import { useMemo, useContext } from 'react';
import logo from '../../assets/logo.png';
import { AuthContext } from '../../contexts/AuthContext';
import { useTour } from '../Tour';

interface HeaderProps {
  opened: boolean;
  toggle: () => void;
}

const TOP_BAR_MAX = 28;
const LOGO_SECTION_MAX = 88;
const LOGO_SIZE_MAX = 68;
const LOGO_SIZE_MIN = 30;
const NAV_HEIGHT_REST = 30;
const NAV_HEIGHT_COMPACT = 44;

export const HEADER_HEIGHT_EXPANDED_DESKTOP = TOP_BAR_MAX + LOGO_SECTION_MAX + NAV_HEIGHT_REST;
export const HEADER_HEIGHT_COLLAPSED_DESKTOP = NAV_HEIGHT_COMPACT;
export const HEADER_HEIGHT_EXPANDED_MOBILE = TOP_BAR_MAX + LOGO_SECTION_MAX;
export const HEADER_HEIGHT_COLLAPSED_MOBILE = NAV_HEIGHT_COMPACT;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

export function Header({ opened, toggle }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useContext(AuthContext);
  const [scroll] = useWindowScroll();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const scrollRange = isDesktop ? 102 : 72;
  const scrollY = scroll.y ?? 0;
  const maxScroll =
    typeof window !== 'undefined'
      ? Math.max(document.documentElement.scrollHeight - window.innerHeight, 0)
      : 0;
  const effectiveRange = maxScroll > 0 ? Math.min(scrollRange, maxScroll) : scrollRange;
  const progress = maxScroll === 0 ? 0 : clamp(scrollY / effectiveRange, 0, 1);

  const topBarHeight = isDesktop
    ? lerp(TOP_BAR_MAX, 0, progress)
    : lerp(TOP_BAR_MAX, NAV_HEIGHT_COMPACT, progress);

  const logoSectionHeight = lerp(LOGO_SECTION_MAX, 0, progress);
  const logoInSectionHeight = lerp(LOGO_SIZE_MAX, 0, progress);
  const navHeight = lerp(NAV_HEIGHT_REST, NAV_HEIGHT_COMPACT, progress);
  const navLogoHeight = lerp(0, LOGO_SIZE_MIN, progress);
  const mobileNavLogoHeight = lerp(0, LOGO_SIZE_MIN, progress);
  const navLinkPadding = lerp(24, 14, progress);
  const navFontSize = lerp(14, 12, progress);
  const accountLabelOpacity = 1 - progress;

  const loggedUser = user;
  const roleUpper = loggedUser?.role?.trim().toUpperCase();

  const { restartTour } = useTour();

  const isAdmin = useMemo(() => {
    return roleUpper === 'SAGED_ADMIN_GERAL';
  }, [roleUpper]);

  const isReportAllowed = useMemo(() => {
    return roleUpper === 'SAGED_ADMIN_GERAL' || roleUpper === 'SAGED_ADMIN_SETOR' || roleUpper === 'SAGED_TECNICO_LIDER';
  }, [roleUpper]);

  // Propaga unit/name da URL atual para SelectQueue (preserva contexto de secretaria)
  const queueLink = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const unit = params.get('unit');
    const name = params.get('name');
    if (!unit || unit === 'geral') return '/selecionar-fila';
    const fwd = new URLSearchParams({ unit, ...(name ? { name } : {}) });
    return `/selecionar-fila?${fwd.toString()}`;
  }, [location.search]);

  const menuItems = useMemo(() => {
    const baseLinks: { link: string; label: string; tourId: string }[] = [
      { link: '/selecionar-unidade', label: 'Painel de Visualização', tourId: 'nav-painel' },
      { link: queueLink, label: 'Quadro de Demandas', tourId: 'nav-quadro' },
      { link: '/novo-chamado', label: 'Criação de Demanda', tourId: 'nav-chamado' },
    ];

    if (isReportAllowed) {
      baseLinks.push({ link: '/relatorios', label: 'Relatórios', tourId: 'nav-relatorios' });
    }

    if (roleUpper === 'SAGED_ADMIN_GERAL' || roleUpper === 'SAGED_ADMIN_SETOR') {
      baseLinks.push({ link: '/usuarios-telegram', label: 'Autorizar Usuários', tourId: 'nav-telegram-users' });
    }

    if (isAdmin) {
      baseLinks.push({ link: '/gerenciar-tecnicos', label: 'Gerenciar Profissionais', tourId: 'nav-gerenciar' });
    }

    return baseLinks;
  }, [isReportAllowed, isAdmin, queueLink, roleUpper]);

  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const goHome = () => navigate('/selecionar-unidade');

  const accountMenu = (showLabel: boolean, labelOpacity = 1) => (
    <Menu shadow="md" width={200} position="bottom-end" radius="md">
      <Menu.Target>
        <UnstyledButton
          data-tour="nav-conta"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'white',
            height: '100%',
          }}
        >
          <IconUserCircle size={showLabel ? 18 : 16} stroke={1.8} />
          {showLabel && (
            <Text
              size="xs"
              fw={600}
              visibleFrom="sm"
              style={{ opacity: labelOpacity }}
            >
              Minha Conta
            </Text>
          )}
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>SAGE Sistema</Menu.Label>
        <Menu.Item
          leftSection={<IconRoute size={14} />}
          onClick={restartTour}
        >
          Iniciar Tour
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={14} />}
          onClick={handleLogout}
        >
          Sair do Sistema
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

  const navLinks = () => (
    <>
      {menuItems.map((item) => {
        const isActive = location.pathname === item.link;

        return (
          <UnstyledButton
            key={item.label}
            data-tour={item.tourId}
            px={navLinkPadding}
            h="100%"
            c="white"
            fw={isActive ? 700 : 500}
            onClick={() => navigate(item.link)}
            style={{
              fontSize: navFontSize,
              borderRight: '1px solid rgba(255,255,255,0.1)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: isActive ? 'rgba(0,0,0,0.25)' : 'transparent',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {item.label}
          </UnstyledButton>
        );
      })}
      <UnstyledButton
        data-tour="nav-tour"
        px={navLinkPadding}
        h="100%"
        c="white"
        fw={500}
        onClick={restartTour}
        style={{
          fontSize: navFontSize,
          borderRight: '1px solid rgba(255,255,255,0.1)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          backgroundColor: 'transparent',
          whiteSpace: 'nowrap',
          opacity: 0.85,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.opacity = '0.85'; }}
      >
        <IconRoute size={13} stroke={1.8} />
        Tour
      </UnstyledButton>
    </>
  );

  return (
    <Box
      component="header"
      w="100%"
      style={{
        boxShadow: progress > 0.6 ? '0 2px 12px rgba(0, 0, 0, 0.12)' : 'none',
      }}
    >
      {/* Barra superior — encolhe no desktop; no mobile cresce e absorve a logo */}
      <Box
        bg="crateus-green.9"
        style={{
          height: topBarHeight,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container size="xl" w="100%" h="100%">
          <Group justify="space-between" h="100%" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
              {!isDesktop && mobileNavLogoHeight > 0 && (
                <Image
                  src={logo}
                  alt="Prefeitura de Crateús"
                  h={mobileNavLogoHeight}
                  w="auto"
                  fit="contain"
                  style={{ cursor: 'pointer' }}
                  onClick={goHome}
                />
              )}
            </Group>

            {isDesktop ? (
              <>
                <Box visibleFrom="sm" style={{ flex: 1 }} />
                {accountMenu(true, accountLabelOpacity)}
              </>
            ) : (
              accountMenu(false)
            )}
          </Group>
        </Container>
      </Box>

      {/* Área da logo — altura e logo diminuem progressivamente */}
      <Box
        bg="white"
        w="100%"
        style={{
          height: logoSectionHeight,
          overflow: 'hidden',
        }}
      >
        <Container size="xl" w="100%" h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <Box w="fit-content" style={{ flexShrink: 0 }}>
            <Image
              src={logo}
              alt="Prefeitura de Crateús"
              h={logoInSectionHeight}
              w="auto"
              fit="contain"
              style={{ cursor: 'pointer', display: 'block', width: 'auto' }}
              onClick={goHome}
            />
          </Box>
        </Container>
      </Box>

      {/* Barra de menu — mais baixa; recebe logo ao compactar no desktop */}
      <Box bg="crateus-green.9" h={navHeight} visibleFrom="sm" style={{ overflow: 'hidden' }}>
        <Container size="xl" h="100%">
          <Group h="100%" justify="flex-start" wrap="nowrap" gap="sm" w="100%">
            <Box
              style={{
                width: navLogoHeight > 0 ? 'fit-content' : 0,
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              <Image
                src={logo}
                alt="Prefeitura de Crateús"
                h={navLogoHeight}
                w="auto"
                fit="contain"
                style={{ cursor: 'pointer', opacity: progress, display: 'block', width: 'auto' }}
                onClick={goHome}
              />
            </Box>

            <Group gap={0} h="100%" wrap="nowrap" style={{ flex: 1, justifyContent: 'center' }}>
              {navLinks()}
            </Group>

            <Box
              style={{
                width: progress > 0.85 ? 'auto' : 0,
                overflow: 'hidden',
                opacity: progress,
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              {accountMenu(false)}
            </Box>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
