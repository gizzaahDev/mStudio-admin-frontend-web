import type { PointerEffect } from './backend-api'

export function addPointerParticle(effect: PointerEffect, event: PointerEvent, colors: string[]) {
  if (effect === 'none') return
  const particle = document.createElement('span')
  const color = colors[Math.floor(Math.random() * colors.length)] || '#60a5fa'
  const second = colors[Math.floor(Math.random() * colors.length)] || color
  const size = effect === 'glow' ? 54 + Math.random() * 48 : effect === 'comet' ? 30 + Math.random() * 24 : 10 + Math.random() * 24
  particle.className = 'portal-pointer-effect pointer-' + effect
  particle.style.left = event.clientX + 'px'
  particle.style.top = event.clientY + 'px'
  particle.style.width = size + 'px'
  particle.style.height = size + 'px'
  particle.style.setProperty('--pointer-color', color)
  particle.style.setProperty('--pointer-color-two', second)
  if (effect === 'stars') particle.textContent = '✦'
  document.body.appendChild(particle)
  window.setTimeout(() => particle.remove(), 1100)
}
