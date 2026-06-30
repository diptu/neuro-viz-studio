import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Models', to: '/' }, { label: 'Editor', to: '/editor' }, { label: 'Pipeline', to: '/pipeline' },
  { label: 'Export', to: '/export' }, { label: 'Benchmarks', to: '/benchmarks' },
]

const FRAMEWORKS = [
  { id: 'pytorch', name: 'PyTorch', desc: 'Native .pt / TorchScript', icon: 'local_fire_department', color: '#c3f5ff', recommended: true, size: '124 MB' },
  { id: 'tensorflow', name: 'TensorFlow', desc: 'SavedModel / TF Lite', icon: 'science', color: '#ecb2ff', recommended: false, size: '118 MB' },
  { id: 'onnx', name: 'ONNX', desc: 'Cross-platform IR format', icon: 'hub', color: '#baffa2', recommended: false, size: '102 MB' },
  { id: 'libTorch', name: 'C++ / LibTorch', desc: 'Production C++ deployment', icon: 'memory', color: '#ffb4ab', recommended: false, size: '96 MB' },
]

const FOOTER_ACTIONS = [
  { icon: 'build', label: 'Compile', active: false },
  { icon: 'fact_check', label: 'Validate', active: false },
  { icon: 'list_alt', label: 'Logs', active: true },
  { icon: 'terminal', label: 'Terminal', active: false },
]

export default function SmartExport() {
  const { pathname } = useLocation()
  const [selected, setSelected] = useState('pytorch')
  const [generated, setGenerated] = useState(false)

  const handleGenerate = () => {
    setGenerated(true)
    setTimeout(() => setGenerated(false), 2000)
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
        <span className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 22, cursor: 'pointer' }}>account_circle</span>
      </motion.header>

      {/* Background canvas (dimmed) */}
      <div style={{ position: 'fixed', top: 64, bottom: 48, left: 0, right: 0, opacity: 0.3, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
        style={{ position: 'fixed', inset: 0, top: 64, bottom: 48, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: 680, background: '#201f1f', border: '1px solid #3b494c', borderRadius: 8, padding: 40, boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>

          {/* Modal header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(0,218,243,0.1)', border: '1px solid #00daf366', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#00daf3' }}>file_download</span>
                </div>
                <h2 style={{ fontFamily: 'Inter', fontSize: 20, fontWeight: 700, color: '#e5e2e1' }}>Select Export Framework</h2>
              </div>
              <p style={{ fontFamily: 'Inter', fontSize: 13, color: '#bac9cc', marginLeft: 48 }}>Choose the target format for your trained model.</p>
            </div>
            <Link to="/">
              <motion.button whileHover={{ background: '#2a2a2a', color: '#e5e2e1' }}
                style={{ width: 32, height: 32, background: 'transparent', border: '1px solid #3b494c', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bac9cc' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </motion.button>
            </Link>
          </div>

          {/* Framework cards — 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
            {FRAMEWORKS.map((fw, i) => (
              <motion.div
                key={fw.id}
                onClick={() => setSelected(fw.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ borderColor: fw.color + '80' }}
                style={{ padding: 20, border: `2px solid ${selected === fw.id ? fw.color : '#3b494c'}`, borderRadius: 8, cursor: 'pointer', position: 'relative', background: selected === fw.id ? fw.color + '08' : 'transparent', transition: 'border-color 0.2s, background 0.2s' }}>
                {fw.recommended && (
                  <span style={{ position: 'absolute', top: -1, right: 12, background: '#00daf3', color: '#00363d', fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: '0 0 4px 4px', letterSpacing: '0.05em' }}>RECOMMENDED</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: fw.color }}>{fw.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: 600, color: '#e5e2e1' }}>{fw.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginTop: 2 }}>{fw.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#bac9cc' }}>~{fw.size}</span>
                  {selected === fw.id && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="material-symbols-outlined" style={{ fontSize: 18, color: fw.color }}>check_circle</motion.span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Preview */}
          <AnimatePresence mode="wait">
            <motion.div key={selected} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: '#0e0e0e', border: '1px solid #3b494c', borderRadius: 4, padding: 16, marginBottom: 24, overflow: 'hidden' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginBottom: 8 }}>PREVIEW COMMAND</div>
              <code style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#00daf3' }}>
                {selected === 'pytorch' && 'torch.onnx.export(model, dummy, "model.pt")'}
                {selected === 'tensorflow' && 'tf.saved_model.save(model, "./saved_model")'}
                {selected === 'onnx' && 'neuroviz export --format onnx --optimize'}
                {selected === 'libTorch' && 'torch.jit.script(model).save("model.pt")'}
              </code>
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Link to="/">
              <motion.button whileHover={{ background: '#2a2a2a' }}
                style={{ padding: '10px 24px', background: 'transparent', border: '1px solid #3b494c', borderRadius: 4, color: '#bac9cc', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', cursor: 'pointer' }}>
                CANCEL
              </motion.button>
            </Link>
            <motion.button onClick={handleGenerate} whileHover={{ filter: 'brightness(1.1)' }} whileTap={{ scale: 0.97 }}
              style={{ padding: '10px 32px', background: generated ? '#baffa2' : '#00daf3', color: generated ? '#0e6800' : '#00363d', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s, color 0.2s' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{generated ? 'check' : 'code'}</span>
              {generated ? 'GENERATED!' : 'GENERATE CODE'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, delay: 0.15 }}
        style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 48, background: '#2a2a2a', borderTop: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ae500' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#baffa2' }}>Ready to Export</span>
          <div style={{ width: 1, height: 16, background: '#3b494c' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#bac9cc' }}>
            {FRAMEWORKS.find(f => f.id === selected)?.name ?? 'PyTorch'} selected
          </span>
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
