import { Modal, Button, Group, Text, Badge, Stack, TextInput, Textarea, Select, Divider, Box, SimpleGrid, Alert } from '@mantine/core';
import { IconHammer, IconBuildingCommunity, IconUserCheck, IconAlertCircle, IconUser } from '@tabler/icons-react';
import { useState, useEffect } from 'react';    
import { api } from '../../services/api';
import type { Demand, StatusType } from '../../pages/Demands';

interface Department {
  id: string;
  name: string;
}

interface DemandModalProps {
  opened: boolean;
  onClose: () => void;
  demand: Demand | null;
  onUpdate: () => void;
  departments: Department[];
  isAdminView?: boolean; // Propriedade opcional para ativar auditorias do Admin
}

export function DemandModal({ opened, onClose, demand, onUpdate, departments, isAdminView = false }: DemandModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [assetTag, setAssetTag] = useState('');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (opened && demand) {
      const timer = setTimeout(() => {
        setStatus(demand.status || 'A_FAZER');
        setAssetTag(demand.asset_tag || '');
        setObservacao('');
      }, 0);

      // MARCAÇÃO DE LEITURA AUTOMÁTICA: 
      // Se um técnico abre uma demanda que ainda consta como não lida, dispara a atualização.
      if (!demand.viewed && !isAdminView) {
        api.patch(`/demands/${demand.id}/view`, { viewed: true })
          .then(() => onUpdate())
          .catch((err) => console.error("Aviso: Rota de leitura automática não respondeu:", err));
      }

      return () => clearTimeout(timer);
    }
  }, [demand, opened, isAdminView, onUpdate]);

  const departmentName = departments.find(dep => dep.id === demand?.departmentId)?.name || 'SECRETARIA NÃO ENCONTRADA';

  const handleAssumirDemanda = async () => {
    if (!demand) return;
    setLoading(true);

    try {
      await api.patch(`/demands/${demand.id}/status`, {
        status: 'EM_ANDAMENTO',
        asset_tag: assetTag.trim() || null,
        description: "Chamado assumido pelo técnico via painel operacional SAGE.",
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Erro ao assumir demanda:", error);
      alert("Erro ao assumir o chamado. Verifique sua conexão ou permissões.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!demand) return;

    if ((status === 'INTERROMPIDO' || status === 'CANCELADO') && observacao.trim().length < 15) {
      alert('Para alterar o status para Interrompido ou Cancelado, informe um relatório detalhado com no mínimo 15 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/demands/${demand.id}/status`, {
        status: status as StatusType,
        asset_tag: assetTag.trim() || null,
        description: observacao.trim() || "Atualização técnica realizada via painel gerencial SAGE",
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar alterações na demanda:", error);
      alert("Erro ao salvar dados. Verifique a conexão com o servidor e os privilégios do seu usuário.");
    } finally {
      setLoading(false);
    }
  };

  if (!demand) return null;

  const isSemTecnico = !demand.current_technician_id && !demand.technician?.name;
  
  // CORREÇÃO AQUI: Removemos o operador alternativo para 'demand.technician_name' que quebrava o build
  const nomeDoTecnico = demand.technician?.name;

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={<Text fw={900}>DETALHES DA DEMANDA</Text>} 
      size="lg" 
      radius="md" 
      centered
    >
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <IconBuildingCommunity size={18} color="blue" />
            <Text fw={700} size="sm">{departmentName.toUpperCase()}</Text>
          </Group>
          <Group gap="xs">
            {isAdminView && (
              <Badge color={demand.viewed ? "green" : "yellow"} variant="light">
                {demand.viewed ? "Lida por técnico" : "Não Visualizada"}
              </Badge>
            )}
            <Badge color="blue">#{demand.protocol}</Badge>
          </Group>
        </Group>

        <Box bg="gray.0" p="md" style={{ borderLeft: '4px solid green', borderRadius: '4px' }}>
          <Text size="xs" fw={800} c="dimmed">TÍTULO: {demand.title}</Text>
          <Text size="sm" mt={5}>{demand.description}</Text>
        </Box>

        <Divider label="Painel Técnico de Controle" labelPosition="center" />

        {/* Exibição informativa do técnico atual responsável */}
        <Group gap="xs" px="xs" py="4px" style={{ background: '#f8f9fa', borderRadius: '4px' }}>
          <IconUser size={16} color="gray" />
          <Text size="xs" fw={600} c="dimmed">Responsável Atual:</Text>
          <Text size="xs" fw={700} c={nomeDoTecnico ? "green.8" : "orange.8"}>
            {nomeDoTecnico ? nomeDoTecnico.toUpperCase() : "AGUARDANDO TÉCNICO DA ESPECIALIDADE"}
          </Text>
        </Group>

        {isSemTecnico ? (
          <Alert icon={<IconAlertCircle size={16} />} title="Chamado Disponível" color="blue" radius="md">
            <Text size="sm" mb="md">
              Esta demanda ainda não possui um técnico responsável vinculado. Você deseja assumir a responsabilidade por este atendimento?
            </Text>
            <Group justify="flex-end">
              <Button 
                color="blue" 
                leftSection={<IconUserCheck size={16} />} 
                loading={loading} 
                onClick={handleAssumirDemanda}
              >
                Assumir Atendimento
              </Button>
            </Group>
          </Alert>
        ) : (
          <>
            <SimpleGrid cols={2}>
              <TextInput 
                label="Número de Patrimônio (Asset Tag)" 
                value={assetTag} 
                onChange={(e) => setAssetTag(e.currentTarget.value)} 
                leftSection={<IconHammer size={16}/>} 
                placeholder="Ex: 123456"
              />
              <Select 
                label="Status Operacional" 
                value={status} 
                onChange={(v) => setStatus(v || '')} 
                data={[
                  {value:'A_FAZER', label:'A Fazer'}, 
                  {value:'EM_ANDAMENTO', label:'Em Andamento'}, 
                  {value:'CONCLUIDO', label:'Concluído'}, 
                  {value:'INTERROMPIDO', label:'Interrompido'}
                ]} 
              />
            </SimpleGrid>

            <Textarea 
              label={(status === 'INTERROMPIDO' || status === 'CANCELADO') ? "Justificativa Obrigatória (Mínimo 15 caracteres)" : "Relatório Técnico / Observações"} 
              minRows={3} 
              placeholder="Descreva detalhadamente as ações de manutenção tomadas ou a justificativa para paralisação..."
              value={observacao} 
              onChange={(e) => setObservacao(e.currentTarget.value)} 
              required={status === 'INTERROMPIDO' || status === 'CANCELADO'}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={onClose} disabled={loading}>Cancelar</Button>
              <Button color="green.8" onClick={handleSave} loading={loading}>Salvar Alterações</Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}