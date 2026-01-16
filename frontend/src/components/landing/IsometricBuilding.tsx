'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

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
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-36 h-36'
  }

  const buildingStyles = {
    townhall: {
      roof: '#FFD700',
      wall: '#DBA514',
      door: '#8B4513',
      window: '#87CEEB',
      shadow: '#4A3F35',
      icon: '🏛️'
    },
    bank: {
      roof: '#2E8B57',
      wall: '#3CB371',
      door: '#1C5D39',
      window: '#90EE90',
      shadow: '#1F4D2F',
      icon: '🏦'
    },
    shop: {
      roof: '#4682B4',
      wall: '#5F9EA0',
      door: '#2F5F7F',
      window: '#87CEEB',
      shadow: '#2C3E50',
      icon: '🏪'
    },
    lottery: {
      roof: '#9370DB',
      wall: '#BA55D3',
      door: '#663399',
      window: '#DDA0DD',
      shadow: '#4B0082',
      icon: '🎰'
    }
  }

  const style = buildingStyles[type]

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} cursor-pointer group pixel-art`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: 1
      }}
      transition={{
        duration: 0.5,
        delay,
        ease: "backOut"
      }}
    >
      {/* Gentle bounce animation */}
      <motion.div
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: floatSpeed,
          repeat: Infinity,
          ease: "easeInOut",
          delay: randomFloat
        }}
        className="relative w-full h-full"
      >
        {/* Pixel art building - Top-down 2D style like Gather Town */}
        <div className="absolute inset-0 flex flex-col items-center justify-end">

          {/* Roof - Triangle */}
          <div className="relative w-full h-1/3 flex justify-center">
            <div
              className="w-0 h-0 border-l-[40px] border-r-[40px] border-b-[30px] border-l-transparent border-r-transparent"
              style={{
                borderBottomColor: style.roof,
                filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.3))'
              }}
            />
          </div>

          {/* Building body - Rectangular with pixel edges */}
          <div
            className="relative w-4/5 h-2/3 rounded-sm"
            style={{
              backgroundColor: style.wall,
              border: `2px solid ${style.shadow}`,
              boxShadow: `4px 4px 0px ${style.shadow}`
            }}
          >
            {/* Door */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/4 h-2/5 rounded-t-sm"
              style={{ backgroundColor: style.door }}
            />

            {/* Windows */}
            <div className="absolute top-2 left-2 right-2 grid grid-cols-2 gap-2">
              {[...Array(2)].map((_, i) => (
                <motion.div
                  key={i}
                  className="aspect-square rounded-sm"
                  style={{ backgroundColor: style.window }}
                  animate={{
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.5
                  }}
                />
              ))}
            </div>

            {/* Pixel detail lines */}
            <div
              className="absolute left-0 top-1/4 w-full h-px"
              style={{ backgroundColor: style.shadow, opacity: 0.3 }}
            />
            <div
              className="absolute left-0 top-1/2 w-full h-px"
              style={{ backgroundColor: style.shadow, opacity: 0.3 }}
            />
          </div>

          {/* Icon above building */}
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl filter drop-shadow-md"
            animate={{
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {style.icon}
          </motion.div>

          {/* Sparkle effect on hover */}
          <motion.div
            className="absolute -inset-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${style.window}40 0%, transparent 70%)`
            }}
          />
        </div>
      </motion.div>

      {/* Pixel shadow */}
      <motion.div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4/5 h-2 rounded-full"
        style={{
          backgroundColor: '#00000040',
          filter: 'blur(4px)'
        }}
        animate={{
          scale: [1, 0.95, 1],
          opacity: [0.3, 0.4, 0.3],
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
