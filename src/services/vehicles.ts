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

export async function getViaturaByMatricula(matricula: string): Promise<Viatura | null> {
  const { data, error } = await supabase
    .from('viaturas')
    .select('*, cliente:clientes(id, nome)')
    .eq('matricula', matricula)
    .single()
  if (error && error.code !== 'PGRST116') throw error
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

export async function createViatura(viatura: Partial<Viatura>): Promise<Viatura> {
  const { data, error } = await supabase
    .from('viaturas')
    .insert(viatura)
    .select()
    .single()
  if (error) throw error
  return data
}
