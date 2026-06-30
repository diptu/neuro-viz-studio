import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Models', to: '/' }, { label: 'Editor', to: '/editor' }, { label: 'Diagnostics', to: '/diagnostics' },
  { label: 'Research', to: '/research' }, { label: 'Dashboard', to: '/dashboard' },
]

const LAYER_CATS = [
  { icon: 'input', label: 'Input / Output' },
  { icon: 'blur_on', label: 'Convolutional', active: true, children: ['Conv2D', 'ConvTranspose'] },
  { icon: 'repeat', label: 'Recurrent' },
  { icon: 'waves', label: 'Normalization' },
  { icon: 'bolt', label: 'Activation' },
]

interface DiagError { id: string; type: string; title: string; msg: string; fix: string }

const ERRORS: DiagError[] = [
  {
    id: 'dim-mismatch',
    type: 'DIMENSION_MISMATCH',
    title: 'Dimension Mismatch',
    msg: 'Conv2D layer expects input shape [B, 3, H, W] but received [B, 64, H, W]. Input channels do not align with the layer\'s in_channels=3.',
    fix: 'Match Input Depth → in_channels=64',
  },
  {
    id: 'stride-err',
    type: 'STRIDE_ERROR',
    title: 'Output Shape Underflow',
    msg: 'With stride=4 and kernel=3 on a 7×7 feature map, the output size would be negative. Reduce stride or increase padding.',
    fix: 'Auto-fix Stride → stride=1',
  },
]

const CODE_LINES = [
  { content: 'class Network(nn.Module):', indent: 0, dim: true, error: false },
  { content: '  def __init__(self):', indent: 0, dim: true, error: false },
  { content: '    self.conv1 = nn.Conv2d(3, 64, 3)   # OK', indent: 0, dim: true, error: false },
  { content: '    self.conv2 = nn.Conv2d(3, 128, 3)  # ← ERROR', indent: 0, dim: false, error: true },
  { content: '    self.relu  = nn.ReLU(inplace=True)', indent: 0, dim: true, error: false },
]

const FOOTER_ACTIONS = [
  { icon: 'build', label: 'Compile', active: false },
  { icon: 'fact_check', label: 'Validate', active: true },
  { icon: 'list_alt', label: 'Logs', active: false },
  { icon: 'terminal', label: 'Terminal', active: false },
]

