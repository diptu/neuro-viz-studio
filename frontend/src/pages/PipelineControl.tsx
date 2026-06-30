import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Models', to: '/' }, { label: 'Editor', to: '/editor' }, { label: 'Dashboard', to: '/dashboard' },
  { label: 'Pipeline', to: '/pipeline' }, { label: 'Export', to: '/export' },
]

const ICON_SIDEBAR = [
  { icon: 'play_circle', label: 'Run' },
  { icon: 'bug_report', label: 'Debug' },
  { icon: 'analytics', label: 'Analytics' },
  { icon: 'tune', label: 'Config' },
  { icon: 'share', label: 'Share' },
]

const GRAPH_NODES = [
  { id: 'data', label: 'Data Input', x: 20, y: 120, color: '#c3f5ff' },
  { id: 'pre', label: 'Preprocess', x: 160, y: 120, color: '#ecb2ff' },
  { id: 'model', label: 'Model', x: 300, y: 120, color: '#00daf3' },
  { id: 'post', label: 'PostProcess', x: 440, y: 120, color: '#ecb2ff' },
  { id: 'out', label: 'Output', x: 580, y: 120, color: '#baffa2' },
]

const EXPORT_FORMATS = [
  { name: 'PyTorch', size: '124 MB', icon: 'local_fire_department', checked: true, color: '#c3f5ff' },
  { name: 'ONNX', size: '118 MB', icon: 'hub', checked: true, color: '#ecb2ff' },
  { name: 'TFLite', size: '82 MB', icon: 'phone_android', checked: false, color: '#baffa2' },
]

const LOG_ENTRIES = [
  { time: '14:23:01', level: 'INFO', msg: 'Pipeline initialized', color: '#bac9cc' },
  { time: '14:23:03', level: 'INFO', msg: 'Model weights loaded (124MB)', color: '#bac9cc' },
  { time: '14:23:05', level: 'OK', msg: 'Inference complete: 9.2ms avg', color: '#baffa2' },
  { time: '14:23:06', level: 'WARN', msg: 'Memory pressure: 85%', color: '#ecb2ff' },
  { time: '14:23:08', level: 'OK', msg: 'Output tensor saved', color: '#baffa2' },
  { time: '14:23:10', level: 'INFO', msg: 'Awaiting next input...', color: '#bac9cc' },
]

const FOOTER_ACTIONS = [
  { icon: 'build', label: 'Compile', active: false },
  { icon: 'fact_check', label: 'Validate', active: false },
  { icon: 'list_alt', label: 'Logs', active: true },
  { icon: 'terminal', label: 'Terminal', active: false },
]

type Tab = 'test' | 'logs' | 'export'

