import { Modal, Text, Button, Group, Stack, Box, Title } from '@mantine/core';
import { IconPlayerPlay, IconX } from '@tabler/icons-react';

interface WelcomeModalProps {
  opened: boolean;
  onStart: () => void;
  onSkip: () => void;
}

const TOUR_HIGHLIGHTS = [
  'Navegação e menus do sistema',
  'Painel de métricas e indicadores',
  'Quadro Kanban de demandas',
  'Como abrir e gerenciar chamados',
  'Controle de patrimônio dos equipamentos',
  'Relatórios e exportação em PDF',
];

export function WelcomeModal({ opened, onStart, onSkip }: WelcomeModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onSkip}
      withCloseButton={false}
      centered
      size="lg"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.65, blur: 4 }}
      styles={{
        content: { overflow: 'hidden', padding: 0 },
        body: { padding: 0 },
      }}
    >
      <Box
        bg="crateus-green.9"
        p="xl"
        style={{ textAlign: 'center' }}
      >
        <Title order={2} c="white" fw={900}>
          Bem-vindo ao SAGED
        </Title>
        <Text c="green.2" size="sm" mt={4} fw={500}>
          Sistema de Gerenciamento de Demandas - Seplati
        </Text>
      </Box>

      <Stack gap="md" p="xl">
        <Text size="sm" c="gray.7" ta="center" lh={1.75}>
          O SAGED centraliza, acompanha e resolve chamados técnicos de TI de toda
          a rede municipal de forma eficiente e rastreável.
        </Text>

        <Box
          bg="green.0"
          p="md"
          style={{ borderRadius: 8, borderLeft: '4px solid var(--mantine-color-green-6)' }}
        >
          <Text size="xs" fw={800} c="green.9" mb={6} tt="uppercase">
            O tour irá mostrar:
          </Text>
          <Stack gap={4}>
            {TOUR_HIGHLIGHTS.map(item => (
              <Text key={item} size="xs" c="gray.7">
                ✓ {item}
              </Text>
            ))}
          </Stack>
        </Box>

        <Group grow gap="sm" mt="xs">
          <Button
            leftSection={<IconPlayerPlay size={15} />}
            color="crateus-green.9"
            size="md"
            radius="md"
            onClick={onStart}
          >
            Iniciar Tour
          </Button>
          <Button
            leftSection={<IconX size={13} />}
            variant="default"
            size="md"
            radius="md"
            onClick={onSkip}
          >
            Pular
          </Button>
        </Group>

        <Text size="10px" c="dimmed" ta="center">
          Você pode reiniciar o tour a qualquer momento pelo botão "Tour" na barra de navegação.
        </Text>
      </Stack>
    </Modal>
  );
}
