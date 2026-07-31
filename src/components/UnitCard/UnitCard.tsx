import { UnstyledButton, Text, Paper, Group, ThemeIcon, Box } from '@mantine/core';
import { IconBuildingCommunity, IconChevronRight } from '@tabler/icons-react';

interface UnitCardProps {
  name: string;
  manager: string;
  code?: string;
  onClick: () => void;
}

export function UnitCard({ name, manager, code, onClick }: UnitCardProps) {
  return (
    <UnstyledButton onClick={onClick} style={{ width: '100%', height: '100%' }}>
      <Paper
        withBorder
        p="md"
        radius="md"
        style={(theme) => ({
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'transform 200ms ease, box-shadow 200ms ease',
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: theme.shadows.md,
            borderColor: theme.colors.green?.[8] || '#2b8a3e',
          },
        })}
      >
        {/* Código no canto superior direito */}
        <Box
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            backgroundColor: 'var(--mantine-color-gray-1)',
            borderRadius: 4,
            padding: '1px 6px',
          }}
        >
          <Text size="10px" fw={700} c="gray.6" style={{ fontFamily: 'monospace' }}>
            {code}
          </Text>
        </Box>

        {/* Ícone + Nome + Liderança */}
        <Group align="flex-start" wrap="nowrap" style={{ paddingRight: 48 }}>
          <ThemeIcon size={44} radius="md" color="green.8" style={{ flexShrink: 0 }}>
            <IconBuildingCommunity size={24} />
          </ThemeIcon>
          <div style={{ overflow: 'hidden' }}>
            <Text fw={700} size="sm" style={{ lineHeight: 1.3 }} lineClamp={2}>
              {name}
            </Text>
            <Text size="xs" c="dimmed" mt={4} truncate>
              {manager}
            </Text>
          </div>
        </Group>

        <Group justify="flex-end" mt="sm">
          <IconChevronRight size={18} stroke={2} color="gray" />
        </Group>
      </Paper>
    </UnstyledButton>
  );
}
