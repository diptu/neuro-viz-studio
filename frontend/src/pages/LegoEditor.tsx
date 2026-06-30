import { useState, useRef, useCallback, MutableRefObject } from 'react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

// ─── Types & Static Data ─────────────────────────────────────────────────────

interface BlockDef {
  id: string
  label: string
  sublabel?: string
  initX: number
  initY: number
  floating?: boolean
  ghost?: boolean
}

interface Pos { x: number; y: number }

const BLOCKS: BlockDef[] = [
  { id: 'input',      label: 'Input Layer',                   initX: 50,  initY: 350 },
  { id: 'conv2d',     label: 'Conv2D',  sublabel: '3×3 / s2', initX: 380, initY: 350 },
  { id: 'batchnorm',  label: 'BatchNorm',                     initX: 580, initY: 350 },
  { id: 'relu_drag',  label: 'ReLU', sublabel: 'In-place: T', initX: 750, initY: 252, floating: true },
  { id: 'relu_ghost', label: 'ReLU',                          initX: 780, initY: 350, ghost: true },
]

const BW = 144, BH = 56

interface LayerMeta { title: string; shape: string; memory: string; dtype: string; lineId: string }

const LAYER_META: Record<string, LayerMeta> = {
  input:      { title: 'Input Layer', shape: '[1, 3, 224, 224]',  memory: '0.6 MB', dtype: 'float32', lineId: 'input'     },
  conv2d:     { title: 'Conv2D',      shape: '[1, 64, 112, 112]', memory: '3.1 MB', dtype: 'float32', lineId: 'conv2d'    },
  batchnorm:  { title: 'BatchNorm',   shape: '[1, 64, 112, 112]', memory: '3.1 MB', dtype: 'float32', lineId: 'batchnorm' },
  relu_drag:  { title: 'ReLU',        shape: '[1, 64, 112, 112]', memory: '3.1 MB', dtype: 'float32', lineId: 'relu'      },
  relu_ghost: { title: 'ReLU',        shape: '[1, 64, 112, 112]', memory: '3.1 MB', dtype: 'float32', lineId: 'relu'      },
}

interface CodeLine { text: string; dim?: boolean; purple?: boolean; layerId?: string }

const CODE_LINES: CodeLine[] = [
  { text: '# Generated PyTorch Snippet',                    dim: true    },
  { text: 'class Network(nn.Module):',                      purple: true },
  { text: '  def __init__(self):',                          dim: true    },
  { text: '    super().__init__()',                          dim: true    },
  { text: '    self.input = nn.Identity()',                  layerId: 'input'     },
  { text: '    self.conv1 = nn.Conv2d(3, 64, 3, stride=2)', layerId: 'conv2d'    },
  { text: '    self.bn1 = nn.BatchNorm2d(64)',               layerId: 'batchnorm' },
  { text: '    self.relu1 = nn.ReLU(inplace=True)',          layerId: 'relu'      },
  { text: '  def forward(self, x):',                        dim: true    },
  { text: '    x = self.conv1(x)',                          dim: true    },
  { text: '    x = self.bn1(x)',                            dim: true    },
  { text: '    x = self.relu1(x)',                          dim: true    },
  { text: '    return x',                                    dim: true    },
]

// ─── Header ───────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Editor',   to: '/editor'  },
  { label: 'Models',   to: '/'        },
  { label: 'Datasets', to: '/compose' },
]

function Header() {
  const { pathname } = useLocation()
  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: 64, zIndex: 50, background: '#201f1f', borderBottom: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontFamily: 'Inter', fontSize: 22, fontWeight: 600, color: '#00daf3', letterSpacing: '-0.02em' }}>NeuroViz Studio</span>
        <nav style={{ display: 'flex', gap: 8, marginLeft: 32 }}>
          {NAV_LINKS.map(link => {
            const active = pathname === link.to
            return (
              <motion.div key={link.to} whileHover={{ color: active ? '#c3f5ff' : '#e5e2e1' }}>
                <Link to={link.to} style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: active ? 700 : 400, color: active ? '#c3f5ff' : '#bac9cc', textDecoration: 'none', padding: '4px 8px' }}>
                  {link.label}
                </Link>
              </motion.div>
            )
          })}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {['share', 'explore', 'notifications'].map(icon => (
          <motion.span key={icon} whileHover={{ color: '#e5e2e1' }} className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 22, cursor: 'pointer' }}>{icon}</motion.span>
        ))}
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3b494c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#bac9cc' }}>person</span>
        </div>
      </div>
    </motion.header>
  )
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────────

const LAYER_GROUPS = [
  { icon: 'input',  label: 'Input',         expanded: false },
  { icon: 'layers', label: 'Convolutional', expanded: true, active: true, children: ['Conv2D', 'ConvTranspose', 'DepthwiseConv'] },
  { icon: 'repeat', label: 'Recurrent',     expanded: false },
  { icon: 'waves',  label: 'Normalization', expanded: false },
  { icon: 'bolt',   label: 'Activation',    expanded: false },
]

