'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

/**
 * Animated forest background for the game page.
 * Cartoon style with fireflies, clouds, and tree silhouettes.
 */
export function GameBackground() {
  const fireflies = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() > 0.75 ? 3 : 2,
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 2.5,
        color: ['#BEF264', '#86EFAC', '#FDE047', '#FBBF24'][
          Math.floor(Math.random() * 4)
        ],
      })),
    []
  )

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Forest sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #5A8FC7 0%, #7AB87A 35%, #3D6B4A 70%, #1A3D26 100%)',
        }}
      />

      {/* Animated clouds - gentle drift */}
      <motion.div
        className="absolute top-[10%] left-[5%] w-36 h-20 rounded-full opacity-50"
        style={{ backgroundColor: '#C8E6C9', filter: 'blur(10px)' }}
        animate={{ x: [0, 30, 0], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[6%] right-[15%] w-44 h-22 rounded-full opacity-45"
        style={{ backgroundColor: '#E8F5E9', filter: 'blur(12px)' }}
        animate={{ x: [0, -25, 0], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[12%] left-[45%] w-28 h-14 rounded-full opacity-40"
        style={{ backgroundColor: '#B8E6B8', filter: 'blur(8px)' }}
        animate={{ x: [0, 15, -10, 0], y: [0, -5, 5, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Tree silhouettes - back layer (lighter) */}
      <div className="absolute bottom-0 left-0 w-full h-[50%] flex items-end justify-between px-4 opacity-60">
        <div
          className="w-20 h-40"
          style={{
            background:
              'linear-gradient(180deg, transparent 35%, #1B4332 35%, #1B4332 100%)',
            clipPath: 'polygon(40% 100%, 50% 25%, 60% 100%)',
          }}
        />
        <div
          className="w-24 h-44 -ml-4"
          style={{
            background:
              'linear-gradient(180deg, transparent 30%, #2D6A4F 30%, #2D6A4F 100%)',
            clipPath: 'polygon(38% 100%, 50% 15%, 62% 100%)',
          }}
        />
        <div
          className="w-20 h-38"
          style={{
            background:
              'linear-gradient(180deg, transparent 32%, #1B4332 32%, #1B4332 100%)',
            clipPath: 'polygon(42% 100%, 50% 28%, 58% 100%)',
          }}
        />
        <div
          className="w-24 h-46"
          style={{
            background:
              'linear-gradient(180deg, transparent 28%, #2D6A4F 28%, #2D6A4F 100%)',
            clipPath: 'polygon(40% 100%, 50% 20%, 60% 100%)',
          }}
        />
      </div>

      {/* Tree silhouettes - front layer */}
      <div className="absolute bottom-0 left-0 w-full h-[40%] flex items-end justify-around px-12 opacity-70">
        <div
          className="w-28 h-52"
          style={{
            background:
              'linear-gradient(180deg, transparent 40%, #134E2E 40%, #134E2E 100%)',
            clipPath: 'polygon(38% 100%, 50% 12%, 62% 100%)',
          }}
        />
        <div
          className="w-22 h-44"
          style={{
            background:
              'linear-gradient(180deg, transparent 38%, #1B4332 38%, #1B4332 100%)',
            clipPath: 'polygon(40% 100%, 50% 22%, 60% 100%)',
          }}
        />
        <div
          className="w-32 h-56"
          style={{
            background:
              'linear-gradient(180deg, transparent 42%, #134E2E 42%, #134E2E 100%)',
            clipPath: 'polygon(36% 100%, 50% 10%, 64% 100%)',
          }}
        />
        <div
          className="w-26 h-48"
          style={{
            background:
              'linear-gradient(180deg, transparent 36%, #1B4332 36%, #1B4332 100%)',
            clipPath: 'polygon(42% 100%, 50% 18%, 58% 100%)',
          }}
        />
      </div>

      {/* Forest floor gradient */}
      <div
        className="absolute bottom-0 left-0 w-full h-20"
        style={{
          background:
            'linear-gradient(180deg, transparent, rgba(20, 52, 38, 0.9))',
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
            boxShadow: `0 0 ${f.size * 8}px ${f.color}`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.4, 1],
            x: [0, 25, -20, 0],
            y: [0, -30, 15, 0],
          }}
          transition={{
            duration: f.duration,
            repeat: Infinity,
            delay: f.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Subtle pixel grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  )
}
