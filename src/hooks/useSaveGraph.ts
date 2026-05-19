import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { saveGraphVersion, updateGraph } from '#/server/graph'
import { useCanvasStore } from '#/store/canvasStore'
import type { GraphData, Mission } from '#/types/mission'

export function buildGraphData(
  nodes: ReturnType<typeof useCanvasStore.getState>['nodes'],
  edges: ReturnType<typeof useCanvasStore.getState>['edges'],
): GraphData {
  const prerequisiteMap = new Map<string, string[]>()
  for (const e of edges) {
    prerequisiteMap.set(e.target, [...(prerequisiteMap.get(e.target) ?? []), e.source])
  }
  return {
    missions: nodes.map((n) => ({
      ...(n.data as Mission),
      positionX: n.position.x,
      positionY: n.position.y,
      prerequisites: prerequisiteMap.get(n.id) ?? [],
    })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  }
}

export type SaveStatus = 'idle' | 'saving' | 'saved'

export function useSaveGraph(
  currentVersionId: string | null,
  onNewVersion: (id: string) => void,
) {
  const qc = useQueryClient()
  const { nodes, edges } = useCanvasStore()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const queue = useRef<Array<() => Promise<void>>>([])
  const running = useRef(false)

  const markSaved = useCallback(() => {
    setSaveStatus('saved')
    setLastSavedAt(new Date())
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500)
  }, [])

  const drain = useCallback(async () => {
    if (running.current) return
    running.current = true
    setSaveStatus('saving')
    while (queue.current.length > 0) {
      const task = queue.current.shift()
      if (!task) break
      try {
        await task()
      } catch (e) {
        console.error('Save failed', e)
      }
    }
    running.current = false
    markSaved()
  }, [markSaved])

  const enqueue = useCallback(
    (task: () => Promise<void>) => {
      queue.current.push(task)
      drain()
    },
    [drain],
  )

  const save = useCallback(() => {
    const id = currentVersionId
    if (!id) return
    const data = buildGraphData(nodes, edges)
    enqueue(async () => {
      await updateGraph({ data: { id, data } })
      qc.invalidateQueries({ queryKey: ['graph'] })
    })
  }, [currentVersionId, nodes, edges, enqueue, qc])

  const saveVersion = useCallback(
    (label: string) => {
      const data = buildGraphData(nodes, edges)
      enqueue(async () => {
        const row = await saveGraphVersion({ data: { data, label } })
        onNewVersion(row.id)
        qc.invalidateQueries({ queryKey: ['graph'] })
      })
    },
    [nodes, edges, enqueue, onNewVersion, qc],
  )

  // Warn before tab close if there are unsaved changes
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  useEffect(() => { nodesRef.current = nodes }, [nodes])
  useEffect(() => { edgesRef.current = edges }, [edges])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!currentVersionId || saveStatus === 'saving') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [currentVersionId, saveStatus])

  return { save, saveVersion, saveStatus, lastSavedAt }
}
