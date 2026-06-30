import { useState, useRef, useCallback, useMemo, useEffect, MutableRefObject } from 'react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab  = 'inspect' | 'optimize' | 'diagnose'
type OptTarget  = 'mobile'  | 'cloud'    | 'edge'
interface Pos   { x: number; y: number }
interface BlockDef {
  id: string; label: string; sublabel?: string
  initX: number; initY: number
  floating?: boolean; hasError?: boolean
  depth?: number; blockColor?: string; bw?: number; bh?: number
}

// ─── Canvas node data ─────────────────────────────────────────────────────────

// 3-D stack offset per depth slice (back slices go upper-left, front lower-right)
const STACK_DX = 9, STACK_DY = 9

// initX/initY = container top-left (= back-slice top-left).
// Front face sits at (initX+(depth-1)*DX, initY+(depth-1)*DY) in global space.
const BLOCKS_INIT: BlockDef[] = [
  { id: 'input',  label: 'Input',     sublabel: '3 × 224 × 224',   initX: 50,  initY: 155, depth: 1, blockColor: '#bac9cc', bw: 90,  bh: 90  },
  { id: 'conv1',  label: 'Conv2D',    sublabel: '64ch · 3×3 / s2', initX: 200, initY: 100, depth: 4, blockColor: '#4a9eff', bw: 74,  bh: 140 },
  { id: 'bn1',    label: 'BatchNorm', sublabel: '64 channels',      initX: 375, initY: 120, depth: 3, blockColor: '#4a9eff', bw: 74,  bh: 120 },
  { id: 'pool1',  label: 'MaxPool2D', sublabel: '2×2 / stride 2',  initX: 535, initY: 110, depth: 4, blockColor: '#ecb2ff', bw: 68,  bh: 128 },
  { id: 'relu1',  label: 'ReLU',      sublabel: 'in-place · ∞',    initX: 705, initY: 162, depth: 1, blockColor: '#baffa2', bw: 72,  bh: 76, floating: true },
  { id: 'conv2',  label: 'Conv2D',    sublabel: '128ch · 3×3',     initX: 845, initY: 100, depth: 4, blockColor: '#ff8080', bw: 74,  bh: 140, hasError: true },
]

// ─── INSPECT data ─────────────────────────────────────────────────────────────

interface LayerMeta { title: string; shape: string; memory: string; dtype: string; lineId: string }

const LAYER_META: Record<string, LayerMeta> = {
  input:  { title: 'Input',     shape: '[1, 3, 224, 224]',   memory: '0.6 MB', dtype: 'float32', lineId: 'input'  },
  conv1:  { title: 'Conv2D',    shape: '[1, 64, 112, 112]',  memory: '3.1 MB', dtype: 'float32', lineId: 'conv1'  },
  bn1:    { title: 'BatchNorm', shape: '[1, 64, 112, 112]',  memory: '3.1 MB', dtype: 'float32', lineId: 'bn1'    },
  pool1:  { title: 'MaxPool2D', shape: '[1, 64, 56, 56]',    memory: '0.8 MB', dtype: 'float32', lineId: 'pool1'  },
  relu1:  { title: 'ReLU',      shape: '[1, 64, 112, 112]',  memory: '3.1 MB', dtype: 'float32', lineId: 'relu1'  },
  conv2:  { title: 'Conv2D ⚠',  shape: 'ERROR',              memory: '—',      dtype: '—',       lineId: 'conv2'  },
}

interface CodeLine { text: string; dim?: boolean; purple?: boolean; layerId?: string; error?: boolean }

const CODE_LINES: CodeLine[] = [
  { text: '# model.py',                                    dim: true    },
  { text: 'class Network(nn.Module):',                     purple: true },
  { text: '  def __init__(self):',                         dim: true    },
  { text: '    self.input = nn.Identity()',                 layerId: 'input'  },
  { text: '    self.conv1 = nn.Conv2d(3, 64, 3, stride=2)',layerId: 'conv1'  },
  { text: '    self.bn1   = nn.BatchNorm2d(64)',            layerId: 'bn1'    },
  { text: '    self.relu1 = nn.ReLU(inplace=True)',         layerId: 'relu1'  },
  { text: '    self.pool1 = nn.MaxPool2d(2, 2)',            layerId: 'pool1'  },
  { text: '    self.conv2 = nn.Conv2d(128, 128, 3)',        layerId: 'conv2', error: true },
  { text: '  #   ↑ expects in_channels=64, not 128',       dim: true    },
  { text: '  def forward(self, x): ...',                   dim: true    },
]

// Seed map: block id → its original code text (used as the mutable source of truth)
const INIT_CODE_TEXT: Record<string, string> = {}
CODE_LINES.forEach(l => { if (l.layerId) INIT_CODE_TEXT[l.layerId] = l.text })

function buildCodeLines(blocks: BlockDef[], codeTextMap: Record<string, string>): CodeLine[] {
  const lines: CodeLine[] = [
    { text: '# model.py',                 dim: true    },
    { text: 'class Network(nn.Module):',  purple: true },
    { text: '  def __init__(self):',      dim: true    },
  ]
  for (const b of blocks) {
    const text = codeTextMap[b.id] ?? `    self.${b.id} = nn.${b.label}(${b.sublabel ?? ''})`
    lines.push({ text, layerId: b.id, error: b.hasError })
    if (b.hasError) lines.push({ text: "  #   ↑ expects in_channels=64, not 128", dim: true })
  }
  lines.push({ text: '  def forward(self, x): ...', dim: true })
  return lines
}

// ─── OPTIMIZE data ────────────────────────────────────────────────────────────

interface OptTargetDef { label: string; badge: string; latency: string; size: string; compression: string; color: string }

const OPT_TARGETS: Record<OptTarget, OptTargetDef> = {
  mobile: { label: 'Mobile TFLite',  badge: 'INT8', latency: '6 ms', size: '1.2 MB', compression: '5.2×', color: '#baffa2' },
  cloud:  { label: 'Cloud REST/GPU', badge: 'FP32', latency: '3 ms', size: '2.9 MB', compression: '2.1×', color: '#c3f5ff' },
  edge:   { label: 'Edge TensorRT',  badge: 'FP16', latency: '2 ms', size: '0.8 MB', compression: '7.4×', color: '#ecb2ff' },
}

const OPT_STEPS = [
  { id: 'base',     label: 'Base Model', size: '6.2 MB', icon: 'model_training', color: '#bac9cc' },
  { id: 'quantize', label: 'Quantize',   size: '2.1 MB', icon: 'compress',       color: '#c3f5ff' },
  { id: 'prune',    label: 'Prune',      size: '1.8 MB', icon: 'content_cut',    color: '#ecb2ff' },
  { id: 'fuse',     label: 'Fuse Ops',   size: '1.2 MB', icon: 'merge_type',     color: '#baffa2' },
]

const BENCH: Record<OptTarget, Array<{ label: string; ms: number }>> = {
  mobile: [{ label: 'TFLite INT8', ms: 6 }, { label: 'TFLite FP16', ms: 11 }, { label: 'NNAPI', ms: 9 }, { label: 'Core ML', ms: 7 }],
  cloud:  [{ label: 'TF Serving',  ms: 4 }, { label: 'ONNX Runtime', ms: 9 }, { label: 'TorchServe', ms: 12 }, { label: 'Triton b=32', ms: 3 }],
  edge:   [{ label: 'TensorRT INT8', ms: 3 }, { label: 'TensorRT FP16', ms: 5 }, { label: 'OpenVINO', ms: 8 }, { label: 'SNPE', ms: 7 }],
}

// ─── DIAGNOSE data ────────────────────────────────────────────────────────────

interface DiagError {
  id: string; layerId: string; type: string; severity: 'error' | 'warning'
  message: string; fix: string; fixDesc: string
}

const DIAG_ERRORS: DiagError[] = [
  {
    id: 'e-dim', layerId: 'conv2', type: 'DIMENSION_MISMATCH', severity: 'error',
    message: 'Expected in_channels=64 (MaxPool2D output) but Conv2d declares in_channels=128.',
    fix: 'Match Input Depth',
    fixDesc: 'Conv2d(128,128,3) → Conv2d(64,128,3)',
  },
  {
    id: 'e-relu', layerId: 'relu1', type: 'CONNECTIVITY', severity: 'warning',
    message: 'ReLU exists in __init__ but is never called in forward() — dead branch.',
    fix: 'Wire to forward()',
    fixDesc: 'Add x = self.relu1(x) after conv1',
  },
]

// ─── AI fix data ─────────────────────────────────────────────────────────────

const AI_RESPONSES: Record<string, string> = {
  'e-dim': `Scanning computation graph…

  Layer:  self.conv2 = nn.Conv2d(128, 128, 3)
  Upstream output shape:  [B, 64, 56, 56]  ← 64 channels

  Root cause: Conv2d weight tensor is shaped [out_ch, in_ch, kH, kW] = [128, 128, 3, 3].
  The in_channels argument (128) does not match the upstream channel count (64).
  PyTorch will raise RuntimeError during forward() when shapes are multiplied.

  Proposed patch:
  ─────────────────────────────────────────
  - self.conv2 = nn.Conv2d(128, 128, 3)
  + self.conv2 = nn.Conv2d(64,  128, 3)   # in_channels: 128 → 64
  ─────────────────────────────────────────

  All downstream shapes remain valid (out_channels=128 unchanged).
  Applying fix to layer definition and code…`,

  'e-relu': `Tracing forward() call graph…

  Layer:  self.relu1 = nn.ReLU(inplace=True)   ← defined
  forward():  x = self.conv1(x)
              x = self.pool1(x)                ← relu1 never called

  Root cause: PyTorch modules must be explicitly invoked in forward() to
  participate in the computation graph. relu1 is registered in __init__
  but is a dead branch — no tensor flows through it and gradients cannot
  back-propagate through the activation.

  Proposed patch:
  ─────────────────────────────────────────
    def forward(self, x):
        x = self.conv1(x)
  +     x = self.relu1(x)   ← insert here
        x = self.pool1(x)
        …
  ─────────────────────────────────────────

  Inserting activation into forward pass…`,
}

interface ManualFixField { key: string; label: string; currentVal: string; hint: string }
interface ManualFixDef   { fields: ManualFixField[]; preview: (vals: Record<string, string>) => string }

const MANUAL_FIX_DEFS: Record<string, ManualFixDef> = {
  'e-dim': {
    fields: [{ key: 'in_ch', label: 'in_channels', currentVal: '128', hint: 'MaxPool2D outputs 64 channels' }],
    preview: v => `nn.Conv2d(${v.in_ch || '64'}, 128, 3)`,
  },
  'e-relu': {
    fields: [],
    preview: () => `x = self.relu1(x)  # wired after conv1`,
  },
}

// ─── Code ↔ Canvas sync helpers ──────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  conv: '#4a9eff', norm: '#4a9eff', pool: '#ecb2ff',
  relu: '#baffa2', activ: '#baffa2', linear: '#ffd166',
  dense: '#ffd166', dropout: '#ff9090', attn: '#ecb2ff',
  embed: '#ffd166', flatten: '#ffd166', identity: '#bac9cc',
}

function layerColor(nnType: string): string {
  const low = nnType.toLowerCase()
  for (const [k, c] of Object.entries(TYPE_COLOR)) if (low.includes(k)) return c
  return '#bac9cc'
}

function layerDepth(nnType: string): number {
  const low = nnType.toLowerCase()
  if (low.includes('conv'))   return 4
  if (low.includes('pool'))   return 4
  if (low.includes('norm'))   return 3
  if (low.includes('linear')) return 3
  return 1
}

interface ParsedLayer { id: string; label: string; sublabel: string }

function parseCodeLayers(code: string): ParsedLayer[] {
  const out: ParsedLayer[] = []
  for (const raw of code.split('\n')) {
    const clean = raw.replace(/#.*$/, '').trim()
    // Match: self.{id} = nn.{Type}({args})  — args may be empty
    const m = clean.match(/\bself\.(\w+)\s*=\s*nn\.(\w+)\s*\(([^)]*)\)/)
    if (m) out.push({ id: m[1], label: m[2], sublabel: m[3].trim() })
  }
  return out
}

