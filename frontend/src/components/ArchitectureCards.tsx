import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'


function ResNetPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', position: 'relative', width: '100%' }}>
      {(['CONV 1×1, S2', 'CONV 3×3, S1'] as const).map(label => (
        <div key={label} style={{ width: 128, padding: '10px 0', border: '1px solid #c3f5ff', color: '#c3f5ff', fontFamily: 'JetBrains Mono', fontSize: 10, textAlign: 'center', borderRadius: 4, position: 'relative' }}>
          <div className="node-port" style={{ left: -4, color: '#c3f5ff' }} />
          <div className="node-port" style={{ right: -4, color: '#c3f5ff' }} />
          {label}
        </div>
      ))}
      <div style={{ width: 1, height: 24, background: '#3b494c', marginTop: -8 }} />
      <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', overflow: 'visible', pointerEvents: 'none' }} width="192" height="128">
        <path d="M 0 16 L -40 16 L -40 112 L 0 112" fill="none" stroke="#849396" strokeDasharray="4 4" strokeWidth="1" />
        <circle cx="-40" cy="64" r="3" fill="#849396" />
      </svg>
    </div>
  )
}

function TransformerPreview() {
  const layers = [
    { label: 'MULTI-HEAD ATTN', color: '#ecb2ff' },
    { label: 'ADD & NORM', color: '#849396' },
    { label: 'FEED FORWARD', color: '#ecb2ff' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', width: '100%' }}>
      {layers.map((l, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: i < layers.length - 1 ? 0 : 0 }}>
          <div style={{ width: 144, padding: '8px 0', border: `1px solid ${l.color}`, color: l.color, fontFamily: 'JetBrains Mono', fontSize: 10, textAlign: 'center', borderRadius: 4, position: 'relative' }}>
            {l.color === '#ecb2ff' && <><div className="node-port" style={{ left: -4, color: l.color }} /><div className="node-port" style={{ right: -4, color: l.color }} /></>}
            {l.label}
          </div>
          {i < layers.length - 1 && <div style={{ width: 1, height: 16, background: '#3b494c' }} />}
        </div>
      ))}
    </div>
  )
}

function LeNetPreview() {
  const stages = [
    { label: 'C1', sub: '5×5', w: 38, color: '#00daf3' },
    { label: 'P1', sub: '2×2', w: 28, color: '#c3f5ff' },
    { label: 'C2', sub: '5×5', w: 22, color: '#00daf3' },
    { label: 'P2', sub: '2×2', w: 14, color: '#c3f5ff' },
    { label: 'FC', sub: '120', w: 36, color: '#ecb2ff' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {stages.map((s, i) => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: s.w, height: s.w, border: `1.5px solid ${s.color}`, borderRadius: 2, background: s.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 700, color: s.color }}>{s.label}</span>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: '#849396' }}>{s.sub}</span>
          </div>
          {i < stages.length - 1 && (
            <div style={{ width: 14, height: 1, background: '#3b494c', flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  )
}

function UNetPreview() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 64, height: 32, border: '1px solid #baffa2', borderRadius: 4, opacity: 0.5 }} />
        <div style={{ width: 48, height: 32, border: '1px solid #baffa2', borderRadius: 4, margin: '0 auto' }} />
      </div>
      <span className="material-symbols-outlined" style={{ color: '#3b494c' }}>keyboard_double_arrow_right</span>
      <div style={{ width: 80, height: 48, border: '2px solid #baffa2', background: 'rgba(186,255,162,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono', fontSize: 9, color: '#baffa2', borderRadius: 4 }}>
        LATENT
      </div>
      <span className="material-symbols-outlined" style={{ color: '#3b494c' }}>keyboard_double_arrow_right</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 48, height: 32, border: '1px solid #baffa2', borderRadius: 4, margin: '0 auto' }} />
        <div style={{ width: 64, height: 32, border: '1px solid #baffa2', borderRadius: 4, opacity: 0.5 }} />
      </div>
    </div>
  )
}

