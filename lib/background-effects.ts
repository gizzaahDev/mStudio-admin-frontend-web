import type { BackgroundEffect } from './backend-api'

export const DEFAULT_BACKGROUND_EFFECT: BackgroundEffect = 'rectangle-mesh'

const effectAliases: Record<string, BackgroundEffect> = {
  none: 'none',
  'rectangle-mesh': 'rectangle-mesh',
  'grid-glow': 'rectangle-mesh',
  'hex-lattice': 'hex-lattice',
  'hex-grid': 'hex-lattice',
  blueprint: 'blueprint',
  'circuit-board': 'circuit-board',
  circuit: 'circuit-board',
  'radial-rings': 'radial-rings',
  aurora: 'aurora',
  spotlight: 'aurora',
  mesh: 'aurora',
  'corner-glow': 'aurora',
  waves: 'waves',
  starfield: 'starfield',
  stars: 'starfield',
  dots: 'starfield',
  'digital-noise': 'starfield',
  'diagonal-stripes': 'diagonal-stripes',
  diagonal: 'diagonal-stripes',
  'gradient-stripes': 'diagonal-stripes',
  'neon-lines': 'diagonal-stripes',
  'matrix-rain': 'circuit-board',
  checkerboard: 'blueprint',
  'soft-orbs': 'soft-orbs',
  'classic-mood': 'soft-orbs',
}

export function normalizeBackgroundEffect(value: unknown): BackgroundEffect {
  if (typeof value !== 'string') return DEFAULT_BACKGROUND_EFFECT
  return effectAliases[value.trim().toLowerCase()] || DEFAULT_BACKGROUND_EFFECT
}
