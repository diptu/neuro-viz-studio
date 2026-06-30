import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Models', to: '/' }, { label: 'Editor', to: '/editor' }, { label: 'Dashboard', to: '/dashboard' },
  { label: 'Benchmarks', to: '/benchmarks' }, { label: 'Pipeline', to: '/pipeline' },
]

const ENGINES = [
  { id: 'input', label: 'Input', sublabel: '3×224×224', x: 30, y: 200, latencyMs: null, color: '#bac9cc' },
  { id: 'onnx', label: 'ONNX.js', sublabel: 'WebAssembly', x: 230, y: 200, latencyMs: 9, color: '#baffa2' },
  { id: 'tfjs', label: 'TF.js', sublabel: 'CPU Backend', x: 430, y: 200, latencyMs: 14, color: '#c3f5ff' },
  { id: 'webgl', label: 'WebGL', sublabel: 'GPU Compute', x: 630, y: 200, latencyMs: 22, color: '#ecb2ff' },
  { id: 'output', label: 'Output', sublabel: '1000-class', x: 830, y: 200, latencyMs: null, color: '#bac9cc' },
]

const BENCHMARKS = [
  { label: 'ONNX.js (WASM)', ms: 9, bar: 0.06, color: '#baffa2' },
  { label: 'TF.js (CPU)', ms: 14, bar: 0.09, color: '#c3f5ff' },
  { label: 'WebGL Shader', ms: 22, bar: 0.14, color: '#ecb2ff' },
  { label: 'TF Lite (native)', ms: 18, bar: 0.12, color: '#c3f5ff' },
  { label: 'TF Backend (py)', ms: 156, bar: 1.0, color: '#ffb4ab' },
]

const HEATMAP_LEGEND = [
  { label: '< 10ms', color: '#baffa2' },
  { label: '10–20ms', color: '#c3f5ff' },
  { label: '20–50ms', color: '#ecb2ff' },
  { label: '50–100ms', color: '#ffb4ab66' },
  { label: '> 100ms', color: '#ffb4ab' },
]

const FOOTER_ACTIONS = [
  { icon: 'build', label: 'Compile', active: false },
  { icon: 'fact_check', label: 'Validate', active: false },
  { icon: 'list_alt', label: 'Logs', active: true },
  { icon: 'terminal', label: 'Terminal', active: false },
]

