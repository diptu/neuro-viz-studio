import { useState } from 'react'
import { motion } from 'framer-motion'

const coreConcepts = [
  { icon: 'hub', label: 'Backpropagation', active: false },
  { icon: 'trending_down', label: 'Vanishing Gradients', active: true },
  { icon: 'visibility', label: 'Attention Mechanisms', active: false },
]

const architectures = [
  { icon: 'layers', label: 'CNN Design' },
  { icon: 'repeat', label: 'Recurrent Modules' },
  { icon: 'auto_awesome_motion', label: 'Transformers Wiki' },
]

function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <motion.a
      href="#"
      whileHover={!active ? { backgroundColor: 'rgba(53,53,52,0.3)', x: 2 } : {}}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 4,
        textDecoration: 'none', fontSize: 14, fontFamily: 'Inter',
        color: active ? '#ecb2ff' : '#bac9cc',
        backgroundColor: active ? 'rgba(207,92,255,0.2)' : 'transparent',
        borderLeft: active ? '4px solid #ecb2ff' : '4px solid transparent',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </motion.a>
  )
}

export default function Sidebar() {
  const [query, setQuery] = useState('')

  const filteredCore = coreConcepts.filter(i => !query || i.label.toLowerCase().includes(query.toLowerCase()))
  const filteredArch = architectures.filter(i => !query || i.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <motion.aside
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      style={{
        position: 'fixed', left: 0, top: 64, bottom: 0, width: 320, zIndex: 40,
        display: 'flex', flexDirection: 'column',
        background: 'rgba(32,31,31,0.6)', backdropFilter: 'blur(24px)',
        borderRight: '1px solid #3b494c',
      }}
    >
      {/* Header */}
      <div style={{ padding: 24, borderBottom: '1px solid #3b494c' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(207,92,255,0.2)', border: '1px solid #ecb2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
            <span className="material-symbols-outlined" style={{ color: '#ecb2ff' }}>menu_book</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#e5e2e1' }}>Documentation</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#bac9cc', textTransform: 'uppercase', letterSpacing: '0.1em' }}>v2.4-stable</div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bac9cc', fontSize: 18 }}>search</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search concepts..."
            style={{
              width: '100%', background: '#1c1b1b', border: '1px solid #3b494c', borderRadius: 4,
              padding: '8px 12px 8px 36px', fontSize: 14, color: '#e5e2e1', outline: 'none',
              fontFamily: 'Inter',
            }}
            onFocus={e => (e.target.style.borderColor = '#9cf0ff')}
            onBlur={e => (e.target.style.borderColor = '#3b494c')}
          />
        </div>
      </div>

      {/* Nav */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {filteredCore.length > 0 && (
          <div style={{ padding: '0 24px', marginBottom: 16 }}>
            <div style={{ color: '#bac9cc', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Core Concepts</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredCore.map(item => <li key={item.label}><NavItem {...item} /></li>)}
            </ul>
          </div>
        )}
        {filteredArch.length > 0 && (
          <div style={{ padding: '0 24px', marginBottom: 16 }}>
            <div style={{ color: '#bac9cc', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Architectures</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredArch.map(item => <li key={item.label}><NavItem {...item} /></li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: 24, borderTop: '1px solid #3b494c', background: 'rgba(42,42,42,0.2)' }}>
        <motion.button
          whileHover={{ filter: 'brightness(1.1)' }}
          whileTap={{ scale: 0.97 }}
          style={{ width: '100%', padding: '10px 0', background: '#cf5cff', color: '#480063', borderRadius: 4, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Add Custom Layer
        </motion.button>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[{ icon: 'keyboard', label: 'Keyboard Shortcuts' }, { icon: 'description', label: 'API Reference' }].map(item => (
            <motion.a key={item.label} href="#" whileHover={{ color: '#e5e2e1' }} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#bac9cc', textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </motion.a>
          ))}
        </div>
      </div>
    </motion.aside>
  )
}
