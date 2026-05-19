import { Paper, Stack, Group, Text, Badge, Divider, Box, Avatar } from '@mantine/core';
import { IconChevronRight, IconEyeOff } from '@tabler/icons-react';

interface DemandCardProps {
  id: string;
  protocol: string;
  title: string;
  description: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  techInitials?: string;
  technicianName?: string; // Adicionado para exibir o nome no Card
  departmentName?: string;
  viewed?: boolean;        // Adicionado para o controle de leitura do Admin
  isAdminView?: boolean;   // Flag para saber se quem está olhando é Admin
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
  viewed,
  isAdminView = false,
  onClick 
}: DemandCardProps) {
  const priorityColors = { 'Baixa': 'blue', 'Média': 'yellow', 'Alta': 'orange', 'Crítica': 'red' };

  return (
    <Paper 
      withBorder 
      p="sm" 
      radius="sm" 
      shadow="xs" 
      mb="xs" 
      bg="white" 
      onClick={onClick} 
      style={{ 
        cursor: 'pointer',
        // Se for visão do Admin e não foi lido, ganha uma borda esquerda de destaque
        borderLeft: isAdminView && !viewed ? '4px solid #fab005' : undefined 
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Text fw={700} size="sm" lineClamp={2} style={{ flex: 1 }}>{title}</Text>
          <Group gap={4}>
            {/* Alerta visual de Não Lido exclusivo para o Admin Geral */}
            {isAdminView && !viewed && (
              <Badge color="yellow" size="xs" variant="light" leftSection={<IconEyeOff size={10} />}>
                Não Lido
              </Badge>
            )}
            <Badge color={priorityColors[priority] || 'gray'} size="xs">{priority}</Badge>
          </Group>
        </Group>

        {departmentName && (
          <Text size="10px" fw={700} c="blue.6" tt="uppercase">{departmentName}</Text>
        )}
        
        <Text size="xs" c="dimmed" lineClamp={2}>{description}</Text>
      </Stack>

      <Box mt="xs">
        <Divider variant="dashed" mb="xs" />
        <Group justify="space-between">
          <Group gap={6}>
            <Text size="10px" fw={800}>#{protocol}</Text>
            {technicianName ? (
              <Group gap={4}>
                <Avatar size="xs" radius="xl" color="green" variant="light">
                  {techInitials || technicianName.substring(0, 2).toUpperCase()}
                </Avatar>
                <Text size="10px" fw={600} c="gray.7" style={{ maxWidth: '100px' }} lineClamp={1}>
                  {technicianName}
                </Text>
              </Group>
            ) : (
              <Badge color="gray.7" size="xs" variant="filled" style={{ fontSize: '9px' }}>
                SEM TÉCNICO
              </Badge>
            )}
          </Group>
          <IconChevronRight size={14} color="gray" />
        </Group>
      </Box>
    </Paper>
  );
}