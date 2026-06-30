import { motion } from 'framer-motion'

const MODULES = [
  { icon: 'layers',        label: 'Convolutional', active: true },
  { icon: 'rebase_edit',   label: 'Recurrent' },
  { icon: 'blur_on',       label: 'Normalization' },
  { icon: 'grid_view',     label: 'Pooling' },
]

interface Props { floating?: boolean }

export default function LibraryPanel({ floating }: Props) {
  return (
    <motion.aside
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        ...(floating
          ? { position: 'fixed', left: 24, top: 96, width: 288, height: 'calc(100vh - 160px)', zIndex: 40, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid #3b494c' }
          : { width: 320, borderRight: '1px solid #3b494c', flexShrink: 0 }),
        background: 'rgba(28,27,27,0.92)',
        backdropFilter: 'blur(24px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 24px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: 'Inter', fontSize: 18, fontWeight: 600, color: '#c3f5ff' }}>Library</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#bac9cc', border: '1px solid #3b494c', borderRadius: 4, padding: '2px 8px' }}>V2.4 Stable</span>
        </div>
        <motion.button
          whileHover={{ filter: 'brightness(1.08)' }}
          whileTap={{ scale: 0.97 }}
          style={{ width: '100%', background: '#c3f5ff', color: '#00363d', padding: '8px 16px', borderRadius: floating ? 8 : 4, fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: floating ? '0 4px 16px rgba(195,245,255,0.15)' : undefined }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          ADD LAYER
        </motion.button>
      </div>

      {/* Module list */}
      <div style={{ flex: 1 }}>
        <div style={{ padding: '8px 24px', fontFamily: 'JetBrains Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc' }}>
          Available Modules
        </div>
        {MODULES.map((mod) => (
          <motion.div
            key={mod.label}
            whileHover={!mod.active ? { backgroundColor: 'rgba(53,53,52,0.8)' } : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', color: mod.active ? '#ecb2ff' : '#bac9cc', background: mod.active ? 'rgba(207,92,255,0.18)' : 'transparent', borderLeft: mod.active ? '2px solid #ecb2ff' : '2px solid transparent', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{mod.icon}</span>
            {mod.label}
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div
        whileHover={{ backgroundColor: 'rgba(53,53,52,0.8)' }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', borderTop: '1px solid rgba(59,73,76,0.3)', fontFamily: 'JetBrains Mono', fontSize: 11, color: '#bac9cc', cursor: 'pointer' }}
      >
        <span className="material-symbols-outlined">settings</span>
        Settings
      </motion.div>
    </motion.aside>
  )
}
