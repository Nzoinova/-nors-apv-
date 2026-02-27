export const CICLO_DONGFENG = ['B1', 'B2', 'B3', 'B4', 'MC'] as const

export const TIPOS_REVISAO: Record<string, string> = {
  B1: 'Revisão Básica 1',
  B2: 'Revisão Básica 2',
  B3: 'Revisão Básica 3',
  B4: 'Revisão Básica 4',
  MC: 'Manutenção Completa',
}

export const STATUS_OS = ['Aberta', 'Em Curso', 'Concluída', 'Cancelada'] as const

export const LOCALIZACOES = ['Luanda', 'Lubango', 'Lobito'] as const

export const TIPOS_OS = ['Interna', 'Cliente'] as const

export const OS_PREFIXES: Record<string, Record<string, string>> = {
  Luanda:  { Interna: '49', Cliente: '59' },
  Lubango: { Interna: '46', Cliente: '56' },
  Lobito:  { Interna: '45', Cliente: '55' },
}

export const MARCAS = ['Dongfeng', 'Volvo', 'SDMO', 'Rekohl'] as const

export const STATUS_CONTRATO_COLORS: Record<string, { bg: string; text: string }> = {
  ATIVO: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'A RENOVAR': { bg: 'bg-amber-50', text: 'text-amber-700' },
  EXPIRADO: { bg: 'bg-red-50', text: 'text-red-700' },
}

export const PRIORIDADE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  ALTA: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  MEDIA: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  INFO: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
}
