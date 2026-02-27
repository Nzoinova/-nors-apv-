import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { getClientes } from '@/services/clients'
import { createViatura } from '@/services/vehicles'
import { MARCAS } from '@/utils/constants'

export default function VehicleForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [clienteId, setClienteId] = useState('')
  const [matricula, setMatricula] = useState('')
  const [vin, setVin] = useState('')
  const [marca, setMarca] = useState('Dongfeng')
  const [modelo, setModelo] = useState('')
  const [ano, setAno] = useState('')
  const [kmInicial, setKmInicial] = useState('')
  const [horasMotor, setHorasMotor] = useState('')

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: getClientes,
  })

  const mutation = useMutation({
    mutationFn: createViatura,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viaturas'] })
      navigate('/viaturas')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clienteId || !vin) return
    mutation.mutate({
      cliente_id: clienteId,
      matricula: matricula || undefined,
      vin,
      marca,
      modelo: modelo || undefined,
      ano: ano ? parseInt(ano) : undefined,
      km_inicial: kmInicial ? parseInt(kmInicial) : undefined,
      horas_motor_segundos: horasMotor ? parseInt(horasMotor) : undefined,
    })
  }

  const horasMotorHoras = horasMotor ? Math.floor(parseInt(horasMotor) / 3600) : null

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/viaturas" className="inline-flex items-center gap-1.5 text-sm text-nors-teal hover:underline">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">Nova Viatura</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
            Cliente
          </label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
          >
            <option value="">Seleccionar cliente...</option>
            {(clientes || []).map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Matrícula
            </label>
            <input
              type="text"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.toUpperCase())}
              placeholder="Ex: LDA3645AC"
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              VIN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="Ex: LGAG4DY39NT829063"
              required
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Marca
            </label>
            <select
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            >
              {MARCAS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Modelo
            </label>
            <input
              type="text"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Ano
            </label>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              placeholder="Ex: 2024"
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              KM Inicial
            </label>
            <input
              type="number"
              value={kmInicial}
              onChange={(e) => setKmInicial(e.target.value)}
              placeholder="KM no momento de entrada"
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Horas Motor (segundos)
            </label>
            <input
              type="number"
              value={horasMotor}
              onChange={(e) => setHorasMotor(e.target.value)}
              placeholder="Ex: 17898426"
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
            {horasMotorHoras !== null && (
              <p className="text-[10px] text-nors-teal mt-1 font-semibold">
                = {horasMotorHoras.toLocaleString()} horas de trabalho
              </p>
            )}
          </div>
        </div>

        {mutation.error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
            Erro: {(mutation.error as Error).message}
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || !clienteId || !vin}
          className="inline-flex items-center gap-2 bg-nors-teal text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-nors-teal/90 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {mutation.isPending ? 'A guardar...' : 'Adicionar Viatura'}
        </button>
      </form>
    </div>
  )
}
