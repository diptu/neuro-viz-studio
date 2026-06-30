import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Models', to: '/' }, { label: 'Export', to: '/export' }, { label: 'Deploy', to: '/deploy' },
  { label: 'Pipeline', to: '/pipeline' }, { label: 'Dashboard', to: '/dashboard' },
]

interface DeployTarget {
  id: string; name: string; desc: string; icon: string; color: string; badge: string
  sub: string[]; latency: string; pkg: string
}

const TARGETS: DeployTarget[] = [
  { id: 'browser', name: 'Web / Browser', desc: 'Run model directly in-browser via ONNX.js or TF.js — zero install for users.', icon: 'language', color: '#c3f5ff', badge: 'WASM', sub: ['ONNX.js', 'TF.js CPU', 'WebGL shader'], latency: '9–22ms', pkg: 'neuroviz.js' },
  { id: 'mobile', name: 'Mobile (TFLite)', desc: 'Quantized INT8 export optimised for ARM processors on Android and iOS.', icon: 'phone_android', color: '#baffa2', badge: 'INT8', sub: ['TFLite', 'Core ML', 'NNAPI'], latency: '6–11ms', pkg: 'model.tflite' },
  { id: 'desktop', name: 'Desktop (LibTorch)', desc: 'C++ inference binary for Mac/Linux/Windows desktop deployment.', icon: 'computer', color: '#ecb2ff', badge: 'C++', sub: ['LibTorch', 'OpenVINO', 'DirectML'], latency: '4–8ms', pkg: 'model.pt' },
  { id: 'cloud', name: 'Cloud / API', desc: 'Deploy to TF Serving or Triton for high-throughput REST inference.', icon: 'cloud_upload', color: '#c3f5ff', badge: 'REST', sub: ['TF Serving', 'Triton', 'TorchServe'], latency: '3–5ms', pkg: 'saved_model/' },
  { id: 'edge', name: 'Edge / Embedded', desc: 'TensorRT INT8 or SNPE for embedded systems and AI accelerators.', icon: 'developer_board', color: '#ffb4ab', badge: 'FP16', sub: ['TensorRT', 'SNPE', 'OpenVINO'], latency: '2–5ms', pkg: 'model.engine' },
]

const FOOTER_ACTIONS = [
  { icon: 'build', label: 'Compile', active: false },
  { icon: 'fact_check', label: 'Validate', active: false },
  { icon: 'list_alt', label: 'Logs', active: true },
  { icon: 'terminal', label: 'Terminal', active: false },
]

export default function DeployInterface() {
  const { pathname } = useLocation()
  const [selected, setSelected] = useState<string[]>(['browser'])
  const [deployed, setDeployed] = useState(false)

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const target = TARGETS.find(t => t.id === (selected[0] ?? 'browser'))

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

      <main className="custom-scrollbar" style={{ marginTop: 64, marginBottom: 48, height: 'calc(100vh - 64px - 48px)', overflowY: 'auto', padding: 40 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Inter', fontSize: 24, fontWeight: 700, color: '#e5e2e1', marginBottom: 8 }}>Run Anywhere</h1>
          <p style={{ fontFamily: 'Inter', fontSize: 14, color: '#bac9cc' }}>Select your deployment targets — export & packaging handled automatically.</p>
        </motion.div>

        {/* Target cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20, marginBottom: 40 }}>
          {TARGETS.map((tgt, i) => {
            const isSelected = selected.includes(tgt.id)
            return (
              <motion.div key={tgt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                onClick={() => toggle(tgt.id)}
                whileHover={{ borderColor: tgt.color + '80', boxShadow: `0 4px 24px ${tgt.color}10` }}
                style={{ padding: 24, background: isSelected ? tgt.color + '08' : '#201f1f', border: `2px solid ${isSelected ? tgt.color : '#3b494c'}`, borderRadius: 8, cursor: 'pointer', position: 'relative' }}>
                {isSelected && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: tgt.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#0e0e0e' }}>check</span>
                  </motion.div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: tgt.color + '1a', border: `1px solid ${tgt.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: tgt.color }}>{tgt.icon}</span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: 700, color: '#e5e2e1' }}>{tgt.name}</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, padding: '2px 6px', background: tgt.color + '22', color: tgt.color, border: `1px solid ${tgt.color}44`, borderRadius: 4, letterSpacing: '0.05em' }}>{tgt.badge}</span>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#849396' }}>{tgt.pkg}</div>
                  </div>
                </div>

                <p style={{ fontFamily: 'Inter', fontSize: 13, color: '#bac9cc', lineHeight: 1.6, marginBottom: 14 }}>{tgt.desc}</p>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {tgt.sub.map(s => (
                    <span key={s} style={{ fontFamily: 'JetBrains Mono', fontSize: 9, padding: '2px 8px', background: '#2a2a2a', border: '1px solid #3b494c', borderRadius: 4, color: '#bac9cc' }}>{s}</span>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: tgt.color }}>speed</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: tgt.color, fontWeight: 700 }}>{tgt.latency}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#849396' }}>avg. latency</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Deploy panel */}
        {selected.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#201f1f', border: '1px solid #3b494c', borderRadius: 8, padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: '#e5e2e1', marginBottom: 6 }}>
                Deploy to {selected.length} target{selected.length > 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selected.map(id => {
                  const t = TARGETS.find(x => x.id === id)!
                  return (
                    <span key={id} style={{ fontFamily: 'JetBrains Mono', fontSize: 10, padding: '3px 10px', background: t.color + '22', color: t.color, border: `1px solid ${t.color}44`, borderRadius: 4 }}>
                      {t.name}
                    </span>
                  )
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396', marginBottom: 2 }}>BEST LATENCY</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 700, color: target?.color ?? '#c3f5ff' }}>{target?.latency ?? '—'}</div>
              </div>
              <motion.button onClick={() => setDeployed(!deployed)} whileHover={{ filter: 'brightness(1.1)' }} whileTap={{ scale: 0.97 }}
                style={{ padding: '12px 32px', background: deployed ? '#baffa2' : '#00daf3', color: deployed ? '#0e6800' : '#00363d', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{deployed ? 'check_circle' : 'rocket_launch'}</span>
                {deployed ? 'DEPLOYED!' : 'DEPLOY NOW'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <motion.footer initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, delay: 0.15 }}
        style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 48, background: '#2a2a2a', borderTop: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ae500' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#baffa2' }}>{selected.length} target{selected.length !== 1 ? 's' : ''} selected</span>
          <div style={{ width: 1, height: 16, background: '#3b494c' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#bac9cc' }}>ResNet-50 · v2.1</span>
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
