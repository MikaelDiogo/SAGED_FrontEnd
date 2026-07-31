import { Text, Group, Badge, Paper, Box } from '@mantine/core';

interface TechActivityProps {
  techName: string;
  demand: string;
  status: string;
  reason?: string;
  time: string;
}

export function TechActivity({ techName, demand, status, reason, time }: TechActivityProps) {
  return (
    <Paper withBorder p="sm" radius="md" mb="xs">
      <Group justify="space-between" mb="xs">
        <Box>
          <Text size="sm" fw={500}>{techName}</Text>
          <Text size="xs" c="dimmed">{demand}</Text>
        </Box>
        <Badge color={status === 'INTERRUPTED' ? 'red' : 'blue'} variant="light">
          {status}
        </Badge>
      </Group>
      
      {reason && (
        <Box bg="gray.0" p="xs" style={{ borderRadius: '4px' }}>
          <Text size="xs" fw={700} c="red">JUSTIFICATIVA:</Text>
          {/* fst="italic" substitui o italic */}
          <Text size="xs">{reason}</Text>
        </Box>
      )}
      {/* ta="right" substitui o textAlign */}
      <Text size="xs" c="dimmed" mt="xs" ta="right">{time}</Text>
    </Paper>
  );
}