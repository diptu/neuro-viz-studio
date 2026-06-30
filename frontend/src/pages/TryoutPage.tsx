import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

type OpId =
  | 'identity' | 'sharpen' | 'ridge' | 'sobelX' | 'sobelY' | 'sobelMag'
  | 'laplacian' | 'boxBlur' | 'gaussian' | 'emboss' | 'unsharp'
  | 'relu' | 'maxpool2' | 'custom'

interface Op {
  id: OpId; label: string; description: string
  type: 'conv' | 'activation' | 'pool'
  kernel?: number[][]; color: string; icon: string; group: string
}

interface Stats { min: number; max: number; mean: number; std: number }

// ─── Operations ───────────────────────────────────────────────────────────────

const OPS: Op[] = [
  {
    id: 'identity', label: 'Identity', group: 'Filters',
    type: 'conv', color: '#849396', icon: 'filter_none',
    description: 'Passthrough — output equals input. Center weight = 1, all others = 0.',
    kernel: [[0,0,0],[0,1,0],[0,0,0]],
  },
  {
    id: 'sharpen', label: 'Sharpen', group: 'Filters',
    type: 'conv', color: '#00daf3', icon: 'auto_awesome',
    description: 'Boosts the center pixel relative to its neighbors. Makes edges and fine details crisper and more pronounced.',
    kernel: [[-1,-1,-1],[-1,9,-1],[-1,-1,-1]],
  },
  {
    id: 'unsharp', label: 'Unsharp Mask', group: 'Filters',
    type: 'conv', color: '#c3f5ff', icon: 'adjust',
    description: 'Subtracts a fraction of a blurred image from the original. Accentuates mid-frequency detail.',
    kernel: [[-1/9,-1/9,-1/9],[-1/9,17/9,-1/9],[-1/9,-1/9,-1/9]],
  },
  {
    id: 'emboss', label: 'Emboss', group: 'Filters',
    type: 'conv', color: '#ff9090', icon: 'texture',
    description: 'Directional edge detection that creates a 3D embossed relief effect along the diagonal axis.',
    kernel: [[-2,-1,0],[-1,1,1],[0,1,2]],
  },
  {
    id: 'ridge', label: 'Ridge Detect', group: 'Edge Detection',
    type: 'conv', color: '#4a9eff', icon: 'timeline',
    description: 'Highlights ridges and outlines. Negative-sum Laplacian variant with a stronger central response.',
    kernel: [[-1,-1,-1],[-1,8,-1],[-1,-1,-1]],
  },
  {
    id: 'sobelX', label: 'Sobel X  (∂x)', group: 'Edge Detection',
    type: 'conv', color: '#ecb2ff', icon: 'swap_horiz',
    description: 'Horizontal gradient — responds to vertical edges where pixel intensity changes left-to-right.',
    kernel: [[-1,0,1],[-2,0,2],[-1,0,1]],
  },
  {
    id: 'sobelY', label: 'Sobel Y  (∂y)', group: 'Edge Detection',
    type: 'conv', color: '#ecb2ff', icon: 'swap_vert',
    description: 'Vertical gradient — responds to horizontal edges where pixel intensity changes top-to-bottom.',
    kernel: [[-1,-2,-1],[0,0,0],[1,2,1]],
  },
  {
    id: 'sobelMag', label: 'Sobel Magnitude', group: 'Edge Detection',
    type: 'conv', color: '#ffd166', icon: 'blur_circular',
    description: 'Combines ∂x and ∂y: √(Gx² + Gy²). Detects edges of any orientation simultaneously.',
    kernel: [],
  },
  {
    id: 'laplacian', label: 'Laplacian', group: 'Edge Detection',
    type: 'conv', color: '#ff8c69', icon: 'flare',
    description: 'Second-order derivative edge detector. Highly sensitive to sharp transitions and noise.',
    kernel: [[0,1,0],[1,-4,1],[0,1,0]],
  },
  {
    id: 'boxBlur', label: 'Box Blur 3×3', group: 'Smoothing',
    type: 'conv', color: '#baffa2', icon: 'blur_on',
    description: 'Replaces each pixel with the mean of its 3×3 neighborhood. Simple uniform low-pass filter.',
    kernel: [[1/9,1/9,1/9],[1/9,1/9,1/9],[1/9,1/9,1/9]],
  },
  {
    id: 'gaussian', label: 'Gaussian Blur', group: 'Smoothing',
    type: 'conv', color: '#baffa2', icon: 'gradient',
    description: 'Distance-weighted blur — center contributes more than edges. Smoother and more natural than box blur.',
    kernel: [[1/16,2/16,1/16],[2/16,4/16,2/16],[1/16,2/16,1/16]],
  },
  {
    id: 'relu', label: 'ReLU', group: 'Activation',
    type: 'activation', color: '#ff8c69', icon: 'bolt',
    description: 'max(0, x) — zeroes out negative pixel values. The standard non-linearity used after conv layers in CNNs.',
    kernel: [],
  },
  {
    id: 'maxpool2', label: 'Max Pool 2×2', group: 'Pooling',
    type: 'pool', color: '#ffb4ab', icon: 'grid_4x4',
    description: 'Takes the maximum value in each 2×2 window. Halves spatial resolution, preserving strong activations.',
    kernel: [],
  },
  {
    id: 'custom', label: 'Custom Kernel', group: 'Custom',
    type: 'conv', color: '#c3f5ff', icon: 'edit_note',
    description: 'Define your own 3×3 convolution kernel. Try extreme values, asymmetric layouts, or reproduce any filter above.',
    kernel: [[0,0,0],[0,1,0],[0,0,0]],
  },
]

