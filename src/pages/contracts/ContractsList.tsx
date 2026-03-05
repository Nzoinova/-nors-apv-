import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw, Search, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { getEstadoContratos } from '@/services/dashboard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatUSD, formatKZ, formatDate } from '@/utils/formatters'
import type { EstadoContrato } from '@/types'

type SortKey = 'matricula' | 'marca' | 'data_validade' | 'valor_mensal_usd' | 'dias_ate_expiracao'
type SortDir = 'asc' | 'desc'
type TipoFilter = 'ALL' | 'APV' | 'CM'

interface ClientGroup {
  clienteId: string
  clienteNome: string
  shortName: string
  contratos: EstadoContrato[]
  totalReceitaUSD: number
  totalValorKZ: number
  totalViaturas: number
  statusCounts: Record<string, number>
}

export default function ContractsList() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('ALL')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('dias_ate_expiracao')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const initialCollapseSet = useRef(false)

  const { data: contratos, isLoading } = useQuery({
    queryKey: ['estado-contratos'],
    queryFn: getEstadoContratos,
  })

  // Status options depend on tipo filter
  const statusOptions = useMemo(() => {
    if (tipoFilter === 'CM') return ['ALL', 'ATIVO', 'CORTESIA', 'FECHADO', 'EXPIRADO']
    if (tipoFilter === 'APV') return ['ALL', 'ATIVO', 'A RENOVAR', 'EXPIRADO']
    return ['ALL', 'ATIVO', 'A RENOVAR', 'CORTESIA', 'FECHADO', 'EXPIRADO']
  }, [tipoFilter])

  const statusCounts = useMemo(() => {
    if (!contratos) return {} as Record<string, number>
    const base = tipoFilter === 'ALL' ? contratos : contratos.filter(c => c.tipo_contrato === tipoFilter)
    const counts: Record<string, number> = { ALL: base.length }
    base.forEach(c => { counts[c.status_contrato] = (counts[c.status_contrato] || 0) + 1 })
    return counts
  }, [contratos, tipoFilter])

  const tipoCounts = useMemo(() => {
    if (!contratos) return { ALL: 0, APV: 0, CM: 0 }
    return {
      ALL: contratos.length,
      APV: contratos.filter(c => c.tipo_contrato === 'APV').length,
      CM: contratos.filter(c => c.tipo_contrato === 'CM').length,
    }
  }, [contratos])

  const filtered = useMemo(() => {
    return (contratos || []).filter(c => {
      if (tipoFilter !== 'ALL' && c.tipo_contrato !== tipoFilter) return false
      if (statusFilter !== 'ALL' && c.status_contrato !== statusFilter) return false
      if (search) {
        const s = search.toLowerCase()
        return (
          c.cliente_nome.toLowerCase().includes(s) ||
          (c.matricula || '').toLowerCase().includes(s) ||
          c.vin.toLowerCase().includes(s) ||
          c.marca.toLowerCase().includes(s) ||
          (c.modelo || '').toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [contratos, tipoFilter, statusFilter, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: any = (a as any)[sortKey]
      let vb: any = (b as any)[sortKey]
      if (va == null) va = sortDir === 'asc' ? Infinity : -Infinity
      if (vb == null) vb = sortDir === 'asc' ? Infinity : -Infinity
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
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
          shortName: c.cliente_nome.split(' - ')[0].split(',')[0].trim(),
          contratos: [],
          totalReceitaUSD: 0,
          totalValorKZ: 0,
          totalViaturas: 0,
          statusCounts: {},
        })
      }
      const g = map.get(c.cliente_id)!
      g.contratos.push(c)
      g.totalReceitaUSD += c.valor_mensal_usd || 0
      g.totalValorKZ += c.valor_total_kz || 0
      g.statusCounts[c.status_contrato] = (g.statusCounts[c.status_contrato] || 0) + 1
    })
    map.forEach(g => { g.totalViaturas = g.contratos.length })
    return Array.from(map.values()).sort((a, b) => a.shortName.localeCompare(b.shortName))
  }, [sorted])

  useEffect(() => {
    if (groups.length > 0 && !initialCollapseSet.current) {
      initialCollapseSet.current = true
      setCollapsed(new Set(groups.map(g => g.clienteId)))
    }
  }, [groups])

  function toggleCollapse(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleCollapseAll() {
    setCollapsed(collapsed.size === groups.length ? new Set() : new Set(groups.map(g => g.clienteId)))
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-nors-teal" size={24} /></div>
  }

  const showAPV = tipoFilter === 'ALL' || tipoFilter === 'APV'
  const showCM = tipoFilter === 'ALL' || tipoFilter === 'CM'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} de {contratos?.length || 0} contratos
            {tipoFilter !== 'ALL' && <> — <span className="font-semibold">{tipoFilter}</span></>}
            {statusFilter !== 'ALL' && <> — <span className="font-semibold">{statusFilter}</span></>}
            {search && <> — "{search}"</>}
          </p>
        </div>
        <Link to="/contratos/novo" className="inline-flex items-center gap-2 bg-nors-teal text-white h-10 px-4 rounded-md text-sm font-medium hover:opacity-90">
          <Plus size={16} /> Novo Contrato
        </Link>
      </div>

      {/* Unified filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {/* Tipo tabs */}
          {(['ALL', 'APV', 'CM'] as const).map(t => (
            <button key={t} onClick={() => { setTipoFilter(t); setStatusFilter('ALL') }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 ${tipoFilter === t ? 'bg-nors-off-black text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              {t === 'ALL' ? 'Todos' : t}
              <span className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center ${tipoFilter === t ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {tipoCounts[t]}
              </span>
            </button>
          ))}
        </div>

        {/* Vertical divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Status pills */}
        <div className="flex items-center gap-1">
          {statusOptions.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1 ${statusFilter === s ? 'bg-nors-off-black text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              {s === 'ALL' ? 'Todos' : s}
              {(statusCounts[s] ?? 0) > 0 && (
                <span className={`text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center ${statusFilter === s ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                  {statusCounts[s]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search + collapse */}
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20" />
        </div>
        <button onClick={toggleCollapseAll} className="bg-white text-gray-700 h-10 px-4 rounded-md text-sm font-medium border border-gray-200 hover:bg-gray-50">
          {collapsed.size === groups.length ? 'Expandir' : 'Colapsar'}
        </button>
      </div>

      {/* Grouped cards */}
      <div className="space-y-3">
        {groups.map(group => {
          const isCollapsed = collapsed.has(group.clienteId)
          const hasCM = group.contratos.some(c => c.tipo_contrato === 'CM')
          const hasAPV = group.contratos.some(c => c.tipo_contrato === 'APV')
          return (
            <div key={group.clienteId} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              {/* Group Header */}
              <button onClick={() => toggleCollapse(group.clienteId)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/30 border-b border-gray-100 cursor-pointer text-left">
                {isCollapsed
                  ? <ChevronRight size={16} className="text-gray-400 flex-shrink-0 transition-transform" />
                  : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 transition-transform" />}
                <div className="flex-1 min-w-0">
                  <span className="text-base font-semibold text-gray-900">{group.shortName}</span>
                  <div className="flex gap-1 mt-0.5">
                    {hasAPV && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#415A67', color: 'white' }}>APV</span>}
                    {hasCM && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">CM</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Viaturas</p>
                    <p className="text-sm font-semibold text-gray-900">{group.totalViaturas}</p>
                  </div>
                  {group.totalReceitaUSD > 0 && (
                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">APV/Mês</p>
                      <p className="text-sm font-semibold" style={{ color: '#415A67' }}>{formatUSD(group.totalReceitaUSD)}</p>
                    </div>
                  )}
                  {group.totalValorKZ > 0 && (
                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">CM Total</p>
                      <p className="text-sm font-semibold text-gray-600">{formatKZ(group.totalValorKZ)}</p>
                    </div>
                  )}
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {(group.statusCounts['ATIVO'] || 0) > 0 && <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{group.statusCounts['ATIVO']}</span>}
                    {(group.statusCounts['A RENOVAR'] || 0) > 0 && <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{group.statusCounts['A RENOVAR']}</span>}
                    {(group.statusCounts['CORTESIA'] || 0) > 0 && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{group.statusCounts['CORTESIA']}</span>}
                    {(group.statusCounts['FECHADO'] || 0) > 0 && <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{group.statusCounts['FECHADO']}</span>}
                    {(group.statusCounts['EXPIRADO'] || 0) > 0 && <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{group.statusCounts['EXPIRADO']}</span>}
                  </div>
                </div>
              </button>

              {/* Table */}
              {!isCollapsed && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 w-8">Tipo</th>
                      <ThSort label="Matrícula" column="matricula" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="left" />
                      <ThSort label="Modelo" column="marca" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="left" />
                      <ThSort label="Validade" column="data_validade" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                      <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Valor</th>
                      <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                      <ThSort label="Dias" column="dias_ate_expiracao" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                    </tr>
                  </thead>
                  <tbody>
                    {group.contratos.map(c => (
                      <tr key={c.contrato_id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={c.tipo_contrato === 'APV' ? { backgroundColor: '#415A67', color: 'white' } : { backgroundColor: '#F2F2F2', color: '#575757' }}>
                            {c.tipo_contrato}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono font-medium">
                          <Link to={`/contratos/${c.contrato_id}`} className="text-nors-teal hover:underline">
                            {c.matricula || <span className="text-gray-400">—</span>}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.modelo || c.marca}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{formatDate(c.data_validade)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {c.tipo_contrato === 'APV'
                            ? (c.valor_mensal_usd ? formatUSD(c.valor_mensal_usd) + '/mês' : '—')
                            : (c.valor_total_kz ? formatKZ(c.valor_total_kz) : '—')
                          }
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={c.status_contrato} />
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`font-semibold ${c.dias_ate_expiracao < 0 ? 'text-red-600' : c.dias_ate_expiracao <= 60 ? 'text-amber-600' : 'text-gray-500'}`}>
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
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-500">Nenhum contrato encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ThSort({ label, column, sortKey, sortDir, onSort, align }: {
  label: string; column: SortKey; sortKey: SortKey; sortDir: SortDir; onSort: (k: SortKey) => void; align: 'left' | 'center' | 'right'
}) {
  const isActive = sortKey === column
  return (
    <th className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
      onClick={() => onSort(column)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive
          ? (sortDir === 'asc' ? <ArrowUp size={10} style={{ color: '#415A67' }} /> : <ArrowDown size={10} style={{ color: '#415A67' }} />)
          : <ArrowUpDown size={10} className="opacity-30" />}
      </span>
    </th>
  )
}
