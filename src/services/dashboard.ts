import { supabase } from '@/lib/supabase'
import type { DashboardKPIs, Alerta, EstadoContrato } from '@/types'
import { CM_ALERT_OVERRIDES } from '@/utils/constants'

export async function getKPIs(): Promise<DashboardKPIs> {
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
    .limit(20)
  if (error) throw error
  return (data || []).map(alerta => {
    const override = CM_ALERT_OVERRIDES[alerta.tipo_alerta]
    if (override) {
      return { ...alerta, descricao: override.descricao, prioridade: override.prioridade }
    }
    return alerta
  })
}

export async function getEstadoContratos(): Promise<EstadoContrato[]> {
  const { data, error } = await supabase
    .from('v_estado_contratos')
    .select('*')
    .order('cliente_nome')
  if (error) throw error
  return data || []
}
