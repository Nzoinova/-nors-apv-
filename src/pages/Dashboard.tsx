import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FileText, DollarSign, AlertTriangle, Users, Truck,
  RefreshCw, Plus, Clock, CheckCircle, XCircle,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { getKPIs, getAlertas, getEstadoContratos } from '@/services/dashboard'
import { getConfig } from '@/services/config'
import { KPICard } from '@/components/shared/KPICard'
import { StatusBadge, PrioridadeBadge } from '@/components/shared/StatusBadge'
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

  const receitaPorCliente = useMemo(() => {
    if (!contratos) return []
    const agrupado: Record<string, number> = {}
    contratos
      .filter(c => c.tipo_contrato === 'APV' && c.valor_mensal_usd && c.valor_mensal_usd > 0)
      .forEach(c => {
        const nome = c.cliente_nome.split(' - ')[0]
        agrupado[nome] = (agrupado[nome] || 0) + c.valor_mensal_usd!
      })
    return Object.entries(agrupado)
      .map(([nome, valor]) => ({ nome, valor: Math.round(valor) }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8)
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
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-sm font-light text-nors-dark-gray mt-1">
            Visão geral dos contratos de manutenção APV
          </p>
        </div>
        <div className="flex items-center gap-3">
          {config && (
            <div className="text-right text-xs font-light text-nors-dark-gray">
              <p>Câmbio: <span className="font-semibold">{formatNumber(config.taxa_cambio_usd_kz)} KZ/USD</span></p>
              <p>{formatDate(config.data_atualizacao_taxa)}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Link to="/contratos/novo" className="inline-flex items-center gap-1.5 bg-nors-teal text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-nors-teal/90 transition-colors">
              <Plus size={12} /> Contrato
            </Link>
            <Link to="/viaturas/nova" className="inline-flex items-center gap-1.5 bg-nors-off-black text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-nors-dark-gray transition-colors">
              <Plus size={12} /> Viatura
            </Link>
            <Link to="/os/nova" className="inline-flex items-center gap-1.5 border border-nors-light-gray px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-nors-off-white transition-colors">
              <Plus size={12} /> OS
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
        <div className="col-span-3 bg-white rounded-lg border border-nors-light-gray p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-3">Estado dos Contratos</h3>
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
                      contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #D6D6D6' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {statusData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] text-nors-dark-gray">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-gray-400">Sem dados</div>
          )}
        </div>

        {/* Revenue by Client */}
        <div className="col-span-5 bg-white rounded-lg border border-nors-light-gray p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-3">Receita Mensal por Cliente (USD)</h3>
          {receitaPorCliente.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={receitaPorCliente} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D6D6D6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#575757' }} tickFormatter={(v: number) => `$${v}`} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: '#575757' }} width={90} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'USD/Mês']}
                    contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #D6D6D6' }}
                  />
                  <Bar dataKey="valor" fill={CHART_TEAL} radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-gray-400">Sem dados de receita</div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="col-span-4 space-y-3">
          <div className="bg-white rounded-lg border border-nors-light-gray p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-3">Contratos por Marca</h3>
            <div className="space-y-2">
              {marcaDistribuicao.map((m) => {
                const total = contratos?.length || 1
                const pct = Math.round((m.count / total) * 100)
                return (
                  <div key={m.marca} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold">{m.marca}</span>
                      <span className="text-nors-dark-gray">{m.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-nors-off-white rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CHART_TEAL }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {kpis && (
            <div className="bg-nors-off-black rounded-lg p-4 text-white">
              <h3 className="text-xs font-light uppercase tracking-wide text-nors-light-gray-2 mb-2">Projecção Anual</h3>
              <p className="text-xl font-extrabold tracking-tight">{formatUSD(kpis.receita_mensal_usd * 12)}</p>
              <p className="text-xs font-light text-nors-light-gray-2 mt-1">{formatKZ(kpis.receita_mensal_kz * 12)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Alerts + Contracts Table */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-nors-dark-gray">Alertas</h2>
            {allAlertas.length > 0 && (
              <span className="text-[10px] text-nors-dark-gray font-light">{allAlertas.length} activo(s)</span>
            )}
          </div>
          
          {allAlertas.length === 0 ? (
            <div className="bg-white rounded-lg border border-nors-light-gray p-6 text-center">
              <CheckCircle size={24} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-light text-nors-dark-gray">Tudo em ordem</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {allAlertas.map((alerta, i) => (
                <Link
                  key={i}
                  to={`/contratos/${alerta.referencia_id}`}
                  className="block bg-white rounded-lg border border-nors-light-gray p-3 hover:border-nors-teal/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-nors-black truncate">{alerta.descricao}</p>
                      <p className="text-[10px] font-light text-nors-dark-gray mt-0.5 line-clamp-2">{alerta.detalhe}</p>
                    </div>
                    <PrioridadeBadge prioridade={alerta.prioridade} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-nors-dark-gray">
              Contratos ({contratos?.length || 0})
            </h2>
            <Link to="/contratos" className="text-xs text-nors-teal hover:underline font-semibold">
              Ver todos →
            </Link>
          </div>

          <div className="bg-white rounded-lg border border-nors-light-gray overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-nors-black text-white text-xs font-extrabold uppercase">
                  <th className="text-left px-3 py-2.5">Cliente</th>
                  <th className="text-left px-3 py-2.5">Matrícula</th>
                  <th className="text-left px-3 py-2.5">Marca</th>
                  <th className="text-right px-3 py-2.5">USD/Mês</th>
                  <th className="text-center px-3 py-2.5">Validade</th>
                  <th className="text-center px-3 py-2.5">Dias</th>
                  <th className="text-center px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nors-light-gray">
                {(contratos || []).slice(0, 12).map((c) => (
                  <tr key={c.contrato_id} className="hover:bg-nors-off-white even:bg-nors-off-white/50">
                    <td className="px-3 py-2 text-xs truncate max-w-[140px]">
                      <Link to={`/contratos/${c.contrato_id}`} className="font-semibold text-nors-teal hover:underline">
                        {c.cliente_nome.split(' - ')[0]}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-xs font-mono">
                      {c.matricula || <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-3 py-2 text-xs">{c.marca}</td>
                    <td className="px-3 py-2 text-xs text-right font-semibold">
                      {c.valor_mensal_usd ? formatUSD(c.valor_mensal_usd) : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-center">{formatDate(c.data_validade)}</td>
                    <td className="px-3 py-2 text-xs text-center">
                      <span className={`font-semibold ${
                        c.dias_ate_expiracao < 0 ? 'text-red-600' :
                        c.dias_ate_expiracao <= 60 ? 'text-amber-600' :
                        'text-nors-dark-gray'
                      }`}>
                        {c.dias_ate_expiracao}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge status={c.status_contrato} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