// ─── Diagnostics engine ──────────────────────────────────────────────────────

type DiagPhase = 'idle' | 'scanning' | 'done'

function blockInCh(b: BlockDef): number | null {
  const l = b.label.toLowerCase(), s = b.sublabel ?? ''
  const ns = (s.match(/\d+/g) ?? []).map(Number)
  if (l.includes('conv') || l.includes('linear') || l.includes('dense')) return ns[0] ?? null
  if (l.includes('norm') || l.includes('batch'))  return ns[0] ?? null
  return null
}

function blockOutCh(b: BlockDef): number | null {
  const l = b.label.toLowerCase(), s = b.sublabel ?? ''
  const ns = (s.match(/\d+/g) ?? []).map(Number)
  if (l.includes('conv') || l.includes('linear') || l.includes('dense')) return ns[1] ?? null
  return null
}

function diagnoseBlocks(blocks: BlockDef[], fixed: Set<string>): DiagError[] {
  const errs: DiagError[] = []
  let prevOut: number | null = null
  for (let i = 0; i < blocks.length; i++) {
    const b   = blocks[i]
    const inp = blockInCh(b)
    const out = blockOutCh(b)
    if (!fixed.has(b.id)) {
      if (prevOut !== null && inp !== null && inp !== prevOut) {
        errs.push({
          id: `dim-${b.id}`, layerId: b.id, type: 'DIMENSION_MISMATCH', severity: 'error',
          message: `${b.label}(${b.sublabel ?? ''}) declares in_channels=${inp} but the preceding ${blocks[i - 1]?.label ?? 'layer'} outputs ${prevOut} channels.`,
          fix: 'Fix Channels', fixDesc: `Change in_channels ${inp} → ${prevOut}`,
        })
      }
      if (b.floating) {
        errs.push({
          id: `float-${b.id}`, layerId: b.id, type: 'CONNECTIVITY', severity: 'warning',
          message: `${b.label} is floating — it may not be called in the model's forward() pass.`,
          fix: 'Wire to forward()', fixDesc: `Add x = self.${b.id}(x) in forward()`,
        })
      }
    }
    if (out !== null) prevOut = out
    else if (inp !== null) prevOut = inp
  }
  return errs
}

function aiResponseFor(err: DiagError): string {
  if (err.type === 'DIMENSION_MISMATCH') {
    const inM  = err.message.match(/in_channels=(\d+)/)
    const outM = err.message.match(/outputs (\d+) channel/)
    const iv = inM?.[1] ?? '?', ov = outM?.[1] ?? '?'
    return `Scanning computation graph…

  Layer:  self.${err.layerId}
  Issue:  DIMENSION_MISMATCH

  Root cause: ${err.message}

  The weight tensor expects in_channels=${iv} but the upstream
  layer feeds a tensor with ${ov} channels. PyTorch raises
  RuntimeError during forward() when shapes are multiplied.

  Proposed patch:
  ─────────────────────────────────────────────
  - in_channels = ${iv}
  + in_channels = ${ov}   ← match upstream output
  ─────────────────────────────────────────────

  Applying fix to layer definition and code sync…`
  }
  if (err.type === 'CONNECTIVITY') {
    return `Tracing forward() connectivity…

  Layer:  self.${err.layerId}   ← defined in __init__
  Status: NOT CALLED in forward()

  Root cause: ${err.message}

  In PyTorch, sub-modules must be explicitly invoked in
  forward() to join the computation graph. Defining them
  in __init__ alone is insufficient for gradient flow.

  Proposed patch:
  ─────────────────────────────────────────────
    def forward(self, x):
        …
  +     x = self.${err.layerId}(x)   ← insert here
        …
  ─────────────────────────────────────────────

  Inserting layer into forward pass…`
  }
  return `Analyzing issue: ${err.type}\n\n  ${err.message}\n\n  Fix: ${err.fixDesc}\n\n  Applying…`
}

// ─── Training simulation ──────────────────────────────────────────────────────

type TrainPhase = 'config' | 'running' | 'done'

interface EpochData {
  epoch: number; trainLoss: number; valLoss: number; trainAcc: number; valAcc: number
}
interface TrainConfig {
  dataset: string; epochs: number; lr: string; batchSize: number; optimizer: string
}

const TRAIN_DATASETS  = ['CIFAR-10', 'MNIST', 'Fashion-MNIST'] as const
const TRAIN_LRS       = ['0.1', '0.01', '0.001', '0.0001'] as const
const TRAIN_BATCHES   = [16, 32, 64, 128] as const
const TRAIN_OPTIMS    = ['SGD', 'Adam', 'AdamW', 'RMSprop'] as const
const TRAIN_EPOCHS    = [5, 10, 20, 50, 100] as const

function simEpoch(ep: number, total: number, seed: number, dataset: string): EpochData {
  const p = ep / total
  const n = (k: number) => (Math.sin(seed * ep * k + ep) * 0.6 + Math.sin(seed * ep * (k * 0.37)) * 0.4) * 0.07
  const [iL, fL] = dataset === 'MNIST' ? [2.2, 0.07] : dataset === 'Fashion-MNIST' ? [2.3, 0.30] : [2.5, 0.62]
  const [iA, fA] = dataset === 'MNIST' ? [0.11, 0.993] : dataset === 'Fashion-MNIST' ? [0.095, 0.938] : [0.092, 0.875]
  const trainLoss = iL * Math.pow(fL / iL, p) + Math.abs(n(17.3))
  const valLoss   = trainLoss * (1.12 + n(5.1) * 0.5)
  const trainAcc  = iA + (fA - iA) * (1 - Math.exp(-3.8 * p)) + n(9.1) * 0.015
  const valAcc    = trainAcc * (1 - 0.038 - Math.abs(n(3.3)) * 0.25)
  return {
    epoch: ep,
    trainLoss: Math.max(0.01, trainLoss),
    valLoss:   Math.max(0.01, valLoss),
    trainAcc:  Math.min(0.999, Math.max(0.05, trainAcc)),
    valAcc:    Math.min(0.999, Math.max(0.05, valAcc)),
  }
}

function exportWeights(cfg: TrainConfig, history: EpochData[], blocks: BlockDef[]) {
  const rnd = (n: number, seed: number) =>
    Array.from({ length: n }, (_, i) => +((Math.sin(seed * i * 1.73 + i) * 0.08).toFixed(6)))
  const best = history.reduce((b, e) => (e.valAcc > b.valAcc ? e : b), history[0])
  const payload = {
    metadata: {
      framework: 'NeuroViz Studio (simulated)',
      dataset: cfg.dataset,
      epochs_trained: history.length,
      optimizer: cfg.optimizer,
      learning_rate: parseFloat(cfg.lr),
      batch_size: cfg.batchSize,
      best_val_accuracy: +best.valAcc.toFixed(4),
      best_epoch: best.epoch,
      created_at: new Date().toISOString(),
    },
    training_history: history.map(e => ({
      epoch: e.epoch,
      train_loss: +e.trainLoss.toFixed(4),
      val_loss:   +e.valLoss.toFixed(4),
      train_acc:  +e.trainAcc.toFixed(4),
      val_acc:    +e.valAcc.toFixed(4),
    })),
    layers: blocks.map(b => ({
      id: b.id, type: b.label, sublabel: b.sublabel ?? '',
      weight: rnd(32, b.id.charCodeAt(0) + 1),
      bias:   rnd(8,  b.id.charCodeAt(1) ?? 2),
    })),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `weights_${cfg.dataset.toLowerCase().replace(/-/g, '_')}_${Date.now()}.json`,
  })
  a.click(); URL.revokeObjectURL(a.href)
}

// ─── Mini chart components ────────────────────────────────────────────────────

function LossChart({ history, epochs }: { history: EpochData[]; epochs: number }) {
  const H = 90
  if (history.length < 2) return (
    <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 2, color: '#2a2a2a', fontFamily: 'JetBrains Mono', fontSize: 9 }}>
      Waiting for data…
    </div>
  )
  const VW = 300
  const vals = history.flatMap(e => [e.trainLoss, e.valLoss])
  const hi = Math.max(...vals), lo = Math.min(...vals) * 0.92
  const rng = hi - lo || 1
  const px = (e: EpochData) => ((e.epoch - 1) / Math.max(epochs - 1, 1)) * (VW - 4) + 2
  const py = (v: number)    => H - ((v - lo) / rng) * (H - 8) - 4
  const trainD = history.map((e, i) => `${i ? 'L' : 'M'}${px(e).toFixed(1)},${py(e.trainLoss).toFixed(1)}`).join('')
  const valD   = history.map((e, i) => `${i ? 'L' : 'M'}${px(e).toFixed(1)},${py(e.valLoss).toFixed(1)}`).join('')
  const last   = history[history.length - 1]
  return (
    <svg viewBox={`0 0 ${VW} ${H}`} style={{ width: '100%', height: H, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 2, display: 'block' }} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={2} y1={py(lo + t * rng)} x2={VW - 2} y2={py(lo + t * rng)} stroke="#161616" strokeWidth={1} />
      ))}
      <path d={valD}   fill="none" stroke="#ecb2ff" strokeWidth={2} opacity={0.7} />
      <path d={trainD} fill="none" stroke="#00daf3" strokeWidth={2.5} />
      <circle cx={px(last)} cy={py(last.trainLoss)} r={3} fill="#00daf3" />
      <circle cx={px(last)} cy={py(last.valLoss)}   r={3} fill="#ecb2ff" />
      <text x={3} y={10}    fill="#2a3a3c" fontSize={7} fontFamily="JetBrains Mono">{hi.toFixed(2)}</text>
      <text x={3} y={H - 2} fill="#2a3a3c" fontSize={7} fontFamily="JetBrains Mono">{lo.toFixed(2)}</text>
    </svg>
  )
}

function AccChart({ history, epochs }: { history: EpochData[]; epochs: number }) {
  if (history.length < 2) return null
  const VW = 300, H = 55
  const px = (e: EpochData) => ((e.epoch - 1) / Math.max(epochs - 1, 1)) * (VW - 4) + 2
  const py = (v: number)    => H - v * (H - 6) - 3
  const trainD = history.map((e, i) => `${i ? 'L' : 'M'}${px(e).toFixed(1)},${py(e.trainAcc).toFixed(1)}`).join('')
  const valD   = history.map((e, i) => `${i ? 'L' : 'M'}${px(e).toFixed(1)},${py(e.valAcc).toFixed(1)}`).join('')
  return (
    <svg viewBox={`0 0 ${VW} ${H}`} style={{ width: '100%', height: H, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 2, display: 'block' }} preserveAspectRatio="none">
      {[0.5, 1].map(t => (
        <line key={t} x1={2} y1={py(t)} x2={VW - 2} y2={py(t)} stroke="#161616" strokeWidth={1} />
      ))}
      <path d={valD}   fill="none" stroke="#baffa2" strokeWidth={2} opacity={0.7} />
      <path d={trainD} fill="none" stroke="#ffd166" strokeWidth={2.5} />
      <text x={3} y={10}    fill="#2a3a3c" fontSize={7} fontFamily="JetBrains Mono">100%</text>
      <text x={3} y={H - 2} fill="#2a3a3c" fontSize={7} fontFamily="JetBrains Mono">0%</text>
    </svg>
  )
}

// ─── Training Drawer ──────────────────────────────────────────────────────────

