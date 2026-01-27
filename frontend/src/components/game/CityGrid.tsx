/**
 * CityGrid Component
 * Renders a 13x13 isometric-style grid for building placement
 * With drag-to-rotate camera controls
 */

'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { IsometricBuilding } from '../landing/IsometricBuilding'
import { Building } from '@/hooks/useCityBuildings'
import { GRID_SIZE } from '@/lib/constants'

interface CityGridProps {
  buildings: Building[]
  selectedCoords: { x: number; y: number } | null
  onSelectTile: (x: number, y: number) => void
  isLoading?: boolean
}

export function CityGrid({ buildings, selectedCoords, onSelectTile, isLoading }: CityGridProps) {
  const centerCoord = Math.ceil(GRID_SIZE / 2)
  
  // Camera rotation state
  const [rotateX, setRotateX] = useState(60)
  const [rotateZ, setRotateZ] = useState(45)
  const [isDragging, setIsDragging] = useState(false)
  const lastMousePos = useRef({ x: 0, y: 0 })
  
  // Create a map for quick building lookup
  const buildingMap = useMemo(() => {
    console.log(`[Grid] Recalculating buildingMap for ${buildings.length} buildings`, buildings)
    const map = new Map<string, Building>()
    buildings.forEach(b => {
      map.set(`${b.x},${b.y}`, b)
    })
    return map
  }, [buildings])

  // Mouse handlers for camera rotation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Start drag on left click
    if (e.button === 0) {
      e.preventDefault()
      setIsDragging(true)
      lastMousePos.current = { x: e.clientX, y: e.clientY }
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    
    const deltaX = e.clientX - lastMousePos.current.x
    const deltaY = e.clientY - lastMousePos.current.y
    
    // Update rotation based on mouse movement
    setRotateZ(prev => prev + deltaX * 0.3)
    setRotateX(prev => Math.max(20, Math.min(80, prev - deltaY * 0.3)))
    
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Reset camera
  const resetCamera = useCallback(() => {
    setRotateX(60)
    setRotateZ(45)
  }, [])

  // Helper to determine tile style
  const getTileStyle = (x: number, y: number) => {
    const isSelected = selectedCoords?.x === x && selectedCoords?.y === y
    const hasBuilding = buildingMap.has(`${x},${y}`)
    const isTownHallPos = x === centerCoord && y === centerCoord
    
    if (isSelected) return 'bg-blue-500/40 border-blue-400 shadow-lg shadow-blue-500/30'
    if (isTownHallPos) return 'bg-amber-900/30 border-amber-600/50'
    if (hasBuilding) return 'bg-emerald-900/40 border-emerald-600/60'
    
    return 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-500'
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Camera Controls */}
      <div className="absolute top-2 left-2 z-40 flex gap-2">
        <button 
          onClick={resetCamera}
          className="px-2 py-1 bg-slate-800 border border-slate-600 text-slate-400 text-[8px] hover:bg-slate-700 hover:text-white transition-colors"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          RESET
        </button>
        <span className="px-2 py-1 bg-slate-900/80 border border-slate-700 text-slate-500 text-[6px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          DRAG TO ROTATE
        </span>
      </div>

      {/* Isometric container with proper perspective */}
      <div 
        className={`relative overflow-visible py-20 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ 
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* 3D transformed grid */}
        <motion.div 
          className="mx-auto"
          animate={{
            rotateX: rotateX,
            rotateZ: rotateZ,
          }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          style={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, 48px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 48px)`,
            gap: '2px',
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center',
            width: 'fit-content',
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = (i % GRID_SIZE) + 1
            const y = Math.floor(i / GRID_SIZE) + 1
            const building = buildingMap.get(`${x},${y}`)
            const isSelected = selectedCoords?.x === x && selectedCoords?.y === y
            
            return (
              <motion.div
                key={`${x}-${y}`}
                onClick={() => !isDragging && onSelectTile(x, y)}
                className={`relative border-2 cursor-pointer transition-all duration-200 ${getTileStyle(x, y)}`}
                style={{ 
                  width: '48px', 
                  height: '48px',
                  transformStyle: 'preserve-3d',
                }}
                whileHover={{ 
                  scale: building ? 1 : 1.05,
                  boxShadow: building ? 'none' : '0 0 20px rgba(59, 130, 246, 0.5)',
                }}
                whileTap={{ scale: building ? 1 : 0.95 }}
              >
                {/* Building Rendering - Counter-rotate to stand upright */}
                {building && (
                  <div 
                    className="absolute flex items-end justify-center pointer-events-none"
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: `rotateZ(${-rotateZ}deg) rotateX(${-rotateX}deg)`,
                      transformOrigin: 'center center',
                      bottom: '0',
                    }}
                  >
                    <div style={{ transform: `scaleY(${0.8 + Math.log10(Math.max(building.amountUSD, 1) + 1) * 0.4})`, transformOrigin: 'bottom center' }}>
                      <IsometricBuilding 
                        type={building.type.toLowerCase() as any} 
                        size="sm" 
                        level={building.level}
                        floatSpeed={3}
                        asset={building.asset}
                      />
                    </div>
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && !building && (
                  <motion.div 
                    className="absolute inset-0 border-2 border-blue-400 bg-blue-500/20 flex items-center justify-center"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  </motion.div>
                )}
                
                {/* Town Hall Preview (if not built yet but this is the center) */}
                {x === centerCoord && y === centerCoord && !building && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <span 
                      className="text-[8px] text-amber-500 font-bold" 
                      style={{ transform: `rotateZ(${-rotateZ}deg) rotateX(${-rotateX}deg)` }}
                    >
                      CORE
                    </span>
                  </div>
                )}

                {/* Coordinate Label (Selected tile only) */}
                {isSelected && (
                  <div 
                    className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[8px] text-white whitespace-nowrap z-50 pointer-events-none"
                    style={{ transform: `rotateZ(${-rotateZ}deg) rotateX(${-rotateX}deg)` }}
                  >
                    {x}, {y}
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      </div>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-3 h-3 bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            <p className="text-amber-400 text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              SYNCING GRID...
            </p>
          </div>
        </div>
      )}


    </div>
  )
}
