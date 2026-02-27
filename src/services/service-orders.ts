import { supabase } from '@/lib/supabase'
import type { OrdemServico } from '@/types'

export async function getOrdensServico(): Promise<OrdemServico[]> {
  const { data, error } = await supabase
    .from('ordens_servico')
    .select('*, viatura:viaturas(id, matricula, vin, marca, cliente_id, cliente:clientes(id, nome))')
    .order('data_os', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getOS(id: string): Promise<OrdemServico> {
  const { data, error } = await supabase
    .from('ordens_servico')
    .select('*, viatura:viaturas(id, matricula, vin, marca, cliente_id, cliente:clientes(id, nome))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getOSByViatura(viaturaId: string): Promise<OrdemServico[]> {
  const { data, error } = await supabase
    .from('ordens_servico')
    .select('*')
    .eq('viatura_id', viaturaId)
    .order('data_os', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createOS(form: {
  viatura_id: string
  numero_os: string
  data_os: string
  tipo_revisao: string
  km_na_revisao: number
  horas_motor_na_revisao?: number
  descricao_servico?: string
  custo_kz?: number
  tecnico?: string
  status: string
  localizacao: string
  tipo_os: string
  observacoes?: string
}): Promise<OrdemServico> {
  const { data, error } = await supabase
    .from('ordens_servico')
    .insert({
      viatura_id: form.viatura_id,
      numero_os: form.numero_os,
      data_os: form.data_os,
      tipo_revisao: form.tipo_revisao,
      km_na_revisao: form.km_na_revisao,
      horas_motor_na_revisao: form.horas_motor_na_revisao || null,
      descricao_servico: form.descricao_servico || null,
      custo_kz: form.custo_kz || null,
      tecnico: form.tecnico || null,
      status: form.status,
      localizacao: form.localizacao,
      tipo_os: form.tipo_os,
      observacoes: form.observacoes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateOSStatus(id: string, status: string): Promise<OrdemServico> {
  const { data, error } = await supabase
    .from('ordens_servico')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
