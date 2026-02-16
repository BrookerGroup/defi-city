'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

// Deterministic "random" to avoid hydration mismatch (server vs client)
function seeded(i: number, seed: number) {
  return ((i * 7 + seed * 11) % 100) / 100
}

export function PixelBackground() {
  const fireflies = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: seeded(i, 1) * 100,
        y: seeded(i, 2) * 100,
        size: seeded(i, 3) > 0.8 ? 3 : 2,
        delay: seeded(i, 4) * 4,
        duration: 2.5 + seeded(i, 5) * 2,
        color: ['#BEF264', '#86EFAC', '#FDE047'][Math.floor(seeded(i, 6) * 3) % 3],
      })),
    []
  )

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Cartoon forest sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #6BA3D0 0%, #8BC78B 40%, #3D6B4A 75%, #1E3D29 100%)'
        }}
      />

      {/* Soft clouds (cartoon style) */}
      <div className="absolute top-[8%] left-[5%] w-32 h-16 rounded-full opacity-60"
        style={{ backgroundColor: '#E8F5E9', filter: 'blur(8px)' }} />
      <div className="absolute top-[12%] right-[10%] w-40 h-20 rounded-full opacity-50"
        style={{ backgroundColor: '#C8E6C9', filter: 'blur(10px)' }} />
      <div className="absolute top-[6%] left-[40%] w-28 h-14 rounded-full opacity-55"
        style={{ backgroundColor: '#E8F5E9', filter: 'blur(6px)' }} />

      {/* Cartoon tree silhouettes - back layer */}
      <div className="absolute bottom-0 left-0 w-full h-[55%] flex items-end justify-between px-0 pointer-events-none">
        {/* Left trees */}
        <div className="w-24 h-48" style={{
          background: 'linear-gradient(180deg, transparent 30%, #1B4332 30%, #1B4332 100%)',
          clipPath: 'polygon(40% 100%, 50% 20%, 60% 100%, 50% 70%, 45% 50%, 55% 50%)',
          opacity: 0.7
        }} />
        <div className="w-20 h-40 -ml-8" style={{
          background: 'linear-gradient(180deg, transparent 25%, #2D6A4F 25%, #2D6A4F 100%)',
          clipPath: 'polygon(40% 100%, 50% 25%, 60% 100%)',
          opacity: 0.65
        }} />
        <div className="w-28 h-52 -ml-4" style={{
          background: 'linear-gradient(180deg, transparent 35%, #1B4332 35%, #1B4332 100%)',
          clipPath: 'polygon(35% 100%, 50% 15%, 65% 100%, 50% 65%)',
          opacity: 0.75
        }} />
        {/* Right trees */}
        <div className="w-[88px] h-44 -mr-6" style={{
          background: 'linear-gradient(180deg, transparent 28%, #2D6A4F 28%, #2D6A4F 100%)',
          clipPath: 'polygon(38% 100%, 50% 22%, 62% 100%)',
          opacity: 0.68
        }} />
        <div className="w-[104px] h-[200px]" style={{
          background: 'linear-gradient(180deg, transparent 32%, #1B4332 32%, #1B4332 100%)',
          clipPath: 'polygon(40% 100%, 50% 18%, 60% 100%, 48% 60%)',
          opacity: 0.72
        }} />
        <div className="w-18 h-36 -mr-4" style={{
          background: 'linear-gradient(180deg, transparent 30%, #2D6A4F 30%, #2D6A4F 100%)',
          clipPath: 'polygon(42% 100%, 50% 30%, 58% 100%)',
          opacity: 0.6
        }} />
      </div>

      {/* Cartoon tree silhouettes - front layer (darker) */}
      <div className="absolute bottom-0 left-0 w-full h-[45%] flex items-end justify-around px-8 pointer-events-none">
        <div className="w-32 h-56" style={{
          background: 'linear-gradient(180deg, transparent 40%, #134E2E 40%, #134E2E 100%)',
          clipPath: 'polygon(35% 100%, 50% 10%, 65% 100%, 48% 55%, 45% 35%, 55% 35%)',
          opacity: 0.85
        }} />
        <div className="w-24 h-44 -mx-4" style={{
          background: 'linear-gradient(180deg, transparent 35%, #1B4332 35%, #1B4332 100%)',
          clipPath: 'polygon(40% 100%, 50% 20%, 60% 100%)',
          opacity: 0.8
        }} />
        <div className="w-36 h-60" style={{
          background: 'linear-gradient(180deg, transparent 38%, #134E2E 38%, #134E2E 100%)',
          clipPath: 'polygon(38% 100%, 50% 8%, 62% 100%, 52% 50%, 48% 30%)',
          opacity: 0.88
        }} />
        <div className="w-28 h-48 -mx-2" style={{
          background: 'linear-gradient(180deg, transparent 35%, #1B4332 35%, #1B4332 100%)',
          clipPath: 'polygon(42% 100%, 50% 22%, 58% 100%)',
          opacity: 0.82
        }} />
        <div className="w-[120px] h-52" style={{
          background: 'linear-gradient(180deg, transparent 42%, #134E2E 42%, #134E2E 100%)',
          clipPath: 'polygon(36% 100%, 50% 12%, 64% 100%, 50% 58%)',
          opacity: 0.86
        }} />
      </div>

      {/* Forest floor / grass strip */}
      <div
        className="absolute bottom-0 left-0 w-full h-24"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(26, 66, 46, 0.95))'
        }}
      />

      {/* Animated fireflies */}
      {fireflies.map((f) => (
        <motion.div
          key={f.id}
          className="absolute rounded-full"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: f.size * 4,
            height: f.size * 4,
            backgroundColor: f.color,
            boxShadow: `0 0 ${f.size * 6}px ${f.color}`,
            imageRendering: 'pixelated'
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.3, 1],
            x: [0, 20, -15, 0],
            y: [0, -25, 10, 0]
          }}
          transition={{
            duration: f.duration,
            repeat: Infinity,
            delay: f.delay,
            ease: 'easeInOut'
          }}
        />
      ))}

      {/* Subtle vignette for content readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, rgba(0,0,0,0.15) 100%)'
        }}
      />

      {/* Subtle pixel overlay for game feel */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          imageRendering: 'pixelated'
        }}
      />
    </div>
  )
}
