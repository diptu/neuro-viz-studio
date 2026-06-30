import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Models', to: '/' }, { label: 'Canvas', to: '/canvas' }, { label: 'Research', to: '/research' },
  { label: 'Editor', to: '/editor' }, { label: 'Eval', to: '/eval' },
]

const LAYER_CATS = [
  { icon: 'input', label: 'Input / Output', expanded: false },
  { icon: 'blur_on', label: 'Convolutional', expanded: true, children: ['Conv2D', 'ConvTranspose', 'DepthwiseSep'] },
  { icon: 'repeat', label: 'Recurrent', expanded: false },
  { icon: 'waves', label: 'Normalization', expanded: false },
  { icon: 'bolt', label: 'Activation', expanded: false },
]

const DATASETS = ['ImageNet-1K', 'CIFAR-10', 'MNIST', 'Custom Upload']

interface CanvasNode { id: string; label: string; sublabel: string; x: number; y: number; selected: boolean; color: string }

const INIT_NODES: CanvasNode[] = [
  { id: 'input', label: 'Input', sublabel: '3×224×224', x: 60, y: 240, selected: false, color: '#bac9cc' },
  { id: 'conv2d', label: 'Conv2D', sublabel: '64 filters / 3×3', x: 260, y: 240, selected: true, color: '#00daf3' },
  { id: 'relu', label: 'ReLU', sublabel: 'In-place', x: 460, y: 240, selected: false, color: '#baffa2' },
  { id: 'pool', label: 'MaxPool2D', sublabel: '2×2 / s2', x: 660, y: 240, selected: false, color: '#ecb2ff' },
]

const CANVAS_TOOLS = [
  { icon: 'arrow_selector_tool', label: 'Select' },
  { icon: 'add_circle', label: 'Add' },
  { icon: 'pan_tool', label: 'Pan' },
  { icon: 'zoom_in', label: 'Zoom' },
]

const CODE_LINES = [
  { content: 'class Network(nn.Module):', indent: 0, dim: false },
  { content: '  def __init__(self):', indent: 0, dim: true },
  { content: '    super().__init__()', indent: 0, dim: true },
  { content: '    self.conv1 = nn.Conv2d(3, 64, 3)', indent: 0, highlight: true },
  { content: '    self.relu = nn.ReLU(inplace=True)', indent: 0, dim: true },
  { content: '    self.pool = nn.MaxPool2d(2, 2)', indent: 0, dim: true },
]

const FOOTER_ACTIONS = [
  { icon: 'build', label: 'Compile', active: false },
  { icon: 'fact_check', label: 'Validate', active: false },
  { icon: 'list_alt', label: 'Logs', active: true },
  { icon: 'terminal', label: 'Terminal', active: false },
]

