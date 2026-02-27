import { supabase } from '@/lib/supabase'
import type { Configuracao } from '@/types'

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
