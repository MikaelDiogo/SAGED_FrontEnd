import { 
  Container, 
  Title, 
  Text, 
  Flex, 
  Stack, 
  Paper, 
  ThemeIcon, 
  Box 
} from '@mantine/core';
import { IconNetwork, IconDeviceDesktop} from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import type { User } from '../types';

// Definição dos dados das filas (Cargos)
const cargosMock = [
  { 
    id: '01', 
    label: 'Suporte Hardware', 
    icon: IconDeviceDesktop, 
    color: 'orange', 
    desc: 'Manutenção de computadores, impressoras e periféricos' 
  },
  { 
    id: '02', 
    label: 'Técnico de Redes', 
    icon: IconNetwork, 
    color: 'blue', 
    desc: 'Infraestrutura, roteadores, switches e fibra óptica' 
  },
];

export function SelectQueue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const loggedUser = useMemo<User | null>(() => {
    const storageUser = localStorage.getItem('@SAGE:user');
    return storageUser ? JSON.parse(storageUser) : null;
  }, []);

  const isAdminGeral = useMemo(() => {
    const role = loggedUser?.role?.trim().toUpperCase();
    return role === 'ADMIN_GERAL' || role === 'ADMIN';
  }, [loggedUser]);

  const isLiderSetor = useMemo(() => {
    const role = loggedUser?.role?.trim().toUpperCase();
    return role === 'ADMIN_SETOR' || 
           role === 'TECNICO_LIDER' || 
           (role === 'TECNICO' && loggedUser?.is_sector_leader === true);
  }, [loggedUser]);

  // Captura a unidade selecionada na URL ou utiliza o contexto do usuário (RBAC) para garantir o filtro correto
  const unitId = searchParams.get('unit') || (isAdminGeral ? 'geral' : loggedUser?.departmentId || '');
  const unitName = searchParams.get('name') || 
    (unitId === 'geral' ? 'ADMINISTRAÇÃO MUNICIPAL' : 
    (unitId === loggedUser?.departmentId ? 'SUA UNIDADE VINCULADA' : 'UNIDADE OPERACIONAL'));

  const handleSelect = (cargoId: string) => {
    // Se o usuário for um técnico e tentar selecionar uma especialidade diferente da sua,
    // ou se não for admin e tentar selecionar algo que não é da sua alçada,
    // podemos adicionar uma notificação ou simplesmente não permitir a navegação.
    // Por enquanto, vamos apenas garantir que a opção esteja visível para ele.
    if (loggedUser?.role?.trim().toUpperCase() === 'TECNICO' && loggedUser?.tech_type_code && cargoId !== loggedUser.tech_type_code) {
      // Opcional: Adicionar uma notificação aqui, se desejar
      // notifications.show({
      //   title: 'Acesso Restrito',
      //   message: 'Você só pode acessar a fila da sua especialidade.',
      //   color: 'red',
      // });
      return; // Impede a navegação se não for a especialidade do técnico
    }
    // Monta a Query String mantendo a unidade e adicionando a fila (queue)
    const params = new URLSearchParams();
    if (unitId) params.set('unit', unitId);
    if (unitName) params.set('name', unitName);
    params.set('queue', cargoId);

    // Navega para o quadro de demandas com os filtros aplicados
    navigate(`/demandas?${params.toString()}`);
  };

  // Filtra os cargos com base na especialidade do usuário logado
  const filteredCargos = useMemo(() => {
    if (isAdminGeral || isLiderSetor) { // ADMIN_GERAL e Líderes de Setor veem todas as opções
      return cargosMock;
    }
    // Técnicos comuns veem apenas sua própria especialidade
    return cargosMock.filter(cargo => cargo.id === loggedUser?.tech_type_code);
  }, [isAdminGeral, isLiderSetor, loggedUser]);

  return (
    <Container size="lg" pt={100} pb="xl">
      <Stack gap="xl">
        {/* Cabeçalho da Página */}
        <Box style={{ textAlign: 'center' }}>
          <Title order={2} c="crateus-green.9" fw={900} tt="uppercase" lts="1px">
            Fila de Atendimento
          </Title>
          <Text c="dimmed" fw={500} size="sm">
            Unidade selecionada: <Text component="span" c="crateus-green.7" fw={700}>{unitName}</Text>
          </Text>
          <Text c="dimmed" size="xs" mt="xs">
            Selecione a especialidade técnica para acessar o quadro de demandas
          </Text>
        </Box>

        {/* Flex de Opções */}
        <Flex 
          gap="lg" 
          justify="center" 
          wrap="wrap"
          direction={{ base: 'column', sm: 'row' }}
        >
          {filteredCargos.map((cargo) => (
            <Paper 
              key={cargo.id}
              withBorder 
              p="xl" 
              radius="sm" // Conforme solicitado: radius pequeno
              shadow="sm"
              onClick={() => handleSelect(cargo.id)}
              style={{ 
                cursor: 'pointer', 
                transition: 'all 0.2s ease',
                borderBottom: `4px solid var(--mantine-color-${cargo.color}-6)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
                width: '100%',
                maxWidth: '350px',
              }}
              // Efeito de hover inline para garantir funcionamento imediato
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
              }}
            >
              <Stack align="center" gap="md">
                <ThemeIcon size={70} radius="sm" color={cargo.color} variant="light">
                  <cargo.icon size={40} stroke={1.5} />
                </ThemeIcon>
                
                <Box style={{ textAlign: 'center' }}>
                  <Title order={5} fw={800} tt="uppercase" c="gray.8">
                    {cargo.label}
                  </Title>
                  <Text size="xs" c="dimmed" mt="sm" lh={1.5}>
                    {cargo.desc}
                  </Text>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Flex>

        {/* Botão de Voltar (Opcional) */}
        <Box style={{ textAlign: 'center' }} mt="md">
          <Text 
            size="xs" 
            c="dimmed" 
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/selecionar-unidade')}
          >
            Voltar para seleção de unidade
          </Text>
        </Box>
      </Stack>
    </Container>
  );
}