import {
  Modal, Button, Group, Text, Badge, Stack, Textarea,
  Select, Divider, Box, Alert, Tabs, Timeline, Loader, Center,
} from '@mantine/core';
import {
  IconBuildingCommunity, IconUserCheck,
  IconAlertCircle, IconUser, IconClockHour4, IconHistory,
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
  demandId?: string;
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
  { value: 'DONE', label: 'Concluido' },
  { value: 'INTERRUPTED', label: 'Interrompido' },
];

const STATUS_LABELS: Record<string, string> = {
  TODO: 'A Fazer', IN_PROGRESS: 'Em Andamento', DONE: 'Concluido',
  INTERRUPTED: 'Interrompido', CREATED: 'Criado', ASSIGNED: 'Atribuido', NOTE_UPDATED: 'Nota Atualizada',
};

const STATUS_COLORS: Record<string, string> = {
  TODO: 'gray', IN_PROGRESS: 'blue', DONE: 'green',
  INTERRUPTED: 'red', CREATED: 'teal', ASSIGNED: 'violet', NOTE_UPDATED: 'orange',
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
    const parts = action.split('->');
    return (STATUS_LABELS[parts[0]] ?? parts[0]) + ' -> ' + (STATUS_LABELS[parts[1]] ?? parts[1]);
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
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('details');

  useEffect(() => {
    if (!opened || !demand) return;
    setActiveTab('details');
    setHistory([]);
    const timer = setTimeout(() => {
      setStatus(demand.status ?? 'TODO');
      setNote(demand.currentTechnicalNote ?? '');
    }, 0);
    setHistoryLoading(true);

    api.get("/demands/" + demand.id + "/history")
      .then((res) => { setHistory(Array.isArray(res.data) ? res.data : []); })
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
    return () => clearTimeout(timer);
  }, [demand?.id, opened]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTakeOver = async () => {
    if (!demand || !user) return;
    setLoading(true);
    try {
      await api.patch(`/demands/${demand.id}/assignee`, { assigneeUserId: user.id });
      await api.patch(`/demands/${demand.id}/status`, { status: "IN_PROGRESS" });
      onUpdate();
      onClose();
    } catch {
      notifications.show({ title: "Erro operacional", message: "Não foi possível assumir o chamado.", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!demand) return;
    if (status === "INTERRUPTED" && note.trim().length < 15) {
      notifications.show({ title: "Relatorio insuficiente", message: "Justificativa com no minimo 15 caracteres.", color: "orange" });
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, string | null> = { status: status as StatusType };
      if (note.trim()) payload.justification = note.trim();
      await api.patch("/demands/" + demand.id + "/status", payload);
      onUpdate();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      notifications.show({ title: "Falha na atualizacao", message: axiosErr.response?.data?.error ?? "Erro ao salvar.", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  if (!demand) return null;

  const departmentName = departments.find((dep) => dep.id === demand.departmentId)?.name ?? demand.department?.name ?? "SECRETARIA NAO ENCONTRADA";
  const isSemTecnico = !demand.assigneeUserId && !demand.technician?.name;
  const technicianName = demand.technician?.name;
  const isTecnico = user?.role === "SAGED_TECNICO" || user?.role === "SAGED_TECNICO_LIDER";
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
          <Tabs.Tab value="history" leftSection={<IconHistory size={14} />}>Historico</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="details">
          <Stack gap="md">
            <Box bg="gray.0" p="md" style={{ borderLeft: "4px solid green", borderRadius: "4px" }}>
              <Text size="xs" fw={800} c="dimmed">TITULO: {demand.title}</Text>
              <Text size="sm" mt={5}>{demand.description}</Text>
            </Box>
            {demand.currentTechnicalNote && (
              <Box bg="green.0" p="md" style={{ borderLeft: "4px solid #2f9e44", borderRadius: "4px" }}>
                <Text size="xs" fw={800} c="green.9">OBSERVACAO TECNICA ATUAL</Text>
                <Text size="sm" mt={5}>{demand.currentTechnicalNote}</Text>
              </Box>
            )}
            <Divider label="Painel Tecnico de Controle" labelPosition="center" />
            <Group gap="xs" px="xs" py="4px" style={{ background: "#f8f9fa", borderRadius: "4px" }}>
              <IconUser size={16} color="gray" />
              <Text size="xs" fw={600} c="dimmed">Responsavel Atual:</Text>
              <Text size="xs" fw={700} c={technicianName ? "green.8" : "orange.8"}>
                {technicianName ? technicianName.toUpperCase() : "AGUARDANDO TECNICO DA ESPECIALIDADE"}
              </Text>
            </Group>
            {isSemTecnico && isTecnico ? (
              <Alert icon={<IconAlertCircle size={16} />} title="Chamado Disponivel" color="blue" radius="md">
                <Text size="sm" mb="md">Esta demanda ainda nao possui tecnico responsavel. Deseja assumir o atendimento?</Text>
                <Group justify="flex-end">
                  <Button color="blue" leftSection={<IconUserCheck size={16} />} loading={loading} onClick={handleTakeOver}>
                    Assumir Atendimento
                  </Button>
                </Group>
              </Alert>
            ) : (
              <>
                <Select label="Status Operacional" value={status} onChange={(v) => setStatus(v ?? "")} data={STATUS_OPTIONS} />
                <Textarea
                  label={status === "INTERRUPTED" ? "Justificativa Obrigatoria (Minimo 15 caracteres)" : "Relatorio Tecnico / Observacoes"}
                  minRows={3}
                  placeholder={status === "INTERRUPTED" ? "Descreva o motivo da interrupcao..." : "Descreva as acoes realizadas ou observacoes..."}
                  value={note}
                  onChange={(e) => setNote(e.currentTarget.value)}
                  required={status === "INTERRUPTED"}
                />
                <Group justify="flex-end" mt="md">
                  <Button variant="subtle" onClick={onClose} disabled={loading}>Cancelar</Button>
                  <Button color="green.8" onClick={handleSave} loading={loading}>Salvar Alteracoes</Button>
                </Group>
              </>
            )}
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="history">
          {historyLoading ? (
            <Center py="xl"><Loader size="sm" color="green.8" /></Center>
          ) : history.length === 0 ? (
            <Center py="xl"><Text size="xs" c="dimmed" fw={600}>Nenhum evento registrado para esta demanda.</Text></Center>
          ) : (
            <Timeline active={history.length - 1} bulletSize={20} lineWidth={2} mt="sm">
              {history.map((entry) => (
                <Timeline.Item
                  key={entry.id}
                  bullet={<IconClockHour4 size={12} />}
                  title={
                    <Group gap={6} wrap="nowrap">
                      <Badge size="xs" color={mapActionColor(entry.action)} variant="light">{mapActionLabel(entry.action)}</Badge>
                      <Text size="xs" fw={700} c="gray.7">{entry.createdBy ?? "Sistema"}</Text>
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
