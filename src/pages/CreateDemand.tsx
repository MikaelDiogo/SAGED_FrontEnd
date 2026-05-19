import { 
  Container, Paper, Title, TextInput, Textarea, 
  Select, Button, Group, Stack, Divider, Text 
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { IconDeviceFloppy, IconArrowLeft } from '@tabler/icons-react';
import { api } from '../services/api';
import axios, { AxiosError } from 'axios';
import type { User } from '../types';

interface Department {
  id: string;
  name: string;
}

interface CreateDemandValues {
  title: string;
  description: string;
  departmentId: string;
  techTypeCode: string;
  asset_tag: string;
}

const TECH_OPTIONS = [
  { value: '01', label: '01 - HARDWARE / MANUTENÇÃO' },
  { value: '02', label: '02 - REDES / INTERNET' },
  { value: '03', label: '03 - SOFTWARE / SISTEMAS' },
];

export function CreateDemand() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const loggedUser = useMemo<User | null>(() => {
    const storageUser = localStorage.getItem('@SAGE:user');
    return storageUser ? JSON.parse(storageUser) : null;
  }, []);

  const isAdmin = useMemo(() => {
    const role = loggedUser?.role?.trim().toUpperCase();
    return role === 'ADMIN' || role === 'ADMIN_GERAL';
  }, [loggedUser]);

  const form = useForm<CreateDemandValues>({
    initialValues: {
      title: '',
      description: '',
      departmentId: !isAdmin && loggedUser?.departmentId ? loggedUser.departmentId : '',
      techTypeCode: '',
      asset_tag: '',
    },
    validate: {
      title: (val) => (val.length < 5 ? 'O título deve ter ao menos 5 caracteres' : null),
      description: (val) => (val.length < 10 ? 'Forneça uma descrição mais detalhada' : null),
      departmentId: (val) => (!val ? 'Selecione a secretaria de destino' : null),
      techTypeCode: (val) => (!val ? 'Selecione a especialidade técnica' : null),
    },
  });

  const { initialize: initializeForm } = form;

  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchDepartments() {
      try {
        const { data } = await api.get<Department[]>('/departments', {
          signal: controller.signal
        });
        
        if (!isAdmin && loggedUser?.departmentId) {
          const myDept = data.filter(d => d.id === loggedUser.departmentId);
          setDepartments(myDept);
          
          initializeForm({
            title: '',
            description: '',
            departmentId: loggedUser.departmentId,
            techTypeCode: '',
            asset_tag: '',
          });
        } else {
          setDepartments(data);
        }
      } catch (err) {
        if (axios.isCancel(err)) return;

        const error = err as AxiosError;
        if (error.response?.status === 401) {
          navigate('/login');
        }
        console.error('Falha ao carregar secretarias:', error);
      }
    }

    fetchDepartments();
    return () => controller.abort();
  }, [isAdmin, loggedUser, navigate, initializeForm]);

  const handleCreateDemand = async (values: CreateDemandValues) => {
    setLoading(true);
    try {
      if (!loggedUser?.id) {
        alert('Sessão expirada. Por favor, faça login novamente.');
        navigate('/login');
        return;
      }

      // Monta o payload exatamente com o que o back-end espera
      const payload: Record<string, any> = {
        title: values.title,
        description: values.description,
        techTypeCode: values.techTypeCode,
        departmentId: !isAdmin && loggedUser.departmentId ? loggedUser.departmentId : values.departmentId,
        senderId: loggedUser.id,
      };

      // Se o patrimônio foi preenchido, envia. Se for vazio, removemos para evitar string vazia invadindo validações estritas
      if (values.asset_tag && values.asset_tag.trim() !== '') {
        payload.asset_tag = values.asset_tag.trim();
      }

      await api.post('/demands', payload);

      navigate('/dashboard'); 
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const message = error.response?.data?.message || 'Erro inesperado ao criar demanda';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" pt={40} pb={40}>
      <Stack gap="xs" mb="xl">
        <Group gap="sm">
          <Button 
            variant="subtle" 
            color="gray" 
            leftSection={<IconArrowLeft size={16} />} 
            onClick={() => navigate(-1)}
            px={0}
          >
            Voltar
          </Button>
        </Group>
        <Title order={2} fw={900} c="green.9">
          NOVA DEMANDA
        </Title>
        <Text size="sm" c="dimmed" fw={500}>
          Gere um novo protocolo para acompanhamento técnico.
        </Text>
      </Stack>

      <Paper withBorder p="xl" radius="md" shadow="sm">
        <form onSubmit={form.onSubmit(handleCreateDemand)}>
          <Stack gap="lg">
            <TextInput
              label="Título da Solicitação"
              placeholder="Ex: Falha na conexão do switch principal"
              required
              {...form.getInputProps('title')}
            />

            <Group grow align="flex-start">
              <Select
                label="Secretaria Responsável"
                placeholder="Selecione o destino"
                searchable
                disabled={!isAdmin} 
                data={departments.map(d => ({ value: d.id, label: d.name.toUpperCase() }))}
                {...form.getInputProps('departmentId')}
              />

              <Select
                label="Tipo de Serviço (TEC)"
                placeholder="Especialidade"
                data={TECH_OPTIONS}
                {...form.getInputProps('techTypeCode')}
              />
            </Group>

            <TextInput
              label="Código de Patrimônio"
              placeholder="Opcional (Ex: PM-123456)"
              {...form.getInputProps('asset_tag')}
            />

            <Textarea
              label="Relatório da Ocorrência"
              placeholder="Descreva o problema detalhadamente..."
              minRows={5}
              required
              {...form.getInputProps('description')}
            />

            <Divider />

            <Group justify="flex-end" gap="md">
              <Button variant="subtle" color="gray" onClick={() => navigate(-1)} disabled={loading}>
                Descartar
              </Button>
              <Button 
                type="submit" 
                color="green.8" 
                loading={loading}
                leftSection={<IconDeviceFloppy size={20} />}
              >
                Gerar Protocolo
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}