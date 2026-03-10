/*
  SUPABASE TABLE REQUIRED — run in SQL Editor before deploying:

  CREATE TABLE entradas_viaturas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    viatura_id UUID REFERENCES viaturas(id),
    contrato_id UUID REFERENCES contratos(id),
    matricula TEXT NOT NULL,
    cliente_nome TEXT NOT NULL,
    km_entrada INTEGER NOT NULL,
    tipo_servico TEXT NOT NULL,
    unidade TEXT NOT NULL,
    observacoes TEXT,
    data_entrada TIMESTAMPTZ NOT NULL,
    registado_por TEXT NOT NULL DEFAULT 'Recepção',
    created_at TIMESTAMPTZ DEFAULT now()
  );
*/

import { supabase } from '@/lib/supabase'

export interface NovaEntrada {
  viatura_id: string
  contrato_id: string
  matricula: string
  cliente_nome: string
  km_entrada: number
  tipo_servico: string
  unidade: string
  observacoes?: string
  data_entrada: string
  registado_por: string
}

export async function registarEntrada(entrada: NovaEntrada) {
  const { data, error } = await supabase
    .from('entradas_viaturas')
    .insert([entrada])
    .select()
    .single()
  if (error) throw error
  return data
}

/*
  If update returns 400, run in Supabase SQL Editor:
  CREATE POLICY "Allow update entradas_viaturas"
  ON entradas_viaturas FOR UPDATE USING (true);
*/
export async function updateEntrada(
  id: string,
  updates: { tipo_servico: string; km_entrada: number; observacoes?: string }
) {
  const { data, error } = await supabase
    .from('entradas_viaturas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getEntradasHoje() {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('entradas_viaturas')
    .select('*')
    .gte('data_entrada', hoje.toISOString())
    .order('data_entrada', { ascending: false })

  if (error) throw error
  return data ?? []
}
