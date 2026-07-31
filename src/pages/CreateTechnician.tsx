import { Box, Container, Stack, Title, Text, Grid, Paper, Button } from '@mantine/core';
import { TourPageGate } from '../components/Tour';

export function CreateTechnician() {
  return (
    <Box bg="gray.0" style={{ minHeight: '100vh' }}>
      <TourPageGate phaseId="manage-technicians" />
      <Container size="xl" pt={100} pb="xl">
        <Stack gap="xs" mb={40}>
          <Title order={2} c="crateus-green.9" tt="uppercase" fw={900} lts="1px">
            Gerenciar Profissionais
          </Title>
          <Text size="sm" c="dimmed" fw={500}>
            Gerenciamento de tecnicos e gestores de unidade no sistema SAGED.
          </Text>
        </Stack>

        <Grid align="flex-start">
          <Grid.Col span={12} data-tour="manage-form">
            <Paper withBorder p="xl" radius="lg" shadow="sm" bg="blue.0" style={{ borderLeft: '4px solid var(--mantine-color-blue-5)' }}>
              <Stack gap="md">
                <Title order={3} c="blue.9" fw={900}>Gerenciamento de Usuarios via Keycloak</Title>
                <Text size="sm" c="gray.7">
                  Funcionalidade de gerenciamento de usuarios disponivel no Keycloak Admin.
                  O cadastro, edicao de papeis, especialidades e desativacao de contas deve ser
                  realizado diretamente pelo painel administrativo do Keycloak.
                </Text>
                <Text size="xs" c="dimmed">
                  Os vinculos de especialidade e departamento sao gerenciados via claims JWT configurados no Keycloak.
                </Text>
                <Button
                  component="a"
                  href="http://localhost:8080/auth/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="blue"
                  variant="outline"
                >
                  Abrir Keycloak Admin
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
