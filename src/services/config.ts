import { supabase } from '@/lib/supabase'
import type { Configuracao, CicloRevisao } from '@/types'

export async function getConfig(): Promise<Configuracao> {
  const { data, error } = await supabase
    .from('configuracao')
    .select('*')
    .eq('id', 1)
    .single()
  if (error) throw error
  return data
}

export async function updateTaxaCambio(taxa: number): Promise<Configuracao> {
  const { data, error } = await supabase
    .from('configuracao')
    .update({
      taxa_cambio_usd_kz: taxa,
      data_atualizacao_taxa: new Date().toISOString().split('T')[0],
    })
    .eq('id', 1)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateConfiguracoes(updates: Partial<Configuracao>): Promise<Configuracao> {
  const { data, error } = await supabase
    .from('configuracao')
    .update(updates)
    .eq('id', 1)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getCiclosRevisao(): Promise<CicloRevisao[]> {
  const { data, error } = await supabase
    .from('ciclos_revisao')
    .select('*')
    .order('marca')
    .order('posicao')
  if (error) throw error
  return data || []
}

export async function updateDongfengCycles(
  cycles: { posicao: number; tipo_revisao: string; descricao: string }[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('ciclos_revisao')
    .delete()
    .eq('marca', 'Dongfeng')
  if (deleteError) throw deleteError

  const { error: insertError } = await supabase
    .from('ciclos_revisao')
    .insert(cycles.map((c) => ({ ...c, marca: 'Dongfeng' })))
  if (insertError) throw insertError
}

export async function getSystemCounts(): Promise<{
  total_clientes: number
  total_viaturas: number
  total_contratos: number
  apv_ativos: number
  cm_ativos: number
}> {
  const [clientes, viaturas, contratos, apv, cm] = await Promise.all([
    supabase.from('clientes').select('id', { count: 'exact', head: true }),
    supabase.from('viaturas').select('id', { count: 'exact', head: true }),
    supabase.from('contratos').select('id', { count: 'exact', head: true }),
    supabase.from('v_estado_contratos').select('contrato_id', { count: 'exact', head: true }).eq('tipo_contrato', 'APV').eq('status_contrato', 'ATIVO'),
    supabase.from('v_estado_contratos').select('contrato_id', { count: 'exact', head: true }).eq('tipo_contrato', 'CM').in('status_contrato', ['ATIVO', 'CORTESIA']),
  ])
  return {
    total_clientes: clientes.count ?? 0,
    total_viaturas: viaturas.count ?? 0,
    total_contratos: contratos.count ?? 0,
    apv_ativos: apv.count ?? 0,
    cm_ativos: cm.count ?? 0,
  }
}
