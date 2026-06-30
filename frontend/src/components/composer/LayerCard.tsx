import { motion } from 'framer-motion'
import { Layer } from '../../types/layer'
import { useLayerStore } from '../../stores/useLayerStore'

interface Props {
  layer: Layer
  index: number
  glass?: boolean
}

export default function LayerCard({ layer, index, glass }: Props) {
  const { selectLayer, deleteLayer } = useLayerStore()
  const isError    = layer.status === 'error'
  const isSelected = layer.status === 'selected'

  const borderColor = isError ? '#ffb4ab' : isSelected ? '#00daf3' : '#3b494c'
  const borderWidth = isError || isSelected ? 2 : 1

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: 'easeOut' }}
      onClick={() => !isError && selectLayer(layer.id)}
      whileHover={!isError && !isSelected ? { borderColor: layer.hoverColor } : undefined}
      className={glass ? undefined : undefined}
      style={{
        background: glass ? 'rgba(32,31,31,0.9)' : '#201f1f',
        backdropFilter: glass ? 'blur(20px)' : undefined,
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: glass ? 12 : 4,
        padding: 16,
        cursor: isError ? 'default' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isError
          ? '0 0 30px rgba(255,180,171,0.12)'
          : isSelected
          ? glass ? '0 0 40px rgba(0,218,243,0.10)' : '0 0 20px rgba(0,218,243,0.06)'
          : undefined,
      }}
    >
      {isError && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,180,171,0.05)', pointerEvents: 'none' }} />
      )}

      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Accent bar */}
          <motion.div
            animate={isError ? { boxShadow: ['0 0 6px rgba(255,180,171,0.3)', '0 0 18px rgba(255,180,171,0.7)', '0 0 6px rgba(255,180,171,0.3)'] } : {}}
            transition={isError ? { duration: 1.4, repeat: Infinity } : {}}
            style={{
              width: 8, height: 40, borderRadius: 9999,
              background: layer.color,
              boxShadow: isSelected ? `0 0 14px ${layer.color}90` : `0 0 8px ${layer.color}40`,
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isError ? '#ffb4ab' : isSelected ? '#00daf3' : '#bac9cc', marginBottom: 2 }}>
              {String(layer.index).padStart(2, '0')} — {layer.category}
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 24, fontWeight: 600, lineHeight: 1.2, color: isError ? '#ffb4ab' : '#e5e2e1' }}>
              {layer.name}
            </div>
          </div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: isSelected ? 1 : 0.4 }}
          whileHover={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16 }}
        >
          {isError ? (
            <>
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="material-symbols-outlined"
                style={{ color: '#ffb4ab', fontSize: 22, fontVariationSettings: "'FILL' 1" }}
              >error</motion.span>
              <motion.span whileHover={{ color: '#ffb4ab' }} onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id) }}
                className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 22, cursor: 'pointer' }}>delete</motion.span>
            </>
          ) : isSelected ? (
            <>
              <span className="material-symbols-outlined" style={{ color: '#00daf3', fontSize: 22, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <motion.span whileHover={{ color: '#ffb4ab' }} onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id) }}
                className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 22, cursor: 'pointer' }}>delete</motion.span>
            </>
          ) : (
            <>
              <motion.span whileHover={{ color: '#c3f5ff' }} className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 22, cursor: 'pointer' }}>visibility</motion.span>
              <motion.span whileHover={{ color: '#ffb4ab' }} onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id) }}
                className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 22, cursor: 'pointer' }}>delete</motion.span>
              <span className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 22, cursor: 'grab' }}>drag_indicator</span>
            </>
          )}
        </motion.div>
      </div>

      {/* Error message */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ marginTop: 12, background: 'rgba(255,180,171,0.1)', padding: 12, borderRadius: glass ? 8 : 4, border: '1px solid rgba(255,180,171,0.2)', display: 'flex', alignItems: 'flex-start', gap: 8, position: 'relative', zIndex: 1 }}
        >
          <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: 18, flexShrink: 0 }}>warning</span>
          <p style={{ color: '#ffb4ab', fontSize: 12, lineHeight: 1.5, fontFamily: 'Inter', margin: 0 }}>{layer.error}</p>
        </motion.div>
      )}
    </motion.div>
  )
}