const CARDS = [
  {
    id: 'lenet',
    accentColor: '#00daf3',
    tags: [{ label: 'Tutorial', color: '#00daf3' }, { label: 'Classic CNN', color: '#bac9cc' }],
    title: 'LeNet-5',
    description: 'The pioneering convolutional network by LeCun et al. (1998). Two conv+pool stages followed by fully-connected layers — an ideal first architecture to explore with DeepPrism.',
    preview: <LeNetPreview />,
    btnBg: '#00daf3', btnText: '#00363d',
  },
  {
    id: 'resnet',
    accentColor: '#c3f5ff',
    tags: [{ label: 'Convolutional', color: '#c3f5ff' }, { label: 'Residual', color: '#bac9cc' }],
    title: 'ResNet-50 Block',
    description: 'A classic bottleneck residual block featuring 1×1, 3×3, and 1×1 convolutions. Designed to mitigate the vanishing gradient problem in deep networks.',
    preview: <ResNetPreview />,
    btnBg: '#00e5ff', btnText: '#00626e',
  },
  {
    id: 'transformer',
    accentColor: '#ecb2ff',
    tags: [{ label: 'Attention', color: '#ecb2ff' }, { label: 'Sequence', color: '#bac9cc' }],
    title: 'Simple Transformer',
    description: 'Standard encoder block with multi-head self-attention and position-wise feed-forward layers. Optimized for NLP and vision transformer tasks.',
    preview: <TransformerPreview />,
    btnBg: '#cf5cff', btnText: '#480063',
  },
  {
    id: 'unet',
    accentColor: '#baffa2',
    tags: [{ label: 'Segmentation', color: '#baffa2' }, { label: 'Encoder-Decoder', color: '#bac9cc' }],
    title: 'U-Net Bottleneck',
    description: 'The bridge between contracting and expansive paths. Captures heavy feature abstractions for precise medical image segmentation.',
    preview: <UNetPreview />,
    btnBg: '#2cf100', btnText: '#0e6800',
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.35 + i * 0.1, ease: 'easeOut' as const } }),
}

export default function ArchitectureCards() {
  const navigate = useNavigate()
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#e5e2e1', marginBottom: 4 }}>Presets &amp; Tutorials Library</h2>
          <p style={{ color: '#bac9cc', fontSize: 14 }}>Accelerate your workflow with pre-built production-ready architectures.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['filter_list', 'grid_view'].map(icon => (
            <motion.button key={icon} whileHover={{ background: '#353534' }} whileTap={{ scale: 0.95 }}
              style={{ padding: 8, border: '1px solid #3b494c', borderRadius: 4, background: 'transparent', cursor: 'pointer', display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#e5e2e1' }}>{icon}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {CARDS.map((card, i) => (
          <motion.div
            key={card.id}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ borderColor: card.accentColor + '80', y: -2 }}
            style={{ background: 'rgba(32,31,31,0.6)', backdropFilter: 'blur(20px)', border: '1px solid #3b494c', borderRadius: 4, display: 'flex', flexDirection: 'column' }}
          >
            {/* Preview */}
            <div style={{ height: 192, background: 'rgba(14,14,14,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, borderBottom: '1px solid #3b494c', position: 'relative', overflow: 'hidden' }}>
              {card.preview}
            </div>

            {/* Body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {card.tags.map(tag => (
                  <span key={tag.label} style={{ padding: '2px 8px', background: tag.color + '1a', color: tag.color, border: `1px solid ${tag.color}33`, borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {tag.label}
                  </span>
                ))}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#e5e2e1', marginBottom: 8 }}>{card.title}</h3>
              <p style={{ color: '#bac9cc', fontSize: 12, lineHeight: 1.6, flex: 1, marginBottom: 24 }}>{card.description}</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <motion.button whileHover={{ textDecoration: 'underline' }}
                  style={{ background: 'none', border: 'none', color: card.accentColor, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
                  Details
                </motion.button>
                <motion.button
                  onClick={() => navigate('/canvas', { state: { model: card.id } })}
                  whileHover={{ filter: 'brightness(1.1)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{ background: card.btnBg, color: card.btnText, padding: '8px 16px', borderRadius: 4, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
                  Open in Canvas
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
