import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Models', to: '/' }, { label: 'Sandbox', to: '/sandbox' }, { label: 'Eval', to: '/eval' },
  { label: 'Dashboard', to: '/dashboard' }, { label: 'Benchmarks', to: '/benchmarks' },
]

const SIDEBAR_TABS = [
  { icon: 'account_tree', label: 'Topology' },
  { icon: 'bar_chart', label: 'Weights', active: true },
  { icon: 'speed', label: 'Inference' },
  { icon: 'history', label: 'History' },
]

const DATASETS = ['ImageNet-1K', 'CIFAR-10', 'MNIST', 'Custom Upload']

// Chart data: 10 epochs of train/val accuracy
const TRAIN_ACC = [42, 58, 68, 75, 80, 84, 87, 89, 91, 92]
const VAL_ACC   = [38, 54, 64, 72, 77, 81, 84, 86, 88, 90]

const BENCHMARK_ROWS = [
  { model: 'ResNet-50', acc: '92.1%', lat: '9ms', vram: '2.1GB', status: 'passed', color: '#baffa2' },
  { model: 'MobileNet-v3', acc: '87.5%', lat: '6ms', vram: '0.8GB', status: 'passed', color: '#baffa2' },
  { model: 'VGG-16', acc: '89.2%', lat: '22ms', vram: '4.2GB', status: 'warning', color: '#ecb2ff' },
  { model: 'EfficientNet-B0', acc: '90.4%', lat: '12ms', vram: '1.6GB', status: 'passed', color: '#baffa2' },
  { model: 'DenseNet-121', acc: '91.8%', lat: '18ms', vram: '3.1GB', status: 'warning', color: '#ecb2ff' },
]

const FOOTER_ACTIONS = [
  { icon: 'build', label: 'Compile', active: false },
  { icon: 'fact_check', label: 'Validate', active: true },
  { icon: 'list_alt', label: 'Logs', active: false },
  { icon: 'terminal', label: 'Terminal', active: false },
]

// Convert data to SVG path
function makeLinePath(data: number[], w: number, h: number): string {
  const max = 100, min = 30
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / (max - min)) * h
    return `${x},${y}`
  })
  return `M ${pts.join(' L ')}`
}

