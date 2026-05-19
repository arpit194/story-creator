import { Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { MissionNodeData } from '#/store/canvasStore'
import { useCanvasStore } from '#/store/canvasStore'

const TYPE_CONFIG = {
  Story: {
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.3)',
    borderSelected: 'rgba(59,130,246,0.7)',
    badge: { bg: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: 'rgba(59,130,246,0.25)' },
  },
  Side: {
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    borderSelected: 'rgba(245,158,11,0.65)',
    badge: { bg: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: 'rgba(245,158,11,0.25)' },
  },
  Base: {
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.3)',
    borderSelected: 'rgba(34,197,94,0.65)',
    badge: { bg: 'rgba(34,197,94,0.1)', color: '#86efac', border: 'rgba(34,197,94,0.25)' },
  },
}

const STAGE_COLOR: Record<string, string> = {
  Dialogue: '#a78bfa',
  Pickup: '#34d399',
  Drop: '#fb7185',
}

export function MissionNode({ data, selected }: NodeProps<Node<MissionNodeData>>) {
  const selectMission = useCanvasStore((s) => s.selectMission)
  const cfg = TYPE_CONFIG[data.missionType as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.Side
  const stages = data.stages ?? []
  const [stagesOpen, setStagesOpen] = useState(false)

  return (
    <button
      type="button"
      onClick={() => selectMission(data.id)}
      className="group relative text-left transition-all duration-200"
      style={{
        width: 240,
        background: 'linear-gradient(160deg, #111520, #0d1017)',
        border: `1px solid ${selected ? cfg.borderSelected : cfg.border}`,
        borderRadius: 14,
        padding: '14px 16px',
        boxShadow: selected
          ? `0 0 0 1px ${cfg.borderSelected}30, 0 0 32px ${cfg.glow}, 0 8px 32px rgba(0,0,0,0.5)`
          : `0 0 20px ${cfg.glow}, 0 4px 16px rgba(0,0,0,0.4)`,
        cursor: 'pointer',
      }}
    >
      <div
        className="absolute left-4 right-4 top-0 h-px rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}60, transparent)` }}
      />

      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 8, height: 8, background: '#161b2a', border: `1.5px solid ${cfg.border}`, borderRadius: '50%', left: -5 }}
      />

      {/* Title + badge */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono-game flex-1 truncate text-sm font-medium leading-snug text-white">
          {data.missionName}
        </p>
        <span
          className="font-mono-game mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
          style={{ background: cfg.badge.bg, color: cfg.badge.color, border: `1px solid ${cfg.badge.border}` }}
        >
          {data.missionType.toUpperCase()}
        </span>
      </div>

      {/* Description */}
      {data.description ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed" style={{ color: '#475569' }}>
          {data.description}
        </p>
      ) : (
        <p className="mt-2 text-xs italic" style={{ color: '#2d3748' }}>No description</p>
      )}

      {/* Stages collapsible */}
      {stages.length > 0 && (
        <div className="mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            type="button"
            onClick={() => setStagesOpen((o) => !o)}
            className="flex w-full items-center justify-between pt-2.5"
          >
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full" style={{ background: cfg.color, opacity: 0.8 }} />
              <span className="text-[11px]" style={{ color: '#64748b' }}>
                {stages.length} {stages.length === 1 ? 'stage' : 'stages'}
              </span>
            </div>
            <ChevronDown
              className="h-3 w-3 transition-transform duration-200"
              style={{ color: '#334155', transform: stagesOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            />
          </button>

          {stagesOpen && (
            <div className="mt-2 flex flex-col gap-1">
              {stages.map((stage, i) => {
                const sc = STAGE_COLOR[stage.stageType] ?? '#64748b'
                return (
                  <div
                    key={stage.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <span
                      className="font-mono-game shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase"
                      style={{ background: `${sc}15`, color: sc, border: `1px solid ${sc}30` }}
                    >
                      {stage.stageType}
                    </span>
                    <span className="truncate text-[10px]" style={{ color: '#475569' }}>
                      {stage.statusMessage || `Stage ${i + 1}`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {stages.length === 0 && (
        <div className="mt-3 flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full" style={{ background: '#2d3748' }} />
          <span className="text-[11px]" style={{ color: '#2d3748' }}>No stages</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 8, height: 8, background: '#161b2a', border: `1.5px solid ${cfg.border}`, borderRadius: '50%', right: -5 }}
      />
    </button>
  )
}
