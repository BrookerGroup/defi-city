'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface IsometricBuildingProps {
  type: 'townhall' | 'bank' | 'shop' | 'lottery'
  size?: 'sm' | 'md' | 'lg'
  delay?: number
  floatSpeed?: number
}

export function IsometricBuilding({
  type,
  size = 'md',
  delay = 0,
  floatSpeed = 3
}: IsometricBuildingProps) {
  const [randomFloat] = useState(() => Math.random() * 10)

  const sizeClasses = {
    sm: 'w-16 h-20',
    md: 'w-24 h-32',
    lg: 'w-32 h-40'
  }

  const buildingStyles = {
    townhall: {
      primary: 'from-amber-400 to-amber-600',
      secondary: 'from-amber-500 to-amber-700',
      accent: 'from-yellow-300 to-yellow-500',
      glow: 'shadow-amber-500/50',
      icon: '🏛️'
    },
    bank: {
      primary: 'from-emerald-400 to-emerald-600',
      secondary: 'from-emerald-500 to-emerald-700',
      accent: 'from-green-300 to-green-500',
      glow: 'shadow-emerald-500/50',
      icon: '🏦'
    },
    shop: {
      primary: 'from-cyan-400 to-cyan-600',
      secondary: 'from-cyan-500 to-cyan-700',
      accent: 'from-blue-300 to-blue-500',
      glow: 'shadow-cyan-500/50',
      icon: '🏪'
    },
    lottery: {
      primary: 'from-purple-400 to-purple-600',
      secondary: 'from-purple-500 to-purple-700',
      accent: 'from-pink-300 to-pink-500',
      glow: 'shadow-purple-500/50',
      icon: '🎰'
    }
  }

  const style = buildingStyles[type]

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} cursor-pointer group`}
      initial={{ opacity: 0, y: 50, rotateX: -20 }}
      animate={{
        opacity: 1,
        y: 0,
        rotateX: 0
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Floating animation */}
      <motion.div
        animate={{
          y: [0, -12, 0],
          rotateZ: [-1, 1, -1],
        }}
        transition={{
          duration: floatSpeed,
          repeat: Infinity,
          ease: "easeInOut",
          delay: randomFloat
        }}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Building structure - isometric view */}
        <div className="absolute inset-0" style={{
          transform: 'rotateX(60deg) rotateZ(-45deg)',
          transformStyle: 'preserve-3d'
        }}>
          {/* Main building face */}
          <div className={`absolute bottom-0 w-full h-3/4 bg-gradient-to-br ${style.primary}
            rounded-t-lg shadow-2xl ${style.glow} group-hover:scale-105 transition-transform`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Windows/details */}
            <div className="absolute inset-2 grid grid-cols-2 gap-1 p-1">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="bg-yellow-200/40 rounded-sm"
                  animate={{
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3
                  }}
                />
              ))}
            </div>
          </div>

          {/* Roof */}
          <div className={`absolute -top-2 w-full h-4 bg-gradient-to-br ${style.accent}
            rounded-t-xl shadow-lg transform -translate-z-2`}
            style={{ transform: 'translateZ(2px)' }}
          />

          {/* Side face */}
          <div className={`absolute right-0 bottom-0 w-2 h-3/4 bg-gradient-to-br ${style.secondary} opacity-70`}
            style={{ transform: 'translateX(100%) rotateY(90deg)', transformOrigin: 'left' }}
          />
        </div>

        {/* Floating icon above building */}
        <motion.div
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl drop-shadow-lg"
          animate={{
            y: [0, -4, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {style.icon}
        </motion.div>

        {/* Glow effect */}
        <motion.div
          className={`absolute -inset-4 bg-gradient-radial from-white/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </motion.div>

      {/* Shadow */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-black/20 rounded-full blur-md"
        animate={{
          scale: [1, 0.9, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: floatSpeed,
          repeat: Infinity,
          delay: randomFloat
        }}
      />
    </motion.div>
  )
}
