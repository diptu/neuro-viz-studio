import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Models', to: '/' }, { label: 'Editor', to: '/editor' }, { label: 'Sandbox', to: '/sandbox' },
  { label: 'Eval', to: '/eval' }, { label: 'Dashboard', to: '/dashboard' },
]

const LAYERS_NAV = ['Input', 'Conv2D / s2', 'MaxPool', 'Conv2D / s1', 'FC+Softmax']

const PREDICTIONS = [
  { label: 'Egyptian Cat', prob: 0.984, color: '#c3f5ff' },
  { label: 'Tabby Cat', prob: 0.008, color: '#c3f5ff' },
  { label: 'Persian Cat', prob: 0.004, color: '#ecb2ff' },
  { label: 'Tiger Cat', prob: 0.002, color: '#bac9cc' },
  { label: 'Other', prob: 0.002, color: '#bac9cc' },
]

const LOGITS = [
  { idx: 285, label: 'Egyptian Cat', logit: 12.48 },
  { idx: 281, label: 'Tabby Cat', logit: 8.92 },
  { idx: 283, label: 'Persian Cat', logit: 8.14 },
  { idx: 284, label: 'Tiger Cat', logit: 7.56 },
  { idx: 292, label: 'Tiger', logit: 6.33 },
]

const FOOTER_ACTIONS = [
  { icon: 'build', label: 'Compile', active: false },
  { icon: 'fact_check', label: 'Validate', active: false },
  { icon: 'list_alt', label: 'Logs', active: true },
  { icon: 'terminal', label: 'Terminal', active: false },
]