export default function ModelEvalLab() {
  const { pathname } = useLocation()
  const [dataset, setDataset] = useState('ImageNet-1K')
  const [batchSize, setBatchSize] = useState(32)
  const [lr, setLr] = useState(0.001)
  const [running, setRunning] = useState(false)
  const [activeTab, setActiveTab] = useState(1)

  const handleRun = () => {
    setRunning(true)
    setTimeout(() => setRunning(false), 3000)
  }

  const chartW = 400, chartH = 160

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

      <div style={{ marginTop: 64, marginBottom: 48, height: 'calc(100vh - 64px - 48px)', display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <motion.aside initial={{ x: -240, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }}
          style={{ width: 240, borderRight: '1px solid #3b494c', display: 'flex', flexDirection: 'column', background: 'rgba(28,27,27,0.7)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
          <div style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
            {SIDEBAR_TABS.map((tab, i) => (
              <motion.div key={tab.label} onClick={() => setActiveTab(i)} whileHover={activeTab !== i ? { backgroundColor: 'rgba(53,53,52,0.6)' } : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 4, marginBottom: 4, background: activeTab === i ? 'rgba(0,218,243,0.08)' : 'transparent', borderLeft: activeTab === i ? '3px solid #00daf3' : '3px solid transparent', color: activeTab === i ? '#c3f5ff' : '#bac9cc', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
                {tab.label.toUpperCase()}
              </motion.div>
            ))}
            <div style={{ height: 1, background: '#3b494c', margin: '16px 0' }} />
            {/* Hardware */}
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#849396', marginBottom: 12 }}>Hardware</div>
            {[
              { label: 'GPU', value: 'RTX 4090', color: '#baffa2' },
              { label: 'VRAM', value: '24 GB', color: '#c3f5ff' },
              { label: 'Bandwidth', value: '1008 GB/s', color: '#ecb2ff' },
            ].map(hw => (
              <div key={hw.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(59,73,76,0.4)' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc' }}>{hw.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: hw.color }}>{hw.value}</span>
              </div>
            ))}
          </div>
        </motion.aside>

        {/* Main 3-col content */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* Top row: Config | Chart | Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 240px', gap: 16, marginBottom: 24 }}>
            {/* Config panel */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: '#201f1f', border: '1px solid #3b494c', borderRadius: 4, padding: 20 }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', marginBottom: 16 }}>Config</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', display: 'block', marginBottom: 6 }}>DATASET</label>
                <select value={dataset} onChange={e => setDataset(e.target.value)}
                  style={{ width: '100%', background: '#0e0e0e', border: '1px solid #3b494c', borderRadius: 4, padding: '6px 8px', fontFamily: 'JetBrains Mono', fontSize: 11, color: '#e5e2e1', outline: 'none' }}>
                  {DATASETS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', display: 'block', marginBottom: 6 }}>BATCH SIZE: {batchSize}</label>
                <input type="range" min={8} max={256} step={8} value={batchSize} onChange={e => setBatchSize(+e.target.value)}
                  style={{ width: '100%', accentColor: '#00daf3' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', display: 'block', marginBottom: 6 }}>LEARNING RATE</label>
                <input value={lr} onChange={e => setLr(+e.target.value)} type="number" step="0.0001"
                  style={{ width: '100%', background: '#0e0e0e', border: '1px solid #3b494c', borderRadius: 4, padding: '6px 8px', fontFamily: 'JetBrains Mono', fontSize: 11, color: '#e5e2e1', outline: 'none' }} />
              </div>
              <motion.button onClick={handleRun} whileHover={{ filter: 'brightness(1.1)' }} whileTap={{ scale: 0.97 }}
                style={{ width: '100%', padding: '10px', background: running ? '#baffa2' : '#00daf3', color: running ? '#0e6800' : '#00363d', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{running ? 'hourglass_empty' : 'play_arrow'}</span>
                {running ? 'RUNNING...' : 'RUN EVALUATION'}
              </motion.button>
            </motion.div>

            {/* Metrics chart */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: '#201f1f', border: '1px solid #3b494c', borderRadius: 4, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc' }}>Accuracy Curve</span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono', fontSize: 10, color: '#c3f5ff' }}>
                    <div style={{ width: 16, height: 2, background: '#c3f5ff' }} />Train
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono', fontSize: 10, color: '#ecb2ff' }}>
                    <div style={{ width: 16, height: 2, background: '#ecb2ff', borderTop: '1px dashed #ecb2ff' }} />Val
                  </span>
                </div>
              </div>
              <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ overflow: 'visible' }}>
                {/* Grid */}
                {[0, 25, 50, 75, 100].map(v => {
                  const y = chartH - ((v - 30) / 70) * chartH
                  return <line key={v} x1={0} y1={y} x2={chartW} y2={y} stroke="#3b494c" strokeWidth="1" strokeDasharray="4 4" />
                })}
                {/* Train */}
                <motion.path d={makeLinePath(TRAIN_ACC, chartW, chartH)} fill="none" stroke="#c3f5ff" strokeWidth="2"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 1.2, ease: 'easeInOut' }} />
                {/* Val */}
                <motion.path d={makeLinePath(VAL_ACC, chartW, chartH)} fill="none" stroke="#ecb2ff" strokeWidth="2" strokeDasharray="8 4"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 1.2, ease: 'easeInOut' }} />
                {/* Data points */}
                {TRAIN_ACC.map((v, i) => {
                  const x = (i / (TRAIN_ACC.length - 1)) * chartW
                  const y = chartH - ((v - 30) / 70) * chartH
                  return <motion.circle key={i} cx={x} cy={y} r="3" fill="#c3f5ff" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.05 }} />
                })}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                {['E1','E2','E3','E4','E5','E6','E7','E8','E9','E10'].map(e => (
                  <span key={e} style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396' }}>{e}</span>
                ))}
              </div>
            </motion.div>

            {/* Summary */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: '#201f1f', border: '1px solid #3b494c', borderRadius: 4, padding: 20 }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', marginBottom: 16 }}>Performance</div>
              {[
                { label: 'Top-1 Acc', value: '92.1%', color: '#baffa2' },
                { label: 'Latency', value: '9ms', color: '#c3f5ff' },
                { label: 'VRAM', value: '2.1 GB', color: '#ecb2ff' },
              ].map(m => (
                <div key={m.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc' }}>{m.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, color: m.color }}>{m.value}</span>
                  </div>
                  <div style={{ height: 4, background: '#2a2a2a', borderRadius: 2 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: m.label === 'Top-1 Acc' ? '92%' : m.label === 'Latency' ? '15%' : '35%' }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      style={{ height: '100%', background: m.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
              <div style={{ height: 1, background: '#3b494c', margin: '8px 0 12px' }} />
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Utilization</div>
              {[{ label: 'GPU', pct: 78 }, { label: 'BW', pct: 56 }].map(u => (
                <div key={u.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396', width: 20 }}>{u.label}</span>
                  <div style={{ flex: 1, height: 6, background: '#2a2a2a', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${u.pct}%` }} transition={{ delay: 0.6, duration: 0.8 }}
                      style={{ height: '100%', background: '#00daf3', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#bac9cc', width: 28 }}>{u.pct}%</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Benchmark table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ background: '#201f1f', border: '1px solid #3b494c', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #3b494c', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc' }}>Benchmark Comparison — {dataset}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #3b494c' }}>
                  {['Model', 'Accuracy', 'Latency', 'VRAM', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 20px', textAlign: 'left', fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#849396' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BENCHMARK_ROWS.map((row, i) => (
                  <motion.tr key={row.model} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.06 }}
                    style={{ borderBottom: i < BENCHMARK_ROWS.length - 1 ? '1px solid rgba(59,73,76,0.4)' : 'none' }}>
                    <td style={{ padding: '10px 20px', fontFamily: 'JetBrains Mono', fontSize: 12, color: '#e5e2e1' }}>{row.model}</td>
                    <td style={{ padding: '10px 20px', fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, color: '#c3f5ff' }}>{row.acc}</td>
                    <td style={{ padding: '10px 20px', fontFamily: 'JetBrains Mono', fontSize: 12, color: '#bac9cc' }}>{row.lat}</td>
                    <td style={{ padding: '10px 20px', fontFamily: 'JetBrains Mono', fontSize: 12, color: '#bac9cc' }}>{row.vram}</td>
                    <td style={{ padding: '10px 20px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, padding: '3px 8px', background: row.color + '22', color: row.color, border: `1px solid ${row.color}44`, borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.status}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.footer initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, delay: 0.15 }}
        style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 48, background: '#2a2a2a', borderTop: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: running ? '#ecb2ff' : '#2ae500' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: running ? '#ecb2ff' : '#baffa2' }}>{running ? 'Evaluating...' : 'Eval Ready'}</span>
          <div style={{ width: 1, height: 16, background: '#3b494c' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#bac9cc' }}>Dataset: {dataset}</span>
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
