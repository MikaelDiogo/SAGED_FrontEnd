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
import { TourPageGate } from '../components/Tour';
import { Footer } from '../components/Footer';
import { HEADER_HEIGHT_EXPANDED_DESKTOP } from '../components/Header';
import { QUEUE_LABELS } from '../constants/queues';
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

const COLUMNS: { id: StatusType; label: string; color: string; bg: string; tourId: string }[] = [
  { id: 'TODO', label: 'A Fazer', color: 'gray', bg: 'gray.1', tourId: 'demands-col-afazer' },
  { id: 'IN_PROGRESS', label: 'Em Andamento', color: 'blue', bg: 'blue.0', tourId: 'demands-col-andamento' },
  { id: 'DONE', label: 'Concluido', color: 'green', bg: 'green.0', tourId: 'demands-col-concluido' },
  { id: 'INTERRUPTED', label: 'Interrompido', color: 'red', bg: 'red.0', tourId: 'demands-col-interrompido' },
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

  const VALID_TRANSITIONS: Record<StatusType, StatusType[]> = {
    TODO:        ['IN_PROGRESS'],
    IN_PROGRESS: ['DONE', 'INTERRUPTED'],
    DONE:        [],
    INTERRUPTED: [],
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const demand = allDemands.find((d) => d.id === draggableId);
    const canMove = isAdminGeral || isLeader || demand?.assigneeUserId === user?.id;

    if (!canMove) {
      notifications.show({ message: 'Sem permissão para mover este chamado.', color: 'orange' });
      return;
    }

    const fromStatus = source.droppableId as StatusType;
    const newStatus = destination.droppableId as StatusType;

    if (!VALID_TRANSITIONS[fromStatus]?.includes(newStatus)) {
      notifications.show({
        message: `Transição ${fromStatus} → ${newStatus} não é permitida.`,
        color: 'orange',
      });
      return;
    }

    setPendingDrag({ demandId: draggableId, newStatus });
  };

  const handleConfirmMove = async () => {
    if (!pendingDrag) return;
    const isInterrupted = pendingDrag.newStatus === 'INTERRUPTED';
    if (isInterrupted && justification.trim().length < 15) {
      notifications.show({ message: 'Justificativa deve ter no mínimo 15 caracteres.', color: 'orange' });
      return;
    }
    await applyStatusChange(pendingDrag.demandId, pendingDrag.newStatus, justification.trim() || undefined);
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
      return demand.technician.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return demand.assigneeUserId ? 'TEC' : '';
  };

  const getTechName = (demand: Demand) => {
    if (demand.technician?.name) return demand.technician.name;
    if (demand.assigneeUserId) return 'Técnico Atribuído';
    return undefined;
  };

  const queueTitle = queueId
    ? (QUEUE_LABELS[queueId] ?? specialties.find((s) => s.id === queueId)?.name ?? queueId).toUpperCase()
    : 'QUADRO DE DEMANDAS';

  return (
    <Box
      style={{ minHeight: `calc(100vh - ${HEADER_HEIGHT_EXPANDED_DESKTOP}px)`, display: 'flex', flexDirection: 'column' }}
      bg="#f1f3f5"
    >
      <Box px="xs" flex={1} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <TourPageGate phaseId="demands" />
        <Paper withBorder p="xs" radius="sm" mb="xs" shadow="xs">
          <Group justify="space-between">
            <Group gap="sm">
              <UnstyledButton onClick={() => navigate('/dashboard')}>
                <IconArrowLeft size={20} />
              </UnstyledButton>
              <Stack gap={0}>
                <Title order={5} c="green.9" fw={900}>
                  {queueTitle}
                </Title>
                <Text size="10px" fw={700} c="dimmed">
                  {currentUnitName} · SAGED MONITORAMENTO
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
            data-tour="demands-board" style={{ display: 'flex', flex: 1, gap: '8px', minHeight: 0, paddingBottom: '10px' }}
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
                    bg={col.bg}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                  >
                    <Box
                      p="sm"
                      
                      style={{ borderBottom: `3px solid var(--mantine-color-${col.color}-6)` }}
                    >
                      <Group justify="space-between">
                        <Text fw={800} size="xs" tt="uppercase" c={col.color + '.9'}>{col.label}</Text>
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
                                        (demand.status === 'INTERRUPTED' ? 'Crítica' : 'Alta')
                                      }
                                      departmentName={
                                        demand.department?.name ??
                                        orgUnits.find((u) => u.id === demand.departmentId)?.name ??
                                        'Sem Setor'
                                      }
                                      techInitials={getTechInitials(demand)}
                                      technicianName={getTechName(demand)}
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

      <Footer />
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
        title={
          <Text fw={900}>
            {pendingDrag?.newStatus === 'INTERRUPTED' ? 'Justificativa de Interrupção' :
             pendingDrag?.newStatus === 'DONE' ? 'Registrar Conclusão' :
             'Registrar Início do Atendimento'}
          </Text>
        }
        centered
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {pendingDrag?.newStatus === 'INTERRUPTED'
              ? 'Informe o motivo (mínimo 15 caracteres) para interromper este chamado.'
              : pendingDrag?.newStatus === 'DONE'
              ? 'Descreva o que foi realizado para concluir o atendimento.'
              : 'Descreva a ação inicial ou confirmação de início do atendimento.'}
          </Text>
          <Textarea
            label={pendingDrag?.newStatus === 'INTERRUPTED' ? 'Justificativa (obrigatória)' : 'Observação técnica (opcional)'}
            placeholder={
              pendingDrag?.newStatus === 'INTERRUPTED'
                ? 'Descreva o motivo da interrupção...'
                : 'Descreva as ações realizadas ou observações relevantes...'
            }
            minRows={4}
            required={pendingDrag?.newStatus === 'INTERRUPTED'}
            value={justification}
            onChange={(e) => setJustification(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => { setPendingDrag(null); setJustification(''); }}>
              Cancelar
            </Button>
            <Button
              color={pendingDrag?.newStatus === 'INTERRUPTED' ? 'red' : pendingDrag?.newStatus === 'DONE' ? 'green' : 'blue'}
              onClick={handleConfirmMove}
            >
              {pendingDrag?.newStatus === 'INTERRUPTED' ? 'Confirmar Interrupção' :
               pendingDrag?.newStatus === 'DONE' ? 'Confirmar Conclusão' :
               'Confirmar Início'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
