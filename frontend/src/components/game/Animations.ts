/**
 * Animations - Animation manager for PixiJS game objects
 * Handles: building pop-in, idle bob, selection glow pulse
 */

import { Container, Ticker } from 'pixi.js'

/** Pop-in animation: scale from 0 to 1 with elastic ease */
export function animatePopIn(target: Container, duration: number = 500) {
  const startTime = performance.now()
  target.scale.set(0)
  target.visible = true

  const ticker = Ticker.shared

  const onTick = () => {
    const elapsed = performance.now() - startTime
    const t = Math.min(elapsed / duration, 1)

    // Elastic ease-out
    const scale = elasticEaseOut(t)
    target.scale.set(scale)

    if (t >= 1) {
      target.scale.set(1)
      ticker.remove(onTick)
    }
  }

  ticker.add(onTick)
}

/** Idle bob animation: subtle y oscillation */
export function startIdleBob(
  target: Container,
  amplitude: number = 2,
  period: number = 3,
) {
  const baseY = target.y
  const ticker = Ticker.shared
  let time = Math.random() * period * 1000 // Random phase offset

  const onTick = () => {
    time += ticker.deltaMS
    target.y = baseY + Math.sin((time / 1000) * ((2 * Math.PI) / period)) * amplitude
  }

  ticker.add(onTick)

  // Return cleanup function
  return () => {
    ticker.remove(onTick)
    target.y = baseY
  }
}

/** Pulse alpha for selection glow */
export function startPulse(
  target: Container,
  minAlpha: number = 0.3,
  maxAlpha: number = 0.8,
  period: number = 1.5,
) {
  const ticker = Ticker.shared
  let time = 0

  const onTick = () => {
    time += ticker.deltaMS
    const t = (Math.sin((time / 1000) * ((2 * Math.PI) / period)) + 1) / 2
    target.alpha = minAlpha + t * (maxAlpha - minAlpha)
  }

  ticker.add(onTick)

  return () => {
    ticker.remove(onTick)
    target.alpha = 1
  }
}

// Elastic ease-out function
function elasticEaseOut(t: number): number {
  if (t === 0 || t === 1) return t
  const p = 0.3
  const s = p / 4
  return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1
}
