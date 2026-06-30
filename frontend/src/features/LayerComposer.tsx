import { AnimatePresence } from 'framer-motion'
import { useLayerStore } from '../stores/useLayerStore'
import ComposerNav from '../components/ComposerNav'
import LibraryPanel from '../components/composer/LibraryPanel'
import LayerCard from '../components/composer/LayerCard'
import LayerInspector from '../components/composer/LayerInspector'
import CodeDrawer from '../components/composer/CodeDrawer'

export default function LayerComposer() {
  const layers = useLayerStore(s => s.layers)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#131313', backgroundImage: 'linear-gradient(rgba(132,147,150,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(132,147,150,0.07) 1px,transparent 1px)', backgroundSize: '32px 32px' }}>
      <ComposerNav />

      {/* Body: sidebar + main + inspector */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', marginTop: 64 }}>
        <LibraryPanel />

        <main className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: 672 }}>
            <AnimatePresence>
              {layers.map((layer, i) => (
                <div key={layer.id}>
                  <LayerCard layer={layer} index={i} />
                  {i < layers.length - 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', height: 24 }}>
                      <div style={{ width: 1, background: '#3b494c' }} />
                    </div>
                  )}
                </div>
              ))}
            </AnimatePresence>
          </div>
        </main>

        <LayerInspector />
      </div>

      <CodeDrawer />
    </div>
  )
}
