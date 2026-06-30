import { useState } from 'react'
import { motion } from 'framer-motion'

type CodeLine = { num: number; indent: number; highlighted?: boolean; content: React.ReactNode }

const LINES: CodeLine[] = [
  { num: 1, indent: 0, content: <><span style={{ color: '#ecb2ff' }}>import</span>{' '}torch.nn{' '}<span style={{ color: '#ecb2ff' }}>as</span>{' '}nn</> },
  { num: 2, indent: 0, content: '' },
  { num: 3, indent: 0, content: <><span style={{ color: '#ecb2ff' }}>class</span>{' '}<span style={{ color: '#baffa2' }}>NeuroNet</span>(nn.Module):</> },
  { num: 4, indent: 1, content: <><span style={{ color: '#ecb2ff' }}>def</span>{' '}<span style={{ color: '#baffa2' }}>__init__</span>(self):</> },
  { num: 5, indent: 2, content: 'super().__init__()' },
  { num: 6, indent: 2, highlighted: true, content: <>self.fc1 = nn.<span style={{ color: '#baffa2' }}>Linear</span>(<span style={{ color: '#00daf3' }}>512</span>, <span style={{ color: '#00daf3' }}>256</span>)</> },
  { num: 7, indent: 2, content: <>self.relu = nn.<span style={{ color: '#baffa2' }}>ReLU</span>()</> },
  { num: 8, indent: 2, content: <>self.drop = nn.<span style={{ color: '#baffa2' }}>Dropout</span>(p=<span style={{ color: '#00daf3' }}>0.5</span>)</> },
]

interface Props { floating?: boolean }

export default function CodeDrawer({ floating }: Props) {
  const [activeTab, setActiveTab] = useState('model_architecture.py')

  return (
    <motion.footer
      initial={{ y: 260, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut', delay: 0.2 }}
      style={{
        ...(floating
          ? { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 48px)', maxWidth: 1152, zIndex: 50, borderRadius: 12, border: '1px solid #3b494c', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }
          : { borderTop: '1px solid #3b494c', flexShrink: 0 }),
        height: 256,
        background: '#0d0d0d',
        backdropFilter: 'blur(24px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 40, background: '#1c1b1b', borderBottom: '1px solid rgba(59,73,76,0.3)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {(['model_architecture.py', 'Console'] as const).map(tab => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', height: '100%', fontFamily: 'JetBrains Mono', fontSize: 12, cursor: 'pointer', color: activeTab === tab ? '#00daf3' : '#bac9cc', borderBottom: activeTab === tab ? '1px solid #00daf3' : '1px solid transparent', background: activeTab === tab ? 'rgba(0,218,243,0.05)' : 'transparent' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{tab === 'Console' ? 'terminal' : 'code'}</span>
              {tab}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['file_download', 'close'].map(icon => (
            <motion.span key={icon} whileHover={{ color: '#e5e2e1' }}
              className="material-symbols-outlined" style={{ color: '#bac9cc', fontSize: 18, cursor: 'pointer' }}>
              {icon}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Code */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono', fontSize: 13 }}>
          <tbody>
            {LINES.map(line => (
              <tr key={line.num} style={{ background: line.highlighted ? 'rgba(0,218,243,0.08)' : 'transparent', boxShadow: line.highlighted ? '0 0 15px rgba(0,218,243,0.12)' : undefined }}>
                <td style={{ width: 48, textAlign: 'right', paddingRight: 24, color: line.highlighted ? '#00daf3' : 'rgba(59,73,76,0.6)', borderRight: `1px solid ${line.highlighted ? 'rgba(0,218,243,0.35)' : 'rgba(59,73,76,0.2)'}`, userSelect: 'none', lineHeight: '1.8' }}>
                  {String(line.num).padStart(2, '0')}
                </td>
                <td style={{ paddingLeft: `${24 + line.indent * 16}px`, color: '#e5e2e1', lineHeight: '1.8' }}>
                  {line.content}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.footer>
  )
}
