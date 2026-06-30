import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Models', to: '/' }, { label: 'Compose', to: '/compose' }, { label: 'Canvas', to: '/canvas' },
  { label: 'Editor', to: '/editor' }, { label: 'Dashboard', to: '/dashboard' }, { label: 'Pipeline', to: '/pipeline' },
]

const SIDEBAR_NAV = [
  { icon: 'dashboard', label: 'Dashboard', active: true },
  { icon: 'architecture', label: 'Architectures' },
  { icon: 'rocket_launch', label: 'Deployment' },
  { icon: 'folder_open', label: 'Assets' },
  { icon: 'bar_chart', label: 'Analytics' },
]

const STATS = [
  { label: 'Total Models', value: '24', icon: 'layers', color: '#c3f5ff' },
  { label: 'Trained', value: '18', icon: 'check_circle', color: '#baffa2' },
  { label: 'Deploying', value: '6', icon: 'cloud_upload', color: '#ecb2ff' },
]

interface Project { id: string; name: string; version: string; accuracy: string; latency: string; status: string; accent: string }

const PROJECTS: Project[] = [
  { id: '1', name: 'ResNet-50 Classifier', version: 'v2.1', accuracy: '94.7%', latency: '9ms', status: 'trained', accent: '#c3f5ff' },
  { id: '2', name: 'Transformer Encoder', version: 'v1.3', accuracy: '89.2%', latency: '14ms', status: 'trained', accent: '#ecb2ff' },
  { id: '3', name: 'U-Net Segmenter', version: 'v3.0', accuracy: '96.1%', latency: '22ms', status: 'deploying', accent: '#baffa2' },
  { id: '4', name: 'MobileNet-v3', version: 'v1.0', accuracy: '87.5%', latency: '6ms', status: 'trained', accent: '#c3f5ff' },
  { id: '5', name: 'BERT Fine-tuned', version: 'v2.0', accuracy: '91.3%', latency: '45ms', status: 'trained', accent: '#ecb2ff' },
  { id: '6', name: 'YOLOv8 Detector', version: 'v1.5', accuracy: '93.8%', latency: '18ms', status: 'deploying', accent: '#baffa2' },
]

const STATUS_COLOR: Record<string, string> = { trained: '#baffa2', deploying: '#ecb2ff', draft: '#bac9cc' }

const TEAM = [
  { initials: 'AK', name: 'Alice Kim', color: '#c3f5ff' },
  { initials: 'JP', name: 'James Park', color: '#ecb2ff' },
  { initials: 'SM', name: 'Sam M.', color: '#baffa2' },
]

const FOOTER_ACTIONS = [
  { icon: 'build', label: 'Compile', active: false },
  { icon: 'fact_check', label: 'Validate', active: false },
  { icon: 'list_alt', label: 'Logs', active: true },
  { icon: 'terminal', label: 'Terminal', active: false },
]