export default function AIDiagnostics() {
  const { pathname } = useLocation()
  const [selectedError, setSelectedError] = useState<string>('dim-mismatch')
  const [fixed, setFixed] = useState<Record<string, boolean>>({})

  const activeError = ERRORS.find(e => e.id === selectedError)

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffb4ab' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#ffb4ab' }}>2 ERRORS</span>
          <span className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 22, cursor: 'pointer', marginLeft: 8 }}>account_circle</span>
        </div>
      </motion.header>

      <div style={{ marginTop: 64, marginBottom: 48, height: 'calc(100vh - 64px - 48px)', display: 'flex' }}>
        {/* Left Sidebar */}
        <motion.aside initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }}
          style={{ width: 280, borderRight: '1px solid #3b494c', display: 'flex', flexDirection: 'column', background: 'rgba(28,27,27,0.7)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
          <div style={{ padding: '16px 16px', borderBottom: '1px solid #3b494c', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc' }}>Layer Library</div>
          <div style={{ padding: 16, flex: 1 }}>
            {LAYER_CATS.map(cat => (
              <div key={cat.label}>
                <motion.div whileHover={{ color: '#e5e2e1' }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 8px', color: (cat as { active?: boolean }).active ? '#c3f5ff' : '#bac9cc', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 11, borderLeft: (cat as { active?: boolean }).active ? '2px solid #c3f5ff' : '2px solid transparent', paddingLeft: (cat as { active?: boolean }).active ? 12 : 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{cat.icon}</span>
                    {cat.label}
                  </div>
                  {cat.children && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>expand_more</span>}
                </motion.div>
                {cat.children && (
                  <div style={{ paddingLeft: 32, paddingBottom: 8 }}>
                    {cat.children.map(child => (
                      <div key={child} style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00daf3', flexShrink: 0 }} />{child}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Error list */}
          <div style={{ padding: 16, borderTop: '1px solid #3b494c' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffb4ab', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>Detected Issues
            </div>
            {ERRORS.map(err => (
              <motion.div key={err.id} onClick={() => setSelectedError(err.id)} whileHover={{ background: 'rgba(255,180,171,0.05)' }}
                style={{ padding: '8px 10px', borderRadius: 4, cursor: 'pointer', marginBottom: 6, border: `1px solid ${selectedError === err.id ? '#ffb4ab66' : '#3b494c'}`, background: selectedError === err.id ? 'rgba(255,180,171,0.06)' : 'transparent' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: fixed[err.id] ? '#baffa2' : '#ffb4ab' }}>
                  {fixed[err.id] ? '✓ Fixed: ' : ''}{err.title}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396', marginTop: 2 }}>{err.type}</div>
              </motion.div>
            ))}
          </div>
        </motion.aside>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0e0e0e', backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize: '32px 32px' }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            <path d="M 190,280 L 310,280" fill="none" stroke="#00daf3" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 4px #00daf3)' }} />
            <path d="M 510,280 L 630,280" fill="none" stroke="#ffb4ab" strokeWidth="2" strokeDasharray="6" />
            <motion.path d="M 510,280 L 630,280" fill="none" stroke="#ffb4ab" strokeWidth="2" strokeDasharray="6"
              animate={{ strokeDashoffset: [0, -12] }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
          </svg>

          {/* Input node (ok) */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
            style={{ position: 'absolute', left: 50, top: 252, width: 140, height: 56, background: '#201f1f', border: '1px solid #3b494c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: '#bac9cc' }}>Input</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#849396' }}>3×224×224</div>
            <div style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: '#3b494c' }} />
          </motion.div>

          {/* Conv2D OK node */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            style={{ position: 'absolute', left: 310, top: 252, width: 140, height: 56, background: '#201f1f', border: '1px solid #00daf3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 0 16px rgba(0,218,243,0.3)' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: '#c3f5ff' }}>Conv2D</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc' }}>in=3, out=64</div>
            <div style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: '#00daf3' }} />
            <div style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: '#00daf3' }} />
          </motion.div>

          {/* ERROR Conv2D node */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}
            style={{ position: 'absolute', left: 630, top: 252, width: 140, height: 56, background: '#201f1f', border: '2px solid #ffb4ab', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 0 20px rgba(255,180,171,0.25)' }}>
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
              style={{ position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: '50%', background: '#ffb4ab' }} />
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: '#ffb4ab' }}>Conv2D</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#ffb4ab99' }}>in=3 ← MISMATCH</div>
            <div style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: '#ffb4ab' }} />
          </motion.div>
        </div>

        {/* Right: Diagnostics Panel */}
        <motion.aside initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}
          style={{ width: 320, borderLeft: '1px solid #3b494c', display: 'flex', flexDirection: 'column', background: 'rgba(28,27,27,0.7)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #3b494c', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#ffb4ab' }}>psychology</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: '#ffb4ab', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Diagnostics</span>
          </div>

          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {activeError && (
              <>
                {/* Error alert */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'rgba(255,180,171,0.06)', border: '1px solid #ffb4ab44', borderRadius: 6, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#ffb4ab' }}>error</span>
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: '#ffb4ab', letterSpacing: '0.05em' }}>{activeError.type}</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#849396' }}>{activeError.title}</div>
                    </div>
                  </div>
                  <p style={{ fontFamily: 'Inter', fontSize: 12, color: '#bac9cc', lineHeight: 1.7, marginBottom: 16 }}>{activeError.msg}</p>

                  {/* Suggested fix */}
                  <motion.button
                    onClick={() => setFixed(prev => ({ ...prev, [activeError.id]: true }))}
                    whileHover={{ filter: 'brightness(1.15)', boxShadow: '0 0 20px rgba(121,255,91,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{ width: '100%', padding: '12px 16px', background: fixed[activeError.id] ? '#baffa2' : 'rgba(121,255,91,0.1)', border: `1px solid ${fixed[activeError.id] ? '#baffa2' : '#79ff5b'}`, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: fixed[activeError.id] ? '#0e6800' : '#79ff5b', letterSpacing: '0.05em' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{fixed[activeError.id] ? 'check_circle' : 'auto_fix_high'}</span>
                    {fixed[activeError.id] ? 'FIXED!' : activeError.fix}
                  </motion.button>
                </motion.div>

                {/* Code with error highlight */}
                <div style={{ background: '#0e0e0e', border: '1px solid #3b494c', borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
                  <div style={{ padding: '6px 12px', borderBottom: '1px solid #3b494c', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ffb4ab' }}>code</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc' }}>model.py</span>
                  </div>
                  <div style={{ padding: 12 }}>
                    {CODE_LINES.map((line, i) => (
                      <div key={i} style={{ fontFamily: 'JetBrains Mono', fontSize: 11, lineHeight: 1.7, color: line.error ? '#ffb4ab' : line.dim ? '#849396' : '#e5e2e1', background: line.error ? 'rgba(255,180,171,0.06)' : 'transparent', borderLeft: line.error ? '2px solid #ffb4ab' : '2px solid transparent', paddingLeft: line.error ? 6 : 8, marginLeft: -8, paddingRight: 8 }}>
                        {line.content}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parameter fix controls */}
                <div style={{ background: '#201f1f', border: '1px solid #3b494c', borderRadius: 4, padding: 16 }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', marginBottom: 12 }}>Parameter Correction</div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', display: 'block', marginBottom: 6 }}>in_channels</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[3, 16, 32, 64].map(v => (
                        <motion.button key={v} whileHover={{ borderColor: '#00daf3' }}
                          style={{ flex: 1, padding: '6px 0', background: v === 64 ? 'rgba(0,218,243,0.1)' : 'transparent', border: `1px solid ${v === 64 ? '#00daf3' : '#3b494c'}`, borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 10, color: v === 64 ? '#c3f5ff' : '#bac9cc', cursor: 'pointer' }}>
                          {v}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', display: 'block', marginBottom: 6 }}>out_channels</label>
                    <input defaultValue="128" style={{ width: '100%', background: '#0e0e0e', border: '1px solid #3b494c', borderRadius: 4, padding: '6px 8px', fontFamily: 'JetBrains Mono', fontSize: 11, color: '#e5e2e1', outline: 'none' }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.aside>
      </div>

      {/* Footer */}
      <motion.footer initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, delay: 0.15 }}
        style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 48, background: '#2a2a2a', borderTop: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffb4ab' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#ffb4ab' }}>2 Errors Detected</span>
          <div style={{ width: 1, height: 16, background: '#3b494c' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#bac9cc' }}>{Object.values(fixed).filter(Boolean).length} / {ERRORS.length} fixed</span>
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
