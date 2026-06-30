import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Models', to: '/' }, { label: 'Benchmarks', to: '/benchmarks' }, { label: 'Environment', to: '/environment' },
  { label: 'Export', to: '/export' }, { label: 'Dashboard', to: '/dashboard' },
]

const TARGETS = [
  { id: 'mobile', label: 'Mobile TFLite', icon: 'phone_android', desc: 'ARM CPU / GPU', color: '#baffa2' },
  { id: 'cloud', label: 'Cloud Server', icon: 'cloud', desc: 'CUDA / TF Serving', color: '#c3f5ff' },
  { id: 'edge', label: 'Edge Device', icon: 'memory', desc: 'TensorRT / NPU', color: '#ecb2ff' },
]

const METRICS: Record<string, Array<{ label: string; ms: number; bar: number; color: string }>> = {
  mobile: [
    { label: 'TFLite (int8)', ms: 6, bar: 0.04, color: '#baffa2' },
    { label: 'TFLite (fp16)', ms: 11, bar: 0.07, color: '#baffa2' },
    { label: 'NNAPI delegate', ms: 9, bar: 0.06, color: '#c3f5ff' },
    { label: 'Core ML (iOS)', ms: 7, bar: 0.05, color: '#c3f5ff' },
  ],
  cloud: [
    { label: 'TF Serving (GPU)', ms: 4, bar: 0.03, color: '#baffa2' },
    { label: 'ONNX Runtime', ms: 9, bar: 0.06, color: '#baffa2' },
    { label: 'TorchServe', ms: 12, bar: 0.08, color: '#c3f5ff' },
    { label: 'Triton (batch=32)', ms: 3, bar: 0.02, color: '#baffa2' },
  ],
  edge: [
    { label: 'TensorRT INT8', ms: 3, bar: 0.02, color: '#baffa2' },
    { label: 'TensorRT FP16', ms: 5, bar: 0.03, color: '#baffa2' },
    { label: 'OpenVINO', ms: 8, bar: 0.05, color: '#c3f5ff' },
    { label: 'SNPE (Snapdragon)', ms: 7, bar: 0.05, color: '#c3f5ff' },
  ],
}

const OPT_NODES = [
  { label: 'Base Model', x: 30, y: 180, color: '#bac9cc', desc: '124 MB' },
  { label: 'Quantize', x: 230, y: 180, color: '#c3f5ff', desc: 'INT8' },
  { label: 'Prune', x: 430, y: 180, color: '#ecb2ff', desc: '40% sparse' },
  { label: 'Fuse Ops', x: 630, y: 180, color: '#baffa2', desc: 'Conv+BN+ReLU' },
  { label: 'Optimized', x: 830, y: 180, color: '#00daf3', desc: '18 MB' },
]

const FOOTER_ACTIONS = [
  { icon: 'build', label: 'Compile', active: false },
  { icon: 'fact_check', label: 'Validate', active: false },
  { icon: 'list_alt', label: 'Logs', active: true },
  { icon: 'terminal', label: 'Terminal', active: false },
]

