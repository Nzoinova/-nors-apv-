import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FileText, DollarSign, AlertTriangle, Users, Truck,
  RefreshCw, Plus, Clock, CheckCircle, XCircle, ChevronRight,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getKPIs, getAlertas, getEstadoContratos } from '@/services/dashboard'
import { getConfig } from '@/services/config'
import { KPICard } from '@/components/shared/KPICard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatUSD, formatKZ, formatDate, formatNumber } from '@/utils/formatters'

const STATUS_COLORS: Record<string, string> = {
  ATIVO: '#415A67',
  'A RENOVAR': '#B2A06E',
  EXPIRADO: '#956C6D',
  CORTESIA: '#3B82F6',
  FECHADO: '#6B7280',
}

const STATUS_LABELS: Record<string, string> = {
  ATIVO: 'Activos',
  'A RENOVAR': 'A Renovar',
  EXPIRADO: 'Expirados',
  CORTESIA: 'Cortesia',
  FECHADO: 'Fechados',
}

const CHART_TEAL = '#415A67'

export default function Dashboard() {
  const { data: kpis, isLoading: loadingKPIs } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: getKPIs,
  })

  const { data: alertas } = useQuery({
    queryKey: ['alertas'],
    queryFn: getAlertas,
  })

  const { data: contratos } = useQuery({
    queryKey: ['estado-contratos'],
    queryFn: getEstadoContratos,
  })

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  })

  const statusData = useMemo(() => {
    if (!contratos) return []
    const counts: Record<string, number> = {}
    contratos.forEach(c => {
      counts[c.status_contrato] = (counts[c.status_contrato] || 0) + 1
    })
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([status, value]) => ({
        name: STATUS_LABELS[status] || status,
        value,
        color: STATUS_COLORS[status] || '#9CA3AF',
      }))
  }, [contratos])

  const calendarData = useMemo(() => {
    const MESES_PT = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ]
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const today = now.getDate()
    const monthLabel = `${MESES_PT[month]} ${year}`
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const expirationDays = new Set<number>()
    const expirations: { day: number; clienteNome: string; modelo: string | null; tipo: string; contratoId: string }[] = []

    if (contratos) {
      contratos.forEach(c => {
        if (!c.data_validade) return
        const d = new Date(c.data_validade)
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate()
          if (c.tipo_contrato === 'APV') {
            expirationDays.add(day)
          }
          expirations.push({
            day,
            clienteNome: c.cliente_nome.split(' - ')[0],
            modelo: c.modelo,
            tipo: c.tipo_contrato,
            contratoId: c.contrato_id,
          })
        }
      })
    }
    expirations.sort((a, b) => a.day - b.day)

    return { monthLabel, startOffset, daysInMonth, today, expirationDays, expirations }
  }, [contratos])

  const marcaDistribuicao = useMemo(() => {
    if (!contratos) return []
    const agrupado: Record<string, number> = {}
    contratos.forEach(c => {
      agrupado[c.marca] = (agrupado[c.marca] || 0) + 1
    })
    return Object.entries(agrupado)
      .map(([marca, count]) => ({ marca, count }))
      .sort((a, b) => b.count - a.count)
  }, [contratos])

  const topClientes = useMemo(() => {
    if (!contratos) return []
    const agrupado: Record<string, { clienteNome: string; viaturas: Set<string>; apvUsd: number; cmKz: number }> = {}
    contratos.forEach(c => {
      const key = c.cliente_id
      if (!agrupado[key]) {
        agrupado[key] = { clienteNome: c.cliente_nome.split(' - ')[0], viaturas: new Set(), apvUsd: 0, cmKz: 0 }
      }
      if (c.viatura_id) agrupado[key].viaturas.add(c.viatura_id)
      if (c.tipo_contrato === 'APV' && c.valor_mensal_usd) agrupado[key].apvUsd += c.valor_mensal_usd
      if (c.tipo_contrato === 'CM' && c.valor_total_kz) agrupado[key].cmKz += c.valor_total_kz
    })
    return Object.entries(agrupado)
      .map(([id, d]) => ({ clienteId: id, clienteNome: d.clienteNome, veiculos: d.viaturas.size, apvUsd: d.apvUsd, cmKz: d.cmKz, sortValue: d.apvUsd + d.cmKz / 12 }))
      .filter(g => g.sortValue > 0)
      .sort((a, b) => b.sortValue - a.sortValue)
      .slice(0, 5)
  }, [contratos])

  const contratosProximos = useMemo(() => {
    if (!contratos) return []
    return contratos
      .filter(c => c.tipo_contrato === 'APV' && c.status_contrato !== 'FECHADO')
      .sort((a, b) => a.dias_ate_expiracao - b.dias_ate_expiracao)
      .slice(0, 5)
  }, [contratos])

  if (loadingKPIs) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-nors-teal" size={24} />
      </div>
    )
  }

  const alertasAlta = alertas?.filter(a => a.prioridade === 'ALTA') || []
  const alertasMedia = alertas?.filter(a => a.prioridade === 'MEDIA') || []
  const alertasInfo = alertas?.filter(a => a.prioridade === 'INFO') || []
  const allAlertas = [...alertasAlta, ...alertasMedia, ...alertasInfo]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visão geral dos contratos de manutenção APV
          </p>
        </div>
        <div className="flex items-center gap-3">
          {config && (
            <div className="text-right text-xs text-gray-500">
              <p>Câmbio: <span className="font-semibold text-gray-900">{formatNumber(config.taxa_cambio_usd_kz)} KZ/USD</span></p>
              <p>{formatDate(config.data_atualizacao_taxa)}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Link to="/contratos/novo" className="inline-flex items-center gap-1.5 bg-nors-teal text-white h-10 px-4 rounded-md text-sm font-medium hover:opacity-90">
              <Plus size={14} /> Contrato
            </Link>
            <Link to="/viaturas/nova" className="inline-flex items-center gap-1.5 bg-white text-gray-700 h-10 px-4 rounded-md text-sm font-medium border border-gray-200 hover:bg-gray-50">
              <Plus size={14} /> Viatura
            </Link>
            <Link to="/os/nova" className="inline-flex items-center gap-1.5 bg-white text-gray-700 h-10 px-4 rounded-md text-sm font-medium border border-gray-200 hover:bg-gray-50">
              <Plus size={14} /> OS
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-6 gap-3">
          <KPICard title="Contratos Activos" value={kpis.contratos_ativos} subtitle={`${kpis.total_contratos} total`} icon={CheckCircle} accent />
          <KPICard title="A Renovar" value={kpis.contratos_a_renovar} subtitle="Próx. 60 dias" icon={Clock} />
          <KPICard title="Expirados" value={kpis.contratos_expirados} subtitle="Acção necessária" icon={XCircle} />
          <KPICard title="Receita Mensal" value={formatUSD(kpis.receita_mensal_usd)} subtitle={formatKZ(kpis.receita_mensal_kz)} icon={DollarSign} accent />
          <KPICard title="Clientes" value={kpis.total_clientes} subtitle={`${kpis.total_marcas} marca(s)`} icon={Users} />
          <KPICard title="Alertas" value={alertasAlta.length} subtitle={`${allAlertas.length} total`} icon={AlertTriangle} />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Status Distribution Donut */}
        <div className="col-span-3 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Estado dos Contratos</h3>
          </div>
          <div className="p-5">
            {statusData.length > 0 ? (
              <>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} contrato(s)`, '']}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {statusData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] text-gray-500">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-gray-400">Sem dados</div>
            )}
          </div>
        </div>

        {/* Calendar Widget */}
        <div className="col-span-5 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Calendário de Vencimentos</h3>
          </div>
          <div className="p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">{calendarData.monthLabel}</p>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calendarData.startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}
              {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                const day = i + 1
                const isToday = day === calendarData.today
                const hasExpiration = calendarData.expirationDays.has(day)
                return (
                  <div
                    key={day}
                    className={`h-8 flex flex-col items-center justify-center rounded text-xs ${isToday ? 'font-semibold' : ''}`}
                    style={isToday ? { backgroundColor: '#415A67' } : undefined}
                  >
                    <span className={isToday ? 'text-white' : 'text-gray-600 font-light'}>{day}</span>
                    {hasExpiration && <span className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: isToday ? '#fff' : '#415A67' }} />}
                  </div>
                )
              })}
            </div>
            {calendarData.expirations.length > 0 ? (
              <div className="mt-4 space-y-1.5 max-h-24 overflow-y-auto">
                {calendarData.expirations.map((ev, i) => {
                  const isAPV = ev.tipo === 'APV'
                  return (
                    <Link
                      key={i}
                      to={`/contratos/${ev.contratoId}`}
                      className={`flex items-center gap-2 text-[11px] transition-colors ${
                        isAPV
                          ? 'text-gray-600 hover:text-nors-teal'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {isAPV && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#415A67' }} />}
                      <span className={`whitespace-nowrap ${isAPV ? 'font-semibold text-gray-900' : 'font-light text-gray-500'}`}>
                        {ev.day} {calendarData.monthLabel.split(' ')[0].slice(0, 3)}
                      </span>
                      <span className={`truncate ${isAPV ? '' : 'font-light'}`}>
                        {ev.clienteNome} ({ev.modelo || '—'})
                      </span>
                      <span className={`whitespace-nowrap ${isAPV ? 'text-gray-400' : 'text-gray-300'}`}>
                        — {ev.tipo} expira
                      </span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-xs text-gray-400 font-light text-center">Sem vencimentos este mês</p>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="col-span-4 space-y-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contratos por Marca</h3>
            </div>
            <div className="p-5 space-y-2">
              {marcaDistribuicao.map((m) => {
                const total = contratos?.length || 1
                const pct = Math.round((m.count / total) * 100)
                return (
                  <div key={m.marca} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-900">{m.marca}</span>
                      <span className="text-gray-500">{m.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CHART_TEAL }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {kpis && (
            <div className="bg-nors-off-black rounded-lg p-4 text-white shadow-sm">
              <h3 className="text-xs font-light uppercase tracking-wide text-gray-400 mb-2">Projecção Anual</h3>
              <p className="text-xl font-bold tracking-tight">{formatUSD(kpis.receita_mensal_usd * 12)}</p>
              <p className="text-xs font-light text-gray-400 mt-1">{formatKZ(kpis.receita_mensal_kz * 12)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Top Clients + Upcoming Expirations */}
      <div className="grid grid-cols-12 gap-4">
        {/* Top Clients Ranking */}
        <div className="col-span-7 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Top Clientes</h3>
          </div>
          <div className="p-5">
            {topClientes.length > 0 ? (
              <div className="space-y-4">
                {topClientes.map((client, i) => {
                  const maxValue = topClientes[0].sortValue
                  const barPct = maxValue > 0 ? Math.round((client.sortValue / maxValue) * 100) : 0
                  return (
                    <div key={client.clienteId} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg font-bold text-gray-300 w-6 text-right">{i + 1}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{client.clienteNome}</p>
                            <p className="text-[10px] font-light text-gray-400">
                              {client.veiculos} viatura{client.veiculos !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          {client.apvUsd > 0 && (
                            <p className="text-xs font-semibold text-gray-900">
                              {formatUSD(client.apvUsd)}<span className="text-gray-400 font-light">/mês</span>
                            </p>
                          )}
                          {client.cmKz > 0 && (
                            <p className="text-[10px] font-light text-gray-500">
                              {formatKZ(client.cmKz)} <span className="text-gray-400">(CM)</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-9 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: '#415A67' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-gray-400 font-light">Sem dados de clientes</div>
            )}
          </div>
        </div>

        {/* Upcoming Contract Expirations */}
        <div className="col-span-5 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contratos Próximos ao Vencimento</h3>
          </div>
          <div className="p-5">
            {contratosProximos.length > 0 ? (
              <div className="space-y-2">
                {contratosProximos.map(c => {
                  const isOverdue = c.dias_ate_expiracao < 0
                  const isUrgent = c.dias_ate_expiracao >= 0 && c.dias_ate_expiracao < 30
                  const borderColor = isOverdue ? '#ef4444' : isUrgent ? '#f59e0b' : '#415A67'
                  const daysColor = isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-gray-600'
                  return (
                    <Link
                      key={c.contrato_id}
                      to={`/contratos/${c.contrato_id}`}
                      className="block rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
                      style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-gray-900 truncate">{c.cliente_nome.split(' - ')[0]}</p>
                            <StatusBadge status={c.status_contrato} />
                          </div>
                          <p className="text-[10px] font-light text-gray-500 mt-0.5">
                            {c.modelo || c.marca} · {c.matricula || c.vin?.slice(-6)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p className={`text-sm font-bold ${daysColor}`}>{c.dias_ate_expiracao}d</p>
                            <p className="text-[9px] font-light text-gray-400">{formatDate(c.data_validade)}</p>
                          </div>
                          <ChevronRight size={14} className="text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-gray-400 font-light">Sem contratos próximos ao vencimento</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
