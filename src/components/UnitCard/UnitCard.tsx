import { UnstyledButton, Text, Paper, Group, ThemeIcon, Box} from '@mantine/core';
import { IconBuildingCommunity, IconChevronRight } from '@tabler/icons-react';

interface UnitCardProps {
  name: string;
  manager: string;
  openDemands: number;
  onClick: () => void;
}

export function UnitCard({ name, manager, openDemands, onClick }: UnitCardProps) {
  return (
    <UnstyledButton onClick={onClick} style={{ width: '100%' }}>
      <Paper withBorder p="md" radius="md" style={(theme) => ({
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxCheck: theme.shadows.md,
          borderColor: theme.colors['crateus-green'][9]
        }
      })}>
        <Group justify="space-between">
          <Group>
            <ThemeIcon size={50} radius="md" color="crateus-green.9">
              <IconBuildingCommunity size={30} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="lg">{name}</Text>
              <Text size="xs" c="dimmed">Responsável: {manager}</Text>
            </div>
          </Group>
          <Group>
            <Box ta="right" visibleFrom="xs">
              <Text fw={700} c="orange.8">{openDemands}</Text>
              <Text size="xs" c="dimmed">Pendentes</Text>
            </Box>
            <IconChevronRight size={20} stroke={1.5} color="gray" />
          </Group>
        </Group>
      </Paper>
    </UnstyledButton>
  );
}