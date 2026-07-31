import {
  Modal, Button, Group, Text, Badge, Stack, Textarea,
  Select, Divider, Box, Alert, Tabs, Timeline, Loader, Center,
  Radio, TextInput, SimpleGrid, Paper,
} from '@mantine/core';
import {
  IconBuildingCommunity, IconUserCheck,
  IconAlertCircle, IconUser, IconClockHour4, IconHistory, IconTool,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useState, useEffect, useContext } from 'react';
import { AxiosError } from 'axios';
import { api } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import type { Demand } from '../../pages/Demands';
import type { StatusType } from '../../types';

interface Department { id: string; name: string; }

interface HistoryEntry {
  id: string;
  action: string;
  justification?: string | null;
  createdAt: string;
  createdBy?: string;
}

interface DemandModalProps {
  opened: boolean;
  onClose: () => void;
  demand: Demand | null;
  onUpdate: () => void;
  departments: Department[];
  isAdminView?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'A Fazer' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'DONE', label: 'Concluído' },
  { value: 'INTERRUPTED', label: 'Interrompido' },
];

const STATUS_LABELS: Record<string, string> = {
  TODO: 'A Fazer', IN_PROGRESS: 'Em Andamento', DONE: 'Concluído',
  INTERRUPTED: 'Interrompido', CREATED: 'Criado', ASSIGNED: 'Atribuído',
  NOTE_UPDATED: 'Nota Atualizada', EQUIPMENT_UPDATED: 'Equipamento Registrado',
};

