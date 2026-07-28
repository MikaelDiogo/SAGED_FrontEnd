import {
  Title, Text, Group, Paper, Badge, Box,
  ScrollArea, Select, UnstyledButton, Stack, Button,
  Modal, Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { api } from '../services/api';
import { DemandCard } from '../components/DemandCard';
import { DemandModal } from '../components/DemandModal';
import { AuthContext } from '../contexts/AuthContext';
import type { StatusType } from '../types';

export interface Demand {
  id: string;
  protocol: string;
  title: string;
  description: string;
  status: StatusType;
  priority?: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  viewed?: boolean;
  assetTag?: string | null;
  specialtyId: string;
  requesterUserId: string;
  assigneeUserId?: string | null;
  currentTechnicalNote?: string | null;
  departmentId: string;
  createdAt: string;
  updatedAt?: string;
  department?: { id: string; name: string; code: string };
  technician?: { id: string; name: string } | null;
}

interface OrgUnit {
  id: string;
  name: string;
  code: string;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

interface Specialty {
  id: string;
  code: string;
  name: string;
}

const COLUMNS: { id: StatusType; label: string; color: string }[] = [
  { id: 'A_FAZER', label: 'A Fazer', color: 'gray' },
  { id: 'EM_ANDAMENTO', label: 'Em Andamento', color: 'blue' },
  { id: 'CONCLUIDO', label: 'Concluído', color: 'green' },
  { id: 'INTERROMPIDO', label: 'Interrompido', color: 'red' },
];

export function Demands() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [allDemands, setAllDemands] = useState<Demand[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [currentUnitName, setCurrentUnitName] = useState('CARREGANDO PAINEL...');

  const [pendingDrag, setPendingDrag] = useState<{
    demandId: string;
    newStatus: StatusType;
  } | null>(null);
  const [justification, setJustification] = useState('');

  const { user } = useContext(AuthContext);

  const isAdminGeral = user?.role === 'SAGED_ADMIN_GERAL';
  const isLeader =
    user?.role === 'SAGED_ADMIN_SETOR' || user?.role === 'SAGED_TECNICO_LIDER';

  const unitId = searchParams.get('unit') || (isAdminGeral ? 'geral' : user?.departmentId || '');
  const queueId = searchParams.get('queue');

  const fetchDemands = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Page<Demand>>('/demands', { params: { size: 200 } });
      setAllDemands(response.data.content ?? []);
    } catch {
      notifications.show({ message: 'Erro ao carregar demandas.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      await fetchDemands();
      try {
        const [resOrgUnits, resSpecs] = await Promise.all([
          api.get<OrgUnit[]>('/org-units'),
          api.get<Specialty[]>('/specialties'),
        ]);

        if (!active) return;

        setOrgUnits(resOrgUnits.data ?? []);
        setSpecialties(resSpecs.data ?? []);

        const urlName = searchParams.get('name');
        if (urlName) {
          setCurrentUnitName(decodeURIComponent(urlName).toUpperCase());
        } else if (unitId === 'geral') {
          setCurrentUnitName('ADMINISTRAÇÃO CENTRAL');
        } else {
          const targetId = !isAdminGeral && user?.departmentId ? user.departmentId : unitId;
          const found = (resOrgUnits.data ?? []).find((d) => d.id === targetId);
          if (found) {
            setCurrentUnitName(found.name.toUpperCase());
            setSearchParams(
              (prev) => {
                prev.set('name', found.name.toUpperCase());
                prev.set('unit', targetId);
                return prev;
              },
              { replace: true }
            );
          } else {
            setCurrentUnitName('VISÃO OPERACIONAL');
          }
        }
      } catch {
        if (active) setCurrentUnitName('ERRO AO CARREGAR');
      }
    };

    loadData();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDemands = useMemo(() => {
    let result = allDemands;

    if (unitId && unitId !== 'geral') {
      result = result.filter((d) => d.departmentId === unitId);
    }

    if (queueId) {
      const matched = specialties.find((s) => s.id === queueId || s.code === queueId);
      if (matched) {
        result = result.filter((d) => d.specialtyId === matched.id);
      }
    }

    return result;
  }, [allDemands, unitId, queueId, specialties]);

  const applyStatusChange = useCallback(
    async (demandId: string, newStatus: StatusType, justificationText?: string) => {
      setAllDemands((prev) =>
        prev.map((d) => (d.id === demandId ? { ...d, status: newStatus } : d))
      );

      try {
        const payload: Record<string, string> = { status: newStatus };
        if (justificationText) payload.justification = justificationText;
        await api.patch(`/demands/${demandId}/status`, payload);
      } catch {
        notifications.show({ message: 'Erro ao atualizar status da demanda.', color: 'red' });
        fetchDemands();
      }
    },
    [fetchDemands]
  );

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const demand = allDemands.find((d) => d.id === draggableId);
    const canMove = isAdminGeral || isLeader || demand?.assigneeUserId === user?.id;

    if (!canMove) {
      notifications.show({ message: 'Sem permissão para mover este chamado.', color: 'orange' });
      return;
    }

    const newStatus = destination.droppableId as StatusType;

    if (newStatus === 'INTERROMPIDO') {
      setPendingDrag({ demandId: draggableId, newStatus });
      return;
    }

    await applyStatusChange(draggableId, newStatus);
  };

  const handleConfirmInterrupt = async () => {
    if (!pendingDrag) return;
    if (justification.trim().length < 15) {
      notifications.show({
        message: 'Justificativa deve ter no mínimo 15 caracteres.',
        color: 'orange',
      });
      return;
    }
    await applyStatusChange(pendingDrag.demandId, pendingDrag.newStatus, justification.trim());
    setPendingDrag(null);
    setJustification('');
  };

  const departmentOptions = useMemo(() => {
    if (!isAdminGeral && user?.departmentId) {
      const mine = orgUnits.find((u) => u.id === user.departmentId);
      return mine
        ? [{ value: mine.id, label: mine.name.toUpperCase() }]
        : [{ value: user.departmentId, label: 'SUA UNIDADE' }];
    }
    const opts = [{ value: 'geral', label: 'VISÃO GERAL MUNICIPAL' }];
    orgUnits.forEach((u) => opts.push({ value: u.id, label: u.name.toUpperCase() }));
    return opts;
  }, [orgUnits, isAdminGeral, user]);

  const getTechInitials = (demand: Demand) => {
    if (demand.technician?.name) {
      return demand.technician.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    return demand.assigneeUserId ? 'TEC' : '';
  };

  return (
    <Box
      style={{ height: 'calc(100vh - var(--pvh-current-height, 146px))', display: 'flex', flexDirection: 'column' }}
      bg="#f1f3f5"
    >
      <Box px="xs" flex={1} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Paper withBorder p="xs" radius="sm" mb="xs" shadow="xs">
          <Group justify="space-between">
            <Group gap="sm">
              <UnstyledButton onClick={() => navigate('/dashboard')}>
                <IconArrowLeft size={20} />
              </UnstyledButton>
              <Stack gap={0}>
                <Title order={5} c="green.9" fw={900}>
                  {currentUnitName}
                </Title>
                <Text size="10px" fw={700} c="dimmed">
                  SAGED — MONITORAMENTO EM TEMPO REAL
                </Text>
              </Stack>
            </Group>

            <Group gap="xs">
              <Select
                size="xs"
                value={unitId}
                disabled={!isAdminGeral}
                onChange={(val) => {
                  if (!val) return;
                  const dept = departmentOptions.find((o) => o.value === val);
                  const label = dept?.label ?? 'VISÃO GERAL MUNICIPAL';
                  setCurrentUnitName(label);
                  const q = queueId ? `&queue=${queueId}` : '';
                  navigate(`?unit=${val}&name=${encodeURIComponent(label)}${q}`);
                }}
                data={departmentOptions}
                style={{ width: 250 }}
              />

              {(isAdminGeral || isLeader) && (
                <Button
                  size="xs"
                  color="green.8"
                  leftSection={<IconPlus size={14} />}
                  onClick={() => navigate('/novo-chamado')}
                >
                  Nova Demanda
                </Button>
              )}
            </Group>
          </Group>
        </Paper>

        <DragDropContext onDragEnd={onDragEnd}>
          <Box
            style={{ display: 'flex', flex: 1, gap: '8px', minHeight: 0, paddingBottom: '10px' }}
          >
            {COLUMNS.map((col) => {
              const columnDemands = filteredDemands.filter((d) => d.status === col.id);
              return (
                <Box
                  key={col.id}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: '280px' }}
                >
                  <Paper
                    withBorder
                    radius="md"
                    bg="gray.1"
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                  >
                    <Box
                      p="sm"
                      bg="white"
                      style={{ borderBottom: `3px solid var(--mantine-color-${col.color}-6)` }}
                    >
                      <Group justify="space-between">
                        <Text fw={800} size="xs" tt="uppercase">{col.label}</Text>
                        <Badge variant="light" color={col.color}>
                          {loading ? '...' : columnDemands.length}
                        </Badge>
                      </Group>
                    </Box>

                    <Droppable droppableId={col.id}>
                      {(provided) => (
                        <ScrollArea
                          flex={1}
                          p="xs"
                          viewportRef={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          <Stack gap="xs">
                            {columnDemands.map((demand, index) => (
                              <Draggable key={demand.id} draggableId={demand.id} index={index}>
                                {(dragProvided) => (
                                  <Box
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                  >
                                    <DemandCard
                                      id={demand.id}
                                      protocol={demand.protocol}
                                      title={demand.title}
                                      description={demand.description}
                                      priority={
                                        demand.priority ??
                                        (demand.status === 'INTERROMPIDO' ? 'Crítica' : 'Alta')
                                      }
                                      departmentName={
                                        demand.department?.name ??
                                        orgUnits.find((u) => u.id === demand.departmentId)?.name ??
                                        'Sem Setor'
                                      }
                                      techInitials={getTechInitials(demand)}
                                      technicianName={demand.technician?.name}
                                      viewed={demand.viewed ?? false}
                                      isAdminView={isAdminGeral}
                                      onClick={() => {
                                        setSelectedDemand(demand);
                                        setModalOpened(true);
                                      }}
                                    />
                                  </Box>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </Stack>
                        </ScrollArea>
                      )}
                    </Droppable>
                  </Paper>
                </Box>
              );
            })}
          </Box>
        </DragDropContext>
      </Box>

      <DemandModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        demand={selectedDemand}
        onUpdate={fetchDemands}
        departments={orgUnits}
        isAdminView={isAdminGeral}
      />

      <Modal
        opened={!!pendingDrag}
        onClose={() => { setPendingDrag(null); setJustification(''); }}
        title={<Text fw={900}>Justificativa de Interrupção</Text>}
        centered
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Informe o motivo (mínimo 15 caracteres) para interromper este chamado.
          </Text>
          <Textarea
            label="Justificativa"
            placeholder="Descreva o motivo da interrupção..."
            minRows={4}
            required
            value={justification}
            onChange={(e) => setJustification(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => { setPendingDrag(null); setJustification(''); }}>
              Cancelar
            </Button>
            <Button color="red" onClick={handleConfirmInterrupt}>
              Confirmar Interrupção
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
