import { 
  SimpleGrid, Grid, Paper, Text, Title, Stack, 
  Group, Badge, Button, Container, Table, Progress,
  Box, Tooltip, Loader, Center, RingProgress
} from '@mantine/core';
import { 
  IconClipboardList, IconPlayerPlay, IconCheck,
  IconAlertTriangle, IconChevronLeft, IconTrendingUp,
  IconClock, IconBarrierBlock
} from '@tabler/icons-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useContext } from 'react';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { AuthContext } from '../contexts/AuthContext';
import { TechActivity } from '../components/TechActivity';
import type { Demand, StatusType } from '../pages/Demands';
import type { User as BaseUser } from '../types';

// Interface estendida baseada exatamente no esquema 'UserPublic' do Swagger
interface ExtendedUser extends BaseUser {
  role: 'ADMIN_GERAL' | 'ADMIN_SETOR' | 'TECNICO_LIDER' | 'TECNICO';
  tech_type_code?: string;
  is_sector_leader: boolean;
  departmentId?: string;
}

export function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [allDemands, setAllDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  
  const unitId = searchParams.get('unit');
  const unitName = searchParams.get('name') || 'Secretaria Selecionada';

  const { user } = useContext(AuthContext);
  const loggedUser = user as ExtendedUser | null;

  const roleUpper = useMemo(() => loggedUser?.role?.trim().toUpperCase(), [loggedUser]);
  
  // Mapeamento das permissões de acordo com as especificações do Swagger
  const isAdminGeral = useMemo(() => roleUpper === 'ADMIN_GERAL', [roleUpper]);
  const isTechnician = useMemo(() => roleUpper === 'TECNICO', [roleUpper]);
  const hasSectorView = useMemo(() => {
    return roleUpper === 'ADMIN_SETOR' || roleUpper === 'TECNICO_LIDER' || loggedUser?.is_sector_leader === true;
  }, [roleUpper, loggedUser]);

  // Busca geral robusta baseada no token (o backend filtra o escopo automaticamente via RBAC)
  useEffect(() => {
    async function loadDemands() {
      setLoading(true);
      try {
        const response = await api.get<Demand[]>('/demands');
        setAllDemands(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erro ao buscar demandas para o painel:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDemands();
  }, []);

  // ESCOPO DO DASHBOARD: Sincronizado com o retorno real da API
  const demands = useMemo(() => {
    let result = allDemands;

    // Se o usuário selecionou uma unidade específica na barra de busca (Admin Geral)
    if (unitId && unitId !== 'geral') {
      result = result.filter(demand => String(demand.departmentId) === String(unitId));
    }

    // Nota: O backend já retorna apenas as demandas permitidas para técnicos 
    // e líderes de setor via RBAC automático no endpoint /demands.
    return result;
  }, [allDemands, unitId]);

  // Resolve o nome da unidade para exibição no Badge
  const displayUnitName = useMemo(() => {
    if (unitId === 'geral' || !unitId) return 'ADMINISTRAÇÃO MUNICIPAL';
    if (unitName && unitName !== 'Secretaria Selecionada') return unitName;
    // Se tiver ID mas não tiver nome (vindo de um link direto), tenta achar no primeiro item da lista
    return demands[0]?.department?.name || 'UNIDADE FILTRADA';
  }, [unitId, unitName, demands]);

  // Indicadores calculados dinamicamente com base nas demandas acessíveis
  const metrics = useMemo(() => {
    const total = demands.length;
    if (total === 0) return { resolutionRate: 0, interruptedCount: 0, criticalPercentage: 0 };

    const completed = demands.filter(d => d.status === 'CONCLUIDO').length;
    const interrupted = demands.filter(d => d.status === 'INTERROMPIDO').length;
    
    const critical = interrupted; 

    return {
      resolutionRate: Math.round((completed / total) * 100),
      interruptedCount: interrupted,
      criticalPercentage: Math.round((critical / total) * 100)
    };
  }, [demands]);

  const counters = useMemo(() => {
    return {
      aFazer: demands.filter(d => d.status === 'A_FAZER').length,
      emAndamento: demands.filter(d => d.status === 'EM_ANDAMENTO').length,
      concluido: demands.filter(d => d.status === 'CONCLUIDO').length,
      interrompido: demands.filter(d => d.status === 'INTERROMPIDO').length,
    };
  }, [demands]);

  const priorityData = useMemo(() => {
    return [
      { label: 'Retidas (Crítica)', count: counters.interrompido, color: 'red', progress: 85 },
      { label: 'Em Execução', count: counters.emAndamento, color: 'blue', progress: 60 },
      { label: 'Aguardando Início', count: counters.aFazer, color: 'yellow', progress: 45 },
      { label: 'Finalizadas', count: counters.concluido, color: 'green', progress: 25 },
    ];
  }, [counters]);

  const renderStatusBadge = (status: StatusType) => {
    const configs: Record<StatusType, { color: string; label: string }> = {
      A_FAZER: { color: 'gray', label: 'A Fazer' },
      EM_ANDAMENTO: { color: 'blue', label: 'Em Andamento' },
      CONCLUIDO: { color: 'green', label: 'Concluído' },
      INTERROMPIDO: { color: 'red', label: 'Interrompido' },
      CANCELADO: { color: 'dark', label: 'Cancelado' }
    };
    const current = configs[status] || { color: 'gray', label: status };
    return <Badge color={current.color} size="xs" variant="light">{current.label}</Badge>;
  };

  return (
    <Container size="xl" pt={100} pb={80}>
      <Stack gap="lg">
        
        {isAdminGeral && (
          <Box>
            <Button
              variant="subtle"
              color="gray.6"
              leftSection={<IconChevronLeft size={16} />}
              onClick={() => navigate('/selecionar-unidade')}
              size="xs"
              p={0}
              styles={{ root: { '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } } }}
            >
              Voltar para Seleção de Unidade
            </Button>
          </Box>
        )}

        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Group gap="xs">
              {isTechnician ? (
                <Badge color={loggedUser?.is_sector_leader ? "teal.8" : "blue.8"} variant="filled" radius="sm">
                  {loggedUser?.is_sector_leader ? "VISÃO LÍDER DE SECRETARIA" : "PAINEL TÉCNICO: MEUS CHAMADOS"}
                </Badge>
              ) : hasSectorView ? (
                <Badge color="green.8" variant="filled" radius="sm">
                  FILA DA SECRETARIA: {displayUnitName.toUpperCase()}
                </Badge>
              ) : (
                <Badge color="green.9" variant="filled" radius="sm">
                  VISÃO GLOBAL ADMINISTRATIVA (SAGED)
                </Badge>
              )}
              <Tooltip label="Sincronizado em tempo real com o banco de dados">
                <Badge color="gray" variant="outline" radius="sm" style={{ cursor: 'help' }}>LIVE</Badge>
              </Tooltip>
            </Group>
            <Title order={2} c="green.9" fw={900} style={{ letterSpacing: '-0.5px' }}>
              Painel de Performance e Produtividade
            </Title>
            <Text size="xs" c="dimmed">Métricas operacionais extraídas do fluxo atual de chamados do sistema</Text>
          </Stack>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <StatCard label="A Fazer" value={counters.aFazer} color="gray" icon={IconClipboardList} />
          <StatCard label="Em Andamento" value={counters.emAndamento} color="blue" icon={IconPlayerPlay} />
          <StatCard label="Concluído" value={counters.concluido} color="green" icon={IconCheck} />
          <StatCard label="Interrompidas" value={counters.interrompido} color="red" icon={IconAlertTriangle} />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <Paper withBorder p="md" radius="md" shadow="xs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack gap={2}>
              <Text fw={800} size="xs" tt="uppercase" c="gray.7">Taxa de Resolução</Text>
              <Text size="xl" fw={900} c="green.8">{metrics.resolutionRate}%</Text>
              <Text size="10px" c="dimmed">Eficiência interna de chamados</Text>
            </Stack>
            <RingProgress size={65} thickness={6} roundCaps sections={[{ value: metrics.resolutionRate, color: 'green.7' }]} />
          </Paper>

          <Paper withBorder p="md" radius="md" shadow="xs" style={{ display: 'flex', alignItems: 'center', gap: 'md' }}>
            <Center bg="red.0" p="xs" style={{ borderRadius: '8px' }}>
              <IconBarrierBlock size={24} color="var(--mantine-color-red-6)" />
            </Center>
            <Stack gap={2}>
              <Text fw={800} size="xs" tt="uppercase" c="gray.7">Demandas Retidas</Text>
              <Text size="xl" fw={900} c="red.7">{metrics.interruptedCount}</Text>
              <Text size="10px" c="dimmed">Aguardando peça ou suporte externo</Text>
            </Stack>
          </Paper>

          <Paper withBorder p="md" radius="md" shadow="xs" style={{ display: 'flex', alignItems: 'center', gap: 'md' }}>
            <Center bg="blue.0" p="xs" style={{ borderRadius: '8px' }}>
              <IconClock size={24} color="var(--mantine-color-blue-6)" />
            </Center>
            <Stack gap={2}>
              <Text fw={800} size="xs" tt="uppercase" c="gray.7">Tempo de Resposta</Text>
              <Text size="xl" fw={900} c="blue.8">Sub-1h</Text>
              <Text size="10px" c="dimmed">Estimativa de primeiro atendimento</Text>
            </Stack>
          </Paper>
        </SimpleGrid>

        <Grid columns={12}>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder p="xl" radius="md" shadow="xs" h="100%">
              <Group justify="space-between" mb="xs">
                <Text fw={800} size="xs" tt="uppercase" c="gray.7">Distribuição de Carga</Text>
                <IconTrendingUp size={16} color="gray" />
              </Group>
              <Text size="xs" c="dimmed" mb="xl">Volume de tarefas segmentadas por urgência operacional</Text>
              <Stack gap="lg">
                {priorityData.map((item) => (
                  <Box key={item.label}>
                    <Group justify="space-between" mb={5}>
                      <Text size="xs" fw={700}>{item.label}</Text>
                      <Badge color={item.color} variant="light" size="sm" radius="xs">{item.count} itens</Badge>
                    </Group>
                    <Progress value={item.progress} color={item.color} size="sm" radius="xl" striped animated={item.color === 'red'} />
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
               <Paper withBorder p="md" radius="md" shadow="xs" style={{ minHeight: '260px' }}>
                  <Text fw={800} size="xs" mb="md" tt="uppercase" c="gray.7">Fluxo Recente de Demandas Vinculadas</Text>
                  {loading ? (
                    <Center py="xl" style={{ height: '180px' }}><Loader size="sm" color="green.8" /></Center>
                  ) : demands.length === 0 ? (
                    <Center py="xl" style={{ height: '180px' }}>
                      <Text size="xs" c="dimmed" fw={600}>Nenhuma demanda localizada para o escopo deste usuário.</Text>
                    </Center>
                  ) : (
                    <Box style={{ overflowX: 'auto' }}>
                      <Table verticalSpacing="sm" highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th style={{ fontSize: '10px', color: 'var(--mantine-color-dimmed)' }}>PROTOCOLO</Table.Th>
                            <Table.Th style={{ fontSize: '10px', color: 'var(--mantine-color-dimmed)' }}>DESCRIÇÃO DA DEMANDA</Table.Th>
                            <Table.Th style={{ fontSize: '10px', color: 'var(--mantine-color-dimmed)' }}>STATUS</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {demands.slice(0, 4).map((demand) => (
                              //Entrada clicável para detalhes da demanda, passando o ID da unidade e nome via query params para o filtro na página de demandas
                            <Table.Tr 
                              key={demand.id} 
                              onClick={() => {
                                const deptId = demand.departmentId;
                                const deptName = demand.department?.name || 'Secretaria';
                                navigate(`/demandas?unit=${deptId}&name=${encodeURIComponent(deptName)}`);
                              }} 
                              style={{ cursor: 'pointer' }}
                            >
                              <Table.Td><Text size="xs" fw={800} c="green.9">#{demand.protocol}</Text></Table.Td>
                              <Table.Td>
                                <Stack gap={2}>
                                  <Text size="xs" fw={600} lineClamp={1} style={{ maxWidth: '320px' }}>
                                    {demand.title || demand.description}
                                  </Text>
                                  {demand.department?.name && (
                                    <Text size="10px" c="dimmed" fw={700}>
                                      SETOR: {demand.department.name.toUpperCase()}
                                    </Text>
                                  )}
                                </Stack>
                              </Table.Td>
                              <Table.Td>{renderStatusBadge(demand.status)}</Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Box>
                  )}
               </Paper>

               <Paper withBorder p="md" radius="md" shadow="xs" bg="gray.0" style={{ borderLeft: '4px solid var(--mantine-color-green-6)' }}>
                <Group justify="space-between" mb="xs">
                  <Text fw={800} size="xs" tt="uppercase" c="gray.7">Atividade Técnica Ativa</Text>
                  <Badge variant="dot" color="green">Monitoramento Saged</Badge>
                </Group>
                <TechActivity 
                  techName={loggedUser?.name || "Técnico"} 
                  demand={isTechnician ? "Visualização de Fila Operacional Pessoal" : "Supervisão Geral do Painel SAGED"} 
                  status="ONLINE" 
                  time="Agora"
                />
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}