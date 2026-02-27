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

export async function getResumoClientes(): Promise<ResumoCliente[]> {
  const { data, error } = await supabase
    .from('v_estado_contratos')
    .select('cliente_id, cliente_nome, valor_mensal_usd, status_contrato, viatura_id')

  if (error) throw error
  if (!data) return []

  const map = new Map<string, ResumoCliente>()
  for (const row of data) {
    const existing = map.get(row.cliente_id)
    if (existing) {
      existing.total_viaturas++
      existing.total_contratos++
      if (row.status_contrato === 'ATIVO') existing.contratos_ativos++
      existing.receita_mensal_usd += row.valor_mensal_usd || 0
    } else {
      map.set(row.cliente_id, {
        cliente_id: row.cliente_id,
        cliente_nome: row.cliente_nome,
        total_viaturas: 1,
        total_contratos: 1,
        contratos_ativos: row.status_contrato === 'ATIVO' ? 1 : 0,
        receita_mensal_usd: row.valor_mensal_usd || 0,
      })
    }
  }
  return Array.from(map.values())
}

export async function createCliente(form: { nome: string; nif?: string | null; contacto?: string | null; telefone?: string | null; email?: string | null; endereco?: string | null }): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome: form.nome,
      nif: form.nif || null,
      contacto: form.contacto || null,
      telefone: form.telefone || null,
      email: form.email || null,
      endereco: form.endereco || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