export default function ResearchCanvas() {
  const { pathname } = useLocation()
  const [nodes, setNodes] = useState<CanvasNode[]>(INIT_NODES)
  const [dataset, setDataset] = useState('ImageNet-1K')
  const [kernelSize, setKernelSize] = useState(3)
  const [activeTool, setActiveTool] = useState(0)

  const [editingNode, setEditingNode] = useState<CanvasNode | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editSublabel, setEditSublabel] = useState('')

  const selectedNode = nodes.find(n => n.selected)

  const selectNode = (id: string) => {
    setNodes(prev => prev.map(n => ({ ...n, selected: n.id === id })))
  }

  const openEdit = (node: CanvasNode, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditLabel(node.label)
    setEditSublabel(node.sublabel)
    setEditingNode(node)
  }

  const saveEdit = () => {
    if (!editingNode) return
    setNodes(prev => prev.map(n => n.id === editingNode.id ? { ...n, label: editLabel, sublabel: editSublabel } : n))
    setEditingNode(null)
  }

  const deleteNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNodes(prev => prev.filter(n => n.id !== id))
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

      <div style={{ marginTop: 64, marginBottom: 48, height: 'calc(100vh - 64px - 48px)', display: 'flex' }}>
        {/* Left Sidebar */}
        <motion.aside initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }}
          style={{ width: 300, borderRight: '1px solid #3b494c', display: 'flex', flexDirection: 'column', background: 'rgba(28,27,27,0.7)', backdropFilter: 'blur(20px)', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ padding: 20 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc', marginBottom: 16 }}>Layer Library</div>
            {LAYER_CATS.map(cat => (
              <div key={cat.label}>
                <motion.div whileHover={{ color: '#e5e2e1' }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 8px', borderRadius: 4, color: '#bac9cc', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{cat.icon}</span>
                    {cat.label}
                  </div>
                  {cat.children && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{cat.expanded ? 'expand_less' : 'expand_more'}</span>}
                </motion.div>
                {cat.expanded && cat.children && (
                  <div style={{ paddingLeft: 32, paddingBottom: 8 }}>
                    {cat.children.map(child => (
                      <motion.div key={child} whileHover={{ color: '#c3f5ff', x: 2 }}
                        style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', padding: '5px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00daf3', flexShrink: 0 }} />{child}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: 20, borderTop: '1px solid #3b494c', marginTop: 'auto' }}>
            <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', display: 'block', marginBottom: 8 }}>DATASET SOURCE</label>
            <select value={dataset} onChange={e => setDataset(e.target.value)}
              style={{ width: '100%', background: '#0e0e0e', border: '1px solid #3b494c', borderRadius: 4, padding: '8px 10px', fontFamily: 'JetBrains Mono', fontSize: 11, color: '#e5e2e1', outline: 'none', cursor: 'pointer' }}>
              {DATASETS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </motion.aside>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize: '32px 32px' }}>
          {/* Toolbar */}
          <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 6, zIndex: 20 }}>
            {CANVAS_TOOLS.map((tool, i) => (
              <motion.button key={tool.label} onClick={() => setActiveTool(i)} whileHover={{ background: '#2a2a2a' }}
                title={tool.label}
                style={{ width: 36, height: 36, background: activeTool === i ? 'rgba(0,218,243,0.1)' : 'rgba(28,27,27,0.9)', border: `1px solid ${activeTool === i ? '#00daf3' : '#3b494c'}`, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: activeTool === i ? '#c3f5ff' : '#bac9cc' }}>{tool.icon}</span>
              </motion.button>
            ))}
          </div>

          {/* SVG connections */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            {nodes.slice(0, -1).map((node, i) => {
              const next = nodes[i + 1]
              const x1 = node.x + 140, y1 = node.y + 28, x2 = next.x, y2 = next.y + 28
              const isSelected = node.selected || next.selected
              return (
                <g key={node.id}>
                  <path d={`M ${x1},${y1} L ${x2},${y2}`} fill="none" stroke={isSelected ? '#00daf3' : '#3b494c'} strokeWidth="2"
                    style={isSelected ? { filter: 'drop-shadow(0 0 4px #00daf3)' } : undefined} />
                  {isSelected && (
                    <motion.circle r="4" fill="#00daf3"
                      animate={{ cx: [x1, x2], cy: [y1, y2] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
                  )}
                </g>
              )
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node, i) => (
            <motion.div key={node.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              onClick={() => selectNode(node.id)}
              whileHover={{ boxShadow: `0 0 16px ${node.color}33` }}
              style={{ position: 'absolute', left: node.x, top: node.y, width: 140, height: 56, background: '#201f1f', border: `1.5px solid ${node.selected ? node.color : '#3b494c'}`, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: node.selected ? `0 0 20px ${node.color}40` : 'none' }}>
              <div style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: node.selected ? node.color : '#3b494c' }} />
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: node.selected ? node.color : '#e5e2e1', letterSpacing: '0.05em' }}>{node.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', marginTop: 2 }}>{node.sublabel}</div>
              <div style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: node.selected ? node.color : '#3b494c' }} />

              {/* Edit / Delete actions — visible only when selected */}
              <AnimatePresence>
                {node.selected && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    style={{ position: 'absolute', top: -28, right: 0, display: 'flex', gap: 4, zIndex: 20 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <motion.button
                      whileHover={{ background: 'rgba(0,218,243,0.2)', borderColor: '#00daf3' }}
                      onClick={e => openEdit(node, e)}
                      title="Edit layer"
                      style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,27,27,0.95)', border: '1px solid #3b494c', borderRadius: 4, cursor: 'pointer', padding: 0 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#00daf3' }}>edit</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ background: 'rgba(255,80,80,0.2)', borderColor: '#ff5050' }}
                      onClick={e => deleteNode(node.id, e)}
                      title="Delete layer"
                      style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,27,27,0.95)', border: '1px solid #3b494c', borderRadius: 4, cursor: 'pointer', padding: 0 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ff5050' }}>delete</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Edit Modal */}
          <AnimatePresence>
            {editingNode && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
                onClick={() => setEditingNode(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={e => e.stopPropagation()}
                  style={{ background: '#1c1b1b', border: '1px solid #3b494c', borderRadius: 8, padding: 24, width: 320, boxShadow: '0 0 40px rgba(0,218,243,0.12)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00daf3' }}>edit</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, color: '#c3f5ff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Edit Layer</span>
                  </div>

                  <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>Layer Name</label>
                  <input
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit()}
                    autoFocus
                    style={{ width: '100%', boxSizing: 'border-box', background: '#0e0e0e', border: '1px solid #3b494c', borderRadius: 4, padding: '8px 10px', fontFamily: 'JetBrains Mono', fontSize: 12, color: '#e5e2e1', outline: 'none', marginBottom: 14 }}
                  />

                  <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>Shape / Params</label>
                  <input
                    value={editSublabel}
                    onChange={e => setEditSublabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit()}
                    style={{ width: '100%', boxSizing: 'border-box', background: '#0e0e0e', border: '1px solid #3b494c', borderRadius: 4, padding: '8px 10px', fontFamily: 'JetBrains Mono', fontSize: 12, color: '#e5e2e1', outline: 'none', marginBottom: 20 }}
                  />

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <motion.button
                      whileHover={{ background: '#2a2a2a' }}
                      onClick={() => setEditingNode(null)}
                      style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #3b494c', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 11, color: '#bac9cc', cursor: 'pointer' }}
                    >Cancel</motion.button>
                    <motion.button
                      whileHover={{ background: 'rgba(0,218,243,0.2)' }}
                      onClick={saveEdit}
                      style={{ padding: '7px 16px', background: 'rgba(0,218,243,0.08)', border: '1px solid #00daf3', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 11, color: '#c3f5ff', cursor: 'pointer' }}
                    >Save</motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Deep Insight */}
        <motion.aside initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}
          style={{ width: 320, borderLeft: '1px solid #3b494c', display: 'flex', flexDirection: 'column', background: 'rgba(28,27,27,0.7)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #3b494c', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#00daf3' }}>psychology</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: '#c3f5ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deep Insight</span>
          </div>
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {selectedNode ? (
              <>
                <div style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: '#e5e2e1', marginBottom: 4 }}>{selectedNode.label}</div>
                <p style={{ fontFamily: 'Inter', fontSize: 12, color: '#bac9cc', lineHeight: 1.7, marginBottom: 16 }}>
                  {selectedNode.id === 'conv2d'
                    ? 'A 2D convolution layer that slides a learnable kernel across spatial dimensions, extracting local feature patterns. With 64 filters at 3×3, it maps 3-channel input to 64 feature maps.'
                    : selectedNode.id === 'relu'
                    ? 'Rectified Linear Unit: f(x) = max(0,x). Applied element-wise, it introduces non-linearity while avoiding the vanishing gradient problem common in sigmoid/tanh.'
                    : selectedNode.id === 'pool'
                    ? 'MaxPooling2D downsamples feature maps by taking the maximum value in each 2×2 window. Reduces spatial size by 2×, providing translation invariance.'
                    : 'The input layer accepts raw image tensors of shape [B, C, H, W] where B=batch, C=channels, H/W=spatial dimensions.'}
                </p>

                {/* Tensor transform */}
                <div style={{ background: '#0e0e0e', border: '1px solid #3b494c', borderRadius: 4, padding: 12, marginBottom: 16 }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Tensor Shape</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#bac9cc' }}>[1, 3, 224, 224]</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#849396' }}>arrow_forward</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#c3f5ff' }}>[1, 64, 224, 224]</span>
                  </div>
                </div>

                {/* Controls */}
                {selectedNode.id === 'conv2d' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', display: 'block', marginBottom: 8 }}>KERNEL SIZE: {kernelSize}×{kernelSize}</label>
                    <input type="range" min={1} max={7} step={2} value={kernelSize} onChange={e => setKernelSize(+e.target.value)}
                      style={{ width: '100%', accentColor: '#00daf3' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      {[1, 3, 5, 7].map(v => (
                        <span key={v} style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: v === kernelSize ? '#c3f5ff' : '#849396' }}>{v}×{v}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code */}
                <div style={{ background: '#0e0e0e', border: '1px solid #3b494c', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ padding: '6px 12px', borderBottom: '1px solid #3b494c', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#00daf3' }}>code</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc' }}>PyTorch Snippet</span>
                  </div>
                  <div style={{ padding: 12 }}>
                    {CODE_LINES.map((line, i) => (
                      <div key={i} style={{ fontFamily: 'JetBrains Mono', fontSize: 11, lineHeight: 1.7, color: line.highlight ? '#e5e2e1' : '#849396', background: line.highlight ? 'rgba(0,218,243,0.06)' : 'transparent', borderLeft: line.highlight ? '2px solid #00daf3' : '2px solid transparent', paddingLeft: line.highlight ? 6 : 8, marginLeft: -8, paddingRight: 8 }}>
                        {line.content}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50%', color: '#849396' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 12 }}>touch_app</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>Select a node to inspect</span>
              </div>
            )}
          </div>
        </motion.aside>
      </div>

      {/* Footer */}
      <motion.footer initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, delay: 0.15 }}
        style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 48, background: '#2a2a2a', borderTop: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ae500' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#baffa2' }}>Canvas Ready</span>
          <div style={{ width: 1, height: 16, background: '#3b494c' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#bac9cc' }}>{nodes.length} nodes · {dataset}</span>
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
