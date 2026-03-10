import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw, Search, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, Trash2 } from 'lucide-react'
import { getEstadoContratos } from '@/services/dashboard'
import { getPipeline } from '@/services/pipeline'
import { supabase } from '@/lib/supabase'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatUSD, formatKZ, formatDate } from '@/utils/formatters'
import type { EstadoContrato } from '@/types'

type SortKey = 'matricula' | 'marca' | 'data_validade' | 'valor_mensal_usd' | 'dias_ate_expiracao'
type SortDir = 'asc' | 'desc'
type TipoFilter = 'ALL' | 'APV' | 'CM' | 'PIPELINE'

const PIPELINE_STATUS_LABELS: Record<string, { bg: string; text: string; label: string }> = {
  PENDENTE_PROPOSTA: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Aguarda Proposta' },
  PROPOSTA_RECEBIDA: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Proposta Recebida' },
  EM_APROVACAO: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Em Aprovação' },
  APROVADO: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Aprovado' },
  REJEITADO: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejeitado' },
}

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
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('APV')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('dias_ate_expiracao')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showFilters, setShowFilters] = useState(false)
  const [filterMarca, setFilterMarca] = useState('')
  const [filterCliente, setFilterCliente] = useState('')
  const [filterValidade, setFilterValidade] = useState('')
  const [filterOrdenar, setFilterOrdenar] = useState('')
  const initialCollapseSet = useRef(false)

  const { data: contratos, isLoading } = useQuery({
    queryKey: ['estado-contratos'],
    queryFn: getEstadoContratos,
  })

  const { data: pipelineItems, isLoading: loadingPipeline } = useQuery({
    queryKey: ['pipeline'],
    queryFn: getPipeline,
  })

  const queryClient = useQueryClient()

  const handleDeleteDraft = async (contratoId: string) => {
    const confirmed = window.confirm(
      'Eliminar este draft de proposta?\nO contrato CM de origem não será afectado.'
    )
    if (!confirmed) return
    const { error } = await supabase
      .from('contratos')
      .delete()
      .eq('id', contratoId)
    if (error) {
      console.error('Erro ao eliminar:', error)
      alert('Erro ao eliminar. Verifica a consola.')
      return
    }
    queryClient.invalidateQueries({ queryKey: ['contratos'] })
    queryClient.invalidateQueries({ queryKey: ['pipeline'] })
    queryClient.invalidateQueries({ queryKey: ['alertas'] })
  }

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
    if (!contratos) return { ALL: 0, APV: 0, CM: 0, PIPELINE: pipelineItems?.length || 0 }
    return {
      ALL: contratos.length,
      APV: contratos.filter(c => c.tipo_contrato === 'APV').length,
      CM: contratos.filter(c => c.tipo_contrato === 'CM').length,
      PIPELINE: pipelineItems?.length || 0,
    }
  }, [contratos, pipelineItems])

  const uniqueMarcas = useMemo(() => {
    if (!contratos) return []
    return [...new Set(contratos.map(c => c.marca))].sort()
  }, [contratos])

  const uniqueClientes = useMemo(() => {
    if (!contratos) return []
    return [...new Set(contratos.map(c => c.cliente_nome))].sort()
  }, [contratos])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filterMarca) count++
    if (filterCliente) count++
    if (filterValidade) count++
    if (filterOrdenar) count++
    return count
  }, [filterMarca, filterCliente, filterValidade, filterOrdenar])

  const filtered = useMemo(() => {
    return (contratos || []).filter(c => {
      if (tipoFilter !== 'ALL' && c.tipo_contrato !== tipoFilter) return false
      if (statusFilter !== 'ALL' && c.status_contrato !== statusFilter) return false
      if (filterMarca && c.marca !== filterMarca) return false
      if (filterCliente && c.cliente_nome !== filterCliente) return false
      if (filterValidade) {
        const dias = c.dias_ate_expiracao
        if (filterValidade === '30' && (dias < 0 || dias > 30)) return false
        if (filterValidade === '60' && (dias < 0 || dias > 60)) return false
        if (filterValidade === '90' && (dias < 0 || dias > 90)) return false
        if (filterValidade === 'expirado' && dias >= 0) return false
      }
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
  }, [contratos, tipoFilter, statusFilter, search, filterMarca, filterCliente, filterValidade])

  const sorted = useMemo(() => {
    const result = [...filtered]

    // Apply filterOrdenar if set, otherwise use column sort
    if (filterOrdenar === 'cliente_az') {
      result.sort((a, b) => a.cliente_nome.localeCompare(b.cliente_nome))
    } else if (filterOrdenar === 'validade_proximo') {
      result.sort((a, b) => (a.dias_ate_expiracao ?? Infinity) - (b.dias_ate_expiracao ?? Infinity))
    } else if (filterOrdenar === 'valor_maior') {
      result.sort((a, b) => ((b.valor_mensal_usd || 0) + (b.valor_total_kz || 0)) - ((a.valor_mensal_usd || 0) + (a.valor_total_kz || 0)))
    } else if (filterOrdenar === 'dias_restantes') {
      result.sort((a, b) => (a.dias_ate_expiracao ?? Infinity) - (b.dias_ate_expiracao ?? Infinity))
    } else {
      result.sort((a, b) => {
        let va: any = (a as any)[sortKey]
        let vb: any = (b as any)[sortKey]
        if (va == null) va = sortDir === 'asc' ? Infinity : -Infinity
        if (vb == null) vb = sortDir === 'asc' ? Infinity : -Infinity
        if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
        return sortDir === 'asc' ? va - vb : vb - va
      })
    }

    return result
  }, [filtered, sortKey, sortDir, filterOrdenar])

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
          {(['ALL', 'APV', 'CM', 'PIPELINE'] as const).map(t => (
            <button key={t} onClick={() => { setTipoFilter(t); setStatusFilter('ALL') }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 ${tipoFilter === t ? 'bg-nors-off-black text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              {t === 'ALL' ? 'Todos' : t === 'PIPELINE' ? 'Pipeline' : t}
              <span className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center ${tipoFilter === t ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {tipoCounts[t]}
              </span>
            </button>
          ))}
        </div>

        {tipoFilter !== 'PIPELINE' && (
          <>
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
          </>
        )}

        {/* Search + Filtros + collapse */}
        {tipoFilter !== 'PIPELINE' && (
          <>
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20" />
            </div>
            <button onClick={() => setShowFilters(f => !f)}
              className="inline-flex items-center gap-1.5 bg-white text-gray-700 h-10 px-4 rounded-md text-sm font-medium border border-gray-200 hover:bg-gray-50">
              <SlidersHorizontal size={14} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="bg-nors-teal text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center ml-1">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button onClick={toggleCollapseAll} className="bg-white text-gray-700 h-10 px-4 rounded-md text-sm font-medium border border-gray-200 hover:bg-gray-50">
              {collapsed.size === groups.length ? 'Expandir' : 'Colapsar'}
            </button>
          </>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && tipoFilter !== 'PIPELINE' && (
        <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-4 mt-2 mb-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Marca</label>
            <select value={filterMarca} onChange={e => setFilterMarca(e.target.value)}
              className="h-9 rounded-md border border-gray-200 text-sm bg-white px-3 min-w-[160px]">
              <option value="">Todas</option>
              {uniqueMarcas.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cliente</label>
            <select value={filterCliente} onChange={e => setFilterCliente(e.target.value)}
              className="h-9 rounded-md border border-gray-200 text-sm bg-white px-3 min-w-[160px]">
              <option value="">Todos</option>
              {uniqueClientes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Validade</label>
            <select value={filterValidade} onChange={e => setFilterValidade(e.target.value)}
              className="h-9 rounded-md border border-gray-200 text-sm bg-white px-3 min-w-[160px]">
              <option value="">Todos</option>
              <option value="30">Expira em 30 dias</option>
              <option value="60">Expira em 60 dias</option>
              <option value="90">Expira em 90 dias</option>
              <option value="expirado">Expirado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ordenar por</label>
            <select value={filterOrdenar} onChange={e => setFilterOrdenar(e.target.value)}
              className="h-9 rounded-md border border-gray-200 text-sm bg-white px-3 min-w-[160px]">
              <option value="">Padrão</option>
              <option value="cliente_az">Cliente (A-Z)</option>
              <option value="validade_proximo">Validade (mais próximo)</option>
              <option value="valor_maior">Valor (maior)</option>
              <option value="dias_restantes">Dias restantes</option>
            </select>
          </div>
          <button onClick={() => { setFilterMarca(''); setFilterCliente(''); setFilterValidade(''); setFilterOrdenar('') }}
            className="text-xs text-gray-400 hover:text-gray-600 pb-2">
            Limpar filtros
          </button>
        </div>
      )}

      {/* Pipeline View */}
      {tipoFilter === 'PIPELINE' ? (
        <div className="space-y-3">
          {loadingPipeline ? (
            <div className="flex items-center justify-center h-32"><RefreshCw className="animate-spin text-nors-teal" size={24} /></div>
          ) : (pipelineItems && pipelineItems.length > 0) ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Viatura</th>
                    <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Status Pipeline</th>
                    <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Criado</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Origem CM</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineItems.map(p => {
                    const statusInfo = PIPELINE_STATUS_LABELS[p.status_pipeline] || { bg: 'bg-gray-100', text: 'text-gray-600', label: p.status_pipeline }
                    const daysSince = Math.floor((Date.now() - new Date(p.data_pipeline).getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <tr key={p.contrato_id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <Link to={`/contratos/${p.contrato_id}`} className="text-nors-teal hover:underline">
                            {p.cliente_nome?.split(' - ')[0] || '—'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {p.marca} {p.modelo || ''} — {p.matricula || p.vin?.slice(-6) || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {formatDate(p.data_pipeline)}
                          <span className="text-[10px] text-gray-400 ml-1">({daysSince}d)</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {p.origem_validade ? `CM expirou ${formatDate(p.origem_validade)}` : '—'}
                          {p.origem_valor_kz != null && <span className="text-[10px] text-gray-400 ml-1">({formatKZ(p.origem_valor_kz)})</span>}
                        </td>
                        <td className="px-2 py-3 text-center">
                          {p.status_pipeline === 'PENDENTE_PROPOSTA' && (
                            <button
                              onClick={() => handleDeleteDraft(p.contrato_id)}
                              title="Eliminar draft"
                              className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
              <p className="text-sm text-gray-500">Nenhum item no pipeline</p>
            </div>
          )}
        </div>
      ) : (
        /* Grouped cards */
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
                  <span className="text-sm text-gray-500 flex-shrink-0">
                    {group.totalViaturas} viatura{group.totalViaturas !== 1 ? 's' : ''} · {group.totalReceitaUSD > 0 ? `${formatUSD(group.totalReceitaUSD)}/mês` : ''}{group.totalValorKZ > 0 ? formatKZ(group.totalValorKZ) : ''}
                  </span>
                </button>

                {/* Table */}
                {!isCollapsed && (
                  <>
                  <div className="px-4 py-1.5 text-xs text-gray-400">
                    {group.contratos.length} contratos{(group.statusCounts['ATIVO'] || 0) > 0 ? `: ${group.statusCounts['ATIVO']} activos` : ''}
                    {(group.statusCounts['A RENOVAR'] || 0) > 0 ? `, ${group.statusCounts['A RENOVAR']} a renovar` : ''}
                    {(group.statusCounts['CORTESIA'] || 0) > 0 ? `, ${group.statusCounts['CORTESIA']} cortesia` : ''}
                    {(group.statusCounts['EXPIRADO'] || 0) > 0 ? `, ${group.statusCounts['EXPIRADO']} expirados` : ''}
                    {(group.statusCounts['FECHADO'] || 0) > 0 ? `, ${group.statusCounts['FECHADO']} fechados` : ''}
                  </div>
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
                  </>
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
      )}

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
