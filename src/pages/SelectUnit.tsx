import { 
  Container, Title, Text, SimpleGrid, Stack, 
  TextInput, Box, Badge, Loader, Center, Tooltip 
} from '@mantine/core';
import { IconSearch, IconBuildingCommunity } from '@tabler/icons-react';
import { UnitCard } from '../components/UnitCard/UnitCard';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

// Espelhamento local dos status do SAGE para evitar imports cruzados com o backend
export const DemandStatus = {
  A_FAZER: "A_FAZER",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  CONCLUIDO: "CONCLUIDO",
  INTERROMPIDO: "INTERROMPIDO",
  CANCELADO: "CANCELADO",
} as const;

interface Demand {
  id: string;
  status: string; 
}

interface Department {
  id: string;
  name: string;
  code: string;
  demands?: Demand[]; 
  openDemands?: number; 
}

export function SelectUnit() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loggedUser = useMemo<User | null>(() => {
    const storedUser = localStorage.getItem('@SAGE:user');
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);

  const isAdmin = useMemo(() => {
    const role = loggedUser?.role?.trim().toUpperCase();
    return role === 'ADMIN' || role === 'ADMIN_GERAL';
  }, [loggedUser]);

  useEffect(() => {
    async function loadDepartments() {
      try {
        setLoading(true);
        const response = await api.get<Department[]>('/departments');
        const data = Array.isArray(response.data) ? response.data : [];

        // 📊 Filtra e calcula dinamicamente as demandas baseadas no Status local
        const processedData = data.map(dept => {
          const demandsList = dept.demands || [];
          
          const pendingCount = demandsList.filter(demand => {
            const status = demand.status?.trim().toUpperCase();
            return status === DemandStatus.A_FAZER || 
                   status === DemandStatus.EM_ANDAMENTO || 
                   status === DemandStatus.INTERROMPIDO;
          }).length;

          return {
            ...dept,
            openDemands: pendingCount 
          };
        });

        // Ordenação Crescente Inteligente por código (01, 01.01, 02...)
        const orderedData = processedData.sort((a, b) => 
          a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
        );

        const storedUserRaw = localStorage.getItem('@SAGE:user');
        const currentUser: User | null = storedUserRaw ? JSON.parse(storedUserRaw) : null;
        const userRole = currentUser?.role?.trim().toUpperCase();

        if (userRole === 'ADMIN' || userRole === 'ADMIN_GERAL') {
          setDepartments(orderedData);
        } 
        else if (currentUser && currentUser.departmentId) {
          const myDept = orderedData.filter(dept => dept.id === currentUser.departmentId);
          setDepartments(myDept);
        } 
        else {
          setDepartments(orderedData);
        }

      } catch (error) {
        console.error("Erro ao carregar secretarias no painel SAGE", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadDepartments();
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter(dept =>
      dept.name.toLowerCase().includes(search.toLowerCase()) ||
      dept.code.toLowerCase().includes(search.toLowerCase())
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
      <Stack gap="xl">
        <Box>
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
            placeholder="Buscar secretaria pelo nome ou código..." 
            leftSection={<IconSearch size={20} stroke={1.5} />}
            size="lg"
            radius="md"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            styles={{
              input: {
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid var(--mantine-color-gray-2)'
              }
            }}
          />
        )}

        {loading ? (
          <Center py="xl" style={{ height: '200px' }}><Loader color="green.8" /></Center>
        ) : (
          <SimpleGrid 
            cols={{ base: 1, sm: 2, md: 3 }} 
            spacing="lg"
          >
            {filteredDepartments.map((dept) => (
              <Box 
                key={dept.id} 
                style={{ 
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '160px', 
                  width: '100%'
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
                    pointerEvents: 'none' 
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
                      width: '100%'
                    }}
                  >
                    <UnitCard 
                      name={truncateName(dept.name)}
                      manager="Responsável Técnico"
                      openDemands={dept.openDemands || 0} 
                      onClick={() => navigate(`/dashboard?unit=${dept.id}&name=${encodeURIComponent(dept.name)}`)} 
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