const STATUS_COLORS: Record<string, string> = {
  TODO: 'gray', IN_PROGRESS: 'blue', DONE: 'green',
  INTERRUPTED: 'red', CREATED: 'teal', ASSIGNED: 'violet',
  NOTE_UPDATED: 'orange', EQUIPMENT_UPDATED: 'indigo',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function mapActionLabel(action: string): string {
  if (STATUS_LABELS[action]) return STATUS_LABELS[action];
  if (action.includes('->')) {
    const [from, to] = action.split('->');
    return (STATUS_LABELS[from] ?? from) + ' → ' + (STATUS_LABELS[to] ?? to);
  }
  return action;
}

function mapActionColor(action: string): string {
  if (STATUS_COLORS[action]) return STATUS_COLORS[action];
  if (action.includes('->')) return STATUS_COLORS[action.split('->')[1]] ?? 'gray';
  return 'gray';
}

export function DemandModal({
  opened, onClose, demand, onUpdate, departments, isAdminView = false,
}: DemandModalProps) {
  const { user } = useContext(AuthContext);

  // aba ativa
  const [activeTab, setActiveTab] = useState<string | null>('details');

  // aba Detalhes
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [note, setNote] = useState('');

  // aba Equipamento
  const [eqLoading, setEqLoading] = useState(false);
  const [isRented, setIsRented] = useState<string | null>(null); // 'rented' | 'tombado'
  const [assetTag, setAssetTag] = useState('');
  const [eqName, setEqName] = useState('');
  const [eqModel, setEqModel] = useState('');

  // aba Histórico
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!opened || !demand) return;
    setActiveTab('details');
    setHistory([]);

    const timer = setTimeout(() => {
      setStatus(demand.status ?? 'TODO');
      setNote(demand.currentTechnicalNote ?? '');
      setIsRented(demand.isRented === true ? 'rented' : demand.isRented === false ? 'tombado' : null);
      setAssetTag(demand.assetTag ?? '');
      setEqName(demand.equipmentName ?? '');
      setEqModel(demand.equipmentModel ?? '');
    }, 0);

    setHistoryLoading(true);
    api.get(`/demands/${demand.id}/history`)
      .then((res) => setHistory(Array.isArray(res.data) ? res.data : []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));

    return () => clearTimeout(timer);
  }, [demand?.id, opened]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTakeOver = async () => {
    if (!demand || !user) return;
    setLoading(true);
    try {
      await api.patch(`/demands/${demand.id}/assignee`, { assigneeUserId: user.id });
      await api.patch(`/demands/${demand.id}/status`, { status: 'IN_PROGRESS' });
      onUpdate();
      onClose();
    } catch {
      notifications.show({ title: 'Erro', message: 'Não foi possível assumir o chamado.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!demand) return;
    if (status === 'INTERRUPTED' && note.trim().length < 15) {
      notifications.show({ message: 'Justificativa com mínimo 15 caracteres.', color: 'orange' });
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, string | null> = { status: status as StatusType };
      if (note.trim()) payload.justification = note.trim();
      await api.patch(`/demands/${demand.id}/status`, payload);
      onUpdate();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      notifications.show({ title: 'Falha', message: axiosErr.response?.data?.error ?? 'Erro ao salvar.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEquipment = async () => {
    if (!demand) return;
    if (!isRented) {
      notifications.show({ message: 'Selecione se o equipamento é locado ou tombado.', color: 'orange' });
      return;
    }
    if (isRented === 'tombado' && !assetTag.trim()) {
      notifications.show({ message: 'Informe o número de tombamento.', color: 'orange' });
      return;
    }
    setEqLoading(true);
    try {
      await api.patch(`/demands/${demand.id}/equipment`, {
        isRented: isRented === 'rented',
        assetTag: isRented === 'tombado' ? assetTag.trim() : null,
        equipmentName: eqName.trim() || null,
        equipmentModel: eqModel.trim() || null,
      });
      notifications.show({ message: 'Equipamento registrado.', color: 'green' });
      onUpdate();
    } catch {
      notifications.show({ message: 'Erro ao salvar equipamento.', color: 'red' });
    } finally {
      setEqLoading(false);
    }
  };

  if (!demand) return null;

  const departmentName = departments.find(d => d.id === demand.departmentId)?.name
    ?? demand.department?.name ?? 'SECRETARIA NÃO ENCONTRADA';
  const isSemTecnico = !demand.assigneeUserId && !demand.technician?.name;
  const technicianName = demand.technician?.name;
  const isTecnico = user?.role === 'SAGED_TECNICO' || user?.role === 'SAGED_TECNICO_LIDER';
  const canEditEquipment = demand.status === 'IN_PROGRESS' || demand.status === 'TODO';

  const equipmentSummary = demand.equipmentName || demand.equipmentModel || demand.isRented !== null;

  void isAdminView;

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={900}>DETALHES DA DEMANDA</Text>} size="lg" radius="md" centered>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconBuildingCommunity size={18} color="blue" />
          <Text fw={700} size="sm">{departmentName.toUpperCase()}</Text>
        </Group>
        <Badge color="blue">#{demand.protocol}</Badge>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="details" leftSection={<IconUser size={14} />}>Detalhes</Tabs.Tab>
          <Tabs.Tab value="equipment" leftSection={<IconTool size={14} />}>
            Equipamento
            {equipmentSummary && <Badge size="xs" color="indigo" ml={6} variant="light">registrado</Badge>}
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconClockHour4 size={14} />}>Histórico</Tabs.Tab>
        </Tabs.List>

        {/* ── ABA DETALHES ── */}
        <Tabs.Panel value="details">
          <Stack gap="md">
            <Box bg="gray.0" p="md" style={{ borderLeft: '4px solid #2f9e44', borderRadius: 4 }}>
              <Text size="xs" fw={800} c="dimmed" mb={4}>TÍTULO</Text>
              <Text size="sm" fw={600}>{demand.title}</Text>
              {demand.description && demand.description !== demand.title && (
                <Text size="sm" c="dimmed" mt={6}>{demand.description}</Text>
              )}
            </Box>

            {demand.currentTechnicalNote && (
              <Box bg="green.0" p="md" style={{ borderLeft: '4px solid #2f9e44', borderRadius: 4 }}>
                <Text size="xs" fw={800} c="green.9">OBSERVAÇÃO TÉCNICA ATUAL</Text>
                <Text size="sm" mt={5}>{demand.currentTechnicalNote}</Text>
              </Box>
            )}

            <Divider label="Painel Técnico" labelPosition="center" />

            <Group gap="xs" px="xs" py={4} style={{ background: '#f8f9fa', borderRadius: 4 }}>
              <IconUser size={16} color="gray" />
              <Text size="xs" fw={600} c="dimmed">Responsável:</Text>
              <Text size="xs" fw={700} c={technicianName ? 'green.8' : 'orange.8'}>
                {technicianName ? technicianName.toUpperCase() : 'AGUARDANDO TÉCNICO'}
              </Text>
            </Group>

            {isSemTecnico && isTecnico ? (
              <Alert icon={<IconAlertCircle size={16} />} title="Chamado Disponível" color="blue" radius="md">
                <Text size="sm" mb="md">
                  Este chamado não possui técnico responsável. Deseja assumir o atendimento?
                </Text>
                <Group justify="flex-end">
                  <Button color="blue" leftSection={<IconUserCheck size={16} />} loading={loading} onClick={handleTakeOver}>
                    Assumir Atendimento
                  </Button>
                </Group>
              </Alert>
            ) : (
              <>
                <Select
                  label="Status Operacional"
                  value={status}
                  onChange={v => setStatus(v ?? '')}
                  data={STATUS_OPTIONS}
                />
                <Textarea
                  label={status === 'INTERRUPTED' ? 'Justificativa (mínimo 15 caracteres) *' : 'Relatório Técnico / Observações'}
                  minRows={3}
                  placeholder={status === 'INTERRUPTED' ? 'Descreva o motivo da interrupção...' : 'Descreva as ações realizadas...'}
                  value={note}
                  onChange={e => setNote(e.currentTarget.value)}
                  required={status === 'INTERRUPTED'}
                />
                <Group justify="flex-end" mt="sm">
                  <Button variant="subtle" onClick={onClose} disabled={loading}>Cancelar</Button>
                  <Button color="green.8" onClick={handleSave} loading={loading}>Salvar Alterações</Button>
                </Group>
              </>
            )}
          </Stack>
        </Tabs.Panel>

        {/* ── ABA EQUIPAMENTO ── */}
        <Tabs.Panel value="equipment">
          <Stack gap="md">
            {!canEditEquipment && (
              <Paper withBorder p="sm" radius="sm" bg="gray.0">
                <Text size="xs" c="dimmed" fw={600}>
                  Equipamento só pode ser editado enquanto o chamado estiver em A Fazer ou Em Andamento.
                </Text>
              </Paper>
            )}

            {equipmentSummary && !canEditEquipment && (
              <Stack gap="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">Dados registrados</Text>
                <SimpleGrid cols={2} spacing="xs">
                  <Box><Text size="xs" c="dimmed">Tipo</Text><Text size="sm" fw={600}>{demand.isRented ? 'Locado' : 'Tombado'}</Text></Box>
                  {demand.assetTag && <Box><Text size="xs" c="dimmed">Tombamento</Text><Text size="sm" fw={600}>{demand.assetTag}</Text></Box>}
                  {demand.equipmentName && <Box><Text size="xs" c="dimmed">Nome</Text><Text size="sm" fw={600}>{demand.equipmentName}</Text></Box>}
                  {demand.equipmentModel && <Box><Text size="xs" c="dimmed">Modelo</Text><Text size="sm" fw={600}>{demand.equipmentModel}</Text></Box>}
                </SimpleGrid>
              </Stack>
            )}

            {canEditEquipment && (
              <>
                <Box>
                  <Text size="sm" fw={700} mb="xs">Tipo de equipamento *</Text>
                  <Radio.Group value={isRented} onChange={setIsRented}>
                    <Stack gap="xs">
                      <Radio value="tombado" label="Tombado (patrimônio da prefeitura)" />
                      <Radio value="rented"  label="Locado (equipamento alugado)" />
                    </Stack>
                  </Radio.Group>
                </Box>

                {isRented === 'tombado' && (
                  <TextInput
                    label="Número de Tombamento *"
                    placeholder="Ex.: 12345"
                    value={assetTag}
                    onChange={e => setAssetTag(e.currentTarget.value)}
                    required
                  />
                )}

                <SimpleGrid cols={2} spacing="sm">
                  <TextInput
                    label="Nome do equipamento"
                    placeholder="Ex.: Notebook Dell"
                    value={eqName}
                    onChange={e => setEqName(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Modelo"
                    placeholder="Ex.: Latitude 5420"
                    value={eqModel}
                    onChange={e => setEqModel(e.currentTarget.value)}
                  />
                </SimpleGrid>

                <Group justify="flex-end" mt="sm">
                  <Button color="indigo" onClick={handleSaveEquipment} loading={eqLoading}>
                    Salvar Equipamento
                  </Button>
                </Group>
              </>
            )}

            {!equipmentSummary && !canEditEquipment && (
              <Center py="xl">
                <Text size="xs" c="dimmed">Nenhum equipamento registrado.</Text>
              </Center>
            )}
          </Stack>
        </Tabs.Panel>

        {/* ── ABA HISTÓRICO ── */}
        <Tabs.Panel value="history">
          {historyLoading ? (
            <Center py="xl"><Loader size="sm" color="green.8" /></Center>
          ) : history.length === 0 ? (
            <Center py="xl"><Text size="xs" c="dimmed" fw={600}>Nenhum evento registrado.</Text></Center>
          ) : (
            <Timeline active={history.length - 1} bulletSize={20} lineWidth={2} mt="sm">
              {history.map(entry => (
                <Timeline.Item
                  key={entry.id}
                  bullet={<IconClockHour4 size={12} />}
                  title={
                    <Group gap={6} wrap="nowrap">
                      <Badge size="xs" color={mapActionColor(entry.action)} variant="light">
                        {mapActionLabel(entry.action)}
                      </Badge>
                      <Text size="xs" fw={700} c="gray.7">{entry.createdBy ?? 'Sistema'}</Text>
                    </Group>
                  }
                >
                  {entry.justification && <Text size="xs" c="dimmed" mt={2}>{entry.justification}</Text>}
                  <Text size="10px" c="gray.5" mt={4}>{formatDate(entry.createdAt)}</Text>
                </Timeline.Item>
              ))}
            </Timeline>
          )}
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
