import { motion } from 'framer-motion'

const actions = [
  { icon: 'play_circle', label: 'Compile', active: false },
  { icon: 'check_circle', label: 'Validate', active: false },
  { icon: 'list_alt', label: 'Logs', active: true },
  { icon: 'terminal', label: 'Terminal', active: false },
]

export default function BottomBar() {
  return (
    <motion.footer
      initial={{ y: 48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{
        position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 50,
        height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 32, padding: '0 32px',
        background: 'rgba(14,14,14,0.8)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid #3b494c',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {actions.map(action => (
          <motion.button
            key={action.label}
            whileHover={!action.active ? { color: '#e5e2e1' } : {}}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: '0.05em',
              color: action.active ? '#79ff5b' : '#bac9cc',
              fontWeight: action.active ? 700 : 400,
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{action.icon}</span>
            {action.label}
          </motion.button>
        ))}
      </div>

      <div style={{ position: 'absolute', right: 32, display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#79ff5b' }}
          />
          Engine Online
        </div>
        <span>CUDA v12.1</span>
        <span>MEM: 4.2/16 GB</span>
      </div>
    </motion.footer>
  )
}
