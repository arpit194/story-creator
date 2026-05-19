import { X } from 'lucide-react'
import { useState } from 'react'
import type { GraphData } from '#/types/mission'

interface Props {
  onImport: (data: GraphData) => void
  onClose: () => void
}

export function ImportJsonModal({ onImport, onClose }: Props) {
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const parsed = JSON.parse(raw.trim())
      if (!Array.isArray(parsed.missions) || !Array.isArray(parsed.edges)) {
        setError('JSON must have a "missions" array and an "edges" array at the top level.')
        return
      }
      onImport(parsed as GraphData)
    } catch {
      setError('Invalid JSON — could not parse. Check for syntax errors.')
    }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className="flex w-full max-w-2xl flex-col gap-5 overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #111520, #0d1017)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
            <h2 className="font-mono-game text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
              Import JSON
            </h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/5" style={{ color: '#475569' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-6 pb-6">
          <p className="text-xs" style={{ color: '#475569' }}>
            Paste LLM-generated JSON below. The canvas will be replaced with the imported missions and edges.
          </p>
          <textarea
            className="w-full resize-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#080a0e] px-3 py-2.5 font-mono text-xs text-white placeholder-[#2d3748] focus:border-[rgba(255,255,255,0.15)] focus:outline-none transition-colors"
            rows={16}
            placeholder='{ "missions": [...], "edges": [...] }'
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setError(null) }}
            spellCheck={false}
          />
          {error && (
            <p className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(251,113,133,0.08)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.2)' }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              Import & Replace Canvas
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs transition-colors hover:bg-white/5"
              style={{ color: '#475569', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
