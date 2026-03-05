import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw, Search, MapPin, Truck } from 'lucide-react'
import { getResumoClientes } from '@/services/clients'
import { getEstadoContratos } from '@/services/dashboard'
import { formatUSD, formatKZ } from '@/utils/formatters'
import type { EstadoContrato } from '@/types'

type FilterTab = 'todos' | 'com-apv' | 'com-cm' | 'sem-contrato'

interface ClientStats {
  apv: number
  cm: number
  receitaMensalUsd: number
  cmTotalKz: number
  marcas: Set<string>
}

function buildClientStatsMap(contratos: EstadoContrato[]): Map<string, ClientStats> {
  const map = new Map<string, ClientStats>()
  for (const c of contratos) {
    let stats = map.get(c.cliente_id)
    if (!stats) {
      stats = { apv: 0, cm: 0, receitaMensalUsd: 0, cmTotalKz: 0, marcas: new Set() }
      map.set(c.cliente_id, stats)
    }
    const isActive = c.status_contrato === 'ATIVO' || c.status_contrato === 'A RENOVAR'
    if (c.tipo_contrato === 'APV' && isActive) {
      stats.apv++
      stats.receitaMensalUsd += c.valor_mensal_usd || 0
    }
    if (c.tipo_contrato === 'CM' && (isActive || c.status_contrato === 'CORTESIA')) {
      stats.cm++
      stats.cmTotalKz += c.valor_total_kz || 0
    }
    stats.marcas.add(c.marca)
  }
  return map
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'com-apv', label: 'Com APV' },
  { key: 'com-cm', label: 'Com CM' },
  { key: 'sem-contrato', label: 'Sem contrato activo' },
]

export default function ClientsList() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('todos')

  const { data: clientes, isLoading: loadingClientes } = useQuery({
    queryKey: ['resumo-clientes'],
    queryFn: getResumoClientes,
  })

  const { data: contratos, isLoading: loadingContratos } = useQuery({
    queryKey: ['estado-contratos'],
    queryFn: getEstadoContratos,
  })

  const statsMap = useMemo(() => buildClientStatsMap(contratos || []), [contratos])

  const filtered = useMemo(() => {
    if (!clientes) return []
    return clientes.filter((c) => {
      if (search && !c.cliente_nome.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      const stats = statsMap.get(c.cliente_id)
      const apv = stats?.apv || 0
      const cm = stats?.cm || 0
      if (activeTab === 'com-apv') return apv > 0
      if (activeTab === 'com-cm') return cm > 0
      if (activeTab === 'sem-contrato') return apv === 0 && cm === 0
      return true
    })
  }, [clientes, search, activeTab, statsMap])

  const isLoading = loadingClientes || loadingContratos

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-nors-teal" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {clientes?.length || 0} clientes activos
          </p>
        </div>
        <Link
          to="/clientes/novo"
          className="inline-flex items-center gap-2 bg-nors-teal text-white h-10 px-4 rounded-md text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} /> Novo Cliente
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Pesquisar clientes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 h-10 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30 focus:border-nors-teal"
        />
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-nors-teal text-nors-teal'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const stats = statsMap.get(c.cliente_id)
          const apv = stats?.apv || 0
          const cm = stats?.cm || 0
          const receita = stats?.receitaMensalUsd || 0
          const cmKz = stats?.cmTotalKz || 0
          const marcas = stats?.marcas ? Array.from(stats.marcas).join(', ') : null
          const shortName = c.cliente_nome.split(' - ')[0]

          return (
            <div
              key={c.cliente_id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 mr-2">
                  <h3 className="text-lg font-bold tracking-tight text-gray-900 truncate">
                    {shortName}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">{c.cliente_nome}</p>
                </div>
                <Link
                  to={`/clientes/${c.cliente_id}`}
                  className="text-sm text-nors-teal hover:underline font-medium whitespace-nowrap"
                >
                  Ver &rarr;
                </Link>
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin size={14} className="shrink-0" />
                  <span>Luanda</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Truck size={14} className="shrink-0" />
                  <span>{c.total_viaturas} viaturas na frota</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">APV activos</p>
                  <p className="text-lg font-bold text-gray-900">{apv}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">CM activos</p>
                  <p className="text-lg font-bold text-gray-900">{cm}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Receita/mês</p>
                  <p className="text-lg font-bold text-gray-900">
                    {receita > 0 ? formatUSD(receita) : cm > 0 ? formatKZ(cmKz) : formatUSD(0)}
                  </p>
                </div>
              </div>

              {marcas && (
                <p className="text-xs text-gray-400 mt-3">Marcas: {marcas}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
