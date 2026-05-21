import { 
  Container, Grid, Paper, Text, Group, Title, Stack, 
  Select, Button, Divider, Box, SimpleGrid, RingProgress,
  Badge, Center, Loader, type RingProgressSection
} from '@mantine/core';
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
}

interface DistributionSection extends RingProgressSection {
  label: string;
}

export function Reports() {
  const navigate = useNavigate();

  // 1. Recupera o usuário logado e valida permissões de Admin de forma antecipada
  const loggedUser = useMemo<User | null>(() => {
    const storageUser = localStorage.getItem('@SAGE:user');
    return storageUser ? JSON.parse(storageUser) : null;
  }, []);

  const isAdmin = useMemo(() => {
    const role = loggedUser?.role?.trim().toUpperCase();
    return role === 'ADMIN_GERAL' || role === 'ADMIN_SETOR';
  }, [loggedUser]);
  
  // Filtros adaptados para o padrão do Backend (Mês/Ano)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(() => String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string | null>(() => String(new Date().getFullYear()));
  
  const [selectedUnit, setSelectedUnit] = useState<string | null>(() => {
    if (!isAdmin && loggedUser?.departmentId) {
      return loggedUser.departmentId;
    }
    return 'todas';
  });
  
  const [loadingData, setLoadingData] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Estados preenchidos pela API real
  const [departments, setDepartments] = useState<Department[]>([]);
  const [reportData, setReportData] = useState<ManagementReport | null>(null);

  // Define qual ID de departamento deve ser enviado nas requisições
  const currentDepartmentId = useMemo(() => {
    if (loggedUser?.role?.trim().toUpperCase() === 'ADMIN_GERAL') {
      return selectedUnit === 'todas' ? '' : selectedUnit || '';
    }
    return loggedUser?.departmentId || '';
  }, [selectedUnit, loggedUser]);

  // Carrega a listagem de secretarias (Apenas se for Admin Geral)
  useEffect(() => {
    if (loggedUser?.role?.trim().toUpperCase() !== 'ADMIN_GERAL') return;
    
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
  }, [loggedUser, navigate]);

  // 2. Busca o relatório gerencial unificado respeitando os parâmetros do Swagger
  const fetchReportData = useCallback(async (filters: { month: number; year: number; departmentId: string }) => {
    try {
      const params: Record<string, any> = {
        month: filters.month,
        year: filters.year
      };

      // Só adiciona se o ID for válido e não for string vazia
      if (filters.departmentId && filters.departmentId.trim() !== '') {
        params.departmentId = filters.departmentId;
      }

      const { data } = await api.get<ManagementReport>('/demands/reports/management', { params });
      setReportData(data);
    } catch (err) {
      console.error('Erro ao carregar dados do relatório real:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Executa o gatilho reativo aos filtros de forma assíncrona isolada
  useEffect(() => {
    let isMounted = true;

    const triggerFetch = async () => {
      if (isMounted) {
        const month = selectedMonth ? parseInt(selectedMonth, 10) : new Date().getMonth() + 1;
        const year = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
        
        await fetchReportData({ month, year, departmentId: currentDepartmentId });
      }
    };

    triggerFetch();

    return () => {
      isMounted = false;
    };
  }, [selectedMonth, selectedYear, currentDepartmentId, fetchReportData]);

  // Handlers manuais para atualizar o esqueleto do loading visual
  const handleMonthChange = (val: string | null) => {
    setLoadingData(true);
    setSelectedMonth(val);
  };

  const handleYearChange = (val: string | null) => {
    setLoadingData(true);
    setSelectedYear(val);
  };

  const handleUnitChange = (val: string | null) => {
    setLoadingData(true);
    setSelectedUnit(val);
  };

  // 3. Extração dinâmica de PDF injetando o Token e expurgando parâmetros vazios para evitar Erro 400
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      
      const month = selectedMonth ? parseInt(selectedMonth, 10) : new Date().getMonth() + 1;
      const year = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();

      const targetUnitName = selectedUnit === 'todas' 
        ? 'Geral_Municipio' 
        : departments.find(d => d.id === currentDepartmentId)?.name || 'Secretaria';

      const params: Record<string, any> = { month, year };
      
      // CRÍTICO: Se for string vazia ou "todas", NÃO envie o parâmetro para evitar o Erro 400 de validação UUID do Backend
      if (currentDepartmentId && currentDepartmentId.trim() !== '') {
        params.departmentId = currentDepartmentId;
      }

      const response = await api.get('/demands/reports/export-pdf', {
        params,
        responseType: 'blob'
      });

      // Evita o falso positivo de download caso o backend envie uma mensagem de erro convertida em blob
      if (response.data.type === 'application/json') {
        const textError = await response.data.text();
        const parsedError = JSON.parse(textError);
        throw new Error(parsedError.message || parsedError.error || 'Erro de validação interna.');
      }

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
      
      // Se for um erro do Axios capturado normalmente embrulhado em Blob
      if (err.response && err.response.data instanceof Blob) {
        const textError = await err.response.data.text();
        try {
          const parsed = JSON.parse(textError);
          alert(`Erro na exportação: ${parsed.message || parsed.error}`);
          return;
        } catch { /* fallback */ }
      }

      const errorMessage = err.response?.data?.message || err.message || 'Dados inválidos inseridos para o PDF.';
      alert(`Erro na exportação: ${errorMessage}`);
    } finally {
      setExporting(false);
    }
  };

  // Mapeia os dados dinâmicos da API para a estrutura visual dos cards superiores
  const kpiCards = useMemo(() => {
    return [
      { title: 'Total de Demandas', value: reportData?.metrics?.total ?? 0, icon: IconChecklist, color: 'blue' },
      { title: 'Tempo Médio (TMA)', value: reportData?.metrics?.avgTime ?? '0h', icon: IconClock, color: 'green' },
      { title: 'Taxa de Resolução', value: reportData?.metrics?.resolutionRate ?? '0%', icon: IconTrendingUp, color: 'grape' },
      { title: 'Interrompidas', value: reportData?.metrics?.interrupted ?? 0, icon: IconAlertTriangle, color: 'red' },
    ];
  }, [reportData]);

  // Converte dinamicamente o statusCounts (objeto) em seções percentuais para o RingProgress
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

  // Organiza as opções do Select de secretarias baseado na role
  const selectUnitOptions = useMemo(() => {
    if (loggedUser?.role?.trim().toUpperCase() !== 'ADMIN_GERAL' && loggedUser?.departmentId) {
      return [{ value: loggedUser.departmentId, label: 'SUA SECRETARIA VINCULADA' }];
    }
    const baseOptions = [{ value: 'todas', label: 'TODAS AS UNIDADES' }];
    departments.forEach(d => baseOptions.push({ value: d.id, label: d.name.toUpperCase() }));
    return baseOptions;
  }, [departments, loggedUser]);

  return (
    <Box style={{ backgroundColor: '#f1f3f5', minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px' }}>
      <Container size={1200} px="xl">
        
        {/* Cabeçalho de Filtros */}
        <Paper withBorder p="xl" radius="sm" mb="xl" shadow="sm">
          <Group justify="space-between" align="flex-end">
            <Stack gap={5}>
              <Title order={2} style={{ fontWeight: 900, color: '#004a29', letterSpacing: '-1px', fontSize: '28px' }}>
                Relatórios Operacionais
              </Title>
              <Text size="sm" c="dimmed" fw={500}>Métricas em tempo real retiradas do quadro SAGED</Text>
            </Stack>

            <Group align="flex-end" gap="md">
              <Select
                label="Mês"
                placeholder="Mês"
                value={selectedMonth}
                onChange={handleMonthChange}
                size="sm"
                w={110}
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
                placeholder="Ano"
                value={selectedYear}
                onChange={handleYearChange}
                size="sm"
                w={90}
                data={[{ value: '2026', label: '2026' }, { value: '2027', label: '2027' }]}
              />
              <Select
                label="Unidade"
                placeholder="Todas"
                value={selectedUnit}
                onChange={handleUnitChange}
                disabled={loggedUser?.role?.trim().toUpperCase() !== 'ADMIN_GERAL'}
                size="sm"
                w={210}
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

        {loadingData ? (
          <Center h={400}><Loader color="green.9" size="xl" /></Center>
        ) : (
          <>
            {/* Cards de KPI Dinâmicos baseados no Quadro */}
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
              {/* Espaço do Gráfico Analítico */}
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Paper withBorder p="25px" radius="sm" shadow="sm" h={450}>
                  <Title order={5} mb="xl" fw={800} c="gray.8">Fluxo de Chamados Analítico</Title>
                  <Box h={320} style={{ borderLeft: '2px solid #f1f1f1', borderBottom: '2px solid #f1f1f1', position: 'relative' }}>
                    <Center h="100%">
                       <Text size="sm" c="dimmed" fw={500}>Métricas operacionais consolidadas para o período {reportData?.period}</Text>
                    </Center>
                  </Box>
                </Paper>
              </Grid.Col>

              {/* Distribuição Dinâmica por Status real do Quadro */}
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

              {/* Eficiência por Técnico mapeado do Backend */}
              <Grid.Col span={12}>
                <Paper withBorder p="xl" radius="sm" shadow="sm">
                  <Group justify="space-between" mb="lg">
                    <Title order={5} fw={800} c="gray.8">Produtividade da Equipe Técnica</Title>
                    <Badge size="lg" color="green.9" c='white'  variant="light" radius="sm" style={{ color: '#004a29' }}>
                      Escopo: {reportData?.scope || 'Geral'}
                    </Badge>
                  </Group>
                  <Divider mb="lg" />
                  <Stack gap="md">
                    {reportData?.technicians?.map((tec, index) => (
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
                        <Group gap="lg">
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
                    ))}
                    {(!reportData?.technicians || reportData.technicians.length === 0) && (
                      <Text size="sm" c="dimmed" style={{ textAlign: 'center' }}>Nenhum técnico com demandas registradas neste escopo.</Text>
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