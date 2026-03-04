import { supabase } from '@/lib/supabase'
import type { EstadoContrato, Viatura } from '@/types'

const STATUS_PRIORITY: Record<string, number> = {
  'ATIVO': 0,
  'A RENOVAR': 1,
  'CORTESIA': 2,
  'EXPIRADO': 3,
  'FECHADO': 4,
}

export interface ReceptionSearchResult {
  contracts: EstadoContrato[]
  vehicle: (Viatura & { cliente?: { nome: string } }) | null
}

export async function searchVehicleContract(query: string): Promise<ReceptionSearchResult> {
  const searchTerm = query.trim().toUpperCase()
  if (!searchTerm) return { contracts: [], vehicle: null }

  // Primary: search the view with all computed fields
  const { data: contracts, error: contractError } = await supabase
    .from('v_estado_contratos')
    .select('*')
    .or(`matricula.ilike.%${searchTerm}%,vin.ilike.%${searchTerm}%`)
    .limit(10)

  if (contractError) throw contractError

  if (contracts && contracts.length > 0) {
    // Sort by status priority (active first)
    const sorted = contracts.sort(
      (a, b) => (STATUS_PRIORITY[a.status_contrato] ?? 99) - (STATUS_PRIORITY[b.status_contrato] ?? 99)
    )
    return { contracts: sorted, vehicle: null }
  }

  // Fallback: check if vehicle exists without a contract
  const { data: vehicles, error: vehicleError } = await supabase
    .from('viaturas')
    .select('*, cliente:clientes(nome)')
    .or(`matricula.ilike.%${searchTerm}%,vin.ilike.%${searchTerm}%`)
    .limit(1)

  if (vehicleError) throw vehicleError

  return {
    contracts: [],
    vehicle: vehicles && vehicles.length > 0 ? vehicles[0] : null,
  }
}
