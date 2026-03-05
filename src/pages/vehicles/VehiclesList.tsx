import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw, Search, ChevronDown, ChevronRight } from 'lucide-react'
import { getViaturas } from '@/services/vehicles'
import { getEstadoContratos } from '@/services/dashboard'
import { formatNumber, formatHorasMotor } from '@/utils/formatters'
import type { Viatura, EstadoContrato } from '@/types'

interface VehicleGroup {
  clienteId: string
  clienteNome: string
  vehicles: Viatura[]
  brands: string[]
}

export default function VehiclesList() {
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState<string>('ALL')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const initialCollapseSet = useRef(false)

  const { data: viaturas, isLoading } = useQuery({
    queryKey: ['viaturas'],
    queryFn: getViaturas,
  })

  const { data: contratos } = useQuery({
    queryKey: ['estado-contratos'],
    queryFn: getEstadoContratos,
  })

  // Build a map of viatura_id -> contract info
  const contractMap = useMemo(() => {
    const map = new Map<string, { tipo: string; status: string }>()
    if (!contratos) return map
    contratos.forEach((c: EstadoContrato) => {
      // Keep first match (or overwrite — one vehicle can have multiple contracts, keep latest)
      map.set(c.viatura_id, { tipo: c.tipo_contrato, status: c.status_contrato })
    })
    return map
  }, [contratos])

  // Filter vehicles
  const filtered = useMemo(() => {
    return (viaturas || []).filter(v => {
      if (brandFilter !== 'ALL' && v.marca !== brandFilter) return false
      if (search) {
        const s = search.toLowerCase()
        const clienteNome = (v.cliente as any)?.nome || ''
        return (
          (v.matricula || '').toLowerCase().includes(s) ||
          v.vin.toLowerCase().includes(s) ||
          (v.modelo || '').toLowerCase().includes(s) ||
          clienteNome.toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [viaturas, brandFilter, search])

  // Group by client
  const groups = useMemo((): VehicleGroup[] => {
    const map = new Map<string, VehicleGroup>()
    filtered.forEach(v => {
      const cliente = v.cliente as any
      const clienteId = v.cliente_id || 'sem-cliente'
      const clienteNome = cliente?.nome || 'Sem Cliente'
      if (!map.has(clienteId)) {
        map.set(clienteId, {
          clienteId,
          clienteNome,
          vehicles: [],
          brands: [],
        })
      }
      const g = map.get(clienteId)!
      g.vehicles.push(v)
      if (!g.brands.includes(v.marca)) g.brands.push(v.marca)
    })
    // Sort vehicles within each group by matricula
    map.forEach(g => {
      g.vehicles.sort((a, b) => (a.matricula || '').localeCompare(b.matricula || ''))
      g.brands.sort()
    })
    return Array.from(map.values()).sort((a, b) => a.clienteNome.localeCompare(b.clienteNome))
  }, [filtered])

  // Initialize all groups as collapsed
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

  // Brand counts for filter tabs
  const brandCounts = useMemo(() => {
    const all = viaturas || []
    return {
      ALL: all.length,
      Dongfeng: all.filter(v => v.marca === 'Dongfeng').length,
      Volvo: all.filter(v => v.marca === 'Volvo').length,
    }
  }, [viaturas])

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
          <h1 className="text-2xl font-bold tracking-tight">Viaturas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} viaturas registadas
          </p>
        </div>
        <Link to="/viaturas/nova" className="inline-flex items-center gap-2 bg-nors-teal text-white h-10 px-4 rounded-md text-sm font-medium hover:opacity-90">
          <Plus size={16} /> Nova Viatura
        </Link>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Brand filter tabs */}
        <div className="flex items-center gap-1">
          {(['ALL', 'Dongfeng', 'Volvo'] as const).map(b => (
            <button key={b} onClick={() => setBrandFilter(b)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 ${brandFilter === b ? 'bg-nors-off-black text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              {b === 'ALL' ? 'Todas' : b}
              <span className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center ${brandFilter === b ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {brandCounts[b]}
              </span>
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20" />
        </div>

        {/* Expand/Collapse toggle */}
        <button onClick={toggleCollapseAll} className="bg-white text-gray-700 h-10 px-4 rounded-md text-sm font-medium border border-gray-200 hover:bg-gray-50">
          {collapsed.size === groups.length ? 'Expandir' : 'Colapsar'}
        </button>
      </div>

      {/* Grouped cards */}
      <div className="space-y-3">
        {groups.map(group => {
          const isCollapsed = collapsed.has(group.clienteId)
          return (
            <div key={group.clienteId} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              {/* Group Header */}
              <button onClick={() => toggleCollapse(group.clienteId)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/30 border-b border-gray-100 cursor-pointer text-left">
                {isCollapsed
                  ? <ChevronRight size={16} className="text-gray-400 flex-shrink-0 transition-transform" />
                  : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 transition-transform" />}
                <span className="text-base font-semibold text-gray-900 flex-1 min-w-0 truncate">
                  {group.clienteNome.split(' - ')[0]}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {group.brands.map(b => (
                    <span key={b} className="bg-gray-100 rounded-full px-2 py-0.5 text-xs text-gray-600">{b}</span>
                  ))}
                  <span className="text-sm text-gray-500">
                    {group.vehicles.length} viatura{group.vehicles.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>

              {/* Table */}
              {!isCollapsed && (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">Matrícula</th>
                      <th className="text-left px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">VIN</th>
                      <th className="text-left px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">Modelo</th>
                      <th className="text-right px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">KM Inicial</th>
                      <th className="text-right px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">Horas Motor</th>
                      <th className="text-center px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">Contrato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.vehicles.map(v => {
                      const contract = contractMap.get(v.id)
                      return (
                        <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-2.5">
                            <Link to={`/viaturas/${v.id}`} className="font-medium text-gray-900 hover:underline" style={{ color: v.matricula ? undefined : undefined }}>
                              {v.matricula
                                ? <span>{v.matricula}</span>
                                : <span className="text-gray-400 italic">Sem matrícula</span>}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-400 font-mono" title={v.vin}>
                            {v.vin.length > 8 ? '…' + v.vin.slice(-8) : v.vin}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-600">{v.modelo || '—'}</td>
                          <td className="px-4 py-2.5 text-sm text-right text-gray-600">
                            {v.km_inicial != null ? formatNumber(v.km_inicial) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-right text-gray-600">
                            {v.horas_motor_segundos != null ? formatHorasMotor(v.horas_motor_segundos) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {contract ? (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                                style={contract.tipo === 'APV'
                                  ? { backgroundColor: '#415A67', color: 'white' }
                                  : { backgroundColor: '#F2F2F2', color: '#575757' }}>
                                {contract.tipo}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}

        {groups.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-500">Nenhuma viatura encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}
