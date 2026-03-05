import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react'
import { searchVehicleContract, type ReceptionSearchResult } from '@/services/reception'
import { formatDate } from '@/utils/formatters'
import type { EstadoContrato } from '@/types'

export default function ReceptionPortal() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<ReceptionSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setResult(null)
      setHasSearched(false)
      return
    }
    setIsLoading(true)
    try {
      const data = await searchVehicleContract(trimmed)
      setResult(data)
      setHasSearched(true)
      setLastSearchTime(new Date())
    } catch {
      setResult({ contracts: [], vehicle: null })
      setHasSearched(true)
      setLastSearchTime(new Date())
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search on input change (3+ chars)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length >= 3) {
      debounceRef.current = setTimeout(() => doSearch(query), 500)
    } else if (query.trim().length === 0) {
      setResult(null)
      setHasSearched(false)
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, doSearch])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      doSearch(query)
    }
  }

  // Determine which contract to display (best status)
  const bestContract = result?.contracts?.[0] ?? null
  const vehicleFallback = result?.vehicle ?? null

  return (
    <div className="min-h-screen bg-nors-off-white flex flex-col items-center">
      {/* Header */}
      <header className="pt-16 pb-8 text-center flex flex-col items-center">
        <img
          src={`${import.meta.env.BASE_URL}nors-logo-dark.png`}
          alt="NORS"
          style={{ height: 40, width: 'auto' }}
        />
        <p className="text-sm font-light text-nors-medium-gray mt-1">Verificação de Contratos</p>
      </header>

      {/* Search */}
      <div className="w-full max-w-[600px] px-6">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-nors-light-gray-2"
            size={20}
          />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pesquisar por matrícula ou chassi (VIN)..."
            className="w-full h-14 pl-12 pr-4 text-lg rounded-xl border border-nors-light-gray bg-white font-light text-nors-black placeholder:text-nors-light-gray-2 focus:outline-none focus:border-nors-teal transition-colors"
          />
        </div>
        <p className="text-xs text-nors-light-gray-2 mt-2 text-center">
          Ex: LD8421HZ ou YV2XSW0D5SA360437
        </p>
      </div>

      {/* Results */}
      <div className="w-full max-w-[600px] px-6 mt-6 flex-1">
        {isLoading && <LoadingState />}

        {!isLoading && hasSearched && bestContract && (
          <ContractCard contract={bestContract} />
        )}

        {!isLoading && hasSearched && !bestContract && vehicleFallback && (
          <NoContractCard
            marca={vehicleFallback.marca}
            modelo={vehicleFallback.modelo}
            matricula={vehicleFallback.matricula}
            clienteNome={vehicleFallback.cliente?.nome}
          />
        )}

        {!isLoading && hasSearched && !bestContract && !vehicleFallback && (
          <VehicleNotFoundCard />
        )}

        {lastSearchTime && !isLoading && (
          <p className="text-xs text-nors-light-gray-2 text-center mt-4">
            Última consulta: {lastSearchTime.toLocaleTimeString('pt-PT')}
          </p>
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 flex flex-col items-center">
        <img
          src={`${import.meta.env.BASE_URL}nors-tagline-dark.png`}
          alt="Making it work."
          style={{ height: 12, width: 'auto', opacity: 0.4 }}
        />
        <p className="text-xs text-nors-light-gray-2 mt-1">NORS Trucks & Buses Angola VT</p>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <Loader2 className="animate-spin text-nors-teal" size={28} />
      <div className="w-full bg-white rounded-xl p-6 animate-pulse">
        <div className="h-5 bg-nors-light-gray rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-4 bg-nors-light-gray rounded" />
          <div className="h-4 bg-nors-light-gray rounded" />
          <div className="h-4 bg-nors-light-gray rounded" />
          <div className="h-4 bg-nors-light-gray rounded" />
        </div>
      </div>
    </div>
  )
}

function ContractCard({ contract }: { contract: EstadoContrato }) {
  const isActive = contract.status_contrato === 'ATIVO' || contract.status_contrato === 'A RENOVAR'
  const isCortesia = contract.status_contrato === 'CORTESIA'

  if (isActive) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#415A67' }}>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="text-green-600" size={24} />
          <span className="text-green-700 font-bold text-lg">CONTRATO ACTIVO</span>
        </div>

        <InfoGrid contract={contract} />

        <div className="mt-4 rounded-lg py-3 px-4 text-center font-medium text-white" style={{ backgroundColor: '#415A67' }}>
          &#10003; Pode receber serviço
        </div>
      </div>
    )
  }

  // Expired or Cortesia
  const title = isCortesia ? 'PERÍODO DE CORTESIA' : 'CONTRATO EXPIRADO'
  const detail = isCortesia
    ? 'Período de cortesia — verificar com APV'
    : `Contrato expirado há ${Math.abs(contract.dias_ate_expiracao)} dias`

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-l-amber-500">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-amber-600" size={24} />
        <span className="text-amber-700 font-bold text-lg">{title}</span>
      </div>

      <InfoGrid contract={contract} />

      <p className="text-sm text-amber-700 mt-3 font-light">{detail}</p>

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg py-3 px-4 text-center font-medium text-amber-700">
        &#9888; Verificar com equipa APV antes de proceder
      </div>
    </div>
  )
}

