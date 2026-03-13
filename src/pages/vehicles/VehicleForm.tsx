import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { getClientes } from '@/services/clients'
import { createViatura } from '@/services/vehicles'
import { MARCAS, MODELOS_POR_MARCA } from '@/utils/constants'

const CUSTOM_MODELS_KEY = 'nors_custom_models'

function getCustomModels(marca: string): string[] {
  try {
    const stored = localStorage.getItem(CUSTOM_MODELS_KEY)
    if (!stored) return []
    const all = JSON.parse(stored)
    return all[marca] || []
  } catch {
    return []
  }
}

function saveCustomModel(marca: string, modelo: string) {
  try {
    const stored = localStorage.getItem(CUSTOM_MODELS_KEY)
    const all = stored ? JSON.parse(stored) : {}
    const existing = all[marca] || []
    if (!existing.includes(modelo)) {
      all[marca] = [...existing, modelo]
      localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(all))
    }
  } catch {
    // fail silently
  }
}

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
  const [modeloCustom, setModeloCustom] = useState(false)
  const [modeloCustomText, setModeloCustomText] = useState('')

  const customModels = useMemo(() => marca ? getCustomModels(marca) : [], [marca])

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: getClientes,
  })

  const mutation = useMutation({
    mutationFn: createViatura,
    onSuccess: () => {
      if (modeloCustom && modeloCustomText.trim()) {
        saveCustomModel(marca, modeloCustomText.trim())
      }
      queryClient.invalidateQueries({ queryKey: ['viaturas'] })
      navigate('/viaturas')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clienteId || !vin) return
    const finalModelo = modeloCustom ? modeloCustomText.trim() : modelo
    mutation.mutate({
      cliente_id: clienteId,
      matricula: matricula || undefined,
      vin,
      marca,
      modelo: finalModelo || undefined,
      ano: ano ? parseInt(ano) : undefined,
      km_inicial: kmInicial ? parseInt(kmInicial) : undefined,
      horas_motor_segundos: horasMotor ? parseInt(horasMotor) : undefined,
    })
  }

  const horasMotorHoras = horasMotor ? Math.floor(parseInt(horasMotor) / 3600) : null

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-nors-teal hover:underline">
        <ArrowLeft size={16} /> Voltar
      </button>

      <h1 className="text-2xl font-bold tracking-tight">Nova Viatura</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Cliente
          </label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
            className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
          >
            <option value="">Seleccionar cliente...</option>
            {(clientes || []).map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Matrícula
            </label>
            <input
              type="text"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.toUpperCase())}
              placeholder="Ex: LDA3645AC"
              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              VIN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="Ex: LGAG4DY39NT829063"
              required
              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Marca
            </label>
            <select
              value={marca}
              onChange={(e) => { setMarca(e.target.value); setModelo(''); setModeloCustom(false); setModeloCustomText('') }}
              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
            >
              {MARCAS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Modelo
            </label>
            {MODELOS_POR_MARCA[marca] && !modeloCustom ? (
              <select
                value={modelo}
                onChange={(e) => {
                  if (e.target.value === '__outro__') {
                    setModelo('')
                    setModeloCustom(true)
                    setModeloCustomText('')
                  } else if (e.target.value === '─────────') {
                    // ignore separator
                  } else {
                    setModelo(e.target.value)
                  }
                }}
                className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
              >
                <option value="">Seleccionar modelo...</option>
                {MODELOS_POR_MARCA[marca].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
                {customModels.length > 0 && (
                  <option key="sep" value="─────────" disabled className="text-gray-300">
                    ─────────
                  </option>
                )}
                {customModels.map(m => (
                  <option key={`custom-${m}`} value={m}>{m}</option>
                ))}
                <option value="__outro__">Outro...</option>
              </select>
            ) : (
              <input
                type="text"
                value={modeloCustomText}
                onChange={(e) => setModeloCustomText(e.target.value)}
                placeholder="Introduzir modelo..."
                className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Ano
            </label>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              placeholder="Ex: 2024"
              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              KM Inicial
            </label>
            <input
              type="number"
              value={kmInicial}
              onChange={(e) => setKmInicial(e.target.value)}
              placeholder="KM no momento de entrada"
              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Horas Motor
            </label>
            <input
              type="number"
              value={horasMotor}
              onChange={(e) => setHorasMotor(e.target.value)}
              placeholder="Ex: 17898426"
              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
            />
            <p className="text-xs text-gray-400 mt-1">
              Introduzir em segundos — ex: 22 154 400 (= 6 154 h)
            </p>
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
          className="inline-flex items-center gap-2 bg-nors-teal text-white h-10 px-4 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Save size={16} />
          {mutation.isPending ? 'A guardar...' : 'Adicionar Viatura'}
        </button>
      </form>
    </div>
  )
}
