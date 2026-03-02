import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw, Search, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { getEstadoContratos } from '@/services/dashboard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatUSD, formatDate, formatNumber, formatPercent } from '@/utils/formatters'
import type { EstadoContrato } from '@/types'

type SortKey = 'matricula' | 'marca' | 'data_inicio' | 'data_validade' | 'valor_mensal_usd' | 'km_actual' | 'pct_km_consumido' | 'dias_ate_expiracao'
type SortDir = 'asc' | 'desc'

interface ClientGroup {
  clienteId: string
  clienteNome: string
  shortName: string
  contratos: EstadoContrato[]
  totalReceita: number
  totalViaturas: number
  statusCounts: { ATIVO: number; 'A RENOVAR': number; EXPIRADO: number }
}

export default function ContractsList() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('matricula')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const { data: contratos, isLoading } = useQuery({
    queryKey: ['estado-contratos'],
    queryFn: getEstadoContratos,
  })

  const statusCounts = useMemo(() => {
    if (!contratos) return { ALL: 0, ATIVO: 0, 'A RENOVAR': 0, EXPIRADO: 0 }
    const counts: Record<string, number> = { ALL: contratos.length, ATIVO: 0, 'A RENOVAR': 0, EXPIRADO: 0 }
    contratos.forEach(c => { counts[c.status_contrato]++ })
    return counts
  }, [contratos])

  const filtered = useMemo(() => {
    return (contratos || []).filter(c => {
      if (statusFilter !== 'ALL' && c.status_contrato !== statusFilter) return false
      if (search) {
        const s = search.toLowerCase()
        return (
          c.cliente_nome.toLowerCase().includes(s) ||
          (c.matricula || '').toLowerCase().includes(s) ||
          c.vin.toLowerCase().includes(s) ||
          c.marca.toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [contratos, statusFilter, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: any = (a as any)[sortKey]
      let vb: any = (b as any)[sortKey]
      if (va == null) va = sortDir === 'asc' ? Infinity : -Infinity
      if (vb == null) vb = sortDir === 'asc' ? Infinity : -Infinity
      if (typeof va === 'string') {
        const cmp = va.localeCompare(vb)
        return sortDir === 'asc' ? cmp : -cmp
      }
      return sortDir === 'asc' ? va - vb : vb - va
    })
  }, [filtered, sortKey, sortDir])

  const groups = useMemo((): ClientGroup[] => {
    const map = new Map<string, ClientGroup>()
    sorted.forEach(c => {
      if (!map.has(c.cliente_id)) {
        map.set(c.cliente_id, {
          clienteId: c.cliente_id,
          clienteNome: c.cliente_nome,
          shortName: c.cliente_nome.split(' - ')[0],
          contratos: [],
          totalReceita: 0,
          totalViaturas: 0,
          statusCounts: { ATIVO: 0, 'A RENOVAR': 0, EXPIRADO: 0 },
        })
      }
      const g = map.get(c.cliente_id)!
      g.contratos.push(c)
      g.totalReceita += c.valor_mensal_usd || 0
      g.statusCounts[c.status_contrato]++
    })
    map.forEach(g => { g.totalViaturas = g.contratos.length })
    return Array.from(map.values()).sort((a, b) => a.shortName.localeCompare(b.shortName))
  }, [sorted])

  function toggleCollapse(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleCollapseAll() {
    if (collapsed.size === groups.length) {
      setCollapsed(new Set())
    } else {
      setCollapsed(new Set(groups.map(g => g.clienteId)))
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-nors-teal" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Contratos</h1>
          <p className="text-sm font-light text-nors-dark-gray mt-1">
            {filtered.length} de {contratos?.length || 0} contratos
            {statusFilter !== 'ALL' && <> — filtro: <span className="font-semibold">{statusFilter}</span></>}
            {search && <> — pesquisa: "<span className="font-semibold">{search}</span>"</>}
          </p>
        </div>
        <Link
          to="/contratos/novo"
          className="inline-flex items-center gap-2 bg-nors-teal text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-nors-teal/90 transition-colors"
        >
          <Plus size={16} /> Novo Contrato
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-nors-light-gray-2" />
          <input
            type="text"
            placeholder="Pesquisar cliente, matrícula, VIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30 focus:border-nors-teal"
          />
        </div>
        <div className="flex rounded-lg border border-nors-light-gray overflow-hidden">
          {(['ALL', 'ATIVO', 'A RENOVAR', 'EXPIRADO'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === s
                  ? 'bg-nors-black text-white'
                  : 'bg-white text-nors-dark-gray hover:bg-nors-off-white'
              }`}
            >
              {s === 'ALL' ? 'Todos' : s}
              <span className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center ${
                statusFilter === s ? 'bg-white/20 text-white' : 'bg-nors-off-white text-nors-dark-gray'
              }`}>
                {statusCounts[s]}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={toggleCollapseAll}
          className="px-3 py-2 text-xs font-semibold border border-nors-light-gray rounded-lg hover:bg-nors-off-white transition-colors"
        >
          {collapsed.size === groups.length ? 'Expandir todos' : 'Colapsar todos'}
        </button>
      </div>

      {/* Grouped Table */}
      <div className="space-y-3">
        {groups.map(group => {
          const isCollapsed = collapsed.has(group.clienteId)
          return (
            <div key={group.clienteId} className="bg-white rounded-lg border border-nors-light-gray overflow-hidden">
              {/* Group Header */}
              <button
                onClick={() => toggleCollapse(group.clienteId)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-nors-off-white/50 transition-colors text-left"
              >
                {isCollapsed
                  ? <ChevronRight size={16} className="text-nors-dark-gray flex-shrink-0" />
                  : <ChevronDown size={16} className="text-nors-dark-gray flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <span className="font-extrabold text-sm tracking-tight">{group.shortName}</span>
                  <span className="text-[10px] font-light text-nors-dark-gray ml-2 hidden md:inline">{group.clienteNome}</span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-light uppercase text-nors-dark-gray">Viaturas</p>
                    <p className="text-sm font-extrabold">{group.totalViaturas}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-light uppercase text-nors-dark-gray">Receita/Mês</p>
                    <p className="text-sm font-extrabold" style={{ color: '#415A67' }}>{formatUSD(group.totalReceita)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {group.statusCounts.ATIVO > 0 && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {group.statusCounts.ATIVO} activo{group.statusCounts.ATIVO > 1 ? 's' : ''}
                      </span>
                    )}
                    {group.statusCounts['A RENOVAR'] > 0 && (
                      <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {group.statusCounts['A RENOVAR']} renovar
                      </span>
                    )}
                    {group.statusCounts.EXPIRADO > 0 && (
                      <span className="bg-red-50 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {group.statusCounts.EXPIRADO} expirado{group.statusCounts.EXPIRADO > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {/* Group Table */}
              {!isCollapsed && (
                <table className="w-full text-sm border-t border-nors-light-gray">
                  <thead>
                    <tr className="bg-nors-off-white text-xs font-semibold uppercase text-nors-dark-gray">
                      <ThSort label="Matrícula" column="matricula" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="left" />
                      <ThSort label="Marca" column="marca" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="left" />
                      <ThSort label="Início" column="data_inicio" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                      <ThSort label="Validade" column="data_validade" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                      <ThSort label="USD/Mês" column="valor_mensal_usd" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                      <th className="text-center px-3 py-2">Última</th>
                      <th className="text-center px-3 py-2">Próxima</th>
                      <ThSort label="KM Actual" column="km_actual" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                      <ThSort label="% KM" column="pct_km_consumido" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" />
                      <th className="text-center px-3 py-2">Status</th>
                      <ThSort label="Dias" column="dias_ate_expiracao" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nors-light-gray/60">
                    {group.contratos.map(c => (
                      <tr key={c.contrato_id} className="hover:bg-nors-off-white/50">
                        <td className="px-3 py-2 text-xs font-mono font-semibold">
                          <Link to={`/contratos/${c.contrato_id}`} className="hover:underline" style={{ color: '#415A67' }}>
                            {c.matricula || <span className="text-gray-400">N/A</span>}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-xs">{c.marca}</td>
                        <td className="px-3 py-2 text-xs text-center">{formatDate(c.data_inicio)}</td>
                        <td className="px-3 py-2 text-xs text-center">{formatDate(c.data_validade)}</td>
                        <td className="px-3 py-2 text-xs text-right font-semibold">
                          {c.valor_mensal_usd ? formatUSD(c.valor_mensal_usd) : '—'}
                        </td>
                        <td className="px-3 py-2 text-xs text-center">{c.tipo_ultima_revisao || '—'}</td>
                        <td className="px-3 py-2 text-xs text-center">{c.proxima_revisao_tipo || '—'}</td>
                        <td className="px-3 py-2 text-xs text-right">{c.km_actual ? formatNumber(c.km_actual) : '—'}</td>
                        <td className="px-3 py-2 text-xs text-right">{formatPercent(c.pct_km_consumido)}</td>
                        <td className="px-3 py-2 text-center">
                          <StatusBadge status={c.status_contrato} />
                        </td>
                        <td className="px-3 py-2 text-xs text-center">
                          <span className={`font-semibold ${
                            c.dias_ate_expiracao < 0 ? 'text-red-600' :
                            c.dias_ate_expiracao <= 60 ? 'text-amber-600' :
                            'text-nors-dark-gray'
                          }`}>
                            {c.dias_ate_expiracao}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}

        {groups.length === 0 && (
          <div className="bg-white rounded-lg border border-nors-light-gray p-8 text-center">
            <p className="text-sm text-nors-dark-gray">Nenhum contrato encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ThSort({ label, column, sortKey, sortDir, onSort, align }: {
  label: string
  column: SortKey
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
  align: 'left' | 'center' | 'right'
}) {
  const isActive = sortKey === column
  return (
    <th
      className={`px-3 py-2 cursor-pointer select-none hover:text-nors-teal transition-colors ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      }`}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive
          ? (sortDir === 'asc' ? <ArrowUp size={10} style={{ color: '#415A67' }} /> : <ArrowDown size={10} style={{ color: '#415A67' }} />)
          : <ArrowUpDown size={10} className="opacity-30" />
        }
      </span>
    </th>
  )
}
