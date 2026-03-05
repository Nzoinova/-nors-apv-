import { supabase } from '@/lib/supabase'
import type { PipelineItem } from '@/types'
import { formatKZ, formatDate } from '@/utils/formatters'

export async function createAPVDraft(cmContratoId: string, notes?: string): Promise<{ id: string }> {
  // Fetch the CM contract to copy client/vehicle info
  const { data: cm, error: cmError } = await supabase
    .from('contratos')
    .select('cliente_id, viatura_id')
    .eq('id', cmContratoId)
    .single()
  if (cmError) throw cmError

  const { data, error } = await supabase
    .from('contratos')
    .insert({
      tipo_contrato: 'APV',
      cliente_id: cm.cliente_id,
      viatura_id: cm.viatura_id,
      status_pipeline: 'PENDENTE_PROPOSTA',
      data_pipeline: new Date().toISOString().split('T')[0],
      contrato_origem_id: cmContratoId,
      notas_pipeline: notes || null,
      // All other fields NULL — to be filled when Ricardo responds
      data_inicio: new Date().toISOString().split('T')[0],
      duracao_meses: 12,
      data_validade: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      intervalo_km_revisao: 0,
      valor_mensal_usd: null,
      km_anuais_contratados: 0,
      km_total_contratados: 0,
    })
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function updatePipelineStatus(contratoId: string, status: string, notes?: string): Promise<void> {
  const updates: Record<string, unknown> = { status_pipeline: status }
  if (notes !== undefined) updates.notas_pipeline = notes
  const { error } = await supabase
    .from('contratos')
    .update(updates)
    .eq('id', contratoId)
  if (error) throw error
}

export async function getPipeline(): Promise<PipelineItem[]> {
  const { data, error } = await supabase
    .from('v_pipeline_apv')
    .select('*')
  if (error) throw error
  return data || []
}

export async function getPipelineByOrigemIds(origemIds: string[]): Promise<Set<string>> {
  if (origemIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from('contratos')
    .select('contrato_origem_id')
    .not('status_pipeline', 'is', null)
    .in('contrato_origem_id', origemIds)
  if (error) throw error
  return new Set((data || []).map(d => d.contrato_origem_id))
}

export function generateEmailForRicardo(data: {
  cliente_nome: string
  marca: string
  modelo: string | null
  matricula: string | null
  vin: string
  km_inicial: number | null
  horas_motor_segundos: number | null
  origem_validade: string | null
  origem_valor_kz: number | null
  notas_pipeline: string | null
}): string {
  return `Assunto: Pedido de Proposta APV — ${data.cliente_nome} — ${data.marca} ${data.modelo || ''}

Ricardo,

Solicito proposta APV para o seguinte:

Cliente: ${data.cliente_nome}
Viatura: ${data.marca} ${data.modelo || ''}
Matrícula: ${data.matricula || 'Sem matrícula'}
VIN: ${data.vin}
KM Actual: ${data.km_inicial != null ? String(data.km_inicial) : 'N/A'}
Horas Motor: ${data.horas_motor_segundos != null ? String(Math.floor(data.horas_motor_segundos / 3600)) + ' h' : 'N/A'}

Contexto: Acordo CM expirou em ${data.origem_validade ? formatDate(data.origem_validade) : 'N/A'}. Valor CM era ${data.origem_valor_kz != null ? formatKZ(data.origem_valor_kz) : 'N/A'}.

Notas: ${data.notas_pipeline || 'Sem notas adicionais'}

Obrigado,
Sidney Maia
Técnico de Suporte ao Negócio
NORS Trucks & Buses Angola VT`
}
