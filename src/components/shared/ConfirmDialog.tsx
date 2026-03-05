import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'default' | 'danger'
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel()
      }
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm w-full mx-4 p-6 space-y-4"
      >
        <h3 className="text-base font-bold tracking-tight">{title}</h3>
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onCancel}
            className="bg-white text-gray-700 h-10 px-4 rounded-md text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`h-10 px-4 rounded-md text-sm font-medium text-white transition-colors ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-nors-teal hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
