import { useRef, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLayerStore } from '../stores/useLayerStore'
import ComposerNav from '../components/ComposerNav'
import LibraryPanel from '../components/composer/LibraryPanel'
import LayerCard from '../components/composer/LayerCard'
import LayerInspector from '../components/composer/LayerInspector'
import CodeDrawer from '../components/composer/CodeDrawer'

const WORKSPACE = 3000

export default function InfinityComposer() {
  const layers = useLayerStore(s => s.layers)
  const canvasRef  = useRef<HTMLDivElement>(null)
  const dragging   = useRef(false)
  const startX     = useRef(0)
  const startY     = useRef(0)
  const origLeft   = useRef(0)
  const origTop    = useRef(0)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    el.scrollLeft = (WORKSPACE - window.innerWidth)  / 2
    el.scrollTop  = (WORKSPACE - window.innerHeight) / 2
  }, [])

  const onDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-layer]')) return
    dragging.current = true
    startX.current   = e.pageX
    startY.current   = e.pageY
    origLeft.current = canvasRef.current?.scrollLeft ?? 0
    origTop.current  = canvasRef.current?.scrollTop  ?? 0
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
  }, [])

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging.current || !canvasRef.current) return
    e.preventDefault()
    canvasRef.current.scrollLeft = origLeft.current - (e.pageX - startX.current) * 1.4
    canvasRef.current.scrollTop  = origTop.current  - (e.pageY - startY.current) * 1.4
  }, [])

  const stopDrag = useCallback(() => {
    dragging.current = false
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
  }, [])

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: '#131313', position: 'relative' }}>
      {/* Infinite grid */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: 'linear-gradient(rgba(132,147,150,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(132,147,150,0.07) 1px,transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      <ComposerNav />

      {/* Pan canvas */}
      <div
        ref={canvasRef}
        className="custom-scrollbar"
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        style={{ position: 'fixed', inset: 0, overflow: 'auto', zIndex: 10, cursor: 'grab' }}
      >
        <div style={{ minWidth: WORKSPACE, minHeight: WORKSPACE, padding: 500, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <div style={{ width: '100%', maxWidth: 672 }} data-layer="root">
            <AnimatePresence>
              {layers.map((layer, i) => (
                <div key={layer.id} data-layer="card">
                  <LayerCard layer={layer} index={i} glass />
                  {i < layers.length - 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', height: 32 }}>
                      <div style={{ width: 1, background: 'rgba(59,73,76,0.5)', boxShadow: '0 0 8px rgba(0,218,243,0.06)' }} />
                    </div>
                  )}
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating panels */}
      <LibraryPanel floating />
      <LayerInspector floating />
      <CodeDrawer floating />
    </div>
  )
}
