import { useState, useEffect, useContext } from 'react';
import { Container, Title, Paper, TextInput, Textarea, Select, Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

interface Specialty {
  id: string;
  code: string;
  name: string;
}

interface OrgUnit {
  id: string;
  code: string;
  name: string;
}

export function CreateDemand() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [specialtyCode, setSpecialtyCode] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useContext(AuthContext);
  const isAdminGeral = user?.role === 'SAGED_ADMIN_GERAL';

  useEffect(() => {
    async function loadFormData() {
      try {
        const requests = [
          api.get<Specialty[]>('/specialties'),
          ...(isAdminGeral ? [api.get<OrgUnit[]>('/org-units')] : []),
        ] as const;

        const [specialtiesRes, orgUnitsRes] = await Promise.all(requests);
        setSpecialties(specialtiesRes.data);
        if (isAdminGeral && orgUnitsRes) setOrgUnits(orgUnitsRes.data);
      } catch {
        notifications.show({
          title: 'Erro ao carregar',
          message: 'Não foi possível carregar os dados do formulário.',
          color: 'red',
        });
      } finally {
        setLoadingData(false);
      }
    }
    loadFormData();
  }, [isAdminGeral]);

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!specialtyCode) {
      notifications.show({ message: 'Selecione a categoria de especialidade.', color: 'orange' });
      return;
    }

    if (isAdminGeral && !departmentId) {
      notifications.show({ message: 'Selecione a secretaria para este chamado.', color: 'orange' });
      return;
    }

    setSubmitting(true);
    const correlationId = crypto.randomUUID();

    try {
      await api.post(
        '/demands',
        {
          title,
          description,
          specialtyCode,
          ...(departmentId ? { departmentId } : {}),
          assetTag: assetTag.trim() || undefined,
        },
        { headers: { 'X-Correlation-Id': correlationId } }
      );

      notifications.show({
        title: 'Chamado Aberto!',
        message: 'Sua demanda foi registrada e encaminhada para a fila.',
        color: 'green',
      });

      setTitle('');
      setDescription('');
      setAssetTag('');
      setSpecialtyCode(null);
      setDepartmentId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao abrir chamado.';
      notifications.show({ title: 'Erro', message, color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Paper withBorder p="xl" radius="sm" shadow="sm">
        <Title order={3} mb="xl" c="green.9" tt="uppercase" fw={800}>
          Abrir Nova Demanda
        </Title>

        <form onSubmit={handleCreateDemand}>
          <Stack gap="md">
            {isAdminGeral && (
              <Select
                label="Secretaria Vinculada"
                placeholder={loadingData ? 'Carregando...' : 'Selecione a secretaria'}
                data={orgUnits.map((u) => ({ value: u.id, label: `${u.code} — ${u.name}` }))}
                disabled={loadingData}
                required
                value={departmentId}
                onChange={setDepartmentId}
              />
            )}

            <TextInput
              label="Título"
              placeholder="ex: Computador da recepção não liga"
              required
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
            />

            <Textarea
              label="Descrição Detalhada do Problema"
              placeholder="Descreva o problema em detalhes..."
              required
              minRows={4}
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
            />

            <TextInput
              label="Tombamento / Patrimônio (Opcional)"
              placeholder="ex: PM-CRA-2026-XXXX"
              value={assetTag}
              onChange={(e) => setAssetTag(e.currentTarget.value)}
            />

            <Select
              label="Tipo de Atendimento Necessário"
              placeholder={loadingData ? 'Carregando...' : 'Selecione a especialidade'}
              data={specialties.map((s) => ({ value: s.code, label: s.name }))}
              disabled={loadingData}
              required
              value={specialtyCode}
              onChange={setSpecialtyCode}
            />

            <Button
              type="submit"
              color="green.8"
              loading={submitting}
              mt="md"
              style={{ fontWeight: 700 }}
            >
              Enviar Chamado
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