export default function ModelSandbox() {
  const { pathname } = useLocation()
  const [dragging, setDragging] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [activeLayer, setActiveLayer] = useState(1)
  const [hoveredCell, setHoveredCell] = useState<number | null>(null)

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: '#0e0e0e', color: '#e5e2e1', fontFamily: 'Inter' }}>
      {/* Header */}
      <motion.header initial={{ y: -64, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: 64, zIndex: 50, background: 'rgba(19,19,19,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{ fontFamily: 'Inter', fontSize: 20, fontWeight: 700, color: '#00daf3', letterSpacing: '-0.02em' }}>NeuroViz Studio</span>
          <nav style={{ display: 'flex', gap: 20 }}>
            {NAV.map(link => {
              const active = pathname === link.to
              return (
                <motion.div key={link.to} whileHover={{ color: '#c3f5ff' }}>
                  <Link to={link.to} style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: active ? 700 : 500, color: active ? '#c3f5ff' : '#bac9cc', textDecoration: 'none', letterSpacing: '0.05em', borderBottom: active ? '2px solid #c3f5ff' : '2px solid transparent', paddingBottom: 4 }}>
                    {link.label.toUpperCase()}
                  </Link>
                </motion.div>
              )
            })}
          </nav>
        </div>
        <span className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 22, cursor: 'pointer' }}>account_circle</span>
      </motion.header>

      {/* Main 3-column layout */}
      <div style={{ marginTop: 64, marginBottom: 48, height: 'calc(100vh - 64px - 48px)', display: 'flex' }}>
        {/* Left: Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          style={{ width: 300, borderRight: '1px solid #3b494c', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: 16, borderBottom: '1px solid #3b494c', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc' }}>Data Input</div>

          {/* Upload zone */}
          <motion.div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={() => { setDragging(false); setUploaded(true) }}
            onClick={() => setUploaded(!uploaded)}
            animate={{ borderColor: dragging ? '#00daf3' : '#3b494c', background: dragging ? 'rgba(0,218,243,0.04)' : 'rgba(14,14,14,0.8)' }}
            style={{ margin: 16, border: '2px dashed', borderRadius: 8, padding: 24, textAlign: 'center', cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: dragging ? '#00daf3' : '#bac9cc', display: 'block', marginBottom: 8 }}>upload_file</span>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#bac9cc', marginBottom: 8 }}>Drop image tensor</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['.jpg', '.png', '.npy', '.pt'].map(ext => (
                <span key={ext} style={{ fontFamily: 'JetBrains Mono', fontSize: 9, padding: '2px 6px', background: '#2a2a2a', border: '1px solid #3b494c', borderRadius: 4, color: '#bac9cc' }}>{ext}</span>
              ))}
            </div>
          </motion.div>

          {/* Sample image preview */}
          <AnimatePresence>
            {uploaded && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ margin: '0 16px', position: 'relative', overflow: 'hidden', background: '#201f1f', border: '1px solid #3b494c', borderRadius: 4 }}>
                <div style={{ height: 140, background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#3b494c' }}>image</span>
                  {/* Scanline effect */}
                  <motion.div animate={{ y: [-140, 140] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(transparent, #00daf3, transparent)', opacity: 0.5 }} />
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc' }}>cat_sample_01.jpg</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginTop: 2 }}>224×224 · RGB · float32</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Layer breadcrumb */}
          <div style={{ padding: 16, marginTop: 'auto', borderTop: '1px solid #3b494c' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Layer Debug</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {LAYERS_NAV.map((layer, i) => (
                <motion.button key={layer} onClick={() => setActiveLayer(i)} whileHover={{ borderColor: '#00daf3' }}
                  style={{ padding: '4px 8px', fontFamily: 'JetBrains Mono', fontSize: 9, background: activeLayer === i ? 'rgba(0,218,243,0.1)' : 'transparent', border: `1px solid ${activeLayer === i ? '#00daf3' : '#3b494c'}`, color: activeLayer === i ? '#c3f5ff' : '#bac9cc', borderRadius: 4, cursor: 'pointer' }}>
                  {layer}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Center: Activation Debugger */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          style={{ flex: 1, borderRight: '1px solid #3b494c', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #3b494c', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Visual Debugger — {LAYERS_NAV[activeLayer]}</span>
            <span style={{ color: '#00daf3' }}>64 channels</span>
          </div>
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {/* 4×3 activation grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {Array.from({ length: 12 }, (_, i) => {
                const intensity = Math.random()
                const hue = 180 + i * 15
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    onMouseEnter={() => setHoveredCell(i)}
                    onMouseLeave={() => setHoveredCell(null)}
                    whileHover={{ scale: 1.08 }}
                    style={{ aspectRatio: '1', background: `hsl(${hue},60%,${8 + intensity * 20}%)`, border: `1px solid ${hoveredCell === i ? '#00daf3' : '#3b494c'}`, borderRadius: 4, cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {/* Simulated activation map */}
                    {Array.from({ length: 9 }, (_, j) => (
                      <div key={j} style={{ position: 'absolute', width: `${20 + Math.random() * 40}%`, height: `${20 + Math.random() * 40}%`, background: `rgba(0,218,243,${0.05 + Math.random() * 0.25})`, borderRadius: 2, left: `${Math.random() * 60}%`, top: `${Math.random() * 60}%` }} />
                    ))}
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#bac9cc', zIndex: 1 }}>ch {i + 1}</span>
                  </motion.div>
                )
              })}
            </div>

            {/* Saliency map overlay */}
            <div style={{ background: '#201f1f', border: '1px solid #3b494c', borderRadius: 4, padding: 12 }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginBottom: 10 }}>SALIENCY MAP (GradCAM)</div>
              <div style={{ height: 80, background: 'linear-gradient(135deg, rgba(0,218,243,0.05), rgba(236,178,255,0.15), rgba(0,218,243,0.05))', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} style={{ position: 'absolute', width: `${30 + i * 10}px`, height: `${30 + i * 10}px`, borderRadius: '50%', background: `rgba(236,178,255,${0.3 - i * 0.04})`, left: `${20 + i * 8}%`, top: '50%', transform: 'translateY(-50%)' }} />
                ))}
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#ecb2ff', zIndex: 1 }}>High activation region</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Predictions */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          style={{ width: 300, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: 16, borderBottom: '1px solid #3b494c', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc' }}>Live Prediction</div>

          {/* Top prediction */}
          <div style={{ padding: 20, borderBottom: '1px solid #3b494c', background: 'rgba(0,218,243,0.04)' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginBottom: 8 }}>TOP PREDICTION</div>
            <div style={{ fontFamily: 'Inter', fontSize: 18, fontWeight: 700, color: '#c3f5ff', marginBottom: 4 }}>Egyptian Cat</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 28, fontWeight: 700, color: '#00daf3', marginBottom: 4 }}>98.42%</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc' }}>Class idx: 285</div>
          </div>

          {/* Probability bars */}
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Distribution</div>
            {PREDICTIONS.map((pred, i) => (
              <motion.div key={pred.label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
                style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: i === 0 ? '#c3f5ff' : '#bac9cc' }}>{pred.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: pred.color }}>{(pred.prob * 100).toFixed(2)}%</span>
                </div>
                <div style={{ height: 6, background: '#2a2a2a', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pred.prob * 100}%` }} transition={{ delay: 0.5 + i * 0.07, duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', background: i === 0 ? '#00daf3' : pred.color, borderRadius: 3, boxShadow: i === 0 ? '0 0 8px rgba(0,218,243,0.5)' : 'none' }} />
                </div>
              </motion.div>
            ))}

            {/* Logits table */}
            <div style={{ marginTop: 20, background: '#201f1f', border: '1px solid #3b494c', borderRadius: 4 }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #3b494c', fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pre-Softmax Logits</div>
              {LOGITS.map((row, i) => (
                <div key={row.idx} style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', borderBottom: i < LOGITS.length - 1 ? '1px solid rgba(59,73,76,0.4)' : 'none' }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396', width: 36 }}>{row.idx}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#e5e2e1', flex: 1 }}>{row.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: i === 0 ? '#c3f5ff' : '#bac9cc' }}>{row.logit.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, delay: 0.15 }}
        style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 48, background: '#2a2a2a', borderTop: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ae500' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#baffa2' }}>Inference Ready</span>
          <div style={{ width: 1, height: 16, background: '#3b494c' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#bac9cc' }}>Layer: {LAYERS_NAV[activeLayer]}</span>
        </div>
        <div style={{ display: 'flex', height: '100%' }}>
          {FOOTER_ACTIONS.map(a => (
            <motion.button key={a.label} whileHover={!a.active ? { color: '#e5e2e1' } : undefined}
              style={{ height: '100%', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'JetBrains Mono', fontSize: 13, color: a.active ? '#79ff5b' : '#bac9cc', background: a.active ? 'rgba(121,255,91,0.06)' : 'transparent', borderBottom: a.active ? '2px solid #79ff5b' : '2px solid transparent', border: 'none', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{a.icon}</span>{a.label}
            </motion.button>
          ))}
        </div>
      </motion.footer>
    </div>
  )
}
