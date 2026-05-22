import { UnstyledButton, Text, Paper, Group, ThemeIcon, Box } from '@mantine/core';
import { IconBuildingCommunity, IconChevronRight } from '@tabler/icons-react';

interface UnitCardProps {
  name: string;
  manager: string;
  openDemands: number;
  onClick: () => void;
}

export function UnitCard({ name, manager, openDemands, onClick }: UnitCardProps) {
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
          backgroundColor: '#white',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: theme.shadows.md,
            borderColor: theme.colors.green?.[8] || '#2b8a3e'
          }
        })}
      >
        {/* Parte Superior: Ícone + Textos do Departamento */}
        <Group align="flex-start" wrap="nowrap" style={{ width: '100%', paddingRight: '50px' }}>
          <ThemeIcon size={44} radius="md" color="green.8" style={{ flexShrink: 0 }}>
            <IconBuildingCommunity size={24} />
          </ThemeIcon>
          
          <div style={{ overflow: 'hidden' }}>
            <Text fw={700} size="sm" style={{ lineHeight: 1.3 }} lineClamp={2}>
              {name}
            </Text>
            <Text size="xs" c="dimmed" mt={4} truncate>
              Responsável: {manager}
            </Text>
          </div>
        </Group>

        {/* Parte Inferior: Contador de Demandas e Seta de Ação */}
        <Group justify="space-between" align="center" mt="sm" style={{ width: '100%' }}>
          <Group gap="xs">
            <Box 
              px={10} 
              py={2} 
              style={{ 
                borderRadius: '4px', 
                backgroundColor: openDemands > 0 ? '#fff9db' : '#f1f3f5' 
              }}
            >
              <Text fw={800} size="xs" c={openDemands > 0 ? 'orange.9' : 'gray.6'} component="span">
                {openDemands}
              </Text>
              <Text size="xs" c="dimmed" component="span" ml={4} fw={500}>
                {openDemands === 1 ? 'pendente' : 'pendentes'}
              </Text>
            </Box>
          </Group>
          
          <IconChevronRight size={18} stroke={2} color="gray" />
        </Group>
      </Paper>
    </UnstyledButton>
  );
}