import {
  Badge, Box, Button, Checkbox, Container, Divider, Grid, Group,
  Loader, MultiSelect, Paper, RingProgress, SimpleGrid, Stack,
  Table, Text, TextInput, Title, Center,
} from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import {
  IconAlertTriangle, IconChartBar, IconClock, IconDownload,
  IconFilter, IconUsers,
} from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import { notifications } from '@mantine/notifications';
import { TourPageGate } from '../components/Tour';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import type { Demand } from './Demands';

interface OrgUnit { id: string; name: string; code: string; }
interface Specialty { id: string; code: string; name: string; }
interface Page<T> { content: T[]; totalElements: number; totalPages: number; }

type Option = { value: string; label: string };

interface Breakdown {
  id: string;
  name: string;
  total: number;
  concluded: number;
  pending: number;
  interrupted: number;
  unassigned: number;
  resolutionRate: number;
  sharePercent: number;
}

interface DemandRow {
  id: string;
  protocol: string;
  title: string;
  departmentName: string;
  categoryCode: string;
  statusLabel: string;
  technicianName: string | null;
  ageHours: number;
}

interface AdvancedReport {
  generatedAt: string;
  period: { label: string };
  scope: string;
  metrics: {
    total: number;
    concluded: number;
    pending: number;
    interrupted: number;
    unassigned: number;
    resolutionRate: number;
    pendingRate: number;
    interruptionRate: number;
    unassignedRate: number;
    avgResolutionHours: number;
  };
  statusCounts: Record<string, number>;
  departments: Breakdown[];
  categories: Breakdown[];
  timelineData: Array<{ period: string; opened: number; concluded: number }>;
  criticalDemands: DemandRow[];
  demands: DemandRow[];
}

const STATUS_LABELS: Record<string, string> = {
  TODO: 'A Fazer',
  IN_PROGRESS: 'Em Andamento',
  DONE: 'Concluído',
  INTERRUPTED: 'Interrompido',
};

function todayInput() { return new Date().toISOString().slice(0, 10); }
function monthStartInput() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}
function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
function ageHours(createdAt: string) {
  return Math.round((Date.now() - new Date(createdAt).getTime()) / 3_600_000);
}

