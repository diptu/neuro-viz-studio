import { motion } from 'framer-motion'

const navLinks = [
  { label: 'Models', active: false },
  { label: 'Datasets', active: false },
  { label: 'Benchmarks', active: false },
  { label: 'Learning', active: true },
]

export default function TopNav() {
  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16"
      style={{ background: 'rgba(19,19,19,0.6)', backdropFilter: 'blur(24px)', borderBottom: '1px solid #3b494c' }}
    >
      <div className="flex items-center gap-8">
        <span style={{ fontFamily: 'Inter', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#00daf3' }}>
          NeuroViz Studio
        </span>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <motion.a
              key={link.label}
              href="#"
              whileHover={{ color: '#00e5ff' }}
              style={{
                color: link.active ? '#9cf0ff' : '#bac9cc',
                fontWeight: link.active ? 700 : 500,
                fontSize: 14,
                textDecoration: 'none',
                borderBottom: link.active ? '2px solid #9cf0ff' : 'none',
                paddingBottom: link.active ? 4 : 0,
              }}
            >
              {link.label}
            </motion.a>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {['notifications', 'settings'].map(icon => (
            <motion.span
              key={icon}
              whileHover={{ color: '#00e5ff', scale: 1.1 }}
              className="material-symbols-outlined cursor-pointer"
              style={{ color: '#bac9cc', fontSize: 22 }}
            >
              {icon}
            </motion.span>
          ))}
        </div>
        <div style={{ width: 1, height: 32, background: '#3b494c', margin: '0 8px' }} />
        <motion.button
          whileHover={{ backgroundColor: 'rgba(0,218,243,0.1)' }}
          whileTap={{ scale: 0.96 }}
          style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #00daf3', color: '#00daf3', fontWeight: 500, fontSize: 14, background: 'transparent', cursor: 'pointer' }}
        >
          Share
        </motion.button>
        <motion.button
          whileHover={{ opacity: 0.8 }}
          whileTap={{ scale: 0.96 }}
          style={{ padding: '6px 16px', borderRadius: 4, background: '#00daf3', color: '#00363d', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none' }}
        >
          Export
        </motion.button>
      </div>
    </motion.header>
  )
}