export default function AnalyticsBenchmarks() {
  const { pathname } = useLocation()
  const [heatmap, setHeatmap] = useState(false)
  const [running, setRunning] = useState(false)

  const handleRun = () => {
    setRunning(true)
    setTimeout(() => setRunning(false), 2000)
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 22, cursor: 'pointer' }}>notifications</span>
          <span className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 22, cursor: 'pointer' }}>account_circle</span>
        </div>
      </motion.header>

      {/* Left Sidebar */}
      <motion.aside initial={{ x: -320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
        style={{ position: 'fixed', left: 0, top: 64, bottom: 48, width: 320, background: 'rgba(28,27,27,0.7)', backdropFilter: 'blur(20px)', borderRight: '1px solid #3b494c', display: 'flex', flexDirection: 'column', zIndex: 40, overflowY: 'auto' }}>

        {/* Engine Controls */}
        <div style={{ padding: 24, borderBottom: '1px solid #3b494c' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', marginBottom: 16 }}>Engine Controls</div>
          <motion.button onClick={handleRun} whileHover={{ filter: 'brightness(1.1)' }} whileTap={{ scale: 0.97 }}
            style={{ width: '100%', padding: '12px', background: running ? '#00b3c9' : '#00daf3', color: '#00363d', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <motion.span className="material-symbols-outlined" style={{ fontSize: 18 }}
              animate={running ? { rotate: 360 } : { rotate: 0 }} transition={running ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}>
              {running ? 'refresh' : 'play_arrow'}
            </motion.span>
            {running ? 'RUNNING...' : 'RUN INFERENCE'}
          </motion.button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#bac9cc' }}>Heatmap View</span>
            <motion.div onClick={() => setHeatmap(!heatmap)}
              style={{ width: 44, height: 24, borderRadius: 12, background: heatmap ? '#00daf3' : '#3b494c', cursor: 'pointer', position: 'relative' }}>
              <motion.div animate={{ x: heatmap ? 22 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff' }} />
            </motion.div>
          </div>
        </div>

        {/* Performance Benchmarking */}
        <div style={{ padding: 24, borderBottom: '1px solid #3b494c' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', marginBottom: 16 }}>Performance Benchmarking</div>
          {BENCHMARKS.map((b, i) => (
            <motion.div key={b.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.07 }}
              style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#bac9cc' }}>{b.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: b.color }}>{b.ms}ms</span>
              </div>
              <div style={{ height: 4, background: '#2a2a2a', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${b.bar * 100}%` }} transition={{ delay: 0.4 + i * 0.07, duration: 0.6 }}
                  style={{ height: '100%', background: b.color, borderRadius: 2 }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Heatmap Legend */}
        <div style={{ padding: 24 }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', marginBottom: 16 }}>Heatmap Legend</div>
          {HEATMAP_LEGEND.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: 2, background: item.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#bac9cc' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </motion.aside>

      {/* Main Canvas */}
      <main style={{ marginLeft: 320, marginTop: 64, marginBottom: 48, height: 'calc(100vh - 64px - 48px)', overflow: 'hidden', position: 'relative', backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize: '32px 32px', background: '#0e0e0e' }}>
        {/* Section title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ position: 'absolute', top: 32, left: 32, fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc' }}>
          Inference Engine Flow
        </motion.div>

        {/* SVG connections */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
          {ENGINES.slice(0, -1).map((eng, i) => {
            const next = ENGINES[i + 1]
            const x1 = eng.x + 140, y1 = eng.y + 32, x2 = next.x, y2 = next.y + 32
            const isActive = i === 0
            return (
              <g key={eng.id}>
                <path d={`M ${x1},${y1} L ${x2},${y2}`} fill="none" stroke={isActive ? '#00daf3' : '#3b494c'} strokeWidth="2"
                  style={isActive ? { filter: 'drop-shadow(0 0 4px #00daf3)' } : undefined} />
                {isActive && (
                  <motion.circle r="4" fill="#00daf3"
                    animate={{ offsetDistance: ['0%', '100%'] }}
                    style={{ offsetPath: `path('M ${x1},${y1} L ${x2},${y2}')` }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear', delay: i * 0.3 }} />
                )}
              </g>
            )
          })}
        </svg>

        {/* Engine nodes */}
        {ENGINES.map((eng, i) => {
          const isInput = eng.latencyMs === null
          const nodeColor = heatmap ? eng.color : (isInput ? '#3b494c' : '#00daf3')
          return (
            <motion.div key={eng.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
              whileHover={{ borderColor: nodeColor, boxShadow: `0 0 16px ${nodeColor}40` }}
              style={{ position: 'absolute', left: eng.x, top: eng.y, width: 140, height: 64, background: '#201f1f', border: `1px solid ${heatmap ? eng.color + '66' : '#3b494c'}`, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                ...(heatmap && !isInput ? { boxShadow: `0 0 20px ${eng.color}33` } : {}) }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: heatmap ? eng.color : (isInput ? '#bac9cc' : '#c3f5ff'), letterSpacing: '0.05em' }}>{eng.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginTop: 2 }}>{eng.sublabel}</div>
              {eng.latencyMs !== null && (
                <div style={{ position: 'absolute', top: -12, right: 8, background: heatmap ? eng.color : '#00daf3', color: heatmap ? '#0e0e0e' : '#00363d', fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{eng.latencyMs}ms</div>
              )}
              {/* Ports */}
              <div style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: '#3b494c' }} />
              <div style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: '#3b494c' }} />
            </motion.div>
          )
        })}

        {/* Stats overlay */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ position: 'absolute', bottom: 32, right: 32, display: 'flex', gap: 16 }}>
          {[
            { label: 'Best Latency', value: '9ms', color: '#baffa2' },
            { label: 'Avg Latency', value: '16ms', color: '#c3f5ff' },
            { label: 'Worst Latency', value: '156ms', color: '#ffb4ab' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(28,27,27,0.9)', backdropFilter: 'blur(12px)', border: '1px solid #3b494c', padding: '12px 16px', borderRadius: 4 }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#bac9cc', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, delay: 0.15 }}
        style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 48, background: '#2a2a2a', borderTop: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ae500' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#baffa2' }}>Engine Online</span>
          <div style={{ width: 1, height: 16, background: '#3b494c' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#bac9cc' }}>Best: ONNX.js @ 9ms</span>
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