function buildReport(
  demands: Demand[],
  orgUnits: OrgUnit[],
  specialties: Specialty[],
  startDate: string,
  endDate: string,
  departmentIds: string[],
  statuses: string[],
  techTypeCodes: string[],
  onlyUnassigned: boolean,
  onlyCritical: boolean,
  includeDemandList: boolean,
): AdvancedReport {
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59');

  let filtered = demands.filter(d => {
    const date = new Date(d.createdAt);
    return date >= start && date <= end;
  });

  if (departmentIds.length > 0) filtered = filtered.filter(d => departmentIds.includes(d.departmentId));
  if (statuses.length > 0) filtered = filtered.filter(d => statuses.includes(d.status));
  if (techTypeCodes.length > 0) filtered = filtered.filter(d => techTypeCodes.includes(d.specialtyId));
  if (onlyUnassigned) filtered = filtered.filter(d => !d.assigneeUserId);
  if (onlyCritical) filtered = filtered.filter(d => d.status === 'INTERRUPTED');

  const total = filtered.length;
  const concluded = filtered.filter(d => d.status === 'DONE').length;
  const pending = filtered.filter(d => d.status === 'TODO' || d.status === 'IN_PROGRESS').length;
  const interrupted = filtered.filter(d => d.status === 'INTERRUPTED').length;
  const unassigned = filtered.filter(d => !d.assigneeUserId).length;

  const statusCounts: Record<string, number> = {
    TODO: filtered.filter(d => d.status === 'TODO').length,
    IN_PROGRESS: filtered.filter(d => d.status === 'IN_PROGRESS').length,
    DONE: concluded,
    INTERRUPTED: interrupted,
  };

  const deptBreakdown: Breakdown[] = orgUnits.map(ou => {
    const sub = filtered.filter(d => d.departmentId === ou.id);
    const c = sub.filter(d => d.status === 'DONE').length;
    const p = sub.filter(d => d.status === 'TODO' || d.status === 'IN_PROGRESS').length;
    const it = sub.filter(d => d.status === 'INTERRUPTED').length;
    const ua = sub.filter(d => !d.assigneeUserId).length;
    return { id: ou.id, name: ou.name, total: sub.length, concluded: c, pending: p, interrupted: it, unassigned: ua, resolutionRate: pct(c, sub.length), sharePercent: pct(sub.length, total) };
  }).filter(b => b.total > 0).sort((a, b) => b.total - a.total);

  const catBreakdown: Breakdown[] = specialties.map(sp => {
    const sub = filtered.filter(d => d.specialtyId === sp.id);
    const c = sub.filter(d => d.status === 'DONE').length;
    const p = sub.filter(d => d.status === 'TODO' || d.status === 'IN_PROGRESS').length;
    const it = sub.filter(d => d.status === 'INTERRUPTED').length;
    const ua = sub.filter(d => !d.assigneeUserId).length;
    return { id: sp.id, name: sp.name, total: sub.length, concluded: c, pending: p, interrupted: it, unassigned: ua, resolutionRate: pct(c, sub.length), sharePercent: pct(sub.length, total) };
  }).filter(b => b.total > 0).sort((a, b) => b.total - a.total);

  // Timeline semanal
  const weeks: Array<{ period: string; opened: number; concluded: number }> = [];
  const span = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 86400000)));
  for (let w = 0; w < Math.min(span, 8); w++) {
    const ws = new Date(start.getTime() + w * 7 * 86400000);
    const we = new Date(ws.getTime() + 7 * 86400000);
    const opened = filtered.filter(d => { const dt = new Date(d.createdAt); return dt >= ws && dt < we; }).length;
    const done = filtered.filter(d => { const dt = new Date(d.createdAt); return dt >= ws && dt < we && d.status === 'DONE'; }).length;
    weeks.push({ period: `Sem ${w + 1}`, opened, concluded: done });
  }

  const toDemandRow = (d: Demand): DemandRow => ({
    id: d.id,
    protocol: d.protocol,
    title: d.title,
    departmentName: orgUnits.find(ou => ou.id === d.departmentId)?.name ?? 'Sem setor',
    categoryCode: specialties.find(sp => sp.id === d.specialtyId)?.name ?? d.specialtyId ?? '',
    statusLabel: STATUS_LABELS[d.status] ?? d.status,
    technicianName: d.technician?.name ?? null,
    ageHours: ageHours(d.createdAt),
  });

  const criticalDemands = filtered.filter(d => d.status === 'INTERRUPTED').map(toDemandRow);
  const allRows = includeDemandList ? filtered.map(toDemandRow) : [];

  return {
    generatedAt: new Date().toISOString(),
    period: { label: `${startDate} → ${endDate}` },
    scope: departmentIds.length === 0 ? 'Todas as unidades' : deptBreakdown.map(b => b.name).join(', '),
    metrics: { total, concluded, pending, interrupted, unassigned, resolutionRate: pct(concluded, total), pendingRate: pct(pending, total), interruptionRate: pct(interrupted, total), unassignedRate: pct(unassigned, total), avgResolutionHours: 0 },
    statusCounts,
    departments: deptBreakdown,
    categories: catBreakdown,
    timelineData: weeks,
    criticalDemands,
    demands: allRows,
  };
}

