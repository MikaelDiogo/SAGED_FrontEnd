import { 
  Container, Grid, Paper, Text, Group, Title, Stack, 
  Select, Button, Divider, Box, SimpleGrid, RingProgress,
  Badge, Center, Loader, type RingProgressSection
} from '@mantine/core';
import { AreaChart } from '@mantine/charts'; 
import { 
  IconDownload, IconTrendingUp, 
  IconClock, IconChecklist, IconAlertTriangle 
} from '@tabler/icons-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import axios, { AxiosError } from 'axios';
import type { User } from '../types';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface ManagementReport {
  period: string;
  scope: string;
  metrics: {
    total: number;
    resolutionRate: string;
    avgTime: string;
    interrupted: number;
  };
  statusCounts: Record<string, number>;
  technicians: Array<{
    name: string;
    count: number;
    concluded: number;
  }>;
  timelineData?: Array<{
    period: string;
    chamados: number;
    concluidos: number;
  }>;
}

interface DistributionSection extends RingProgressSection {
  label: string;
}

export function Reports() {
  const navigate = useNavigate();

  // 1. Recupera o usuário logado e valida o papel (RBAC)
  const loggedUser = useMemo<User | null>(() => {
    const storageUser = localStorage.getItem('@SAGE:user');
    return storageUser ? JSON.parse(storageUser) : null;
  }, []);

  const userRole = useMemo(() => {
    return loggedUser?.role?.trim().toUpperCase() || '';
  }, [loggedUser]);

  const isAdminGeral = useMemo(() => userRole === 'ADMIN_GERAL', [userRole]);
  
  // Filtros de Data
  const [selectedMonth, setSelectedMonth] = useState<string | null>(() => String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string | null>(() => String(new Date().getFullYear()));
  
  // Controle do filtro de unidades/secretarias
  const [selectedUnit, setSelectedUnit] = useState<string | null>(() => {
    if (!isAdminGeral && loggedUser?.departmentId) {
      return loggedUser.departmentId;
    }
    return 'todas';
  });
  
  const [loadingData, setLoadingData] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Estados dos dados buscados da API do SAGED
  const [departments, setDepartments] = useState<Department[]>([]);
  const [reportData, setReportData] = useState<ManagementReport | null>(null);

  // Carrega lista de secretarias apenas se for ADMIN_GERAL
  useEffect(() => {
    if (!isAdminGeral) return;
    
    const controller = new AbortController();

    async function fetchDepartments() {
      try {
        const { data } = await api.get<Department[]>('/departments', { signal: controller.signal });
        setDepartments(data);
      } catch (err) {
        if (axios.isCancel(err)) return;
        const error = err as AxiosError;
        if (error.response?.status === 401) navigate('/login');
      }
    }
    fetchDepartments();
    return () => controller.abort();
  }, [isAdminGeral, navigate]);

  // 2. Busca reativa higienizando rigorosamente os parâmetros de Query
 const fetchReportData = useCallback(async () => {
    try {
      setLoadingData(true);
      
      const month = selectedMonth ? parseInt(selectedMonth, 10) : new Date().getMonth() + 1;
      const year = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
      
      const params: Record<string, any> = { month, year };

      if (isAdminGeral) {
        if (selectedUnit && selectedUnit !== 'todas' && selectedUnit.trim() !== '') {
          params.departmentId = selectedUnit.trim();
        }
      } else if (loggedUser?.departmentId) {
        params.departmentId = loggedUser.departmentId.trim();
      }

      const { data } = await api.get<ManagementReport>('/demands/reports/management', { params });
      setReportData(data);
    } catch (err) {
      console.error('API recusou os parâmetros (HTTP 400):', err);
      // Reseta o estado para evitar que o gráfico tente renderizar lixo ou trave a tela
      setReportData(null); 
    } finally {
      setLoadingData(false);
    }
  }, [selectedMonth, selectedYear, selectedUnit, isAdminGeral, loggedUser]);

  // Dispara a busca sempre que um filtro sofrer mutação
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Modificadores de estado que evitam flickering limpando buffers antigos
  const handleMonthChange = (val: string | null) => {
    if (val) {
      setReportData(null);
      setSelectedMonth(val);
    }
  };

  const handleYearChange = (val: string | null) => {
    if (val) {
      setReportData(null);
      setSelectedYear(val);
    }
  };

  const handleUnitChange = (val: string | null) => {
    if (val) {
      setReportData(null);
      setSelectedUnit(val);
    }
  };

  // 3. Geração de PDF integrada à rota mapeada no Swagger
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      
      const month = selectedMonth ? parseInt(selectedMonth, 10) : new Date().getMonth() + 1;
      const year = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();

      const targetUnitName = selectedUnit === 'todas' 
        ? 'Geral_Municipio' 
        : departments.find(d => d.id === selectedUnit)?.name?.replace(/\s+/g, '_') || 'Secretaria';

      const params: Record<string, any> = { month, year };
      
      if (isAdminGeral) {
        if (selectedUnit && selectedUnit !== 'todas') {
          params.departmentId = selectedUnit.trim();
        }
      } else if (loggedUser?.departmentId) {
        params.departmentId = loggedUser.departmentId.trim();
      }

      const response = await api.get('/demands/reports/export-pdf', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Relatorio_SAGED_${targetUnitName}_${month}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Falha ao exportar PDF:', err);
      alert('Não foi possível exportar o documento impresso.');
    } finally {
      setExporting(false);
    }
  };

  // Memoizações estruturais para os gráficos e cards
  const kpiCards = useMemo(() => {
    return [
      { title: 'Total de Demandas', value: reportData?.metrics?.total ?? 0, icon: IconChecklist, color: 'blue' },
      { title: 'Tempo Médio (TMA)', value: reportData?.metrics?.avgTime ?? '0h', icon: IconClock, color: 'green' },
      { title: 'Taxa de Resolução', value: reportData?.metrics?.resolutionRate ? `${reportData.metrics.resolutionRate}%` : '0%', icon: IconTrendingUp, color: 'grape' },
      { title: 'Interrompidas', value: reportData?.metrics?.interrupted ?? 0, icon: IconAlertTriangle, color: 'red' },
    ];
  }, [reportData]);

  const distributionSections = useMemo<DistributionSection[]>(() => {
    if (!reportData?.statusCounts) return [];
    
    const counts = reportData.statusCounts;
    const total = Object.values(counts).reduce((acc, curr) => acc + curr, 0);
    if (total === 0) return [];

    const colorsMap: Record<string, string> = {
      A_FAZER: '#228be6',
      EM_ANDAMENTO: '#ff922b',
      CONCLUIDO: '#2b8a3e',
      INTERROMPIDO: '#e03131',
      CANCELADO: '#868e96'
    };

    return Object.entries(counts).map(([status, value]) => {
      const percentage = Math.round((value / total) * 100);
      return {
        value: percentage,
        color: colorsMap[status] || '#228be6',
        label: status.replace('_', ' ')
      };
    });
  }, [reportData]);

  const chartMockData = useMemo(() => {
    if (reportData?.timelineData && reportData.timelineData.length > 0) {
      return reportData.timelineData;
    }
    
    const total = reportData?.metrics?.total ?? 0;
    const resRate = parseFloat(reportData?.metrics?.resolutionRate || '0');
    const concluidos = Math.round(total * (resRate / 100));
    
    return [
      { period: 'Semana 1', chamados: Math.round(total * 0.2), concluidos: Math.round(concluidos * 0.1) },
      { period: 'Semana 2', chamados: Math.round(total * 0.5), concluidos: Math.round(concluidos * 0.3) },
      { period: 'Semana 3', chamados: Math.round(total * 0.8), concluidos: Math.round(concluidos * 0.7) },
      { period: 'Semana 4', chamados: total, concluidos: concluidos },
    ];
  }, [reportData]);

  const selectUnitOptions = useMemo(() => {
    if (!isAdminGeral && loggedUser?.departmentId) {
      return [{ value: loggedUser.departmentId, label: 'SUA SECRETARIA VINCULADA' }];
    }
    const baseOptions = [{ value: 'todas', label: 'TODAS AS UNIDADES' }];
    departments.forEach(d => baseOptions.push({ value: d.id, label: d.name.toUpperCase() }));
    return baseOptions;
  }, [departments, loggedUser, isAdminGeral]);

  return (
    <Box style={{ backgroundColor: '#f1f3f5', minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px' }}>
      <Container size={1200} px="xl">
        
        <Paper withBorder p="xl" radius="sm" mb="xl" shadow="sm">
          <Group justify="space-between" align="flex-end">
            <Stack gap={5}>
              <Title order={2} style={{ fontWeight: 900, color: '#004a29', letterSpacing: '-1px', fontSize: '28px' }}>
                Relatórios Operacionais
              </Title>
              <Text size="sm" c="dimmed" fw={500}>Métricas em tempo real extraídas do painel SAGED</Text>
            </Stack>

            <Group align="flex-end" gap="md">
              <Select
                label="Mês"
                value={selectedMonth}
                onChange={handleMonthChange}
                size="sm"
                w={140}
                allowDeselect={false}
                data={[
                  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
                  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
                  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
                  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
                  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
                  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
                ]}
              />
              <Select
                label="Ano"
                value={selectedYear}
                onChange={handleYearChange}
                size="sm"
                w={110}
                allowDeselect={false}
                data={[{ value: '2026', label: '2026' }, { value: '2027', label: '2027' }]}
              />
              <Select
                label="Unidade"
                value={selectedUnit}
                onChange={handleUnitChange}
                disabled={!isAdminGeral}
                size="sm"
                w={230}
                allowDeselect={false}
                data={selectUnitOptions}
              />
              <Button 
                leftSection={exporting ? <Loader size={16} color="white" /> : <IconDownload size={18} />} 
                variant="filled" 
                size="sm" 
                h={36}
                disabled={loadingData || exporting}
                onClick={handleExportPDF}
                style={{ backgroundColor: '#004a29' }}
              >
                {exporting ? 'Gerando...' : 'Exportar PDF'}
              </Button>
            </Group>
          </Group>
        </Paper>

        {loadingData && !reportData ? (
          <Center h={400}><Loader color="green.9" size="xl" /></Center>
        ) : (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
              {kpiCards.map((stat) => (
                <Paper key={stat.title} withBorder p="xl" radius="sm" shadow="sm">
                  <Group justify="space-between">
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed" fw={800} tt="uppercase" lts="0.5px">{stat.title}</Text>
                      <Text size="24px" fw={900} style={{ color: '#2e2e2e' }}>{stat.value}</Text>
                    </Stack>
                    <stat.icon size={36} color={`var(--mantine-color-${stat.color}-6)`} stroke={1.5} />
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>

            <Grid>
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Paper withBorder p="25px" radius="sm" shadow="sm" h={450}>
                  <Title order={5} mb="md" fw={800} c="gray.8">Fluxo de Chamados Analítico</Title>
                  <Text size="xs" c="dimmed" mb="xl" fw={500}>
                    Comparativo entre demandas abertas e concluídas no período {reportData?.period || ''}
                  </Text>
                  
                  {/* Div anti-erro dimensionamento da biblioteca Recharts */}
                  <Box h={300} style={{ minWidth: 0, width: '100%', position: 'relative' }}>
                    {reportData ? (
                      <AreaChart
                        h={280}
                        data={chartMockData}
                        dataKey="period"
                        series={[
                          { name: 'chamados', color: 'blue.6', label: 'Demandas Abertas' },
                          { name: 'concluidos', color: 'green.6', label: 'Demandas Concluídas' }
                        ]}
                        curveType="monotone"
                        gridAxis="xy"
                        withLegend
                      />
                    ) : (
                      <Center h={280}><Loader size="sm" color="blue" /></Center>
                    )}
                  </Box>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper withBorder p="25px" radius="sm" shadow="sm" h={450}>
                  <Title order={5} mb="xl" fw={800} c="gray.8">Demandas por Status</Title>
                  <Stack align="center" justify="center" h="100%" gap="xl">
                    <RingProgress
                      size={180}
                      thickness={20}
                      roundCaps
                      sections={distributionSections.length > 0 ? distributionSections : [{ value: 100, color: 'gray.2' }]}
                      label={
                        <Center>
                          <Text fw={900} size="md" c="dark">Status</Text>
                        </Center>
                      }
                    />
                    <SimpleGrid cols={2} w="100%" px="sm">
                      {distributionSections.map((sec, idx) => (
                        <Group gap={6} key={idx}>
                          <Box w={10} h={10} style={{ backgroundColor: sec.color, borderRadius: '50%' }} /> 
                          <Text size="11px" fw={600} style={{ textTransform: 'capitalize' }}>{sec.label} ({sec.value}%)</Text>
                        </Group>
                      ))}
                    </SimpleGrid>
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={12}>
                <Paper withBorder p="xl" radius="sm" shadow="sm">
                  <Group justify="space-between" mb="lg">
                    <Title order={5} fw={800} c="gray.8">Produtividade da Equipe Técnica</Title>
                    <Badge size="lg" color="green.9" c='white' variant="light" radius="sm">
                      Escopo: {reportData?.scope || 'Geral'}
                    </Badge>
                  </Group>
                  <Divider mb="lg" />
                  <Stack gap="md">
                    {reportData?.technicians && reportData.technicians.length > 0 ? (
                      reportData.technicians.map((tec, index) => (
                        <Group 
                          key={index} 
                          justify="space-between" 
                          p="md" 
                          style={{ 
                            backgroundColor: index === 0 ? '#f8fff9' : '#fff', 
                            border: '1px solid #f1f1f1',
                            borderRadius: '8px' 
                          }}
                        >
                          <Group gap={6}>
                            <Text size="md" fw={900} c={index === 0 ? 'green.9' : 'gray.5'}>0{index + 1}</Text>
                            <Text size="sm" fw={700} c="gray.8">{tec.name}</Text>
                          </Group>
                          <Group gap={40}>
                            <Stack gap={0} align="center">
                              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Total Atribuído</Text>
                              <Text size="sm" fw={800}>{tec.count}</Text>
                            </Stack>
                            <Stack gap={0} align="center">
                              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Concluídos</Text>
                              <Badge variant="filled" color="green.9" radius="xs" size="sm">{tec.concluded} chamados</Badge>
                            </Stack>
                          </Group>
                        </Group>
                      ))
                    ) : (
                      <Text size="sm" c="dimmed" style={{ textAlign: 'center' }} py="xl">
                        Nenhum técnico com demandas registradas neste escopo.
                      </Text>
                    )}
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}