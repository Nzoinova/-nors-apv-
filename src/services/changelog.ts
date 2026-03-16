import { supabase } from '@/lib/supabase'

export interface MudancaItem {
  tipo: 'novo' | 'melhoria' | 'correcção'
  descricao: string
}

export interface Changelog {
  id: string
  versao: string
  titulo: string
  data_lancamento: string
  mudancas: MudancaItem[]
  created_at: string
}

export async function getChangelogs(): Promise<Changelog[]> {
  const { data, error } = await supabase
    .from('changelogs')
    .select('*')
    .order('data_lancamento', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getLatestChangelog(): Promise<Changelog | null> {
  const { data, error } = await supabase
    .from('changelogs')
    .select('*')
    .order('data_lancamento', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data
}
