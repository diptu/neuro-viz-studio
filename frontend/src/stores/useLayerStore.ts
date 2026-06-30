import { create } from 'zustand'
import { Layer, DEFAULT_LAYERS } from '../types/layer'

interface LayerState {
  layers: Layer[]
  selectLayer: (id: string) => void
  deleteLayer: (id: string) => void
}

export const useLayerStore = create<LayerState>((set) => ({
  layers: DEFAULT_LAYERS,

  selectLayer: (id) =>
    set((s) => ({
      layers: s.layers.map((l) => ({
        ...l,
        status: l.status === 'error' ? 'error' : l.id === id ? 'selected' : 'normal',
      })),
    })),

  deleteLayer: (id) =>
    set((s) => ({
      layers: s.layers
        .filter((l) => l.id !== id)
        .map((l, i) => ({ ...l, index: i + 1 })),
    })),
}))
