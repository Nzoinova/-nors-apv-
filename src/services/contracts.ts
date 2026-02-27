import { supabase } from '@/lib/supabase'
import type { Contrato, EstadoContrato, DashboardKPIs, Alerta } from '@/types'

export async function getContratos(): Promise<EstadoContrato[]> {
  const { data, error } = await supabase
    .from('v_estado_contratos')
    .select('*')
    .order('cliente_nome')
  if (error) throw error
  return data || []
}

export async function getContrato(id: string): Promise<Contrato> {
  const { data, error } = await supabase
    .from('contratos')
    .select('*, viatura:viaturas(*, cliente:clientes(*)), cliente:clientes(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const { data, error } = await supabase
    .from('v_dashboard_kpis')
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function getAlertas(): Promise<Alerta[]> {
  const { data, error } = await supabase
    .from('v_alertas')
    .select('*')
  if (error) throw error
  return data || []
}

export async function createContrato(form: {
  cliente_id: string
  viatura_id: string
  data_inicio: string
  duracao_meses: number
  intervalo_km_revisao: number
  valor_mensal_usd: number | null
  km_anuais_contratados: number
  km_total_contratados: number
  observacoes?: string
}): Promise<Contrato> {
  const dataInicio = new Date(form.data_inicio)
  const dataValidade = new Date(dataInicio)
  dataValidade.setMonth(dataValidade.getMonth() + form.duracao_meses)

  const { data, error } = await supabase
    .from('contratos')
    .insert({
      cliente_id: form.cliente_id,
      viatura_id: form.viatura_id,
      data_inicio: form.data_inicio,
      duracao_meses: form.duracao_meses,
      data_validade: dataValidade.toISOString().split('T')[0],
      intervalo_km_revisao: form.intervalo_km_revisao,
      valor_mensal_usd: form.valor_mensal_usd,
      km_anuais_contratados: form.km_anuais_contratados,
      km_total_contratados: form.km_total_contratados,
      observacoes: form.observacoes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
