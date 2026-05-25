import { 
  Group, Image, Container, UnstyledButton, Burger, Box, Menu, Text 
} from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconLogout, IconUserCircle } from '@tabler/icons-react';
import { useMemo, useContext } from 'react';
import logo from '../../assets/logo.png';
import { AuthContext } from '../../contexts/AuthContext';

interface HeaderProps {
  opened: boolean;
  toggle: () => void;
}

export function Header({ opened, toggle }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useContext(AuthContext);

  const loggedUser = user;

  const isAdmin = useMemo(() => {
    const role = loggedUser?.role?.trim().toUpperCase();
    return role === 'ADMIN_GERAL';
  }, [loggedUser]);

  const isReportAllowed = useMemo(() => {
    const role = loggedUser?.role?.trim().toUpperCase();
    return role === 'ADMIN_GERAL' || role === 'ADMIN_SETOR' || role === 'TECNICO_LIDER';
  }, [loggedUser]);

  // 2. Monta os links do menu dinamicamente com base nas permissões
  const menuItems = useMemo(() => {
    const baseLinks = [
      { link: '/selecionar-unidade', label: 'Painel de Visualização' },
      { link: '/selecionar-fila', label: 'Quadro de Demandas' },
      { link: '/novo-chamado', label: 'Criação de Demanda' },
    ];

    if (isReportAllowed) {
      baseLinks.push({ link: '/relatorios', label: 'Relatórios' });
    }

    // Se for admin, injeta o link de gerenciamento no menu desktop
    if (isAdmin) {
      baseLinks.push({ link: '/gerenciar-tecnicos', label: 'Gerenciar Técnicos' });
    }

    return baseLinks;
  }, [isReportAllowed, isAdmin]);

  // Função para limpar a sessão e deslogar do SAGE
  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <Box component="header">
      {/* 1. TOPBAR VERDE ESCURO (Padrão Crateús) */}
      <Box bg="crateus-green.9" h={32} display="flex" style={{ alignItems: 'center' }}>
        <Container size="xl" w="100%">
          <Group justify="space-between">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
            
            <Box visibleFrom="sm" />

            {/* MENU DE USUÁRIO / LOGOUT */}
            <Menu shadow="md" width={200} position="bottom-end" radius="md">
              <Menu.Target>
                <UnstyledButton 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    color: 'white',
                    height: '100%'
                  }}
                >
                  <IconUserCircle size={18} stroke={1.8} />
                  <Text size="xs" fw={600} visibleFrom="sm">Minha Conta</Text>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>SAGE Sistema</Menu.Label>
                <Menu.Item 
                  color="red" 
                  leftSection={<IconLogout size={14} />}
                  onClick={handleLogout}
                >
                  Sair do Sistema
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Container>
      </Box>

      {/* 2. ÁREA DA LOGO */}
      <Box bg="white" py="lg">
        <Container size="xl">
          <Group justify="flex-start">
            <Image 
              src={logo} 
              alt="Prefeitura de Crateús" 
              h={85} 
              w="auto" 
              fit="contain" 
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/selecionar-unidade')}
            />
          </Group>
        </Container>
      </Box>

      {/* 3. NAVBAR COM ESTILIZAÇÃO SÊNIOR */}
      <Box bg="crateus-green.9" h={55}>
        <Container size="xl" h="100%">
          <Group gap={0} h="100%" justify="center" visibleFrom="sm">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.link;
              const isManageTech = item.link === '/gerenciar-tecnicos';
              
              return (
                <UnstyledButton 
                  key={item.label}
                  px={40}
                  h="100%"
                  // Destaca levemente o botão de gerenciar se ele estiver em tela
                  c={isManageTech && !isActive ? 'white' : 'white'}
                  fw={isActive ? 700 : 500}
                  fz="sm"
                  onClick={() => navigate(item.link)}
                  style={{
                    transition: 'all 0.2s ease',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: isActive ? 'rgba(0,0,0,0.25)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if(!isActive) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    if(!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {item.label}
                </UnstyledButton>
              );
            })}
          </Group>
        </Container>
      </Box>
    </Box>
  );
}