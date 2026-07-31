export type TourRole = 'SAGED_ADMIN_GERAL' | 'SAGED_ADMIN_SETOR' | 'SAGED_TECNICO_LIDER' | 'SAGED_TECNICO';

export interface TourStepConfig {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right' | 'over';
    align?: 'start' | 'center' | 'end';
  };
}

export interface TourPhaseConfig {
  id: string;
  route: string;
  roles: TourRole[];
  steps: TourStepConfig[];
}

export const ALL_TOUR_PHASES: TourPhaseConfig[] = [
  {
    id: 'header-dashboard',
    route: '/dashboard',
    roles: ['SAGED_ADMIN_GERAL', 'SAGED_ADMIN_SETOR', 'SAGED_TECNICO_LIDER', 'SAGED_TECNICO'],
    steps: [
      {
        element: '[data-tour="nav-painel"]',
        popover: {
          title: 'Painel de Visualização',
          description: 'Acesse métricas em tempo real de desempenho e o fluxo de demandas da sua secretaria ou de toda a rede municipal.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="nav-quadro"]',
        popover: {
          title: 'Quadro de Demandas (Kanban)',
          description: 'Acesse o Kanban com todas as demandas da fila selecionada. Arraste cards entre colunas para atualizar o status do atendimento.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="nav-chamado"]',
        popover: {
          title: 'Criar Nova Demanda',
          description: 'Registre um novo chamado técnico informando título, descrição detalhada, patrimônio do equipamento e categoria do problema.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="nav-relatorios"]',
        popover: {
          title: 'Relatórios Gerenciais',
          description: 'Gere relatórios de desempenho por período, exporte em PDF e analise indicadores de produtividade da equipe.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="nav-gerenciar"]',
        popover: {
          title: 'Gerenciar Profissionais',
          description: 'Cadastre profissionais, defina funções e vincule-os às secretarias do município.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="nav-tour"]',
        popover: {
          title: 'Botão Tour',
          description: 'Clique aqui a qualquer momento para reiniciar este tutorial e rever as funcionalidades do SAGED.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="nav-conta"]',
        popover: {
          title: 'Minha Conta',
          description: 'Acesse informações da conta e saia do sistema com segurança.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="dashboard-metrics"]',
        popover: {
          title: 'Indicadores em Tempo Real',
          description: 'Os 4 cards mostram o volume de demandas em cada fase: A Fazer, Em Andamento, Concluídas e Interrompidas.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="dashboard-performance"]',
        popover: {
          title: 'Painel de Performance',
          description: 'Taxa de resolução, demandas retidas e tempo estimado de resposta — três KPIs essenciais para monitorar a eficiência da equipe.',
          side: 'top',
        },
      },
      {
        element: '[data-tour="dashboard-distribution"]',
        popover: {
          title: 'Distribuição de Carga',
          description: 'Visualize a proporção de demandas por status em barras de progresso. Útil para identificar gargalos operacionais.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="dashboard-table"]',
        popover: {
          title: 'Fluxo Recente de Demandas',
          description: 'Lista as demandas mais recentes. Clique em qualquer linha para abrir diretamente no Kanban.',
          side: 'top',
        },
      },
    ],
  },
  {
    id: 'select-unit',
    route: '/selecionar-unidade',
    roles: ['SAGED_ADMIN_GERAL'],
    steps: [
      {
        element: '[data-tour="unit-title"]',
        popover: {
          title: 'Seleção de Unidade',
          description: 'Como Administrador Geral, você acessa o painel global e pode filtrar por qualquer secretaria do município.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="unit-search"]',
        popover: {
          title: 'Busca de Secretarias',
          description: 'Filtre secretarias pelo nome ou código para localizar rapidamente a unidade desejada.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="unit-grid"]',
        popover: {
          title: 'Cards das Secretarias',
          description: 'Cada card representa uma secretaria municipal. Clique para ver o painel de desempenho individual daquela unidade.',
          side: 'top',
        },
      },
    ],
  },
  {
    id: 'select-queue',
    route: '/selecionar-fila',
    roles: ['SAGED_ADMIN_GERAL', 'SAGED_ADMIN_SETOR', 'SAGED_TECNICO_LIDER', 'SAGED_TECNICO'],
    steps: [
      {
        element: '[data-tour="queue-header"]',
        popover: {
          title: 'Fila de Atendimento',
          description: 'Cada especialidade técnica (Hardware, Redes, etc.) tem sua própria fila. Técnicos só acessam sua especialidade.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="queue-cards"]',
        popover: {
          title: 'Especialidades Técnicas',
          description: 'Clique em uma especialidade para acessar o Kanban correspondente com as demandas daquela área.',
          side: 'top',
        },
      },
    ],
  },
  {
    id: 'demands',
    route: '/demandas',
    roles: ['SAGED_ADMIN_GERAL', 'SAGED_ADMIN_SETOR', 'SAGED_TECNICO_LIDER', 'SAGED_TECNICO'],
    steps: [
      {
        element: '[data-tour="demands-board"]',
        popover: {
          title: 'Quadro Kanban',
          description: 'O coração do SAGED. Organize as demandas arrastando cards entre as 4 colunas para atualizar o fluxo de atendimento.',
          side: 'over',
        },
      },
      {
        element: '[data-tour="demands-col-afazer"]',
        popover: {
          title: 'Coluna: A Fazer',
          description: 'Demandas recém-abertas aguardando um técnico. Clique em um card para ver os detalhes e assumir o atendimento.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="demands-col-andamento"]',
        popover: {
          title: 'Coluna: Em Andamento',
          description: 'Chamados em execução. Aqui você registra o patrimônio do equipamento e classifica se é alugado ou da prefeitura.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="demands-col-concluido"]',
        popover: {
          title: 'Coluna: Concluído',
          description: 'Demandas finalizadas. O solicitante recebe notificação automática via WhatsApp ao mover o card para cá.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="demands-col-interrompido"]',
        popover: {
          title: 'Coluna: Interrompido',
          description: 'Chamados pausados por falta de peça ou dependência externa. É obrigatório inserir uma justificativa detalhada.',
          side: 'left',
        },
      },
    ],
  },
  {
    id: 'create-demand',
    route: '/novo-chamado',
    roles: ['SAGED_ADMIN_GERAL', 'SAGED_ADMIN_SETOR', 'SAGED_TECNICO_LIDER', 'SAGED_TECNICO'],
    steps: [
      {
        element: '[data-tour="create-title"]',
        popover: {
          title: 'Título do Chamado',
          description: 'Informe um título curto e objetivo descrevendo o problema. Ex: "Impressora da recepção não liga".',
          side: 'right',
        },
      },
      {
        element: '[data-tour="create-description"]',
        popover: {
          title: 'Descrição Detalhada',
          description: 'Detalhe ao máximo: equipamento afetado, mensagens de erro, quando começou. Quanto mais detalhado, mais ágil o atendimento.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="create-type"]',
        popover: {
          title: 'Categoria do Atendimento',
          description: 'Escolha a especialidade técnica necessária. Isso direciona o chamado para a fila e a equipe correta automaticamente.',
          side: 'top',
        },
      },
      {
        element: '[data-tour="create-submit"]',
        popover: {
          title: 'Registrar Chamado',
          description: 'Clique para registrar! Um protocolo único será gerado e o chamado aparecerá no Kanban da fila correspondente.',
          side: 'top',
        },
      },
    ],
  },
  {
    id: 'reports',
    route: '/relatorios',
    roles: ['SAGED_ADMIN_GERAL', 'SAGED_ADMIN_SETOR', 'SAGED_TECNICO_LIDER'],
    steps: [
      {
        element: '[data-tour="reports-filters"]',
        popover: {
          title: 'Filtros do Relatório',
          description: 'Selecione o mês, ano e (se for Admin Geral) a secretaria para gerar o relatório do período desejado.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="reports-stats"]',
        popover: {
          title: 'Indicadores do Período',
          description: 'Métricas consolidadas: total de atendimentos, taxa de resolução, tempo médio e demandas interrompidas.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="reports-export"]',
        popover: {
          title: 'Exportar para PDF',
          description: 'Gere um PDF formal do relatório para envio, arquivamento ou apresentação em reuniões administrativas.',
          side: 'left',
        },
      },
    ],
  },
  {
    id: 'manage-technicians',
    route: '/gerenciar-tecnicos',
    roles: ['SAGED_ADMIN_GERAL', 'SAGED_ADMIN_SETOR'],
    steps: [
      {
        element: '[data-tour="manage-form"]',
        popover: {
          title: 'Cadastro de Técnico',
          description: 'Preencha os dados do novo usuário: nome, e-mail, senha inicial e secretaria de lotação. Técnicos também precisam de especialidade.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="manage-role"]',
        popover: {
          title: 'Papel e Função',
          description: 'Defina o perfil: Técnico Operacional, Técnico Líder ou Líder de Unidade. Cada papel tem permissões diferentes no sistema.',
          side: 'right',
        },
      },
    ],
  },
];