export default function ProjectDashboard() {
  const { pathname } = useLocation()

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
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bac9cc', fontSize: 16 }}>search</span>
            <input placeholder="Search models..." style={{ background: '#2a2a2a', border: '1px solid #3b494c', borderRadius: 4, padding: '6px 12px 6px 34px', fontFamily: 'JetBrains Mono', fontSize: 12, color: '#e5e2e1', outline: 'none', width: 200 }} />
          </div>
          <motion.button whileHover={{ background: '#00b3c9' }} whileTap={{ scale: 0.96 }}
            style={{ padding: '8px 16px', background: '#00daf3', color: '#00363d', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>NEW PROJECT
          </motion.button>
        </div>
      </motion.header>

      {/* Left Sidebar */}
      <motion.aside initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
        style={{ position: 'fixed', left: 0, top: 64, bottom: 48, width: 280, background: 'rgba(28,27,27,0.7)', backdropFilter: 'blur(20px)', borderRight: '1px solid #3b494c', display: 'flex', flexDirection: 'column', zIndex: 40 }}>
        <div style={{ padding: '24px 16px', flex: 1 }}>
          {SIDEBAR_NAV.map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={!item.active ? { backgroundColor: 'rgba(53,53,52,0.6)' } : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 4, marginBottom: 4, background: item.active ? 'rgba(0,218,243,0.08)' : 'transparent', borderLeft: item.active ? '3px solid #00daf3' : '3px solid transparent', color: item.active ? '#c3f5ff' : '#bac9cc', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label.toUpperCase()}
            </motion.div>
          ))}
        </div>
        <div style={{ padding: 16, borderTop: '1px solid #3b494c' }}>
          {[{ icon: 'settings', label: 'SETTINGS' }, { icon: 'help_outline', label: 'HELP' }].map(item => (
            <motion.div key={item.label} whileHover={{ color: '#e5e2e1' }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', color: '#bac9cc', fontFamily: 'JetBrains Mono', fontSize: 11, cursor: 'pointer', marginBottom: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </motion.div>
          ))}
        </div>
      </motion.aside>

      {/* Right Sidebar – Collaboration */}
      <motion.aside initial={{ x: 280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        style={{ position: 'fixed', right: 0, top: 64, bottom: 48, width: 280, background: 'rgba(28,27,27,0.7)', backdropFilter: 'blur(20px)', borderLeft: '1px solid #3b494c', zIndex: 40, overflowY: 'auto' }}>
        <div style={{ padding: 24 }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', marginBottom: 20 }}>Collaboration</div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginBottom: 8 }}>Share Link</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value="neuroviz.app/w/a4f2c" style={{ flex: 1, background: '#0e0e0e', border: '1px solid #3b494c', borderRadius: 4, padding: '6px 8px', fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', outline: 'none' }} />
              <motion.button whileHover={{ background: '#2a2a2a' }} style={{ padding: '6px 8px', background: '#201f1f', border: '1px solid #3b494c', borderRadius: 4, cursor: 'pointer', display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#bac9cc' }}>content_copy</span>
              </motion.button>
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginBottom: 12 }}>Team</div>
            {TEAM.map((m, i) => (
              <motion.div key={m.initials} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.color + '22', border: `1px solid ${m.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono', fontSize: 9, color: m.color, flexShrink: 0 }}>{m.initials}</div>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#e5e2e1', flex: 1 }}>{m.name}</span>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#baffa2' }} />
              </motion.div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginBottom: 12 }}>Recent Activity</div>
            {[
              { icon: 'check', text: 'ResNet-50 deployed', time: '2m ago', color: '#baffa2' },
              { icon: 'build', text: 'MobileNet compiled', time: '1h ago', color: '#c3f5ff' },
              { icon: 'science', text: 'Eval run started', time: '3h ago', color: '#ecb2ff' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: item.color, marginTop: 1 }}>{item.icon}</span>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#e5e2e1' }}>{item.text}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#bac9cc', marginTop: 2 }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="custom-scrollbar" style={{ marginLeft: 280, marginRight: 280, marginTop: 64, marginBottom: 48, height: 'calc(100vh - 64px - 48px)', overflowY: 'auto', padding: 32 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          {STATS.map(stat => (
            <div key={stat.label} style={{ flex: 1, background: '#201f1f', border: '1px solid #3b494c', borderRadius: 4, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: stat.color }}>{stat.icon}</span>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#bac9cc', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'Inter', fontSize: 18, fontWeight: 600, color: '#e5e2e1' }}>Recent Projects</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['filter_list', 'grid_view', 'list'].map(icon => (
              <motion.button key={icon} whileHover={{ background: '#353534' }} style={{ padding: 6, border: '1px solid #3b494c', borderRadius: 4, background: 'transparent', cursor: 'pointer', display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#bac9cc' }}>{icon}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {PROJECTS.map((proj, i) => (
            <motion.div key={proj.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
              whileHover={{ borderColor: proj.accent + '80', boxShadow: `0 4px 24px ${proj.accent}10` }}
              style={{ background: '#201f1f', border: '1px solid #3b494c', borderRadius: 4, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: '#e5e2e1', marginBottom: 6 }}>{proj.name}</div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', background: '#2a2a2a', padding: '2px 6px', border: '1px solid #3b494c', borderRadius: 4 }}>{proj.version}</span>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, padding: '3px 8px', background: STATUS_COLOR[proj.status] + '22', color: STATUS_COLOR[proj.status], border: `1px solid ${STATUS_COLOR[proj.status]}44`, borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{proj.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#bac9cc', marginBottom: 4 }}>ACCURACY</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 700, color: proj.accent }}>{proj.accuracy}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#bac9cc', marginBottom: 4 }}>LATENCY</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 700, color: '#e5e2e1' }}>{proj.latency}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button whileHover={{ background: '#00daf3', color: '#00363d' }} style={{ flex: 1, padding: '8px', border: '1px solid #00daf3', background: 'transparent', color: '#00daf3', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, borderRadius: 4, cursor: 'pointer', letterSpacing: '0.05em' }}>OPEN</motion.button>
                <motion.button whileHover={{ background: '#2a2a2a' }} style={{ padding: '8px 10px', border: '1px solid #3b494c', background: 'transparent', borderRadius: 4, cursor: 'pointer', display: 'flex' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#bac9cc' }}>content_copy</span>
                </motion.button>
                <motion.button whileHover={{ borderColor: '#ffb4ab', color: '#ffb4ab' }} style={{ padding: '8px 10px', border: '1px solid #3b494c', background: 'transparent', borderRadius: 4, cursor: 'pointer', display: 'flex' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#bac9cc' }}>delete_outline</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <motion.footer initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, delay: 0.15 }}
        style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 48, background: '#2a2a2a', borderTop: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ae500' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#baffa2' }}>6 Models Active</span>
          </div>
          <div style={{ width: 1, height: 16, background: '#3b494c' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#bac9cc', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>memory</span>GPU: 4.2GB / 12GB
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