const OP_GROUPS = ['Filters', 'Edge Detection', 'Smoothing', 'Activation', 'Pooling', 'Custom']

const NAV_LINKS = [
  { label: 'Models', to: '/' },
  { label: 'Canvas', to: '/canvas' },
  { label: 'Tryout', to: '/tryout' },
]

const PROC_SIZE = 280    // internal processing resolution (square)
const DISP_SIZE = 220    // canvas display size (px)
const PATCH_N   = 10     // NxN cells in matrix view

// ─── Image processing ─────────────────────────────────────────────────────────

function toGray(data: Uint8ClampedArray, w: number, h: number): Float32Array {
  const g = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++)
    g[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
  return g
}

function conv2dGray(src: Float32Array, w: number, h: number, k: number[][]): Float32Array {
  const kS = k.length, kH = Math.floor(kS / 2)
  const dst = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0
      for (let ky = 0; ky < kS; ky++) {
        for (let kx = 0; kx < kS; kx++) {
          const sy = Math.max(0, Math.min(h - 1, y + ky - kH))
          const sx = Math.max(0, Math.min(w - 1, x + kx - kH))
          sum += src[sy * w + sx] * k[ky][kx]
        }
      }
      dst[y * w + x] = sum
    }
  }
  return dst
}

function computeStats(arr: Float32Array): Stats {
  const n = arr.length
  let min = Infinity, max = -Infinity, sum = 0
  for (const v of arr) { if (v < min) min = v; if (v > max) max = v; sum += v }
  const mean = sum / n
  let vs = 0; for (const v of arr) vs += (v - mean) ** 2
  return {
    min:  +min.toFixed(1),
    max:  +max.toFixed(1),
    mean: +mean.toFixed(1),
    std:  +(Math.sqrt(vs / n)).toFixed(1),
  }
}

function grayToRGBA(gray: Float32Array, w: number, h: number, normalize: boolean): ImageData {
  let mn = 0, scale = 1
  if (normalize) {
    mn = Math.min(...gray)
    const mx = Math.max(...gray)
    scale = (mx - mn) || 1
  }
  const rgba = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    const v = normalize
      ? ((gray[i] - mn) / scale) * 255
      : Math.max(0, Math.min(255, gray[i]))
    rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = v
    rgba[i * 4 + 3] = 255
  }
  return new ImageData(rgba, w, h)
}

interface ApplyResult { result: Float32Array; outW: number; outH: number; normalized: boolean }