export function Reports() {
  const { user } = useContext(AuthContext);
  const isAdminGeral = user?.role === 'SAGED_ADMIN_GERAL';

  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [allDemands, setAllDemands] = useState<Demand[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [report, setReport] = useState<AdvancedReport | null>(null);

  const [startDate, setStartDate] = useState(monthStartInput());
  const [endDate, setEndDate] = useState(todayInput());
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [techTypeCodes, setTechTypeCodes] = useState<string[]>([]);
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [includeDemandList, setIncludeDemandList] = useState(true);

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const [unitsRes, specsRes, demandsRes] = await Promise.all([
          api.get<OrgUnit[]>('/org-units'),
          api.get<Specialty[]>('/specialties'),
          api.get<Page<Demand>>('/demands', { params: { size: 500 } }),
        ]);
        setOrgUnits(unitsRes.data ?? []);
        setSpecialties(specsRes.data ?? []);
        setAllDemands(demandsRes.data?.content ?? []);
      } catch {
        notifications.show({ title: 'Erro', message: 'Não foi possível carregar dados do relatório.', color: 'red' });
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  const fetchReport = useCallback(() => {
    setLoadingReport(true);
    try {
      const r = buildReport(allDemands, orgUnits, specialties, startDate, endDate, departmentIds, statuses, techTypeCodes, onlyUnassigned, onlyCritical, includeDemandList);
      setReport(r);
    } catch {
      notifications.show({ title: 'Erro ao gerar relatório', message: 'Revise os filtros e tente novamente.', color: 'red' });
    } finally {
      setLoadingReport(false);
    }
  }, [allDemands, orgUnits, specialties, startDate, endDate, departmentIds, statuses, techTypeCodes, onlyUnassigned, onlyCritical, includeDemandList]);

  useEffect(() => {
    if (!loadingOptions) fetchReport();
  }, [loadingOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const departmentOptions = useMemo<Option[]>(() => {
    if (!isAdminGeral && user?.departmentId) {
      const mine = orgUnits.find(u => u.id === user.departmentId);
      return mine ? [{ value: mine.id, label: `${mine.code} - ${mine.name}` }] : [];
    }
    return orgUnits.map(u => ({ value: u.id, label: `${u.code} - ${u.name}` }));
  }, [orgUnits, isAdminGeral, user?.departmentId]);

  const categoryOptions = useMemo<Option[]>(() => specialties.map(s => ({ value: s.id, label: `${s.code} - ${s.name}` })), [specialties]);

  const statusOptions: Option[] = [
    { value: 'TODO', label: 'A Fazer' },
    { value: 'IN_PROGRESS', label: 'Em Andamento' },
    { value: 'DONE', label: 'Concluído' },
    { value: 'INTERRUPTED', label: 'Interrompido' },
  ];

  const kpis = [
    { label: 'Demandas', value: report?.metrics.total ?? 0, icon: IconChartBar, color: 'blue' },
    { label: 'Resolução', value: `${report?.metrics.resolutionRate ?? 0}%`, icon: IconUsers, color: 'green' },
    { label: 'Sem técnico', value: `${report?.metrics.unassigned ?? 0} (${report?.metrics.unassignedRate ?? 0}%)`, icon: IconAlertTriangle, color: 'orange' },
    { label: 'Interrompidas', value: report?.metrics.interrupted ?? 0, icon: IconClock, color: 'grape' },
  ];

  const ringSections = useMemo(() => {
    if (!report || report.metrics.total === 0) return [{ value: 100, color: 'gray.2' }];
    const colors: Record<string, string> = {
      TODO: 'blue.6', IN_PROGRESS: 'orange.6', DONE: 'green.7', INTERRUPTED: 'red.7',
    };
    return Object.entries(report.statusCounts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        value: Math.round((count / report.metrics.total) * 100),
        color: colors[status] ?? 'gray.5',
      }));
  }, [report]);

  if (loadingOptions) {
    return <Center h="100vh"><Loader color="green" /></Center>;
  }

  return (
    <Box bg="gray.0" mih="100vh" pt={100} pb={60}>
      <TourPageGate phaseId="reports" />
      <Container size="xl">
        <Paper withBorder p="xl" radius="sm" shadow="sm" mb="lg">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Title order={2} c="crateus-green.9" fw={900}>Relatório Gerencial Completo</Title>
              <Text size="sm" c="dimmed">Monte filtros, visualize indicadores e acompanhe o desempenho operacional.</Text>
            </Stack>
            <Group>
              <Button leftSection={<IconFilter size={16} />} variant="light" color="green" loading={loadingReport} onClick={fetchReport} data-tour="reports-filters">
                Pré-visualizar
              </Button>
              <Button leftSection={<IconDownload size={16} />} color="green.8" disabled data-tour="reports-export">
                Exportar PDF
              </Button>
            </Group>
          </Group>
        </Paper>

        <Grid align="flex-start">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder p="lg" radius="sm" shadow="sm">
              <Title order={4} fw={900} c="green.9" mb="md">Filtros</Title>
              <Stack>
                <SimpleGrid cols={2}>
                  <TextInput label="Data inicial" type="date" value={startDate} onChange={e => setStartDate(e.currentTarget.value)} />
                  <TextInput label="Data final" type="date" value={endDate} onChange={e => setEndDate(e.currentTarget.value)} />
                </SimpleGrid>
                <MultiSelect
                  label="Secretarias"
                  placeholder="Todas permitidas"
                  data={departmentOptions}
                  value={departmentIds}
                  onChange={setDepartmentIds}
                  searchable
                  clearable
                  disabled={!isAdminGeral}
                />
                <MultiSelect label="Status" placeholder="Todos" data={statusOptions} value={statuses} onChange={setStatuses} clearable />
                <MultiSelect label="Categoria de demanda" placeholder="Todas" data={categoryOptions} value={techTypeCodes} onChange={setTechTypeCodes} searchable clearable />
                <Divider />
                <Checkbox label="Somente demandas sem técnico assumido" checked={onlyUnassigned} onChange={e => setOnlyUnassigned(e.currentTarget.checked)} />
                <Checkbox label="Somente demandas críticas/atenção" checked={onlyCritical} onChange={e => setOnlyCritical(e.currentTarget.checked)} />
                <Checkbox label="Incluir lista analítica de demandas" checked={includeDemandList} onChange={e => setIncludeDemandList(e.currentTarget.checked)} />
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            {loadingReport ? (
              <Center h={360}><Loader color="green" /></Center>
            ) : !report ? (
              <Paper withBorder p="xl" radius="sm"><Text c="dimmed">Gere uma prévia para visualizar o relatório.</Text></Paper>
            ) : (
              <Stack>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} data-tour="reports-stats">
                  {kpis.map(kpi => (
                    <Paper key={kpi.label} withBorder p="lg" radius="sm" shadow="xs">
                      <Group justify="space-between">
                        <Stack gap={0}>
                          <Text size="xs" c="dimmed" fw={800} tt="uppercase">{kpi.label}</Text>
                          <Text size="xl" fw={900}>{kpi.value}</Text>
                        </Stack>
                        <kpi.icon size={30} />
                      </Group>
                    </Paper>
                  ))}
                </SimpleGrid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 7 }}>
                    <Paper withBorder p="lg" radius="sm" shadow="xs" h={360}>
                      <Title order={5} fw={900} mb="sm">Fluxo do Período</Title>
                      <AreaChart
                        h={280}
                        data={report.timelineData}
                        dataKey="period"
                        series={[
                          { name: 'opened', color: 'blue.6', label: 'Abertas' },
                          { name: 'concluded', color: 'green.7', label: 'Concluídas' },
                        ]}
                        curveType="monotone"
                        withLegend
                      />
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 5 }}>
                    <Paper withBorder p="lg" radius="sm" shadow="xs" h={360}>
                      <Title order={5} fw={900} mb="sm">Distribuição por Status</Title>
                      <Center>
                        <RingProgress
                          size={190}
                          thickness={20}
                          sections={ringSections}
                          label={<Text ta="center" fw={900}>{report.metrics.total}</Text>}
                        />
                      </Center>
                      <SimpleGrid cols={2}>
                        {Object.entries(report.statusCounts).map(([status, count]) => (
                          <Group key={status} gap={6}>
                            <Badge variant="light">{count}</Badge>
                            <Text size="xs">{STATUS_LABELS[status] ?? status}</Text>
                          </Group>
                        ))}
                      </SimpleGrid>
                    </Paper>
                  </Grid.Col>
                </Grid>

                <BreakdownTable title="Resumo por Secretaria" rows={report.departments} empty="Nenhuma secretaria no filtro." />
                <BreakdownTable title="Categorias de Demanda" rows={report.categories} empty="Nenhuma categoria no filtro." />

                <Paper withBorder p="lg" radius="sm" shadow="xs">
                  <Group justify="space-between" mb="sm">
                    <Title order={5} fw={900}>Demandas Críticas / Atenção</Title>
                    <Badge color="red" variant="light">{report.criticalDemands.length}</Badge>
                  </Group>
                  <DemandTable rows={report.criticalDemands} />
                </Paper>

                {includeDemandList && (
                  <Paper withBorder p="lg" radius="sm" shadow="xs">
                    <Group justify="space-between" mb="sm">
                      <Title order={5} fw={900}>Detalhamento Analítico</Title>
                      <Badge color="green" variant="light">{report.demands.length}</Badge>
                    </Group>
                    <DemandTable rows={report.demands.slice(0, 80)} />
                    {report.demands.length > 80 && (
                      <Text size="xs" c="dimmed" mt="sm">Prévia limitada a 80 linhas.</Text>
                    )}
                  </Paper>
                )}
              </Stack>
            )}
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}

