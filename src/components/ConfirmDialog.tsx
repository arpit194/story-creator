import { Trash2 } from 'lucide-react'

interface Props {
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ message, confirmLabel = 'Delete', onConfirm, onCancel }: Props) {
  return (
    <div className="modal-backdrop fixed inset-0 z-60 flex items-center justify-center bg-black/70">
      <div
        className="flex w-full max-w-xs flex-col gap-5 rounded-2xl p-6 shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #111520, #0d1017)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.2)' }}
          >
            <Trash2 className="h-4 w-4" style={{ color: '#fb7185' }} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Are you sure?</p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: '#475569' }}>{message}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
            style={{ background: 'rgba(251,113,133,0.12)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.25)' }}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-xs transition-colors hover:bg-white/5"
            style={{ color: '#475569', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
