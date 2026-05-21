import { 
  Container, Paper, Title, TextInput, PasswordInput, 
  Select, Button, Group, Stack, Text, Table, 
  Badge, Center, Loader, Box
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { IconUserPlus, IconArrowLeft, IconShieldLock } from '@tabler/icons-react';
import { api } from '../services/api';
import { AxiosError } from 'axios';
import type { User } from '../types';

// Ajustado para mapear a estrutura onde o Técnico é um Usuário com propriedades específicas
interface TechnicianUser {
  id: string; // ID do Usuário
  name: string;
  email: string;
  role: string; // Será 'TECNICO'
  tech_type_code: string;
  departmentId: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const TECH_SPECIALTIES = [
  { value: '01', label: '01 - HARDWARE / MANUTENÇÃO' },
  { value: '02', label: '02 - REDES / INTERNET' },
  { value: '03', label: '03 - SOFTWARE / SISTEMAS' },
];

export function CreateTechnician() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [technicians, setTechnicians] = useState<TechnicianUser[]>([]);
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [myDepartmentName, setMyDepartmentName] = useState('');

  const loggedUser = useMemo<User | null>(() => {
    const storageUser = localStorage.getItem('@SAGE:user');
    return storageUser ? JSON.parse(storageUser) : null;
  }, []);

  const roleUpper = useMemo(() => loggedUser?.role?.trim().toUpperCase(), [loggedUser]);
  const isGeneralAdmin = roleUpper === 'ADMIN_GERAL';
  const hasAdminAccess = roleUpper === 'ADMIN' || roleUpper === 'ADMIN_GERAL' || roleUpper === 'ADMIN_SETOR';

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      tech_type_code: '',
      departmentId: '',
    },
    validate: {
      name: (val) => (val.length < 3 ? 'O nome deve ter ao menos 3 caracteres' : null),
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'E-mail inválido'),
      password: (val) => (val.length < 6 ? 'A senha deve ter ao menos 6 caracteres' : null),
      tech_type_code: (val) => (!val ? 'Selecione a especialidade do técnico' : null),
      departmentId: (val) => {
        if (isGeneralAdmin && !val) return 'Selecione a secretaria do técnico';
        return null;
      },
    },
  });

  useEffect(() => {
    if (!hasAdminAccess) {
      alert('Acesso restrito a perfis administrativos.');
      navigate('/dashboard');
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        setFetching(true);

        // 1. Busca as secretarias do sistema
        const resDepts = await api.get<Department[]>('/departments');
        
        if (isMounted && Array.isArray(resDepts.data)) {
          setDepartments(
            resDepts.data.map(dept => ({ 
              value: dept.id, 
              label: `${dept.code} - ${dept.name}`.toUpperCase() 
            }))
          );

          if (!isGeneralAdmin && loggedUser?.departmentId) {
            const currentDept = resDepts.data.find(d => d.id === loggedUser.departmentId);
            if (currentDept) {
              setMyDepartmentName(`${currentDept.code} - ${currentDept.name}`.toUpperCase());
            }
          }
        }

        // 2. Busca os usuários filtrando pela Role ou rota correspondente do SAGED
        try {
          // Se sua API listar todos em /users, podemos filtrar no frontend ou usar query params se o backend aceitar (ex: /users?role=TECNICO)
          const resUsers = await api.get<TechnicianUser[]>('/users');
          
          if (isMounted && Array.isArray(resUsers.data)) {
            // Filtra para exibir na tabela apenas quem possui o papel de técnico
            const techsOnly = resUsers.data.filter(user => user.role?.trim().toUpperCase() === 'TECNICO');
            setTechnicians(techsOnly);
          }
        } catch {
          console.warn('Erro ao listar usuários técnicos. Verifique o endpoint de usuários.');
          if (isMounted) setTechnicians([]);
        }

      } catch (err) {
        console.error('Erro crítico ao carregar dados:', err);
        alert('Erro ao carregar secretarias. Certifique-se de que a API está rodando localmente.');
      } finally {
        if (isMounted) setFetching(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [hasAdminAccess, isGeneralAdmin, loggedUser?.departmentId, navigate]);

  const handleRegister = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const targetedDepartment = isGeneralAdmin ? values.departmentId : loggedUser?.departmentId;

      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'TECNICO',
        tech_type_code: values.tech_type_code,
        is_sector_leader: false,
        departmentId: targetedDepartment
      };

      await api.post('/users', payload);
      
      alert('Técnico cadastrado com sucesso!');
      form.reset();
      
      // Atualiza a tabela após o cadastro bem-sucedido
      try {
        const { data } = await api.get<TechnicianUser[]>('/users');
        if (Array.isArray(data)) {
          setTechnicians(data.filter(user => user.role?.trim().toUpperCase() === 'TECNICO'));
        }
      } catch {
        setTechnicians([]);
      }
    } catch (err) {
      const error = err as AxiosError<{ error?: string; message?: string }>;
      alert(error.response?.data?.message || error.response?.data?.error || 'Falha ao cadastrar técnico');
    } finally {
      setLoading(false);
    }
  };

  const getSpecialtyLabel = (code: string) => {
    return TECH_SPECIALTIES.find(spec => spec.value === code)?.label || 'NÃO DEFINIDA';
  };

  return (
    <Container size="lg" pt={40} pb={40}>
      <Stack gap="xs" mb="xl">
        <Group gap="sm">
          <Button 
            variant="subtle" 
            color="gray" 
            leftSection={<IconArrowLeft size={16} />} 
            onClick={() => navigate('/dashboard')}
            px={0}
          >
            Voltar para o Dashboard
          </Button>
        </Group>
        <Title order={2} fw={900} c="green.9" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconShieldLock size={28} /> GESTÃO E CADASTRO DE TÉCNICOS
        </Title>
        <Text size="sm" c="dimmed" fw={500}>
          Área de gerenciamento de equipe exclusiva para perfis administrativos (SAGE RBAC).
        </Text>
      </Stack>

      <Box style={{ display: 'flex', gap: '24px', flexDirection: 'row', alignItems: 'flex-start' }}>
        <Paper withBorder p="xl" radius="md" shadow="sm" style={{ width: '400px', flexShrink: 0 }}>
          <Title order={4} mb="md" c="gray.8" fw={800}>Novo Técnico</Title>
          <form onSubmit={form.onSubmit(handleRegister)}>
            <Stack gap="md">
              <TextInput
                label="Nome Completo"
                placeholder="Ex: Maria Souza"
                required
                {...form.getInputProps('name')}
              />

              <TextInput
                label="E-mail Institucional"
                placeholder="tecnico@prefeitura.gov"
                required
                {...form.getInputProps('email')}
              />

              <PasswordInput
                label="Senha de Acesso"
                placeholder="Mínimo 6 caracteres"
                required
                {...form.getInputProps('password')}
              />

              <Select
                label="Especialidade TEC (Protocolo)"
                placeholder="Selecione a especialidade"
                data={TECH_SPECIALTIES}
                required
                {...form.getInputProps('tech_type_code')}
              />

              {isGeneralAdmin ? (
                <Select
                  label="Secretaria / Departamento"
                  placeholder="Selecione o destino do técnico"
                  data={departments}
                  required
                  searchable
                  clearable
                  {...form.getInputProps('departmentId')}
                />
              ) : (
                <TextInput
                  label="Secretaria / Departamento"
                  value={myDepartmentName || 'Carregando secretaria...'}
                  disabled
                  readOnly
                  description="Técnicos criados por você farão parte da sua secretaria automaticamente."
                />
              )}

              <Button 
                type="submit" 
                color="green.8" 
                fullWidth 
                mt="sm"
                loading={loading}
                leftSection={<IconUserPlus size={18} />}
              >
                Cadastrar Membro
              </Button>
            </Stack>
          </form>
        </Paper>

        <Paper withBorder p="xl" radius="md" shadow="sm" style={{ flex: 1, minHeight: '380px' }}>
          <Title order={4} mb="md" c="gray.8" fw={800}>Equipe Técnica Cadastrada</Title>
          
          {fetching ? (
            <Center style={{ height: '200px' }}><Loader color="green.8" type="dots" /></Center>
          ) : (
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th><Text fw={800} size="xs">NOME</Text></Table.Th>
                  <Table.Th><Text fw={800} size="xs">E-MAIL</Text></Table.Th>
                  <Table.Th><Text fw={800} size="xs">ESPECIALIDADE</Text></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {technicians.map((tech) => (
                  <Table.Tr key={tech.id}>
                    <Table.Td style={{ fontWeight: 600, color: '#2b2b2b' }}>{tech.name.toUpperCase()}</Table.Td>
                    <Table.Td><Text c="dimmed" size="sm">{tech.email}</Text></Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="green.8" size="sm" radius="sm">
                        {getSpecialtyLabel(tech.tech_type_code)}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {technicians.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={3} style={{ textAlign: 'center' }}>
                      <Text c="dimmed" py="xl" size="sm">Nenhum técnico listado ou cadastrado.</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

//