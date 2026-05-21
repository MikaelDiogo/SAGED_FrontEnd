import { 
  Title, Text, Group, Paper, Badge, Box, 
  ScrollArea, Select, UnstyledButton, Stack, Button
} from '@mantine/core'; 
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { api } from '../services/api';
import { DemandCard } from '../components/DemandCard';
import { DemandModal } from '../components/DemandModal';
import { AxiosError } from 'axios';
import type { User as BaseUser } from '../types';

export type StatusType = 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'INTERROMPIDO' | 'CANCELADO';

interface ExtendedUser extends BaseUser {
  role: 'ADMIN_GERAL' | 'ADMIN_SETOR' | 'TECNICO_LIDER' | 'TECNICO';
  tech_type_code?: string;
  is_sector_leader?: boolean;
  departmentId?: string;
}

export interface Demand {
  id: string;
  protocol: string;
  title: string;
  description: string;
  status: StatusType;
  priority?: 'Baixa' | 'Média' | 'Alta' | 'Crítica'; // Tipagem ajustada para o padrão aceito pelo Card
  viewed: boolean;
  asset_tag: string | null;
  deptCode: string;
  techTypeCode: string; 
  senderId: string;
  current_technician_id: string | null;
  departmentId: string;
  created_at: string;
  updated_at: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  sender?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  technician?: {
    id: string;
    name: string;
  } | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const COLUMNS = [
  { id: 'A_FAZER', label: 'A Fazer', color: 'gray' },
  { id: 'EM_ANDAMENTO', label: 'Em Andamento', color: 'blue' },
  { id: 'CONCLUIDO', label: 'Concluído', color: 'green' },
  { id: 'INTERROMPIDO', label: 'Interrompido', color: 'red' },
];

const QUEUE_MAP: Record<string, string> = {
  'hardware': '01',
  'redes': '02',
  'sistemas': '03'
};

export function Demands() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [allDemands, setAllDemands] = useState<Demand[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  
  const [currentUnitName, setCurrentUnitName] = useState('CARREGANDO PAINEL...');

  const loggedUser = useMemo<ExtendedUser | null>(() => {
    const storageUser = localStorage.getItem('@SAGE:user');
    return storageUser ? JSON.parse(storageUser) as ExtendedUser : null;
  }, []);

  const roleUpper = useMemo(() => loggedUser?.role?.trim().toUpperCase(), [loggedUser]);
  
  const isAdminGeral = useMemo(() => roleUpper === 'ADMIN_GERAL', [roleUpper]);
  
  const isLiderSetor = useMemo(() => {
    return roleUpper === 'ADMIN_SETOR' || 
           roleUpper === 'TECNICO_LIDER' || 
           (roleUpper === 'TECNICO' && loggedUser?.is_sector_leader === true);
  }, [roleUpper, loggedUser]);

  const unitId = searchParams.get('unit') || (isAdminGeral ? 'geral' : loggedUser?.departmentId || '');
  const queueId = searchParams.get('queue');

  const fetchDemands = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Demand[]>('/demands');
      setAllDemands(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.status === 401) navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      await fetchDemands();
      try {
        const res = await api.get<Department[]>('/departments');
        if (!isMounted) return;

        const fetchedDepts = res.data || [];
        setDepartments(fetchedDepts);

        const urlName = searchParams.get('name');
        if (urlName) {
          setCurrentUnitName(decodeURIComponent(urlName).toUpperCase());
        } else if (unitId === 'geral') {
          setCurrentUnitName('ADMINISTRAÇÃO CENTRAL');
        } else {
          const targetId = !isAdminGeral && loggedUser?.departmentId ? loggedUser.departmentId : unitId;
          const found = fetchedDepts.find(d => d.id === targetId);
          if (found) {
            setCurrentUnitName(found.name.toUpperCase());
            
            setSearchParams(prev => {
              prev.set('name', found.name.toUpperCase());
              prev.set('unit', targetId);
              return prev;
            }, { replace: true });
          } else {
            setCurrentUnitName('VISÃO INTERNA OPERACIONAL');
          }
        }

      } catch (err) {
        console.error("Erro ao buscar secretarias:", err);
        if (isMounted) setCurrentUnitName('ERRO OPERACIONAL');
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [fetchDemands, isAdminGeral, loggedUser, unitId, searchParams, setSearchParams]);

  const filteredDemands = useMemo(() => {
    let result = allDemands;

    if (isAdminGeral) {
      if (unitId !== 'geral') {
        result = result.filter(demand => demand.departmentId === unitId);
      }
    }

    if (queueId && QUEUE_MAP[queueId]) {
      const targetTypeCode = QUEUE_MAP[queueId];
      result = result.filter(demand => String(demand.techTypeCode).trim() === String(targetTypeCode).trim());
    }

    return result;
  }, [allDemands, unitId, queueId, isAdminGeral]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId)) return;

    const newStatus = destination.droppableId as StatusType;
    
    const updatedDemands = allDemands.map(d => d.id === draggableId ? { ...d, status: newStatus } : d);
    setAllDemands(updatedDemands);