function TrainingDrawer({ open, blocks, onClose }: { open: boolean; blocks: BlockDef[]; onClose: () => void }) {
  const [phase,   setPhase]   = useState<TrainPhase>('config')
  const [cfg,     setCfg]     = useState<TrainConfig>({ dataset: 'CIFAR-10', epochs: 20, lr: '0.001', batchSize: 32, optimizer: 'Adam' })
  const [history, setHistory] = useState<EpochData[]>([])
  const [curEp,   setCurEp]   = useState(0)
  const [paused,  setPaused]  = useState(false)
  const seed     = useRef(Math.random() * 1e4)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(false)
  const pausedRef = useRef(false)
  const epochRef  = useRef(0)
  const cfgRef    = useRef(cfg)
  useEffect(() => { cfgRef.current = cfg }, [cfg])

  useEffect(() => {
    if (!open) { activeRef.current = false; if (timerRef.current) clearTimeout(timerRef.current) }
  }, [open])
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const tick = useCallback(() => {
    if (!activeRef.current || pausedRef.current) return
    const ep  = epochRef.current + 1
    epochRef.current = ep
    const data = simEpoch(ep, cfgRef.current.epochs, seed.current, cfgRef.current.dataset)
    setHistory(prev => [...prev, data])
    setCurEp(ep)
    if (ep < cfgRef.current.epochs) {
      timerRef.current = setTimeout(tick, 360)
    } else {
      setPhase('done'); activeRef.current = false
    }
  }, [])

  const startTraining = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    epochRef.current = 0; seed.current = Math.random() * 1e4
    setHistory([]); setCurEp(0); setPaused(false)
    activeRef.current = true; pausedRef.current = false
    setPhase('running')
    timerRef.current = setTimeout(tick, 250)
  }, [tick])

  const togglePause = useCallback(() => {
    if (pausedRef.current) {
      pausedRef.current = false; setPaused(false)
      timerRef.current = setTimeout(tick, 360)
    } else {
      pausedRef.current = true; setPaused(true)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [tick])

  const stopTraining = useCallback(() => {
    activeRef.current = false; pausedRef.current = false
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase(history.length > 0 ? 'done' : 'config'); setPaused(false)
  }, [history.length])

  const best   = history.length ? history.reduce((b, e) => e.valAcc > b.valAcc ? e : b, history[0]) : null
  const latest = history[history.length - 1]

  const cfgChip = (active: boolean, col: string) => ({
    padding: '4px 9px',
    background: active ? `${col}1a` : 'transparent',
    border:     `1px solid ${active ? col : '#3b494c'}`,
    borderRadius: 3, cursor: 'pointer',
    fontFamily: 'JetBrains Mono', fontSize: 9,
    color: active ? col : '#849396',
  } as React.CSSProperties)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="train-drawer"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 330, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.25, 0, 0.1, 1] }}
          style={{ position: 'fixed', bottom: 48, left: 260, right: 340, background: '#111', borderTop: '1px solid #3b494c', overflow: 'hidden', zIndex: 38 }}
        >
          <div style={{ height: 330, display: 'flex', flexDirection: 'column' }}>

            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #222', flexShrink: 0, background: '#0e0e0e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <motion.span
                  animate={phase === 'running' && !paused ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="material-symbols-outlined"
                  style={{ fontSize: 15, color: phase === 'running' ? '#00daf3' : phase === 'done' ? '#baffa2' : '#849396' }}>
                  {phase === 'running' ? 'model_training' : phase === 'done' ? 'check_circle' : 'play_circle'}
                </motion.span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, color: '#bac9cc', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                  {phase === 'config' ? 'Run Configuration'
                    : phase === 'running' ? `Training on ${cfg.dataset} · Epoch ${curEp} / ${cfg.epochs}`
                    : `Complete · ${history.length} epochs · Best ${(best!.valAcc * 100).toFixed(1)}% val`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {phase === 'running' && (
                  <>
                    <button onClick={togglePause} style={{ background: 'none', border: '1px solid #3b494c', borderRadius: 4, cursor: 'pointer', color: '#bac9cc', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'JetBrains Mono', fontSize: 9 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{paused ? 'play_arrow' : 'pause'}</span>
                      {paused ? 'Resume' : 'Pause'}
                    </button>
                    <button onClick={stopTraining} style={{ background: 'none', border: '1px solid #ff505033', borderRadius: 4, cursor: 'pointer', color: '#ff9090', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'JetBrains Mono', fontSize: 9 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>stop</span>Stop
                    </button>
                  </>
                )}
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a7a80', padding: 2 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              </div>
            </div>

            {/* ── CONFIG PHASE ── */}
            {phase === 'config' && (
              <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', gap: 16 }}>
                {/* Col 1: Dataset + Epochs */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Dataset</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {TRAIN_DATASETS.map(d => (
                        <button key={d} onClick={() => setCfg(c => ({...c, dataset: d}))} style={cfgChip(cfg.dataset === d, '#00daf3')}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Epochs</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {TRAIN_EPOCHS.map(n => (
                        <button key={n} onClick={() => setCfg(c => ({...c, epochs: n}))} style={cfgChip(cfg.epochs === n, '#c3f5ff')}>{n}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Learning Rate</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {TRAIN_LRS.map(lr => (
                        <button key={lr} onClick={() => setCfg(c => ({...c, lr}))} style={cfgChip(cfg.lr === lr, '#baffa2')}>{lr}</button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Col 2: Batch + Optimizer + Start */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Batch Size</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {TRAIN_BATCHES.map(b => (
                        <button key={b} onClick={() => setCfg(c => ({...c, batchSize: b}))} style={cfgChip(cfg.batchSize === b, '#ecb2ff')}>{b}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Optimizer</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {TRAIN_OPTIMS.map(o => (
                        <button key={o} onClick={() => setCfg(c => ({...c, optimizer: o}))} style={cfgChip(cfg.optimizer === o, '#ffd166')}>{o}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <motion.button whileHover={{ background: '#00daf3', color: '#001f24' }} whileTap={{ scale: 0.97 }}
                      onClick={startTraining}
                      style={{ padding: '9px 18px', background: 'rgba(0,218,243,0.1)', border: '1px solid #00daf3', borderRadius: 4, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: '#00daf3', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
                      Start Training
                    </motion.button>
                    <div style={{ flex: 1, padding: '7px 10px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 4 }}>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#3b494c', marginBottom: 2 }}>Config summary</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#5a7a80' }}>
                        {cfg.dataset} · {cfg.epochs}ep · lr={cfg.lr} · bs={cfg.batchSize} · {cfg.optimizer}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── RUNNING PHASE ── */}
            {phase === 'running' && (
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Charts */}
                <div style={{ flex: 1, padding: '10px 12px 8px 14px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#5a7a80' }}>LOSS  <span style={{ color: '#00daf3' }}>─</span> train  <span style={{ color: '#ecb2ff' }}>─</span> val</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#3b494c' }}>{Math.round(curEp / cfg.epochs * 100)}%</span>
                    </div>
                    <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
                      <motion.div animate={{ width: `${curEp / cfg.epochs * 100}%` }} transition={{ duration: 0.3 }}
                        style={{ height: '100%', background: paused ? '#3b494c' : '#00daf3', borderRadius: 2 }} />
                    </div>
                    <LossChart history={history} epochs={cfg.epochs} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#5a7a80', marginBottom: 4 }}>
                      ACCURACY  <span style={{ color: '#ffd166' }}>─</span> train  <span style={{ color: '#baffa2' }}>─</span> val
                    </div>
                    <AccChart history={history} epochs={cfg.epochs} />
                  </div>
                </div>
                {/* Live metrics */}
                <div style={{ width: 148, padding: '10px 12px 10px 0', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {latest && [
                    { label: 'Train Acc',  value: `${(latest.trainAcc * 100).toFixed(1)}%`, color: '#ffd166' },
                    { label: 'Val Acc',    value: `${(latest.valAcc * 100).toFixed(1)}%`,   color: '#baffa2' },
                    { label: 'Train Loss', value: latest.trainLoss.toFixed(3),               color: '#00daf3' },
                    { label: 'Val Loss',   value: latest.valLoss.toFixed(3),                 color: '#ecb2ff' },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 3, padding: '6px 8px' }}>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#3b494c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{m.label}</div>
                      <AnimatePresence mode="wait">
                        <motion.div key={m.value} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}
                          style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700, color: m.color }}>
                          {m.value}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DONE PHASE ── */}
            {phase === 'done' && best && (
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Charts */}
                <div style={{ flex: 1, padding: '10px 12px 8px 14px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#baffa2' }}>check_circle</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#baffa2' }}>
                      Best val {(best.valAcc * 100).toFixed(1)}% at epoch {best.epoch} · {cfg.dataset} · {cfg.optimizer} lr={cfg.lr}
                    </span>
                  </div>
                  <LossChart history={history} epochs={cfg.epochs} />
                  <AccChart history={history} epochs={cfg.epochs} />
                </div>
                {/* Stats + export */}
                <div style={{ width: 160, padding: '10px 14px 10px 0', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Best Val Acc',  value: `${(best.valAcc * 100).toFixed(2)}%`,  color: '#baffa2' },
                    { label: 'Best Val Loss', value: best.valLoss.toFixed(4),                color: '#ecb2ff' },
                    { label: 'Epochs',        value: `${history.length}`,                    color: '#c3f5ff' },
                    { label: 'Dataset',       value: cfg.dataset,                             color: '#ffd166' },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 3, padding: '5px 8px' }}>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#3b494c', textTransform: 'uppercase', marginBottom: 1 }}>{m.label}</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: m.color, wordBreak: 'break-all' }}>{m.value}</div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 'auto' }}>
                    <motion.button whileHover={{ background: 'rgba(0,218,243,0.14)', borderColor: '#00daf3' }} whileTap={{ scale: 0.97 }}
                      onClick={() => exportWeights(cfg, history, blocks)}
                      style={{ width: '100%', padding: '7px', background: 'rgba(0,218,243,0.06)', border: '1px solid #00daf322', borderRadius: 3, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, color: '#00daf3', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>download</span>Export Weights .json
                    </motion.button>
                    <motion.button whileHover={{ background: '#baffa210', borderColor: '#baffa244' }} whileTap={{ scale: 0.97 }}
                      onClick={() => { setPhase('config'); setHistory([]); setCurEp(0) }}
                      style={{ width: '100%', padding: '7px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 3, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>replay</span>Retrain
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Models',  to: '/'       },
  { label: 'Canvas',  to: '/canvas' },
  { label: 'Editor',  to: '/editor' },
]

const TAB_COLORS: Record<ActiveTab, string> = {
  inspect: '#c3f5ff', optimize: '#baffa2', diagnose: '#ffb4ab',
}

const TAB_CFG = [
  { id: 'inspect'  as ActiveTab, icon: 'analytics',     label: 'Inspect'  },
  { id: 'optimize' as ActiveTab, icon: 'rocket_launch', label: 'Optimize' },
  { id: 'diagnose' as ActiveTab, icon: 'bug_report',    label: 'Diagnose' },
]

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ activeTab, errorCount }: { activeTab: ActiveTab; errorCount: number }) {
  const { pathname } = useLocation()
  const tabColor = TAB_COLORS[activeTab]
  const tabIcon  = TAB_CFG.find(t => t.id === activeTab)?.icon ?? 'analytics'
  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35 }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: 64, zIndex: 50, background: '#201f1f', borderBottom: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: 'Inter', fontSize: 21, fontWeight: 700, color: '#00daf3', letterSpacing: '-0.02em' }}>NeuroViz Studio</span>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 20 }}>
          {NAV_LINKS.map(link => {
            const active = pathname === link.to
            return (
              <motion.div key={link.to} whileHover={{ color: '#e5e2e1' }}>
                <Link to={link.to} style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: active ? 700 : 400, color: active ? '#c3f5ff' : '#bac9cc', textDecoration: 'none', padding: '4px 10px', borderRadius: 4 }}>
                  {link.label}
                </Link>
              </motion.div>
            )
          })}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Active mode pill */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: tabColor + '14', border: `1px solid ${tabColor}44`, borderRadius: 20 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: tabColor }}>{tabIcon}</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, color: tabColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{activeTab}</span>
          </motion.div>
        </AnimatePresence>

        {/* Error badge */}
        <AnimatePresence>
          {errorCount > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#ff707014', border: '1px solid #ff707044', borderRadius: 20 }}>
              <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
                className="material-symbols-outlined" style={{ fontSize: 13, color: '#ff9090' }}>error</motion.span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#ffb4ab' }}>{errorCount} error{errorCount > 1 ? 's' : ''}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3b494c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#bac9cc' }}>person</span>
        </div>
      </div>
    </motion.header>
  )
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────────

const LAYER_GROUPS = [
  { icon: 'input',         label: 'Input / Output',  expanded: false },
  { icon: 'layers',        label: 'Convolutional',   expanded: true, active: true, children: ['Conv2D', 'ConvTranspose', 'DepthwiseConv'] },
  { icon: 'repeat',        label: 'Recurrent',       expanded: false },
  { icon: 'waves',         label: 'Normalization',   expanded: false },
  { icon: 'bolt',          label: 'Activation',      expanded: false },
  { icon: 'linear_scale',  label: 'Linear / Dense',  expanded: false },
]

function LeftSidebar({ unfixedErrors, onErrorClick, onTabChange }: {
  unfixedErrors: DiagError[]
  onErrorClick: (id: string) => void
  onTabChange:  (tab: ActiveTab) => void
}) {
  const unfixed = unfixedErrors
  return (
    <motion.aside
      initial={{ x: -260, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }}
      style={{ position: 'fixed', left: 0, top: 64, bottom: 48, width: 260, background: 'rgba(28,27,27,0.6)', backdropFilter: 'blur(20px)', borderRight: '1px solid #3b494c', display: 'flex', flexDirection: 'column', zIndex: 40 }}
    >
      {/* Header */}
      <div style={{ padding: '18px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, background: 'rgba(195,245,255,0.1)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#c3f5ff', fontSize: 18 }}>layers</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 700, color: '#c3f5ff' }}>Layer Library</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Drag to canvas</div>
          </div>
        </div>
        <motion.button whileHover={{ background: '#00daf3', color: '#00363d' }} whileTap={{ scale: 0.97 }}
          style={{ width: '100%', padding: '9px', background: '#c3f5ff', color: '#001f24', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', border: '1px solid #00daf3', borderRadius: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
          Custom Block
        </motion.button>
      </div>

      {/* Layer groups */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 18px' }}>
        {LAYER_GROUPS.map(group => (
          <div key={group.label}>
            <motion.div whileHover={!group.active ? { backgroundColor: 'rgba(53,53,52,0.7)' } : undefined}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 7px', borderRadius: 4, cursor: 'pointer', background: group.active ? 'rgba(0,229,255,0.07)' : 'transparent', borderLeft: group.active ? '2px solid #c3f5ff' : '2px solid transparent', color: group.active ? '#c3f5ff' : '#bac9cc', fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.04em' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{group.icon}</span>
                {group.label}
              </div>
              {'children' in group && (
                <motion.span animate={{ rotate: group.expanded ? 180 : 0 }} className="material-symbols-outlined" style={{ fontSize: 13 }}>expand_more</motion.span>
              )}
            </motion.div>
            {'children' in group && group.expanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                style={{ paddingLeft: 32, paddingTop: 5, paddingBottom: 5, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {(group.children as string[]).map((child, i) => (
                  <motion.div key={child} whileHover={{ color: '#c3f5ff' }}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'JetBrains Mono', fontSize: 10, color: '#7a9aa0', cursor: 'grab' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: i === 0 ? '#00daf3' : '#3b494c', flexShrink: 0 }} />
                    {child}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Error summary */}
      {unfixed.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ margin: '10px 14px', padding: 12, background: 'rgba(255,70,70,0.05)', border: '1px solid #ff707033', borderRadius: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, cursor: 'pointer' }}
            onClick={() => onTabChange('diagnose')}>
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#ff9090' }}>warning</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, color: '#ffb4ab', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {unfixed.length} issue{unfixed.length > 1 ? 's' : ''}
            </span>
          </div>
          {unfixed.map(err => (
            <motion.div key={err.id} whileHover={{ color: '#e5e2e1' }} onClick={() => onErrorClick(err.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, color: '#7a9aa0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 11, color: err.severity === 'error' ? '#ff7070' : '#ecb2ff' }}>
                {err.severity === 'error' ? 'error' : 'warning'}
              </span>
              {err.type}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Footer */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid #3b494c' }}>
        {[{ icon: 'settings', label: 'Settings' }, { icon: 'menu_book', label: 'Docs' }].map(item => (
          <motion.div key={item.label} whileHover={{ color: '#e5e2e1' }}
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 5px', borderRadius: 4, color: '#7a9aa0', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </motion.div>
        ))}
      </div>
    </motion.aside>
  )
}

// ─── Draggable Block ──────────────────────────────────────────────────────────

interface BlockProps {
  block: BlockDef; isSelected: boolean; isErrorFocused: boolean; isFixed: boolean
  onSelect: (id: string) => void
  onDragUpdate: (id: string, pos: Pos) => void
  onEdit: (block: BlockDef) => void
  onDelete: (id: string) => void
}

// Helper: returns the front face rect of a block given its container position in posRef
function getFront(pos: Pos, block: BlockDef) {
  const depth = block.depth ?? 1
  const bw = block.bw ?? 140
  const bh = block.bh ?? 52
  return {
    x:  pos.x + (depth - 1) * STACK_DX,       // front left edge (global)
    y:  pos.y + (depth - 1) * STACK_DY,       // front top edge (global)
    rx: pos.x + (depth - 1) * STACK_DX + bw,  // front right edge
    cy: pos.y + (depth - 1) * STACK_DY + bh / 2, // front center-y
    bw, bh,
  }
}

function DraggableBlock({ block, isSelected, isErrorFocused, isFixed, onSelect, onDragUpdate, onEdit, onDelete }: BlockProps) {
  const depth = block.depth ?? 1
  const bw    = block.bw ?? 140
  const bh    = block.bh ?? 52
  const col   = block.blockColor ?? '#3b494c'

  // container origin = back-slice top-left; front slice at local ((depth-1)*DX, (depth-1)*DY)
  const containerW = bw + (depth - 1) * STACK_DX
  const containerH = bh + (depth - 1) * STACK_DY
  const frontX = (depth - 1) * STACK_DX
  const frontY = (depth - 1) * STACK_DY

  const x = useMotionValue(block.initX)
  const y = useMotionValue(block.initY)

  const hasActiveError = block.hasError && !isFixed

  const frontBorder = isSelected
    ? '#00daf3'
    : isErrorFocused && hasActiveError ? '#ffb4ab'
    : hasActiveError ? '#ff7070'
    : block.floating ? col + 'cc' : col + 'aa'

  const glow = isSelected
    ? `0 0 22px ${col}55`
    : isErrorFocused && hasActiveError ? '0 0 16px rgba(255,70,70,0.35)'
    : block.floating ? `0 6px 28px ${col}33` : 'none'

  return (
    <motion.div
      drag dragMomentum={false} dragElastic={0}
      style={{ x, y, position: 'absolute', left: 0, top: 0, width: containerW, height: containerH, zIndex: isSelected || isErrorFocused ? 30 : 20, touchAction: 'none', cursor: 'grab' }}
      onDragStart={() => onSelect(block.id)}
      onDrag={() => onDragUpdate(block.id, { x: x.get(), y: y.get() })}
      onDragEnd={() => onDragUpdate(block.id, { x: x.get(), y: y.get() })}
      onClick={e => { e.stopPropagation(); onSelect(block.id) }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.08 }}
    >
      <motion.div
        animate={block.floating && !isSelected ? { y: [-3, 3, -3] } : { y: 0 }}
        transition={block.floating && !isSelected ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : {}}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      >
        {/* ── Layer label above the back slice ── */}
        <div style={{
          position: 'absolute', top: -22, left: 0, width: containerW, textAlign: 'center',
          fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', whiteSpace: 'nowrap', pointerEvents: 'none',
          color: isSelected ? '#00daf3' : hasActiveError ? '#ff9090' : col,
        }}>
          {block.label}
        </div>

        {/* ── 3-D stacked slices: s=0 = back (upper-left), s=depth-1 = front (lower-right) ── */}
        {Array.from({ length: depth }, (_, s) => {
          const isFront  = s === depth - 1
          const sliceX   = s * STACK_DX   // grows right for back→front? No: back=0 at upper-left
          // back(s=0) at (0,0), front(s=depth-1) at (frontX,frontY) — correct
          // Actually: we want back at upper-left (small local x,y) and front at lower-right.
          // Slice s position: sliceX = s*DX, sliceY = s*DY → s=0 at 0,0; s=depth-1 at frontX,frontY ✓
          const sliceY   = s * STACK_DY
          const alpha    = depth > 1 ? 0.10 + (s / (depth - 1)) * 0.22 : 0.22
          const bgAlpha  = Math.round(alpha * 255).toString(16).padStart(2, '0').slice(0, 2)

          return (
            <div key={s} style={{
              position: 'absolute', left: sliceX, top: sliceY, width: bw, height: bh,
              background: isFront
                ? (isSelected ? '#1c2028' : hasActiveError ? 'rgba(255,80,80,0.10)' : `${col}${bgAlpha}`)
                : `${col}${bgAlpha}`,
              border: `1.5px solid ${isFront ? frontBorder : col + (depth > 1 ? '44' : '88')}`,
              borderRadius: 2,
              boxShadow: isFront ? glow : 'none',
              display: isFront ? 'flex' : 'block',
              flexDirection: isFront ? 'column' : undefined,
              alignItems: isFront ? 'center' : undefined,
              justifyContent: isFront ? 'center' : undefined,
              zIndex: s + 1,
            }}>
              {isFront && (
                <>
                  {hasActiveError && (
                    <motion.div animate={{ opacity: [0.35, 0.9, 0.35] }} transition={{ duration: 1.1, repeat: Infinity }}
                      style={{ position: 'absolute', inset: -4, border: '1px solid #ff707055', borderRadius: 4, pointerEvents: 'none' }} />
                  )}
                  {block.sublabel && (
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: hasActiveError ? '#ff9090aa' : '#849396', textAlign: 'center', padding: '0 6px', lineHeight: 1.4 }}>
                      {block.sublabel}
                    </div>
                  )}
                  {isSelected && (
                    <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#00daf3', marginTop: 4 }}>radio_button_checked</span>
                  )}
                  {hasActiveError && !isSelected && (
                    <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#ff9090', marginTop: 4 }}>error</span>
                  )}
                  {isFixed && block.hasError && !isSelected && (
                    <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#baffa2', marginTop: 4 }}>check_circle</span>
                  )}
                </>
              )}
            </div>
          )
        })}

        {/* ── Selected ring around front face ── */}
        {isSelected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: 'absolute', left: frontX - 5, top: frontY - 5, width: bw + 10, height: bh + 10, border: '1.5px solid #00daf355', borderRadius: 5, pointerEvents: 'none', zIndex: depth + 5 }} />
        )}

        {/* ── Error / fixed indicator dot ── */}
        {block.hasError && (
          <motion.div
            initial={{ scale: 0 }}
            animate={isFixed ? { scale: 1 } : { scale: 1, opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: isFixed ? 0 : Infinity }}
            style={{ position: 'absolute', top: frontY - 7, right: 0, width: 13, height: 13, borderRadius: '50%', background: isFixed ? '#baffa2' : '#ff7070', border: '2px solid #0e0e0e', zIndex: depth + 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isFixed && <span className="material-symbols-outlined" style={{ fontSize: 8, color: '#0e6800' }}>check</span>}
          </motion.div>
        )}

        {/* ── Edit / Delete buttons — appear when selected ── */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'absolute', top: -42, left: frontX, display: 'flex', gap: 4, zIndex: 50 }}
              onPointerDown={e => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ background: 'rgba(0,218,243,0.2)', borderColor: '#00daf3' }}
                onClick={e => { e.stopPropagation(); onEdit(block) }}
                title="Edit layer"
                style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,20,22,0.95)', border: '1px solid #3b494c', borderRadius: 4, cursor: 'pointer', padding: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#00daf3' }}>edit</span>
              </motion.button>
              <motion.button
                whileHover={{ background: 'rgba(255,80,80,0.2)', borderColor: '#ff5050' }}
                onClick={e => { e.stopPropagation(); onDelete(block.id) }}
                title="Delete layer"
                style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,20,22,0.95)', border: '1px solid #3b494c', borderRadius: 4, cursor: 'pointer', padding: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ff5050' }}>delete</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

interface CanvasProps {
  blocks: BlockDef[]
  selectedId: string; fixedErrors: Set<string>; activeErrLayerId: string | null
  posRef: MutableRefObject<Record<string, Pos>>
  onSelect: (id: string) => void; onDragUpdate: (id: string, pos: Pos) => void
  onEditBlock: (block: BlockDef) => void; onDeleteBlock: (id: string) => void
  onRunClick: () => void; trainingOpen: boolean
}

function Canvas({ blocks, selectedId, fixedErrors, activeErrLayerId, posRef, onSelect, onDragUpdate, onEditBlock, onDeleteBlock, onRunClick, trainingOpen }: CanvasProps) {
  const hasBlock = (id: string) => blocks.some(b => b.id === id)
  const blockMap = new Map(blocks.map(b => [b.id, b]))

  // Horizontal bezier from front face RIGHT to next block front face LEFT
  function cxPath(fromId: string, toId: string) {
    const fPos = posRef.current[fromId] ?? { x: 0, y: 0 }
    const tPos = posRef.current[toId]   ?? { x: 0, y: 0 }
    const fb = blockMap.get(fromId), tb = blockMap.get(toId)
    if (!fb || !tb) return ''
    const f = getFront(fPos, fb)
    const t = getFront(tPos, tb)
    const mx = (f.rx + t.x) / 2
    return `M ${f.rx},${f.cy} C ${mx},${f.cy} ${mx},${t.cy} ${t.x},${t.cy}`
  }

  const conv2Fixed     = fixedErrors.has('conv2')
  const activeErrBlock = activeErrLayerId ? { layerId: activeErrLayerId } : null

  return (
    <main
      onClick={() => onSelect('')}
      style={{ position: 'fixed', top: 64, bottom: 48, left: 260, right: 340, overflow: 'hidden', background: '#0e0e0e', backgroundImage: 'linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.022) 1px,transparent 1px)', backgroundSize: '28px 28px' }}
    >
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}>

        {/* ── Main flow: dashed blue lines ── */}
        {hasBlock('input') && hasBlock('conv1') && (
          <path d={cxPath('input', 'conv1')} fill="none" stroke="#4a9eff" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.7" />
        )}
        {hasBlock('conv1') && hasBlock('bn1') && (
          <path d={cxPath('conv1', 'bn1')} fill="none" stroke="#4a9eff" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.55" />
        )}
        {hasBlock('bn1') && hasBlock('pool1') && (
          <path d={cxPath('bn1', 'pool1')} fill="none" stroke="#4a9eff" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.55" />
        )}

        {/* ── ReLU floating branch: animated dashed green ── */}
        {hasBlock('pool1') && hasBlock('relu1') && (
          <motion.path d={cxPath('pool1', 'relu1')} fill="none" stroke="#baffa2" strokeWidth="1.5" strokeDasharray="4 4"
            animate={{ strokeDashoffset: [0, -8] }}
            transition={{ strokeDashoffset: { duration: 0.9, repeat: Infinity, ease: 'linear' }, d: { duration: 0 } }}
            opacity="0.75"
          />
        )}

        {/* ── Error / fixed branch: pool1 → conv2 ── */}
        {hasBlock('pool1') && hasBlock('conv2') && (!conv2Fixed ? (
          <motion.path d={cxPath('pool1', 'conv2')} fill="none" stroke="#ff7070" strokeWidth="1.5" strokeDasharray="4 4"
            animate={{ strokeDashoffset: [0, -8] }}
            transition={{ strokeDashoffset: { duration: 0.65, repeat: Infinity, ease: 'linear' }, d: { duration: 0 } }}
            style={{ filter: 'drop-shadow(0 0 3px #ff707077)' }}
          />
        ) : (
          <motion.path d={cxPath('pool1', 'conv2')} fill="none" stroke="#baffa2" strokeWidth="1.5"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }}
            style={{ filter: 'drop-shadow(0 0 3px #baffa255)' }}
          />
        ))}

        {/* ── Active-error focus rect (front face) ── */}
        {activeErrBlock && !fixedErrors.has(activeErrBlock.layerId) && hasBlock(activeErrBlock.layerId) && posRef.current[activeErrBlock.layerId] && (() => {
          const bdef = blockMap.get(activeErrBlock.layerId)!
          const f    = getFront(posRef.current[activeErrBlock.layerId], bdef)
          return (
            <motion.rect x={f.x - 9} y={f.y - 9} width={f.bw + 18} height={f.bh + 18} rx={7}
              fill="none" stroke="#ff7070" strokeWidth="1.5" strokeDasharray="6"
              animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          )
        })()}

        {/* ── Phase labels at bottom ── */}
        <line x1="50" y1="320" x2="600" y2="320" stroke="#2a3a3c" strokeWidth="1" />
        <text x="325" y="336" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#3b6066" letterSpacing="1.5">
          FEATURE EXTRACTION
        </text>
        <line x1="700" y1="320" x2="960" y2="320" stroke="#2a3a3c" strokeWidth="1" />
        <text x="830" y="336" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#3b6066" letterSpacing="1.5">
          BRANCHES
        </text>
      </svg>

      {/* ── Run Model button (top-right of canvas) ── */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
        whileHover={{ background: trainingOpen ? '#ff505022' : '#00daf3', color: trainingOpen ? '#ff9090' : '#001f24', borderColor: trainingOpen ? '#ff5050' : '#00daf3' }}
        whileTap={{ scale: 0.96 }}
        onClick={e => { e.stopPropagation(); onRunClick() }}
        style={{ position: 'absolute', top: 14, right: 14, zIndex: 20, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', background: trainingOpen ? 'rgba(255,80,80,0.06)' : 'rgba(0,218,243,0.1)', border: `1px solid ${trainingOpen ? '#ff505033' : '#00daf355'}`, borderRadius: 20, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: trainingOpen ? '#ff9090' : '#00daf3', letterSpacing: '0.04em' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{trainingOpen ? 'close' : 'play_arrow'}</span>
        {trainingOpen ? 'Close Runner' : 'Run Model'}
      </motion.button>

      {/* Floating canvas toolbar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2, background: '#201f1f', border: '1px solid #3b494c', borderRadius: 8, padding: '4px 6px', zIndex: 20 }}>
        {[
          { icon: 'arrow_selector_tool', active: true },
          { icon: 'pan_tool', active: false },
          { icon: 'add_circle', active: false },
          { icon: 'center_focus_strong', active: false },
          { icon: 'fit_screen', active: false },
        ].map((t, i) => (
          <motion.button key={i} whileHover={{ background: 'rgba(0,218,243,0.1)' }} whileTap={{ scale: 0.93 }}
            style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, background: t.active ? 'rgba(0,218,243,0.12)' : 'transparent', border: 'none', cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: t.active ? '#00daf3' : '#849396' }}>{t.icon}</span>
          </motion.button>
        ))}
      </motion.div>

      {blocks.map(block => (
        <DraggableBlock key={block.id} block={block}
          isSelected={block.id === selectedId}
          isErrorFocused={activeErrBlock?.layerId === block.id}
          isFixed={fixedErrors.has(block.id)}
          onSelect={onSelect}
          onDragUpdate={onDragUpdate}
          onEdit={onEditBlock}
          onDelete={onDeleteBlock}
        />
      ))}
    </main>
  )
}

// ─── INSPECT Panel ────────────────────────────────────────────────────────────

type SyncStatus = 'idle' | 'ok' | 'empty' | 'copied'

function InspectPanel({ selectedId, layerMeta, codeLines, onCodeSync, onRunDiag }: {
  selectedId: string
  layerMeta: Record<string, LayerMeta>
  codeLines: CodeLine[]
  onCodeSync: (code: string) => void
  onRunDiag: () => void
}) {
  const [editMode,   setEditMode]   = useState(false)
  const [editText,   setEditText]   = useState('')
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const codePlainText = codeLines.map(l => l.text).join('\n')

  const enterEdit = () => {
    setEditText(codePlainText)
    setEditMode(true)
    setSyncStatus('idle')
    setTimeout(() => textareaRef.current?.focus(), 60)
  }

  const cancelEdit = () => { setEditMode(false); setSyncStatus('idle') }

  const handleSync = useCallback(() => {
    const parsed = parseCodeLayers(editText)
    if (!parsed.length) { setSyncStatus('empty'); return }
    onCodeSync(editText)
    setSyncStatus('ok')
    setTimeout(() => { setSyncStatus('idle'); setEditMode(false) }, 900)
  }, [editText, onCodeSync])

  const handleCopy = () => {
    navigator.clipboard.writeText(codePlainText).then(() => {
      setSyncStatus('copied')
      setTimeout(() => setSyncStatus('idle'), 1200)
    })
  }

  const fallback = Object.values(layerMeta)[0]
  const meta = layerMeta[selectedId] ?? fallback
  const isErr = meta?.shape === 'ERROR'
  if (!meta) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#849396', fontFamily: 'JetBrains Mono', fontSize: 11 }}>
      No layer selected
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
      className="custom-scrollbar"
      style={{ flex: 1, overflow: editMode ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>

      {/* ── Tensor state ── */}
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #3b494c', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tensor Flow State</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AnimatePresence mode="wait">
              <motion.span key={meta.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#00daf3', background: 'rgba(0,218,243,0.1)', padding: '2px 6px', borderRadius: 3 }}>
                {meta.title}
              </motion.span>
            </AnimatePresence>
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: isErr ? '#ff7070' : '#2ae500' }} />
          </div>
        </div>

        <div style={{ background: '#0e0e0e', padding: '10px 12px', border: `1px solid ${isErr ? '#ff707033' : '#3b494c'}`, marginBottom: 8, borderRadius: 2 }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Output Shape</div>
          <AnimatePresence mode="wait">
            <motion.div key={`shape-${selectedId}`}
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.16 }}
              style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: isErr ? '#ff9090' : '#c3f5ff', letterSpacing: '-0.01em' }}>
              {meta.shape}
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {(['memory', 'dtype'] as const).map(key => (
            <div key={key} style={{ background: '#0e0e0e', padding: '8px 10px', border: '1px solid #3b494c', borderRadius: 2 }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                {key === 'memory' ? 'Memory' : 'DType'}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={`${key}-${selectedId}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                  style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#e5e2e1' }}>
                  {meta[key]}
                </motion.div>
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live Code Sync header ── */}
      <div style={{ padding: '7px 12px', background: 'rgba(53,53,52,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: editMode ? '1px solid #2a3a3c' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <motion.span
            animate={editMode ? { color: '#ffd166' } : { color: '#00daf3' }}
            className="material-symbols-outlined" style={{ fontSize: 14 }}>
            {editMode ? 'edit_note' : 'code'}
          </motion.span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: editMode ? '#ffd166' : '#00daf3' }}>
            {editMode ? 'Edit model.py' : 'Live Code Sync'}
          </span>
          <AnimatePresence mode="wait">
            {syncStatus === 'ok' && (
              <motion.span key="ok" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#baffa2' }}>✓ synced</motion.span>
            )}
            {syncStatus === 'empty' && (
              <motion.span key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#ff9090' }}>no layers found</motion.span>
            )}
            {syncStatus === 'copied' && (
              <motion.span key="cp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#c3f5ff' }}>copied!</motion.span>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {!editMode && (
            <motion.button
              whileHover={{ background: 'rgba(195,245,255,0.1)' }} whileTap={{ scale: 0.92 }}
              onClick={handleCopy} title="Copy code"
              style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 3 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#5a7a80' }}>content_copy</span>
            </motion.button>
          )}
          <motion.button
            whileHover={{ background: editMode ? 'rgba(255,80,80,0.1)' : 'rgba(255,209,102,0.1)' }} whileTap={{ scale: 0.92 }}
            onClick={editMode ? cancelEdit : enterEdit}
            style={{ height: 22, padding: '0 7px', display: 'flex', alignItems: 'center', gap: 4, background: editMode ? 'rgba(255,80,80,0.06)' : 'rgba(255,209,102,0.06)', border: `1px solid ${editMode ? '#ff505033' : '#ffd16633'}`, borderRadius: 3, cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12, color: editMode ? '#ff9090' : '#ffd166' }}>
              {editMode ? 'close' : 'edit'}
            </span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: editMode ? '#ff9090' : '#ffd166' }}>
              {editMode ? 'Cancel' : 'Edit'}
            </span>
          </motion.button>
          {!editMode && <span style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#3b494c', marginLeft: 2 }}>model.py</span>}
        </div>
      </div>

      {/* ── Edit mode: textarea ── */}
      {editMode && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={e => { setEditText(e.target.value); setSyncStatus('idle') }}
            onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleSync() } }}
            spellCheck={false}
            placeholder={`# Paste or type PyTorch nn.Module code\nclass Network(nn.Module):\n  def __init__(self):\n    self.conv1 = nn.Conv2d(3, 64, 3)\n    self.relu1 = nn.ReLU()\n    ...`}
            style={{
              flex: 1, resize: 'none',
              background: '#080c0d', border: 'none',
              padding: '12px 14px',
              fontFamily: 'JetBrains Mono', fontSize: 10.5, color: '#6aaa80',
              lineHeight: 1.85, outline: 'none',
              overflowY: 'auto',
            }}
          />
          {/* Sync toolbar */}
          <div style={{ padding: '7px 12px', display: 'flex', gap: 6, alignItems: 'center', background: '#0a0a0a', borderTop: '1px solid #1a2426', flexShrink: 0 }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 7.5, color: '#3b494c', flex: 1 }}>
              Ctrl+Enter · parse <span style={{ color: '#5a7a80' }}>self.x = nn.Y(z)</span>
            </span>
            <motion.button
              whileHover={{ background: '#baffa2', color: '#002a00' }} whileTap={{ scale: 0.96 }}
              onClick={handleSync}
              style={{ padding: '5px 10px', background: 'rgba(186,255,162,0.09)', border: '1px solid #baffa244', borderRadius: 3, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, color: '#baffa2', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>sync</span>
              Sync
            </motion.button>
            <motion.button
              whileHover={{ background: '#c3f5ff', color: '#002a00' }} whileTap={{ scale: 0.96 }}
              onClick={() => { handleSync(); onRunDiag() }}
              style={{ padding: '5px 10px', background: 'rgba(195,245,255,0.07)', border: '1px solid #c3f5ff33', borderRadius: 3, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, color: '#c3f5ff', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>biotech</span>
              Diagnose
            </motion.button>
          </div>
        </div>
      )}

      {/* ── Read mode: highlighted code lines ── */}
      {!editMode && (
        <div style={{ background: '#0e0e0e', padding: '10px 14px', fontFamily: 'JetBrains Mono', fontSize: 11, lineHeight: 1.8, flex: 1 }}>
          {codeLines.map((line, i) => {
            const isHL   = Boolean(line.layerId && selectedId && line.layerId === meta.lineId)
            const isErr2 = line.error === true
            return (
              <motion.div key={`${line.layerId ?? 'hdr'}-${i}`}
                animate={{ backgroundColor: isHL ? 'rgba(0,229,255,0.06)' : isErr2 ? 'rgba(255,70,70,0.06)' : 'rgba(0,0,0,0)' }}
                transition={{ duration: 0.2 }}
                style={{ paddingLeft: 14, paddingRight: 8, marginLeft: -14, marginRight: -14, borderLeft: isHL ? '2px solid #00daf3' : isErr2 ? '2px solid #ff7070' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 22 }}>
                <span style={{ color: isHL ? '#e5e2e1' : isErr2 ? '#ff9090' : line.purple ? '#ecb2ff' : line.dim ? '#3a5558' : '#6a8c90' }}>
                  {line.text}
                </span>
                {isHL   && <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#00daf3', flexShrink: 0, marginLeft: 6 }}>link</span>}
                {isErr2 && <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#ff7070', flexShrink: 0, marginLeft: 6 }}>error</span>}
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

// ─── OPTIMIZE Panel ───────────────────────────────────────────────────────────

function OptimizePanel({ optTarget, onTargetChange }: { optTarget: OptTarget; onTargetChange: (t: OptTarget) => void }) {
  const tgt   = OPT_TARGETS[optTarget]
  const bench = BENCH[optTarget]
  const maxMs = Math.max(...bench.map(b => b.ms))
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
      className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '18px 18px' }}>
      {/* Target chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(Object.entries(OPT_TARGETS) as [OptTarget, OptTargetDef][]).map(([key, t]) => (
          <motion.button key={key} onClick={() => onTargetChange(key)} whileTap={{ scale: 0.96 }}
            style={{ flex: 1, padding: '7px 4px', background: optTarget === key ? t.color + '1a' : 'transparent', border: `1px solid ${optTarget === key ? t.color : '#3b494c'}`, borderRadius: 4, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, color: optTarget === key ? t.color : '#849396', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {t.badge}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={optTarget} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {/* Target label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', background: tgt.color + '0c', border: `1px solid ${tgt.color}2a`, borderRadius: 4, marginBottom: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: tgt.color }}>rocket_launch</span>
            <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: tgt.color }}>{tgt.label}</span>
          </div>

          {/* Pipeline steps with traveling dot */}
          <div style={{ marginBottom: 14 }}>
            {OPT_STEPS.map((step, i) => (
              <div key={step.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', background: '#201f1f', border: '1px solid #3b494c', borderRadius: 4 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 4, background: step.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: step.color }}>{step.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#bac9cc' }}>{step.label}</div>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: step.color }}>{step.size}</span>
                </div>
                {i < OPT_STEPS.length - 1 && (
                  <div style={{ position: 'relative', height: 18, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: 1, height: '100%', background: '#3b494c' }} />
                    <motion.div
                      animate={{ y: [-9, 9] }} transition={{ duration: 0.55, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
                      style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: tgt.color }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
            {[['Latency', tgt.latency], ['Size', tgt.size], ['Compression', tgt.compression], ['Format', tgt.badge]].map(([label, val]) => (
              <div key={label} style={{ background: '#0e0e0e', padding: '8px 10px', border: '1px solid #3b494c', borderRadius: 2 }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, color: tgt.color }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Benchmark bars */}
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Runtime Benchmark</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bench.map(b => (
              <div key={b.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#7a9aa0' }}>{b.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: tgt.color }}>{b.ms} ms</span>
                </div>
                <div style={{ height: 4, background: '#2a2a2a', borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div
                    key={`${optTarget}-${b.label}`}
                    initial={{ width: 0 }} animate={{ width: `${(b.ms / maxMs) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
                    style={{ height: '100%', background: tgt.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

// ─── DIAGNOSE Panel ───────────────────────────────────────────────────────────

function DiagnosePanel({ errors, fixedErrors, activeErrorId, diagPhase, onApplyFix, onErrorClick, onRunDiag, codeLines }: {
  errors: DiagError[]
  fixedErrors: Set<string>; activeErrorId: string | null
  diagPhase: DiagPhase
  onApplyFix: (id: string) => void; onErrorClick: (id: string) => void
  onRunDiag: () => void
  codeLines: CodeLine[]
}) {
  const unfixed = errors.filter(e => !fixedErrors.has(e.layerId))
  const conv2Fixed = fixedErrors.has('conv2')

  // AI streaming state
  const [aiErrId,    setAiErrId]    = useState<string | null>(null)
  const [aiPhase,    setAiPhase]    = useState<'thinking' | 'streaming' | 'done'>('thinking')
  const [streamText, setStreamText] = useState('')
  const streamRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Manual fix state
  const [manualErrId,  setManualErrId]  = useState<string | null>(null)
  const [manualFields, setManualFields] = useState<Record<string, string>>({})

  const stopStream = useCallback(() => {
    if (streamRef.current) clearTimeout(streamRef.current)
  }, [])

  useEffect(() => () => stopStream(), [stopStream])

  const startAi = useCallback((errorId: string) => {
    stopStream()
    setAiErrId(errorId); setAiPhase('thinking'); setStreamText('')
    setManualErrId(null)

    const dynErr = errors.find(e => e.id === errorId)
    const full = AI_RESPONSES[errorId] ?? (dynErr ? aiResponseFor(dynErr) : 'Analyzing issue…')
    let pos = 0
    streamRef.current = setTimeout(() => {
      setAiPhase('streaming')
      const tick = () => {
        pos = Math.min(pos + Math.floor(Math.random() * 4) + 2, full.length)
        setStreamText(full.slice(0, pos))
        if (pos < full.length) {
          streamRef.current = setTimeout(tick, 12 + Math.random() * 12)
        } else {
          setAiPhase('done')
        }
      }
      tick()
    }, 820)
  }, [stopStream])

  const openManual = useCallback((errorId: string) => {
    stopStream(); setAiErrId(null)
    setManualErrId(errorId)
    const def = MANUAL_FIX_DEFS[errorId]
    const init: Record<string, string> = {}
    def?.fields.forEach(f => { init[f.key] = '' })
    setManualFields(init)
  }, [stopStream])

  const applyAndReset = useCallback((errorId: string) => {
    stopStream()
    setAiErrId(null); setManualErrId(null); setStreamText('')
    onApplyFix(errorId)
  }, [onApplyFix, stopStream])

  const errorContextLines = codeLines.filter(l => l.layerId !== undefined || (l.dim && l.text.trim().startsWith('#   ↑')))

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
      className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

      {/* ── Run Diagnostics button ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <motion.button
          onClick={onRunDiag}
          disabled={diagPhase === 'scanning'}
          whileHover={diagPhase !== 'scanning' ? { background: 'rgba(195,245,255,0.12)', borderColor: '#c3f5ff' } : undefined}
          whileTap={diagPhase !== 'scanning' ? { scale: 0.97 } : undefined}
          style={{ flex: 1, padding: '8px 12px', background: 'rgba(195,245,255,0.06)', border: `1px solid ${diagPhase === 'scanning' ? '#3b494c' : '#c3f5ff55'}`, borderRadius: 3, cursor: diagPhase === 'scanning' ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: diagPhase === 'scanning' ? 0.6 : 1 }}>
          {diagPhase === 'scanning'
            ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="material-symbols-outlined" style={{ fontSize: 14, color: '#c3f5ff' }}>progress_activity</motion.span>
            : <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#c3f5ff' }}>biotech</span>}
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, color: '#c3f5ff', letterSpacing: '0.06em' }}>
            {diagPhase === 'scanning' ? 'Scanning…' : 'Run Diagnostics'}
          </span>
        </motion.button>
        <AnimatePresence mode="wait">
          {diagPhase === 'done' && (
            <motion.span key="done" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: unfixed.length > 0 ? '#ffb4ab' : '#baffa2', flexShrink: 0 }}>
              {unfixed.length > 0 ? `${unfixed.length} issue${unfixed.length > 1 ? 's' : ''} found` : 'clean'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Scanning animation ── */}
      {diagPhase === 'scanning' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(195,245,255,0.03)', border: '1px solid #1e3033', borderRadius: 3 }}>
          {['Parsing layer definitions…', 'Checking dimension flow…', 'Tracing forward() graph…', 'Validating connectivity…'].map((step, i) => (
            <motion.div key={step} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.35 }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'JetBrains Mono', fontSize: 9, color: '#5a7a80', marginBottom: 5 }}>
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                style={{ width: 4, height: 4, borderRadius: '50%', background: '#c3f5ff', flexShrink: 0 }} />
              {step}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Summary banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', background: unfixed.length > 0 ? 'rgba(255,70,70,0.05)' : 'rgba(186,255,162,0.05)', border: `1px solid ${unfixed.length > 0 ? '#ff707033' : '#baffa233'}`, borderRadius: 4, marginBottom: 14 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: unfixed.length > 0 ? '#ff9090' : '#baffa2' }}>
          {unfixed.length > 0 ? 'warning' : 'check_circle'}
        </span>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: unfixed.length > 0 ? '#ffb4ab' : '#baffa2' }}>
            {unfixed.length > 0 ? `${unfixed.length} issue${unfixed.length > 1 ? 's' : ''} detected` : diagPhase === 'idle' ? 'Run diagnostics to analyze' : 'All issues resolved'}
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#849396', marginTop: 1 }}>
            {unfixed.length > 0 ? 'Fix manually or ask AI to resolve' : diagPhase === 'idle' ? 'Click Run Diagnostics above' : 'Architecture is valid'}
          </div>
        </div>
      </div>

      {/* Error cards */}
      {errors.map(err => {
        const isFixed    = fixedErrors.has(err.layerId)
        const isActive   = activeErrorId === err.id
        const isAi       = aiErrId    === err.id
        const isManual   = manualErrId === err.id
        const errColor   = err.severity === 'error' ? '#ff7070' : '#ecb2ff'
        const manDef     = MANUAL_FIX_DEFS[err.id]

        return (
          <motion.div key={err.id}
            onClick={() => !isFixed && !isAi && !isManual && onErrorClick(err.id)}
            animate={{ borderColor: isFixed ? '#baffa244' : isActive ? '#ffb4ab88' : '#3b494c' }}
            transition={{ duration: 0.2 }}
            style={{ border: '1px solid', padding: '12px 13px', marginBottom: 12, borderRadius: 4, cursor: isFixed ? 'default' : 'pointer', background: isActive && !isFixed ? 'rgba(255,70,70,0.03)' : 'transparent' }}>

            {/* ── Card header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <motion.span animate={{ color: isFixed ? '#baffa2' : errColor }} className="material-symbols-outlined" style={{ fontSize: 14 }}>
                {isFixed ? 'check_circle' : err.severity === 'error' ? 'error' : 'warning'}
              </motion.span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 700, color: isFixed ? '#baffa2' : err.severity === 'error' ? '#ffb4ab' : '#ecb2ff', textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1 }}>
                {err.type}
              </span>
              {isFixed && <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#baffa2' }}>check</span>}
            </div>

            <p style={{ fontFamily: 'Inter', fontSize: 11, color: '#bac9cc', lineHeight: 1.55, marginBottom: 10 }}>
              {err.message}
            </p>

            {/* ── FIXED state ── */}
            {isFixed && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono', fontSize: 9, color: '#baffa2', padding: '5px 8px', background: 'rgba(186,255,162,0.06)', borderRadius: 3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>auto_fix_high</span>
                {err.fixDesc}
              </motion.div>
            )}

            {/* ── Action buttons (if not fixed and not in any mode) ── */}
            {!isFixed && !isAi && !isManual && (
              <div style={{ display: 'flex', gap: 6 }}>
                <motion.button
                  onClick={e => { e.stopPropagation(); openManual(err.id) }}
                  whileHover={{ background: 'rgba(195,245,255,0.12)', borderColor: '#c3f5ff' }} whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, padding: '6px 10px', background: 'rgba(195,245,255,0.05)', border: '1px solid #c3f5ff33', color: '#c3f5ff', fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>edit</span>
                  Fix Manually
                </motion.button>
                <motion.button
                  onClick={e => { e.stopPropagation(); startAi(err.id) }}
                  whileHover={{ background: 'rgba(186,255,162,0.12)', borderColor: '#baffa2' }} whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, padding: '6px 10px', background: 'rgba(186,255,162,0.05)', border: '1px solid #baffa233', color: '#baffa2', fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>smart_toy</span>
                  Ask AI
                </motion.button>
              </div>
            )}

            {/* ── MANUAL FIX panel ── */}
            <AnimatePresence>
              {isManual && !isFixed && (
                <motion.div key="manual"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={e => e.stopPropagation()}
                  style={{ marginTop: 10, padding: '10px 11px', background: '#0d1619', border: '1px solid #c3f5ff22', borderRadius: 4 }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#c3f5ff' }}>edit_note</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#c3f5ff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Manual Fix</span>
                    <button onClick={() => setManualErrId(null)}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#3b494c', padding: 0, display: 'flex' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>
                    </button>
                  </div>

                  {/* Editable fields */}
                  {manDef?.fields.map(field => (
                    <div key={field.key} style={{ marginBottom: 9 }}>
                      <label style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#5a7a80', display: 'block', marginBottom: 4 }}>
                        {field.label}  <span style={{ color: '#3b494c' }}>· currently: {field.currentVal}</span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          value={manualFields[field.key] ?? ''}
                          onChange={e => setManualFields(p => ({ ...p, [field.key]: e.target.value }))}
                          placeholder={field.hint}
                          style={{ flex: 1, background: '#111', border: '1px solid #3b494c', borderRadius: 3, padding: '5px 8px', fontFamily: 'JetBrains Mono', fontSize: 10, color: '#c3f5ff', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#3b494c', marginTop: 3 }}>{field.hint}</div>
                    </div>
                  ))}

                  {/* Preview */}
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#5a7a80', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Preview</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#00daf3', background: '#0a0a0a', border: '1px solid #1a2a2a', borderRadius: 2, padding: '5px 8px', marginBottom: 10 }}>
                    {manDef?.preview(manualFields) ?? err.fixDesc}
                  </div>

                  {/* Manual apply buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setManualErrId(null)}
                      style={{ flex: 1, padding: '5px', background: 'transparent', border: '1px solid #3b494c', borderRadius: 3, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396' }}>
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ background: '#c3f5ff', color: '#001f24' }} whileTap={{ scale: 0.97 }}
                      onClick={() => applyAndReset(err.id)}
                      style={{ flex: 1, padding: '5px', background: 'rgba(195,245,255,0.08)', border: '1px solid #c3f5ff44', borderRadius: 3, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, color: '#c3f5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>
                      Apply Fix
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── AI FIX panel ── */}
            <AnimatePresence>
              {isAi && !isFixed && (
                <motion.div key="ai"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={e => e.stopPropagation()}
                  style={{ marginTop: 10, background: '#080d0a', border: '1px solid #baffa222', borderRadius: 4, overflow: 'hidden' }}>

                  {/* AI panel header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', borderBottom: '1px solid #baffa214', background: '#060f09' }}>
                    <motion.span
                      animate={aiPhase !== 'done' ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                      transition={{ duration: 0.8, repeat: aiPhase !== 'done' ? Infinity : 0 }}
                      className="material-symbols-outlined" style={{ fontSize: 13, color: '#baffa2' }}>
                      smart_toy
                    </motion.span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 700, color: '#baffa2', textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1 }}>
                      {aiPhase === 'thinking' ? 'Analyzing issue…'
                        : aiPhase === 'streaming' ? 'Generating fix…'
                        : 'Fix ready'}
                    </span>
                    <button onClick={() => { stopStream(); setAiErrId(null) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b494c', padding: 0, display: 'flex' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>
                    </button>
                  </div>

                  {/* Thinking spinner */}
                  {aiPhase === 'thinking' && (
                    <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 9 }}>
                      <motion.div
                        animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 14, height: 14, border: '2px solid #baffa244', borderTop: '2px solid #baffa2', borderRadius: '50%' }} />
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#5a7a80' }}>Reading architecture graph…</span>
                    </div>
                  )}

                  {/* Streamed output */}
                  {(aiPhase === 'streaming' || aiPhase === 'done') && (
                    <div style={{ padding: '10px 12px', maxHeight: 220, overflowY: 'auto' }}>
                      <pre style={{ fontFamily: 'JetBrains Mono', fontSize: 8.5, color: '#7ab890', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.75, margin: 0 }}>
                        {streamText}
                        {aiPhase === 'streaming' && (
                          <motion.span
                            animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.5, repeat: Infinity }}
                            style={{ display: 'inline-block', width: 6, height: 11, background: '#baffa2', verticalAlign: 'middle', marginLeft: 1 }} />
                        )}
                      </pre>
                    </div>
                  )}

                  {/* AI apply / dismiss */}
                  {aiPhase === 'done' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                      style={{ padding: '8px 11px', borderTop: '1px solid #baffa214', display: 'flex', gap: 6 }}>
                      <button onClick={() => { stopStream(); setAiErrId(null) }}
                        style={{ flex: 1, padding: '5px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 3, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, color: '#849396' }}>
                        Dismiss
                      </button>
                      <motion.button
                        whileHover={{ background: '#baffa2', color: '#0e4a00' }} whileTap={{ scale: 0.97 }}
                        onClick={() => applyAndReset(err.id)}
                        style={{ flex: 2, padding: '5px 10px', background: 'rgba(186,255,162,0.1)', border: '1px solid #baffa244', borderRadius: 3, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, color: '#baffa2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>auto_fix_high</span>
                        Apply Suggested Fix
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )
      })}

      {/* Error context code */}
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, marginTop: 4 }}>
        Error context
      </div>
      <div style={{ background: '#0e0e0e', border: '1px solid #3b494c', padding: '9px 13px', borderRadius: 3 }}>
        {errorContextLines.map((line, i) => {
          const isErrLine   = line.error === true
          const displayText = isErrLine && conv2Fixed
            ? line.text.replace(/nn\.\w+\(.*?\)/, match => match.replace(/\(.*?\)/, '(64, 128, 3)') + '  # ✓ fixed')
            : line.text
          return (
            <div key={`${line.layerId ?? 'ctx'}-${i}`} style={{
              fontFamily: 'JetBrains Mono', fontSize: 10, lineHeight: 1.8,
              paddingLeft: isErrLine ? 8 : 0, marginLeft: isErrLine ? -8 : 0,
              paddingRight: isErrLine ? 8 : 0, marginRight: isErrLine ? -8 : 0,
              borderLeft: isErrLine ? `2px solid ${conv2Fixed ? '#baffa2' : '#ff7070'}` : '2px solid transparent',
              background: isErrLine ? (conv2Fixed ? 'rgba(186,255,162,0.06)' : 'rgba(255,70,70,0.07)') : 'transparent',
              color: isErrLine ? (conv2Fixed ? '#baffa2' : '#ff9090') : line.dim ? '#3a5558' : '#6a8c90',
            }}>
              {displayText}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

interface RightPanelProps {
  activeTab: ActiveTab; selectedId: string; optTarget: OptTarget
  fixedErrors: Set<string>; activeErrorId: string | null
  dynErrors: DiagError[]; diagPhase: DiagPhase
  layerMeta: Record<string, LayerMeta>; codeLines: CodeLine[]
  onTabChange: (t: ActiveTab) => void; onOptTargetChange: (t: OptTarget) => void
  onApplyFix: (id: string) => void; onErrorClick: (id: string) => void
  onCodeSync: (code: string) => void; onRunDiag: () => void
}

function RightPanel({ activeTab, selectedId, optTarget, fixedErrors, activeErrorId, dynErrors, diagPhase, layerMeta, codeLines, onTabChange, onOptTargetChange, onApplyFix, onErrorClick, onCodeSync, onRunDiag }: RightPanelProps) {
  const unfixedCount = dynErrors.filter(e => !fixedErrors.has(e.layerId)).length
  return (
    <motion.aside
      initial={{ x: 340, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}
      style={{ position: 'fixed', right: 0, top: 64, bottom: 48, width: 340, background: 'rgba(28,27,27,0.6)', backdropFilter: 'blur(20px)', borderLeft: '1px solid #3b494c', display: 'flex', flexDirection: 'column', zIndex: 40 }}
    >
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #3b494c', flexShrink: 0 }}>
        {TAB_CFG.map(tab => {
          const isActive = activeTab === tab.id
          const color    = TAB_COLORS[tab.id]
          return (
            <motion.button key={tab.id} onClick={() => onTabChange(tab.id)} whileTap={{ opacity: 0.7 }}
              style={{ flex: 1, padding: '10px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3, border: 'none', background: isActive ? color + '09' : 'transparent', borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent', cursor: 'pointer', position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: isActive ? color : '#849396' }}>{tab.icon}</span>
                {tab.id === 'diagnose' && unfixedCount > 0 && (
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                    style={{ position: 'absolute', top: -3, right: -5, width: 7, height: 7, borderRadius: '50%', background: '#ff7070', border: '1.5px solid #0e0e0e' }} />
                )}
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: isActive ? color : '#849396', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{tab.label}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {activeTab === 'inspect'  && <InspectPanel  key="inspect"  selectedId={selectedId} layerMeta={layerMeta} codeLines={codeLines} onCodeSync={onCodeSync} onRunDiag={onRunDiag} />}
          {activeTab === 'optimize' && <OptimizePanel key="optimize" optTarget={optTarget} onTargetChange={onOptTargetChange} />}
          {activeTab === 'diagnose' && <DiagnosePanel key="diagnose" errors={dynErrors} fixedErrors={fixedErrors} activeErrorId={activeErrorId} diagPhase={diagPhase} onApplyFix={onApplyFix} onErrorClick={onErrorClick} onRunDiag={onRunDiag} codeLines={codeLines} />}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const FOOTER_ACTIONS = [
  { icon: 'build',      label: 'Compile',  active: false },
  { icon: 'fact_check', label: 'Validate', active: true  },
  { icon: 'list_alt',   label: 'Logs',     active: false },
  { icon: 'terminal',   label: 'Terminal', active: false },
]

function Footer({ selectedId, errorCount }: { selectedId: string; errorCount: number }) {
  const meta = selectedId ? LAYER_META[selectedId] : null
  return (
    <motion.footer
      initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, delay: 0.15 }}
      style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 48, background: '#2a2a2a', borderTop: '1px solid #3b494c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', zIndex: 50 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: errorCount > 0 ? 0.7 : 2, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: errorCount > 0 ? '#ff7070' : '#2ae500' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: errorCount > 0 ? '#ffb4ab' : '#baffa2' }}>
            {errorCount > 0 ? `${errorCount} error${errorCount > 1 ? 's' : ''}` : 'Architecture Valid'}
          </span>
        </div>
        <div style={{ width: 1, height: 14, background: '#3b494c' }} />
        <AnimatePresence mode="wait">
          {meta && (
            <motion.div key={selectedId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#00daf3' }}>layers</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#00daf3' }}>{meta.title}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#849396' }}>
                {meta.shape === 'ERROR' ? '⚠ check diagnostics' : meta.shape}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {FOOTER_ACTIONS.map(action => (
          <motion.button key={action.label} whileHover={!action.active ? { color: '#e5e2e1' } : undefined} whileTap={{ opacity: 0.7 }}
            style={{ height: '100%', padding: '0 18px', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'JetBrains Mono', fontSize: 12, color: action.active ? '#79ff5b' : '#bac9cc', background: action.active ? 'rgba(121,255,91,0.06)' : 'transparent', borderBottom: action.active ? '2px solid #79ff5b' : '2px solid transparent', border: 'none', cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{action.icon}</span>
            {action.label}
          </motion.button>
        ))}
      </div>
    </motion.footer>
  )
}

// ─── Page Root ────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const [blocks,        setBlocks]        = useState<BlockDef[]>(BLOCKS_INIT)
  const [selectedId,    setSelectedId]    = useState('conv1')
  const [activeTab,     setActiveTab]     = useState<ActiveTab>('inspect')
  const [optTarget,     setOptTarget]     = useState<OptTarget>('cloud')
  const [fixedErrors,   setFixedErrors]   = useState<Set<string>>(new Set())
  const [activeErrorId, setActiveErrorId] = useState<string | null>(null)

  const [layerMeta,     setLayerMeta]     = useState<Record<string, LayerMeta>>({ ...LAYER_META })
  const [codeTextMap,   setCodeTextMap]   = useState<Record<string, string>>({ ...INIT_CODE_TEXT })

  const [dynErrors,     setDynErrors]     = useState<DiagError[]>(DIAG_ERRORS)
  const [diagPhase,     setDiagPhase]     = useState<DiagPhase>('idle')
  const diagTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [editingBlock,  setEditingBlock]  = useState<BlockDef | null>(null)
  const [editLabel,     setEditLabel]     = useState('')
  const [editSublabel,  setEditSublabel]  = useState('')
  const [trainingOpen,  setTrainingOpen]  = useState(false)

  const codeLines = useMemo(() => buildCodeLines(blocks, codeTextMap), [blocks, codeTextMap])

  const posRef = useRef<Record<string, Pos>>(
    Object.fromEntries(BLOCKS_INIT.map(b => [b.id, { x: b.initX, y: b.initY }]))
  )
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

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    if (!id) return
    const block = blocks.find(b => b.id === id)
    if (block?.hasError && !fixedErrors.has(id)) {
      setActiveTab('diagnose')
      const err = dynErrors.find(e => e.layerId === id)
      if (err) setActiveErrorId(err.id)
    } else {
      setActiveTab('inspect')
      setActiveErrorId(null)
    }
  }, [fixedErrors, blocks])

  const handleOpenEdit = useCallback((block: BlockDef) => {
    setEditLabel(block.label)
    setEditSublabel(block.sublabel ?? '')
    setEditingBlock(block)
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (!editingBlock) return
    const id = editingBlock.id
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, label: editLabel, sublabel: editSublabel } : b))
    setLayerMeta(prev => ({
      ...prev,
      [id]: { ...prev[id], title: editLabel },
    }))
    setCodeTextMap(prev => ({
      ...prev,
      [id]: `    self.${id} = nn.${editLabel}(${editSublabel})`,
    }))
    setEditingBlock(null)
  }, [editingBlock, editLabel, editSublabel])

  const handleCodeSync = useCallback((code: string) => {
    const parsed = parseCodeLayers(code)
    if (!parsed.length) return

    const existingMap = new Map(blocks.map(b => [b.id, b]))
    const newIds      = new Set(parsed.map(p => p.id))

    // Auto-x for new blocks: start after the rightmost current block
    let rightX = 60
    for (const p of Object.values(posRef.current)) rightX = Math.max(rightX, p.x + 200)

    const nextBlocks: BlockDef[] = parsed.map(p => {
      const ex = existingMap.get(p.id)
      if (ex) return { ...ex, label: p.label, sublabel: p.sublabel }
      const bx = rightX; rightX += 190
      return {
        id: p.id, label: p.label, sublabel: p.sublabel || undefined,
        initX: bx, initY: 155,
        depth: layerDepth(p.label),
        blockColor: layerColor(p.label),
        bw: 80, bh: 90,
      } as BlockDef
    })

    setBlocks(nextBlocks)

    // Register new block positions; remove deleted from posRef
    for (const b of nextBlocks)
      if (!posRef.current[b.id]) posRef.current[b.id] = { x: b.initX, y: b.initY }
    for (const id of Object.keys(posRef.current))
      if (!newIds.has(id)) delete posRef.current[id]

    // Sync layerMeta
    setLayerMeta(prev => {
      const next: Record<string, LayerMeta> = {}
      for (const b of nextBlocks)
        next[b.id] = prev[b.id]
          ? { ...prev[b.id], title: b.label }
          : { title: b.label, shape: '—', memory: '—', dtype: 'float32', lineId: b.id }
      return next
    })

    // Sync codeTextMap
    const nextCode: Record<string, string> = {}
    for (const p of parsed)
      nextCode[p.id] = `    self.${p.id} = nn.${p.label}(${p.sublabel})`
    setCodeTextMap(nextCode)

    // Clean up selection / error state for removed blocks
    if (selectedId && !newIds.has(selectedId)) setSelectedId('')
    if (activeErrorId) {
      const e = dynErrors.find(e2 => e2.id === activeErrorId)
      if (e && !newIds.has(e.layerId)) setActiveErrorId(null)
    }
    setDynErrors(prev => prev.filter(e => newIds.has(e.layerId)))
    setDiagPhase('idle')
    setFixedErrors(prev => new Set([...prev].filter(id => newIds.has(id))))
  }, [blocks, selectedId, activeErrorId, posRef])

  const handleDeleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
    setLayerMeta(prev => { const n = { ...prev }; delete n[id]; return n })
    setCodeTextMap(prev => { const n = { ...prev }; delete n[id]; return n })
    delete posRef.current[id]
    if (selectedId === id) setSelectedId('')
  }, [selectedId])

  const handleRunDiag = useCallback(() => {
    if (diagTimerRef.current) clearTimeout(diagTimerRef.current)
    setDiagPhase('scanning')
    setActiveTab('diagnose')
    diagTimerRef.current = setTimeout(() => {
      const found = diagnoseBlocks(blocks, fixedErrors)
      setDynErrors(found.length > 0 ? found : DIAG_ERRORS)
      setDiagPhase('done')
    }, 1900)
  }, [blocks, fixedErrors])

  const handleApplyFix = useCallback((errorId: string) => {
    const err = dynErrors.find(e => e.id === errorId)
    if (!err) return
    setFixedErrors(prev => new Set([...prev, err.layerId]))
    setActiveErrorId(null)
    setActiveTab('inspect')
    setSelectedId(err.layerId)
  }, [dynErrors])

  const handleErrorClick = useCallback((errorId: string) => {
    const err = dynErrors.find(e => e.id === errorId)
    if (!err) return
    setActiveErrorId(errorId)
    setSelectedId(err.layerId)
    setActiveTab('diagnose')
  }, [dynErrors])

  const unfixedErrors = dynErrors.filter(e => !fixedErrors.has(e.layerId))
  const unfixedCount  = unfixedErrors.length

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: '#0e0e0e', color: '#e5e2e1', fontFamily: 'Inter' }}>
      <Header activeTab={activeTab} errorCount={unfixedCount} />
      <LeftSidebar unfixedErrors={unfixedErrors} onErrorClick={handleErrorClick} onTabChange={setActiveTab} />
      <Canvas
        blocks={blocks}
        selectedId={selectedId} fixedErrors={fixedErrors}
        activeErrLayerId={activeErrorId ? dynErrors.find(e => e.id === activeErrorId)?.layerId ?? null : null}
        posRef={posRef} onSelect={handleSelect} onDragUpdate={handleDragUpdate}
        onEditBlock={handleOpenEdit} onDeleteBlock={handleDeleteBlock}
        onRunClick={() => setTrainingOpen(o => !o)} trainingOpen={trainingOpen}
      />
      <TrainingDrawer open={trainingOpen} blocks={blocks} onClose={() => setTrainingOpen(false)} />
      <RightPanel
        activeTab={activeTab} selectedId={selectedId} optTarget={optTarget}
        fixedErrors={fixedErrors} activeErrorId={activeErrorId}
        dynErrors={dynErrors} diagPhase={diagPhase}
        layerMeta={layerMeta} codeLines={codeLines}
        onTabChange={setActiveTab} onOptTargetChange={setOptTarget}
        onApplyFix={handleApplyFix} onErrorClick={handleErrorClick}
        onCodeSync={handleCodeSync} onRunDiag={handleRunDiag}
      />
      <Footer selectedId={selectedId} errorCount={unfixedCount} />

      {/* Edit Modal */}
      <AnimatePresence>
        {editingBlock && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setEditingBlock(null)}
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
                onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box', background: '#0e0e0e', border: '1px solid #3b494c', borderRadius: 4, padding: '8px 10px', fontFamily: 'JetBrains Mono', fontSize: 12, color: '#e5e2e1', outline: 'none', marginBottom: 14 }}
              />

              <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>Shape / Params</label>
              <input
                value={editSublabel}
                onChange={e => setEditSublabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                style={{ width: '100%', boxSizing: 'border-box', background: '#0e0e0e', border: '1px solid #3b494c', borderRadius: 4, padding: '8px 10px', fontFamily: 'JetBrains Mono', fontSize: 12, color: '#e5e2e1', outline: 'none', marginBottom: 20 }}
              />

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ background: '#2a2a2a' }}
                  onClick={() => setEditingBlock(null)}
                  style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #3b494c', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 11, color: '#bac9cc', cursor: 'pointer' }}
                >Cancel</motion.button>
                <motion.button
                  whileHover={{ background: 'rgba(0,218,243,0.2)' }}
                  onClick={handleSaveEdit}
                  style={{ padding: '7px 16px', background: 'rgba(0,218,243,0.08)', border: '1px solid #00daf3', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 11, color: '#c3f5ff', cursor: 'pointer' }}
                >Save</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