function LeftSidebar() {
  return (
    <motion.aside
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
      style={{ position: 'fixed', left: 0, top: 64, bottom: 48, width: 320, background: 'rgba(28,27,27,0.6)', backdropFilter: 'blur(20px)', borderRight: '1px solid #3b494c', display: 'flex', flexDirection: 'column', zIndex: 40 }}
    >
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(195,245,255,0.1)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#c3f5ff' }}>layers</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Inter', fontSize: 18, fontWeight: 600, color: '#c3f5ff' }}>Layers</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Component Library</div>
          </div>
        </div>

        <motion.button
          whileHover={{ background: '#00daf3', color: '#00363d' }}
          whileTap={{ scale: 0.97 }}
          style={{ width: '100%', padding: '12px 16px', background: '#c3f5ff', color: '#001f24', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', border: '1px solid #00daf3', borderRadius: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Custom Block
        </motion.button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {LAYER_GROUPS.map((group) => (
            <div key={group.label}>
              <motion.div
                whileHover={!group.active ? { backgroundColor: 'rgba(53,53,52,0.8)' } : undefined}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 8px', borderRadius: 4, cursor: 'pointer', background: group.active ? 'rgba(0,229,255,0.08)' : 'transparent', borderLeft: group.active ? '2px solid #c3f5ff' : '2px solid transparent', color: group.active ? '#c3f5ff' : '#bac9cc', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, letterSpacing: '0.05em' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{group.icon}</span>
                  {group.label}
                </div>
                {group.children && (
                  <motion.span animate={{ rotate: group.expanded ? 180 : 0 }} className="material-symbols-outlined" style={{ fontSize: 16 }}>expand_more</motion.span>
                )}
              </motion.div>
              {group.expanded && group.children && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  style={{ paddingLeft: 40, paddingTop: 8, paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.children.map((child, i) => (
                    <motion.div key={child} whileHover={{ color: '#c3f5ff' }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'JetBrains Mono', fontSize: 11, color: '#bac9cc', cursor: 'pointer' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? '#00daf3' : '#849396', flexShrink: 0 }} />
                      {child}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div style={{ marginTop: 'auto', padding: 24, borderTop: '1px solid #3b494c' }}>
        {[{ icon: 'settings', label: 'Settings' }, { icon: 'menu_book', label: 'Docs' }].map(item => (
          <motion.div key={item.label} whileHover={{ color: '#e5e2e1' }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px', borderRadius: 4, color: '#bac9cc', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 11 }}>
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </motion.div>
        ))}
      </div>
    </motion.aside>
  )
}

// ─── Draggable Block ──────────────────────────────────────────────────────────

interface DraggableBlockProps {
  block: BlockDef
  isSelected: boolean
  onSelect: (id: string) => void
  onDragUpdate: (id: string, pos: Pos) => void
}

function DraggableBlock({ block, isSelected, onSelect, onDragUpdate }: DraggableBlockProps) {
  // useMotionValue initialises to block's starting position; Framer drag accumulates into these
  const x = useMotionValue(block.initX)
  const y = useMotionValue(block.initY)

  const border  = isSelected ? '#00daf3' : block.floating ? '#ecb2ff' : '#3b494c'
  const textClr = isSelected ? '#c3f5ff' : block.floating ? '#ecb2ff' : '#e5e2e1'
  const portClr = isSelected ? '#00daf3' : block.floating ? '#ecb2ff' : '#849396'
  const shadow  = isSelected ? '0 0 18px rgba(0,218,243,0.4)' : block.floating ? '0 8px 32px rgba(0,0,0,0.5)' : 'none'

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      style={{ x, y, position: 'absolute', left: 0, top: 0, width: BW, height: BH, zIndex: isSelected ? 30 : 20, touchAction: 'none', cursor: 'grab' }}
      onDragStart={() => onSelect(block.id)}
      onDrag={() => onDragUpdate(block.id, { x: x.get(), y: y.get() })}
      onDragEnd={() => onDragUpdate(block.id, { x: x.get(), y: y.get() })}
      onClick={(e) => { e.stopPropagation(); onSelect(block.id) }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: block.ghost ? 0.35 : 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <motion.div
        animate={block.floating && !isSelected ? { y: [-4, 4, -4], rotate: -1 } : { y: 0, rotate: 0 }}
        transition={block.floating && !isSelected ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : {}}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      >
        {isSelected && (
          <motion.div
            layoutId="sel-ring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ position: 'absolute', inset: -5, border: '1.5px solid #00daf388', borderRadius: 6, pointerEvents: 'none' }}
          />
        )}
        {block.floating && !isSelected && (
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
            style={{ position: 'absolute', inset: -8, border: '1px solid #ecb2ff33', borderRadius: 8, pointerEvents: 'none' }}
          />
        )}

        <div style={{ width: '100%', height: '100%', background: isSelected ? '#201f1f' : '#2a2a2a', border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', padding: '0 12px', position: 'relative', boxShadow: shadow }}>
          <div style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: portClr }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: textClr, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.label}</div>
            {block.sublabel && <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#bac9cc', marginTop: 1 }}>{block.sublabel}</div>}
          </div>
          {isSelected && (
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#00daf3', flexShrink: 0 }}>radio_button_checked</span>
          )}
          <div style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: portClr }} />
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

interface CanvasProps {
  selectedId: string
  posRef: MutableRefObject<Record<string, Pos>>
  onSelect: (id: string) => void
  onDragUpdate: (id: string, pos: Pos) => void
}

function Canvas({ selectedId, posRef, onSelect, onDragUpdate }: CanvasProps) {
  // Cubic bezier from right-port of source → left-port of target
  function cxPath(fromId: string, toId: string) {
    const f = posRef.current[fromId] ?? { x: 0, y: 0 }
    const t = posRef.current[toId]   ?? { x: 0, y: 0 }
    const x1 = f.x + BW + 4, y1 = f.y + BH / 2
    const x2 = t.x - 4,      y2 = t.y + BH / 2
    const cx = (x1 + x2) / 2
    return `M ${x1},${y1} C ${cx},${y1} ${cx},${y2} ${x2},${y2}`
  }

  return (
    <main
      onClick={() => onSelect('')}
      style={{ position: 'fixed', top: 64, bottom: 48, left: 320, right: 320, overflow: 'hidden', background: '#0e0e0e', backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '32px 32px' }}
    >
      {/* SVG connections — paths are recomputed from posRef on each render triggered by RAF */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}>
        <path d={cxPath('input', 'conv2d')} fill="none" stroke="#00daf3" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 4px #00daf3)' }} />
        <path d={cxPath('conv2d', 'batchnorm')} fill="none" stroke="#00daf3" strokeWidth="2" opacity="0.55" />
        <path d={cxPath('batchnorm', 'relu_ghost')} fill="none" stroke="#849396" strokeWidth="2" opacity="0.5" />
        <motion.path
          d={cxPath('conv2d', 'relu_drag')}
          fill="none" stroke="#ecb2ff" strokeWidth="2" strokeDasharray="6"
          animate={{ strokeDashoffset: [0, -12] }}
          transition={{ strokeDashoffset: { duration: 1, repeat: Infinity, ease: 'linear' }, d: { duration: 0 } }}
        />
      </svg>

      {/* Package selection decorator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        style={{ position: 'absolute', left: 370, top: 300, width: 580, height: 160, border: '2px dashed rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.03)', borderRadius: 8, zIndex: 0 }}>
        <motion.div whileHover={{ filter: 'brightness(1.15)' }} whileTap={{ scale: 0.97 }}
          style={{ position: 'absolute', top: -40, left: 0, background: '#00e5ff', color: '#00626e', padding: '4px 12px', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>inventory_2</span>
          Package Selection into Block
        </motion.div>
      </motion.div>

      {BLOCKS.map(block => (
        <DraggableBlock
          key={block.id}
          block={block}
          isSelected={block.id === selectedId}
          onSelect={onSelect}
          onDragUpdate={onDragUpdate}
        />
      ))}
    </main>
  )
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────

function RightSidebar({ selectedId }: { selectedId: string }) {
  const meta   = LAYER_META[selectedId] ?? LAYER_META.conv2d
  const lineId = meta.lineId

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      style={{ position: 'fixed', right: 0, top: 64, bottom: 48, width: 320, background: 'rgba(28,27,27,0.6)', backdropFilter: 'blur(20px)', borderLeft: '1px solid #3b494c', display: 'flex', flexDirection: 'column', zIndex: 40 }}
    >
      {/* Tensor Flow State */}
      <div style={{ padding: 24, borderBottom: '1px solid #3b494c' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bac9cc' }}>Tensor Flow State</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AnimatePresence mode="wait">
              {selectedId && (
                <motion.span key={`badge-${selectedId}`}
                  initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#00daf3', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(0,218,243,0.1)', padding: '2px 6px', borderRadius: 3 }}>
                  {meta.title}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ae500' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: '#0e0e0e', padding: 12, border: '1px solid #3b494c' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Output Shape</div>
            <AnimatePresence mode="wait">
              <motion.div key={`shape-${selectedId}`}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                style={{ fontFamily: 'JetBrains Mono', fontSize: 15, fontWeight: 700, color: '#c3f5ff', letterSpacing: '-0.01em' }}>
                {meta.shape}
              </motion.div>
            </AnimatePresence>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['memory', 'dtype'] as const).map(key => (
              <div key={key} style={{ background: '#0e0e0e', padding: 10, border: '1px solid #3b494c' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {key === 'memory' ? 'Memory' : 'DType'}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={`${key}-${selectedId}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#e5e2e1' }}>
                    {meta[key]}
                  </motion.div>
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Code Sync */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '10px 16px', background: 'rgba(53,53,52,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: '#00daf3', fontSize: 18 }}>code</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#00daf3' }}>Live Code Sync</span>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc' }}>model.py</span>
        </div>

        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', background: '#0e0e0e', padding: '12px 16px', fontFamily: 'JetBrains Mono', fontSize: 12, lineHeight: 1.85 }}>
          {CODE_LINES.map((line, i) => {
            const highlighted = Boolean(line.layerId && selectedId && line.layerId === lineId)
            return (
              <motion.div key={i}
                animate={{ backgroundColor: highlighted ? 'rgba(0,229,255,0.06)' : 'rgba(0,0,0,0)' }}
                transition={{ duration: 0.2 }}
                style={{
                  paddingLeft: 16, paddingRight: 12, marginLeft: -16, marginRight: -16,
                  borderLeft: highlighted ? '2px solid #00daf3' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  minHeight: 24,
                }}
              >
                <span style={{ color: highlighted ? '#e5e2e1' : line.purple ? '#ecb2ff' : line.dim ? '#4a5d60' : '#7a9aa0' }}>
                  {line.text}
                </span>
                {highlighted && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="material-symbols-outlined"
                    style={{ fontSize: 13, color: '#00daf3', flexShrink: 0, marginLeft: 8 }}>
                    link
                  </motion.span>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.aside>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const FOOTER_ACTIONS = [
  { icon: 'build',      label: 'Compile',  active: false },
  { icon: 'fact_check', label: 'Validate', active: false },
  { icon: 'list_alt',   label: 'Logs',     active: true  },
  { icon: 'terminal',   label: 'Terminal', active: false },
]

function Footer({ selectedId }: { selectedId: string }) {
  const meta = selectedId ? LAYER_META[selectedId] : null
  return (
    <motion.footer
      initial={{ y: 48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
      style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 48, background: '#2a2a2a', borderTop: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 50 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ae500' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#baffa2' }}>Architecture Valid</span>
        </div>
        <div style={{ width: 1, height: 16, background: '#3b494c' }} />

        <AnimatePresence mode="wait">
          {meta ? (
            <motion.div key={selectedId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#00daf3' }}>layers</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#00daf3' }}>{meta.title}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#849396' }}>{meta.shape}</span>
            </motion.div>
          ) : (
            <motion.div key="gpu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#bac9cc' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>memory</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>GPU: 4.2GB / 12GB</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {FOOTER_ACTIONS.map(action => (
          <motion.button key={action.label}
            whileHover={!action.active ? { color: '#e5e2e1' } : undefined}
            whileTap={{ opacity: 0.7 }}
            style={{ height: '100%', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'JetBrains Mono', fontSize: 13, color: action.active ? '#79ff5b' : '#bac9cc', background: action.active ? 'rgba(121,255,91,0.06)' : 'transparent', borderBottom: action.active ? '2px solid #79ff5b' : '2px solid transparent', border: 'none', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{action.icon}</span>
            {action.label}
          </motion.button>
        ))}
      </div>
    </motion.footer>
  )
}

// ─── Page Root ────────────────────────────────────────────────────────────────

export default function LegoEditor() {
  const [selectedId, setSelectedId] = useState('conv2d')

  // posRef tracks each block's live position; updated every drag frame via RAF
  const posRef = useRef<Record<string, Pos>>(
    Object.fromEntries(BLOCKS.map(b => [b.id, { x: b.initX, y: b.initY }]))
  )
  // Incrementing dragVersion via requestAnimationFrame forces SVG paths to recompute during drag
  const [, setDragVersion] = useState(0)
  const rafRef = useRef<number | null>(null)

  const handleDragUpdate = useCallback((id: string, pos: Pos) => {
    posRef.current[id] = pos
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      setDragVersion(v => v + 1)
      rafRef.current = null
    })
  }, [])

  const handleSelect = useCallback((id: string) => setSelectedId(id), [])

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: '#0e0e0e', color: '#e5e2e1', fontFamily: 'Inter' }}>
      <Header />
      <LeftSidebar />
      <Canvas
        selectedId={selectedId}
        posRef={posRef}
        onSelect={handleSelect}
        onDragUpdate={handleDragUpdate}
      />
      <RightSidebar selectedId={selectedId} />
      <Footer selectedId={selectedId} />
    </div>
  )
}