function InfoGrid({ contract }: { contract: EstadoContrato }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
      <InfoRow label="Cliente" value={contract.cliente_nome} />
      <InfoRow label="Viatura" value={`${contract.marca} ${contract.modelo ?? ''}`} />
      <InfoRow label="Matrícula" value={contract.matricula ?? '—'} />
      <InfoRow
        label="Tipo"
        value={
          <span
            className="inline-block px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: contract.tipo_contrato === 'APV' ? '#415A67' : '#9CC7DE',
              color: contract.tipo_contrato === 'APV' ? '#FFFFFF' : '#2B2B2B',
            }}
          >
            {contract.tipo_contrato}
          </span>
        }
      />
      <InfoRow
        label="Válido até"
        value={
          contract.data_validade
            ? `${formatDate(contract.data_validade)} (${contract.dias_ate_expiracao} dias restantes)`
            : '—'
        }
      />
      <InfoRow label="Próxima revisão" value={contract.proxima_revisao_tipo ?? '—'} />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-nors-medium-gray font-light">{label}: </span>
      <span className="text-nors-off-black font-normal">{typeof value === 'string' ? value : value}</span>
    </div>
  )
}

function NoContractCard({
  marca,
  modelo,
  matricula,
  clienteNome,
}: {
  marca: string
  modelo: string | null
  matricula: string | null
  clienteNome?: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-l-red-500">
      <div className="flex items-center gap-2 mb-4">
        <XCircle className="text-red-600" size={24} />
        <span className="text-red-700 font-bold text-lg">SEM CONTRATO ACTIVO</span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
        {clienteNome && <InfoRow label="Cliente" value={clienteNome} />}
        <InfoRow label="Viatura" value={`${marca} ${modelo ?? ''}`} />
        <InfoRow label="Matrícula" value={matricula ?? '—'} />
      </div>

      <p className="text-sm text-red-700 font-light">
        Esta viatura não tem contrato de manutenção activo
      </p>

      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg py-3 px-4 text-center font-medium text-red-700">
        &#10007; Contactar equipa APV — Sidney / Tiago
      </div>
    </div>
  )
}

function VehicleNotFoundCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-l-red-500">
      <div className="flex items-center gap-2 mb-4">
        <XCircle className="text-red-600" size={24} />
        <span className="text-red-700 font-bold text-lg">SEM CONTRATO ACTIVO</span>
      </div>

      <p className="text-sm text-red-700 font-light">
        Viatura não encontrada no sistema. Verifique a matrícula ou VIN.
      </p>

      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg py-3 px-4 text-center font-medium text-red-700">
        &#10007; Contactar equipa APV — Sidney / Tiago
      </div>
    </div>
  )
}
