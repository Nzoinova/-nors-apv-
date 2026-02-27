import { supabase } from '@/lib/supabase'
import type { Contrato, ContratoForm } from '@/types'

export async function getContratos(): Promise<Contrato[]> {
  const { data, error } = await supabase
    .from('contratos')
    .select('*, viatura:viaturas(id, matricula, vin, marca), cliente:clientes(id, nome)')
    .order('data_inicio', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getContrato(id: string): Promise<Contrato> {
  const { data, error } = await supabase
    .from('contratos')
    .select('*, viatura:viaturas(id, matricula, vin, marca, km_inicial), cliente:clientes(id, nome)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getContratosByCliente(clienteId: string): Promise<Contrato[]> {
  const { data, error } = await supabase
    .from('contratos')
    .select('*, viatura:viaturas(id, matricula, vin, marca)')
    .eq('cliente_id', clienteId)
    .order('data_inicio', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createContrato(form: ContratoForm): Promise<Contrato> {
  const { data, error } = await supabase
    .from('contratos')
    .insert({
      viatura_id: form.viatura_id,
      cliente_id: form.cliente_id,
      data_inicio: form.data_inicio,
      duracao_meses: form.duracao_meses,
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

export async function updateContrato(id: string, updates: Partial<Contrato>): Promise<Contrato> {
  const { data, error } = await supabase
    .from('contratos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteContrato(id: string): Promise<void> {
  const { error } = await supabase
    .from('contratos')
    .delete()
    .eq('id', id)
  if (error) throw error
}
