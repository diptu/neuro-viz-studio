import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const LINKS = [
  { label: 'Models',   to: '/' },
  { label: 'Compose',  to: '/compose' },
  { label: 'Canvas',   to: '/canvas' },
  { label: 'Editor',   to: '/editor' },
]

export default function ComposerNav() {
  const { pathname } = useLocation()

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 64, background: 'rgba(19,19,19,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', zIndex: 50 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <span style={{ fontFamily: 'Inter', fontSize: 18, fontWeight: 700, color: '#c3f5ff' }}>NeuroViz Studio</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {LINKS.map(link => {
            const active = pathname === link.to
            return (
              <motion.div key={link.to} whileHover={{ color: '#c3f5ff' }}>
                <Link to={link.to} style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', color: active ? '#c3f5ff' : '#bac9cc', textDecoration: 'none', borderBottom: active ? '2px solid #c3f5ff' : '2px solid transparent', paddingBottom: 4 }}>
                  {link.label.toUpperCase()}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <motion.span whileHover={{ color: '#c3f5ff' }} className="material-symbols-outlined" style={{ color: '#bac9cc', cursor: 'pointer', fontSize: 22 }}>notifications</motion.span>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, background: '#ffb4ab', borderRadius: '50%' }} />
        </div>
        <motion.span whileHover={{ color: '#c3f5ff' }} className="material-symbols-outlined" style={{ color: '#bac9cc', cursor: 'pointer', fontSize: 22 }}>account_circle</motion.span>
      </div>
    </motion.nav>
  )
}