export default function EnvironmentOptimization() {
  const { pathname } = useLocation()
  const [target, setTarget] = useState('mobile')
  const [running, setRunning] = useState(false)
  const metrics = METRICS[target]

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

      {/* Left Sidebar */}
      <motion.aside initial={{ x: -320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }}
        style={{ position: 'fixed', left: 0, top: 64, bottom: 48, width: 320, background: 'rgba(28,27,27,0.7)', backdropFilter: 'blur(20px)', borderRight: '1px solid #3b494c', display: 'flex', flexDirection: 'column', zIndex: 40, overflowY: 'auto' }}>

        {/* Controls */}
        <div style={{ padding: 24, borderBottom: '1px solid #3b494c' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', marginBottom: 16 }}>Optimization Controls</div>
          <motion.button onClick={() => setRunning(!running)} whileHover={{ filter: 'brightness(1.1)' }} whileTap={{ scale: 0.97 }}
            style={{ width: '100%', padding: '12px', background: running ? '#baffa2' : '#00daf3', color: running ? '#0e6800' : '#00363d', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{running ? 'check' : 'tune'}</span>
            {running ? 'OPTIMIZED!' : 'OPTIMIZE MODEL'}
          </motion.button>

          {/* Target environment radios */}
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', marginBottom: 12 }}>Target Environment</div>
          {TARGETS.map(t => (
            <motion.div key={t.id} onClick={() => setTarget(t.id)} whileHover={{ background: 'rgba(53,53,52,0.4)' }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 4, cursor: 'pointer', marginBottom: 6, background: target === t.id ? `${t.color}0d` : 'transparent', border: `1px solid ${target === t.id ? t.color + '66' : '#3b494c'}` }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${t.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {target === t.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />}
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: t.color }}>{t.icon}</span>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, color: target === t.id ? t.color : '#e5e2e1' }}>{t.label}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396' }}>{t.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Benchmarks */}
        <div style={{ padding: 24 }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', marginBottom: 16 }}>Benchmarks — {TARGETS.find(t => t.id === target)?.label}</div>
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#bac9cc' }}>{m.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: m.color }}>{m.ms}ms</span>
              </div>
              <div style={{ height: 4, background: '#2a2a2a', borderRadius: 2 }}>
                <motion.div key={`${target}-${m.label}`} initial={{ width: 0 }} animate={{ width: `${m.bar * 100}%` }} transition={{ duration: 0.6, delay: 0.2 + i * 0.06 }}
                  style={{ height: '100%', background: m.color, borderRadius: 2 }} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.aside>

      {/* Main Canvas */}
      <main style={{ marginLeft: 320, marginTop: 64, marginBottom: 48, height: 'calc(100vh - 64px - 48px)', overflow: 'hidden', position: 'relative', background: '#0e0e0e', backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize: '32px 32px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ position: 'absolute', top: 32, left: 32, fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc' }}>
          Optimization Pipeline — {TARGETS.find(t => t.id === target)?.label}
        </motion.div>

        {/* SVG connections */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
          {OPT_NODES.slice(0, -1).map((node, i) => {
            const next = OPT_NODES[i + 1]
            return (
              <g key={node.label}>
                <path d={`M ${node.x + 140},${node.y + 32} L ${next.x},${next.y + 32}`} fill="none" stroke="#3b494c" strokeWidth="2" />
                <motion.circle r="4" fill="#00daf3"
                  animate={{ cx: [node.x + 140, next.x], cy: [node.y + 32, next.y + 32] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3, ease: 'linear' }} />
              </g>
            )
          })}
        </svg>

        {/* Nodes */}
        {OPT_NODES.map((node, i) => (
          <motion.div key={node.label} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.1 }}
            whileHover={{ boxShadow: `0 0 16px ${node.color}40`, borderColor: node.color }}
            style={{ position: 'absolute', left: node.x, top: node.y, width: 140, height: 64, background: '#201f1f', border: `1px solid ${node.color}66`, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: node.color, letterSpacing: '0.05em' }}>{node.label}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginTop: 2 }}>{node.desc}</div>
            <div style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: node.color + '88' }} />
            <div style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: node.color + '88' }} />
          </motion.div>
        ))}

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ position: 'absolute', bottom: 32, right: 32, display: 'flex', gap: 12 }}>
          {[
            { label: 'Model Size', before: '124 MB', after: '18 MB', color: '#baffa2' },
            { label: 'Best Latency', before: '—', after: `${metrics[0]?.ms ?? 6}ms`, color: '#c3f5ff' },
            { label: 'Compression', before: '1×', after: '6.9×', color: '#ecb2ff' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(28,27,27,0.9)', backdropFilter: 'blur(12px)', border: '1px solid #3b494c', padding: '12px 16px', borderRadius: 4, minWidth: 120 }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#849396', textDecoration: 'line-through' }}>{s.before}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 12, color: s.color }}>arrow_forward</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 700, color: s.color }}>{s.after}</span>
              </div>
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
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#baffa2' }}>Optimizer Ready</span>
          <div style={{ width: 1, height: 16, background: '#3b494c' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#bac9cc' }}>Target: {TARGETS.find(t => t.id === target)?.label}</span>
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
