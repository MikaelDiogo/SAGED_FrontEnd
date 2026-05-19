import { 
  Container, 
  Title, 
  Text, 
  SimpleGrid, 
  Stack, 
  Paper, 
  ThemeIcon, 
  Box 
} from '@mantine/core';
import { IconNetwork, IconDeviceDesktop, IconCode } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Definição dos dados das filas (Cargos)
const cargosMock = [
  { 
    id: 'redes', 
    label: 'Técnico de Redes', 
    icon: IconNetwork, 
    color: 'blue', 
    desc: 'Infraestrutura, roteadores, switches e fibra óptica' 
  },
  { 
    id: 'hardware', 
    label: 'Suporte Hardware', 
    icon: IconDeviceDesktop, 
    color: 'orange', 
    desc: 'Manutenção de computadores, impressoras e periféricos' 
  },
  { 
    id: 'sistemas', 
    label: 'Desenvolvimento', 
    icon: IconCode, 
    color: 'grape', 
    desc: 'Sistema SAGED, Portais Oficiais e Banco de Dados' 
  },
];

export function SelectQueue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Captura a unidade selecionada previamente na URL
  const unitId = searchParams.get('unit');
  const unitName = searchParams.get('name') || 'Unidade não identificada';

  const handleSelect = (cargoId: string) => {
    // Monta a Query String mantendo a unidade e adicionando a fila (queue)
    const params = new URLSearchParams();
    if (unitId) params.set('unit', unitId);
    if (unitName) params.set('name', unitName);
    params.set('queue', cargoId);

    // Navega para o quadro de demandas com os filtros aplicados
    navigate(`/demandas?${params.toString()}`);
  };

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

        {/* Grid de Opções */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          {cargosMock.map((cargo) => (
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
                backgroundColor: 'white'
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
        </SimpleGrid>

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