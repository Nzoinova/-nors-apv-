import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, Pencil, X, Save } from 'lucide-react'
import { getCliente, updateCliente } from '@/services/clients'
import { getViaturasByCliente } from '@/services/vehicles'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatNumber, formatHorasMotor, formatUSD } from '@/utils/formatters'

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { data: cliente, isLoading } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => getCliente(id!),
    enabled: !!id,
  })

  const { data: viaturas } = useQuery({
    queryKey: ['viaturas-cliente', id],
    queryFn: () => getViaturasByCliente(id!),
    enabled: !!id,
  })

  const [editNome, setEditNome] = useState('')
  const [editNif, setEditNif] = useState('')
  const [editContacto, setEditContacto] = useState('')
  const [editTelefone, setEditTelefone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editEndereco, setEditEndereco] = useState('')

  function startEdit() {
    if (!cliente) return
    setEditNome(cliente.nome)
    setEditNif(cliente.nif || '')
    setEditContacto(cliente.contacto || '')
    setEditTelefone(cliente.telefone || '')
    setEditEmail(cliente.email || '')
    setEditEndereco(cliente.endereco || '')
    setEditing(true)
  }

  const mutation = useMutation({
    mutationFn: (updates: Record<string, unknown>) => updateCliente(id!, updates as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente', id] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['resumo-clientes'] })
      queryClient.invalidateQueries({ queryKey: ['estado-contratos'] })
      setEditing(false)
      setShowConfirm(false)
    },
  })

  function handleSave() {
    if (!editNome.trim()) return
    mutation.mutate({
      nome: editNome.trim(),
      nif: editNif.trim() || null,
      contacto: editContacto.trim() || null,
      telefone: editTelefone.trim() || null,
      email: editEmail.trim() || null,
      endereco: editEndereco.trim() || null,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-nors-teal" size={24} />
      </div>
    )
  }

  if (!cliente) {
    return <p className="text-nors-dark-gray">Cliente não encontrado.</p>
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={showConfirm}
        title="Guardar alterações?"
        message="Tem a certeza que deseja guardar as alterações ao cliente?"
        confirmLabel="Guardar"
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
      />

      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-nors-teal hover:underline">
        <ArrowLeft size={16} /> Voltar a Clientes
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {cliente.nome.split(' - ')[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{cliente.nome}</p>
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
              <button onClick={() => setShowConfirm(true)} disabled={mutation.isPending || !editNome.trim()} className="inline-flex items-center gap-1.5 bg-nors-teal text-white h-10 px-4 rounded-md text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50">
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
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Dados do Cliente</h3>
          <div className="space-y-2 text-sm">
            {editing ? (
              <>
                <EditRow label="Nome" value={editNome} onChange={setEditNome} wide />
                <EditRow label="NIF" value={editNif} onChange={setEditNif} />
                <EditRow label="Contacto" value={editContacto} onChange={setEditContacto} />
              </>
            ) : (
              <>
                <Row label="Nome" value={cliente.nome} bold />
                <Row label="NIF" value={cliente.nif || '—'} />
                <Row label="Contacto" value={cliente.contacto || '—'} />
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Comunicação</h3>
          <div className="space-y-2 text-sm">
            {editing ? (
              <>
                <EditRow label="Telefone" value={editTelefone} onChange={setEditTelefone} />
                <EditRow label="Email" value={editEmail} onChange={setEditEmail} />
                <EditRow label="Endereço" value={editEndereco} onChange={setEditEndereco} wide />
              </>
            ) : (
              <>
                <Row label="Telefone" value={cliente.telefone || '—'} />
                <Row label="Email" value={cliente.email || '—'} />
                <Row label="Endereço" value={cliente.endereco || '—'} />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Viaturas ({viaturas?.length || 0})
          </h2>
          <Link to="/viaturas/nova" className="text-xs text-nors-teal hover:underline font-semibold">+ Nova Viatura</Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="text-left px-4 py-3">Matrícula</th>
                <th className="text-left px-4 py-3">VIN</th>
                <th className="text-left px-4 py-3">Marca</th>
                <th className="text-left px-4 py-3">Modelo</th>
                <th className="text-right px-4 py-3">KM Inicial</th>
                <th className="text-right px-4 py-3">Horas Motor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(viaturas || []).map((v) => (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 text-xs font-mono font-semibold">
                    <Link to={`/viaturas/${v.id}`} className="text-nors-teal hover:underline">
                      {v.matricula || 'Sem matrícula'}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono text-nors-dark-gray">{v.vin}</td>
                  <td className="px-4 py-2.5 text-xs">{v.marca}</td>
                  <td className="px-4 py-2.5 text-xs">{v.modelo || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-right">{v.km_inicial ? formatNumber(v.km_inicial) : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-right">{formatHorasMotor(v.horas_motor_segundos)}</td>
                </tr>
              ))}
              {(!viaturas || viaturas.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Sem viaturas registadas</td></tr>
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
      <span className={`${bold ? 'font-semibold' : ''} text-right max-w-[60%] truncate`}>{value}</span>
    </div>
  )
}

function EditRow({ label, value, onChange, type = 'text', wide }: { label: string; value: string; onChange: (v: string) => void; type?: string; wide?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-gray-500 text-xs whitespace-nowrap">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`${wide ? 'w-48' : 'w-36'} px-2 py-1 rounded border border-gray-200 focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20 text-xs text-right focus:outline-none focus:ring-2 focus:ring-nors-teal/30`} />
    </div>
  )
}
