// Types aligned with Supabase schema

export interface Cliente {
  id: string
  nome: string
  nif: string | null
  contacto: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Viatura {
  id: string
  cliente_id: string
  matricula: string | null
  vin: string
  marca: string
  tipo: string | null
  km_inicial: number | null
  ativo: boolean
  created_at: string
  updated_at: string
  // Joined
  cliente?: Cliente
}

export interface Contrato {
  id: string
  viatura_id: string
  cliente_id: string
  data_inicio: string
  duracao_meses: number
  data_validade: string
  intervalo_km_revisao: number
  valor_mensal_usd: number | null
  km_anuais_contratados: number
  km_total_contratados: number
  observacoes: string | null
  created_at: string
  updated_at: string
  // Joined
  viatura?: Viatura
  cliente?: Cliente
}

export interface OrdemServico {
  id: string
  numero_os: number
  data_os: string
  viatura_id: string
  tipo_revisao: string
  km_na_revisao: number
  descricao_servico: string | null
  custo_kz: number | null
  tecnico: string | null
  status: 'Aberta' | 'Em Curso' | 'Concluída' | 'Cancelada'
  observacoes: string | null
  created_at: string
  // Joined
  viatura?: Viatura
}

export interface Configuracao {
  id: number
  taxa_cambio_usd_kz: number
  data_atualizacao_taxa: string
  intervalo_dias_revisao: number
  alerta_renovacao_dias: number
  alerta_revisao_dias: number
  updated_at: string
}

export interface CicloRevisao {
  id: string
  marca: string
  posicao: number
  tipo_revisao: string
}

// View types
export interface EstadoContrato {
  cliente_id: string
  cliente_nome: string
  viatura_id: string
  matricula: string | null
  vin: string
  marca: string
  km_inicial: number | null
  contrato_id: string
  data_inicio: string
  duracao_meses: number
  data_validade: string
  intervalo_km_revisao: number
  valor_mensal_usd: number | null
  km_anuais_contratados: number
  km_total_contratados: number
  ultima_revisao_data: string | null
  tipo_ultima_revisao: string | null
  km_actual: number | null
  proxima_revisao_data: string | null
  proxima_revisao_km: number | null
  dias_ate_proxima_revisao: number | null
  proxima_revisao_tipo: string | null
  status_contrato: 'ATIVO' | 'A RENOVAR' | 'EXPIRADO'
  dias_ate_expiracao: number
  pct_km_consumido: number | null
  valor_mensal_kz: number
  total_os: number
}

export interface DashboardKPIs {
  contratos_ativos: number
  contratos_a_renovar: number
  contratos_expirados: number
  total_contratos: number
  receita_mensal_usd: number
  receita_mensal_kz: number
  total_clientes: number
  total_marcas: number
}

export interface Alerta {
  tipo_alerta: string
  prioridade: 'ALTA' | 'MEDIA' | 'INFO'
  descricao: string
  detalhe: string
  referencia_id: string
  valor_ordenacao: number
}

export interface ResumoCliente {
  cliente_id: string
  cliente_nome: string
  total_viaturas: number
  total_contratos: number
  contratos_ativos: number
  receita_mensal_usd: number
}

// Form types
export interface ContratoForm {
  cliente_id: string
  viatura_id: string
  data_inicio: string
  duracao_meses: number
  intervalo_km_revisao: number
  valor_mensal_usd: number | null
  km_anuais_contratados: number
  km_total_contratados: number
  observacoes?: string
}

export interface OSForm {
  viatura_id: string
  data_os: string
  tipo_revisao: string
  km_na_revisao: number
  descricao_servico?: string
  custo_kz?: number
  tecnico?: string
  status: string
  observacoes?: string
}
