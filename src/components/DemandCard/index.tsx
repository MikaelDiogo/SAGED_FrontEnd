import { Paper, Stack, Group, Text, Badge, Divider, Box, Avatar } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';

interface DemandCardProps {
  id: string;
  protocol: string;
  title: string;
  description: string;
  priority: string;
  techInitials?: string;
  technicianName?: string;
  departmentName?: string;
  viewed?: boolean;
  isAdminView?: boolean;
  onClick: () => void;
}

export function DemandCard({
  protocol,
  title,
  description,
  priority,
  techInitials,
  technicianName,
  departmentName,
  onClick,
}: DemandCardProps) {
  const priorityColors: Record<string, string> = {
    Baixa: 'blue',
    Media: 'yellow',
    Alta: 'orange',
    Critica: 'red',
  };

  return (
    <Paper
      withBorder
      p="sm"
      radius="sm"
      shadow="xs"
      mb="xs"
      bg="white"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Text fw={700} size="sm" lineClamp={2} style={{ flex: 1 }}>
            {title}
          </Text>
          <Badge color={priorityColors[priority] ?? 'gray'} size="xs">
            {priority}
          </Badge>
        </Group>

        {departmentName && (
          <Text size="10px" fw={700} c="blue.6" tt="uppercase">
            {departmentName}
          </Text>
        )}

        <Text size="xs" c="dimmed" lineClamp={2}>
          {description}
        </Text>
      </Stack>

      <Box mt="xs">
        <Divider variant="dashed" mb="xs" />
        <Group justify="space-between">
          <Group gap={6}>
            <Text size="10px" fw={800}>
              #{protocol}
            </Text>
            {technicianName ? (
              <Group gap={4}>
                <Avatar size="xs" radius="xl" color="green" variant="light">
                  {techInitials ?? technicianName.substring(0, 2).toUpperCase()}
                </Avatar>
                <Text
                  size="10px"
                  fw={600}
                  c="gray.7"
                  style={{ maxWidth: '100px' }}
                  lineClamp={1}
                >
                  {technicianName}
                </Text>
              </Group>
            ) : (
              <Badge color="gray.7" size="xs" variant="filled" style={{ fontSize: '9px' }}>
                SEM TECNICO
              </Badge>
            )}
          </Group>
          <IconChevronRight size={14} color="gray" />
        </Group>
      </Box>
    </Paper>
  );
}