function BreakdownTable({ title, rows, empty }: { title: string; rows: Breakdown[]; empty: string }) {
  return (
    <Paper withBorder p="lg" radius="sm" shadow="xs">
      <Title order={5} fw={900} mb="sm">{title}</Title>
      {rows.length === 0 ? (
        <Text size="sm" c="dimmed">{empty}</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome</Table.Th>
              <Table.Th>Total</Table.Th>
              <Table.Th>Concluídas</Table.Th>
              <Table.Th>Pendentes</Table.Th>
              <Table.Th>Sem técnico</Table.Th>
              <Table.Th>Carga</Table.Th>
              <Table.Th>Resolução</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.slice(0, 10).map(row => (
              <Table.Tr key={row.id}>
                <Table.Td><Text size="sm" fw={700}>{row.name}</Text></Table.Td>
                <Table.Td>{row.total}</Table.Td>
                <Table.Td>{row.concluded}</Table.Td>
                <Table.Td>{row.pending}</Table.Td>
                <Table.Td>{row.unassigned}</Table.Td>
                <Table.Td>{row.sharePercent}%</Table.Td>
                <Table.Td>{row.resolutionRate}%</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  );
}

function DemandTable({ rows }: { rows: DemandRow[] }) {
  if (rows.length === 0) return <Text size="sm" c="dimmed">Nenhuma demanda encontrada.</Text>;
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Protocolo</Table.Th>
          <Table.Th>Título</Table.Th>
          <Table.Th>Secretaria</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Técnico</Table.Th>
          <Table.Th>Idade (h)</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map(row => (
          <Table.Tr key={row.id}>
            <Table.Td><Badge variant="light">{row.protocol}</Badge></Table.Td>
            <Table.Td><Text size="sm" lineClamp={2}>{row.title}</Text></Table.Td>
            <Table.Td>{row.departmentName}</Table.Td>
            <Table.Td>{row.statusLabel}</Table.Td>
            <Table.Td>{row.technicianName ?? 'Sem técnico'}</Table.Td>
            <Table.Td>{row.ageHours}h</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