    try {
      await api.patch(`/demands/${draggableId}/status`, {
        status: newStatus,
        description: "Movimentação de cartão realizada via Quadro Kanban SAGE"
      });
    } catch (err) {
      console.error("Erro ao atualizar status via Drag&Drop:", err);
      fetchDemands(); 
    }
  };

  const departmentOptions = useMemo(() => {
    if (!isAdminGeral && loggedUser?.departmentId) {
      const myDept = departments.find(d => d.id === loggedUser.departmentId);
      return myDept 
        ? [{ value: myDept.id, label: myDept.name.toUpperCase() }] 
        : [{ value: loggedUser.departmentId, label: 'SUA UNIDADE VINCULADA' }];
    }

    const options = [{ value: 'geral', label: 'VISÃO GERAL MUNICIPAL' }];
    departments.forEach(d => options.push({ value: d.id, label: d.name.toUpperCase() }));
    return options;
  }, [departments, isAdminGeral, loggedUser]);

  const getTechInitials = (demand: Demand) => {
    if (demand.technician?.name) {
      return demand.technician.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return demand.current_technician_id ? "TEC" : "";
  };

  return (
    <Box h="100vh" pt={70} bg="#f1f3f5" style={{ display: 'flex', flexDirection: 'column' }}>
      <Box px="xs" flex={1} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        
        <Paper withBorder p="xs" radius="sm" mb="xs" shadow="xs">
          <Group justify="space-between">
            <Group gap="sm">
              <UnstyledButton onClick={() => navigate('/dashboard')}>
                <IconArrowLeft size={20} />
              </UnstyledButton>
              <Stack gap={0}>
                <Title order={5} c="green.9" fw={900}>
                  {currentUnitName}
                </Title>
                <Text size="10px" fw={700} c="dimmed">SAGED - MONITORAMENTO EM TEMPO REAL</Text>
              </Stack>
            </Group>
            
            <Group gap="xs">
              <Select 
                size="xs" 
                value={unitId} 
                disabled={!isAdminGeral} 
                onChange={(val) => {
                  if (!val) return;
                  const dept = departmentOptions.find(o => o.value === val);
                  const label = dept?.label || 'VISÃO GERAL MUNICIPAL';
                  
                  setCurrentUnitName(label);
                  const currentQueue = queueId ? `&queue=${queueId}` : '';
                  navigate(`?unit=${val}&name=${encodeURIComponent(label)}${currentQueue}`);
                }}
                data={departmentOptions} 
                style={{ width: 250 }} 
              />
              
              {(isAdminGeral || isLiderSetor) && (
                <Button size="xs" color="green.8" leftSection={<IconPlus size={14}/>} onClick={() => navigate('/novo-chamado')}>
                  Nova Demanda
                </Button>
              )}
            </Group>
          </Group>
        </Paper>

        <DragDropContext onDragEnd={onDragEnd}>
          <Box style={{ display: 'flex', flex: 1, gap: '8px', minHeight: 0, paddingBottom: '10px' }}>
            {COLUMNS.map((col) => {
              const columnDemands = filteredDemands.filter(d => d.status === col.id);

              return (
                <Box key={col.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: '280px' }}>
                  <Paper withBorder radius="md" bg="gray.1" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Box p="sm" bg="white" style={{ borderBottom: `3px solid var(--mantine-color-${col.color}-6)` }}>
                      <Group justify="space-between">
                        <Text fw={800} size="xs" tt="uppercase">{col.label}</Text>
                        <Badge variant="light" color={col.color}>{loading ? '...' : columnDemands.length}</Badge>
                      </Group>
                    </Box>

                    <Droppable droppableId={col.id}>
                      {(provided) => (
                        <ScrollArea flex={1} p="xs" viewportRef={provided.innerRef} {...provided.droppableProps}>
                          <Stack gap="xs">
                            {columnDemands.map((demand, index) => (
                              <Draggable key={demand.id} draggableId={demand.id} index={index}>
                                {(dragProvided) => (
                                  <Box ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
                                    <DemandCard
                                      id={demand.id}
                                      protocol={demand.protocol}
                                      title={demand.title}
                                      description={demand.description}
                                      // Usa a prioridade real do banco ou faz fallback amigável
                                      priority={demand.priority || (demand.status === 'INTERROMPIDO' ? 'Crítica' : 'Alta')} 
                                      departmentName={demand.department?.name || departments.find(dep => dep.id === demand.departmentId)?.name || 'Sem Setor'}
                                      techInitials={getTechInitials(demand)}
                                      technicianName={demand.technician?.name} // INTEGRADO: Nome completo para renderização do Avatar
                                      viewed={demand.viewed} // INTEGRADO: Controle de leitura do Admin Geral
                                      isAdminView={isAdminGeral} // INTEGRADO: Ativa a marcação visual amarela de não lido
                                      onClick={() => {
                                        setSelectedDemand(demand);
                                        setModalOpened(true);
                                      }}
                                    />
                                  </Box>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </Stack>
                        </ScrollArea>
                      )}
                    </Droppable>
                  </Paper>
                </Box>
              );
            })}
          </Box>
        </DragDropContext>
      </Box>

      <DemandModal 
        opened={modalOpened} 
        onClose={() => setModalOpened(false)} 
        demand={selectedDemand} 
        onUpdate={fetchDemands}
        departments={departments}
        isAdminView={isAdminGeral} // INTEGRADO: Ativa auditoria dos badges de leitura dentro do Modal
      />
    </Box>
  );
}