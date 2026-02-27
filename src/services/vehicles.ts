import { supabase } from '@/lib/supabase'
import type { Viatura } from '@/types'

export async function getViaturas(): Promise<Viatura[]> {
  const { data, error } = await supabase
    .from('viaturas')
    .select('*, cliente:clientes(id, nome)')
    .eq('ativo', true)
    .order('matricula')
  if (error) throw error
  return data || []
}

export async function getViatura(id: string): Promise<Viatura> {
  const { data, error } = await supabase
    .from('viaturas')
    .select('*, cliente:clientes(id, nome)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getViaturasByCliente(clienteId: string): Promise<Viatura[]> {
  const { data, error } = await supabase
    .from('viaturas')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('ativo', true)
    .order('matricula')
  if (error) throw error
  return data || []
}

export async function createViatura(form: {
  cliente_id: string
  matricula?: string
  vin: string
  marca: string
  modelo?: string
  tipo?: string
  ano?: number
  tipo_combustivel?: string
  km_inicial?: number
  horas_motor_segundos?: number
}): Promise<Viatura> {
  const { data, error } = await supabase
    .from('viaturas')
    .insert({
      cliente_id: form.cliente_id,
      matricula: form.matricula || null,
      vin: form.vin,
      marca: form.marca,
      modelo: form.modelo || null,
      tipo: form.tipo || null,
      ano: form.ano || null,
      tipo_combustivel: form.tipo_combustivel || null,
      km_inicial: form.km_inicial || null,
      horas_motor_segundos: form.horas_motor_segundos || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateViatura(id: string, updates: Partial<Viatura>): Promise<Viatura> {
  const { data, error } = await supabase
    .from('viaturas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
