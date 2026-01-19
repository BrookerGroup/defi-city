'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

export function PixelBackground() {
  const stars = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.7 ? 2 : 1,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
      color: ['#F59E0B', '#10B981', '#06B6D4', '#A855F7'][Math.floor(Math.random() * 4)]
    })),
    []
  )

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />

      {/* Pixel grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148, 163, 184, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          imageRendering: 'pixelated'
        }}
      />

      {/* Animated pixel stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size * 4,
            height: star.size * 4,
            backgroundColor: star.color,
            imageRendering: 'pixelated'
          }}
          animate={{
            opacity: [0.2, 0.9, 0.2],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut'
          }}
        />
      ))}

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/50" />

      {/* Subtle scanline effect */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
          imageRendering: 'pixelated'
        }}
      />
    </div>
  )
}
