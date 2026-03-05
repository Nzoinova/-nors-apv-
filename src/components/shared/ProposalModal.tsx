import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Copy, Loader2 } from 'lucide-react'
import { createAPVDraft, generateEmailForRicardo } from '@/services/pipeline'
import { formatKZ, formatDate } from '@/utils/formatters'
import type { EstadoContrato } from '@/types'

interface ProposalModalProps {
  contrato: EstadoContrato
  onClose: () => void
}

export function ProposalModal({ contrato, onClose }: ProposalModalProps) {
  const queryClient = useQueryClient()
  const [kmActual, setKmActual] = useState(contrato.km_actual ?? contrato.km_inicial ?? 0)
  const [horasMotor, setHorasMotor] = useState(
    contrato.horas_motor_actual ?? contrato.horas_motor_segundos ?? 0
  )
  const [notas, setNotas] = useState('')
  const [toast, setToast] = useState(false)

  const mutation = useMutation({
    mutationFn: () => createAPVDraft(contrato.contrato_id, notas || undefined),
    onSuccess: () => {
      const emailText = generateEmailForRicardo({
        cliente_nome: contrato.cliente_nome,
        marca: contrato.marca,
        modelo: contrato.modelo,
        matricula: contrato.matricula,
        vin: contrato.vin,
        km_inicial: kmActual,
        horas_motor_segundos: horasMotor,
        origem_validade: contrato.data_validade,
        origem_valor_kz: contrato.valor_total_kz,
        notas_pipeline: notas || null,
      })
      navigator.clipboard.writeText(emailText)
      queryClient.invalidateQueries({ queryKey: ['estado-contratos'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-origens'] })
      setToast(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    },
  })

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Iniciar Proposta APV</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                CM {contrato.cliente_nome.split(' - ')[0]} — {contrato.marca} {contrato.modelo || ''}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <div className="px-6 py-5 space-y-4">
            {/* Read-only fields */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cliente</label>
              <div className="h-10 px-3 rounded-md border border-gray-200 bg-gray-50 flex items-center text-sm text-gray-700">
                {contrato.cliente_nome}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Viatura</label>
              <div className="h-10 px-3 rounded-md border border-gray-200 bg-gray-50 flex items-center text-sm text-gray-700">
                {contrato.marca} {contrato.modelo || ''} — {contrato.matricula || contrato.vin}
              </div>
            </div>

            {/* CM info summary */}
            <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-600 space-y-1">
              <p>CM expirou: <span className="font-semibold">{formatDate(contrato.data_validade)}</span></p>
              {contrato.valor_total_kz != null && (
                <p>Valor CM: <span className="font-semibold">{formatKZ(contrato.valor_total_kz)}</span></p>
              )}
              {contrato.intervencoes_previstas != null && (
                <p>Intervenções previstas: <span className="font-semibold">{contrato.intervencoes_previstas}</span></p>
              )}
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">KM Actual</label>
                <input
                  type="number"
                  value={kmActual}
                  onChange={e => setKmActual(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Horas Motor (seg)</label>
                <input
                  type="number"
                  value={horasMotor}
                  onChange={e => setHorasMotor(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notas para o Ricardo</label>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Contexto adicional, urgência, preferências do cliente..."
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20 resize-y"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-md text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#415A67' }}
            >
              {mutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Copy size={14} />
              )}
              Criar Draft + Copiar Email
            </button>
          </div>

          {mutation.isError && (
            <div className="px-6 pb-4">
              <p className="text-xs text-red-600">Erro ao criar draft. Tente novamente.</p>
            </div>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 shadow-lg">
          <p className="text-sm font-medium text-emerald-700">Draft criado. Email copiado — cole no Outlook/Gmail.</p>
        </div>
      )}
    </>
  )
}
