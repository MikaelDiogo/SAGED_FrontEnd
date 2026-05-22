import { useState, useEffect, useMemo } from 'react';
import { Container, Title, Paper, TextInput, Select, Button, Stack, Grid, Table, Text, Badge, Center, Loader, Box } from '@mantine/core';
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

interface TechnicianUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tech_type_code: string;
  departmentId?: string;
  department?: Department;
}

export function CreateTechnician() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('TECNICO');
  const [isSectorLeader, setIsSectorLeader] = useState(false);
  const [specialtyCode, setSpecialtyCode] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [technicians, setTechnicians] = useState<TechnicianUser[]>([]);

  const roleLabels = useMemo<Record<string, string>>(() => ({
    ADMIN_GERAL: 'Administrador Geral',
    ADMIN: 'Administrador Geral',
    ADMIN_SETOR: 'Líder de Unidade',
    TECNICO_LIDER: 'Técnico Líder',
    TECNICO: 'Técnico Operacional',
  }), []);

  const fetchTechnicians = async () => {
    try {
      const response = await api.get<TechnicianUser[]>('/users');
      const staff = response.data.filter(u => 
        ['TECNICO', 'TECNICO_LIDER', 'ADMIN_SETOR'].includes(u.role?.trim().toUpperCase())
      );
      setTechnicians(staff);
    } catch (error) {
      console.error("Erro ao buscar lista de técnicos:", error);
    }
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [specialtiesResponse, departmentsResponse] = await Promise.all([
          api.get<Specialty[]>('/specialties'),
          api.get<Department[]>('/departments')
        ]);
        setSpecialties(specialtiesResponse.data);
        setDepartments(departmentsResponse.data);
        await fetchTechnicians();
      } catch (error) {
        notifications.show({
          title: 'Erro ao carregar dados',
          message: 'Não foi possível carregar as secretarias ou especialidades técnicas.',
          color: 'red',
        });
      } finally {
        setLoadingData(false);
      }
    }
    loadInitialData();
  }, []);

  const handleCreateTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialtyCode) {
      notifications.show({ message: 'Selecione uma especialidade', color: 'orange' });
      return;
    }
    if (!departmentId) {
      notifications.show({ message: 'Selecione uma secretaria de alocação', color: 'orange' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/users', {
        name,
        email,
        password,
        role,
        is_sector_leader: role === 'TECNICO' ? isSectorLeader : false,
        tech_type_code: specialtyCode, 
        departmentId: departmentId,
      });

      notifications.show({
        title: 'Usuário Criado',
        message: `${name} foi registrado no sistema com sucesso.`,
        color: 'green',
      });

      setName('');
      setEmail('');
      setPassword('');
      setSpecialtyCode(null);
      setDepartmentId(null);
      await fetchTechnicians();
    } catch (error) {
      notifications.show({
        title: 'Erro no cadastro',
        message: 'Verifique se o e-mail já existe ou os privilégios do seu usuário.',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh' }}>
      <Container size="xl" pt={100} pb="xl">
        <Stack gap="xs" mb={40}>
          <Title order={2} c="crateus-green.9" tt="uppercase" fw={900} lts="1px">
            Gerenciamento de Equipe Técnica
          </Title>
          <Text size="sm" c="dimmed" fw={500}>
            Cadastre novos profissionais e gerencie a listagem operacional do sistema SAGE
          </Text>
        </Stack>

        <Grid>
          {/* Coluna Esquerda: Formulário */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder p="xl" radius="sm" shadow="sm" bg="white">
              <Title order={4} mb="lg" c="green.9" fw={800}>
                Novo Cadastro
              </Title>

              <form onSubmit={handleCreateTechnician}>
                <Stack gap="md">
                  <TextInput label="Nome Completo" placeholder="Ex: João Silva" required value={name} onChange={(e) => setName(e.currentTarget.value)} />
                  <TextInput label="E-mail Institucional" placeholder="tecnico@crateus.br" type="email" required value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
                  <TextInput label="Senha Inicial" placeholder="Mínimo 6 caracteres" type="password" required value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
                  
                  <Select
                    label="Papel / Role"
                    data={[
                      { value: 'TECNICO', label: 'Técnico Operacional' },
                      { value: 'TECNICO_LIDER', label: 'Técnico Líder' },
                      { value: 'ADMIN_SETOR', label: 'Líder de Unidade (Gestor)' },
                    ]}
                    value={role}
                    onChange={(val) => setRole(val || 'TECNICO')}
                    required
                  />

                  {role === 'TECNICO' && (
                    <Select
                      label="Promover a Líder de Setor?"
                      data={[{ value: 'false', label: 'Não' }, { value: 'true', label: 'Sim' }]}
                      value={isSectorLeader.toString()}
                      onChange={(val) => setIsSectorLeader(val === 'true')}
                    />
                  )}

                  <Select
                    label="Secretaria de Lotação"
                    placeholder="Selecione o setor"
                    data={departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` }))}
                    required
                    value={departmentId}
                    onChange={setDepartmentId}
                    searchable
                  />

                  <Select
                    label="Especialidade Principal"
                    placeholder="Selecione a área"
                    data={specialties.map((spec) => ({ value: spec.code, label: spec.name }))}
                    required
                    value={specialtyCode}
                    onChange={setSpecialtyCode}
                  />

                  <Button type="submit" color="green.8" loading={submitting} mt="md" fullWidth fw={700}>
                    Registrar na Equipe
                  </Button>
                </Stack>
              </form>
            </Paper>
          </Grid.Col>

          {/* Coluna Direita: Tabela */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper withBorder p="xl" radius="sm" shadow="sm" bg="white">
              <Title order={4} mb="lg" c="green.9" fw={800}>
                Profissionais Ativos
              </Title>
              
              {loadingData ? (
                <Center h={200}><Loader color="green.8" /></Center>
              ) : (
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Profissional</Table.Th>
                      <Table.Th>Secretaria</Table.Th>
                      <Table.Th>Especialidade</Table.Th>
                      <Table.Th>Nível</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {technicians.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={4}>
                          <Text c="dimmed" ta="center" size="sm" py="xl">Nenhum técnico cadastrado para esta visualização.</Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      technicians.map((tech) => (
                        <Table.Tr key={tech.id}>
                          <Table.Td>
                            <Stack gap={0}>
                              <Text size="sm" fw={700}>{tech.name}</Text>
                              <Text size="xs" c="dimmed">{tech.email}</Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td><Text size="xs" fw={600}>{departments.find(d => d.id === tech.departmentId)?.name || 'Não Vinculado'}</Text></Table.Td>
                          <Table.Td>
                            <Badge color="blue" variant="light" size="xs" radius="xs">
                              {specialties.find(s => s.code === tech.tech_type_code)?.name || 'Geral'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge color="green.8" variant="outline" size="xs">
                              {roleLabels[tech.role] || tech.role}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}