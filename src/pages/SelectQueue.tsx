import {
  Container, Title, Text, Flex, Stack, Paper, ThemeIcon, Box, Loader, Center,
} from '@mantine/core';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo, useContext, useEffect, useState } from 'react';
import { IconTool } from '@tabler/icons-react';
import { AuthContext } from '../contexts/AuthContext';
import { TourPageGate } from '../components/Tour';
import { api } from '../services/api';

interface Specialty {
  id: string;
  code: string;
  name: string;
}

export function SelectQueue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdminGeral = user?.role === 'SAGED_ADMIN_GERAL';
  const isLeader =
    user?.role === 'SAGED_ADMIN_SETOR' || user?.role === 'SAGED_TECNICO_LIDER';

  const unitId =
    searchParams.get('unit') ??
    (isAdminGeral ? 'geral' : user?.departmentId ?? '');
  const unitName =
    searchParams.get('name') ??
    (unitId === 'geral' ? 'ADMINISTRACAO MUNICIPAL' : 'SUA UNIDADE VINCULADA');

  useEffect(() => {
    api
      .get<Specialty[]>('/specialties')
      .then((res) => setSpecialties(Array.isArray(res.data) ? res.data : []))
      .catch(() => {/* silently fail */})
      .finally(() => setLoading(false));
  }, []);

  const visibleSpecialties = useMemo(() => {
    if (isAdminGeral || isLeader) return specialties;
    if (!user?.specialtyCodes) return specialties;
    const userCodes = user.specialtyCodes.split(',').map((c) => c.trim());
    return specialties.filter((s) => userCodes.includes(s.code));
  }, [specialties, isAdminGeral, isLeader, user?.specialtyCodes]);

  const handleSelect = (specialty: Specialty) => {
    if (
      user?.role === 'SAGED_TECNICO' &&
      user.specialtyCodes &&
      !user.specialtyCodes.split(',').map((c) => c.trim()).includes(specialty.code)
    ) {
      return;
    }

    const params = new URLSearchParams();
    if (unitId) params.set('unit', unitId);
    if (unitName) params.set('name', unitName);
    params.set('queue', specialty.id);

    navigate('/demandas?' + params.toString());
  };

  return (
    <Container size="lg" pt={100} pb="xl">
      <TourPageGate phaseId="select-queue" />
      <Stack gap="xl">
        <Box style={{ textAlign: 'center' }} data-tour="queue-header">
          <Title order={2} c="crateus-green.9" fw={900} tt="uppercase" lts="1px">
            Fila de Atendimento
          </Title>
          <Text c="dimmed" fw={500} size="sm">
            Unidade selecionada:{' '}
            <Text component="span" c="crateus-green.7" fw={700}>
              {unitName}
            </Text>
          </Text>
          <Text c="dimmed" size="xs" mt="xs">
            Selecione a especialidade tecnica para acessar o quadro de demandas
          </Text>
        </Box>

        {loading ? (
          <Center h={200}>
            <Loader color="green.8" />
          </Center>
        ) : (
          <Flex
            gap="lg"
            justify="center"
            wrap="wrap"
            direction={{ base: 'column', sm: 'row' }}
            data-tour="queue-cards"
          >
            {visibleSpecialties.map((specialty) => (
              <Paper
                key={specialty.id}
                withBorder
                p="xl"
                radius="sm"
                shadow="sm"
                onClick={() => handleSelect(specialty)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderBottom: '4px solid var(--mantine-color-green-6)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  width: '100%',
                  maxWidth: '350px',
                }}
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
                  <ThemeIcon size={70} radius="sm" color="green" variant="light">
                    <IconTool size={40} stroke={1.5} />
                  </ThemeIcon>
                  <Box style={{ textAlign: 'center' }}>
                    <Title order={5} fw={800} tt="uppercase" c="gray.8">
                      {specialty.name}
                    </Title>
                    <Text size="xs" c="dimmed" mt="sm">
                      Codigo: {specialty.code}
                    </Text>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Flex>
        )}

        <Box style={{ textAlign: 'center' }} mt="md">
          <Text
            size="xs"
            c="dimmed"
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/selecionar-unidade')}
          >
            Voltar para selecao de unidade
          </Text>
        </Box>
      </Stack>
    </Container>
  );
}