function applyOp(gray: Float32Array, w: number, h: number, op: Op, ck: number[][]): ApplyResult {
  if (op.type === 'activation') {
    return { result: gray.map(v => Math.max(0, v)), outW: w, outH: h, normalized: false }
  }
  if (op.id === 'maxpool2') {
    const ow = Math.floor(w / 2), oh = Math.floor(h / 2)
    const dst = new Float32Array(ow * oh)
    for (let y = 0; y < oh; y++)
      for (let x = 0; x < ow; x++)
        dst[y * ow + x] = Math.max(
          gray[y * 2 * w + x * 2], gray[y * 2 * w + x * 2 + 1],
          gray[(y * 2 + 1) * w + x * 2], gray[(y * 2 + 1) * w + x * 2 + 1],
        )
    return { result: dst, outW: ow, outH: oh, normalized: false }
  }
  if (op.id === 'sobelMag') {
    const gx = conv2dGray(gray, w, h, [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]])
    const gy = conv2dGray(gray, w, h, [[-1, -2, -1], [0, 0, 0], [1, 2, 1]])
    const mag = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++) mag[i] = Math.sqrt(gx[i] ** 2 + gy[i] ** 2)
    return { result: mag, outW: w, outH: h, normalized: true }
  }
  const kernel = op.id === 'custom' ? ck : (op.kernel ?? [[0, 0, 0], [0, 1, 0], [0, 0, 0]])
  if (!kernel.length) return { result: gray.slice(), outW: w, outH: h, normalized: false }
  const result = conv2dGray(gray, w, h, kernel)
  const needsNorm = !['identity', 'boxBlur', 'gaussian'].includes(op.id)
  return { result, outW: w, outH: h, normalized: needsNorm }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KernelGrid({ kernel }: { kernel: number[][] }) {
  const flat = kernel.flat()
  const amax = Math.max(Math.abs(Math.min(...flat)), Math.abs(Math.max(...flat))) || 1
  return (
    <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${kernel[0].length}, 1fr)`, gap: 2 }}>
      {kernel.map((row, ry) => row.map((v, cx) => {
        const t = v / amax
        const R = t < 0 ? Math.round(-t * 210) : 0
        const G = t > 0 ? Math.round(t * 210) : 0
        const B = Math.round((1 - Math.abs(t)) * 50)
        return (
          <div key={`${ry}-${cx}`} style={{
            width: 38, height: 30,
            background: `rgb(${R},${G},${B})`,
            border: '1px solid #0a0a0a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 600,
            color: Math.abs(t) > 0.35 ? '#fff' : '#6a9396',
            borderRadius: 2,
          }}>
            {v % 1 === 0 ? v : +v.toFixed(3)}
          </div>
        )
      }))}
    </div>
  )
}

function MatrixPatch({
  data, dataW, patchX, patchY, accentColor,
}: {
  data: Float32Array | null; dataW: number; patchX: number; patchY: number; accentColor?: string
}) {
  if (!data) return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PATCH_N}, 1fr)`, gap: 1 }}>
      {Array.from({ length: PATCH_N * PATCH_N }, (_, i) => (
        <div key={i} style={{ aspectRatio: '1', background: '#0d0d0d', border: '0.5px solid #181818', borderRadius: 1 }} />
      ))}
    </div>
  )

  const patch: number[] = []
  for (let r = 0; r < PATCH_N; r++)
    for (let c = 0; c < PATCH_N; c++) {
      const idx = (patchY + r) * dataW + (patchX + c)
      patch.push(idx < data.length ? data[idx] : 0)
    }

  const pmin = Math.min(...patch), pmax = Math.max(...patch), prng = (pmax - pmin) || 1

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${PATCH_N}, 1fr)`, gap: 1,
      border: accentColor ? `1px solid ${accentColor}20` : 'none',
      borderRadius: 3, padding: accentColor ? 2 : 0,
    }}>
      {patch.map((v, i) => {
        const t = (v - pmin) / prng
        const lum = Math.round(t * 240)
        const dispVal = Math.abs(v) >= 1000 ? Math.round(v)
                      : Math.abs(v) >= 100  ? Math.round(v)
                      : v.toFixed(1)
        return (
          <div key={i} style={{
            aspectRatio: '1',
            background: `rgb(${lum},${lum},${lum})`,
            border: '0.5px solid rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'JetBrains Mono', fontSize: 5.2, fontWeight: 700,
            color: lum > 115 ? '#000' : '#fff',
            borderRadius: 1, lineHeight: 1, overflow: 'hidden',
          }}>
            {dispVal}
          </div>
        )
      })}
    </div>
  )
}

function DisplayCanvas({
  gray, w, h, normalize, label, dim,
}: {
  gray: Float32Array | null; w: number; h: number
  normalize: boolean; label: string; dim?: boolean
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current; if (!cv || !gray) return
    cv.width = w; cv.height = h
    cv.getContext('2d')!.putImageData(grayToRGBA(gray, w, h, normalize), 0, 0)
  }, [gray, w, h, normalize])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#849396', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {label}
      </div>
      <div style={{
        width: DISP_SIZE, height: DISP_SIZE,
        background: '#0a0a0a',
        border: `1px solid ${dim ? '#1a1a1a' : '#2a3a3c'}`,
        borderRadius: 4, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: dim ? 0.4 : 1,
      }}>
        {gray
          ? <canvas ref={ref} style={{ width: DISP_SIZE, height: DISP_SIZE, imageRendering: 'pixelated', display: 'block' }} />
          : <span className="material-symbols-outlined" style={{ fontSize: 34, color: '#222' }}>image</span>}
      </div>
      {gray && (
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#3b494c' }}>
          {w} × {h} px
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TryoutPage() {
  const { pathname } = useLocation()

  const [srcGray,     setSrcGray]     = useState<Float32Array | null>(null)
  const [srcW,        setSrcW]        = useState(PROC_SIZE)
  const [srcH,        setSrcH]        = useState(PROC_SIZE)
  const [imgName,     setImgName]     = useState('')
  const [outGray,     setOutGray]     = useState<Float32Array | null>(null)
  const [outW,        setOutW]        = useState(PROC_SIZE)
  const [outH,        setOutH]        = useState(PROC_SIZE)
  const [outNorm,     setOutNorm]     = useState(true)
  const [selectedOp,  setSelectedOp]  = useState<OpId>('sharpen')
  const [matrixTab,   setMatrixTab]   = useState<'input' | 'output'>('output')
  const [patchX,      setPatchX]      = useState(0)
  const [patchY,      setPatchY]      = useState(0)
  const [isDragging,  setIsDragging]  = useState(false)
  const [customKernel,setCustomKernel]= useState<number[][]>([[0,0,0],[0,1,0],[0,0,0]])
  const [customRaw,   setCustomRaw]   = useState<string[][]>([['0','0','0'],['0','1','0'],['0','0','0']])
  const [inputStats,  setInputStats]  = useState<Stats | null>(null)
  const [outputStats, setOutputStats] = useState<Stats | null>(null)

  const hiddenCvRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const op = OPS.find(o => o.id === selectedOp)!

  const runOp = useCallback((
    gray: Float32Array, w: number, h: number, opId: OpId, ck: number[][]
  ) => {
    const theOp = OPS.find(o => o.id === opId)!
    const { result, outW: ow, outH: oh, normalized } = applyOp(gray, w, h, theOp, ck)
    setOutGray(result); setOutW(ow); setOutH(oh); setOutNorm(normalized)
    setOutputStats(computeStats(result))
    setPatchX(0); setPatchY(0)
  }, [])

  useEffect(() => {
    if (srcGray) runOp(srcGray, srcW, srcH, selectedOp, customKernel)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOp, customKernel])

  const ingestGray = useCallback((gray: Float32Array, name: string) => {
    setSrcGray(gray); setSrcW(PROC_SIZE); setSrcH(PROC_SIZE)
    setImgName(name)
    setInputStats(computeStats(gray))
    const cx = Math.floor(PROC_SIZE / 2 - PATCH_N / 2)
    setPatchX(cx); setPatchY(cx)
    runOp(gray, PROC_SIZE, PROC_SIZE, selectedOp, customKernel)
  }, [selectedOp, customKernel, runOp])

  const loadFile = useCallback((file: File) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const cv = hiddenCvRef.current!
      cv.width = PROC_SIZE; cv.height = PROC_SIZE
      const ctx = cv.getContext('2d')!
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, PROC_SIZE, PROC_SIZE)
      const sc = Math.min(PROC_SIZE / img.width, PROC_SIZE / img.height)
      const dw = img.width * sc, dh = img.height * sc
      ctx.drawImage(img, (PROC_SIZE - dw) / 2, (PROC_SIZE - dh) / 2, dw, dh)
      const gray = toGray(ctx.getImageData(0, 0, PROC_SIZE, PROC_SIZE).data, PROC_SIZE, PROC_SIZE)
      ingestGray(gray, file.name)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [ingestGray])

  const loadSample = useCallback((type: 'gradient' | 'checkerboard' | 'circles' | 'noise') => {
    const cv = hiddenCvRef.current!
    cv.width = PROC_SIZE; cv.height = PROC_SIZE
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, PROC_SIZE, PROC_SIZE)

    if (type === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, PROC_SIZE, PROC_SIZE)
      g.addColorStop(0, '#000'); g.addColorStop(0.5, '#888'); g.addColorStop(1, '#fff')
      ctx.fillStyle = g; ctx.fillRect(0, 0, PROC_SIZE, PROC_SIZE)
    } else if (type === 'checkerboard') {
      const sz = 28
      for (let y = 0; y < PROC_SIZE; y += sz)
        for (let x = 0; x < PROC_SIZE; x += sz) {
          ctx.fillStyle = (Math.floor(x / sz) + Math.floor(y / sz)) % 2 ? '#e0e0e0' : '#1e1e1e'
          ctx.fillRect(x, y, sz, sz)
        }
    } else if (type === 'circles') {
      const [cx, cy] = [PROC_SIZE / 2, PROC_SIZE / 2]
      for (let r = 120; r > 6; r -= 18) {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = `hsl(0,0%,${Math.round((r / 120) * 75)}%)`; ctx.fill()
      }
    } else {
      const id = ctx.createImageData(PROC_SIZE, PROC_SIZE)
      for (let i = 0; i < id.data.length; i += 4) {
        const v = Math.round(Math.random() * 255)
        id.data[i] = id.data[i+1] = id.data[i+2] = v; id.data[i+3] = 255
      }
      ctx.putImageData(id, 0, 0)
    }

    const gray = toGray(ctx.getImageData(0, 0, PROC_SIZE, PROC_SIZE).data, PROC_SIZE, PROC_SIZE)
    ingestGray(gray, `sample: ${type}`)
  }, [ingestGray])

  const handleCustomCell = (r: number, c: number, val: string) => {
    const next = customRaw.map(row => [...row])
    next[r][c] = val
    setCustomRaw(next)
    setCustomKernel(next.map(row => row.map(v => parseFloat(v) || 0)))
  }

  // Determine safe patch bounds
  const activeH = matrixTab === 'input' ? srcH : outH
  const activeW = matrixTab === 'input' ? srcW : outW
  const safePX  = Math.min(patchX, Math.max(0, activeW - PATCH_N))
  const safePY  = Math.min(patchY, Math.max(0, activeH - PATCH_N))

  const movePatch = (dx: number, dy: number) => {
    setPatchX(x => Math.max(0, Math.min(Math.max(0, activeW - PATCH_N), x + dx)))
    setPatchY(y => Math.max(0, Math.min(Math.max(0, activeH - PATCH_N), y + dy)))
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0e1112', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <canvas ref={hiddenCvRef} style={{ display: 'none' }} />
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />

      {/* ── Header ── */}
      <header style={{
        height: 52, flexShrink: 0, display: 'flex', alignItems: 'center',
        padding: '0 20px', borderBottom: '1px solid #1a2426',
        background: '#0b0d0e', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00daf3' }}>science</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, color: '#bac9cc', letterSpacing: '0.06em' }}>
            DEEPPRISM  <span style={{ color: '#2a3a3c' }}>·</span>  Image Ops Lab
          </span>
        </div>
        <nav style={{ display: 'flex', gap: 2 }}>
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to} style={{
              fontFamily: 'JetBrains Mono', fontSize: 9, textDecoration: 'none',
              color: pathname === l.to ? '#00daf3' : '#5a7a80',
              padding: '4px 10px', borderRadius: 3,
              background: pathname === l.to ? 'rgba(0,218,243,0.07)' : 'transparent',
            }}>
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ─ Left panel: controls ─ */}
        <div style={{
          width: 242, flexShrink: 0, borderRight: '1px solid #1a2426',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0b0d0e',
        }}>
          {/* Upload */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a2426', flexShrink: 0 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#5a7a80', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Image Source
            </div>
            <motion.div
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) loadFile(f) }}
              onClick={() => fileInputRef.current?.click()}
              animate={{ borderColor: isDragging ? '#00daf3' : '#2a3a3c', background: isDragging ? 'rgba(0,218,243,0.04)' : '#0e1112' }}
              style={{ border: '1px dashed #2a3a3c', borderRadius: 4, padding: '10px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: isDragging ? '#00daf3' : '#3b494c', flexShrink: 0 }}>upload_file</span>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8.5, color: isDragging ? '#00daf3' : '#849396' }}>
                  {imgName || 'Upload image'}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#3b494c', marginTop: 2 }}>
                  PNG · JPG · WEBP  ·  drag or click
                </div>
              </div>
            </motion.div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#3b494c', marginBottom: 5 }}>Or try a sample:</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(['gradient', 'checkerboard', 'circles', 'noise'] as const).map(s => (
                <motion.button key={s} whileHover={{ background: '#1a2426', color: '#bac9cc' }} whileTap={{ scale: 0.95 }}
                  onClick={() => loadSample(s)}
                  style={{ padding: '3px 7px', background: 'transparent', border: '1px solid #2a3a3c', borderRadius: 3, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 8, color: '#5a7a80' }}>
                  {s}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Operation list */}
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {OP_GROUPS.map(grp => {
              const ops = OPS.filter(o => o.group === grp)
              return (
                <div key={grp}>
                  <div style={{ padding: '6px 14px 2px', fontFamily: 'JetBrains Mono', fontSize: 7, color: '#2a3a3c', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {grp}
                  </div>
                  {ops.map(o => (
                    <motion.button key={o.id}
                      onClick={() => setSelectedOp(o.id)}
                      whileHover={{ background: '#111820' }}
                      style={{
                        width: '100%', padding: '7px 14px', background: selectedOp === o.id ? '#0f1f22' : 'transparent',
                        border: 'none', borderLeft: `2px solid ${selectedOp === o.id ? o.color : 'transparent'}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: selectedOp === o.id ? o.color : '#3b494c', flexShrink: 0 }}>
                        {o.icon}
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: selectedOp === o.id ? o.color : '#849396', fontWeight: selectedOp === o.id ? 700 : 400 }}>
                        {o.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Kernel display / custom editor */}
          <div style={{ borderTop: '1px solid #1a2426', padding: '10px 14px', flexShrink: 0, background: '#0d0f10' }}>
            {op.id === 'custom' ? (
              <>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#5a7a80', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  Custom 3×3 Kernel
                </div>
                <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                  {customRaw.map((row, ry) => row.map((v, cx) => (
                    <input key={`${ry}-${cx}`} value={v}
                      onChange={e => handleCustomCell(ry, cx, e.target.value)}
                      style={{
                        width: 50, height: 30, background: '#111', border: '1px solid #2a3a3c',
                        borderRadius: 2, color: '#c3f5ff', fontFamily: 'JetBrains Mono', fontSize: 9,
                        textAlign: 'center', outline: 'none',
                      }} />
                  )))}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#2a3a3c', marginTop: 6 }}>
                  Decimals OK · negatives for edge detection
                </div>
              </>
            ) : op.kernel && op.kernel.length > 0 ? (
              <>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#5a7a80', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  Kernel  <span style={{ color: '#3b494c', textTransform: 'none', fontWeight: 400 }}>{op.kernel.length}×{op.kernel[0].length}</span>
                </div>
                <KernelGrid kernel={op.kernel} />
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#2a3a3c', marginTop: 6 }}>
                  <span style={{ color: '#3a6000' }}>■</span> positive · <span style={{ color: '#6a0000' }}>■</span> negative
                </div>
              </>
            ) : (
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#3b494c', lineHeight: 1.6 }}>
                {op.id === 'sobelMag' ? 'Gx² + Gy² combined — no single kernel' : `No kernel — ${op.type} operation`}
              </div>
            )}
          </div>
        </div>

        {/* ─ Center: image comparison ─ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '16px 0', overflow: 'hidden', minWidth: 0 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <DisplayCanvas gray={srcGray} w={srcW} h={srcH} normalize={false} label="Input" dim={!srcGray} />

            {/* Arrow + label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <motion.div
                animate={srcGray ? { opacity: [0.45, 1, 0.45] } : { opacity: 0.15 }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: op.color }}>arrow_right_alt</span>
              </motion.div>
              <div style={{
                padding: '3px 9px',
                background: `${op.color}12`,
                border: `1px solid ${op.color}38`,
                borderRadius: 12,
                fontFamily: 'JetBrains Mono', fontSize: 8, color: op.color, whiteSpace: 'nowrap',
              }}>
                {op.label}
              </div>
            </div>

            <DisplayCanvas gray={outGray} w={outW} h={outH} normalize={outNorm} label="Output" dim={!outGray} />
          </div>

          {/* Op description */}
          <div style={{ maxWidth: 540, textAlign: 'center', padding: '0 20px' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#5a7a80', lineHeight: 1.75 }}>
              {op.description}
            </div>
            {op.type === 'conv' && op.kernel && op.kernel.length > 0 && (
              <div style={{ marginTop: 7, fontFamily: 'JetBrains Mono', fontSize: 7.5, color: '#3b494c', lineHeight: 1.6 }}>
                Output(x,y) = Σᵢ Σⱼ  Input(x+i, y+j) · Kernel(i,j)
                <span style={{ marginLeft: 8, color: '#2a2a2a' }}>· replicate border padding</span>
              </div>
            )}
          </div>

          {/* Stats bar */}
          {inputStats && outputStats && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', padding: '0 12px' }}>
              {([
                { label: 'IN min',    val: inputStats.min,    col: '#849396' },
                { label: 'IN max',    val: inputStats.max,    col: '#849396' },
                { label: 'OUT min',   val: outputStats.min,   col: op.color  },
                { label: 'OUT max',   val: outputStats.max,   col: op.color  },
                { label: 'OUT mean',  val: outputStats.mean,  col: op.color  },
                { label: 'OUT σ',     val: outputStats.std,   col: op.color  },
              ] as const).map(s => (
                <div key={s.label} style={{
                  padding: '4px 9px', background: '#0d1112', border: '1px solid #1a2426', borderRadius: 3,
                  display: 'flex', gap: 6, alignItems: 'center',
                }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#3b494c', textTransform: 'uppercase' }}>{s.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, color: s.col }}>{s.val}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Empty state hint */}
          {!srcGray && (
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#2a3a3c', textAlign: 'center' }}>
              Upload an image or pick a sample → select an operation → see the result
            </div>
          )}
        </div>

        {/* ─ Right panel: matrix view ─ */}
        <div style={{
          width: 292, flexShrink: 0, borderLeft: '1px solid #1a2426',
          display: 'flex', flexDirection: 'column', background: '#0b0d0e', overflow: 'hidden',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1a2426', flexShrink: 0 }}>
            {(['input', 'output'] as const).map(tab => (
              <button key={tab} onClick={() => setMatrixTab(tab)} style={{
                flex: 1, height: 34, background: matrixTab === tab ? '#0f1f22' : 'transparent',
                border: 'none', borderBottom: `2px solid ${matrixTab === tab ? op.color : 'transparent'}`,
                cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 700,
                color: matrixTab === tab ? op.color : '#3b494c',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {tab} matrix
              </button>
            ))}
          </div>

          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
            {/* Patch header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#3b494c' }}>
                {PATCH_N}×{PATCH_N}  ·  origin ({safePX}, {safePY})
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#2a3a3c' }}>
                {activeW}×{activeH}
              </div>
            </div>

            {/* Matrix grid */}
            <AnimatePresence mode="wait">
              <motion.div key={`${matrixTab}-${patchX}-${patchY}-${selectedOp}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}>
                <MatrixPatch
                  data={matrixTab === 'input' ? srcGray : outGray}
                  dataW={matrixTab === 'input' ? srcW : outW}
                  patchX={safePX} patchY={safePY}
                  accentColor={matrixTab === 'output' ? op.color : undefined}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
              {([
                { icon: 'keyboard_arrow_left',  dx: -PATCH_N, dy: 0 },
                { icon: 'keyboard_arrow_up',    dx: 0, dy: -PATCH_N },
                { icon: 'keyboard_arrow_down',  dx: 0, dy:  PATCH_N },
                { icon: 'keyboard_arrow_right', dx:  PATCH_N, dy: 0 },
              ]).map(b => (
                <motion.button key={b.icon} whileHover={{ background: '#1a2426' }} whileTap={{ scale: 0.88 }}
                  onClick={() => movePatch(b.dx, b.dy)}
                  style={{ width: 26, height: 26, background: '#111', border: '1px solid #1a2426', borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a7a80' }}>{b.icon}</span>
                </motion.button>
              ))}
              <motion.button whileHover={{ background: '#1a2426' }} whileTap={{ scale: 0.9 }}
                onClick={() => { setPatchX(Math.floor(activeW / 2 - PATCH_N / 2)); setPatchY(Math.floor(activeH / 2 - PATCH_N / 2)) }}
                style={{ padding: '0 9px', height: 26, background: '#111', border: '1px solid #1a2426', borderRadius: 3, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 7, color: '#5a7a80' }}>
                center
              </motion.button>
              <motion.button whileHover={{ background: '#1a2426' }} whileTap={{ scale: 0.9 }}
                onClick={() => { setPatchX(0); setPatchY(0) }}
                style={{ padding: '0 9px', height: 26, background: '#111', border: '1px solid #1a2426', borderRadius: 3, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 7, color: '#5a7a80' }}>
                origin
              </motion.button>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 6.5, color: '#252f30', textAlign: 'center', marginTop: 3 }}>
              navigate patch by {PATCH_N} px
            </div>

            {/* Stats */}
            {(matrixTab === 'input' ? inputStats : outputStats) && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7.5, color: '#3b494c', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>
                  {matrixTab} full-image statistics
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {([
                    { label: 'min',   val: (matrixTab === 'input' ? inputStats  : outputStats)!.min  },
                    { label: 'max',   val: (matrixTab === 'input' ? inputStats  : outputStats)!.max  },
                    { label: 'mean',  val: (matrixTab === 'input' ? inputStats  : outputStats)!.mean },
                    { label: 'σ std', val: (matrixTab === 'input' ? inputStats  : outputStats)!.std  },
                  ]).map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#0d0f10', border: '1px solid #181818', borderRadius: 2 }}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 7.5, color: '#3b494c', textTransform: 'uppercase' }}>{s.label}</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: matrixTab === 'output' ? op.color : '#849396' }}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Color legend */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7.5, color: '#3b494c', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Color encoding (patch-local)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#5a7a80', width: 24 }}>low</span>
                <div style={{ flex: 1, height: 8, borderRadius: 2, background: 'linear-gradient(to right,#000,#fff)', border: '1px solid #1a1a1a' }} />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#5a7a80', width: 24, textAlign: 'right' }}>high</span>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#252f30', lineHeight: 1.55 }}>
                Each cell shows the <span style={{ color: '#3b494c' }}>raw value</span> (not clamped to 0–255). Edge filters can produce negatives. Image display uses min-max normalization.
              </div>
            </div>

            {/* Explanation callout for negative values */}
            {outputStats && outputStats.min < 0 && matrixTab === 'output' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12, padding: '8px 10px', background: '#160f00', border: '1px solid #ffd16620', borderRadius: 3 }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7.5, color: '#ffd166', marginBottom: 3 }}>⚠ Negative values present</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#6a5a3c', lineHeight: 1.5 }}>
                  This filter produces values below zero (min = {outputStats.min}). In a real CNN these would be zeroed by ReLU before the next layer. The image view normalizes for display.
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        height: 34, flexShrink: 0, borderTop: '1px solid #1a2426',
        display: 'flex', alignItems: 'center', padding: '0 16px',
        background: '#0b0d0e', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7.5, color: '#2a3a3c' }}>
          DeepPrism · Image Ops Lab · grayscale pipeline · {PROC_SIZE}×{PROC_SIZE} internal
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 7.5, color: '#3b494c' }}>
          {op.type === 'conv' && op.kernel?.length
            ? `${op.kernel.length}×${op.kernel[0].length} conv`
            : op.type === 'activation' ? 'element-wise activation'
            : op.type === 'pool' ? 'spatial downsampling'
            : ''}
          {outGray && outW !== PROC_SIZE && (
            <span style={{ marginLeft: 10, color: '#2a2a2a' }}>→ {outW}×{outH} output</span>
          )}
        </div>
      </footer>
    </div>
  )
}
