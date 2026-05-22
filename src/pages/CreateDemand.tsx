import { useState, useEffect, useMemo } from 'react';
import { Container, Title, Paper, TextInput, Textarea, Select, Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { api } from '../services/api';

interface Specialty {
  id: string;
  code: string;
  name: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
}

// Interface estendida baseada no UserPublic do Swagger
interface LoggedUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN_GERAL' | 'ADMIN_SETOR' | 'TECNICO_LIDER' | 'TECNICO';
  departmentId: string | null;
}

export function CreateDemand() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [specialtyCode, setSpecialtyCode] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Recupera e tipa o usuário logado do ecossistema SAGE
  const loggedUser = useMemo<LoggedUser | null>(() => {
    const storageUser = localStorage.getItem('@SAGE:user');
    return storageUser ? JSON.parse(storageUser) : null;
  }, []);

  const isAdminGeral = useMemo(() => {
    return loggedUser?.role?.trim().toUpperCase() === 'ADMIN_GERAL';
  }, [loggedUser]);

  useEffect(() => {
    async function loadFormRequirements() {
      try {
        const [specialtiesRes, departmentsRes] = await Promise.all([
          api.get<Specialty[]>('/specialties'),
          isAdminGeral ? api.get<Department[]>('/departments') : Promise.resolve({ data: [] })
        ]);

        setSpecialties(specialtiesRes.data);
        if (isAdminGeral) {
          setDepartments(departmentsRes.data);
        }
      } catch (error) {
        notifications.show({
          title: 'Erro ao carregar formulário',
          message: 'Não foi possível buscar as parametrizações do SAGE.',
          color: 'red',
        });
      } finally {
        setLoadingData(false);
      }
    }
    loadFormRequirements();
  }, [isAdminGeral]);

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loggedUser?.id) {
      notifications.show({ message: 'Sessão expirada. Faça login novamente.', color: 'red' });
      return;
    }

    if (!specialtyCode) {
      notifications.show({ message: 'Selecione a categoria do problema', color: 'orange' });
      return;
    }

    // Define qual departmentId enviar baseado no papel (RBAC)
    let targetDepartmentId = isAdminGeral ? selectedDepartmentId : loggedUser.departmentId;

    if (!targetDepartmentId) {
      notifications.show({ 
        message: isAdminGeral 
          ? 'Selecione a secretaria vinculada ao chamado' 
          : 'Seu usuário não possui uma secretaria vinculada.', 
        color: 'orange' 
      });
      return;
    }

    setSubmitting(true);
    try {
      // Payload montado exatamente igual ao CreateDemandRequest do Swagger
      await api.post('/demands', {
        title,
        description,
        departmentId: targetDepartmentId,   // Obrigatório no Swagger (UUID)
        techTypeCode: specialtyCode,       // Obrigatório no Swagger
        asset_tag: assetTag || undefined,  // Opcional
      });

      notifications.show({
        title: 'Chamado Aberto!',
        message: 'Sua demanda foi registrada e encaminhada para a fila.',
        color: 'green',
      });

      // Limpa os estados do formulário
      setTitle('');
      setDescription('');
      setAssetTag('');
      setSpecialtyCode(null);
      setSelectedDepartmentId(null);
    } catch (error) {
      console.error("Erro na API /demands:", error);
      notifications.show({
        title: 'Erro ao abrir chamado',
        message: 'Houve um problema técnico ao processar sua requisição.',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container size="sm" pt={100} pb="xl">
      <Paper withBorder p="xl" radius="sm" shadow="sm">
        <Title order={3} mb="xl" c="green.9" tt="uppercase" fw={800}>
          Abrir Nova Demanda / Chamado
        </Title>

        <form onSubmit={handleCreateDemand}>
          <Stack gap="md">
            {isAdminGeral && (
              <Select
                label="Secretaria Vinculada"
                placeholder={loadingData ? 'Carregando secretarias...' : 'Para qual secretaria é este chamado?'}
                data={departments.map(d => ({ value: d.id, label: `SEC ${d.code} - ${d.name}` }))}
                disabled={loadingData}
                required
                value={selectedDepartmentId}
                onChange={setSelectedDepartmentId}
              />
            )}

            <TextInput
              label="Título Resumido"
              placeholder="Ex: Computador da recepção não liga"
              required
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
            />

            <Textarea
              label="Descrição Detalhada do Problema"
              placeholder="Descreva detalhadamente o que está acontecendo..."
              required
              minRows={4}
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
            />

            <TextInput
              label="Tombamento / Patrimônio do Equipamento (Opcional)"
              placeholder="Ex: PM-CRA-2026-XXXX"
              value={assetTag}
              onChange={(e) => setAssetTag(e.currentTarget.value)}
            />

            <Select
              label="Tipo de Atendimento Necessário"
              placeholder={loadingData ? 'Carregando categorias...' : 'Selecione a categoria'}
              data={specialties.map(spec => ({ value: spec.code, label: spec.name }))}
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