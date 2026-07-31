import { useState, useEffect, useContext } from 'react';
import {
  Container, Title, Text, Stack, Tabs, Table, Badge,
  Button, Group, Select, Modal, Loader, Center, Box, Paper,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconBan, IconRefresh } from '@tabler/icons-react';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

interface TelegramRequester {
  id: string;
  telegramChatId: string;
  phoneNumber: string;
  displayName: string | null;
  departmentId: string | null;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

interface OrgUnit {
  id: string;
  code: string;
  name: string;
}

export function ManageTelegramNumbers() {
  const { user } = useContext(AuthContext);
  const isAdminGeral = user?.role === 'SAGED_ADMIN_GERAL';

  const [requesters, setRequesters] = useState<TelegramRequester[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const [approveTarget, setApproveTarget] = useState<TelegramRequester | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [reqRes, unitsRes] = await Promise.all([
        api.get<TelegramRequester[]>('/telegram/requesters'),
        api.get<OrgUnit[]>('/org-units'),
      ]);
      setRequesters(Array.isArray(reqRes.data) ? reqRes.data : []);
      setOrgUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
    } catch {
      notifications.show({ message: 'Erro ao carregar dados.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function getOrgUnitName(id: string | null) {
    if (!id) return '—';
    const found = orgUnits.find((u) => u.id === id);
    return found ? `${found.code} — ${found.name}` : id;
  }

  async function handleApprove() {
    if (!approveTarget) return;
    if (isAdminGeral && !selectedDept) {
      notifications.show({ message: 'Selecione a secretaria antes de aprovar.', color: 'orange' });
      return;
    }
    setActionLoading(true);
    try {
      const params = isAdminGeral && selectedDept ? `?departmentId=${selectedDept}` : '';
      await api.patch(`/telegram/requesters/${approveTarget.id}/approve${params}`);
      notifications.show({ message: 'Número aprovado com sucesso.', color: 'green' });
      setApproveTarget(null);
      setSelectedDept(null);
      await load();
    } catch {
      notifications.show({ message: 'Erro ao aprovar.', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(true);
    try {
      await api.patch(`/telegram/requesters/${id}/reject`);
      notifications.show({ message: 'Solicitação rejeitada.', color: 'orange' });
      await load();
    } catch {
      notifications.show({ message: 'Erro ao rejeitar.', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeactivate(id: string) {
    setActionLoading(true);
    try {
      await api.patch(`/telegram/requesters/${id}/deactivate`);
      notifications.show({ message: 'Número desativado.', color: 'orange' });
      await load();
    } catch {
      notifications.show({ message: 'Erro ao desativar.', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReactivate(id: string) {
    setActionLoading(true);
    try {
      await api.patch(`/telegram/requesters/${id}/activate`);
      notifications.show({ message: 'Número reativado.', color: 'green' });
      await load();
    } catch {
      notifications.show({ message: 'Erro ao reativar.', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  }

  const pending = requesters.filter((r) => r.status === 'PENDING');
  const active = requesters.filter((r) => r.status === 'ACTIVE');
  const inactive = requesters.filter((r) => r.status === 'INACTIVE');

  function RequesterTable({
    rows,
    showActions,
  }: {
    rows: TelegramRequester[];
    showActions: 'pending' | 'active' | 'inactive';
  }) {
    if (rows.length === 0) {
      return (
        <Center py="xl" style={{ flexDirection: 'column' }}>
          <Text c="dimmed" size="sm">Nenhum registro encontrado.</Text>
        </Center>
      );
    }
    return (
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Número</Table.Th>
            <Table.Th>Telegram ID</Table.Th>
            {showActions !== 'pending' && <Table.Th>Secretaria</Table.Th>}
            <Table.Th>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r) => (
            <Table.Tr key={r.id}>
              <Table.Td>{r.displayName ?? '—'}</Table.Td>
              <Table.Td>{r.phoneNumber}</Table.Td>
              <Table.Td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.telegramChatId}</Table.Td>
              {showActions !== 'pending' && (
                <Table.Td>
                  <Text size="xs">{getOrgUnitName(r.departmentId)}</Text>
                </Table.Td>
              )}
              <Table.Td>
                <Group gap="xs">
                  {showActions === 'pending' && (
                    <>
                      <Button
                        size="xs"
                        color="green.7"
                        leftSection={<IconCheck size={14} />}
                        onClick={() => { setApproveTarget(r); setSelectedDept(null); }}
                        disabled={actionLoading}
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        leftSection={<IconX size={14} />}
                        onClick={() => handleReject(r.id)}
                        disabled={actionLoading}
                      >
                        Rejeitar
                      </Button>
                    </>
                  )}
                  {showActions === 'active' && (
                    <Button
                      size="xs"
                      color="orange"
                      variant="light"
                      leftSection={<IconBan size={14} />}
                      onClick={() => handleDeactivate(r.id)}
                      disabled={actionLoading}
                    >
                      Desativar
                    </Button>
                  )}
                  {showActions === 'inactive' && (
                    <Button
                      size="xs"
                      color="green.7"
                      variant="light"
                      leftSection={<IconRefresh size={14} />}
                      onClick={() => handleReactivate(r.id)}
                      disabled={actionLoading}
                    >
                      Reativar
                    </Button>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  }

  return (
    <Box bg="gray.0" style={{ minHeight: 'calc(100vh - 146px)' }}>
      <Container size="xl" py="xl">
        <Stack gap="xs" mb={32}>
          <Title order={2} c="green.9" tt="uppercase" fw={900} lts="1px">
            Gerenciar Números Telegram
          </Title>
          <Text size="sm" c="dimmed" fw={500}>
            Aprove ou rejeite solicitações de acesso ao bot do SAGED via Telegram.
          </Text>
        </Stack>

        {loading ? (
          <Center h={300}><Loader color="green.8" /></Center>
        ) : (
          <Paper withBorder radius="sm" shadow="sm" bg="white">
            <Tabs defaultValue="pending" color="green.7">
              <Tabs.List px="md" pt="xs">
                <Tabs.Tab value="pending">
                  Pendentes
                  {pending.length > 0 && (
                    <Badge ml={8} size="sm" color="orange" variant="filled" circle>
                      {pending.length}
                    </Badge>
                  )}
                </Tabs.Tab>
                <Tabs.Tab value="active">Ativos ({active.length})</Tabs.Tab>
                <Tabs.Tab value="inactive">Inativos ({inactive.length})</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="pending" p="md">
                <RequesterTable rows={pending} showActions="pending" />
              </Tabs.Panel>
              <Tabs.Panel value="active" p="md">
                <RequesterTable rows={active} showActions="active" />
              </Tabs.Panel>
              <Tabs.Panel value="inactive" p="md">
                <RequesterTable rows={inactive} showActions="inactive" />
              </Tabs.Panel>
            </Tabs>
          </Paper>
        )}
      </Container>

      <Modal
        opened={approveTarget !== null}
        onClose={() => { setApproveTarget(null); setSelectedDept(null); }}
        title={<Text fw={700} c="green.9">Aprovar acesso</Text>}
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Número: <b>{approveTarget?.phoneNumber}</b>
            {approveTarget?.displayName && <> ({approveTarget.displayName})</>}
          </Text>

          {isAdminGeral && (
            <Select
              label="Secretaria de vínculo"
              placeholder="Selecione a secretaria"
              required
              data={orgUnits.map((u) => ({ value: u.id, label: `${u.code} — ${u.name}` }))}
              value={selectedDept}
              onChange={setSelectedDept}
              searchable
            />
          )}

          {!isAdminGeral && (
            <Text size="sm" c="dimmed">
              O número será vinculado à sua secretaria automaticamente.
            </Text>
          )}

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setApproveTarget(null)}>Cancelar</Button>
            <Button
              color="green.7"
              loading={actionLoading}
              onClick={handleApprove}
              leftSection={<IconCheck size={16} />}
            >
              Confirmar aprovação
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