export default function PipelineControl() {
  const { pathname } = useLocation()
  const [activeTab, setActiveTab] = useState<Tab>('test')
  const [dragging, setDragging] = useState(false)

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bac9cc', fontSize: 16 }}>search</span>
            <input placeholder="Search pipeline..." style={{ background: '#2a2a2a', border: '1px solid #3b494c', borderRadius: 4, padding: '6px 12px 6px 34px', fontFamily: 'JetBrains Mono', fontSize: 12, color: '#e5e2e1', outline: 'none', width: 180 }} />
          </div>
          <span className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 22, cursor: 'pointer' }}>account_circle</span>
        </div>
      </motion.header>

      {/* Narrow Icon Sidebar */}
      <motion.aside initial={{ x: -72, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
        style={{ position: 'fixed', left: 0, top: 64, bottom: 48, width: 72, background: 'rgba(28,27,27,0.9)', backdropFilter: 'blur(20px)', borderRight: '1px solid #3b494c', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24, gap: 8, zIndex: 40 }}>
        {ICON_SIDEBAR.map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
            whileHover={{ background: 'rgba(0,218,243,0.1)', color: '#c3f5ff' }}
            title={item.label}
            style={{ width: 48, height: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8, color: i === 0 ? '#00daf3' : '#bac9cc', cursor: 'pointer', background: i === 0 ? 'rgba(0,218,243,0.08)' : 'transparent' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, marginTop: 2, letterSpacing: '0.05em' }}>{item.label.toUpperCase()}</span>
          </motion.div>
        ))}
        <div style={{ flex: 1 }} />
        <motion.div whileHover={{ color: '#e5e2e1' }}
          style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, color: '#bac9cc', cursor: 'pointer', marginBottom: 16 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>settings</span>
        </motion.div>
      </motion.aside>

      {/* Main area */}
      <div style={{ marginLeft: 72, marginTop: 64, marginBottom: 48, height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
        {/* Top split: graph + tabs */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* SVG Graph */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ flex: '0 0 55%', borderRight: '1px solid #3b494c', background: '#0e0e0e', backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '32px 32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 16, left: 16, fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc' }}>Architecture Graph</div>

            {/* Toolbar */}
            <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 8 }}>
              {['zoom_in', 'zoom_out', 'center_focus_strong'].map(icon => (
                <motion.button key={icon} whileHover={{ background: '#2a2a2a' }}
                  style={{ width: 32, height: 32, background: 'rgba(28,27,27,0.8)', border: '1px solid #3b494c', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#bac9cc' }}>{icon}</span>
                </motion.button>
              ))}
            </div>

            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} viewBox="0 0 720 300">
              {/* Connections */}
              {GRAPH_NODES.slice(0, -1).map((node, i) => {
                const next = GRAPH_NODES[i + 1]
                return (
                  <g key={node.id}>
                    <line x1={node.x + 110} y1={node.y + 24} x2={next.x} y2={next.y + 24} stroke="#3b494c" strokeWidth="2" />
                    <motion.circle r="3" fill="#00daf3"
                      animate={{ cx: [node.x + 110, next.x], cy: [node.y + 24, next.y + 24] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3, ease: 'linear' }} />
                  </g>
                )
              })}
              {/* Nodes */}
              {GRAPH_NODES.map((node, i) => (
                <motion.g key={node.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                  <rect x={node.x} y={node.y} width="110" height="48" rx="2" fill="#201f1f" stroke={node.color + '66'} strokeWidth="1" />
                  <text x={node.x + 55} y={node.y + 22} textAnchor="middle" fill={node.color} fontFamily="JetBrains Mono" fontSize="10" fontWeight="700">{node.label}</text>
                  <circle cx={node.x} cy={node.y + 24} r="4" fill="#3b494c" />
                  <circle cx={node.x + 110} cy={node.y + 24} r="4" fill="#3b494c" />
                </motion.g>
              ))}
            </svg>
          </motion.div>

          {/* Tabbed panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #3b494c', background: '#201f1f', flexShrink: 0 }}>
              {(['test', 'logs', 'export'] as const).map(tab => (
                <motion.button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ flex: 1, padding: '12px 8px', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: activeTab === tab ? 700 : 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: activeTab === tab ? '#c3f5ff' : '#bac9cc', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: activeTab === tab ? '2px solid #00daf3' : '2px solid transparent' }}>
                  {tab === 'test' ? 'In-Browser Test' : tab === 'logs' ? 'Perf Logs' : 'Export Hub'}
                </motion.button>
              ))}
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', background: '#0e0e0e' }}>
              <AnimatePresence mode="wait">
                {activeTab === 'test' && (
                  <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: 24 }}>
                    <motion.div onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={() => setDragging(false)}
                      animate={{ borderColor: dragging ? '#00daf3' : '#3b494c', background: dragging ? 'rgba(0,218,243,0.04)' : 'rgba(42,42,42,0.3)' }}
                      style={{ border: '2px dashed', borderRadius: 8, padding: 40, textAlign: 'center', cursor: 'pointer', marginBottom: 20 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#bac9cc', display: 'block', marginBottom: 12 }}>upload_file</span>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#bac9cc', marginBottom: 8 }}>Drop test tensor here</div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        {['.npy', '.pt', '.onnx', '.json'].map(ext => (
                          <span key={ext} style={{ fontFamily: 'JetBrains Mono', fontSize: 10, padding: '2px 8px', background: '#2a2a2a', border: '1px solid #3b494c', borderRadius: 4, color: '#bac9cc' }}>{ext}</span>
                        ))}
                      </div>
                    </motion.div>
                    <motion.button whileHover={{ background: '#00b3c9' }} style={{ width: '100%', padding: 12, background: '#00daf3', color: '#00363d', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                      RUN IN-BROWSER TEST
                    </motion.button>
                  </motion.div>
                )}

                {activeTab === 'logs' && (
                  <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: 16 }}>
                    {LOG_ENTRIES.map((entry, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(59,73,76,0.4)', fontFamily: 'JetBrains Mono', fontSize: 11 }}>
                        <span style={{ color: '#849396', flexShrink: 0 }}>{entry.time}</span>
                        <span style={{ color: entry.color, flexShrink: 0, width: 36 }}>[{entry.level}]</span>
                        <span style={{ color: '#e5e2e1' }}>{entry.msg}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'export' && (
                  <motion.div key="export" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: 24 }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', marginBottom: 16 }}>Export Formats</div>
                    {EXPORT_FORMATS.map((fmt, i) => (
                      <motion.div key={fmt.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#201f1f', border: `1px solid ${fmt.checked ? fmt.color + '66' : '#3b494c'}`, borderRadius: 4, marginBottom: 10 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: fmt.color }}>{fmt.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: '#e5e2e1' }}>{fmt.name}</div>
                          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginTop: 2 }}>{fmt.size}</div>
                        </div>
                        {fmt.checked && <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#baffa2' }}>check_circle</span>}
                      </motion.div>
                    ))}
                    <motion.button whileHover={{ background: '#00b3c9' }} style={{ width: '100%', padding: 12, background: '#00daf3', color: '#00363d', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', border: 'none', borderRadius: 4, cursor: 'pointer', marginTop: 8 }}>
                      EXPORT ALL SELECTED
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Terminal */}
        <div style={{ flexShrink: 0, height: 120, background: '#1c1b1b', borderTop: '1px solid #3b494c', padding: '8px 16px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#bac9cc' }}>terminal</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc' }}>Terminal</span>
          </div>
          {['$ neuroviz pipeline run --model resnet50 --format onnx', '  → Exporting to onnx... 118 MB', '  ✓ Done in 2.3s'].map((line, i) => (
            <div key={i} style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: i === 0 ? '#00daf3' : i === 2 ? '#baffa2' : '#bac9cc', lineHeight: 1.7 }}>{line}</div>
          ))}
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#bac9cc', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#00daf3' }}>$</span>
            <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }}>▋</motion.span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <motion.footer initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, delay: 0.15 }}
        style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 48, background: '#2a2a2a', borderTop: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ae500' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#baffa2' }}>Pipeline Ready</span>
          <div style={{ width: 1, height: 16, background: '#3b494c' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#bac9cc' }}>5 nodes active</span>
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
