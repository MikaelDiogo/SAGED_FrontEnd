import {
  Container, Title, Text, SimpleGrid, Stack,
  TextInput, Box, Badge, Loader, Center, Tooltip,
} from '@mantine/core';
import { IconSearch, IconBuildingCommunity } from '@tabler/icons-react';
import { UnitCard } from '../components/UnitCard/UnitCard';
import { TourPageGate } from '../components/Tour';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useContext } from 'react';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { UnitContext } from '../contexts/UnitContext';

interface Department {
  id: string;
  name: string;
  code: string;
}

export function SelectUnit() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Use AuthContext instead of localStorage
  const { user: loggedUser } = useContext(AuthContext);
  const { setSelectedUnit } = useContext(UnitContext);

  const isAdmin = useMemo(() => {
    const role = loggedUser?.role?.trim().toUpperCase();
    return role === 'SAGED_ADMIN_GERAL';
  }, [loggedUser]);

  useEffect(() => {
    async function loadDepartments() {
      try {
        setLoading(true);
        const response = await api.get<Department[]>('/org-units');
        const data = Array.isArray(response.data) ? response.data : [];

        const orderedData = data.sort((a, b) =>
          a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }),
        );

        const userRole = loggedUser?.role?.trim().toUpperCase();

        if (userRole === 'SAGED_ADMIN_GERAL') {
          setDepartments(orderedData);
        } else if (loggedUser?.departmentId) {
          setDepartments(orderedData.filter(dept => dept.id === loggedUser.departmentId));
        } else {
          setDepartments(orderedData);
        }
      } catch (error) {
        console.error('Erro ao carregar secretarias no painel SAGE', error);
      } finally {
        setLoading(false);
      }
    }

    loadDepartments();
  }, [loggedUser]);

  const filteredDepartments = useMemo(() => {
    return departments.filter(dept =>
      dept.name.toLowerCase().includes(search.toLowerCase()) ||
      dept.code.toLowerCase().includes(search.toLowerCase()),
    );
  }, [departments, search]);

  const truncateName = (name: string, maxLength: number = 42) => {
    if (name.length > maxLength) {
      return `${name.substring(0, maxLength)}...`;
    }
    return name;
  };

  return (
    <Container size="lg" pt={100} pb="xl">
      <TourPageGate phaseId="select-unit" />
      <Stack gap="xl">
        <Box data-tour="unit-title">
          <Title order={1} c="green.9" fw={900} style={{ letterSpacing: '-1px' }}>
            Visão por Unidade
          </Title>
          <Text c="dimmed" size="sm">
            {isAdmin
              ? 'Selecione uma secretaria ou departamento para visualizar métricas e fluxos individuais.'
              : 'Gerencie os fluxos e demandas da sua secretaria vinculada.'}
          </Text>
        </Box>

        {isAdmin && (
          <TextInput
            data-tour="unit-search"
            placeholder="Buscar secretaria pelo nome ou código..."
            leftSection={<IconSearch size={20} stroke={1.5} />}
            size="lg"
            radius="md"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            styles={{
              input: {
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid var(--mantine-color-gray-2)',
              },
            }}
          />
        )}

        {loading ? (
          <Center py="xl" style={{ height: '200px' }}><Loader color="green.8" /></Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" data-tour="unit-grid">
            {filteredDepartments.map((dept) => (
              <Box
                key={dept.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '160px',
                  width: '100%',
                }}
              >
                <Badge
                  variant="filled"
                  color="green.1"
                  c="green.8"
                  size="xs"
                  fw={800}
                  style={{
                    position: 'absolute',
                    top: 15,
                    right: 15,
                    zIndex: 5,
                    pointerEvents: 'none',
                  }}
                >
                  SEC {dept.code || '00'}
                </Badge>

                <Tooltip
                  label={dept.name}
                  position="top"
                  withArrow
                  openDelay={400}
                  radius="md"
                  styles={{ tooltip: { backgroundColor: 'var(--mantine-color-gray-8)', padding: '8px 12px' } }}
                >
                  <Box
                    style={{
                      display: 'flex',
                      flex: 1,
                      flexDirection: 'column',
                      height: '100%',
                      width: '100%',
                    }}
                  >
                    <UnitCard
                      name={truncateName(dept.name)}
                      manager="Responsável Técnico"
                      code={dept.code}
                      onClick={() => { setSelectedUnit({ id: dept.id, name: dept.name }); navigate(`/dashboard?unit=${dept.id}&name=${encodeURIComponent(dept.name)}`); }}
                    />
                  </Box>
                </Tooltip>
              </Box>
            ))}
          </SimpleGrid>
        )}

        {!loading && filteredDepartments.length === 0 && (
          <Center py="xl" style={{ flexDirection: 'column', height: '200px' }}>
            <IconBuildingCommunity size={50} color="gray" style={{ opacity: 0.3 }} />
            <Text c="dimmed" mt="md" size="sm" fw={600}>Nenhuma unidade vinculada encontrada.</Text>
          </Center>
        )}
      </Stack>
    </Container>
  );
}
