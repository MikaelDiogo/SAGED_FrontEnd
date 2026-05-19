import { Paper, Text, Group, ThemeIcon, Box } from '@mantine/core';

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  icon: React.ElementType;
}

export function StatCard({ label, value, color, icon: Icon }: StatCardProps) {
  return (
    <Paper withBorder p="md" radius="md" bg="white">
      <Group justify="space-between">
        <Box>
          <Text size="xs" c="dimmed" fw={700} tt="uppercase">
            {label}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
        </Box>
        <ThemeIcon color={color} variant="light" size={48} radius="md">
          <Icon size={28} stroke={1.5} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}