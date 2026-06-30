import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProgressHeader from '../components/ProgressHeader'
import ArchitectureCards from '../components/ArchitectureCards'
import BottomBar from '../components/BottomBar'
import Sidebar from '../components/Sidebar'

const NAV_LINKS = [
  { label: 'Models',   to: '/' },
  { label: 'Canvas',   to: '/canvas' },
  { label: 'Compose',  to: '/compose' },
  { label: 'Canvas',   to: '/canvas' },
  { label: 'Editor',   to: '/editor' },
]

export default function KnowledgeBase() {
  const { pathname } = useLocation()

  return (
    <>
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px', height: 64, background: 'rgba(19,19,19,0.6)', backdropFilter: 'blur(24px)', borderBottom: '1px solid #3b494c' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{ fontFamily: 'Inter', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#00daf3' }}>NeuroViz Studio</span>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {NAV_LINKS.map(link => {
              const isActive = pathname === link.to
              return (
                <motion.div key={link.to} whileHover={{ color: '#00e5ff' }}>
                  <Link to={link.to} style={{ color: isActive ? '#9cf0ff' : '#bac9cc', fontWeight: isActive ? 700 : 500, fontSize: 14, textDecoration: 'none', borderBottom: isActive ? '2px solid #9cf0ff' : 'none', paddingBottom: isActive ? 4 : 0 }}>
                    {link.label}
                  </Link>
                </motion.div>
              )
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {['notifications', 'settings'].map(icon => (
            <motion.span key={icon} whileHover={{ color: '#00e5ff', scale: 1.1 }}
              className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 22, cursor: 'pointer' }}>{icon}</motion.span>
          ))}
          <div style={{ width: 1, height: 32, background: '#3b494c', margin: '0 8px' }} />
          <motion.button whileHover={{ backgroundColor: 'rgba(0,218,243,0.1)' }} whileTap={{ scale: 0.96 }}
            style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #00daf3', color: '#00daf3', fontWeight: 500, fontSize: 14, background: 'transparent', cursor: 'pointer' }}>Share</motion.button>
          <motion.button whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.96 }}
            style={{ padding: '6px 16px', borderRadius: 4, background: '#00daf3', color: '#00363d', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none' }}>Export</motion.button>
        </div>
      </motion.header>

      <Sidebar />

      <main className="custom-scrollbar" style={{ marginLeft: 320, marginTop: 64, marginBottom: 48, padding: 32, height: 'calc(100vh - 64px - 48px)', overflowY: 'auto' }}>
        <ProgressHeader />
        <ArchitectureCards />
        <div style={{ height: 48 }} />
      </main>

      <BottomBar />
    </>
  )
}
