import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, Pencil, X, Save } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getViatura, updateViatura } from '@/services/vehicles'
import { getOSByViatura } from '@/services/service-orders'
import { supabase } from '@/lib/supabase'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatNumber, formatDate, formatHorasMotor, formatHorasMotorCompleto, formatKZ } from '@/utils/formatters'
import { TIPOS_REVISAO, MARCAS, MODELOS_POR_MARCA } from '@/utils/constants'

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { data: viatura, isLoading } = useQuery({
    queryKey: ['viatura', id],
    queryFn: () => getViatura(id!),
    enabled: !!id,
  })

  const { data: ordensServico } = useQuery({
    queryKey: ['os-viatura', id],
    queryFn: () => getOSByViatura(id!),
    enabled: !!id,
  })

  const { data: kmHistory } = useQuery({
    queryKey: ['km-history', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('id, numero_os, data_os, tipo_revisao, km_na_revisao')
        .eq('viatura_id', id!)
        .not('km_na_revisao', 'is', null)
        .order('data_os', { ascending: true })
      if (error) throw error
      return data || []
    },
    enabled: !!id,
  })

  const { data: apvContract } = useQuery({
    queryKey: ['apv-km-target', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos')
        .select('km_anuais')
        .eq('viatura_id', id!)
        .eq('tipo_contrato', 'APV')
        .eq('status_contrato', 'ACTIVO')
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const kmMetrics = useMemo(() => {
    if (!kmHistory || kmHistory.length < 2) return null
    const last = kmHistory[kmHistory.length - 1]
    const prev = kmHistory[kmHistory.length - 2]
    const daysBetween = (new Date(last.data_os).getTime() - new Date(prev.data_os).getTime()) / (1000 * 60 * 60 * 24)
    if (daysBetween <= 0) return null
    const ritmoActual = ((last.km_na_revisao! - prev.km_na_revisao!) / daysBetween) * 30
    return { ritmoActual }
  }, [kmHistory])

  const kmContratadoMensal = apvContract?.km_anuais ? apvContract.km_anuais / 12 : null

  const [editMatricula, setEditMatricula] = useState('')
  const [editMarca, setEditMarca] = useState('')
  const [editModelo, setEditModelo] = useState('')
  const [editAno, setEditAno] = useState('')
  const [editKmInicial, setEditKmInicial] = useState('')
  const [editHorasMotor, setEditHorasMotor] = useState('')
  const [editModeloCustom, setEditModeloCustom] = useState(false)

  function startEdit() {
    if (!viatura) return
    setEditMatricula(viatura.matricula || '')
    setEditMarca(viatura.marca)
    setEditModelo(viatura.modelo || '')
    setEditAno(viatura.ano?.toString() || '')
    setEditKmInicial(viatura.km_inicial?.toString() || '')
    setEditHorasMotor(viatura.horas_motor_segundos?.toString() || '')
    const modelos = MODELOS_POR_MARCA[viatura.marca]
    setEditModeloCustom(!modelos || !modelos.includes(viatura.modelo || ''))
    setEditing(true)
  }

  const mutation = useMutation({
    mutationFn: (updates: Record<string, unknown>) => updateViatura(id!, updates as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viatura', id] })
      queryClient.invalidateQueries({ queryKey: ['viaturas'] })
      queryClient.invalidateQueries({ queryKey: ['estado-contratos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
      setEditing(false)
      setShowConfirm(false)
    },
  })

  function handleSave() {
    mutation.mutate({
      matricula: editMatricula || null,
      marca: editMarca,
      modelo: editModelo || null,
      ano: editAno ? parseInt(editAno) : null,
      km_inicial: editKmInicial ? parseInt(editKmInicial) : null,
      horas_motor_segundos: editHorasMotor ? parseInt(editHorasMotor) : null,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-nors-teal" size={24} />
      </div>
    )
  }

  if (!viatura) {
    return <p className="text-nors-dark-gray">Viatura não encontrada.</p>
  }

  const horasMotorEdit = editHorasMotor ? Math.floor(parseInt(editHorasMotor) / 3600) : null

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={showConfirm}
        title="Guardar alterações?"
        message="Tem a certeza que deseja guardar as alterações à viatura?"
        confirmLabel="Guardar"
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
      />

      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-nors-teal hover:underline">
        <ArrowLeft size={16} /> Voltar a Viaturas
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {viatura.matricula || 'Sem matrícula'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {viatura.marca} {viatura.modelo || ''} — {(viatura.cliente as any)?.nome?.split(' - ')[0] || ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!editing ? (
            <button onClick={startEdit} className="inline-flex items-center gap-1.5 bg-white text-gray-700 h-10 px-4 rounded-md text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors">
              <Pencil size={14} /> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 bg-white text-gray-700 h-10 px-4 rounded-md text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors">
                <X size={14} /> Cancelar
              </button>
              <button onClick={() => setShowConfirm(true)} disabled={mutation.isPending} className="inline-flex items-center gap-1.5 bg-nors-teal text-white h-10 px-4 rounded-md text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50">
                <Save size={14} /> {mutation.isPending ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {mutation.error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">Erro: {(mutation.error as Error).message}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Identificação</h3>
          <div className="space-y-2 text-sm">
            {editing ? (
              <>
                <EditRow label="Matrícula" value={editMatricula} onChange={(v) => setEditMatricula(v.toUpperCase())} />
                <Row label="VIN" value={viatura.vin} />
                <div className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 text-xs">Marca</span>
                  <select value={editMarca} onChange={(e) => { setEditMarca(e.target.value); setEditModelo(''); setEditModeloCustom(false) }} className="w-36 px-2 py-1 rounded border border-gray-200 focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20 text-xs focus:outline-none">
                    {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {MODELOS_POR_MARCA[editMarca] && !editModeloCustom ? (
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-gray-500 text-xs whitespace-nowrap">Modelo</span>
                    <select
                      value={editModelo}
                      onChange={(e) => {
                        if (e.target.value === '__outro__') {
                          setEditModelo('')
                          setEditModeloCustom(true)
                        } else {
                          setEditModelo(e.target.value)
                        }
                      }}
                      className="w-36 px-2 py-1 rounded border border-gray-200 focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20 text-xs focus:outline-none"
                    >
                      <option value="">Seleccionar...</option>
                      {MODELOS_POR_MARCA[editMarca].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value="__outro__">Outro...</option>
                    </select>
                  </div>
                ) : (
                  <EditRow label="Modelo" value={editModelo} onChange={setEditModelo} />
                )}
                <EditRow label="Ano" value={editAno} onChange={setEditAno} type="number" />
              </>
            ) : (
              <>
                <Row label="Matrícula" value={viatura.matricula || '—'} bold />
                <Row label="VIN" value={viatura.vin} />
                <Row label="Marca" value={viatura.marca} />
                <Row label="Modelo" value={viatura.modelo || '—'} />
                <Row label="Ano" value={viatura.ano?.toString() || '—'} />
                <Row label="Cliente" value={(viatura.cliente as any)?.nome || '—'} />
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Motor & Quilometragem</h3>
          <div className="space-y-2 text-sm">
            {editing ? (
              <>
                <EditRow label="KM Inicial" value={editKmInicial} onChange={setEditKmInicial} type="number" />
                <EditRow label="Horas Motor (s)" value={editHorasMotor} onChange={setEditHorasMotor} type="number" />
                {horasMotorEdit !== null && (
                  <p className="text-[10px] text-nors-teal font-semibold text-right">= {horasMotorEdit.toLocaleString()} horas</p>
                )}
              </>
            ) : (
              <>
                <Row label="KM Inicial" value={formatNumber(viatura.km_inicial)} bold />
                <Row label="Horas Motor" value={formatHorasMotorCompleto(viatura.horas_motor_segundos)} />
              </>
            )}
          </div>
        </div>
      </div>

      {kmHistory && kmHistory.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Quilometragem</h2>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={kmHistory}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="data_os" tickFormatter={(v) => formatDate(v)} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [formatNumber(value) + ' km', 'KM']}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Line type="monotone" dataKey="km_na_revisao" stroke="#415A67" strokeWidth={2} dot={{ fill: '#415A67', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex-1">
              <p className="text-xs text-gray-500 mb-1">Ritmo Actual</p>
              <p className="text-lg font-semibold">
                {kmMetrics ? formatNumber(Math.round(kmMetrics.ritmoActual)) + ' km/mês' : <span className="text-gray-400">—</span>}
              </p>
            </div>
            {kmContratadoMensal !== null && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex-1">
                <p className="text-xs text-gray-500 mb-1">KM Contratado</p>
                <p className="text-lg font-semibold">{formatNumber(Math.round(kmContratadoMensal))} km/mês</p>
              </div>
            )}
            {kmContratadoMensal !== null && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex-1">
                <p className="text-xs text-gray-500 mb-1">Estado</p>
                {!kmMetrics ? (
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-gray-100 text-gray-500 border-gray-200">Dados insuficientes</span>
                ) : kmMetrics.ritmoActual <= kmContratadoMensal ? (
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">Dentro do previsto</span>
                ) : kmMetrics.ritmoActual <= kmContratadoMensal * 1.15 ? (
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-100 text-amber-700 border-amber-200">Atenção</span>
                ) : (
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-red-100 text-red-700 border-red-200">Acima do contrato</span>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Nº OS</th>
                  <th className="text-left px-4 py-3">Tipo Revisão</th>
                  <th className="text-right px-4 py-3">KM</th>
                  <th className="text-right px-4 py-3">Variação</th>
                  <th className="text-right px-4 py-3">Dias desde anterior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...kmHistory].reverse().map((os, idx) => {
                  const reverseIdx = kmHistory.length - 1 - idx
                  const prev = reverseIdx > 0 ? kmHistory[reverseIdx - 1] : null
                  const variacao = prev ? os.km_na_revisao! - prev.km_na_revisao! : null
                  const dias = prev ? Math.round((new Date(os.data_os).getTime() - new Date(prev.data_os).getTime()) / (1000 * 60 * 60 * 24)) : null
                  return (
                    <tr key={os.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 text-xs">{formatDate(os.data_os)}</td>
                      <td className="px-4 py-2.5 text-xs font-mono">{os.numero_os}</td>
                      <td className="px-4 py-2.5 text-xs">{os.tipo_revisao}</td>
                      <td className="px-4 py-2.5 text-xs text-right">{formatNumber(os.km_na_revisao)}</td>
                      <td className="px-4 py-2.5 text-xs text-right">{variacao !== null ? `+${formatNumber(variacao)} km` : '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-right">{dias !== null ? dias : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Ordens de Serviço ({ordensServico?.length || 0})
          </h2>
          <Link to="/os/nova" className="text-xs text-nors-teal hover:underline font-semibold">+ Nova OS</Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="text-left px-4 py-3">Nº OS</th>
                <th className="text-center px-4 py-3">Data</th>
                <th className="text-center px-4 py-3">Tipo</th>
                <th className="text-right px-4 py-3">KM</th>
                <th className="text-right px-4 py-3">Motor</th>
                <th className="text-left px-4 py-3">Descrição</th>
                <th className="text-right px-4 py-3">Custo KZ</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(ordensServico || []).map((os) => (
                <tr key={os.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 text-xs font-mono">{os.numero_os}</td>
                  <td className="px-4 py-2.5 text-xs text-center">{formatDate(os.data_os)}</td>
                  <td className="px-4 py-2.5 text-xs text-center font-semibold">{os.tipo_revisao}</td>
                  <td className="px-4 py-2.5 text-xs text-right">{formatNumber(os.km_na_revisao)}</td>
                  <td className="px-4 py-2.5 text-xs text-right">{formatHorasMotor(os.horas_motor_na_revisao)}</td>
                  <td className="px-4 py-2.5 text-xs">{os.descricao_servico || TIPOS_REVISAO[os.tipo_revisao] || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-right">{os.custo_kz ? formatKZ(os.custo_kz) : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      os.status === 'Concluída' ? 'bg-emerald-50 text-emerald-700' :
                      os.status === 'Em Curso' ? 'bg-blue-50 text-blue-700' :
                      os.status === 'Cancelada' ? 'bg-red-50 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {os.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!ordensServico || ordensServico.length === 0) && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">Sem ordens de serviço</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  )
}

function EditRow({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-gray-500 text-xs whitespace-nowrap">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-36 px-2 py-1 rounded border border-gray-200 focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20 text-xs text-right focus:outline-none focus:ring-2 focus:ring-nors-teal/30" />
    </div>
  )
}
