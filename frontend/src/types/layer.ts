export type LayerStatus = 'normal' | 'selected' | 'error'

export interface Layer {
  id: string
  index: number
  name: string
  category: string
  color: string
  hoverColor: string
  status: LayerStatus
  error?: string
}

export const DEFAULT_LAYERS: Layer[] = [
  { id: 'l1', index: 1, name: 'Linear',  category: 'Fully Connected', color: '#00daf3', hoverColor: '#c3f5ff', status: 'normal' },
  { id: 'l2', index: 2, name: 'ReLU',    category: 'Activation',      color: '#baffa2', hoverColor: '#baffa2', status: 'normal' },
  { id: 'l3', index: 3, name: 'Conv2D',  category: 'Spatial Op',      color: '#ffb4ab', hoverColor: '#ffb4ab', status: 'error',
    error: 'Dimension Mismatch: Expected 4D tensor, received 3D tensor. Check input channel alignment.' },
  { id: 'l4', index: 4, name: 'Dropout', category: 'Regularization',  color: '#ecb2ff', hoverColor: '#ecb2ff', status: 'normal' },
  { id: 'l5', index: 5, name: 'Linear',  category: 'Fully Connected', color: '#00daf3', hoverColor: '#00daf3', status: 'selected' },
]
