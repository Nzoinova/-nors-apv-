import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, Pencil, X, Save } from 'lucide-react'
import { getViatura, updateViatura } from '@/services/vehicles'
import { getOSByViatura } from '@/services/service-orders'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatNumber, formatDate, formatHorasMotor, formatHorasMotorCompleto, formatKZ } from '@/utils/formatters'
import { TIPOS_REVISAO, MARCAS } from '@/utils/constants'

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
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

  const [editMatricula, setEditMatricula] = useState('')
  const [editMarca, setEditMarca] = useState('')
  const [editModelo, setEditModelo] = useState('')
  const [editAno, setEditAno] = useState('')
  const [editKmInicial, setEditKmInicial] = useState('')
  const [editHorasMotor, setEditHorasMotor] = useState('')

  function startEdit() {
    if (!viatura) return
    setEditMatricula(viatura.matricula || '')
    setEditMarca(viatura.marca)
    setEditModelo(viatura.modelo || '')
    setEditAno(viatura.ano?.toString() || '')
    setEditKmInicial(viatura.km_inicial?.toString() || '')
    setEditHorasMotor(viatura.horas_motor_segundos?.toString() || '')
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

      <Link to="/viaturas" className="inline-flex items-center gap-1.5 text-sm text-nors-teal hover:underline">
        <ArrowLeft size={16} /> Voltar a Viaturas
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {viatura.matricula || 'Sem matrícula'}
          </h1>
          <p className="text-sm font-light text-nors-dark-gray mt-1">
            {viatura.marca} {viatura.modelo || ''} — {(viatura.cliente as any)?.nome?.split(' - ')[0] || ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!editing ? (
            <button onClick={startEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-nors-light-gray hover:bg-nors-off-white transition-colors">
              <Pencil size={14} /> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-nors-light-gray hover:bg-nors-off-white transition-colors">
                <X size={14} /> Cancelar
              </button>
              <button onClick={() => setShowConfirm(true)} disabled={mutation.isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-nors-teal text-white hover:bg-nors-teal/90 transition-colors disabled:opacity-50">
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
        <div className="bg-white rounded-lg border border-nors-light-gray p-4 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray">Identificação</h3>
          <div className="space-y-2 text-sm">
            {editing ? (
              <>
                <EditRow label="Matrícula" value={editMatricula} onChange={(v) => setEditMatricula(v.toUpperCase())} />
                <Row label="VIN" value={viatura.vin} />
                <div className="flex justify-between items-center gap-3">
                  <span className="text-nors-dark-gray font-light text-xs">Marca</span>
                  <select value={editMarca} onChange={(e) => setEditMarca(e.target.value)} className="w-36 px-2 py-1 rounded border border-nors-teal/30 text-xs focus:outline-none">
                    {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <EditRow label="Modelo" value={editModelo} onChange={setEditModelo} />
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

        <div className="bg-white rounded-lg border border-nors-light-gray p-4 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray">Motor & Quilometragem</h3>
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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-nors-dark-gray">
            Ordens de Serviço ({ordensServico?.length || 0})
          </h2>
          <Link to="/os/nova" className="text-xs text-nors-teal hover:underline font-semibold">+ Nova OS</Link>
        </div>

        <div className="bg-white rounded-lg border border-nors-light-gray overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-nors-black text-white text-xs font-extrabold uppercase">
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
            <tbody className="divide-y divide-nors-light-gray">
              {(ordensServico || []).map((os) => (
                <tr key={os.id} className="hover:bg-nors-off-white even:bg-nors-off-white/50">
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
      <span className="text-nors-dark-gray font-light">{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  )
}

function EditRow({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-nors-dark-gray font-light text-xs whitespace-nowrap">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-36 px-2 py-1 rounded border border-nors-teal/30 text-xs text-right focus:outline-none focus:ring-2 focus:ring-nors-teal/30" />
    </div>
  )
}
