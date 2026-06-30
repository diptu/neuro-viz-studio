import { motion } from 'framer-motion'

const PROGRESS = 0.75
const R = 28
const CIRCUMFERENCE = 2 * Math.PI * R

export default function ProgressHeader() {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(14,14,14,0.4)', backdropFilter: 'blur(20px)',
          border: '1px solid #3b494c', borderRadius: 4, padding: 24, position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.02em', color: '#9cf0ff', lineHeight: 1.1, marginBottom: 8 }}>
            Architectural<br />Masterclass
          </h1>
          <p style={{ color: '#bac9cc', fontSize: 14, maxWidth: 480, lineHeight: 1.6 }}>
            Master complex deep learning structures through hands-on visualization. Drag, drop, and inspect the mathematics behind state-of-the-art models.
          </p>
        </div>

        {/* Progress ring */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ background: '#131313', padding: '16px 24px', border: '1px solid #3b494c', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flexShrink: 0 }}
        >
          <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 8 }}>
            <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="32" cy="32" r={R} fill="none" stroke="#3b494c" strokeWidth="4" />
              <motion.circle
                cx="32" cy="32" r={R} fill="none"
                stroke="#79ff5b" strokeWidth="4"
                strokeDasharray={CIRCUMFERENCE}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - PROGRESS) }}
                transition={{ duration: 1.2, delay: 0.7, ease: 'easeOut' }}
              />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono', fontSize: 12, color: '#79ff5b', fontWeight: 500 }}>
              75%
            </span>
          </div>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bac9cc', fontWeight: 700 }}>Your Progress</span>
        </motion.div>
      </motion.div>

      {/* Next Lesson card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{ background: 'rgba(14,14,14,0.4)', backdropFilter: 'blur(20px)', border: '1px solid #3b494c', borderRadius: 4, padding: 24, display: 'flex', flexDirection: 'column' }}
      >
        <h3 style={{ fontWeight: 700, fontSize: 14, color: '#e5e2e1', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: '#c3f5ff', fontSize: 18 }}>star</span>
          Next Lesson
        </h3>
        <motion.div
          whileHover={{ borderColor: '#9cf0ff' }}
          style={{ padding: 16, background: '#201f1f', border: '1px solid #3b494c', borderRadius: 4, flex: 1, cursor: 'pointer' }}
        >
          <p style={{ fontSize: 10, color: '#c3f5ff', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', marginBottom: 4 }}>Advanced Optimization</p>
          <h4 style={{ fontSize: 18, fontWeight: 700, color: '#e5e2e1', marginBottom: 8 }}>Momentum &amp; Adamax</h4>
          <p style={{ color: '#bac9cc', fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>Understanding the stochastic landscape and how adaptive learning rates navigate local minima.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#bac9cc' }}>15 min duration</span>
            <motion.span whileHover={{ x: 4 }} className="material-symbols-outlined" style={{ color: '#c3f5ff' }}>arrow_forward</motion.span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
