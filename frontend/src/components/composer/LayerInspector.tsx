import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props { floating?: boolean }

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', background: '#0e0e0e', border: '1px solid #3b494c',
  borderRadius: 4, padding: '8px 12px', fontFamily: 'JetBrains Mono',
  fontSize: 13, color: '#00daf3', outline: 'none', boxSizing: 'border-box',
}

export default function LayerInspector({ floating }: Props) {
  const [inputF,  setInputF]  = useState(512)
  const [outputF, setOutputF] = useState(256)
  const [activation, setActivation] = useState('ReLU')
  const [bias, setBias] = useState(true)

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
      style={{
        ...(floating
          ? { position: 'fixed', right: 24, top: 96, width: 320, height: 'calc(100vh - 320px)', zIndex: 40, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid #3b494c' }
          : { width: 320, borderLeft: '1px solid #3b494c', flexShrink: 0 }),
        background: floating ? 'rgba(42,42,42,0.92)' : '#2a2a2a',
        backdropFilter: 'blur(24px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 24, borderBottom: '1px solid rgba(59,73,76,0.4)', background: floating ? undefined : 'rgba(42,42,42,0.5)' }}>
        <h2 style={{ fontFamily: 'Inter', fontSize: 20, fontWeight: 600, color: '#c3f5ff', marginBottom: 4 }}>Layer Inspector</h2>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', margin: 0 }}>
          Editing Layer: Linear_5
        </p>
      </div>

      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Input features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bac9cc' }}>INPUT FEATURES</label>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#00daf3', background: 'rgba(0,218,243,0.1)', borderRadius: 4, padding: '2px 6px' }}>Int32</span>
          </div>
          <input type="number" value={inputF} onChange={e => setInputF(+e.target.value)} style={INPUT_STYLE}
            onFocus={e => (e.target.style.borderColor = '#c3f5ff')}
            onBlur={e => (e.target.style.borderColor = '#3b494c')} />
        </div>

        {/* Output features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bac9cc' }}>OUTPUT FEATURES</label>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#00daf3', background: 'rgba(0,218,243,0.1)', borderRadius: 4, padding: '2px 6px' }}>Int32</span>
          </div>
          <input type="number" value={outputF} onChange={e => setOutputF(+e.target.value)} style={INPUT_STYLE}
            onFocus={e => (e.target.style.borderColor = '#c3f5ff')}
            onBlur={e => (e.target.style.borderColor = '#3b494c')} />
        </div>

        {/* Activation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bac9cc' }}>ACTIVATION FUNCTION</label>
          <div style={{ position: 'relative' }}>
            <select value={activation} onChange={e => setActivation(e.target.value)}
              style={{ ...INPUT_STYLE, color: '#e5e2e1', appearance: 'none', cursor: 'pointer' }}>
              {['None', 'ReLU', 'Sigmoid', 'Tanh', 'LeakyReLU'].map(o => <option key={o}>{o}</option>)}
            </select>
            <span className="material-symbols-outlined" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#bac9cc', fontSize: 18, pointerEvents: 'none' }}>expand_more</span>
          </div>
        </div>

        {/* Bias toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(59,73,76,0.3)' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#e5e2e1', fontWeight: 600 }}>INCLUDE BIAS</div>
            <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#bac9cc', marginTop: 2 }}>Learnable additive parameter</div>
          </div>
          <motion.button
            onClick={() => setBias(b => !b)}
            style={{ width: 44, height: 24, borderRadius: 9999, background: bias ? '#00daf3' : '#353534', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
          >
            <motion.div
              animate={{ x: bias ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: 'white' }}
            />
          </motion.button>
        </div>

        <motion.button
          whileHover={{ backgroundColor: 'rgba(53,53,52,0.9)' }}
          whileTap={{ scale: 0.97 }}
          style={{ width: '100%', border: '1px solid rgba(132,147,150,0.3)', color: '#bac9cc', padding: '8px 0', borderRadius: floating ? 8 : 4, fontFamily: 'JetBrains Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'transparent', cursor: 'pointer' }}
        >
          Reset Defaults
        </motion.button>
      </div>
    </motion.aside>
  )
}
