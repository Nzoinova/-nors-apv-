import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, Pencil, X, Save } from 'lucide-react'
import { getOS, updateOS } from '@/services/service-orders'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatDate, formatNumber, formatKZ, formatHorasMotor, formatHorasMotorCompleto } from '@/utils/formatters'
import { CICLO_DONGFENG, TIPOS_REVISAO, STATUS_OS, LOCALIZACOES, TIPOS_OS, OS_PREFIXES } from '@/utils/constants'

export default function ServiceOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { data: os, isLoading } = useQuery({
    queryKey: ['os', id],
    queryFn: () => getOS(id!),
    enabled: !!id,
  })

  const [editNumeroOS, setEditNumeroOS] = useState('')
  const [editDataOS, setEditDataOS] = useState('')
  const [editTipoRevisao, setEditTipoRevisao] = useState('')
  const [editKm, setEditKm] = useState('')
  const [editHorasMotor, setEditHorasMotor] = useState('')
  const [editDescricao, setEditDescricao] = useState('')
  const [editCustoKz, setEditCustoKz] = useState('')
  const [editTecnico, setEditTecnico] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editLocalizacao, setEditLocalizacao] = useState('')
  const [editTipoOS, setEditTipoOS] = useState('')
  const [editObs, setEditObs] = useState('')

  function startEdit() {
    if (!os) return
    setEditNumeroOS(os.numero_os)
    setEditDataOS(os.data_os)
    setEditTipoRevisao(os.tipo_revisao)
    setEditKm(os.km_na_revisao.toString())
    setEditHorasMotor(os.horas_motor_na_revisao?.toString() || '')
    setEditDescricao(os.descricao_servico || '')
    setEditCustoKz(os.custo_kz?.toString() || '')
    setEditTecnico(os.tecnico || '')
    setEditStatus(os.status)
    setEditLocalizacao(os.localizacao || 'Luanda')
    setEditTipoOS(os.tipo_os || 'Cliente')
    setEditObs(os.observacoes || '')
    setEditing(true)
  }

  const mutation = useMutation({
    mutationFn: (updates: Record<string, unknown>) => updateOS(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os', id] })
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      queryClient.invalidateQueries({ queryKey: ['estado-contratos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
      setEditing(false)
      setShowConfirm(false)
    },
  })

  function handleSave() {
    mutation.mutate({
      numero_os: editNumeroOS,
      data_os: editDataOS,
      tipo_revisao: editTipoRevisao,
      km_na_revisao: parseInt(editKm) || os!.km_na_revisao,
      horas_motor_na_revisao: editHorasMotor ? parseInt(editHorasMotor) : null,
      descricao_servico: editDescricao || null,
      custo_kz: editCustoKz ? parseFloat(editCustoKz) : null,
      tecnico: editTecnico || null,
      status: editStatus,
      localizacao: editLocalizacao,
      tipo_os: editTipoOS,
      observacoes: editObs || null,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-nors-teal" size={24} />
      </div>
    )
  }

  if (!os) {
    return <p className="text-nors-dark-gray">Ordem de serviço não encontrada.</p>
  }

  const viatura = os.viatura as any
  const osPrefix = OS_PREFIXES[os.localizacao]?.[os.tipo_os] || ''
  const editPrefix = OS_PREFIXES[editLocalizacao]?.[editTipoOS] || ''
  const horasMotorEdit = editHorasMotor ? Math.floor(parseInt(editHorasMotor) / 3600) : null

  const statusColor =
    os.status === 'Concluída' ? 'bg-emerald-50 text-emerald-700' :
    os.status === 'Em Curso' ? 'bg-blue-50 text-blue-700' :
    os.status === 'Cancelada' ? 'bg-red-50 text-red-700' :
    'bg-gray-100 text-gray-600'

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={showConfirm}
        title="Guardar alterações?"
        message="Tem a certeza que deseja guardar as alterações à ordem de serviço?"
        confirmLabel="Guardar"
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
      />

      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-nors-teal hover:underline">
        <ArrowLeft size={16} /> Voltar a Ordens de Serviço
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">OS {os.numero_os}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {viatura?.matricula || viatura?.vin} — {viatura?.marca} — {viatura?.cliente?.nome?.split(' - ')[0] || ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{os.status}</span>
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

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Identificação</h3>
          <div className="space-y-2 text-sm">
            {editing ? (
              <>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 text-xs">Localização</span>
                  <select value={editLocalizacao} onChange={(e) => setEditLocalizacao(e.target.value)} className="w-28 px-2 py-1 rounded border border-gray-200 focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20 text-xs focus:outline-none">
                    {LOCALIZACOES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 text-xs">Tipo OS</span>
                  <select value={editTipoOS} onChange={(e) => setEditTipoOS(e.target.value)} className="w-28 px-2 py-1 rounded border border-gray-200 focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20 text-xs focus:outline-none">
                    {TIPOS_OS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 text-xs">Nº OS</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-nors-teal">{editPrefix}</span>
                    <input type="text" value={editNumeroOS} onChange={(e) => setEditNumeroOS(e.target.value)} className="w-24 px-2 py-1 rounded border border-gray-200 focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20 text-xs text-right focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 text-xs">Data</span>
                  <input type="date" value={editDataOS} onChange={(e) => setEditDataOS(e.target.value)} className="w-32 px-2 py-1 rounded border border-gray-200 focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20 text-xs focus:outline-none" />
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 text-xs">Status</span>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-28 px-2 py-1 rounded border border-gray-200 focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20 text-xs focus:outline-none">
                    {STATUS_OS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <>
                <Row label="Nº OS" value={os.numero_os} bold />
                <Row label="Data" value={formatDate(os.data_os)} />
                <Row label="Localização" value={os.localizacao || '—'} />
                <Row label="Tipo" value={os.tipo_os || '—'} />
                <Row label="Prefixo" value={osPrefix || '—'} />
                <Row label="Status" value={os.status} />
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Serviço</h3>
          <div className="space-y-2 text-sm">
            {editing ? (
              <>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 text-xs">Tipo Revisão</span>
                  <select value={editTipoRevisao} onChange={(e) => { setEditTipoRevisao(e.target.value); setEditDescricao(TIPOS_REVISAO[e.target.value] || editDescricao) }} className="w-28 px-2 py-1 rounded border border-gray-200 focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20 text-xs focus:outline-none">
                    {CICLO_DONGFENG.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <EditRow label="Descrição" value={editDescricao} onChange={setEditDescricao} wide />
                <EditRow label="Técnico" value={editTecnico} onChange={setEditTecnico} />
              </>
            ) : (
              <>
                <Row label="Tipo Revisão" value={os.tipo_revisao} bold />
                <Row label="Descrição" value={os.descricao_servico || TIPOS_REVISAO[os.tipo_revisao] || '—'} />
                <Row label="Técnico" value={os.tecnico || '—'} />
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Medições & Valor Faturado</h3>
          <div className="space-y-2 text-sm">
            {editing ? (
              <>
                <EditRow label="KM na Revisão" value={editKm} onChange={setEditKm} type="number" />
                <EditRow label="Horas Motor (s)" value={editHorasMotor} onChange={setEditHorasMotor} type="number" />
                {horasMotorEdit !== null && (
                  <p className="text-[10px] text-nors-teal font-semibold text-right">= {horasMotorEdit.toLocaleString()} horas</p>
                )}
                <EditRow label="Valor Faturado (s/ IVA)" value={editCustoKz} onChange={setEditCustoKz} type="number" />
              </>
            ) : (
              <>
                <Row label="KM na Revisão" value={formatNumber(os.km_na_revisao)} bold />
                <Row label="Horas Motor" value={formatHorasMotorCompleto(os.horas_motor_na_revisao)} />
                <Row label="Valor Faturado (s/ IVA)" value={os.custo_kz ? formatKZ(os.custo_kz) : '—'} />
              </>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Observações</h3>
          <textarea value={editObs} onChange={(e) => setEditObs(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20" />
        </div>
      ) : os.observacoes ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Observações</h3>
          <p className="text-sm font-light">{os.observacoes}</p>
        </div>
      ) : null}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Viatura</h3>
          {viatura && (
            <Link to={`/viaturas/${viatura.id}`} className="text-xs text-nors-teal hover:underline font-semibold">Ver detalhe →</Link>
          )}
        </div>
        <div className="grid grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Matrícula</p>
            <p className="font-semibold text-xs">{viatura?.matricula || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">VIN</p>
            <p className="font-mono text-xs">{viatura?.vin || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Marca</p>
            <p className="text-xs">{viatura?.marca || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Cliente</p>
            <p className="text-xs">{viatura?.cliente?.nome?.split(' - ')[0] || '—'}</p>
          </div>
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

function EditRow({ label, value, onChange, type = 'text', wide }: { label: string; value: string; onChange: (v: string) => void; type?: string; wide?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-gray-500 text-xs whitespace-nowrap">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`${wide ? 'w-40' : 'w-28'} px-2 py-1 rounded border border-gray-200 focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20 text-xs text-right focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20`} />
    </div>
  )
}
