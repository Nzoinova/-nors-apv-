import { supabase } from '@/lib/supabase'
import type { Cliente, ResumoCliente } from '@/types'

export async function getClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data || []
}

export async function getCliente(id: string): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getResumoClientes(): Promise<ResumoCliente[]> {
  const { data, error } = await supabase.rpc('get_resumo_clientes')
  if (error) throw error
  return data || []
}

export async function createCliente(cliente: Partial<Cliente>): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert(cliente)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCliente(id: string, updates: Partial<Cliente>): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
